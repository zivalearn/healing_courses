import React, { useState } from 'react';
import { LessonBlock, BlockType } from '../../../models/builder';
import { TextFormatToolbar } from './TextFormatToolbar';
import { MediaPicker } from '../../MediaPicker';
import { R2VideoUploader } from '../R2VideoUploader';
import { storageService } from '../../../services/storageService';
import { 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Trash2, 
  GripVertical, 
  ChevronRight, 
  Sparkles, 
  Heart, 
  Video as VideoIcon, 
  FileText, 
  Download, 
  Image as ImageIcon, 
  AlignLeft, 
  Plus, 
  Play, 
  Pause, 
  Maximize2, 
  Eye, 
  PenTool, 
  BookOpen, 
  CheckSquare, 
  HelpCircle, 
  Award,
  Layers,
  FileCheck,
  Music,
  ExternalLink
} from 'lucide-react';

interface BlockEditorCardProps {
  block: LessonBlock;
  index: number;
  totalBlocks: number;
  onUpdateBlock: (updated: LessonBlock) => void;
  onMoveBlock: (direction: 'up' | 'down') => void;
  onDuplicateBlock: () => void;
  onDeleteBlock: () => void;
}

export const BlockEditorCard: React.FC<BlockEditorCardProps> = ({
  block,
  index,
  totalBlocks,
  onUpdateBlock,
  onMoveBlock,
  onDuplicateBlock,
  onDeleteBlock
}) => {
  const isCollapsed = block.isCollapsed ?? false;

  const handleContentChange = (field: string, value: any) => {
    onUpdateBlock({
      ...block,
      content: {
        ...block.content,
        [field]: value
      }
    });
  };

  const isHealingBlock = ['meditation', 'affirmation', 'reflection', 'journal', 'exercise', 'worksheet'].includes(block.type);

  return (
    <div className={`rounded-2xl border transition-all shadow-xs ${
      isHealingBlock 
        ? 'bg-[#EEF7F5]/50 border-[#C8E6E1] hover:border-[#287687]' 
        : 'bg-white border-[#E2F1EE] hover:border-[#C8E6E1]'
    }`}>
      {/* Top Header Controls Toolbar */}
      <div className="p-3 border-b border-[#E2F1EE] bg-white/80 rounded-t-2xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Drag Grip Handle Icon */}
          <div className="text-gray-400 cursor-grab active:cursor-grabbing p-1 hover:text-[#287687]">
            <GripVertical className="w-4 h-4" />
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#102A36] text-[#CBA258] flex items-center gap-1">
            {isHealingBlock && <Sparkles className="w-3 h-3 text-[#CBA258]" />}
            <span>Block #{index + 1}: {block.type}</span>
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Move Up */}
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMoveBlock('up')}
            className="p-1.5 rounded-lg text-gray-500 hover:text-[#287687] hover:bg-[#EEF7F5] disabled:opacity-30 cursor-pointer"
            title="Move Up"
          >
            <ChevronUp className="w-4 h-4" />
          </button>

          {/* Move Down */}
          <button
            type="button"
            disabled={index === totalBlocks - 1}
            onClick={() => onMoveBlock('down')}
            className="p-1.5 rounded-lg text-gray-500 hover:text-[#287687] hover:bg-[#EEF7F5] disabled:opacity-30 cursor-pointer"
            title="Move Down"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Duplicate */}
          <button
            type="button"
            onClick={onDuplicateBlock}
            className="p-1.5 rounded-lg text-gray-500 hover:text-[#287687] hover:bg-[#EEF7F5] cursor-pointer"
            title="Duplicate Block"
          >
            <Copy className="w-4 h-4" />
          </button>

          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => onUpdateBlock({ ...block, isCollapsed: !isCollapsed })}
            className="p-1.5 rounded-lg text-gray-500 hover:text-[#287687] hover:bg-[#EEF7F5] cursor-pointer"
            title={isCollapsed ? 'Expand Block' : 'Collapse Block'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={onDeleteBlock}
            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer ml-1"
            title="Delete Block"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Block Content Editor */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-4">

          {/* HEADING BLOCK */}
          {block.type === 'heading' && (
            <div className="space-y-3">
              <TextFormatToolbar
                level={block.content.level || 'h2'}
                alignment={block.content.alignment || 'left'}
                onChangeLevel={(lvl) => handleContentChange('level', lvl)}
                onChangeAlignment={(alg) => handleContentChange('alignment', alg)}
                showHeadings
              />
              <input
                type="text"
                value={block.content.text || ''}
                onChange={(e) => handleContentChange('text', e.target.value)}
                placeholder="Enter heading text..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#C8E6E1] bg-white text-base font-serif font-bold text-[#102A36] focus:outline-none focus:border-[#287687]"
              />
            </div>
          )}

          {/* PARAGRAPH & RICH TEXT */}
          {(block.type === 'paragraph' || block.type === 'rich-text') && (
            <div className="space-y-3">
              <TextFormatToolbar
                formatting={block.content.formatting}
                alignment={block.content.alignment}
                onChangeFormatting={(fmt) => handleContentChange('formatting', fmt)}
                onChangeAlignment={(alg) => handleContentChange('alignment', alg)}
              />
              <textarea
                rows={4}
                value={block.content.text || ''}
                onChange={(e) => handleContentChange('text', e.target.value)}
                placeholder="Write lesson text or formatted instructions here..."
                className="w-full px-4 py-3 rounded-xl border border-[#C8E6E1] bg-white text-xs text-[#102A36] leading-relaxed focus:outline-none focus:border-[#287687]"
              />
            </div>
          )}

          {/* QUOTE BLOCK */}
          {block.type === 'quote' && (
            <div className="space-y-3 p-4 rounded-xl bg-[#EEF7F5] border-l-4 border-[#CBA258]">
              <textarea
                rows={2}
                value={block.content.text || ''}
                onChange={(e) => handleContentChange('text', e.target.value)}
                placeholder="Enter quote text..."
                className="w-full px-3 py-2 rounded-lg border border-[#C8E6E1] bg-white text-xs font-serif italic text-[#102A36]"
              />
              <input
                type="text"
                value={block.content.caption || ''}
                onChange={(e) => handleContentChange('caption', e.target.value)}
                placeholder="Quote author (e.g. — Master Heer)"
                className="w-full px-3 py-1.5 rounded-lg border border-[#C8E6E1] bg-white text-xs font-bold text-[#287687]"
              />
            </div>
          )}

          {/* CALLOUT BOX */}
          {block.type === 'callout' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#102A36]">Variant:</span>
                {(['healing', 'info', 'warning', 'success'] as const).map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleContentChange('calloutVariant', v)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize cursor-pointer ${
                      block.content.calloutVariant === v
                        ? 'bg-[#102A36] text-[#CBA258]'
                        : 'bg-[#EEF7F5] text-[#287687]'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <textarea
                rows={2}
                value={block.content.text || ''}
                onChange={(e) => handleContentChange('text', e.target.value)}
                placeholder="Callout text message..."
                className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] bg-white text-xs font-medium text-[#102A36]"
              />
            </div>
          )}

          {/* DIVIDER */}
          {block.type === 'divider' && (
            <div className="py-2 flex items-center justify-center">
              <hr className="w-full border-t-2 border-dashed border-[#C8E6E1]" />
            </div>
          )}

          {/* MEDITATION BLOCK (HEAL WITH HEER SPECIAL) */}
          {block.type === 'meditation' && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#102A36] to-[#1C5B69] text-white space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-white/20 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#CBA258]">
                  <Heart className="w-4 h-4 text-[#CBA258]" />
                  <span>Meditation Audio Sanctuary Block</span>
                </div>
                <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-white/80">
                  Audio & Timer
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#CBA258] mb-1">
                    Meditation Title
                  </label>
                  <input
                    type="text"
                    value={block.content.title || ''}
                    onChange={(e) => handleContentChange('title', e.target.value)}
                    placeholder="e.g. Subconscious Serenity Alignment"
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#CBA258] mb-1">
                    Duration (e.g. 10:00)
                  </label>
                  <input
                    type="text"
                    value={block.content.meditationDuration || ''}
                    onChange={(e) => handleContentChange('meditationDuration', e.target.value)}
                    placeholder="10:00"
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <MediaPicker
                  value={block.content.meditationAudioUrl || ''}
                  onChange={(media) => handleContentChange('meditationAudioUrl', media?.url || '')}
                  acceptTypes={['audio']}
                  title="Upload Meditation Audio File"
                  description="Upload MP3 or WAV audio recording directly from your computer."
                />

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#CBA258] mb-1">
                    Audio Stream URL / Direct Link
                  </label>
                  <input
                    type="text"
                    value={block.content.meditationAudioUrl || ''}
                    onChange={(e) => handleContentChange('meditationAudioUrl', e.target.value)}
                    placeholder="https://.../meditation.mp3"
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#CBA258] mb-1">
                  Guided Instructions
                </label>
                <textarea
                  rows={2}
                  value={block.content.meditationInstructions || ''}
                  onChange={(e) => handleContentChange('meditationInstructions', e.target.value)}
                  placeholder="Guided instructions for posture and breathing..."
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Interactive Player Preview */}
              {block.content.meditationAudioUrl ? (
                <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs text-white">
                    <span className="font-bold">{block.content.title || 'Subconscious Meditation'}</span>
                    <span className="text-[#CBA258] font-mono text-[10px]">{block.content.meditationDuration || 'Audio Track'}</span>
                  </div>
                  <audio 
                    controls 
                    className="w-full h-8" 
                    src={storageService.getStorageUrl(block.content.meditationAudioUrl)}
                  >
                    Your browser does not support audio playback.
                  </audio>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-black/20 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#CBA258] text-[#102A36] flex items-center justify-center font-bold">
                      <Play className="w-5 h-5 fill-[#102A36] ml-0.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{block.content.title || 'Subconscious Meditation'}</span>
                      <span className="text-[10px] text-white/70">{block.content.meditationDuration || '10:00'} Guided Audio</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-white/50 italic">Upload audio file to preview</span>
                </div>
              )}
            </div>
          )}

          {/* AFFIRMATION BLOCK */}
          {block.type === 'affirmation' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Card Visual Theme
                  </label>
                  <select
                    value={block.content.affirmationStyle || 'golden'}
                    onChange={(e) => handleContentChange('affirmationStyle', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] text-xs font-bold bg-white"
                  >
                    <option value="golden">Golden Light</option>
                    <option value="twilight">Twilight Sanctuary</option>
                    <option value="emerald">Emerald Calm</option>
                    <option value="lotus">Lotus Rose</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                  Affirmation Text
                </label>
                <textarea
                  rows={2}
                  value={block.content.affirmationText || ''}
                  onChange={(e) => handleContentChange('affirmationText', e.target.value)}
                  placeholder="I am safe, anchored, and deeply receptive to my highest healing potential."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#C8E6E1] bg-white text-sm font-serif font-bold text-[#102A36]"
                />
              </div>

              {/* Live Preview Card */}
              <div className={`p-6 rounded-2xl text-center space-y-2 border shadow-xs ${
                block.content.affirmationStyle === 'twilight'
                  ? 'bg-[#102A36] text-white border-[#287687]'
                  : block.content.affirmationStyle === 'emerald'
                  ? 'bg-emerald-900 text-white border-emerald-700'
                  : block.content.affirmationStyle === 'lotus'
                  ? 'bg-rose-950 text-white border-rose-800'
                  : 'bg-gradient-to-r from-[#102A36] to-[#1C5B69] text-white border-[#CBA258]'
              }`}>
                <Sparkles className="w-5 h-5 text-[#CBA258] mx-auto" />
                <p className="font-serif italic text-base sm:text-lg max-w-md mx-auto leading-relaxed">
                  "{block.content.affirmationText || 'Affirmation statement'}"
                </p>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#CBA258] block pt-1">
                  Daily Subconscious Anchor
                </span>
              </div>
            </div>
          )}

          {/* REFLECTION & JOURNAL BLOCKS */}
          {(block.type === 'reflection' || block.type === 'journal') && (
            <div className="space-y-3 p-4 rounded-2xl bg-white border border-[#C8E6E1]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#287687]">
                {block.type === 'reflection' ? <PenTool className="w-4 h-4 text-[#CBA258]" /> : <BookOpen className="w-4 h-4 text-[#CBA258]" />}
                <span className="uppercase tracking-wider">{block.type === 'reflection' ? 'Private Reflection Prompt' : 'Journaling Prompt'}</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#486D7A] uppercase tracking-wider mb-1">
                  Question / Reflection Prompt
                </label>
                <textarea
                  rows={2}
                  value={block.content.prompt || ''}
                  onChange={(e) => handleContentChange('prompt', e.target.value)}
                  placeholder="Ask the student a deep self-reflection question..."
                  className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] text-xs font-medium bg-[#F7FCFA]"
                />
              </div>

              {/* Student Write-in Area Placeholder */}
              <div className="p-3 rounded-xl bg-[#EEF7F5] border border-dashed border-[#C8E6E1]">
                <span className="text-[10px] font-bold text-[#287687] block mb-1">Student Writing Space (Live LMS View):</span>
                <div className="w-full h-20 bg-white/60 rounded-lg p-2 text-xs text-gray-400 italic">
                  Students will write their private notes here. Words are saved automatically to their account profile.
                </div>
              </div>
            </div>
          )}

          {/* VIDEO BLOCK */}
          {block.type === 'video' && (
            <div className="space-y-4">
              {/* R2 HLS Video Transcoder Uploader */}
              <R2VideoUploader
                courseId="course_lms"
                lessonId={block.id}
                currentManifestKey={block.content.hls_manifest_key}
                onUploadSuccess={({ hlsManifestKey, storageProvider, durationSeconds }) => {
                  onUpdateBlock({
                    ...block,
                    content: {
                      ...block.content,
                      url: hlsManifestKey,
                      hls_manifest_key: hlsManifestKey,
                      storage_provider: storageProvider,
                      duration: durationSeconds ? `${Math.floor(durationSeconds / 60)}:${(durationSeconds % 60).toString().padStart(2, '0')}` : block.content.duration,
                    },
                  });
                }}
              />

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <MediaPicker
                  value={block.content.url || ''}
                  onChange={(media) => handleContentChange('url', media?.url || '')}
                  acceptTypes={['video']}
                  title="Upload Video File from Computer (R2/Direct)"
                  description="Upload your video file (MP4, WEBM) directly from your device, or paste a URL below."
                />

                <div className="pt-2 border-t border-slate-200">
                  <MediaPicker
                    value={block.content.thumbnailUrl || ''}
                    onChange={(media) => handleContentChange('thumbnailUrl', media?.url || '')}
                    acceptTypes={['image']}
                    title="Upload Video Thumbnail Image"
                    description="Upload a custom cover thumbnail image for the video player."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Video Stream / MP4 URL
                  </label>
                  <input
                    type="text"
                    value={block.content.url || ''}
                    onChange={(e) => handleContentChange('url', e.target.value)}
                    placeholder="https://.../video.mp4"
                    className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] text-xs font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Thumbnail Image URL
                  </label>
                  <input
                    type="text"
                    value={block.content.thumbnailUrl || ''}
                    onChange={(e) => handleContentChange('thumbnailUrl', e.target.value)}
                    placeholder="https://.../thumbnail.jpg"
                    className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] text-xs font-mono bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Duration (e.g. 12:45)
                  </label>
                  <input
                    type="text"
                    value={block.content.duration || ''}
                    onChange={(e) => handleContentChange('duration', e.target.value)}
                    placeholder="12:45"
                    className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] text-xs font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Caption Title
                  </label>
                  <input
                    type="text"
                    value={block.content.caption || ''}
                    onChange={(e) => handleContentChange('caption', e.target.value)}
                    placeholder="Guided Video Demonstration"
                    className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] text-xs font-bold bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                  Transcript Placeholder Text
                </label>
                <textarea
                  rows={2}
                  value={block.content.transcriptPlaceholder || ''}
                  onChange={(e) => handleContentChange('transcriptPlaceholder', e.target.value)}
                  placeholder="Full video transcript or lesson outline text..."
                  className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] text-xs bg-white"
                />
              </div>
            </div>
          )}

          {/* PDF BLOCK */}
          {block.type === 'pdf' && (
            <div className="space-y-3">
              <MediaPicker
                value={block.content.url || ''}
                onChange={(media) => handleContentChange('url', media?.url || '')}
                acceptTypes={['pdf', 'raw']}
                title="Upload PDF Document from Computer"
                description="Upload PDF worksheets, workbooks, or reading material."
              />

              <div>
                <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                  PDF Document URL / Upload Link
                </label>
                <input
                  type="text"
                  value={block.content.url || ''}
                  onChange={(e) => handleContentChange('url', e.target.value)}
                  placeholder="https://.../document.pdf"
                  className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] text-xs font-mono bg-white"
                />
              </div>

              {block.content.url && (
                <div className="p-3 bg-[#EEF7F5] rounded-xl border border-[#C8E6E1] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#102A36]">
                    <FileText className="w-4 h-4 text-rose-500" />
                    <span>PDF Document Ready</span>
                  </div>
                  <a
                    href={storageService.getStorageUrl(block.content.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-white border border-[#C8E6E1] rounded-lg text-xs font-bold text-[#287687] hover:bg-[#287687] hover:text-white transition-all flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Preview PDF
                  </a>
                </div>
              )}

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#102A36]">
                  <input
                    type="checkbox"
                    checked={block.content.downloadable ?? true}
                    onChange={(e) => handleContentChange('downloadable', e.target.checked)}
                    className="rounded text-[#287687]"
                  />
                  <span>Allow PDF Download</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#102A36]">
                  <input
                    type="checkbox"
                    checked={block.content.openFullScreen ?? true}
                    onChange={(e) => handleContentChange('openFullScreen', e.target.checked)}
                    className="rounded text-[#287687]"
                  />
                  <span>Full Screen Viewer Enabled</span>
                </label>
              </div>
            </div>
          )}

          {/* IMAGE BLOCK */}
          {block.type === 'image' && (
            <div className="space-y-3">
              <MediaPicker
                value={block.content.url || ''}
                onChange={(media) => handleContentChange('url', media?.url || '')}
                acceptTypes={['image']}
                title="Upload Image File from Computer"
                description="Drag and drop or select an image file (PNG, JPG, WEBP, SVG) from your device."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={block.content.url || ''}
                    onChange={(e) => handleContentChange('url', e.target.value)}
                    placeholder="https://.../image.jpg"
                    className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] text-xs font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Caption / Alt Text
                  </label>
                  <input
                    type="text"
                    value={block.content.caption || ''}
                    onChange={(e) => handleContentChange('caption', e.target.value)}
                    placeholder="Image description..."
                    className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] text-xs bg-white"
                  />
                </div>
              </div>

              {block.content.url && (
                <div className="rounded-xl overflow-hidden border border-[#C8E6E1] max-h-48 bg-slate-900 flex items-center justify-center">
                  <img
                    src={storageService.getStorageUrl(block.content.url)}
                    alt={block.content.caption || 'Preview'}
                    className="max-h-48 object-contain"
                  />
                </div>
              )}
            </div>
          )}

          {/* GALLERY BLOCK */}
          {block.type === 'gallery' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                  Add Image to Gallery
                </label>
                <MediaPicker
                  value=""
                  onChange={(media) => {
                    if (media?.url) {
                      const newImages = [...(block.content.images || []), { id: 'img_' + Date.now(), url: media.url, caption: media.title || '' }];
                      handleContentChange('images', newImages);
                    }
                  }}
                  acceptTypes={['image']}
                  title="Upload Gallery Image"
                  description="Upload images to display in the student multi-image gallery."
                />
              </div>

              {/* Gallery List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#102A36] uppercase tracking-wider block">
                  Gallery Photos ({(block.content.images || []).length})
                </span>
                
                {(block.content.images || []).length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-400">
                    No images added to gallery yet. Use the uploader above.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(block.content.images || []).map((img, i) => (
                      <div key={img.id || i} className="p-2 bg-white rounded-xl border border-[#C8E6E1] space-y-2">
                        <div className="h-28 rounded-lg overflow-hidden bg-slate-900 relative">
                          <img
                            src={storageService.getStorageUrl(img.url)}
                            alt={img.caption || `Gallery photo ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = (block.content.images || []).filter((_, idx) => idx !== i);
                              handleContentChange('images', newImages);
                            }}
                            className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md hover:bg-rose-700 shadow-sm"
                            title="Remove Photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={img.caption || ''}
                          onChange={(e) => {
                            const newImages = [...(block.content.images || [])];
                            newImages[i].caption = e.target.value;
                            handleContentChange('images', newImages);
                          }}
                          placeholder="Photo caption..."
                          className="w-full px-2 py-1 border border-[#C8E6E1] rounded-lg text-xs"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AUDIO BLOCK */}
          {block.type === 'audio' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Audio Title
                  </label>
                  <input
                    type="text"
                    value={block.content.title || ''}
                    onChange={(e) => handleContentChange('title', e.target.value)}
                    placeholder="e.g. Daily Energetic Centering"
                    className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] text-xs font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Duration (e.g. 12:30)
                  </label>
                  <input
                    type="text"
                    value={block.content.duration || ''}
                    onChange={(e) => handleContentChange('duration', e.target.value)}
                    placeholder="12:30"
                    className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] text-xs font-bold bg-white"
                  />
                </div>
              </div>

              <MediaPicker
                value={block.content.url || ''}
                onChange={(media) => handleContentChange('url', media?.url || '')}
                acceptTypes={['audio']}
                title="Upload Audio File from Computer"
                description="Upload MP3, WAV, AAC, or M4A audio recording."
              />

              <div>
                <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                  Audio Stream URL / Direct Link
                </label>
                <input
                  type="text"
                  value={block.content.url || ''}
                  onChange={(e) => handleContentChange('url', e.target.value)}
                  placeholder="https://.../audio.mp3"
                  className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] text-xs font-mono bg-white"
                />
              </div>

              {block.content.url && (
                <div className="p-3 bg-[#EEF7F5] rounded-xl border border-[#C8E6E1] space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#102A36] font-bold">
                    <span>{block.content.title || 'Audio Recording'}</span>
                    <span className="text-[#287687] font-mono">{block.content.duration || 'Audio Track'}</span>
                  </div>
                  <audio
                    controls
                    className="w-full h-8"
                    src={storageService.getStorageUrl(block.content.url)}
                  >
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}
            </div>
          )}

          {/* DOWNLOAD BLOCK */}
          {block.type === 'download' && (
            <div className="space-y-3 p-4 rounded-xl bg-[#EEF7F5] border border-[#C8E6E1]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    Resource Title
                  </label>
                  <input
                    type="text"
                    value={block.content.title || ''}
                    onChange={(e) => handleContentChange('title', e.target.value)}
                    placeholder="e.g. Subconscious Worksheet.pdf"
                    className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] text-xs font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                    File Size (e.g. 2.4 MB)
                  </label>
                  <input
                    type="text"
                    value={block.content.fileSize || ''}
                    onChange={(e) => handleContentChange('fileSize', e.target.value)}
                    placeholder="2.4 MB"
                    className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] text-xs font-bold bg-white"
                  />
                </div>
              </div>

              <MediaPicker
                value={block.content.url || ''}
                onChange={(media) => {
                  if (media?.url) {
                    handleContentChange('url', media.url);
                    if (media.size) {
                      const sizeInMb = (media.size / (1024 * 1024)).toFixed(1) + ' MB';
                      handleContentChange('fileSize', sizeInMb);
                    }
                    if (media.title && !block.content.title) {
                      handleContentChange('title', media.title);
                    }
                  }
                }}
                acceptTypes={['pdf', 'raw', 'image', 'audio']}
                title="Upload Downloadable File from Computer"
                description="Upload ZIP, PDF, DOCX, workbook, or audio files for students to download."
              />

              <div>
                <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                  File Download URL / Direct Link
                </label>
                <input
                  type="text"
                  value={block.content.url || ''}
                  onChange={(e) => handleContentChange('url', e.target.value)}
                  placeholder="https://.../resource.zip"
                  className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] text-xs font-mono bg-white"
                />
              </div>

              {block.content.url && (
                <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-[#C8E6E1]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#102A36]">
                    <Download className="w-4 h-4 text-[#287687]" />
                    <span>{block.content.title || 'Download Resource'} ({block.content.fileSize || 'Direct Link'})</span>
                  </div>
                  <a
                    href={storageService.getStorageUrl(block.content.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="px-3 py-1 bg-[#287687] text-white rounded-lg text-xs font-bold hover:bg-[#205e6c] transition-all"
                  >
                    Test Download
                  </a>
                </div>
              )}
            </div>
          )}

          {/* WORKSHEET BLOCK */}
          {block.type === 'worksheet' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                  Worksheet Title
                </label>
                <input
                  type="text"
                  value={block.content.title || ''}
                  onChange={(e) => handleContentChange('title', e.target.value)}
                  placeholder="e.g. Subconscious Repatterning Daily Worksheet"
                  className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] text-xs font-bold bg-white"
                />
              </div>

              <MediaPicker
                value={block.content.worksheetFileUrl || block.content.url || ''}
                onChange={(media) => {
                  handleContentChange('worksheetFileUrl', media?.url || '');
                  handleContentChange('url', media?.url || '');
                }}
                acceptTypes={['pdf', 'raw']}
                title="Upload Worksheet PDF Document"
                description="Upload printable or fillable PDF worksheet."
              />

              <div>
                <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                  Instructions / Description
                </label>
                <textarea
                  rows={2}
                  value={block.content.caption || block.content.text || ''}
                  onChange={(e) => handleContentChange('caption', e.target.value)}
                  placeholder="Print or complete this worksheet before continuing to the next lesson..."
                  className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] text-xs bg-white"
                />
              </div>
            </div>
          )}

          {/* ASSIGNMENT BLOCK */}
          {block.type === 'assignment' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                  Assignment Title
                </label>
                <input
                  type="text"
                  value={block.content.title || ''}
                  onChange={(e) => handleContentChange('title', e.target.value)}
                  placeholder="e.g. Weekly Reflection & Energy Case Study"
                  className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] text-xs font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                  Assignment Prompt & Submission Guidelines
                </label>
                <textarea
                  rows={3}
                  value={block.content.assignmentInstructions || block.content.text || ''}
                  onChange={(e) => handleContentChange('assignmentInstructions', e.target.value)}
                  placeholder="Describe the assignment requirements for students..."
                  className="w-full px-3 py-2 rounded-xl border border-[#C8E6E1] text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A36] uppercase tracking-wider mb-1">
                  Optional Assignment Template or Guide File
                </label>
                <MediaPicker
                  value={block.content.url || ''}
                  onChange={(media) => handleContentChange('url', media?.url || '')}
                  acceptTypes={['pdf', 'raw', 'image']}
                  title="Upload Assignment Template / Starter File"
                  description="Upload PDF or document template for students to complete."
                />
              </div>
            </div>
          )}

          {/* CHECKLIST BLOCK */}
          {block.type === 'checklist' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#102A36] uppercase tracking-wider block">
                Interactive Checklist Items
              </span>
              {(block.content.items || []).map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => {
                      const newItems = [...(block.content.items || [])];
                      newItems[idx].text = e.target.value;
                      handleContentChange('items', newItems);
                    }}
                    placeholder={`Checklist item #${idx + 1}`}
                    className="flex-1 px-3 py-2 rounded-xl border border-[#C8E6E1] text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newItems = (block.content.items || []).filter((_, i) => i !== idx);
                      handleContentChange('items', newItems);
                    }}
                    className="p-2 text-gray-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newItems = [...(block.content.items || []), { id: 'c_' + Date.now(), text: '', completed: false }];
                  handleContentChange('items', newItems);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#EEF7F5] text-[#287687] text-xs font-bold hover:bg-[#287687] hover:text-white transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Checklist Item</span>
              </button>
            </div>
          )}

          {/* DEFAULT FALLBACK FOR OTHER TYPES */}
          {!['heading', 'paragraph', 'rich-text', 'quote', 'callout', 'divider', 'meditation', 'affirmation', 'reflection', 'journal', 'video', 'pdf', 'image', 'gallery', 'audio', 'download', 'worksheet', 'assignment', 'checklist'].includes(block.type) && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-xs font-bold text-[#102A36] uppercase tracking-wider block">
                {block.type.toUpperCase()} Block Settings
              </span>
              <textarea
                rows={2}
                value={block.content.text || block.content.title || ''}
                onChange={(e) => handleContentChange('text', e.target.value)}
                placeholder={`Edit ${block.type} block configuration...`}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"
              />
            </div>
          )}

        </div>
      )}
    </div>
  );
};
