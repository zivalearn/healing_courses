import React from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  List, 
  ListOrdered, 
  Highlighter, 
  Heading1, 
  Heading2, 
  Heading3, 
  Undo, 
  Redo, 
  Link as LinkIcon 
} from 'lucide-react';

interface TextFormatToolbarProps {
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    highlight?: string;
  };
  alignment?: 'left' | 'center' | 'right' | 'justify';
  level?: 'h1' | 'h2' | 'h3' | 'h4';
  onChangeFormatting?: (formatting: any) => void;
  onChangeAlignment?: (alignment: 'left' | 'center' | 'right' | 'justify') => void;
  onChangeLevel?: (level: 'h1' | 'h2' | 'h3' | 'h4') => void;
  showHeadings?: boolean;
}

export const TextFormatToolbar: React.FC<TextFormatToolbarProps> = ({
  formatting,
  alignment = 'left',
  level = 'h2',
  onChangeFormatting,
  onChangeAlignment,
  onChangeLevel,
  showHeadings = false
}) => {
  const activeFmt = formatting || {};
  return (
    <div className="flex flex-wrap items-center gap-1 p-1.5 bg-[#EEF7F5] border border-[#C8E6E1] rounded-xl text-xs">
      {/* Headings Switcher */}
      {showHeadings && onChangeLevel && (
        <div className="flex items-center gap-1 border-r border-[#C8E6E1] pr-1.5 mr-1">
          {(['h1', 'h2', 'h3', 'h4'] as const).map(h => (
            <button
              key={h}
              type="button"
              onClick={() => onChangeLevel(h)}
              className={`px-2 py-1 rounded-md font-bold uppercase text-[10px] cursor-pointer transition-colors ${
                level === h ? 'bg-[#287687] text-white' : 'text-[#287687] hover:bg-white'
              }`}
            >
              {h.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Bold, Italic, Underline */}
      {onChangeFormatting && (
        <div className="flex items-center gap-1 border-r border-[#C8E6E1] pr-1.5 mr-1">
          <button
            type="button"
            onClick={() => onChangeFormatting({ ...activeFmt, bold: !activeFmt.bold })}
            className={`p-1.5 rounded-md cursor-pointer transition-colors ${
              activeFmt.bold ? 'bg-[#287687] text-white' : 'text-[#102A36] hover:bg-white'
            }`}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onChangeFormatting({ ...activeFmt, italic: !activeFmt.italic })}
            className={`p-1.5 rounded-md cursor-pointer transition-colors ${
              activeFmt.italic ? 'bg-[#287687] text-white' : 'text-[#102A36] hover:bg-white'
            }`}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onChangeFormatting({ ...activeFmt, underline: !activeFmt.underline })}
            className={`p-1.5 rounded-md cursor-pointer transition-colors ${
              activeFmt.underline ? 'bg-[#287687] text-white' : 'text-[#102A36] hover:bg-white'
            }`}
            title="Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onChangeFormatting({ ...activeFmt, highlight: activeFmt.highlight ? '' : '#FEF08A' })}
            className={`p-1.5 rounded-md cursor-pointer transition-colors ${
              activeFmt.highlight ? 'bg-[#CBA258] text-[#102A36]' : 'text-[#102A36] hover:bg-white'
            }`}
            title="Highlight Text"
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Alignment */}
      {onChangeAlignment && (
        <div className="flex items-center gap-1 border-r border-[#C8E6E1] pr-1.5 mr-1">
          <button
            type="button"
            onClick={() => onChangeAlignment('left')}
            className={`p-1.5 rounded-md cursor-pointer transition-colors ${
              alignment === 'left' ? 'bg-[#287687] text-white' : 'text-[#102A36] hover:bg-white'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onChangeAlignment('center')}
            className={`p-1.5 rounded-md cursor-pointer transition-colors ${
              alignment === 'center' ? 'bg-[#287687] text-white' : 'text-[#102A36] hover:bg-white'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onChangeAlignment('right')}
            className={`p-1.5 rounded-md cursor-pointer transition-colors ${
              alignment === 'right' ? 'bg-[#287687] text-white' : 'text-[#102A36] hover:bg-white'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onChangeAlignment('justify')}
            className={`p-1.5 rounded-md cursor-pointer transition-colors ${
              alignment === 'justify' ? 'bg-[#287687] text-white' : 'text-[#102A36] hover:bg-white'
            }`}
            title="Justify"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Undo / Redo Placeholders */}
      <div className="flex items-center gap-1 text-[#287687]">
        <button
          type="button"
          className="p-1.5 rounded-md hover:bg-white text-[#486D7A] cursor-pointer"
          title="Undo"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className="p-1.5 rounded-md hover:bg-white text-[#486D7A] cursor-pointer"
          title="Redo"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
