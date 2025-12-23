
import React, { useState, useMemo } from 'react';
import { X, Check, Play, Square, CheckSquare, Save } from 'lucide-react';
import { Brand, Slide } from '../types';

interface SlideSelectorProps {
  brands: Brand[];
  initialSelectedIds?: string[];
  onConfirm: (selection: { slide: Slide; brand: Brand }[], savePreference: boolean) => void;
  onCancel: () => void;
  title?: string;
  canSave?: boolean;
}

const SlideSelector: React.FC<SlideSelectorProps> = ({ brands, initialSelectedIds = [], onConfirm, onCancel, title, canSave = false }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [savePreference, setSavePreference] = useState(false);

  const toggleSlide = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleBrand = (brand: Brand) => {
    const brandSlideIds = brand.slides.map(s => s.id);
    const allSelected = brandSlideIds.every(id => selectedIds.has(id));
    
    const newSet = new Set(selectedIds);
    if (allSelected) {
      brandSlideIds.forEach(id => newSet.delete(id));
    } else {
      brandSlideIds.forEach(id => newSet.add(id));
    }
    setSelectedIds(newSet);
  };

  const handleConfirm = () => {
    const selection: { slide: Slide; brand: Brand }[] = [];
    // Preserve order: iterate through brands and slides as displayed
    brands.forEach(brand => {
      brand.slides.forEach(slide => {
        if (selectedIds.has(slide.id)) {
          selection.push({ slide, brand });
        }
      });
    });
    onConfirm(selection, savePreference);
  };

  const totalSlides = useMemo(() => brands.reduce((acc, b) => acc + b.slides.length, 0), [brands]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-800">{title || "Select Slides"}</h2>
            <p className="text-xs md:text-sm text-slate-500">
              Selected {selectedIds.size} of {totalSlides} slides
            </p>
          </div>
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 custom-scrollbar">
          <div className="space-y-6 md:space-y-8">
            {brands.map((brand) => (
              <div key={brand.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div 
                  className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleBrand(brand)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-indigo-600 ${brand.slides.every(s => selectedIds.has(s.id)) ? 'opacity-100' : 'opacity-40'}`}>
                      {brand.slides.every(s => selectedIds.has(s.id)) 
                        ? <CheckSquare className="w-5 h-5" /> 
                        : <Square className="w-5 h-5" />
                      }
                    </div>
                    <span className="font-bold text-slate-700">{brand.name}</span>
                    <span className="text-xs text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded-full border border-slate-200">
                      {brand.slides.length} slides
                    </span>
                  </div>
                </div>
                
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {brand.slides.map((slide) => {
                    const isSelected = selectedIds.has(slide.id);
                    return (
                      <div 
                        key={slide.id}
                        onClick={() => toggleSlide(slide.id)}
                        className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                          isSelected 
                          ? 'border-indigo-600 ring-2 ring-indigo-100' 
                          : 'border-transparent hover:border-indigo-200'
                        }`}
                      >
                        <img 
                          src={slide.url} 
                          alt={slide.name} 
                          className={`w-full h-full object-cover transition-transform duration-300 ${isSelected ? 'scale-95' : 'group-hover:scale-110'}`} 
                        />
                        <div className={`absolute inset-0 transition-colors duration-200 ${isSelected ? 'bg-indigo-900/20' : 'group-hover:bg-black/10'}`} />
                        
                        <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                          isSelected ? 'bg-indigo-600 text-white scale-100' : 'bg-black/30 text-white/50 scale-90 opacity-0 group-hover:opacity-100'
                        }`}>
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        
                        <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-[10px] text-white font-medium truncate">{slide.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {brands.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <p>No brands available to select from.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            {canSave && (
              <label className="flex items-center gap-2 cursor-pointer group p-2 md:p-0">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${savePreference ? 'bg-amber-500 border-amber-600 text-white' : 'border-slate-300 bg-white'}`}>
                  {savePreference && <Check className="w-3 h-3" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={savePreference} 
                  onChange={(e) => setSavePreference(e.target.checked)} 
                />
                <span className={`text-sm font-medium ${savePreference ? 'text-amber-700' : 'text-slate-500'}`}>Save as default for this doctor</span>
              </label>
            )}
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={onCancel}
              className="flex-1 md:flex-none px-6 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors bg-slate-50 md:bg-transparent"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start ({selectedIds.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideSelector;
