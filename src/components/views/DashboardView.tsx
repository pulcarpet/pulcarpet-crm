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
  Globe,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardViewProps {
  customers: Customer[];
  orders: Order[];
  quotes: Quote[];
  projects: ArchitecturalProject[];
  financialAccounts?: FinancialAccountItem[];
  onNavigate: (tab: string) => void;
  onQuickAiQuote: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  customers,
  orders,
  quotes,
  projects,
  financialAccounts = [],
  onNavigate,
  onQuickAiQuote,
}) => {
  // Key Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalM2Produced = orders.reduce((sum, o) => sum + o.totalM2, 0);
  const activeOrdersCount = orders.filter((o) => o.status !== 'teslim').length;
  const pendingQuotesCount = quotes.filter((q) => q.status === 'Gönderildi' || q.status === 'Taslak').length;

  // Receivables & Payables Quick Stats
  const receivables = financialAccounts.filter(f => f.type === 'alacak' && f.status !== 'odendi');
  const payables = financialAccounts.filter(f => f.type === 'borc' && f.status !== 'odendi');

  const totalReceivables = receivables.reduce((sum, f) => sum + f.amount, 0);
  const totalPayables = payables.reduce((sum, f) => sum + f.amount, 0);

  // Chart Data
  const monthlySalesData = [
    { month: 'Ocak', satis: 180000, m2: 210 },
    { month: 'Şubat', satis: 240000, m2: 290 },
    { month: 'Mart', satis: 310000, m2: 380 },
    { month: 'Nisan', satis: 280000, m2: 320 },
    { month: 'Mayıs', satis: 420000, m2: 510 },
    { month: 'Haziran', satis: 540000, m2: 640 },
    { month: 'Temmuz', satis: 620000, m2: 720 },
  ];

  const categoryDistribution = [
    { name: 'Bambu İpek', value: 38, color: '#f59e0b' },
    { name: 'Alev Almaz Otel', value: 30, color: '#3b82f6' },
    { name: 'Saf Yün', value: 18, color: '#10b981' },
    { name: 'Cami Saflı', value: 14, color: '#8b5cf6' },
  ];

  // Pipeline Status Map
  const statusLabels: Record<string, { label: string; bg: string; text: string }> = {
    musteri_onayi: { label: 'Müşteri Onayı Bekliyor', bg: 'bg-amber-50', text: 'text-amber-800' },
    musteri_onayladi: { label: 'Müşteri Onayladı', bg: 'bg-emerald-50', text: 'text-emerald-800' },
    iplik_boya: { label: 'İplik & Boyama', bg: 'bg-blue-50', text: 'text-blue-800' },
    dokuma: { label: 'Dokuma / Üretimde', bg: 'bg-indigo-50', text: 'text-indigo-800' },
    kesim: { label: 'Kesim & Overlok', bg: 'bg-purple-50', text: 'text-purple-800' },
    kalite_kontrol: { label: 'Kalite Kontrol', bg: 'bg-teal-50', text: 'text-teal-800' },
    paketleme: { label: 'Paketlendi / Ambalaj', bg: 'bg-cyan-50', text: 'text-cyan-800' },
    kargo: { label: 'Kargoda / Sevkiyat', bg: 'bg-sky-50', text: 'text-sky-800' },
    teslim: { label: 'Teslim Edildi', bg: 'bg-slate-100', text: 'text-slate-700' }
  };

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Top Hero Banner - Bento Style */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 text-white p-6 rounded-xl shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-indigo-200 font-bold text-xs uppercase tracking-widest mb-1">
            <Sparkles className="w-4 h-4 text-indigo-300" /> Google AI & Paraşüt Destekli Halı ERP
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
            PulCarpet Müşteri, Üretim & Cari Finans Ekranı
          </h2>
          <p className="text-indigo-100 text-xs md:text-sm mt-1 max-w-2xl">
            Müşteri cari bakiyeleri, tedarikçi borçları, aktif üretim siparişleri, ihracat KDV iadeleri ve Paraşüt canlı senkronizasyon kontrol paneli.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => onNavigate('finance')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Wallet className="w-4 h-4" />
            <span>Finans & Paraşüt Entegrasyonu</span>
          </button>
          <button
            onClick={onQuickAiQuote}
            className="bg-white hover:bg-slate-100 text-indigo-600 font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4 fill-indigo-600" />
            <span>AI Teklif Oluştur</span>
          </button>
        </div>
      </div>

      {/* CORE REQUEST 1: Müşteri Alacakları & Tedarikçi Borçları (Main Dashboard Widget) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-xs uppercase tracking-wider">
              <Wallet className="w-4 h-4" /> CARİ DURUM & BAKIYE ÖZETİ
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
              Müşteri Alacakları & Tedarikçi Borçları Özeti
            </h3>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold text-emerald-800">
              Alacaklarımız: <span className="font-mono text-sm font-black">{totalReceivables.toLocaleString('tr-TR')} ₺</span>
            </div>
            <div className="bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl font-bold text-rose-800">
              Borçlarımız: <span className="font-mono text-sm font-black">{totalPayables.toLocaleString('tr-TR')} ₺</span>
            </div>
            <button
              onClick={() => onNavigate('finance')}
              className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
            >
              Tümünü Detaylı İncele →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Müşteri Alacakları Column */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" /> Müşteri Alacak Bakiyeleri
              </span>
              <span className="text-[11px] font-bold text-slate-500">{receivables.length} Kayıt</span>
            </div>

            <div className="space-y-2">
              {receivables.slice(0, 3).map((item) => (
                <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 text-xs flex items-center justify-between hover:border-emerald-300 transition-all">
                  <div>
                    <div className="font-bold text-slate-900">{item.partyName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Vade: <span className="font-mono font-medium text-slate-700">{item.dueDate}</span> • {item.notes}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-extrabold text-emerald-700 text-sm">
                      {item.amount.toLocaleString('tr-TR')} ₺
                    </div>
                    {item.status === 'gecikti' ? (
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">Gecikti</span>
                    ) : (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded">Vade Bekliyor</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tedarikçi Borçları Column */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-rose-600" /> Tedarikçi Borç Bakiyeleri
              </span>
              <span className="text-[11px] font-bold text-slate-500">{payables.length} Kayıt</span>
            </div>

            <div className="space-y-2">
              {payables.slice(0, 3).map((item) => (
                <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 text-xs flex items-center justify-between hover:border-rose-300 transition-all">
                  <div>
                    <div className="font-bold text-slate-900">{item.partyName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {item.companyCategory} • Vade: <span className="font-mono font-medium text-slate-700">{item.dueDate}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-extrabold text-rose-700 text-sm">
                      {item.amount.toLocaleString('tr-TR')} ₺
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                      Fatura: {item.invoiceNumber || '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Toplam Sipariş Cirosu</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              {totalRevenue.toLocaleString('tr-TR')} ₺
            </div>
            <div className="mt-1 flex items-center text-xs text-emerald-600 gap-1 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" /> %22.4 bu ay büyüme
            </div>
          </div>
        </div>

        {/* Card 2: Active Orders */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Üretimdeki Siparişler</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              {activeOrdersCount} <span className="text-xs font-normal text-slate-500">Aktif İş</span>
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5 text-indigo-600" />
              <span>Toplam {totalM2Produced.toFixed(1)} m² halı tezgahta</span>
            </div>
          </div>
        </div>

        {/* Card 3: CRM Customers */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Müşteriler & Fırsatlar</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              {customers.length} <span className="text-xs font-normal text-slate-500">Kayıtlı Müşteri</span>
            </div>
            <div className="mt-1 text-xs text-emerald-600 flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ortalama AI Skor: 82.5/100</span>
            </div>
          </div>
        </div>

        {/* Card 4: Pending Quotes */}
        <div className="bg-indigo-600 text-white p-5 rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold opacity-80 uppercase tracking-wider">Bekleyen Teklifler</span>
            <div className="p-2 bg-white/20 text-white rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight font-mono">
              {pendingQuotesCount} <span className="text-xs font-normal opacity-80">Beklemede</span>
            </div>
            <div className="mt-1 text-xs text-indigo-100 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Yanıt beklenen: 320.000 ₺</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">Satış & m² İlerleme Grafiği</h3>
              <p className="text-xs text-slate-500">Aylık bazda ciro tutarı (TL)</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
              2026 Sezonu
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySalesData}>
                <defs>
                  <linearGradient id="colorSatis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString('tr-TR')} ₺`, 'Satış Tutarı']}
                />
                <Area type="monotone" dataKey="satis" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorSatis)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Carpet Category Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Koleksiyon Dağılımı (% m²)</h3>
            <p className="text-xs text-slate-500 mb-4">En çok tercih edilen iplik/halı grupları</p>
            
            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
            {categoryDistribution.map((cat) => (
              <div key={cat.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-slate-600 font-medium truncate">{cat.name}: %{cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Production Pipeline & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Orders List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">İçerideki Siparişler & Müşteri Onay Durumları</h3>
              <p className="text-xs text-slate-500">Üretim aşamaları ve onay durumu takibi</p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              Tümünü Gör →
            </button>
          </div>

          <div className="space-y-3">
            {orders.slice(0, 4).map((order) => {
              const statusCfg = statusLabels[order.status] || { label: order.status, bg: 'bg-slate-100', text: 'text-slate-800' };
              return (
                <div key={order.id} className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/60 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-600">{order.orderNumber}</span>
                      <span className="text-xs text-slate-800 font-semibold">{order.customerName}</span>
                      {order.customerApproved ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                          ✓ Müşteri Onayladı
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                          ⏳ Onay Bekliyor
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {order.items.map(i => i.collectionName).join(', ')} • <span className="text-slate-700 font-medium">{order.totalM2} m²</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {order.totalAmount.toLocaleString('tr-TR')} ₺
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${statusCfg.bg} ${statusCfg.text} border border-slate-200`}>
                      {statusCfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Architectural B2B Projects Overview */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" /> Mimari Projeler
              </h3>
              <button
                onClick={() => onNavigate('projects')}
                className="text-xs text-indigo-600 hover:underline font-bold"
              >
                Yönet →
              </button>
            </div>

            <div className="space-y-3">
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

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigate('ai-assistant')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-indigo-700 text-xs font-bold py-2.5 rounded-lg border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Google AI ile Proje Analiz Et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

