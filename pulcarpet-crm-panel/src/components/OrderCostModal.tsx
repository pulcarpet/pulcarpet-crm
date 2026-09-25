import React, { useState } from 'react';
import { Order, CostItem, CostCategory, OrderCostBreakdown } from '../types';
import { 
  X, 
  Plus, 
  Trash2, 
  EyeOff, 
  DollarSign, 
  TrendingUp, 
  Percent, 
  Calculator, 
  ShieldAlert, 
  Save, 
  Sparkles, 
  HelpCircle,
  CheckCircle2,
  PieChart,
  Coins,
  ArrowRightLeft,
  Globe
} from 'lucide-react';

interface OrderCostModalProps {
  order: Order;
  onClose: () => void;
  onSaveCost: (orderId: string, breakdown: OrderCostBreakdown) => void;
}

export const OrderCostModal: React.FC<OrderCostModalProps> = ({
  order,
  onClose,
  onSaveCost,
}) => {
  // Determine order base currency
  const orderBaseCurrency: 'TL' | 'USD' | 'EUR' | 'GBP' = order.currency || 'TL';

  // Cost view & entry currency state (TL, USD, EUR, GBP)
  const [costCurrency, setCostCurrency] = useState<'TL' | 'USD' | 'EUR' | 'GBP'>(
    order.costBreakdown?.defaultCurrency || (orderBaseCurrency === 'USD' ? 'USD' : 'USD')
  );

  // Exchange rate for live conversion (USD/TRY, EUR/TRY)
  const [usdRate, setUsdRate] = useState<number>(order.costBreakdown?.usdRate || 38.50);
  const [eurRate, setEurRate] = useState<number>(order.costBreakdown?.eurRate || 41.80);

  // Pre-fill initial items if none exist
  const getInitialItems = (): CostItem[] => {
    if (order.costBreakdown && order.costBreakdown.items.length > 0) {
      return order.costBreakdown.items;
    }

    // Default smart estimates based on order.totalAmount
    const ciro = order.totalAmount || 10000;
    const isUsdOrder = orderBaseCurrency === 'USD';
    const initCurr = isUsdOrder ? 'USD' : 'USD';

    // If base currency is TL and cost currency is USD, calculate in USD equivalent
    const ciroInCostCurr = isUsdOrder ? ciro : (ciro / usdRate);

    return [
      {
        id: 'c-1',
        title: 'İplik & Dokuma Hammaddesi',
        amount: Number((ciroInCostCurr * 0.38).toFixed(2)),
        currency: initCurr,
        category: 'Hammadde',
        isImplicitCost: false,
        notes: 'Sipariş m² bazlı iplik & hammadde tüketimi'
      },
      {
        id: 'c-2',
        title: 'Kesim, Saçak & Overlok İşçiliği',
        amount: Number((ciroInCostCurr * 0.10).toFixed(2)),
        currency: initCurr,
        category: 'İşçilik',
        isImplicitCost: false,
        notes: 'Atölye ve dokuma işçilik gideri'
      },
      {
        id: 'c-3',
        title: 'Lojistik & Ambar Kargo Sevkiyatı',
        amount: Number((ciroInCostCurr * 0.05).toFixed(2)),
        currency: initCurr,
        category: 'Lojistik',
        isImplicitCost: false,
        notes: 'Müşteri adresine nakliye / ambar'
      },
      {
        id: 'c-4',
        title: 'Kesim Fire & Dokuma Hataları (Görünmez)',
        amount: Number((ciroInCostCurr * 0.04).toFixed(2)),
        currency: initCurr,
        category: 'Görünmez/Genel Gider',
        isImplicitCost: true,
        notes: 'Kenar tıraşlama ve kenar zayiatı payı'
      },
      {
        id: 'c-5',
        title: 'Ambalaj, Naylon & Rulo Koruyucu (Görünmez)',
        amount: Number((ciroInCostCurr * 0.025).toFixed(2)),
        currency: initCurr,
        category: 'Görünmez/Genel Gider',
        isImplicitCost: true,
        notes: 'Poşet, balonlu ambalaj ve bantlama'
      },
      {
        id: 'c-6',
        title: 'Banka / POS Komisyonu & Kur Farkı (Görünmez)',
        amount: Number((ciroInCostCurr * 0.03).toFixed(2)),
        currency: initCurr,
        category: 'Görünmez/Genel Gider',
        isImplicitCost: true,
        notes: 'Ödeme aracı komisyonu veya döviz risk payı'
      },
    ];
  };

  const [items, setItems] = useState<CostItem[]>(getInitialItems);
  const [customNotes, setCustomNotes] = useState<string>(order.costBreakdown?.customNotes || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New item draft state
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemAmount, setNewItemAmount] = useState<number | ''>('');
  const [newItemCurrency, setNewItemCurrency] = useState<'TL' | 'USD' | 'EUR' | 'GBP'>(costCurrency);
  const [newItemCategory, setNewItemCategory] = useState<CostCategory>('Görünmez/Genel Gider');
  const [newItemIsImplicit, setNewItemIsImplicit] = useState(true);

  // Currency helpers
  const getSymbol = (curr: 'TL' | 'USD' | 'EUR' | 'GBP') => {
    switch (curr) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return '₺';
    }
  };

  // Convert any amount to the active cost view currency
  const convertAmount = (amt: number, fromCurr: 'TL' | 'USD' | 'EUR' | 'GBP', toCurr: 'TL' | 'USD' | 'EUR' | 'GBP'): number => {
    if (fromCurr === toCurr) return amt;

    // First convert fromCurr to TL
    let inTL = amt;
    if (fromCurr === 'USD') inTL = amt * usdRate;
    else if (fromCurr === 'EUR') inTL = amt * eurRate;
    else if (fromCurr === 'GBP') inTL = amt * (usdRate * 1.28);

    // Then convert from TL to toCurr
    if (toCurr === 'TL') return inTL;
    if (toCurr === 'USD') return inTL / usdRate;
    if (toCurr === 'EUR') return inTL / eurRate;
    if (toCurr === 'GBP') return inTL / (usdRate * 1.28);

    return amt;
  };

  // Calculate order revenue in active cost currency
  const totalRevenue = convertAmount(order.totalAmount || 0, orderBaseCurrency, costCurrency);
  
  // Calculate direct and implicit costs normalized to costCurrency
  const directCosts = items
    .filter((item) => !item.isImplicitCost)
    .reduce((sum, item) => {
      const itemCurr = item.currency || costCurrency;
      const normalizedAmt = convertAmount(Number(item.amount) || 0, itemCurr, costCurrency);
      return sum + normalizedAmt;
    }, 0);

  const implicitCosts = items
    .filter((item) => item.isImplicitCost)
    .reduce((sum, item) => {
      const itemCurr = item.currency || costCurrency;
      const normalizedAmt = convertAmount(Number(item.amount) || 0, itemCurr, costCurrency);
      return sum + normalizedAmt;
    }, 0);

  const totalCost = directCosts + implicitCosts;
  const netProfit = totalRevenue - totalCost;
  const profitMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Handlers
  const handleAddItem = () => {
    if (!newItemTitle.trim() || Number(newItemAmount) <= 0) return;
    const newItem: CostItem = {
      id: `cost-${Date.now()}`,
      title: newItemTitle.trim(),
      amount: Number(newItemAmount),
      currency: newItemCurrency,
      exchangeRate: newItemCurrency === 'USD' ? usdRate : newItemCurrency === 'EUR' ? eurRate : 1,
      category: newItemCategory,
      isImplicitCost: newItemIsImplicit,
    };
    setItems([...items, newItem]);
    setNewItemTitle('');
    setNewItemAmount('');
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof CostItem, value: any) => {
    setItems(
      items.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const handleSave = () => {
    onSaveCost(order.id, {
      items,
      defaultCurrency: costCurrency,
      usdRate,
      eurRate,
      customNotes,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  // Helper for status badge
  const getMarginBadge = (margin: number) => {
    if (margin >= 35) {
      return { label: 'Yüksek Kârlı', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    } else if (margin >= 20) {
      return { label: 'Sağlıklı Kâr', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
    } else if (margin >= 5) {
      return { label: 'Düşük Kâr Marjı', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    } else {
      return { label: 'Kritik / Zararda', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
    }
  };

  const badgeInfo = getMarginBadge(profitMarginPercent);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl text-slate-100 shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  Satış & İş Bazlı Gerçek Maliyet Analizi
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeInfo.color}`}>
                  {badgeInfo.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sipariş No: <span className="text-indigo-300 font-bold font-mono">{order.orderNumber}</span> • Müşteri: <span className="text-slate-200 font-semibold">{order.customerName} ({order.company})</span>
              </p>
            </div>
          </div>

          {/* Currency Switcher & Rate Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1 gap-1">
              {(['USD', 'TL', 'EUR', 'GBP'] as const).map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => {
                    setCostCurrency(curr);
                    setNewItemCurrency(curr);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    costCurrency === curr
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {curr === 'USD' ? '$ Dolar' : curr === 'TL' ? '₺ TL' : curr === 'EUR' ? '€ Euro' : '£ GBP'}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Currency Rate Bar */}
        <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1 text-indigo-300 font-semibold">
              <Globe className="w-3.5 h-3.5" /> Maliyet Para Birimi: <strong className="text-white font-mono">{getSymbol(costCurrency)} {costCurrency}</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span>Sipariş Fatura Birimi: <strong className="text-amber-300 font-mono">{getSymbol(orderBaseCurrency)} {orderBaseCurrency}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-2 py-0.5 rounded-lg">
              <span className="text-[10px] text-slate-400 font-bold">1 USD ($) =</span>
              <input
                type="number"
                step="any"
                min="1"
                value={usdRate}
                onChange={(e) => setUsdRate(Number(e.target.value) || 38.5)}
                className="w-14 text-center font-mono font-bold text-emerald-400 bg-transparent outline-none text-xs"
              />
              <span className="text-[10px] text-slate-400">₺</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-2 py-0.5 rounded-lg">
              <span className="text-[10px] text-slate-400 font-bold">1 EUR (€) =</span>
              <input
                type="number"
                step="any"
                min="1"
                value={eurRate}
                onChange={(e) => setEurRate(Number(e.target.value) || 41.8)}
                className="w-14 text-center font-mono font-bold text-indigo-400 bg-transparent outline-none text-xs"
              />
              <span className="text-[10px] text-slate-400">₺</span>
            </div>
          </div>
        </div>

        {/* Live Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/60 border-b border-slate-800 text-xs shrink-0">
          {/* Satış Ciro */}
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">Satış Tutarı (Ciro)</div>
            <div className="text-base font-black text-white font-mono">
              {totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getSymbol(costCurrency)}
            </div>
            <div className="text-[10px] text-slate-500">
              {order.totalM2.toFixed(2)} m² Toplam
              {orderBaseCurrency !== costCurrency && (
                <span className="ml-1 text-slate-400">({order.totalAmount.toLocaleString('tr-TR')} {getSymbol(orderBaseCurrency)})</span>
              )}
            </div>
          </div>

          {/* Doğrudan Maliyet */}
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">Doğrudan Maliyet</div>
            <div className="text-base font-bold text-amber-400 font-mono">
              {directCosts.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getSymbol(costCurrency)}
            </div>
            <div className="text-[10px] text-slate-500">İplik, Dokuma, Kargo</div>
          </div>

          {/* Görünmez Maliyetler */}
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <EyeOff className="w-3 h-3 text-purple-400" />
              <span>Görünmez Maliyet</span>
            </div>
            <div className="text-base font-bold text-purple-300 font-mono">
              {implicitCosts.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getSymbol(costCurrency)}
            </div>
            <div className="text-[10px] text-slate-500">Fire, Ambalaj, POS, Risk</div>
          </div>

          {/* Gerçek Net Kâr */}
          <div className={`p-3 rounded-xl border space-y-1 ${
            netProfit >= 0 ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
          }`}>
            <div className="text-[11px] font-medium flex items-center justify-between">
              <span>Gerçek Net Kâr</span>
              <span className="font-extrabold font-mono text-xs">%{profitMarginPercent.toFixed(1)}</span>
            </div>
            <div className="text-base font-black font-mono">
              {netProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getSymbol(costCurrency)}
            </div>
            <div className="text-[10px] opacity-80">
              Toplam Maliyet: {totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getSymbol(costCurrency)}
            </div>
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">

          {/* Cost Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Coins className="w-4 h-4 text-indigo-400" /> Maliyet ve Görünmez Kalemler Listesi
              </h3>
              <span className="text-[11px] text-slate-400">
                {items.length} Kalem ({costCurrency} bazında)
              </span>
            </div>

            <div className="space-y-2">
              {items.map((item) => {
                const itemCurr = item.currency || costCurrency;
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      item.isImplicitCost
                        ? 'bg-purple-950/20 border-purple-800/40 hover:border-purple-700/60'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Left: Title & Notes */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleUpdateItem(item.id, 'title', e.target.value)}
                          className="bg-transparent text-xs font-bold text-white outline-none focus:border-b focus:border-indigo-500 w-full max-w-sm"
                        />
                        {item.isImplicitCost ? (
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-medium flex items-center gap-1 shrink-0">
                            <EyeOff className="w-3 h-3" /> Görünmez Maliyet
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium shrink-0">
                            Doğrudan Maliyet
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => handleUpdateItem(item.id, 'notes', e.target.value)}
                        placeholder="Not / açıklama..."
                        className="bg-transparent text-[11px] text-slate-400 outline-none w-full"
                      />
                    </div>

                    {/* Middle: Category & Toggle Implicit */}
                    <div className="flex items-center gap-2">
                      <select
                        value={item.category}
                        onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value as CostCategory)}
                        className="bg-slate-900 border border-slate-700 text-[11px] text-slate-300 rounded p-1"
                      >
                        <option value="Hammadde">Hammadde</option>
                        <option value="İşçilik">İşçilik</option>
                        <option value="Lojistik">Lojistik</option>
                        <option value="Görünmez/Genel Gider">Görünmez/Genel Gider</option>
                        <option value="Komisyon">Komisyon</option>
                        <option value="Diğer">Diğer</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleUpdateItem(item.id, 'isImplicitCost', !item.isImplicitCost)}
                        title={item.isImplicitCost ? "Görünmez maliyetten çıkar" : "Görünmez maliyet yap"}
                        className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          item.isImplicitCost
                            ? 'bg-purple-600 text-white border-purple-500'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Right: Currency & Amount & Delete */}
                    <div className="flex items-center gap-2 justify-end">
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-2 py-1 rounded-lg">
                        <select
                          value={itemCurr}
                          onChange={(e) => handleUpdateItem(item.id, 'currency', e.target.value)}
                          className="bg-transparent text-xs font-extrabold text-amber-400 outline-none cursor-pointer"
                        >
                          <option value="USD" className="bg-slate-900 text-white">$ USD</option>
                          <option value="TL" className="bg-slate-900 text-white">₺ TL</option>
                          <option value="EUR" className="bg-slate-900 text-white">€ EUR</option>
                          <option value="GBP" className="bg-slate-900 text-white">£ GBP</option>
                        </select>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.amount ?? ''}
                          onChange={(e) => handleUpdateItem(item.id, 'amount', e.target.value === '' ? 0 : Number(e.target.value))}
                          className="w-24 text-right text-xs font-bold font-mono text-white outline-none bg-transparent"
                        />
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add New Cost Item Row */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Yeni Maliyet Kalemi Ekle
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-4">
                <label className="block text-[11px] text-slate-400 mb-1">Maliyet / Görünmez Kalem Adı</label>
                <input
                  type="text"
                  placeholder="Örn: İthal Bambu İplik Hammaddesi ($)"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Para Birimi</label>
                <select
                  value={newItemCurrency}
                  onChange={(e) => setNewItemCurrency(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-amber-400 outline-none focus:border-indigo-500"
                >
                  <option value="USD">$ Dolar (USD)</option>
                  <option value="TL">₺ Türk Lirası (TL)</option>
                  <option value="EUR">€ Euro (EUR)</option>
                  <option value="GBP">£ Pound (GBP)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Tutar ({getSymbol(newItemCurrency)})</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={newItemAmount}
                  onChange={(e) => setNewItemAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">Tür</label>
                <button
                  type="button"
                  onClick={() => setNewItemIsImplicit(!newItemIsImplicit)}
                  className={`w-full py-2 px-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    newItemIsImplicit
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>{newItemIsImplicit ? 'Görünmez' : 'Doğrudan'}</span>
                </button>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  Ekle
                </button>
              </div>
            </div>
          </div>

          {/* Notes & Explanation Box */}
          <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Özel Maliyet Değerlendirme & Yöneticisi Notu
            </label>
            <textarea
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Örn: İplik alımı 3.40$ / kg kuru ile yapıldı. Nakliye ve gümrük masrafları dahil edilmiştir."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
            />
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Maliyetler Dolar ($) olarak kaydedildiğinde kur değişimlerine göre otomatik güncellenir.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
            >
              Vazgeç
            </button>

            <button
              onClick={handleSave}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Kaydedildi!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Maliyet Analizini Kaydet ({costCurrency})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
