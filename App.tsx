
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import BrandManager from './components/BrandManager';
import DoctorManager from './components/DoctorManager';
import PresentationView from './components/PresentationView';
import SlideSelector from './components/SlideSelector';
import { Brand, Doctor, Slide, ViewState } from './types';
import { Users, FileText, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import { saveToStorage, loadFromStorage } from './services/storageService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  
  // Presentation State
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | undefined>();
  const [selectedBrand, setSelectedBrand] = useState<Brand | undefined>();
  const [isPresenting, setIsPresenting] = useState(false);
  
  // Custom Selection State
  const [showSlideSelector, setShowSlideSelector] = useState(false);
  const [customPlaylist, setCustomPlaylist] = useState<{ slide: Slide; brand: Brand }[] | undefined>();
  const [selectionContext, setSelectionContext] = useState<{ doctor?: Doctor; brand?: Brand }>({});

  // Load persistent state
  useEffect(() => {
    const loadData = async () => {
      try {
        let savedBrands = await loadFromStorage<Brand[]>('pharma_brands');
        let savedDoctors = await loadFromStorage<Doctor[]>('pharma_doctors');

        if (!savedBrands && !savedDoctors) {
          const localBrands = localStorage.getItem('pharma_brands');
          const localDoctors = localStorage.getItem('pharma_doctors');
          
          if (localBrands) {
            try { savedBrands = JSON.parse(localBrands); } catch (e) { console.error("Error parsing local brands", e); }
          }
          if (localDoctors) {
            try { savedDoctors = JSON.parse(localDoctors); } catch (e) { console.error("Error parsing local doctors", e); }
          }
        }

        if (savedBrands) setBrands(savedBrands);
        if (savedDoctors) setDoctors(savedDoctors);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
  }, []);

  // Save persistent state
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        await saveToStorage('pharma_brands', brands);
        await saveToStorage('pharma_doctors', doctors);
      } catch (error) {
        console.error("Failed to save data to storage:", error);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [brands, doctors]);

  const handleSaveBrand = (brand: Brand) => {
    setBrands(prev => {
      const idx = prev.findIndex(b => b.id === brand.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = brand;
        return next;
      }
      return [...prev, brand];
    });
  };

  const handleDeleteBrand = (id: string) => {
    setBrands(prev => prev.filter(b => b.id !== id));
  };

  const handleSaveDoctor = (doctor: Doctor) => {
    setDoctors(prev => {
      const idx = prev.findIndex(d => d.id === doctor.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = doctor;
        return next;
      }
      return [...prev, doctor];
    });
  };

  const handleDeleteDoctor = (id: string) => {
    setDoctors(prev => prev.filter(d => d.id !== id));
  };

  const startPitchForDoctor = (doctor: Doctor, custom: boolean = false) => {
    setSelectedDoctor(doctor);
    setSelectedBrand(undefined);
    setCustomPlaylist(undefined);

    // If explicit custom flow requested (via icon), open selector
    if (custom) {
      setSelectionContext({ doctor });
      setShowSlideSelector(true);
      return;
    }

    // Standard flow (Start Pitch button)
    // Check if doctor has a saved playlist
    if (doctor.savedSlideIds && doctor.savedSlideIds.length > 0) {
      const playlist: { slide: Slide; brand: Brand }[] = [];
      // Reconstruct playlist in stored order, checking if slides still exist
      doctor.savedSlideIds.forEach(slideId => {
        for (const brand of brands) {
          const slide = brand.slides.find(s => s.id === slideId);
          if (slide) {
            playlist.push({ slide, brand });
            break;
          }
        }
      });
      
      if (playlist.length > 0) {
        setCustomPlaylist(playlist);
        setIsPresenting(true);
        return;
      }
    }

    // Fallback to standard brand-based presentation
    setIsPresenting(true);
  };

  const startPreviewForBrand = (brand: Brand, custom: boolean = false) => {
    setSelectedBrand(brand);
    setSelectedDoctor(undefined);
    setCustomPlaylist(undefined);

    if (custom) {
      setSelectionContext({ brand });
      setShowSlideSelector(true);
    } else {
      setIsPresenting(true);
    }
  };

  const handleCustomSelectionConfirm = (selection: { slide: Slide; brand: Brand }[], savePreference: boolean) => {
    setCustomPlaylist(selection);
    setShowSlideSelector(false);
    setIsPresenting(true);

    if (savePreference && selectionContext.doctor) {
      const doctorId = selectionContext.doctor.id;
      const slideIds = selection.map(item => item.slide.id);
      
      setDoctors(prev => prev.map(doc => {
        if (doc.id === doctorId) {
          return { ...doc, savedSlideIds: slideIds };
        }
        return doc;
      }));
    }
  };

  const getBrandsForSelector = () => {
    return brands; 
  };

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-3xl font-bold text-slate-800">{doctors.length}</p>
          <p className="text-slate-500 text-sm font-medium">Total Doctors</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-3xl font-bold text-slate-800">{brands.length}</p>
          <p className="text-slate-500 text-sm font-medium">Active Brands</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-4">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-3xl font-bold text-slate-800">12</p>
          <p className="text-slate-500 text-sm font-medium">Monthly Pitches</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4">
            <Calendar className="w-6 h-6" />
          </div>
          <p className="text-3xl font-bold text-slate-800">3</p>
          <p className="text-slate-500 text-sm font-medium">Upcoming Meetings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 px-2">Recent Doctors</h3>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {doctors.slice(0, 3).map((doctor) => (
              <button 
                key={doctor.id}
                onClick={() => startPitchForDoctor(doctor)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                    {doctor.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{doctor.name}</p>
                    <p className="text-xs text-slate-500">{doctor.specialty} • {doctor.hospital}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            ))}
            {doctors.length === 0 && (
              <div className="p-8 text-center text-slate-400 italic">No doctors registered yet</div>
            )}
            <button 
              onClick={() => setActiveView('doctors')}
              className="w-full py-3 bg-slate-50 text-indigo-600 text-sm font-bold hover:bg-slate-100 transition-colors"
            >
              View All Doctors
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 px-2">Featured Portfolio</h3>
          <div className="grid grid-cols-2 gap-4">
            {brands.slice(0, 4).map((brand) => {
              const coverSlide = brand.slides[0];
              const showImage = coverSlide && (coverSlide.type === 'image' || coverSlide.thumbnailUrl);
              const imageUrl = coverSlide ? (coverSlide.thumbnailUrl || coverSlide.url) : '';
              
              return (
              <button
                key={brand.id}
                onClick={() => startPreviewForBrand(brand)}
                className="group relative h-32 rounded-2xl overflow-hidden border border-slate-200"
              >
                {showImage ? (
                  <img src={imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center"><FileText className="text-slate-300" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3 text-left">
                  <p className="text-white font-bold text-sm">{brand.name}</p>
                  <p className="text-white/60 text-[10px] uppercase tracking-widest">{brand.slides.length} slides</p>
                </div>
              </button>
            )})}
            {brands.length === 0 && (
              <div className="col-span-2 h-32 flex items-center justify-center bg-white border border-dashed border-slate-200 rounded-2xl text-slate-400">
                No brands available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Layout activeView={activeView} onViewChange={setActiveView}>
        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'doctors' && (
          <DoctorManager 
            doctors={doctors} 
            brands={brands} 
            onSave={handleSaveDoctor} 
            onDelete={handleDeleteDoctor}
            onSelectDoctor={startPitchForDoctor}
          />
        )}
        {activeView === 'brands' && (
          <BrandManager 
            brands={brands} 
            onSave={handleSaveBrand} 
            onDelete={handleDeleteBrand}
            onPresent={startPreviewForBrand}
          />
        )}
      </Layout>

      {showSlideSelector && (
        <SlideSelector 
          brands={getBrandsForSelector()} 
          onConfirm={handleCustomSelectionConfirm}
          onCancel={() => setShowSlideSelector(false)}
          title={selectionContext.doctor 
            ? `Customize Pitch for ${selectionContext.doctor.name}` 
            : selectionContext.brand ? `Select Slides from ${selectionContext.brand.name}` : undefined
          }
          canSave={!!selectionContext.doctor}
          initialSelectedIds={selectionContext.doctor?.savedSlideIds || undefined}
        />
      )}

      {isPresenting && (
        <PresentationView 
          brands={brands} 
          doctor={selectedDoctor} 
          initialBrand={selectedBrand}
          customPlaylist={customPlaylist}
          onClose={() => setIsPresenting(false)} 
        />
      )}
    </>
  );
};

export default App;
