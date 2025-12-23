
import React, { useState } from 'react';
import { Plus, Search, User, Hospital, GraduationCap, X, Check, Filter, Edit, Layers, Star } from 'lucide-react';
import { Doctor, Brand } from '../types';

interface DoctorManagerProps {
  doctors: Doctor[];
  brands: Brand[];
  onSave: (doctor: Doctor) => void;
  onDelete: (id: string) => void;
  onSelectDoctor: (doctor: Doctor, custom?: boolean) => void;
}

const DoctorManager: React.FC<DoctorManagerProps> = ({ doctors, brands, onSave, onDelete, onSelectDoctor }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newDoctor, setNewDoctor] = useState<Partial<Doctor>>({
    name: '',
    specialty: '',
    hospital: '',
    assignedBrandIds: [],
    savedSlideIds: [],
  });

  const handleAddNew = () => {
    setNewDoctor({
      name: '',
      specialty: '',
      hospital: '',
      assignedBrandIds: [],
      savedSlideIds: [],
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (doctor: Doctor) => {
    setNewDoctor({ ...doctor });
    setEditingId(doctor.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctor.name || !newDoctor.specialty) return;

    onSave({
      id: editingId || crypto.randomUUID(),
      name: newDoctor.name!,
      specialty: newDoctor.specialty!,
      hospital: newDoctor.hospital || 'General Hospital',
      assignedBrandIds: newDoctor.assignedBrandIds || [],
      savedSlideIds: newDoctor.savedSlideIds, // Preserve saved playlist
    });
    
    setNewDoctor({ name: '', specialty: '', hospital: '', assignedBrandIds: [], savedSlideIds: [] });
    setEditingId(null);
    setShowForm(false);
  };

  const toggleBrand = (brandId: string) => {
    setNewDoctor(prev => {
      const current = prev.assignedBrandIds || [];
      const updated = current.includes(brandId)
        ? current.filter(id => id !== brandId)
        : [...current, brandId];
      return { ...prev, assignedBrandIds: updated };
    });
  };

  const filteredDoctors = doctors.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Doctor Directory</h2>
          <p className="text-slate-500">Profiles and personalized promotion targets.</p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-3 md:py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 justify-center w-full md:w-auto"
        >
          <Plus className="w-5 h-5" />
          Add New Doctor
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by name or specialty..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map((doctor) => {
          const hasSavedPlaylist = doctor.savedSlideIds && doctor.savedSlideIds.length > 0;
          return (
            <div 
              key={doctor.id} 
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              
              <div className="flex items-start justify-between relative">
                <div className="flex-1">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-4 relative">
                    <User className="w-6 h-6" />
                    {hasSavedPlaylist && (
                      <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-0.5 rounded-full border-2 border-white" title="Has saved presentation">
                        <Star className="w-3 h-3 fill-current" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{doctor.name}</h3>
                  <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                    <GraduationCap className="w-4 h-4" />
                    {doctor.specialty}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                    <Hospital className="w-4 h-4" />
                    {doctor.hospital}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between gap-2">
                <div className="flex flex-col flex-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Promoting</span>
                  <span className="text-sm font-semibold text-slate-700">{doctor.assignedBrandIds.length} Brands</span>
                </div>
                <button 
                  onClick={() => onSelectDoctor(doctor, true)}
                  className={`p-2 rounded-lg transition-colors ${
                    hasSavedPlaylist ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  }`}
                  title={hasSavedPlaylist ? "Edit Saved Presentation" : "Create Custom Pitch"}
                >
                  <Layers className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => onSelectDoctor(doctor, false)}
                  className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  {hasSavedPlaylist && <Star className="w-3 h-3 fill-current text-amber-400" />}
                  Start Pitch
                </button>
              </div>
              
              <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(doctor)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  title="Edit Doctor"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(doctor.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete Doctor"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit Doctor Profile' : 'New Doctor Profile'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <input
                    required
                    type="text"
                    value={newDoctor.name}
                    onChange={(e) => setNewDoctor(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Dr. John Smith"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Specialty</label>
                  <input
                    required
                    type="text"
                    value={newDoctor.specialty}
                    onChange={(e) => setNewDoctor(prev => ({ ...prev, specialty: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Cardiologist"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Hospital/Clinic</label>
                  <input
                    type="text"
                    value={newDoctor.hospital}
                    onChange={(e) => setNewDoctor(prev => ({ ...prev, hospital: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="St. Mary's Medical Center"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Select Target Brands
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                    {brands.length === 0 ? (
                      <p className="text-sm text-slate-400 italic text-center py-4">No brands available to assign. Add brands first.</p>
                    ) : (
                      brands.map((brand) => (
                        <button
                          key={brand.id}
                          type="button"
                          onClick={() => toggleBrand(brand.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            newDoctor.assignedBrandIds?.includes(brand.id)
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                            : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200'
                          }`}
                        >
                          <span className="font-medium text-sm text-left">{brand.name}</span>
                          {newDoctor.assignedBrandIds?.includes(brand.id) && <Check className="w-4 h-4" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                  >
                    {editingId ? 'Save' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorManager;
