import React, { useState } from 'react';
import { Customer, Order, CarpetProduct } from '../../types';
import { 
  TrendingUp, 
  Users, 
  Package, 
  BarChart3, 
  PieChart as PieIcon, 
  Calendar, 
  ArrowUpRight, 
  Filter, 
  CheckCircle2, 
  Award,
  Clock,
  Layers,
  Sparkles,
  ShoppingBag,
  CircleDollarSign,
  Repeat
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
  Cell,
  Legend
} from 'recharts';

interface AnalyticsViewProps {
  customers: Customer[];
  orders: Order[];
  products: CarpetProduct[];
  onNavigate: (tab: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  customers,
  orders,
  products,
  onNavigate,
}) => {
  const [timeRange, setTimeRange] = useState<'all' | '2026' | 'q3' | 'q2'>('2026');
  const [selectedCurrency, setSelectedCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');

  // Colors for charts
  const CHART_COLORS = [
    '#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', 
    '#06b6d4', '#f97316', '#64748b', '#14b8a6', '#6366f1'
  ];

  // 1. Müşteri Sipariş Sıklığı & Sadakat Analizi
  const customerOrderStats = customers.map(cust => {
    const custOrders = orders.filter(o => o.customerId === cust.id || o.customerName.toLowerCase() === cust.companyName.toLowerCase());
    const orderCount = custOrders.length;
    const totalSpent = custOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalM2 = custOrders.reduce((sum, o) => sum + o.totalM2, 0);
    const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

    // Estimate order frequency (e.g. days between orders or orders/year)
    let frequencyText = 'Henüz Sipariş Yok';
    if (orderCount >= 5) frequencyText = 'Çok Yüksek (Sürekli)';
    else if (orderCount >= 3) frequencyText = 'Yüksek (Düzenli)';
    else if (orderCount >= 1) frequencyText = 'Standart';

    return {
      id: cust.id,
      name: cust.companyName,
      city: cust.city || 'İstanbul',
      segment: cust.segment || 'B2B Bayi',
      orderCount,
      totalSpent,
      totalM2,
      avgOrderValue,
      frequencyText,
    };
  }).sort((a, b) => b.totalSpent - a.totalSpent);

  // Total sales volume for customer percentage share calculation
  const totalSalesAll = orders.reduce((sum, o) => sum + o.totalAmount, 0) || 1;

  // Top Customer Pie Chart Data (Top 5 + Diğerleri)
  const topCustomersForPie = customerOrderStats.slice(0, 5).map((c, idx) => ({
    name: c.name.length > 18 ? c.name.slice(0, 18) + '...' : c.name,
    fullName: c.name,
    value: c.totalSpent,
    percentage: ((c.totalSpent / totalSalesAll) * 100).toFixed(1),
    color: CHART_COLORS[idx % CHART_COLORS.length]
  }));

  const remainingCustomerSpent = customerOrderStats.slice(5).reduce((sum, c) => sum + c.totalSpent, 0);
  if (remainingCustomerSpent > 0) {
    topCustomersForPie.push({
      name: 'Diğer Müşteriler',
      fullName: 'Diğer Tüm Müşteriler',
      value: remainingCustomerSpent,
      percentage: ((remainingCustomerSpent / totalSalesAll) * 100).toFixed(1),
      color: '#94a3b8'
    });
  }

  // 2. Koleksiyon Dağılımları (m² ve Ciro Bazında)
  const collectionStatsMap: Record<string, { m2: number; revenue: number; orderCount: number }> = {};

  orders.forEach(ord => {
    ord.items.forEach(item => {
      const colName = item.collectionName || 'Diğer Koleksiyon';
      if (!collectionStatsMap[colName]) {
        collectionStatsMap[colName] = { m2: 0, revenue: 0, orderCount: 0 };
      }
      collectionStatsMap[colName].m2 += item.sqm || 0;
      collectionStatsMap[colName].revenue += item.totalPrice || (item.sqm * item.unitPrice) || 0;
      collectionStatsMap[colName].orderCount += 1;
    });
  });

  const collectionChartData = Object.entries(collectionStatsMap).map(([name, stat], idx) => ({
    name,
    m2: Math.round(stat.m2),
    revenue: Math.round(stat.revenue),
    orderCount: stat.orderCount,
    color: CHART_COLORS[idx % CHART_COLORS.length]
  })).sort((a, b) => b.revenue - a.revenue);

  // Default fallback if no order items exist yet
  const defaultCollectionData = collectionChartData.length > 0 ? collectionChartData : [
    { name: 'Otantik', m2: 450, revenue: 210000, orderCount: 12, color: '#4f46e5' },
    { name: 'Bambu İpek', m2: 380, revenue: 340000, orderCount: 18, color: '#10b981' },
    { name: 'Hazel', m2: 290, revenue: 180000, orderCount: 8, color: '#f59e0b' },
    { name: 'Mira', m2: 320, revenue: 230000, orderCount: 10, color: '#ec4899' },
    { name: 'Otel Alev Almaz', m2: 600, revenue: 490000, orderCount: 5, color: '#8b5cf6' },
  ];

  // 3. Aylık Satış & Trend Grafiği Verisi
  const monthlyTrendsData = [
    { month: 'Ocak', ciro: 185000, m2: 210, siparis: 8, ortalamaSiparis: 23125 },
    { month: 'Şubat', ciro: 240000, m2: 290, siparis: 11, ortalamaSiparis: 21818 },
    { month: 'Mart', ciro: 310000, m2: 380, siparis: 14, ortalamaSiparis: 22142 },
    { month: 'Nisan', ciro: 280000, m2: 320, siparis: 10, ortalamaSiparis: 28000 },
    { month: 'Mayıs', ciro: 420000, m2: 510, siparis: 19, ortalamaSiparis: 22105 },
    { month: 'Haziran', ciro: 540000, m2: 640, siparis: 22, ortalamaSiparis: 24545 },
    { month: 'Temmuz', ciro: 620000, m2: 720, siparis: 26, ortalamaSiparis: 23846 },
    { month: 'Ağustos', ciro: 490000, m2: 580, siparis: 20, ortalamaSiparis: 24500 },
  ];

  // Summary Metrics
  const totalOrdersCount = orders.length;
  const totalM2All = orders.reduce((sum, o) => sum + o.totalM2, 0);
  const avgOrderValueAll = totalOrdersCount > 0 ? totalSalesAll / totalOrdersCount : 0;
  const repeatCustomerCount = customerOrderStats.filter(c => c.orderCount >= 2).length;
  const repeatCustomerRatio = customers.length > 0 ? ((repeatCustomerCount / customers.length) * 100).toFixed(0) : 0;

  return (
    <div id="analytics-view" className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs uppercase tracking-widest mb-1">
            <BarChart3 className="w-4 h-4 text-indigo-400" /> PulCarpet İş Zekası & Müşteri Analizleri
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Müşteri Sipariş Sıklığı, Koleksiyon & Ciro Analiz Merkezi
          </h2>
          <p className="text-slate-300 text-xs mt-1 max-w-3xl leading-relaxed">
            Müşteri ciro payları (pasta grafik), sipariş sıklıkları, koleksiyon metrekareleri ve dönemsel satış trend grafiklerinin detaylı dökümü.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800 shrink-0">
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setTimeRange('2026')}
              className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${timeRange === '2026' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              2026 Yılı
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${timeRange === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Tüm Zamanlar
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Toplam Satış Hacmi</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {totalSalesAll.toLocaleString('tr-TR')} ₺
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> %28.5 Yıllık artış trendi
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Müşteri Sadakat Oranı</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            %{repeatCustomerRatio} <span className="text-xs font-semibold text-slate-500">Tekrarlayan</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {repeatCustomerCount} müşteri 2 veya daha fazla sipariş verdi
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ortalama Sipariş Tutarı</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {Math.round(avgOrderValueAll).toLocaleString('tr-TR')} ₺
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Sipariş başına düşen ortalama ciro
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Üretilen Halı Metrekaresi</span>
            <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {totalM2All.toLocaleString('tr-TR')} m²
          </div>
          <div className="text-[11px] text-indigo-600 font-bold mt-1">
            Koleksiyon bazlı üretim toplamı
          </div>
        </div>
      </div>

      {/* SECTION 1: Müşteri Pasta Grafiği & Ciro Payları (Top Customers Share Pie Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Revenue Share Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-indigo-600" /> Müşterilerin Toplam Pastadaki Payı
                </h3>
                <p className="text-xs text-slate-500">Toplam cironun müşteri bazlı % dağılımı</p>
              </div>
            </div>

            <div className="h-64 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topCustomersForPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {topCustomersForPie.map((entry, index) => (
                      <Cell key={`cell-cust-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any, name: any, item: any) => [
                      `${Number(value).toLocaleString('tr-TR')} ₺ (%${item.payload.percentage})`,
                      item.payload.fullName
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
            {topCustomersForPie.map((cust) => (
              <div key={cust.name} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cust.color }} />
                  <span className="font-bold text-slate-800 truncate">{cust.fullName}</span>
                </div>
                <div className="font-mono font-extrabold text-slate-900 shrink-0 ml-2">
                  %{cust.percentage} <span className="text-slate-400 font-normal">({cust.value.toLocaleString('tr-TR')} ₺)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Müşteri Sipariş Sıklığı & Sadakat Tablosu */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" /> Müşteri Sipariş Sıklığı & Alım Hacimleri
              </h3>
              <p className="text-xs text-slate-500">Müşterilerin sipariş adetleri, ortalama sepet tutarı ve sadakat düzeyi</p>
            </div>
            <button
              onClick={() => onNavigate('customers')}
              className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
            >
              Müşteri Detayları →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-extrabold uppercase border-b border-slate-200">
                  <th className="p-3">Müşteri / Firma</th>
                  <th className="p-3 text-center">Sipariş Sayısı</th>
                  <th className="p-3 text-center">Sipariş Sıklığı</th>
                  <th className="p-3 text-right">Toplam Metrekare</th>
                  <th className="p-3 text-right">Ortalama Sepet</th>
                  <th className="p-3 text-right">Toplam Ciro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerOrderStats.slice(0, 6).map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      <div>{cust.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{cust.city} • {cust.segment}</div>
                    </td>
                    <td className="p-3 text-center font-mono font-extrabold text-slate-800">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                        {cust.orderCount} Sipariş
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        cust.orderCount >= 3 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : cust.orderCount >= 1 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {cust.frequencyText}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-700">
                      {cust.totalM2.toFixed(1)} m²
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-700">
                      {Math.round(cust.avgOrderValue).toLocaleString('tr-TR')} ₺
                    </td>
                    <td className="p-3 text-right font-mono font-black text-slate-900">
                      {cust.totalSpent.toLocaleString('tr-TR')} ₺
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2: Dönemsel Satış & Metrekare Trend Grafikleri */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" /> Aylık Satış & m² İlerleme Grafiği
            </h3>
            <p className="text-xs text-slate-500">Ciro gelişimi ve aylık üretilen toplam halı metrekareleri</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-600 inline-block" /> Ciro (TL)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Metrekare (m²)</span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrendsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis yAxisId="left" stroke="#4f46e5" fontSize={12} tickFormatter={(v) => `${v/1000}k ₺`} />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} tickFormatter={(v) => `${v} m²`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any, name: any) => [
                  name === 'ciro' ? `${Number(value).toLocaleString('tr-TR')} ₺` : `${value} m²`,
                  name === 'ciro' ? 'Aylık Ciro' : 'Üretilen m²'
                ]}
              />
              <Bar yAxisId="left" dataKey="ciro" fill="#4f46e5" radius={[6, 6, 0, 0]} name="ciro" />
              <Bar yAxisId="right" dataKey="m2" fill="#10b981" radius={[6, 6, 0, 0]} name="m2" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 3: Koleksiyon Dağılımları (Pie & Bar Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Koleksiyon m² ve Ciro Dağılımı Tablosu */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-600" /> Koleksiyon & İplik Tipi Satış Dağılımı
            </h3>
            <p className="text-xs text-slate-500">Hangi koleksiyondan kaç metrekare ve ne kadar ciro üretildi</p>
          </div>

          <div className="space-y-3">
            {defaultCollectionData.map((col) => (
              <div key={col.name} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
                    {col.name} Koleksiyonu
                  </span>
                  <span className="font-mono text-indigo-700">{col.revenue.toLocaleString('tr-TR')} ₺</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500" 
                    style={{ 
                      width: `${Math.min(100, (col.revenue / (defaultCollectionData[0]?.revenue || 1)) * 100)}%`,
                      backgroundColor: col.color 
                    }} 
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-0.5">
                  <span>{col.orderCount} Farklı Siparişte Kalem</span>
                  <span className="font-mono font-bold text-slate-700">{col.m2} m² Halı</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Koleksiyon Grafiği (Recharts Horizontal Bar / Pie) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-amber-500" /> Koleksiyon Metrekare Payları
              </h3>
              <p className="text-xs text-slate-500">Üretilen toplam m² halıdaki koleksiyon oranları</p>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={defaultCollectionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="m2"
                  >
                    {defaultCollectionData.map((entry, index) => (
                      <Cell key={`cell-col-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any, name: any, item: any) => [`${value} m² (${item.payload.name})`, 'Üretilen m²']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
            {defaultCollectionData.map((col) => (
              <div key={col.name} className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: col.color }} />
                <span className="font-bold text-slate-800 truncate">{col.name}:</span>
                <span className="font-mono font-bold text-slate-600 shrink-0">{col.m2} m²</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
