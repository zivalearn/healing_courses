import React, { useState } from 'react';
import { ZivaBlockType } from '../types';
import {
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Sparkles,
  HelpCircle,
  Download,
  CheckSquare,
  AlertCircle,
  Code,
  FolderTree,
  Quote,
  Search,
  X,
  Plus
} from 'lucide-react';

interface ZivaBlockPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlock: (type: ZivaBlockType) => void;
}

interface BlockOption {
  type: ZivaBlockType;
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
  colorClass: string;
}

interface BlockCategory {
  title: string;
  options: BlockOption[];
}

const BLOCK_CATEGORIES: BlockCategory[] = [
  {
    title: 'Core Media & Video',
    options: [
      {
        type: 'video',
        label: 'Video Masterclass Player',
        description: 'Upload video to Cloudflare R2 with custom poster, adaptive HLS & duration',
        icon: Video,
        badge: 'R2 Video + Poster',
        colorClass: 'text-pink-500 bg-pink-500/10 border-pink-500/30',
      },
      {
        type: 'audio',
        label: 'Audio Exercise Stream',
        description: 'Guided vocal coaching, voice modulation & resonance audio track',
        icon: Music,
        badge: 'Audio',
        colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      },
      {
        type: 'image',
        label: 'Single Visual Diagram',
        description: 'High-resolution diagram, posture guide or executive framework image',
        icon: ImageIcon,
        colorClass: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      },
      {
        type: 'gallery',
        label: 'Multi-Image Gallery Grid',
        description: 'Curated array of executive presence visuals & stage photos via R2',
        icon: Sparkles,
        badge: 'Gallery',
        colorClass: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      },
    ],
  },
  {
    title: 'Text & Executive Knowledge',
    options: [
      {
        type: 'paragraph',
        label: 'Text & Narrative Instruction',
        description: 'Rich explanatory paragraphs, stage psychology & framework concepts',
        icon: FileText,
        colorClass: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      },
      {
        type: 'quote',
        label: 'Executive Mindset Quote',
        description: 'Highlighted inspirational executive quote with gold styling & attribution',
        icon: Quote,
        badge: 'Spotlight',
        colorClass: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
      },
      {
        type: 'callout',
        label: 'Principle & Warning Callout',
        description: 'Tip, warning, success, or executive principle emphasis box',
        icon: AlertCircle,
        colorClass: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
      },
      {
        type: 'accordion',
        label: 'Expandable Frameworks & FAQ',
        description: 'Collapsible sections for deep-dive questions and objection handling',
        icon: FolderTree,
        colorClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      },
      {
        type: 'code',
        label: 'Framework Syntax / Scripting',
        description: 'Formatted communication templates, syntax & scripts',
        icon: Code,
        colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      },
    ],
  },
  {
    title: 'Practical Tasks & Downloads',
    options: [
      {
        type: 'worksheet',
        label: 'Practical Action Worksheet',
        description: 'Task instructions, downloadable template file & student reflection area',
        icon: CheckSquare,
        badge: 'Action Task',
        colorClass: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
      },
      {
        type: 'quiz',
        label: 'Assessment Quiz',
        description: 'Multi-question interactive test with scoring, options & explanations',
        icon: HelpCircle,
        badge: 'Assessment',
        colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      },
      {
        type: 'checklist',
        label: 'Action Items Checklist',
        description: 'Interactive checkbox list for daily habit reinforcement & practice steps',
        icon: CheckSquare,
        colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      },
      {
        type: 'attachment',
        label: 'Downloadable PDF / Workbook',
        description: 'Executive PDF guide, speech blueprint or workbook resource via R2',
        icon: Download,
        badge: 'Download',
        colorClass: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      },
    ],
  },
];

export const ZivaBlockPickerModal: React.FC<ZivaBlockPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectBlock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredCategories = BLOCK_CATEGORIES.map((cat) => ({
    ...cat,
    options: cat.options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opt.type.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((cat) => cat.options.length > 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-neutral-950 border border-gray-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white my-auto">
        {/* HEADER */}
        <div className="bg-black border-b border-gray-900 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#FF2E93]/20 border border-pink-500/40 rounded-xl text-pink-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-pink-500">
                Lesson Content Library
              </span>
              <h2 className="text-base font-serif font-bold text-amber-300">
                Choose Content Block Type
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-neutral-900 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="p-4 sm:px-6 bg-black/50 border-b border-gray-900">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search content block types (video, quiz, worksheet, checklist, quote)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-900 border border-gray-800 text-white text-xs pl-10 pr-4 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-[#FF2E93]"
              autoFocus
            />
          </div>
        </div>

        {/* LIST */}
        <div className="p-6 overflow-y-auto space-y-6 max-h-[calc(90vh-140px)]">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => (
              <div key={cat.title} className="space-y-3">
                <h3 className="text-xs font-serif font-bold text-amber-300 uppercase tracking-wider border-b border-gray-900 pb-1.5">
                  {cat.title}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cat.options.map((opt) => {
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.type}
                        onClick={() => {
                          onSelectBlock(opt.type);
                          onClose();
                        }}
                        className="text-left p-4 rounded-2xl bg-black border border-gray-800/80 hover:border-[#FF2E93] hover:bg-neutral-900/60 transition-all flex items-start gap-3.5 group cursor-pointer"
                      >
                        <div className={`p-2.5 rounded-xl border shrink-0 ${opt.colorClass}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-white group-hover:text-[#FF2E93] transition-colors line-clamp-1">
                              {opt.label}
                            </span>
                            {opt.badge && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-neutral-900 text-amber-300 border border-gray-800 shrink-0">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                            {opt.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-gray-500 text-xs">
              No matching content blocks found for "{searchTerm}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
