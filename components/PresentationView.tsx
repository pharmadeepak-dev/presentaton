
import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2, Grid, User, Layers } from 'lucide-react';
import { Brand, Slide, Doctor } from '../types';

interface PresentationViewProps {
  brands: Brand[];
  doctor?: Doctor;
  initialBrand?: Brand;
  customPlaylist?: { slide: Slide; brand: Brand }[];
  onClose: () => void;
}

const PresentationView: React.FC<PresentationViewProps> = ({ brands, doctor, initialBrand, customPlaylist, onClose }) => {
  const [activeBrandIndex, setActiveBrandIndex] = useState(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showBrandSelector, setShowBrandSelector] = useState(false);
  
  // Touch handling state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Determine mode: Custom Playlist vs Standard Brand Flow
  const isCustomMode = !!customPlaylist && customPlaylist.length > 0;

  // Derive content based on mode
  const relevantBrands = (!isCustomMode && doctor)
    ? brands.filter(b => doctor.assignedBrandIds.includes(b.id))
    : (!isCustomMode && initialBrand) ? [initialBrand] : brands;

  const currentSlideData = isCustomMode 
    ? customPlaylist[activeSlideIndex] 
    : { 
        slide: relevantBrands[activeBrandIndex]?.slides[activeSlideIndex], 
        brand: relevantBrands[activeBrandIndex] 
      };

  const { slide: currentSlide, brand: currentBrand } = currentSlideData || {};
  
  const totalSlides = isCustomMode 
    ? customPlaylist.length 
    : relevantBrands[activeBrandIndex]?.slides.length || 0;
    
  const currentSlideNumber = activeSlideIndex + 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlideIndex, activeBrandIndex, isCustomMode, customPlaylist, relevantBrands]);

  const nextSlide = () => {
    if (isCustomMode) {
      if (activeSlideIndex < customPlaylist.length - 1) {
        setActiveSlideIndex(activeSlideIndex + 1);
      }
    } else {
      // Standard Mode
      const currentBrandSlides = relevantBrands[activeBrandIndex]?.slides || [];
      if (activeSlideIndex < currentBrandSlides.length - 1) {
        setActiveSlideIndex(activeSlideIndex + 1);
      } else if (activeBrandIndex < relevantBrands.length - 1) {
        setActiveBrandIndex(activeBrandIndex + 1);
        setActiveSlideIndex(0);
      }
    }
  };

  const prevSlide = () => {
    if (activeSlideIndex > 0) {
      setActiveSlideIndex(activeSlideIndex - 1);
    } else if (!isCustomMode && activeBrandIndex > 0) {
      const prevBrand = relevantBrands[activeBrandIndex - 1];
      setActiveBrandIndex(activeBrandIndex - 1);
      setActiveSlideIndex(Math.max(0, prevBrand.slides.length - 1));
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!currentSlide) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">No slides available to display.</p>
          <button onClick={onClose} className="px-6 py-2 bg-indigo-600 rounded-lg">Exit Presentation</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[100] bg-slate-950 flex flex-col transition-all duration-300 ${isFullscreen ? '' : 'p-0 md:p-8'}`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4 bg-black/40 backdrop-blur-md rounded-none md:rounded-t-2xl text-white z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => !isCustomMode && setShowBrandSelector(!showBrandSelector)}
            disabled={isCustomMode}
            className={`flex items-center gap-2 transition-colors ${!isCustomMode ? 'hover:text-indigo-400' : ''}`}
          >
            {isCustomMode ? <Layers className="w-5 h-5 text-indigo-400" /> : <Grid className="w-5 h-5" />}
            <div className="hidden sm:block">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                {isCustomMode ? 'Custom Presentation' : 'Current Brand'}
              </p>
              <h2 className="text-lg font-bold leading-none">{currentBrand?.name || 'Unknown Brand'}</h2>
            </div>
          </button>
          
          {doctor && (
            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-indigo-500/20 rounded-full border border-indigo-500/30 text-indigo-300">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Pitching to: {doctor.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">
            {currentSlideNumber} / {totalSlides}
          </span>
          <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-lg hidden md:block">
            {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
          </button>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        className="flex-1 relative flex items-center justify-center overflow-hidden bg-black/20 group touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <button 
          onClick={prevSlide}
          className="absolute left-2 md:left-4 z-10 p-3 md:p-4 bg-black/50 text-white rounded-full transition-all hover:bg-indigo-600 disabled:opacity-20 disabled:cursor-not-allowed opacity-100 md:opacity-0 md:group-hover:opacity-100"
          disabled={activeSlideIndex === 0 && (isCustomMode || activeBrandIndex === 0)}
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
        </button>

        <div className="w-full h-full flex items-center justify-center p-2 md:p-12">
          {currentSlide.type === 'image' ? (
            <img 
              src={currentSlide.url} 
              alt={currentSlide.name} 
              className="max-w-full max-h-full object-contain shadow-2xl rounded-lg select-none" 
              draggable={false}
            />
          ) : (
            <iframe 
              src={currentSlide.url} 
              className="w-full h-full rounded-lg shadow-2xl bg-white"
              title={currentSlide.name}
            />
          )}
        </div>

        <button 
          onClick={nextSlide}
          className="absolute right-2 md:right-4 z-10 p-3 md:p-4 bg-black/50 text-white rounded-full transition-all hover:bg-indigo-600 disabled:opacity-20 disabled:cursor-not-allowed opacity-100 md:opacity-0 md:group-hover:opacity-100"
          disabled={
            isCustomMode 
              ? activeSlideIndex === totalSlides - 1 
              : (activeBrandIndex === relevantBrands.length - 1 && activeSlideIndex === totalSlides - 1)
          }
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
        </button>
      </div>

      {/* Bottom Progress Bar */}
      <div className="h-1.5 bg-white/5 overflow-hidden">
        <div 
          className="h-full bg-indigo-500 transition-all duration-300 ease-out"
          style={{ width: totalSlides > 0 ? `${(currentSlideNumber / totalSlides) * 100}%` : '0%' }}
        ></div>
      </div>

      {/* Quick Nav / Brand Selector (Only for Standard Mode) */}
      {showBrandSelector && !isCustomMode && (
        <div className="absolute inset-x-0 bottom-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 p-6 md:p-8 z-50 animate-in slide-in-from-bottom duration-300 max-h-[50vh] overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Jump to Brand</h3>
              <button onClick={() => setShowBrandSelector(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relevantBrands.map((brand, idx) => (
                <button
                  key={brand.id}
                  onClick={() => {
                    setActiveBrandIndex(idx);
                    setActiveSlideIndex(0);
                    setShowBrandSelector(false);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    idx === activeBrandIndex 
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' 
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <p className="font-bold text-sm truncate">{brand.name}</p>
                  <p className="text-[10px] opacity-60 mt-1 uppercase tracking-widest">{brand.slides.length} Slides</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationView;
