import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Check, Image as ImageIcon, Video, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { storageService } from '../../services/storageService';

interface MediaUploaderProps {
  label: string;
  description?: string;
  currentUrl?: string;
  accept?: string;
  type?: 'image' | 'video' | 'document';
  folder?: string;
  onChange: (url: string) => void;
  aspectRatio?: string;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  label,
  description,
  currentUrl,
  accept = 'image/*',
  type = 'image',
  folder = 'courses',
  onChange,
  aspectRatio = 'aspect-video'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(currentUrl || '');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewUrl(currentUrl || '');
  }, [currentUrl]);

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    try {
      // Direct call to storageService abstraction as per architectural requirement
      const uploadedUrl = await storageService.uploadMedia(file, folder);
      setPreviewUrl(uploadedUrl);
      onChange(uploadedUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (!inputUrl.trim()) return;
    setPreviewUrl(inputUrl.trim());
    onChange(inputUrl.trim());
    setShowUrlInput(false);
    setInputUrl('');
  };

  const handleClear = () => {
    setPreviewUrl('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#102A36]">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs text-[#287687] hover:underline font-semibold"
        >
          {showUrlInput ? 'Hide URL Input' : 'Paste External URL'}
        </button>
      </div>

      {description && (
        <p className="text-xs text-[#486D7A]">{description}</p>
      )}

      {showUrlInput && (
        <div className="flex gap-2">
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="https://images.unsplash.com/photo-..."
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#C8E6E1] bg-white focus:outline-none focus:border-[#287687]"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-3 py-2 bg-[#287687] text-white text-xs font-bold rounded-xl hover:bg-[#102A36]"
          >
            Apply
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
      />

      {error && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {previewUrl ? (
        <div className={`relative rounded-2xl overflow-hidden border border-[#C8E6E1] bg-gray-900 group ${aspectRatio}`}>
          {type === 'image' && (
            <img
              src={storageService.getStorageUrl(previewUrl)}
              alt={label}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}

          {type === 'video' && (
            <video
              src={storageService.getStorageUrl(previewUrl)}
              controls
              preload="metadata"
              className="w-full h-full object-cover"
            />
          )}

          {type === 'document' && (
            <div className="w-full h-full bg-[#102A36] text-white p-4 flex flex-col items-center justify-center text-center">
              <FileText className="w-10 h-10 text-[#CBA258] mb-2" />
              <p className="text-xs font-bold line-clamp-1">{previewUrl.split('/').pop()}</p>
              <span className="text-[10px] text-white/60 mt-1">Uploaded Document</span>
            </div>
          )}

          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-[#102A36] text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Replace</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all"
              title="Remove media"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            dragOver
              ? 'border-[#287687] bg-[#E2F1EE]'
              : 'border-[#C8E6E1] bg-[#F7FCFA] hover:bg-[#EEF7F5] hover:border-[#287687]'
          }`}
        >
          {isUploading ? (
            <div className="py-4 flex flex-col items-center gap-2 text-[#287687]">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-bold">Uploading media via Storage Service...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-[#E2F1EE] flex items-center justify-center text-[#287687]">
                {type === 'image' && <ImageIcon className="w-5 h-5" />}
                {type === 'video' && <Video className="w-5 h-5" />}
                {type === 'document' && <FileText className="w-5 h-5" />}
              </div>
              <div className="text-xs">
                <span className="font-bold text-[#287687]">Click to upload</span>
                <span className="text-[#486D7A]"> or drag and drop file</span>
              </div>
              <span className="text-[10px] text-[#486D7A]">
                {type === 'image' && 'PNG, JPG, WEBP, SVG supported'}
                {type === 'video' && 'MP4, WEBM, MOV supported (Direct R2 high-speed upload)'}
                {type === 'document' && 'PDF, DOCX, XLSX supported'}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
