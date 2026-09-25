import React from 'react';
import { Customer, Order, Quote, ArchitecturalProject, FinancialAccountItem } from '../../types';
import { 
  TrendingUp, 
  Users, 
  PackageCheck, 
  FileText, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight,
  ArrowDownLeft,
  Layers,
  Building,
  Ruler,
  Wallet,
  AlertCircle,
  BarChart3
} from 'lucide-react';

interface DashboardViewProps {
  customers: Customer[];
  orders: Order[];
  quotes: Quote[];
  projects: ArchitecturalProject[];
  financialAccounts?: FinancialAccountItem[];
  onNavigate: (tab: string) => void;
  onQuickAiQuote: () => void;
  onUpdateOrder?: (order: Order) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  customers,
  orders,
  quotes,
  projects,
  financialAccounts = [],
  onNavigate,
  onQuickAiQuote,
  onUpdateOrder,
}) => {
  // Key Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalM2Produced = orders.reduce((sum, o) => sum + o.totalM2, 0);
  const activeOrdersCount = orders.filter((o) => o.status !== 'teslim').length;
  const pendingQuotesCount = quotes.filter((q) => q.status === 'Gönderildi' || q.status === 'Taslak').length;

  // Receivables & Payables Quick Stats (Detailed Balances)
  const receivables = financialAccounts.filter(f => f.type === 'alacak' && f.status !== 'odendi');
  const payables = financialAccounts.filter(f => f.type === 'borc' && f.status !== 'odendi');

  const totalReceivables = receivables.reduce((sum, f) => sum + f.amount, 0);
  const totalPayables = payables.reduce((sum, f) => sum + f.amount, 0);

  // Pipeline Status Map
  const statusLabels: Record<string, { label: string; bg: string; text: string }> = {
    musteri_onayi: { label: '1. Sipariş & Ön Ödeme', bg: 'bg-amber-100', text: 'text-amber-900 border-amber-300' },
    dokuma: { label: '2. Üretimde (Termin)', bg: 'bg-indigo-100', text: 'text-indigo-900 border-indigo-300' },
    teslim: { label: '3. Teslim Edildi', bg: 'bg-emerald-100', text: 'text-emerald-900 border-emerald-300' }
  };

  return (
    <div id="dashboard-view" className="space-y-5">
      {/* 1. Top Compact Hero Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950/80 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border border-emerald-900/40">
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px] uppercase tracking-widest mb-0.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Google AI & Paraşüt Destekli Halı ERP
          </div>
          <h2 className="text-lg md:text-xl font-black tracking-tight text-white">
            PulCarpet Müşteri, Üretim & Cari Finans Paneli
          </h2>
          <p className="text-emerald-100/80 text-xs mt-0.5 max-w-2xl">
            Anlık müşteri alacakları, tedarikçi borçları, aktif üretim siparişleri ve canlı onay durum takip merkezi.
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
          <button
            onClick={() => onNavigate('analytics')}
            className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-3 py-2 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-indigo-400/30"
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-200" />
            <span>Analiz</span>
          </button>
          <button
            onClick={() => onNavigate('finance')}
            className="flex-1 sm:flex-none bg-slate-900/90 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 font-bold text-xs px-3 py-2 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Finans</span>
          </button>
          <button
            onClick={onQuickAiQuote}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 border border-emerald-400/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>AI Teklif Oluştur</span>
          </button>
        </div>
      </div>

      {/* 2. Öne Çıkan Koleksiyonlar & Stok Hızlı Bakış */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600" /> Öne Çıkan Koleksiyonlar & Stok Hızlı Bakış
          </span>
          <button
            onClick={() => onNavigate('catalog')}
            className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
          >
            Kataloğu İncele (7 Koleksiyon) →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {[
            { name: 'Otantik', code: 'PC-OTN-101', img: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=150&q=80', m2: '320 m²' },
            { name: 'Bambu', code: 'PC-BMB-201', img: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=150&q=80', m2: '450 m²' },
            { name: 'Hazel', code: 'PC-HZL-301', img: 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=150&q=80', m2: '280 m²' },
            { name: 'Mira', code: 'PC-MRA-401', img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=150&q=80', m2: '390 m²' },
            { name: 'Tuanna', code: 'PC-TUA-501', img: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=150&q=80', m2: '210 m²' },
            { name: 'Asu', code: 'PC-ASU-601', img: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=150&q=80', m2: '500 m²' },
            { name: 'Asukka', code: 'PC-ASK-701', img: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=150&q=80', m2: '340 m²' },
          ].map((col) => (
            <div
              key={col.name}
              onClick={() => onNavigate('catalog')}
              className="bg-slate-50 border border-slate-200 hover:border-indigo-300 p-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all hover:bg-slate-100/80 group"
            >
              <img
                src={col.img}
                alt={col.name}
                className="w-11 h-11 object-cover rounded-lg border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{col.name}</div>
                <div className="text-[10px] text-emerald-600 font-mono font-bold">{col.m2}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. USER MANDATE: İçerideki Siparişler ve Müşteri Onay Durumları (Right below Stock!) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-xs uppercase tracking-wider">
              <PackageCheck className="w-4 h-4" /> İÇERİDEKİ SİPARİŞLER & ONAY KONTROLÜ
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
              İçerideki Siparişler & Müşteri Onay Durumları
            </h3>
            <p className="text-xs text-slate-500">Üretimdeki aktif siparişler, onay durumu ve teslimat takibi</p>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1 cursor-pointer bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100"
          >
            Tüm Siparişleri Yönet ({orders.length}) →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {orders.slice(0, 6).map((order) => {
            const statusCfg = statusLabels[order.status] || { label: order.status, bg: 'bg-slate-100', text: 'text-slate-800' };
            const isApproved = Boolean(order.customerApproved);

            return (
              <div 
                key={order.id} 
                className="bg-slate-50 border border-slate-200/90 p-4 rounded-xl flex flex-col justify-between gap-3 hover:border-indigo-300 hover:bg-slate-100/60 transition-all shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                    <span 
                      onClick={() => onNavigate('orders')}
                      className="text-xs font-mono font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200/80 cursor-pointer transition-colors"
                      title="Siparişler sayfasına git"
                    >
                      {order.orderNumber}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onUpdateOrder) {
                          onUpdateOrder({
                            ...order,
                            customerApproved: !isApproved,
                            approvalDate: !isApproved ? new Date().toISOString().split('T')[0] : undefined,
                          });
                        }
                      }}
                      title="Onay durumunu değiştirmek için tıklayın"
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                      }`}
                    >
                      {isApproved ? '✓ Müşteri Onayladı' : '⏳ Onay Bekliyor (Tıkla Değiştir)'}
                    </button>
                  </div>

                  <div className="mt-2.5">
                    <div className="text-sm font-extrabold text-slate-900 truncate">{order.customerName}</div>
                    <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                      <span className="font-medium text-slate-700">{order.items.map(i => i.collectionName).join(', ') || 'Özel Sipariş'}</span>
                      <span className="text-indigo-600 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">{order.totalM2} m²</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {order.totalAmount.toLocaleString('tr-TR')} {order.currency === 'USD' ? '$' : order.currency === 'EUR' ? '€' : order.currency === 'GBP' ? '£' : '₺'}
                  </span>
                  <span className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border ${statusCfg.bg} ${statusCfg.text}`}>
                    {statusCfg.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. USER MANDATE: Anlık Bakiyeler (Müşteri Bazlı Alacaklar & Tedarikçi Bazlı Borçlar) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-xs uppercase tracking-wider">
              <Wallet className="w-4 h-4" /> ANLIK CARİ BAKIYE MERKEZİ
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
              Anlık Müşteri Alacakları & Tedarikçi Borç Bakiyeleri
            </h3>
            <p className="text-xs text-slate-500">
              Müşterilerden tahsil edilecek net bakiyeler ve tedarikçilere ödenecek borç bakiyelerinin canlı özeti
            </p>
          </div>

          <div className="flex flex-wrap items-stretch sm:items-center gap-2 text-xs w-full sm:w-auto">
            <div className="flex-1 sm:flex-none bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold text-emerald-900 text-center sm:text-left">
              Müşteri Alacak: <span className="font-mono text-xs sm:text-sm font-black">{totalReceivables.toLocaleString('tr-TR')} ₺</span>
            </div>
            <div className="flex-1 sm:flex-none bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl font-bold text-rose-900 text-center sm:text-left">
              Tedarikçi Borç: <span className="font-mono text-xs sm:text-sm font-black">{totalPayables.toLocaleString('tr-TR')} ₺</span>
            </div>
            <button
              onClick={() => onNavigate('finance')}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-3 py-2 rounded-xl cursor-pointer transition-all text-center"
            >
              Finans →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Müşteri Bazlı Anlık Alacak Bakiyeleri */}
          <div className="bg-slate-50/90 p-4.5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" /> Anlık Bakiyeler (Müşteri Bazlı Alacaklar)
              </span>
              <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                {receivables.length} Cari Kayıt
              </span>
            </div>

            <div className="space-y-2">
              {receivables.map((item) => (
                <div key={item.id} className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between hover:border-emerald-400 transition-all shadow-2xs">
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">{item.partyName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>Vade: <strong className="font-mono text-slate-800">{item.dueDate}</strong></span>
                      <span>•</span>
                      <span>{item.notes}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-emerald-700 text-base">
                      {item.amount.toLocaleString('tr-TR')} ₺
                    </div>
                    {item.status === 'gecikti' ? (
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-black px-2 py-0.5 rounded border border-rose-200">
                        ⚠️ Gecikti
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Vade Bekliyor
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tedarikçi Bazlı Anlık Borç Bakiyeleri */}
          <div className="bg-slate-50/90 p-4.5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-rose-600" /> Anlık Bakiyeler (Tedarikçi Bazlı Borçlar)
              </span>
              <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                {payables.length} Tedarikçi
              </span>
            </div>

            <div className="space-y-2">
              {payables.map((item) => (
                <div key={item.id} className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between hover:border-rose-400 transition-all shadow-2xs">
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">{item.partyName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="text-slate-700 font-semibold">{item.companyCategory || 'İplik / Boyahane'}</span>
                      <span>•</span>
                      <span>Vade: <strong className="font-mono text-slate-800">{item.dueDate}</strong></span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-rose-700 text-base">
                      {item.amount.toLocaleString('tr-TR')} ₺
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200">
                      Fatura No: {item.invoiceNumber || '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Quick KPI Summary & B2B Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* KPI Cards Bento */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Toplam Sipariş Cirosu</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 font-mono">
                {totalRevenue.toLocaleString('tr-TR')} ₺
              </div>
              <div className="mt-1 text-xs text-emerald-600 font-bold flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> %22.4 bu ay büyüme
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Kayıtlı Müşteri & CRM</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 font-mono">
                {customers.length} <span className="text-xs font-normal text-slate-500">Aktif Cari</span>
              </div>
              <div className="mt-1 text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> B2B Portföy
              </div>
            </div>
          </div>
        </div>

        {/* Architectural B2B Projects Overview */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" /> Mimari Projeler
              </h3>
              <button
                onClick={() => onNavigate('projects')}
                className="text-xs text-indigo-600 hover:underline font-bold cursor-pointer"
              >
                Yönet →
              </button>
            </div>

            <div className="space-y-2">
              {projects.slice(0, 2).map((prj) => (
                <div key={prj.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="font-bold text-slate-900 truncate">{prj.title}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{prj.architect} • {prj.location}</div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 text-[11px]">
                    <span className="text-indigo-600 font-semibold">{prj.requiredM2} m² Halı</span>
                    <span className="text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono font-bold">
                      {prj.estimatedBudget.toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('ai-assistant')}
            className="w-full bg-slate-100 hover:bg-slate-200 text-indigo-700 text-xs font-bold py-2 rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Google AI ile Proje Analiz Et
          </button>
        </div>
      </div>
    </div>
  );
};
