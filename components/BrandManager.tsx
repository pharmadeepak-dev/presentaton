
import React, { useState, useRef } from 'react';
import { Plus, Trash2, Loader2, Sparkles, Play, FolderOpen, Check, Edit2, GripVertical, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { Brand, Slide } from '../types';
import { analyzeUpload } from '../services/geminiService';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
const pdfjs = (pdfjsLib as any).default || pdfjsLib;
pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

interface BrandManagerProps {
  brands: Brand[];
  onSave: (brand: Brand) => void;
  onDelete: (id: string) => void;
  onPresent: (brand: Brand, custom?: boolean) => void;
}

const BrandManager: React.FC<BrandManagerProps> = ({ brands, onSave, onDelete, onPresent }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [tempSlideName, setTempSlideName] = useState('');
  const [draggedSlideId, setDraggedSlideId] = useState<string | null>(null);
  const [draggedBrandId, setDraggedBrandId] = useState<string | null>(null);
  const [isOverSlideId, setIsOverSlideId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertPdfToImages = async (file: File): Promise<string[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const images: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 }); // Higher scale for better quality slides
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (!context) continue;

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        images.push(canvas.toDataURL('image/jpeg', 0.85));
      }

      return images;
    } catch (error) {
      console.error('Error converting PDF to images:', error);
      return [];
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    
    try {
      let slideImages: string[] = [];
      let analysisBase64 = '';
      let analysisMime = file.type;

      if (file.type.includes('pdf')) {
        // Convert PDF to multiple images
        slideImages = await convertPdfToImages(file);
        if (slideImages.length > 0) {
          // Use the first page for Gemini analysis
          analysisBase64 = slideImages[0].split(',')[1];
          analysisMime = 'image/jpeg';
        }
      } else {
        // Handle standard image
        const reader = new FileReader();
        const imagePromise = new Promise<string>((resolve) => {
          reader.onload = (event) => resolve(event.target?.result as string);
        });
        reader.readAsDataURL(file);
        const result = await imagePromise;
        slideImages = [result];
        analysisBase64 = result.split(',')[1];
      }

      // Analyze content (using first page if PDF)
      const result = await analyzeUpload(analysisBase64, analysisMime);
      
      // Create slides from all images
      const newSlides: Slide[] = slideImages.map((url, index) => ({
        id: crypto.randomUUID(),
        type: 'image', // We converted PDFs to images, so treat them as images
        url: url,
        name: file.type.includes('pdf') ? `Page ${index + 1}` : 'Main Slide',
        order: index,
      }));

      const newBrand: Brand = {
        id: crypto.randomUUID(),
        name: result.brandName || file.name,
        description: result.description || '',
        createdAt: Date.now(),
        slides: newSlides,
      };
      
      onSave(newBrand);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddSlide = async (brandId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsAnalyzing(true);

    try {
      const brand = brands.find(b => b.id === brandId);
      if (!brand) return;

      let newSlidesData: string[] = [];

      if (file.type.includes('pdf')) {
        newSlidesData = await convertPdfToImages(file);
      } else {
        const reader = new FileReader();
        const imagePromise = new Promise<string>((resolve) => {
          reader.onload = (event) => resolve(event.target?.result as string);
        });
        reader.readAsDataURL(file);
        newSlidesData = [await imagePromise];
      }

      const currentSlideCount = brand.slides.length;
      
      const newSlides: Slide[] = newSlidesData.map((url, index) => ({
        id: crypto.randomUUID(),
        type: 'image',
        url: url,
        name: file.type.includes('pdf') ? `${file.name} - Pg ${index + 1}` : file.name,
        order: currentSlideCount + index,
      }));

      const updatedBrand = {
        ...brand,
        slides: [...brand.slides, ...newSlides],
      };
      onSave(updatedBrand);

    } catch (error) {
      console.error("Add slide failed", error);
    } finally {
      setIsAnalyzing(false);
      e.target.value = '';
    }
  };

  const removeSlide = (brand: Brand, slideId: string) => {
    const updatedBrand = {
      ...brand,
      slides: brand.slides.filter(s => s.id !== slideId),
    };
    onSave(updatedBrand);
  };

  const moveSlide = (brand: Brand, slideId: string, direction: 'left' | 'right') => {
    const currentIndex = brand.slides.findIndex(s => s.id === slideId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= brand.slides.length) return;

    const newSlides = [...brand.slides];
    const [movedSlide] = newSlides.splice(currentIndex, 1);
    newSlides.splice(newIndex, 0, movedSlide);
    
    // update order
    const orderedSlides = newSlides.map((s, i) => ({ ...s, order: i }));
    onSave({ ...brand, slides: orderedSlides });
  };

  const startEditingSlideName = (slide: Slide) => {
    setEditingSlideId(slide.id);
    setTempSlideName(slide.name);
  };

  const saveSlideName = (brand: Brand, slideId: string) => {
    if (!tempSlideName.trim()) {
      setEditingSlideId(null);
      return;
    }
    const updatedSlides = brand.slides.map(s => 
      s.id === slideId ? { ...s, name: tempSlideName.trim() } : s
    );
    onSave({ ...brand, slides: updatedSlides });
    setEditingSlideId(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent, brand: Brand, slideId: string) => {
    if (e.key === 'Enter') {
      saveSlideName(brand, slideId);
    } else if (e.key === 'Escape') {
      setEditingSlideId(null);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, brandId: string, slideId: string) => {
    if (editingSlideId === slideId) {
      e.preventDefault();
      return;
    }
    setDraggedSlideId(slideId);
    setDraggedBrandId(brandId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, slideId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (slideId !== draggedSlideId) {
      setIsOverSlideId(slideId);
    }
  };

  const handleDragLeave = () => {
    setIsOverSlideId(null);
  };

  const handleDrop = (e: React.DragEvent, targetBrand: Brand, targetSlideId: string) => {
    e.preventDefault();
    setIsOverSlideId(null);

    if (!draggedSlideId || !draggedBrandId || draggedBrandId !== targetBrand.id) {
      setDraggedSlideId(null);
      setDraggedBrandId(null);
      return;
    }

    if (draggedSlideId === targetSlideId) return;

    // Find indices
    const oldIndex = targetBrand.slides.findIndex(s => s.id === draggedSlideId);
    const newIndex = targetBrand.slides.findIndex(s => s.id === targetSlideId);
    
    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder
    const newSlides = [...targetBrand.slides];
    const [removed] = newSlides.splice(oldIndex, 1);
    newSlides.splice(newIndex, 0, removed);

    // Update order property
    const orderedSlides = newSlides.map((s, i) => ({ ...s, order: i }));
    onSave({ ...targetBrand, slides: orderedSlides });
    
    setDraggedSlideId(null);
    setDraggedBrandId(null);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Brand Portfolio</h2>
          <p className="text-slate-500">Manage promotional materials and sequence for each brand.</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-4 py-3 md:py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 justify-center w-full md:w-auto"
        >
          {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          Upload Brand Material
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="image/*,application/pdf" 
          className="hidden" 
        />
      </div>

      {isAnalyzing && (
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3 animate-pulse">
          <Sparkles className="w-6 h-6 text-indigo-600" />
          <span className="text-indigo-700 font-medium">Processing content and analyzing with Gemini...</span>
        </div>
      )}

      <div className="grid gap-6">
        {brands.map((brand) => (
          <div key={brand.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-800">{brand.name}</h3>
                <p className="text-slate-500 text-sm mt-1">{brand.description}</p>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                <button
                  onClick={() => onPresent(brand, true)}
                  className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors whitespace-nowrap"
                  title="Select Slides to Preview"
                >
                  <Layers className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onPresent(brand, false)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium whitespace-nowrap"
                >
                  <Play className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={() => onDelete(brand.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                <h4 className="font-semibold text-slate-700 uppercase text-xs tracking-wider">Slide Sequence ({brand.slides.length})</h4>
                <div className="flex items-center gap-4 justify-between md:justify-end w-full md:w-auto">
                   <p className="text-[10px] text-slate-400 italic hidden md:block">Drag slides to reorder</p>
                  <label className="text-indigo-600 hover:text-indigo-700 text-sm font-medium cursor-pointer flex items-center gap-1 p-2 md:p-0">
                    <Plus className="w-4 h-4" />
                    Add Slide
                    <input 
                      type="file" 
                      onChange={(e) => handleAddSlide(brand.id, e)} 
                      accept="image/*,application/pdf" 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                {brand.slides.map((slide, idx) => (
                  <div 
                    key={slide.id} 
                    draggable={editingSlideId !== slide.id}
                    onDragStart={(e) => handleDragStart(e, brand.id, slide.id)}
                    onDragOver={(e) => handleDragOver(e, slide.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, brand, slide.id)}
                    className={`w-full md:w-64 bg-slate-50 rounded-xl border transition-all duration-200 overflow-hidden group relative ${
                      draggedSlideId === slide.id ? 'opacity-40 grayscale scale-95' : 'opacity-100'
                    } ${
                      isOverSlideId === slide.id ? 'border-indigo-500 border-2 ring-2 ring-indigo-200 -translate-y-1' : 'border-slate-200'
                    }`}
                  >
                    <div className="h-48 md:h-32 bg-slate-200 relative overflow-hidden flex items-center justify-center bg-pattern">
                      <img 
                        src={slide.url} 
                        alt={slide.name} 
                        className="w-full h-full object-cover pointer-events-none" 
                      />
                      
                      {/* Drag Handle Overlay */}
                      <div className="absolute top-2 left-2 p-1.5 bg-black/40 text-white rounded cursor-grab active:cursor-grabbing opacity-0 hidden md:group-hover:opacity-100 md:block transition-opacity">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Mobile Move Controls */}
                      <div className="absolute inset-x-0 bottom-8 flex justify-between px-2 md:hidden">
                        <button 
                          onClick={(e) => { e.stopPropagation(); moveSlide(brand, slide.id, 'left'); }}
                          disabled={idx === 0}
                          className="p-1.5 bg-black/50 text-white rounded-full disabled:opacity-30"
                        >
                           <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); moveSlide(brand, slide.id, 'right'); }}
                          disabled={idx === brand.slides.length - 1}
                          className="p-1.5 bg-black/50 text-white rounded-full disabled:opacity-30"
                        >
                           <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => removeSlide(brand, slide.id)}
                          className="p-2 md:p-1.5 bg-white/90 rounded-full md:rounded text-red-500 hover:bg-red-50 hover:text-red-700 shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-white text-[10px] rounded-full backdrop-blur-sm">
                        Slide {idx + 1}
                      </div>
                    </div>
                    <div className="p-3">
                      {editingSlideId === slide.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            type="text"
                            value={tempSlideName}
                            onChange={(e) => setTempSlideName(e.target.value)}
                            onBlur={() => saveSlideName(brand, slide.id)}
                            onKeyDown={(e) => handleKeyPress(e, brand, slide.id)}
                            className="w-full text-xs font-medium text-slate-700 bg-white border border-indigo-300 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                          <button 
                            onClick={() => saveSlideName(brand, slide.id)}
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center justify-between group/name cursor-pointer py-1"
                          onClick={() => startEditingSlideName(slide)}
                        >
                          <p className="text-xs font-medium text-slate-600 truncate flex-1">{slide.name}</p>
                          <Edit2 className="w-3 h-3 text-slate-400 opacity-100 md:opacity-0 md:group-hover/name:opacity-100 transition-opacity ml-1" />
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400 uppercase tracking-tighter mt-0.5">{slide.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {brands.length === 0 && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
            <FolderOpen className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No brand materials uploaded yet.</p>
            <p className="text-sm">Upload images or PDFs to start creating your presentation library.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandManager;
