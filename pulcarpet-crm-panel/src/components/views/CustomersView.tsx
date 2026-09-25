import React, { useState } from 'react';
import { Customer, CustomerStatus } from '../../types';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Sparkles, 
  Building, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare, 
  X,
  Send,
  Trash2
} from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomerStatus: (id: string, status: CustomerStatus) => void;
  onDeleteCustomer?: (id: string) => void;
  searchTerm: string;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  onAddCustomer,
  onUpdateCustomerStatus,
  onDeleteCustomer,
  searchTerm,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  
  // Add Customer Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCust, setNewCust] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    city: 'İstanbul',
    notes: '',
    preferredStyle: 'Modern Bambu İpek',
    estimatedValue: 50000,
  });

  // AI Offer Letter / WhatsApp Modal State
  const [activeCustomerForAi, setActiveCustomerForAi] = useState<Customer | null>(null);
  const [offerTone, setOfferTone] = useState<'formal' | 'whatsapp'>('whatsapp');
  const [draftResult, setDraftResult] = useState('');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name) return;

    const created: Customer = {
      id: `CUST-${Math.floor(100 + Math.random() * 900)}`,
      name: newCust.name,
      company: newCust.company || 'Bireysel Müşteri',
      email: newCust.email || 'iletisim@pulcarpet.com',
      phone: newCust.phone || '+90 532 000 00 00',
      city: newCust.city,
      status: 'yeni',
      leadScore: Math.floor(65 + Math.random() * 30),
      totalDealValue: Number(newCust.estimatedValue) || 50000,
      lastContact: new Date().toISOString().split('T')[0],
      notes: newCust.notes || 'Yeni potansiyel müşteri kaydı.',
      preferredStyle: newCust.preferredStyle,
      assignedAgent: 'Ahmet Yılmaz',
    };

    onAddCustomer(created);
    setIsAddModalOpen(false);
    setNewCust({
      name: '',
      company: '',
      email: '',
      phone: '',
      city: 'İstanbul',
      notes: '',
      preferredStyle: 'Modern Bambu İpek',
      estimatedValue: 50000,
    });
  };

  const handleGenerateAiOffer = async (cust: Customer) => {
    setActiveCustomerForAi(cust);
    setIsGeneratingDraft(true);
    setDraftResult('');

    try {
      const res = await fetch('/api/ai/generate-offer-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: cust.name,
          company: cust.company,
          totalAmount: cust.totalDealValue.toLocaleString('tr-TR'),
          quoteNumber: `TKF-${Math.floor(1000 + Math.random() * 9000)}`,
          itemsSummary: `${cust.preferredStyle || 'Özel Ölçü Halı'} - Tahmini Bütçe: ${cust.totalDealValue} TL`,
          tone: offerTone,
        }),
      });
      const data = await res.json();
      if (data.draftText) {
        setDraftResult(data.draftText);
      } else {
        setDraftResult('Metin oluşturulamadı.');
      }
    } catch (err) {
      console.error(err);
      setDraftResult('Sunucu hatası oluştu.');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const statusBadges: Record<CustomerStatus, { label: string; style: string }> = {
    yeni: { label: 'Yeni Fırsat', style: 'bg-blue-50 text-blue-700 border-blue-200' },
    gorusmede: { label: 'Görüşülüyor', style: 'bg-amber-50 text-amber-700 border-amber-200' },
    teklif: { label: 'Teklif Verildi', style: 'bg-purple-50 text-purple-700 border-purple-200' },
    anlasildi: { label: 'Anlaşıldı', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    kaybedildi: { label: 'Kaybedildi', style: 'bg-rose-50 text-rose-700 border-rose-200' },
  };

  return (
    <div id="customers-view" className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" /> Müşteri & Potansiyel Yönetimi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Satış fırsatlarını takip edin, teklif hazırlayın ve AI ile iletişime geçin</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle View */}
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md font-bold cursor-pointer transition-all ${
                viewMode === 'table' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Liste
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-md font-bold cursor-pointer transition-all ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kanban
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Yeni Müşteri Ekle
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'Tüm Müşteriler' },
          { id: 'yeni', label: 'Yeni' },
          { id: 'gorusmede', label: 'Görüşmede' },
          { id: 'teklif', label: 'Teklif Verildi' },
          { id: 'anlasildi', label: 'Anlaşıldı' },
          { id: 'kaybedildi', label: 'Kaybedildi' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg border font-semibold whitespace-nowrap transition-all cursor-pointer ${
              filterStatus === tab.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Müşteri / Firma</th>
                  <th className="px-4 py-3.5">İletişim & Şehir</th>
                  <th className="px-4 py-3.5">Tercih Edilen Halı</th>
                  <th className="px-4 py-3.5">AI Lead Skoru</th>
                  <th className="px-4 py-3.5">Tahmini Tutar</th>
                  <th className="px-4 py-3.5">Durum</th>
                  <th className="px-4 py-3.5 text-right">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => {
                  const badge = statusBadges[cust.status];
                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900">{cust.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-indigo-600" /> {cust.company}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-slate-800 font-medium">{cust.phone}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" /> {cust.city}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 border border-slate-200 font-medium">
                          {cust.preferredStyle || 'Özel Dokuma'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                            cust.leadScore > 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {cust.leadScore}/100
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900 text-sm">
                        {cust.totalDealValue.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.style}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleGenerateAiOffer(cust)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                          >
                            <Sparkles className="w-3 h-3" /> AI Mesaj Taslağı
                          </button>
                          {onDeleteCustomer && (
                            <button
                              onClick={() => {
                                if (window.confirm(`${cust.name} isimli müşteriyi silmek istediğinizden emin misiniz?`)) {
                                  onDeleteCustomer(cust.id);
                                }
                              }}
                              title="Müşteriyi Sil"
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {(['yeni', 'gorusmede', 'teklif', 'anlasildi', 'kaybedildi'] as CustomerStatus[]).map((st) => {
            const list = customers.filter(c => c.status === st);
            const badge = statusBadges[st];
            return (
              <div key={st} className="bg-white border border-slate-200 p-3.5 rounded-xl flex flex-col min-h-[400px] shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badge.style}`}>
                    {badge.label}
                  </span>
                  <span className="text-xs text-slate-400 font-mono font-bold">{list.length}</span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {list.map((cust) => (
                    <div key={cust.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-400 transition-all text-xs">
                      <div className="font-bold text-slate-900">{cust.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{cust.company}</div>
                      
                      <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between font-mono">
                        <span className="text-indigo-600 font-bold">{cust.totalDealValue.toLocaleString('tr-TR')} ₺</span>
                        <span className="text-[10px] text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-bold">
                          Skor: {cust.leadScore}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-1 justify-end">
                        <button
                          onClick={() => handleGenerateAiOffer(cust)}
                          className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 px-2 py-1 rounded border border-amber-500/30 flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-2.5 h-2.5" /> AI Teklif
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Customer Modal */}
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
              <Users className="w-5 h-5 text-amber-400" /> Yeni Müşteri Kaydı
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Müşteri Ad Soyad *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ahmet Yılmaz"
                  value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Firma / Proje Adı</label>
                  <input
                    type="text"
                    placeholder="Örn: Yılmaz İç Mimarlık"
                    value={newCust.company}
                    onChange={(e) => setNewCust({ ...newCust, company: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Şehir</label>
                  <input
                    type="text"
                    placeholder="İstanbul, Ankara, İzmir..."
                    value={newCust.city}
                    onChange={(e) => setNewCust({ ...newCust, city: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Telefon</label>
                  <input
                    type="text"
                    placeholder="+90 5xx xxx xx xx"
                    value={newCust.phone}
                    onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tahmini Bütçe (TL)</label>
                  <input
                    type="number"
                    value={newCust.estimatedValue}
                    onChange={(e) => setNewCust({ ...newCust, estimatedValue: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">İstenen Halı Tarzı</label>
                <select
                  value={newCust.preferredStyle}
                  onChange={(e) => setNewCust({ ...newCust, preferredStyle: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                >
                  <option value="Modern Bambu İpek">Modern Bambu İpek</option>
                  <option value="Alev Almaz Otel Serisi">Alev Almaz Otel Serisi</option>
                  <option value="Saf Yün Klasik">Saf Yün Klasik</option>
                  <option value="Cami Saflı Halı">Cami Saflı Halı</option>
                  <option value="Velvet Lux Shaggy">Velvet Lux Shaggy</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Notlar / Proje Detayı</label>
                <textarea
                  rows={2}
                  placeholder="Müşteri talepleri ve özel ölçü gereksinimleri..."
                  value={newCust.notes}
                  onChange={(e) => setNewCust({ ...newCust, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold hover:bg-slate-700"
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

      {/* AI Offer Letter Generator Modal */}
      {activeCustomerForAi && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setActiveCustomerForAi(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Google AI Teklif Metni Oluşturucu</h3>
                <p className="text-xs text-slate-400">{activeCustomerForAi.name} ({activeCustomerForAi.company})</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg text-xs">
              <button
                onClick={() => setOfferTone('whatsapp')}
                className={`flex-1 py-1.5 rounded-md font-semibold transition-all ${
                  offerTone === 'whatsapp' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                📱 WhatsApp Mesajı
              </button>
              <button
                onClick={() => setOfferTone('formal')}
                className={`flex-1 py-1.5 rounded-md font-semibold transition-all ${
                  offerTone === 'formal' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                ✉️ Kurumsal E-Posta
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl min-h-[160px] text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
              {isGeneratingDraft ? (
                <div className="flex items-center justify-center h-32 text-amber-400 gap-2">
                  <Sparkles className="w-5 h-5 animate-spin" />
                  <span>Google Gemini teklif metnini kaleme alıyor...</span>
                </div>
              ) : (
                draftResult || 'Teklif metni bekleniyor.'
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleGenerateAiOffer(activeCustomerForAi)}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                🔄 Yeniden Üret
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(draftResult);
                    alert('Metin kopyalandı!');
                  }}
                  className="px-4 py-2 bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-700"
                >
                  Metni Kopyala
                </button>
                <button
                  onClick={() => setActiveCustomerForAi(null)}
                  className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg hover:bg-amber-400"
                >
                  Tamam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
