import React, { useState } from 'react';
import { BlockType } from '../../../models/builder';
import { 
  Type, 
  AlignLeft, 
  Heading as HeadingIcon, 
  Quote as QuoteIcon, 
  Minus, 
  Image as ImageIcon, 
  Images, 
  Video as VideoIcon, 
  Music, 
  FileText, 
  Download, 
  CheckSquare, 
  AlertCircle, 
  ListOrdered, 
  FolderTree, 
  ExternalLink, 
  Code, 
  Heart, 
  Sparkles, 
  PenTool, 
  BookOpen, 
  Dumbbell, 
  FileCheck, 
  HelpCircle, 
  CheckCircle2, 
  Award, 
  Search, 
  X,
  Layers
} from 'lucide-react';

interface BlockPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlock: (type: BlockType) => void;
}

interface BlockOption {
  type: BlockType;
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
  healingSpecial?: boolean;
}

interface BlockGroup {
  category: string;
  options: BlockOption[];
}

const BLOCK_GROUPS: BlockGroup[] = [
  {
    category: 'Heal With Heer Specials',
    options: [
      { type: 'meditation', label: 'Meditation Player', description: 'Calming audio player with background visuals & duration', icon: Heart, healingSpecial: true, badge: 'Popular' },
      { type: 'affirmation', label: 'Affirmation Card', description: 'Beautiful styled affirmation card with gold/twilight themes', icon: Sparkles, healingSpecial: true },
      { type: 'reflection', label: 'Reflection Box', description: 'Private writing area for student self-introspection', icon: PenTool, healingSpecial: true },
      { type: 'journal', label: 'Journal Prompt', description: 'Subconscious journaling exercise with live word count', icon: BookOpen, healingSpecial: true },
      { type: 'exercise', label: 'Practical Exercise', description: 'Step-by-step physical or somatic exercise guide', icon: Dumbbell, healingSpecial: true },
      { type: 'worksheet', label: 'Worksheet File', description: 'Downloadable or digital self-reflection worksheet', icon: FileCheck, healingSpecial: true }
    ]
  },
  {
    category: 'Typography & Structure',
    options: [
      { type: 'heading', label: 'Heading', description: 'H1, H2, H3, or H4 section titles', icon: HeadingIcon },
      { type: 'paragraph', label: 'Paragraph', description: 'Clean body text block for course concepts', icon: AlignLeft },
      { type: 'rich-text', label: 'Rich Text', description: 'Formatted text with lists, bolding and links', icon: Type },
      { type: 'quote', label: 'Block Quote', description: 'Emphasized inspirational or expert quote', icon: QuoteIcon },
      { type: 'callout', label: 'Callout Box', description: 'Highlighted info, warning, or tip box', icon: AlertCircle },
      { type: 'divider', label: 'Divider Line', description: 'Visual horizontal line separator', icon: Minus }
    ]
  },
  {
    category: 'Media & Documents',
    options: [
      { type: 'video', label: 'Video Player', description: 'Embed video with thumbnail, duration & transcript', icon: VideoIcon, badge: 'Video' },
      { type: 'audio', label: 'Audio Stream', description: 'Streamable audio lesson or lecture', icon: Music },
      { type: 'image', label: 'Single Image', description: 'High-res image with caption & rounded styling', icon: ImageIcon },
      { type: 'gallery', label: 'Image Gallery', description: 'Grid array of practice photos & diagrams', icon: Images },
      { type: 'pdf', label: 'PDF Viewer', description: 'Embedded PDF viewer with download & fullscreen toggle', icon: FileText },
      { type: 'download', label: 'Download File', description: 'File attachment button with size indicator', icon: Download }
    ]
  },
  {
    category: 'Interactive Elements',
    options: [
      { type: 'checklist', label: 'Interactive Checklist', description: 'Student checklist for action items', icon: CheckSquare },
      { type: 'accordion', label: 'Accordion / FAQ', description: 'Expandable Q&A or collapsible content', icon: FolderTree },
      { type: 'tabs', label: 'Tabbed Sections', description: 'Multi-tab content switcher', icon: Layers },
      { type: 'button', label: 'Call To Action Button', description: 'External link or zoom button', icon: ExternalLink },
      { type: 'embed', label: 'Web Embed', description: 'Embed external iframe or resource', icon: Code }
    ]
  },
  {
    category: 'Assessments & Completion',
    options: [
      { type: 'assignment', label: 'Assignment Box', description: 'Homework submission instructions', icon: FileCheck },
      { type: 'quiz', label: 'Quiz Placeholder', description: 'Knowledge check assessment placeholder', icon: HelpCircle, badge: 'Placeholder' },
      { type: 'completion', label: 'Completion Card', description: 'Lesson completion badge & celebration message', icon: CheckCircle2 },
      { type: 'certificate', label: 'Certificate Placeholder', description: 'Accredited certificate award placeholder', icon: Award, badge: 'Placeholder' }
    ]
  }
];

export const BlockPickerModal: React.FC<BlockPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectBlock
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#C8E6E1] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-[#C8E6E1] bg-[#102A36] text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#CBA258]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Block Library</span>
            </div>
            <h3 className="font-serif font-bold text-lg text-white">Add Content Block</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-[#EEF7F5] bg-[#F7FCFA]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#287687] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blocks (e.g., video, meditation, journal, pdf)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-[#C8E6E1] bg-white focus:outline-none focus:border-[#287687]"
              autoFocus
            />
          </div>
        </div>

        {/* Blocks Grid List */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {BLOCK_GROUPS.map((group) => {
            const filteredOptions = group.options.filter(opt => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return opt.label.toLowerCase().includes(q) || opt.description.toLowerCase().includes(q) || opt.type.toLowerCase().includes(q);
            });

            if (filteredOptions.length === 0) return null;

            return (
              <div key={group.category} className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#287687] flex items-center gap-1.5">
                  <span>{group.category}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.type}
                        onClick={() => {
                          onSelectBlock(opt.type);
                          onClose();
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 group cursor-pointer ${
                          opt.healingSpecial
                            ? 'bg-[#EEF7F5]/80 hover:bg-[#287687] hover:text-white border-[#C8E6E1]'
                            : 'bg-white hover:bg-[#287687] hover:text-white border-[#E2F1EE] shadow-2xs'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          opt.healingSpecial
                            ? 'bg-[#102A36] text-[#CBA258] group-hover:bg-white group-hover:text-[#102A36]'
                            : 'bg-[#EEF7F5] text-[#287687] group-hover:bg-white group-hover:text-[#287687]'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs truncate group-hover:text-white text-[#102A36]">
                              {opt.label}
                            </span>
                            {opt.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#CBA258] text-[#102A36] shrink-0">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] opacity-80 group-hover:text-white/90 line-clamp-2 mt-0.5 text-[#486D7A]">
                            {opt.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
