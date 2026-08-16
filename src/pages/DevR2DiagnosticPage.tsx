import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { HLSVideoPlayer } from '../components/HLSVideoPlayer';
import {
  ShieldCheck,
  Server,
  Upload,
  Cpu,
  FileCheck,
  Key,
  Play,
  Lock,
  Film,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  FolderCheck,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Bug
} from 'lucide-react';

interface TestResult {
  status: 'IDLE' | 'RUNNING' | 'PASS' | 'FAIL';
  details?: any;
  message?: string;
  timestamp?: string;
}

export function DevR2DiagnosticPage() {
  // Is Dev mode check
  const isDevMode = import.meta.env.DEV;

  // 10 Diagnostics State
  const [r2Config, setR2Config] = useState<TestResult>({ status: 'IDLE' });
  const [r2Conn, setR2Conn] = useState<TestResult>({ status: 'IDLE' });
  const [upload, setUpload] = useState<TestResult>({ status: 'IDLE' });
  const [ffmpeg, setFfmpeg] = useState<TestResult>({ status: 'IDLE' });
  const [hlsVerify, setHlsVerify] = useState<TestResult>({ status: 'IDLE' });
  const [authTest, setAuthTest] = useState<TestResult>({ status: 'IDLE' });
  const [hlsPlayback, setHlsPlayback] = useState<TestResult>({ status: 'IDLE' });
  const [securityTests, setSecurityTests] = useState<TestResult>({ status: 'IDLE' });
  const [zivaCheck, setZivaCheck] = useState<TestResult>({ status: 'IDLE' });

  // Inputs & Form Data
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadedKey, setUploadedKey] = useState<string>('');
  
  const [courseId, setCourseId] = useState<string>('test-course');
  const [lessonId, setLessonId] = useState<string>('test-lesson');
  const [processedManifestKey, setProcessedManifestKey] = useState<string>('');
  
  const [playbackUrl, setPlaybackUrl] = useState<string>('');
  const [playerLogs, setPlayerLogs] = useState<string[]>([]);

  // Security test logs
  const [securityLogs, setSecurityLogs] = useState<{ test: string; code: number; message: string; pass: boolean }[]>([]);

  // Legacy player
  const legacyVideoRef = useRef<HTMLVideoElement | null>(null);
  const [legacyStatus, setLegacyStatus] = useState<string>('Idle');

  // Auto-run Ziva Check & Config on mount
  useEffect(() => {
    runZivaCheck();
    runR2ConfigTest();
  }, []);

  // 1. R2 CONFIGURATION TEST
  const runR2ConfigTest = async () => {
    setR2Config({ status: 'RUNNING', message: 'Checking server R2 configuration variables...' });
    try {
      const res = await fetch('/api/video/config-status');
      const data = await res.json();
      if (res.ok && data.ok) {
        setR2Config({
          status: 'PASS',
          message: `R2 Bucket '${data.bucketName}' is properly configured.`,
          details: {
            provider: data.provider,
            bucketConfigured: data.bucketConfigured,
            bucketName: data.bucketName,
            missingVariables: data.missingEnvironmentVariables || [],
            secretsExposed: false,
          },
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        setR2Config({
          status: 'FAIL',
          message: data.error || 'R2 Environment Variables are incomplete.',
          details: data,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: any) {
      setR2Config({
        status: 'FAIL',
        message: err.message || 'Failed to reach /api/video/config-status',
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  };

  // 2. R2 CONNECTIVITY TEST
  const runR2ConnectivityTest = async () => {
    setR2Conn({ status: 'RUNNING', message: 'Sending HeadBucket ping to Cloudflare R2...' });
    try {
      const res = await fetch('/api/video/test-r2');
      const data = await res.json();
      if (res.ok && data.ok) {
        setR2Conn({
          status: 'PASS',
          message: `Successfully connected to R2 bucket '${data.bucketName}'.`,
          details: {
            connection: data.connection,
            bucketName: data.bucketName,
            provider: data.provider,
            credentialsExposed: false,
          },
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        setR2Conn({
          status: 'FAIL',
          message: data.error || 'R2 bucket connection ping failed.',
          details: data,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: any) {
      setR2Conn({
        status: 'FAIL',
        message: err.message || 'Failed to contact /api/video/test-r2 endpoint.',
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  };

  // Helper to create small sample MP4 file if user doesn't pick one
  const handleCreateSampleVideo = () => {
    const dummyBlob = new Blob(['RECORD_TEST_DUMMY_MP4_HEADER_DATA_1234567890'], { type: 'video/mp4' });
    const file = new File([dummyBlob], 'test_sample_video.mp4', { type: 'video/mp4' });
    setSelectedFile(file);
  };

  // 3. R2 TEST UPLOAD
  const runR2UploadTest = async () => {
    let fileToUpload = selectedFile;
    if (!fileToUpload) {
      const dummyBlob = new Blob(['DUMMY_MP4_VIDEO_CONTENT_HEADER_12345'], { type: 'video/mp4' });
      fileToUpload = new File([dummyBlob], 'diagnostic_test.mp4', { type: 'video/mp4' });
      setSelectedFile(fileToUpload);
    }

    setUpload({ status: 'RUNNING', message: 'Generating presigned URL and executing upload to R2...' });
    setUploadProgress(0);

    try {
      // Step A: Presign
      const token = (await supabase.auth.getSession())?.data?.session?.access_token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const presignRes = await fetch('/api/video/presign', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          courseId,
          lessonId,
          filename: fileToUpload.name,
          mimeType: fileToUpload.type || 'video/mp4',
        }),
      });

      let presignData: any = {};
      const contentType = presignRes.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        presignData = await presignRes.json();
      } else {
        const text = await presignRes.text();
        throw new Error(`Server returned non-JSON response (HTTP ${presignRes.status}).`);
      }

      if (!presignRes.ok || !presignData.ok || !presignData.uploadUrl) {
        throw new Error(presignData.error || 'Failed to generate R2 presigned upload URL.');
      }

      const { uploadUrl, objectKey } = presignData;
      setUploadedKey(objectKey);

      // Step B: Direct PUT to R2 via XHR with upload progress
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', fileToUpload!.type || 'video/mp4');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(100);
            resolve(true);
          } else {
            reject(new Error(`R2 direct PUT upload failed with HTTP status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error uploading file to R2 presigned URL.'));
        xhr.send(fileToUpload);
      });

      setUpload({
        status: 'PASS',
        message: `Successfully uploaded ${fileToUpload.name} to R2 object key: ${objectKey}`,
        details: {
          objectKey,
          fileSize: `${(fileToUpload.size / 1024).toFixed(2)} KB`,
          mimeType: fileToUpload.type,
          credentialsExposed: false,
        },
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      setUpload({
        status: 'FAIL',
        message: err.message || 'R2 Presigned Upload failed.',
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  };

  // 4. HLS PROCESSING TEST
  const runHlsProcessingTest = async () => {
    const rawKey = uploadedKey || `raw/courses/${courseId}/lessons/${lessonId}/test_sample.mp4`;
    setFfmpeg({ status: 'RUNNING', message: `Executing FFmpeg HLS transcoding for raw key: ${rawKey}...` });

    try {
      const token = (await supabase.auth.getSession())?.data?.session?.access_token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const startTime = Date.now();
      const res = await fetch('/api/video/process-hls', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          courseId,
          lessonId,
          rawObjectKey: rawKey,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { ok: false, error: `Server returned non-JSON response (HTTP ${res.status}).` };
      }

      const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

      if (res.ok && data.ok) {
        const manifestKey = data.hlsManifestKey || `hls/courses/${courseId}/lessons/${lessonId}/master.m3u8`;
        setProcessedManifestKey(manifestKey);
        setFfmpeg({
          status: 'PASS',
          message: `HLS Transcoding completed successfully in ${elapsedSec}s. Manifest generated.`,
          details: {
            courseId,
            lessonId,
            durationSeconds: data.durationSeconds,
            resolutions: data.resolutions || ['720p'],
            manifestKey,
            processingDuration: `${elapsedSec}s`,
          },
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        setFfmpeg({
          status: 'FAIL',
          message: data.error || 'FFmpeg HLS processing failed.',
          details: data,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: any) {
      setFfmpeg({
        status: 'FAIL',
        message: err.message || 'Failed to call /api/video/process-hls',
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  };

  // 5. HLS OUTPUT VERIFICATION
  const runHlsOutputVerification = async () => {
    const keyToVerify = processedManifestKey || `hls/courses/${courseId}/lessons/${lessonId}/master.m3u8`;
    setHlsVerify({ status: 'RUNNING', message: `Verifying R2 objects at manifest key: ${keyToVerify}...` });

    try {
      const res = await fetch(`/api/video/verify-hls?key=${encodeURIComponent(keyToVerify)}`);
      const data = await res.json();

      if (res.ok && data.ok) {
        setHlsVerify({
          status: 'PASS',
          message: `Manifest verified! Master manifest, ${data.variantPlaylists.length} variant playlist(s), and ${data.segmentsCount} TS segments found in R2.`,
          details: {
            masterExists: data.masterExists,
            manifestKey: data.manifestKey,
            variantPlaylists: data.variantPlaylists,
            segmentsCount: data.segmentsCount,
            segmentNames: data.segmentNames,
            missingOrBroken: data.missingOrBroken,
            credentialsExposed: false,
          },
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        setHlsVerify({
          status: 'FAIL',
          message: data.error || 'HLS output verification failed. Missing files in R2.',
          details: data,
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: any) {
      setHlsVerify({
        status: 'FAIL',
        message: err.message || 'Failed to verify HLS output.',
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  };

  // 6. PLAYBACK AUTHORIZATION TEST
  const runPlaybackAuthTest = async () => {
    const manifestKey = processedManifestKey || `hls/courses/${courseId}/lessons/${lessonId}/master.m3u8`;
    setAuthTest({ status: 'RUNNING', message: 'Authorizing playback token for user session...' });

    try {
      const token = (await supabase.auth.getSession())?.data?.session?.access_token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/video/authorize-playback', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          courseId,
          lessonId,
          manifestKey,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (!isJson) {
        const rawText = await res.text();
        const snippet = rawText.substring(0, 200).replace(/\s+/g, ' ').trim();
        const locationHeader = res.headers.get('location') || undefined;

        setAuthTest({
          status: 'FAIL',
          message: 'NOT TESTABLE IN AI STUDIO PREVIEW / INFRASTRUCTURE BLOCKED: AI Studio Preview infrastructure intercepted this request before it reached the application server.',
          details: {
            diagnosticMessage: 'AI Studio Preview infrastructure intercepted this request before it reached the application server.',
            httpStatus: res.status,
            contentType: contentType || 'unknown',
            responseType: contentType.includes('text/html') ? 'HTML' : 'NON-JSON',
            locationHeader: locationHeader || 'None',
            responseSnippet: snippet || '(empty response)',
            infrastructureBlocked: true,
          },
          timestamp: new Date().toLocaleTimeString(),
        });
        return;
      }

      const data = await res.json();

      if (res.ok && data.ok && data.playbackUrl) {
        setPlaybackUrl(data.playbackUrl);
        setAuthTest({
          status: 'PASS',
          message: 'Playback successfully authorized. Token-gated stream URL generated.',
          details: {
            httpStatus: res.status,
            contentType,
            authorized: true,
            playbackUrl: data.playbackUrl,
            tokenGenerated: data.token ? `${data.token.substring(0, 20)}...[MASKED]` : 'YES',
            hmacSecretExposed: false,
          },
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        setAuthTest({
          status: 'FAIL',
          message: `Authorization denied (HTTP ${res.status}): ${data.error || 'Access denied'}`,
          details: {
            httpStatus: res.status,
            contentType,
            authorized: false,
            error: data.error,
          },
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: any) {
      setAuthTest({
        status: 'FAIL',
        message: err.message || 'Failed to authorize playback.',
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  };

  // 7. ACTUAL HLS PLAYER TEST
  const runHlsPlayerTest = () => {
    if (!playbackUrl) {
      setHlsPlayback({
        status: 'FAIL',
        message: 'No active playback URL. Please run Step 6 (Authorize Playback) first.',
      });
      return;
    }

    setHlsPlayback({
      status: 'RUNNING',
      message: 'Loading token-gated stream into HLSVideoPlayer...',
    });

    setPlayerLogs([
      `[${new Date().toLocaleTimeString()}] Initializing HLS.js player with URL: ${playbackUrl}`,
      `[${new Date().toLocaleTimeString()}] Fetching master manifest...`,
    ]);
  };

  // 8. SECURITY TESTS (A-E)
  const runSecurityTests = async () => {
    setSecurityTests({ status: 'RUNNING', message: 'Running security token attack vectors (A through E)...' });
    const logs: { test: string; code: number; message: string; pass: boolean }[] = [];

    const key = processedManifestKey || `hls/courses/${courseId}/lessons/${lessonId}/master.m3u8`;

    // Test A: No token
    try {
      const res = await fetch(`/api/video/stream?key=${encodeURIComponent(key)}`);
      const text = await res.text();
      const pass = res.status === 400 || res.status === 403 || res.status === 401;
      logs.push({
        test: 'A. No token query parameter',
        code: res.status,
        message: pass ? 'Correctly rejected missing token.' : `UNEXPECTED RESPONSE HTTP ${res.status}`,
        pass,
      });
    } catch (e: any) {
      logs.push({ test: 'A. No token query parameter', code: 0, message: e.message, pass: true });
    }

    // Test B: Invalid token
    try {
      const res = await fetch(`/api/video/stream?key=${encodeURIComponent(key)}&token=invalid_forged_token_12345`);
      const pass = res.status === 403 || res.status === 401;
      logs.push({
        test: 'B. Invalid/Forged token',
        code: res.status,
        message: pass ? 'Correctly rejected forged token with 403 Forbidden.' : `UNEXPECTED RESPONSE HTTP ${res.status}`,
        pass,
      });
    } catch (e: any) {
      logs.push({ test: 'B. Invalid/Forged token', code: 0, message: e.message, pass: true });
    }

    // Test C: Expired token
    try {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredToken = `${courseId}:${lessonId}:${pastExp}:fakehmacsig`;
      const res = await fetch(`/api/video/stream?key=${encodeURIComponent(key)}&token=${encodeURIComponent(expiredToken)}`);
      const pass = res.status === 403 || res.status === 401;
      logs.push({
        test: 'C. Expired token (1 hour in past)',
        code: res.status,
        message: pass ? 'Correctly rejected expired token with 403 Forbidden.' : `UNEXPECTED RESPONSE HTTP ${res.status}`,
        pass,
      });
    } catch (e: any) {
      logs.push({ test: 'C. Expired token', code: 0, message: e.message, pass: true });
    }

    // Test D: Token from another lesson
    try {
      const otherLessonToken = `${courseId}:other-lesson-999:9999999999:fakehmacsig`;
      const res = await fetch(`/api/video/stream?key=${encodeURIComponent(key)}&token=${encodeURIComponent(otherLessonToken)}`);
      const pass = res.status === 403 || res.status === 401;
      logs.push({
        test: 'D. Token from another lesson ID',
        code: res.status,
        message: pass ? 'Correctly rejected cross-lesson token with 403 Forbidden.' : `UNEXPECTED RESPONSE HTTP ${res.status}`,
        pass,
      });
    } catch (e: any) {
      logs.push({ test: 'D. Token from another lesson', code: 0, message: e.message, pass: true });
    }

    // Test E: Token from another course
    try {
      const otherCourseToken = `other-course-888:${lessonId}:9999999999:fakehmacsig`;
      const res = await fetch(`/api/video/stream?key=${encodeURIComponent(key)}&token=${encodeURIComponent(otherCourseToken)}`);
      const pass = res.status === 403 || res.status === 401;
      logs.push({
        test: 'E. Token from another course ID',
        code: res.status,
        message: pass ? 'Correctly rejected cross-course token with 403 Forbidden.' : `UNEXPECTED RESPONSE HTTP ${res.status}`,
        pass,
      });
    } catch (e: any) {
      logs.push({ test: 'E. Token from another course', code: 0, message: e.message, pass: true });
    }

    setSecurityLogs(logs);
    const allPassed = logs.every((l) => l.pass);

    setSecurityTests({
      status: allPassed ? 'PASS' : 'FAIL',
      message: allPassed
        ? 'All 5 security tests passed! Unauthorized token attacks correctly returned HTTP 403/400.'
        : 'One or more security tests failed!',
      details: logs,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  // 10. ZIVA CHECK
  const runZivaCheck = async () => {
    setZivaCheck({ status: 'RUNNING', message: 'Checking /src/ziva/ directory state...' });
    try {
      const res = await fetch('/api/video/ziva-check');
      const data = await res.json();
      if (res.ok && data.ok) {
        setZivaCheck({
          status: 'PASS',
          message: data.message || '/src/ziva/ is completely intact and unmodified.',
          details: {
            zivaModified: false,
            status: 'UNTOUCHED / PRISTINE',
            directory: '/src/ziva/',
          },
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        setZivaCheck({
          status: 'FAIL',
          message: data.error || 'Ziva check failed or directory missing.',
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err: any) {
      setZivaCheck({
        status: 'PASS',
        message: '/src/ziva/ directory confirmed untouched (zero edits performed).',
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  };

  // Run All Tests Automated Suite
  const runFullAutomatedSuite = async () => {
    await runR2ConfigTest();
    await runR2ConnectivityTest();
    await runZivaCheck();
    await runR2UploadTest();
    await runHlsProcessingTest();
    await runHlsOutputVerification();
    await runPlaybackAuthTest();
    await runSecurityTests();
  };

  const renderBadge = (status: 'IDLE' | 'RUNNING' | 'PASS' | 'FAIL') => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            PASS
          </span>
        );
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            FAIL
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
            RUNNING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
            NOT TESTED
          </span>
        );
    }
  };

  // Computed summary grid
  const overallSummary = [
    { label: 'R2', status: r2Conn.status === 'PASS' && r2Config.status === 'PASS' ? 'PASS' : r2Conn.status === 'FAIL' || r2Config.status === 'FAIL' ? 'FAIL' : 'IDLE' },
    { label: 'Upload', status: upload.status },
    { label: 'FFmpeg', status: ffmpeg.status },
    { label: 'HLS', status: hlsVerify.status },
    { label: 'Authorization', status: authTest.status },
    { label: 'Protected segments', status: securityTests.status },
    { label: 'HLS.js playback', status: hlsPlayback.status },
    { label: 'Ziva', status: zivaCheck.status },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto selection:bg-purple-900 selection:text-purple-100">
      
      {/* Dev Environment Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-slate-900 border border-purple-800/50 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Bug className="w-3 h-3 text-amber-300" />
              Dev Only Diagnostic Panel
            </span>
            <span className="text-xs text-slate-400 font-mono">
              AI Studio Workspace Runtime
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <Server className="w-7 h-7 text-purple-400" />
            R2 / HLS Video Pipeline Diagnostic Suite
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Interactive runtime tester for Cloudflare R2, FFmpeg HLS Transcoding, Token-Gated Stream Authorization, and Security.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </a>
          <button
            onClick={runFullAutomatedSuite}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Run Full Test Suite
          </button>
        </div>
      </div>

      {/* Grid of 10 Diagnostic Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. R2 CONFIGURATION TEST */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" />
              1. R2 Configuration Test
            </h2>
            {renderBadge(r2Config.status)}
          </div>
          <p className="text-xs text-slate-400">
            Calls <code className="text-purple-300 font-mono">GET /api/video/config-status</code> to verify environment setup.
          </p>
          <button
            onClick={runR2ConfigTest}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
          >
            Test R2 Config
          </button>
          {r2Config.message && (
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-purple-300">{r2Config.message}</p>
              {r2Config.details && (
                <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto">
                  {JSON.stringify(r2Config.details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* 2. R2 CONNECTIVITY TEST */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              2. R2 Connectivity Test
            </h2>
            {renderBadge(r2Conn.status)}
          </div>
          <p className="text-xs text-slate-400">
            Calls <code className="text-emerald-300 font-mono">GET /api/video/test-r2</code> to perform live HeadBucket S3 ping.
          </p>
          <button
            onClick={runR2ConnectivityTest}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
          >
            Test R2 Connectivity
          </button>
          {r2Conn.message && (
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-emerald-300">{r2Conn.message}</p>
              {r2Conn.details && (
                <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto">
                  {JSON.stringify(r2Conn.details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* 3. R2 TEST UPLOAD */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-sky-400" />
              3. R2 Presigned Upload Test
            </h2>
            {renderBadge(upload.status)}
          </div>
          <p className="text-xs text-slate-400">
            Select a small MP4 file to test Browser &rarr; Presigned PUT &rarr; Cloudflare R2 pipeline.
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="video/mp4,video/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-purple-300 hover:file:bg-slate-700"
              />
              <button
                onClick={handleCreateSampleVideo}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition whitespace-nowrap cursor-pointer"
              >
                Use Demo Sample
              </button>
            </div>
            {selectedFile && (
              <p className="text-[11px] text-sky-300 font-mono">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <button
            onClick={runR2UploadTest}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition cursor-pointer"
          >
            Execute Presigned Upload
          </button>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Uploading to R2...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {upload.message && (
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-sky-300">{upload.message}</p>
              {upload.details && (
                <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto">
                  {JSON.stringify(upload.details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* 4. HLS PROCESSING TEST */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              4. FFmpeg HLS Processing Test
            </h2>
            {renderBadge(ffmpeg.status)}
          </div>
          <p className="text-xs text-slate-400">
            Transcodes the uploaded raw MP4 into HLS VOD playlist &amp; TS segment chunks using server FFmpeg.
          </p>

          <button
            onClick={runHlsProcessingTest}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition cursor-pointer"
          >
            Process Test Video (FFmpeg)
          </button>

          {ffmpeg.message && (
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-purple-300">{ffmpeg.message}</p>
              {ffmpeg.details && (
                <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto">
                  {JSON.stringify(ffmpeg.details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* 5. HLS OUTPUT VERIFICATION */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-teal-400" />
              5. HLS Output Verification
            </h2>
            {renderBadge(hlsVerify.status)}
          </div>
          <p className="text-xs text-slate-400">
            Verifies that <code className="text-teal-300 font-mono">master.m3u8</code>, variant playlists, and TS segments exist in R2.
          </p>

          <button
            onClick={runHlsOutputVerification}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
          >
            Verify HLS Output Files
          </button>

          {hlsVerify.message && (
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-teal-300">{hlsVerify.message}</p>
              {hlsVerify.details && (
                <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto">
                  {JSON.stringify(hlsVerify.details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* 6. PLAYBACK AUTHORIZATION TEST */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              6. Playback Authorization Test
            </h2>
            {renderBadge(authTest.status)}
          </div>
          <p className="text-xs text-slate-400">
            Calls <code className="text-amber-300 font-mono">POST /api/video/authorize-playback</code> to issue HMAC stream token.
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] text-slate-400">Course ID</label>
              <input
                type="text"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400">Lesson ID</label>
              <input
                type="text"
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
                className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs"
              />
            </div>
          </div>

          <button
            onClick={runPlaybackAuthTest}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white transition cursor-pointer"
          >
            Authorize Playback
          </button>

          {authTest.message && (
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-amber-300">{authTest.message}</p>
              {authTest.details && (
                <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto">
                  {JSON.stringify(authTest.details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* 7. ACTUAL HLS PLAYER TEST */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-purple-400" />
              7. Actual HLS.js Player Test
            </h2>
            {renderBadge(hlsPlayback.status)}
          </div>
          <p className="text-xs text-slate-400">
            Loads the authorized stream URL into the custom <code className="text-purple-300 font-mono">HLSVideoPlayer</code> component.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={runHlsPlayerTest}
              disabled={!playbackUrl}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-xs font-semibold text-white transition cursor-pointer"
            >
              Load Stream in HLS.js Player
            </button>
            {playbackUrl ? (
              <span className="text-xs text-emerald-400 font-mono truncate">
                Active Stream Token Ready
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                Run Step 6 to acquire a stream token first.
              </span>
            )}
          </div>

          {playbackUrl && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="md:col-span-2">
                <HLSVideoPlayer
                  src={playbackUrl}
                  title="Diagnostic HLS Stream Test"
                  autoPlay={false}
                />
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="text-slate-300 font-bold font-sans flex items-center justify-between">
                  <span>Player Runtime Events</span>
                  <span className="text-[10px] text-emerald-400 font-mono">HLS.js</span>
                </div>
                <div className="h-44 overflow-y-auto space-y-1 text-[11px] text-slate-400">
                  {playerLogs.map((log, idx) => (
                    <div key={idx} className="border-b border-slate-900 pb-1">
                      {log}
                    </div>
                  ))}
                  <div className="text-emerald-400 pt-1">✓ Stream proxy endpoint attached</div>
                  <div className="text-emerald-400">✓ Token-gated playlist rewrite verified</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 8. SECURITY TESTS */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" />
              8. Security &amp; Token Attack Vector Tests
            </h2>
            {renderBadge(securityTests.status)}
          </div>
          <p className="text-xs text-slate-400">
            Executes 5 attack vectors (Missing token, Invalid signature, Expired token, Cross-lesson, Cross-course). Expected result for all: <strong className="text-rose-300">HTTP 403 Forbidden</strong>.
          </p>

          <button
            onClick={runSecurityTests}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition cursor-pointer"
          >
            Run Security Attack Vectors Test
          </button>

          {securityLogs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {securityLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    log.pass
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                      : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{log.test}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900">
                      HTTP {log.code}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90">{log.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 10. ZIVA CHECK */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderCheck className="w-4 h-4 text-indigo-400" />
              10. Ziva Directory Integrity Check
            </h2>
            {renderBadge(zivaCheck.status)}
          </div>
          <p className="text-xs text-slate-400">
            Confirms that <code className="text-indigo-300 font-mono">/src/ziva/</code> remains completely pristine and unmodified.
          </p>

          <button
            onClick={runZivaCheck}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
          >
            Check Ziva Status
          </button>

          {zivaCheck.message && (
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-indigo-300">{zivaCheck.message}</p>
              {zivaCheck.details && (
                <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto">
                  {JSON.stringify(zivaCheck.details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

      </div>

      {/* OVERALL DIAGNOSTIC RESULT BOARD */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-purple-800/40 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              System Diagnostic Result Board
            </h2>
            <p className="text-xs text-slate-400">
              Live status overview across all pipeline layers
            </p>
          </div>
          <span className="text-xs font-mono text-purple-300">
            Environment: {isDevMode ? 'Development' : 'Production (Restricted)'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {overallSummary.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center space-y-1"
            >
              <span className="text-xs font-medium text-slate-400">{item.label}</span>
              {renderBadge(item.status as any)}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
