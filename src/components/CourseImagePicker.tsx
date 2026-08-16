import React, { useState, useEffect, useRef } from 'react';
import { 
  BUILTIN_IMAGE_PRESETS, 
  getCustomPresets, 
  saveCustomPreset, 
  deleteCustomPreset, 
  sanitizeImageUrl, 
  compressBase64Image,
  ImagePreset, 
  DEFAULT_COURSE_IMAGE 
} from '../utils/imageUtils';
import { 
  ImageIcon, Upload, Trash2, Check, Sparkles
} from 'lucide-react';

interface CourseImagePickerProps {
  selectedUrl: string;
  onSelectUrl: (url: string) => void;
}

export const CourseImagePicker: React.FC<CourseImagePickerProps> = ({ selectedUrl, onSelectUrl }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [customPresets, setCustomPresets] = useState<ImagePreset[]>([]);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCustomPresets(getCustomPresets());
  }, []);

  const categories = [
    'All',
    'Meditation',
    'Energy & Reiki',
    'Crystals & Chakras',
    'Sound & Vibration',
    'Subconscious & NLP',
    'Akashic Records',
    'Spiritual & Celestial',
    'Nature & Somatic',
    'My Uploads'
  ];

  const allPresets = [...customPresets, ...BUILTIN_IMAGE_PRESETS];

  const filteredPresets = activeCategory === 'All'
    ? allPresets
    : activeCategory === 'My Uploads'
      ? customPresets
      : allPresets.filter(p => p.category === activeCategory);

  // Handle Local File Upload from PC / Phone
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    setUploadSuccessMsg('Optimizing & compressing image for instant saving...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        // Compress image to prevent localStorage quota errors
        const compressedUrl = await compressBase64Image(base64Url, 1000, 1000, 0.82);
        
        onSelectUrl(compressedUrl);
        
        // Save to custom presets automatically
        const presetName = file.name.replace(/\.[^/.]+$/, "") || 'Uploaded Image';
        saveCustomPreset({
          label: presetName,
          category: 'My Uploads',
          url: compressedUrl
        });
        
        const updated = getCustomPresets();
        setCustomPresets(updated);
        setActiveCategory('My Uploads');
        setUploadSuccessMsg(`Uploaded "${presetName}" & applied! Compressed & saved in My Uploads.`);
        setTimeout(() => setUploadSuccessMsg(null), 5000);
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete Custom Preset
  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCustomPreset(id);
    setCustomPresets(getCustomPresets());
  };

  return (
    <div className="space-y-4 p-4 rounded-2xl bg-gray-50/80 border border-[#C8E6E1]">
      {/* Header & Quick Upload Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div>
          <label className="text-xs font-bold text-[#102A36] uppercase tracking-wider flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-[#287687]" />
            <span>Course Photo & Image Gallery</span>
          </label>
          <p className="text-[11px] text-[#486D7A] mt-0.5">
            Select a photo from our gallery or upload an image directly from your computer/device.
          </p>
        </div>

        {/* Upload Button */}
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-[#287687] text-white hover:bg-[#102A36] text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#CBA258]" />
            <span>Upload Photo From Device</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      </div>

      {/* Notification Toast */}
      {uploadSuccessMsg && (
        <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{uploadSuccessMsg}</span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-medium">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === cat
                ? 'bg-[#102A36] text-white font-bold shadow-xs'
                : 'bg-white text-[#486D7A] hover:bg-[#E2F1EE] border border-gray-200'
            }`}
          >
            {cat} {cat === 'My Uploads' && customPresets.length > 0 && `(${customPresets.length})`}
          </button>
        ))}
      </div>

      {/* Thumbnail Gallery Grid */}
      <div className="max-h-56 overflow-y-auto pr-1">
        {filteredPresets.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
            No uploaded photos yet. Click <strong>"Upload Photo From Device"</strong> above to add your own image!
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
            {filteredPresets.map((item) => {
              const isSelected = selectedUrl === item.url || selectedUrl === sanitizeImageUrl(item.url);
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectUrl(item.url)}
                  className={`group relative h-20 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#287687] ring-2 ring-teal-400 shadow-md scale-[1.02]'
                      : 'border-white hover:border-[#C8E6E1] opacity-85 hover:opacity-100'
                  }`}
                  title={item.label}
                >
                  <img
                    src={sanitizeImageUrl(item.url)}
                    alt={item.label}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_COURSE_IMAGE;
                    }}
                  />
                  
                  {/* Title overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1 text-[9px] text-white truncate font-medium group-hover:opacity-100 opacity-90 transition-opacity">
                    {item.label}
                  </div>

                  {/* Selection Checkmark Badge */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#287687] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Delete Button for Custom Uploaded Presets */}
                  {item.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => handleDeletePreset(item.id, e)}
                      className="absolute top-1 left-1 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                      title="Delete uploaded image"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Image Banner Preview */}
      {selectedUrl && (
        <div className="p-3 rounded-xl bg-white border border-[#C8E6E1] flex items-center gap-3 shadow-xs">
          <div className="w-20 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0 relative border border-gray-200">
            <img
              src={sanitizeImageUrl(selectedUrl)}
              alt="Active Selection"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = DEFAULT_COURSE_IMAGE;
              }}
            />
          </div>
          <div className="text-xs text-[#102A36] flex-1 min-w-0 leading-tight">
            <span className="font-bold block text-teal-800 flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-teal-600" />
              <span>Selected Course Photo Active</span>
            </span>
            <span className="text-[10px] text-gray-500 truncate block mt-0.5">
              {selectedUrl.startsWith('data:image/') ? 'Local uploaded photo' : 'Selected from gallery preset'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
