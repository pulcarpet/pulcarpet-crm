import React, { useState } from 'react';
import { ArchitecturalProject } from '../../types';
import { Building2, Plus, CheckCircle2, Clock, Package, MapPin, Sparkles, X } from 'lucide-react';

interface ProjectsViewProps {
  projects: ArchitecturalProject[];
  onAddProject: (project: ArchitecturalProject) => void;
  searchTerm: string;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  onAddProject,
  searchTerm,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    architect: '',
    projectType: 'Otel' as const,
    location: 'İstanbul',
    requiredM2: 500,
    estimatedBudget: 400000,
  });

  const filteredProjects = projects.filter((p) => {
    return (
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.architect.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title) return;

    const created: ArchitecturalProject = {
      id: `PRJ-${Math.floor(100 + Math.random() * 900)}`,
      title: newProject.title,
      architect: newProject.architect || 'İç Mimarlık Ofisi',
      projectType: newProject.projectType,
      location: newProject.location,
      requiredM2: Number(newProject.requiredM2),
      estimatedBudget: Number(newProject.estimatedBudget),
      status: 'Numune Aşamasında',
      sampleStatus: 'Talep Edildi',
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    };

    onAddProject(created);
    setIsAddModalOpen(false);
  };

  return (
    <div id="projects-view" className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" /> Mimari Projeler & Kurumsal B2B Fırsatlar
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Otel, rezidans, cami ve büyük ölçekli halı kaplama projeleri</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Yeni Mimari Proje Kaydet
        </button>
      </div>

      {/* Projects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((prj) => (
          <div
            key={prj.id}
            className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {prj.projectType}
                </span>
                <span className="text-xs text-slate-400 font-mono font-semibold">Hedef: {prj.deadline}</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mt-2">{prj.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {prj.location} • <strong className="text-slate-800">{prj.architect}</strong>
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center font-mono">
                <span className="text-slate-500 font-sans">Gerekli Halı Alanı:</span>
                <span className="text-indigo-600 font-bold">{prj.requiredM2} m²</span>
              </div>
              <div className="flex justify-between items-center font-mono">
                <span className="text-slate-500 font-sans">Tahmini Bütçe:</span>
                <span className="text-slate-900 font-bold">{prj.estimatedBudget.toLocaleString('tr-TR')} ₺</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-[11px]">
                <span className="text-slate-500">Numune Durumu:</span>
                <span className="text-emerald-600 font-bold">{prj.sampleStatus}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500">Aşama: <strong className="text-slate-800">{prj.status}</strong></span>
              <button
                onClick={() => alert(`"${prj.title}" için numune gönderim süreci başlatıldı.`)}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-indigo-200 cursor-pointer transition-colors"
              >
                Numune Takibi
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Project Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" /> Yeni Mimari Proje Fırsatı Ekle
            </h3>

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Proje Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Bodrum Hilton Balo Salonu Halı Kaplama"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Mimarlık Ofisi</label>
                  <input
                    type="text"
                    placeholder="Arolat Architecture"
                    value={newProject.architect}
                    onChange={(e) => setNewProject({ ...newProject, architect: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Şehir / Lokasyon</label>
                  <input
                    type="text"
                    placeholder="Muğla / Bodrum"
                    value={newProject.location}
                    onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-slate-300 font-medium mb-1 font-sans">Gerekli m² Halı</label>
                  <input
                    type="number"
                    value={newProject.requiredM2}
                    onChange={(e) => setNewProject({ ...newProject, requiredM2: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1 font-sans">Tahmini Bütçe (TL)</label>
                  <input
                    type="number"
                    value={newProject.estimatedBudget}
                    onChange={(e) => setNewProject({ ...newProject, estimatedBudget: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-slate-950 rounded-lg font-bold hover:bg-amber-400"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
