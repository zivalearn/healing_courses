import React, { useState } from 'react';
import { Upload, Film, ShieldCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface R2VideoUploaderProps {
  courseId?: string;
  lessonId?: string;
  currentManifestKey?: string;
  onUploadSuccess: (info: { hlsManifestKey: string; storageProvider: 'cloudflare_r2'; durationSeconds?: number }) => void;
}

async function safeFetchJson(response: Response, contextLabel: string): Promise<any> {
  const contentType = response.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    const rawText = await response.text();
    if (rawText.trim().startsWith('<')) {
      // HTML response returned (e.g., standard proxy/gateway error or 404 page)
      throw new Error(`${contextLabel}: Server returned HTML (HTTP ${response.status}). Ensure the API server is reachable.`);
    }
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(`${contextLabel}: Invalid response format (HTTP ${response.status}).`);
    }
  }

  if (!response.ok) {
    throw new Error(data?.error || `${contextLabel} failed with HTTP status ${response.status}`);
  }

  return data;
}

export const R2VideoUploader: React.FC<R2VideoUploaderProps> = ({
  courseId = 'course_default',
  lessonId = 'lesson_default',
  currentManifestKey,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [step, setStep] = useState<'idle' | 'uploading' | 'transcoding' | 'done'>('idle');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleStartUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setStep('uploading');
    setUploadProgress(10);

    try {
      // Get authentication session token if present
      let authToken = '';
      try {
        const { data } = await supabase.auth.getSession();
        authToken = data.session?.access_token || '';
      } catch {
        // Fall back gracefully if session is absent
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      // Step 1: Get Presigned URL from native backend
      const presignRes = await fetch('/api/video/presign', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          courseId,
          lessonId,
          filename: file.name,
          mimeType: file.type || 'video/mp4',
        }),
      });

      const presignData = await safeFetchJson(presignRes, 'Generating upload URL');
      if (!presignData || !presignData.ok || !presignData.uploadUrl) {
        throw new Error(presignData?.error || 'Failed to generate R2 presigned upload URL.');
      }

      setUploadProgress(20);

      // Step 2: Upload raw video directly to Cloudflare R2 bucket with XHR progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presignData.uploadUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

        if (xhr.upload) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = 20 + Math.round((e.loaded / e.total) * 45); // 20% to 65%
              setUploadProgress(pct);
            }
          };
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Failed to upload video directly to R2 bucket (HTTP ${xhr.status}).`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error occurred during direct video upload to Cloudflare R2.'));
        };

        xhr.send(file);
      });

      setUploadProgress(70);
      setStep('transcoding');

      // Step 3: Call Server HLS Transcoding Pipeline
      const processRes = await fetch('/api/video/process-hls', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          courseId,
          lessonId,
          rawObjectKey: presignData.objectKey,
        }),
      });

      const processData = await safeFetchJson(processRes, 'HLS Transcoding');
      if (!processData || !processData.ok || !processData.hlsManifestKey) {
        throw new Error(processData?.error || 'Server HLS transcoding pipeline failed.');
      }

      setUploadProgress(100);
      setStep('done');

      onUploadSuccess({
        hlsManifestKey: processData.hlsManifestKey,
        storageProvider: 'cloudflare_r2',
        durationSeconds: processData.durationSeconds,
      });
    } catch (err: any) {
      console.error('[R2 Uploader Error]', err);
      setError(err.message || 'R2 upload/transcoding pipeline failed.');
      setStep('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-purple-900/50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white">Cloudflare R2 + Adaptive HLS Pipeline</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded border border-purple-700/50">
          Native Node Engine
        </span>
      </div>

      {currentManifestKey && (
        <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2 truncate">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate font-mono text-[11px]">{currentManifestKey}</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 shrink-0">HLS Active</span>
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span className="leading-tight">{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Select Video File for R2 Transcoding
        </label>
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/mkv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={isProcessing}
          className="block w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
        />
      </div>

      {file && !isProcessing && step !== 'done' && (
        <button
          type="button"
          onClick={handleStartUpload}
          className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <Film className="w-4 h-4" />
          <span>Upload & Transcode to R2 HLS</span>
        </button>
      )}

      {isProcessing && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-purple-300">
            <span className="flex items-center gap-2 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              {step === 'uploading' ? 'Uploading raw MP4 to Cloudflare R2...' : 'Server FFmpeg Transcoding HLS Streams...'}
            </span>
            <span className="font-mono text-[11px]">{uploadProgress}%</span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
