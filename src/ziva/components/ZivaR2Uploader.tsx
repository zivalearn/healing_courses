import React, { useState, useRef } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Loader2,
  FileText,
  Music,
  Video,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { zivaMediaService, ZivaR2AssetType } from '../services/zivaMediaService';

export interface ZivaUploadSuccessData {
  url: string;
  objectKey?: string;
  fileName?: string;
  fileSize?: string;
  metadata?: Record<string, any>;
  durationSeconds?: number;
}

export interface ZivaR2UploaderProps {
  onUploadSuccess: (result: string | ZivaUploadSuccessData) => void;
  assetType?: ZivaR2AssetType;
  courseId?: string;
  lessonId?: string;
  buttonText?: string;
  accept?: string;
  currentUrl?: string;
  className?: string;
}

export const ZivaR2Uploader: React.FC<ZivaR2UploaderProps> = ({
  onUploadSuccess,
  assetType = 'image',
  courseId = 'general',
  lessonId,
  buttonText = 'Upload to Cloudflare R2',
  accept,
  currentUrl,
  className = '',
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultAccept = React.useMemo(() => {
    if (accept) return accept;
    switch (assetType) {
      case 'image':
        return 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml';
      case 'video':
        return 'video/mp4,video/quicktime,video/webm';
      case 'audio':
        return 'audio/mpeg,audio/wav,audio/aac,audio/mp3,audio/ogg';
      case 'document':
        return 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';
      case 'resource':
        return '*/*';
      default:
        return 'image/*,video/*,audio/*,application/pdf';
    }
  }, [accept, assetType]);

  const processFile = async (file: File) => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);
    setStatusMessage('Preparing direct Cloudflare R2 upload...');

    try {
      // General direct R2 asset upload (video, image, audio, document, resource)
      // Uploads directly to Cloudflare R2 without long-running FFmpeg timeouts
      const mediaResult = await zivaMediaService.uploadZivaAsset({
        file,
        assetType: assetType as ZivaR2AssetType,
        courseId,
        lessonId,
        onProgress: (pct) => {
          setProgress(pct);
          setStatusMessage(`Uploading directly to R2 (${pct}%)...`);
        },
      });

      setUploadedPreview(mediaResult.url);
      onUploadSuccess({
        url: mediaResult.url,
        objectKey: mediaResult.objectKey,
        fileName: mediaResult.fileName,
        fileSize: mediaResult.fileSizeFormatted,
        metadata: mediaResult.metadata,
      });
    } catch (err: any) {
      console.error('[Ziva R2 Upload Error]', err);
      setError(err.message || 'Direct Cloudflare R2 upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
      setStatusMessage('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualUrl.trim()) {
      setUploadedPreview(manualUrl.trim());
      onUploadSuccess(manualUrl.trim());
      setManualUrl('');
      setShowUrlInput(false);
    }
  };

  const getAssetIcon = () => {
    switch (assetType) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-pink-400" />;
      case 'video':
        return <Video className="w-4 h-4 text-amber-400" />;
      case 'audio':
        return <Music className="w-4 h-4 text-cyan-400" />;
      case 'document':
      case 'resource':
        return <FileText className="w-4 h-4 text-emerald-400" />;
      default:
        return <Upload className="w-4 h-4 text-pink-400" />;
    }
  };

  return (
    <div
      className={`space-y-3 bg-black/60 p-4 rounded-xl border transition-all ${
        isDragOver ? 'border-[#FF2E93] bg-pink-950/20' : 'border-gray-900'
      } text-xs ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ACTION BAR */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label
          className={`relative cursor-pointer bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 text-amber-300 font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
              <span>{statusMessage || 'Processing...'}</span>
            </>
          ) : (
            <>
              {getAssetIcon()}
              <span>{buttonText}</span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={defaultAccept}
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-500 hidden sm:inline">
            Drag & drop supported (Cloudflare R2 Direct)
          </span>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-gray-400 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>{showUrlInput ? 'Hide URL input' : 'Paste Direct URL'}</span>
          </button>
        </div>
      </div>

      {/* UPLOAD PROGRESS BAR */}
      {uploading && (
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[10px] text-gray-400 font-mono">
            <span>{statusMessage}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-gray-800">
            <div
              className="bg-gradient-to-r from-amber-400 via-pink-500 to-[#FF2E93] h-full transition-all duration-300 rounded-full"
              style={{ width: `${Math.max(5, progress)}%` }}
            />
          </div>
        </div>
      )}

      {/* ERROR ALERT */}
      {error && (
        <div className="flex items-start gap-2 text-rose-400 bg-rose-950/30 border border-rose-900/50 p-2.5 rounded-lg text-[11px]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">Upload Failed</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-gray-400 hover:text-white cursor-pointer p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* MANUAL URL INPUT */}
      {showUrlInput && (
        <form onSubmit={handleManualSubmit} className="flex gap-2 pt-1">
          <input
            type="text"
            placeholder="https://... or ziva/..."
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            className="flex-1 bg-neutral-950 border border-gray-800 text-white text-xs px-3 py-2 rounded focus:ring-1 focus:ring-[#FF2E93] outline-none"
          />
          <button
            type="submit"
            className="bg-[#FF2E93] hover:bg-pink-600 text-white font-bold px-4 py-2 rounded uppercase text-[10px] cursor-pointer"
          >
            Apply
          </button>
        </form>
      )}

      {/* LIVE PREVIEW IF ATTACHED */}
      {uploadedPreview && !uploading && (
        <div className="flex items-center justify-between bg-neutral-950/80 border border-gray-900 px-3 py-2 rounded-lg text-[11px] text-gray-300">
          <div className="flex items-center gap-2 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate max-w-[280px] sm:max-w-md font-mono text-gray-400">
              {uploadedPreview}
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold text-pink-400 shrink-0 bg-pink-950/40 border border-pink-900/50 px-2 py-0.5 rounded">
            R2 Active
          </span>
        </div>
      )}
    </div>
  );
};
