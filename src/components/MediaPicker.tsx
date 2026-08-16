import React, { useState, useRef, useCallback } from 'react';
import { mediaService, MediaUploadResult } from '../services/mediaService';
import { storageService } from '../services/storageService';
import {
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Trash2,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  File,
  Loader2,
  Sparkles,
  Play,
  Volume2,
  Eye,
} from 'lucide-react';

export type MediaType = 'image' | 'video' | 'pdf' | 'audio' | 'raw';

export interface MediaItem {
  url: string;
  publicId?: string;
  type: MediaType;
  name: string;
  size?: number;
  format?: string;
  uploadedAt?: string;
}

export interface MediaPickerProps {
  value?: MediaItem | string | null;
  onChange?: (media: MediaItem | null) => void;
  onSelectMedia?: (media: MediaItem | null) => void;
  acceptTypes?: MediaType[];
  maxFileSizeMB?: number;
  folder?: string;
  title?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
  value = null,
  onChange,
  onSelectMedia,
  acceptTypes = ['image', 'video', 'pdf', 'audio'],
  maxFileSizeMB = 500,
  folder = 'course-media',
  title = 'Media Picker',
  description = 'Upload or drag and drop images, videos, audio clips, or PDF documents.',
  className = '',
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSelectedFile, setLastSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<MediaType | 'all'>('all');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse current selected media item
  const currentMedia: MediaItem | null = React.useMemo(() => {
    if (!value) return null;
    if (typeof value === 'string') {
      const extension = value.split('.').pop()?.toLowerCase() || '';
      let detectedType: MediaType = 'image';

      if (['mp4', 'webm', 'mov', 'm4v', 'avi'].includes(extension)) {
        detectedType = 'video';
      } else if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(extension)) {
        detectedType = 'audio';
      } else if (['pdf'].includes(extension)) {
        detectedType = 'pdf';
      } else if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'].includes(extension)) {
        detectedType = 'image';
      }

      return {
        url: value,
        name: value.split('/').pop() || 'Media File',
        type: detectedType,
      };
    }
    return value;
  }, [value]);

  const notifyChange = useCallback(
    (media: MediaItem | null) => {
      if (onChange) onChange(media);
      if (onSelectMedia) onSelectMedia(media);
    },
    [onChange, onSelectMedia]
  );

  // Map MediaType to file accept string
  const getAcceptAttribute = () => {
    const mimeMap: Record<MediaType, string> = {
      image: 'image/*',
      video: 'video/*',
      audio: 'audio/*',
      pdf: 'application/pdf',
      raw: '*/*',
    };
    return acceptTypes.map((type) => mimeMap[type]).join(',');
  };

  // Determine media type from File
  const detectMediaType = (file: File): MediaType => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) return 'pdf';
    return 'raw';
  };

  // Validate File
  const validateFile = (file: File): string | null => {
    const fileMB = file.size / (1024 * 1024);
    if (fileMB > maxFileSizeMB) {
      return `File size (${fileMB.toFixed(1)} MB) exceeds maximum limit of ${maxFileSizeMB} MB.`;
    }

    const detectedType = detectMediaType(file);
    if (!acceptTypes.includes(detectedType) && !acceptTypes.includes('raw')) {
      return `File type "${detectedType.toUpperCase()}" is not supported. Allowed types: ${acceptTypes.join(', ').toUpperCase()}.`;
    }

    return null;
  };

  // Process File Upload
  const handleFileUpload = async (file: File) => {
    setErrorMessage(null);
    setLastSelectedFile(file);

    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const mediaType = detectMediaType(file);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let resourceType: 'image' | 'video' | 'audio' | 'document' | 'resource' = 'resource';
      if (mediaType === 'image') resourceType = 'image';
      else if (mediaType === 'video') resourceType = 'video';
      else if (mediaType === 'audio') resourceType = 'audio';
      else if (mediaType === 'pdf') resourceType = 'document';

      const result: MediaUploadResult = await mediaService.uploadWithProgress(
        file,
        resourceType,
        { folder },
        (progress) => setUploadProgress(progress)
      );

      const newMediaItem: MediaItem = {
        url: result.secureUrl,
        publicId: result.publicId,
        type: mediaType,
        name: result.originalFilename || file.name,
        size: result.bytes,
        format: result.format,
        uploadedAt: new Date().toISOString(),
      };

      notifyChange(newMediaItem);
      setErrorMessage(null);
      setLastSelectedFile(null);
    } catch (err: any) {
      console.error('Media upload error:', err);
      setErrorMessage(err?.message || 'Failed to upload media file to secure storage. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Input File Change
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
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

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Replace & Delete
  const handleReplace = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = () => {
    notifyChange(null);
  };

  // Formatting Helper
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Get Icon for Media Type
  const getMediaIcon = (type: MediaType) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-indigo-600" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-600" />;
      case 'audio':
        return <Music className="w-5 h-5 text-emerald-600" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-600" />;
      default:
        return <File className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptAttribute()}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Header Info */}
      {(title || description) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            {title && (
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            )}
          </div>

          {/* Supported Format Badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-slate-600">
            {acceptTypes.includes('image') && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Images
              </span>
            )}
            {acceptTypes.includes('video') && (
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Videos
              </span>
            )}
            {acceptTypes.includes('audio') && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Audio
              </span>
            )}
            {acceptTypes.includes('pdf') && (
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                PDF
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between gap-3 animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="truncate">{errorMessage}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {lastSelectedFile && !isUploading && (
              <button
                type="button"
                onClick={() => handleFileUpload(lastSelectedFile)}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-[11px] inline-flex items-center gap-1 shadow-2xs"
              >
                <RefreshCw className="w-3 h-3" />
                Retry Upload
              </button>
            )}
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="p-1 hover:bg-rose-100 rounded-lg text-rose-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar during active upload */}
      {isUploading && (
        <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
              Uploading Media to Cloudflare R2...
            </span>
            <span className="font-mono text-indigo-700">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2.5 bg-indigo-200/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-indigo-600 font-medium">
            Please wait while your file is being encrypted and optimized.
          </p>
        </div>
      )}

      {/* Media Drop Zone OR Media Preview Display */}
      {!currentMedia ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="max-w-xs mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center mx-auto text-indigo-600">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Click to upload or drag & drop
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports Images, Videos, Audio clips & PDF documents (up to {maxFileSizeMB}MB)
              </p>
            </div>
            <button
              type="button"
              disabled={disabled || isUploading}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-2xs inline-flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              Browse Media File
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
          {/* Top Bar with Type Badge & Action Tools */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              {getMediaIcon(currentMedia.type)}
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {currentMedia.name}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                  <span className="uppercase font-semibold text-indigo-600">
                    {currentMedia.type}
                  </span>
                  {currentMedia.size && <span>• {formatFileSize(currentMedia.size)}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(true)}
                title="Full Preview"
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Preview</span>
              </button>
              <button
                type="button"
                onClick={handleReplace}
                title="Replace Media"
                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Replace</span>
              </button>
              <button
                type="button"
                onClick={handleDelete}
                title="Delete Media"
                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>

          {/* Interactive Preview Container */}
          <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200 min-h-[180px] flex items-center justify-center">
            {/* IMAGE PREVIEW */}
            {currentMedia.type === 'image' && (
              <img
                src={storageService.getStorageUrl(currentMedia.url)}
                alt={currentMedia.name}
                className="max-h-80 w-auto object-contain mx-auto"
                referrerPolicy="no-referrer"
              />
            )}

            {/* VIDEO PREVIEW */}
            {currentMedia.type === 'video' && (
              <video
                src={storageService.getStorageUrl(currentMedia.url)}
                controls
                preload="metadata"
                className="max-h-80 w-full object-contain"
              >
                Your browser does not support video playback.
              </video>
            )}

            {/* AUDIO PREVIEW */}
            {currentMedia.type === 'audio' && (
              <div className="w-full p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/80 flex items-center justify-center shrink-0">
                    <Music className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold truncate max-w-sm">
                      {currentMedia.name}
                    </h4>
                    <p className="text-xs text-indigo-300">Audio Recording</p>
                  </div>
                </div>
                <audio controls src={storageService.getStorageUrl(currentMedia.url)} className="w-full h-10 accent-indigo-500">
                  Your browser does not support audio playback.
                </audio>
              </div>
            )}

            {/* PDF PREVIEW */}
            {(currentMedia.type === 'pdf' || currentMedia.type === 'raw') && (
              <div className="w-full p-6 bg-slate-800 text-white space-y-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{currentMedia.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">PDF Document Attachment</p>
                </div>
                <div className="pt-2 flex justify-center gap-2">
                  <a
                    href={storageService.getStorageUrl(currentMedia.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open PDF Document
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {isPreviewModalOpen && currentMedia && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {getMediaIcon(currentMedia.type)}
                <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                  {currentMedia.name}
                </h3>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl p-2 flex items-center justify-center min-h-[300px]">
              {currentMedia.type === 'image' && (
                <img
                  src={storageService.getStorageUrl(currentMedia.url)}
                  alt={currentMedia.name}
                  className="max-h-[70vh] object-contain rounded-xl"
                />
              )}
              {currentMedia.type === 'video' && (
                <video
                  src={storageService.getStorageUrl(currentMedia.url)}
                  controls
                  autoPlay
                  preload="metadata"
                  className="max-h-[70vh] w-full object-contain rounded-xl"
                />
              )}
              {currentMedia.type === 'audio' && (
                <div className="w-full p-8 text-white space-y-4">
                  <Music className="w-12 h-12 text-indigo-400 mx-auto" />
                  <audio controls src={storageService.getStorageUrl(currentMedia.url)} className="w-full" autoPlay />
                </div>
              )}
              {currentMedia.type === 'pdf' && (
                <iframe
                  src={storageService.getStorageUrl(currentMedia.url)}
                  className="w-full h-[60vh] rounded-xl border border-slate-700"
                  title="PDF Document Preview"
                />
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-500 font-mono">
                {currentMedia.size ? formatFileSize(currentMedia.size) : 'File Active'}
              </span>
              <a
                href={storageService.getStorageUrl(currentMedia.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open File URL
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPicker;
