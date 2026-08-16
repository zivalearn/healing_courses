import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import ffmpeg from 'fluent-ffmpeg';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createR2Client, getR2Config, getR2Object } from '../../lib/r2';

export async function transcodeZivaVideoToHls(params: {
  courseId: string;
  lessonId: string;
  rawObjectKey?: string;
  fileBuffer?: Buffer;
  filePath?: string;
}): Promise<{
  ok: boolean;
  hlsManifestKey?: string;
  durationSeconds?: number;
  resolutions?: string[];
  error?: string;
}> {
  const { config, missingKeys } = getR2Config();
  if (!config) {
    return {
      ok: false,
      error: `R2 environment variables are missing on the server: ${missingKeys.join(', ')}`,
    };
  }

  const { courseId, lessonId, rawObjectKey } = params;

  if (!courseId || !lessonId) {
    return { ok: false, error: 'courseId and lessonId are required.' };
  }

  // Validate rawObjectKey starts with ziva/
  if (rawObjectKey && (!rawObjectKey.startsWith('ziva/') || rawObjectKey.includes('..'))) {
    return { ok: false, error: 'Access denied: rawObjectKey must reside within the ziva/ namespace.' };
  }

  const sanitizedCourseId = courseId.replace(/[^a-zA-Z0-9_-]/g, '');
  const sanitizedLessonId = lessonId.replace(/[^a-zA-Z0-9_-]/g, '');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ziva_hls_transcode_'));
  const inputPath = path.join(tempDir, 'input.mp4');
  const hlsOutputDir = path.join(tempDir, 'hls');
  fs.mkdirSync(hlsOutputDir, { recursive: true });

  try {
    const s3Client = createR2Client(config);

    // Prepare input file
    if (params.filePath && fs.existsSync(params.filePath)) {
      fs.copyFileSync(params.filePath, inputPath);
    } else if (params.fileBuffer) {
      fs.writeFileSync(inputPath, params.fileBuffer);
    } else if (rawObjectKey) {
      const getResult = await getR2Object(rawObjectKey);
      if (!getResult.stream) {
        throw new Error(`Failed to fetch raw video object from R2: ${getResult.error}`);
      }
      const writeStream = fs.createWriteStream(inputPath);
      await new Promise((resolve, reject) => {
        getResult.stream!.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
    } else {
      throw new Error('No input video source provided (fileBuffer, filePath, or rawObjectKey required)');
    }

    // Probe Video Duration
    let durationSeconds = 0;
    await new Promise<void>((resolve) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (!err && metadata?.format?.duration) {
          durationSeconds = Math.round(metadata.format.duration);
        }
        resolve();
      });
    });

    // Run FFmpeg HLS Transcoding (720p Adaptive HLS)
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-preset ultrafast',
          '-g 48',
          '-sc_threshold 0',
          '-map 0:v:0',
          '-map 0:a:0?',
          '-s:v:0 1280x720',
          '-c:v:0 libx264',
          '-b:v:0 2000k',
          '-master_pl_name master.m3u8',
          '-f hls',
          '-hls_time 4',
          '-hls_playlist_type vod',
          '-hls_segment_filename',
          path.join(hlsOutputDir, '720p_%03d.ts'),
        ])
        .output(path.join(hlsOutputDir, '720p.m3u8'))
        .on('end', () => resolve(true))
        .on('error', (err) => reject(err))
        .run();
    });

    // Upload generated HLS files to R2 under ziva/videos/hls/...
    const files = fs.readdirSync(hlsOutputDir);
    const zivaHlsPrefix = `ziva/videos/hls/courses/${sanitizedCourseId}/lessons/${sanitizedLessonId}`;

    for (const fileName of files) {
      const filePath = path.join(hlsOutputDir, fileName);
      if (fs.statSync(filePath).isFile()) {
        const fileContent = fs.readFileSync(filePath);
        const r2Key = `${zivaHlsPrefix}/${fileName}`;

        let contentType = 'application/octet-stream';
        if (fileName.endsWith('.m3u8')) contentType = 'application/x-mpegURL';
        if (fileName.endsWith('.ts')) contentType = 'video/MP2T';

        await s3Client.send(
          new PutObjectCommand({
            Bucket: config.bucketName,
            Key: r2Key,
            Body: fileContent,
            ContentType: contentType,
          })
        );
      }
    }

    const masterHlsKey = `${zivaHlsPrefix}/master.m3u8`;

    return {
      ok: true,
      hlsManifestKey: masterHlsKey,
      durationSeconds,
      resolutions: ['720p'],
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err.message || 'Ziva HLS transcoding failed',
    };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}
