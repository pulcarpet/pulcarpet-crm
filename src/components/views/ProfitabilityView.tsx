import React, { useState } from 'react';
import { Order, OrderCostBreakdown } from '../../types';
import { OrderCostModal } from '../OrderCostModal';
import { 
  TrendingUp, 
  DollarSign, 
  EyeOff, 
  PieChart, 
  Calculator, 
  Search, 
  Filter, 
  ChevronRight, 
  ShieldCheck, 
  AlertTriangle, 
  Edit3, 
  Printer, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Package,
  Layers,
  Coins,
  Globe
} from 'lucide-react';

interface ProfitabilityViewProps {
  orders: Order[];
  onSaveOrderCost: (orderId: string, breakdown: OrderCostBreakdown) => void;
  searchTerm: string;
}

export const ProfitabilityView: React.FC<ProfitabilityViewProps> = ({
  orders,
  onSaveOrderCost,
  searchTerm,
}) => {
  const [selectedProfitFilter, setSelectedProfitFilter] = useState<string>('all');
  const [activeEditingOrder, setActiveEditingOrder] = useState<Order | null>(null);

  // Global display currency toggle ($ USD or ₺ TL)
  const [displayCurrency, setDisplayCurrency] = useState<'TL' | 'USD'>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(38.50);

  const getSymbol = (curr: 'TL' | 'USD') => (curr === 'USD' ? '$' : '₺');

  // Convert amount based on order & cost currency
  const toDisplayCurrency = (amount: number, fromCurr: string = 'TL'): number => {
    let inTL = amount;
    if (fromCurr === 'USD') inTL = amount * exchangeRate;
    else if (fromCurr === 'EUR') inTL = amount * (exchangeRate * 1.08);
    else if (fromCurr === 'GBP') inTL = amount * (exchangeRate * 1.28);
    else inTL = amount;

    if (displayCurrency === 'TL') return inTL;
    return inTL / exchangeRate;
  };

  // Helper to calculate cost metrics for an order
  const getOrderMetrics = (order: Order) => {
    const orderCurr = order.currency || 'TL';
    const revenueInDisplay = toDisplayCurrency(order.totalAmount || 0, orderCurr);
    
    let directCosts = 0;
    let implicitCosts = 0;

    if (order.costBreakdown && order.costBreakdown.items.length > 0) {
      order.costBreakdown.items.forEach((i) => {
        const itemCurr = i.currency || order.costBreakdown?.defaultCurrency || 'TL';
        const converted = toDisplayCurrency(Number(i.amount) || 0, itemCurr);
        if (i.isImplicitCost) {
          implicitCosts += converted;
        } else {
          directCosts += converted;
        }
      });
    } else {
      // Default estimate fallback if cost section hasn't been saved yet
      directCosts = revenueInDisplay * 0.53;
      implicitCosts = revenueInDisplay * 0.095;
    }

    const totalCost = directCosts + implicitCosts;
    const netProfit = revenueInDisplay - totalCost;
    const marginPercent = revenueInDisplay > 0 ? (netProfit / revenueInDisplay) * 100 : 0;

    return {
      revenue: revenueInDisplay,
      originalRevenue: order.totalAmount || 0,
      originalCurrency: orderCurr,
      directCosts,
      implicitCosts,
      totalCost,
      netProfit,
      marginPercent,
      hasCustomCosts: !!order.costBreakdown,
      costCurrency: order.costBreakdown?.defaultCurrency || 'USD'
    };
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = 
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.company.toLowerCase().includes(searchTerm.toLowerCase());

    const metrics = getOrderMetrics(o);
    let matchesFilter = true;
    if (selectedProfitFilter === 'high') matchesFilter = metrics.marginPercent >= 35;
    if (selectedProfitFilter === 'medium') matchesFilter = metrics.marginPercent >= 20 && metrics.marginPercent < 35;
    if (selectedProfitFilter === 'low') matchesFilter = metrics.marginPercent >= 5 && metrics.marginPercent < 20;
    if (selectedProfitFilter === 'critical') matchesFilter = metrics.marginPercent < 5;

    return matchesSearch && matchesFilter;
  });

  // Overall Global Totals
  const globalMetrics = orders.reduce(
    (acc, o) => {
      const m = getOrderMetrics(o);
      acc.revenue += m.revenue;
      acc.directCosts += m.directCosts;
      acc.implicitCosts += m.implicitCosts;
      acc.totalCost += m.totalCost;
      acc.netProfit += m.netProfit;
      return acc;
    },
    { revenue: 0, directCosts: 0, implicitCosts: 0, totalCost: 0, netProfit: 0 }
  );

  const globalMarginPercent = globalMetrics.revenue > 0 ? (globalMetrics.netProfit / globalMetrics.revenue) * 100 : 0;

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div id="profitability-view" className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <PieChart className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Satış Bazlı Gerçek Kâr Marjı & Görünmez Maliyet Analizi
            </h2>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/30 font-bold">
              Dolar & TL Çoklu Para Birimi
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Her bir satış dosyasının hammadde, dokuma, işçilik, nakliye ve gizli görünmez maliyetlerinin Dolar ($) veya TL (₺) bazında net kârlılık takibi
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Display Currency Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl p-1 gap-1">
            <button
              onClick={() => setDisplayCurrency('USD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                displayCurrency === 'USD'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              $ Dolar
            </button>
            <button
              onClick={() => setDisplayCurrency('TL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                displayCurrency === 'TL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ₺ TL
            </button>
          </div>

          <button
            onClick={handlePrintReport}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer print:hidden"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>Kârlılık Raporu Yazdır</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Ciro */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Toplam Satış Cirosu</span>
            <Coins className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {globalMetrics.revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getSymbol(displayCurrency)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {orders.length} Satış Dosyası
          </div>
        </div>

        {/* Doğrudan Maliyet */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Doğrudan Maliyetler</span>
            <Calculator className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-600 font-mono">
            {globalMetrics.directCosts.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getSymbol(displayCurrency)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            İplik, Dokuma, Kargo
          </div>
        </div>

        {/* Görünmez Maliyetler */}
        <div className="bg-purple-50/50 border border-purple-200 p-4 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-purple-700 text-xs font-bold">
            <span className="flex items-center gap-1">
              <EyeOff className="w-3.5 h-3.5" /> Görünmez Maliyet
            </span>
            <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded font-mono font-bold">
              Gizli Gider
            </span>
          </div>
          <div className="text-xl font-black text-purple-800 font-mono">
            {globalMetrics.implicitCosts.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getSymbol(displayCurrency)}
          </div>
          <div className="text-[11px] text-purple-600 font-medium">
            Fire, Ambalaj, POS, Kur
          </div>
        </div>

        {/* Toplam Gerçekleşen Maliyet */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Toplam Gerçek Maliyet</span>
            <ArrowDownRight className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-slate-800 font-mono">
            {globalMetrics.totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getSymbol(displayCurrency)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Doğrudan + Görünmez Toplamı
          </div>
        </div>

        {/* Ortalama Net Gerçek Kâr Marjı */}
        <div className={`border p-4 rounded-xl shadow-xs space-y-2 ${
          globalMarginPercent >= 20 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold">
            <span>Gerçek Net Kâr Marjı</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black font-mono">
            %{globalMarginPercent.toFixed(1)}
          </div>
          <div className="text-[11px] font-bold text-emerald-700 font-mono">
            Net: {globalMetrics.netProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getSymbol(displayCurrency)}
          </div>
        </div>
      </div>

      {/* Visual Cost Structure Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Portföy Genel Maliyet & Kârlılık Dağılımı ({displayCurrency})</span>
          <span className="text-indigo-600 font-mono">
            Toplam Ciro: {globalMetrics.revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getSymbol(displayCurrency)}
          </span>
        </div>

        {globalMetrics.revenue > 0 ? (
          <div className="space-y-1.5">
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div 
                style={{ width: `${(globalMetrics.directCosts / globalMetrics.revenue) * 100}%` }} 
                className="bg-amber-500 h-full" 
                title="Doğrudan Maliyet"
              />
              <div 
                style={{ width: `${(globalMetrics.implicitCosts / globalMetrics.revenue) * 100}%` }} 
                className="bg-purple-600 h-full" 
                title="Görünmez Maliyet"
              />
              <div 
                style={{ width: `${Math.max(0, (globalMetrics.netProfit / globalMetrics.revenue) * 100)}%` }} 
                className="bg-emerald-500 h-full" 
                title="Gerçek Net Kâr"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>Doğrudan Maliyet: %{((globalMetrics.directCosts / globalMetrics.revenue) * 100).toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                <span>Görünmez Maliyet: %{((globalMetrics.implicitCosts / globalMetrics.revenue) * 100).toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Gerçek Net Kâr: %{globalMarginPercent.toFixed(1)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 py-2">Sistemde henüz kayıtlı satış bulunmuyor.</div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedProfitFilter('all')}
          className={`px-3.5 py-1.5 rounded-lg border font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedProfitFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Tüm Satışlar ({orders.length})
        </button>

        <button
          onClick={() => setSelectedProfitFilter('high')}
          className={`px-3.5 py-1.5 rounded-lg border font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedProfitFilter === 'high'
              ? 'bg-emerald-700 text-white border-emerald-700'
              : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          Yüksek Kârlı (%35+)
        </button>

        <button
          onClick={() => setSelectedProfitFilter('medium')}
          className={`px-3.5 py-1.5 rounded-lg border font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedProfitFilter === 'medium'
              ? 'bg-indigo-700 text-white border-indigo-700'
              : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
          }`}
        >
          Sağlıklı Kâr (%20 - %35)
        </button>

        <button
          onClick={() => setSelectedProfitFilter('low')}
          className={`px-3.5 py-1.5 rounded-lg border font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedProfitFilter === 'low'
              ? 'bg-amber-700 text-white border-amber-700'
              : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
          }`}
        >
          Düşük Kârlı (%5 - %20)
        </button>

        <button
          onClick={() => setSelectedProfitFilter('critical')}
          className={`px-3.5 py-1.5 rounded-lg border font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedProfitFilter === 'critical'
              ? 'bg-rose-700 text-white border-rose-700'
              : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
          }`}
        >
          Kritik / Zayiatlı (&lt; %5)
        </button>
      </div>

      {/* Main Jobs & Sales Profitability Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-600" /> Satış Bazlı Dosya ve Gerçek Kâr Marjı Listesi ({displayCurrency})
          </h3>
          <span className="text-xs text-slate-500 font-medium">{filteredOrders.length} Satış Listeleniyor</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <th className="p-3">Sipariş / Müşteri</th>
                <th className="p-3">Ürün & m²</th>
                <th className="p-3 text-right">Satış Tutarı</th>
                <th className="p-3 text-right">Doğrudan Maliyet</th>
                <th className="p-3 text-right">Görünmez Maliyet</th>
                <th className="p-3 text-right">Toplam Maliyet</th>
                <th className="p-3 text-right">Gerçek Net Kâr</th>
                <th className="p-3 text-center">Gerçek Kâr Marjı</th>
                <th className="p-3 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const m = getOrderMetrics(order);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Customer / Order */}
                      <td className="p-3 space-y-0.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{order.orderNumber}</span>
                          {m.hasCustomCosts && (
                            <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-bold">
                              {m.costCurrency === 'USD' ? '$ Dolar Maliyetli' : 'Özel Analizli'}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-600 font-medium">{order.customerName}</div>
                        <div className="text-[10px] text-slate-400">{order.company}</div>
                      </td>

                      {/* Items / SQM */}
                      <td className="p-3 space-y-0.5">
                        <div className="font-bold text-slate-900">
                          {order.items[0]?.collectionName || 'Özel Halı Üretimi'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {order.totalM2.toFixed(2)} m² • {order.items.length} Kalem
                        </div>
                      </td>

                      {/* Satış Ciro */}
                      <td className="p-3 text-right font-black font-mono text-slate-900">
                        <div>{m.revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getSymbol(displayCurrency)}</div>
                        {order.currency && order.currency !== displayCurrency && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            ({order.totalAmount.toLocaleString('tr-TR')} {order.currency === 'USD' ? '$' : order.currency === 'EUR' ? '€' : '₺'})
                          </div>
                        )}
                      </td>

                      {/* Doğrudan Maliyet */}
                      <td className="p-3 text-right font-bold font-mono text-amber-700">
                        {m.directCosts.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getSymbol(displayCurrency)}
                      </td>

                      {/* Görünmez Maliyet */}
                      <td className="p-3 text-right font-bold font-mono text-purple-700">
                        <div className="flex items-center justify-end gap-1">
                          <EyeOff className="w-3 h-3 text-purple-500" />
                          <span>{m.implicitCosts.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getSymbol(displayCurrency)}</span>
                        </div>
                      </td>

                      {/* Toplam Maliyet */}
                      <td className="p-3 text-right font-bold font-mono text-slate-800">
                        {m.totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getSymbol(displayCurrency)}
                      </td>

                      {/* Net Kâr */}
                      <td className={`p-3 text-right font-black font-mono ${
                        m.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {m.netProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getSymbol(displayCurrency)}
                      </td>

                      {/* Margin % & Badge */}
                      <td className="p-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-full border ${
                            m.marginPercent >= 35
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : m.marginPercent >= 20
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                              : m.marginPercent >= 5
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            %{m.marginPercent.toFixed(1)}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setActiveEditingOrder(order)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold border border-indigo-200 transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Maliyet Gir/Düzenle ($/₺)</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Kriterlere uygun herhangi bir satış kaydı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Cost Modal when selected */}
      {activeEditingOrder && (
        <OrderCostModal
          order={activeEditingOrder}
          onClose={() => setActiveEditingOrder(null)}
          onSaveCost={(orderId, breakdown) => {
            onSaveOrderCost(orderId, breakdown);
          }}
        />
      )}

    </div>
  );
};
