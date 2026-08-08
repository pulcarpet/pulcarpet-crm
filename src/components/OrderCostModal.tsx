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
  Coins
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
  // Pre-fill initial items if none exist
  const getInitialItems = (): CostItem[] => {
    if (order.costBreakdown && order.costBreakdown.items.length > 0) {
      return order.costBreakdown.items;
    }
    // Default smart estimates based on order.totalAmount
    const ciro = order.totalAmount || 10000;
    return [
      {
        id: 'c-1',
        title: 'İplik & Dokuma Hammaddesi',
        amount: Math.round(ciro * 0.38),
        category: 'Hammadde',
        isImplicitCost: false,
        notes: 'Sipariş m² bazlı iplik tüketimi'
      },
      {
        id: 'c-2',
        title: 'Kesim, Saçak & Overlok İşçiliği',
        amount: Math.round(ciro * 0.10),
        category: 'İşçilik',
        isImplicitCost: false,
        notes: 'Atölye işçilik gideri'
      },
      {
        id: 'c-3',
        title: 'Lojistik & Ambar Kargo Sevkiyatı',
        amount: Math.round(ciro * 0.05),
        category: 'Lojistik',
        isImplicitCost: false,
        notes: 'Müşteri adresine kargo'
      },
      {
        id: 'c-4',
        title: 'Kesim Fire & Dokuma Hataları (Görünmez)',
        amount: Math.round(ciro * 0.04),
        category: 'Görünmez/Genel Gider',
        isImplicitCost: true,
        notes: 'Kenar tıraşlama ve kenar zayiatı'
      },
      {
        id: 'c-5',
        title: 'Ambalaj, Naylon & Rulo Koruyucu (Görünmez)',
        amount: Math.round(ciro * 0.025),
        category: 'Görünmez/Genel Gider',
        isImplicitCost: true,
        notes: 'Poşet, balonlu ambalaj ve bant'
      },
      {
        id: 'c-6',
        title: 'Banka / POS Komisyonu & Kur Farkı (Görünmez)',
        amount: Math.round(ciro * 0.03),
        category: 'Görünmez/Genel Gider',
        isImplicitCost: true,
        notes: 'Kredi kartı çekim veya döviz risk payı'
      },
    ];
  };

  const [items, setItems] = useState<CostItem[]>(getInitialItems);
  const [customNotes, setCustomNotes] = useState<string>(order.costBreakdown?.customNotes || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New item draft state
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemAmount, setNewItemAmount] = useState<number>(0);
  const [newItemCategory, setNewItemCategory] = useState<CostCategory>('Görünmez/Genel Gider');
  const [newItemIsImplicit, setNewItemIsImplicit] = useState(true);

  // Calculations
  const totalRevenue = order.totalAmount || 0;
  
  const directCosts = items
    .filter((item) => !item.isImplicitCost)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const implicitCosts = items
    .filter((item) => item.isImplicitCost)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const totalCost = directCosts + implicitCosts;
  const netProfit = totalRevenue - totalCost;
  const profitMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Handlers
  const handleAddItem = () => {
    if (!newItemTitle.trim() || newItemAmount <= 0) return;
    const newItem: CostItem = {
      id: `cost-${Date.now()}`,
      title: newItemTitle.trim(),
      amount: Number(newItemAmount),
      category: newItemCategory,
      isImplicitCost: newItemIsImplicit,
    };
    setItems([...items, newItem]);
    setNewItemTitle('');
    setNewItemAmount(0);
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
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
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

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/60 border-b border-slate-800 text-xs shrink-0">
          {/* Satış Ciro */}
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">Satış Tutarı (Ciro)</div>
            <div className="text-base font-black text-white font-mono">
              {totalRevenue.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-[10px] text-slate-500">{order.totalM2.toFixed(2)} m² Toplam</div>
          </div>

          {/* Doğrudan Maliyet */}
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">Doğrudan Maliyet</div>
            <div className="text-base font-bold text-amber-400 font-mono">
              {directCosts.toLocaleString('tr-TR')} ₺
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
              {implicitCosts.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-[10px] text-slate-500">Fire, Ambalaj, POS, Risk</div>
          </div>

          {/* Gerçek Net Kâr */}
          <div className={`p-3 rounded-xl border space-y-1 ${
            netProfit >= 0 ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
          }`}>
            <div className="text-[11px] font-medium flex items-center justify-between">
              <span>Gerçek Net Kâr</span>
              <span className="font-extrabold font-mono text-xs">{profitMarginPercent.toFixed(1)}%</span>
            </div>
            <div className="text-base font-black font-mono">
              {netProfit.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-[10px] opacity-80">Toplam Maliyet: {totalCost.toLocaleString('tr-TR')} ₺</div>
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
                {items.length} Kalem Eklendi
              </span>
            </div>

            <div className="space-y-2">
              {items.map((item) => (
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

                  {/* Right: Amount & Delete */}
                  <div className="flex items-center gap-2 justify-end">
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg">
                      <span className="text-xs font-bold text-slate-400">₺</span>
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => handleUpdateItem(item.id, 'amount', Number(e.target.value))}
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
              ))}
            </div>
          </div>

          {/* Add New Cost Item Row */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Yeni Maliyet Kalemi Ekle
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5">
                <label className="block text-[11px] text-slate-400 mb-1">Maliyet / Görünmez Kalem Adı</label>
                <input
                  type="text"
                  placeholder="Örn: Elektrik & Atölye Amortisman Payı"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] text-slate-400 mb-1">Tutar (TL)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newItemAmount || ''}
                  onChange={(e) => setNewItemAmount(Number(e.target.value))}
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
              placeholder="Örn: Bu işte kenar kesim fire oranı beklenenden %2 daha yüksek oldu, ancak müşteri teslimatı zamanında kabul etti."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
            />
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Görünmez maliyetler kâr marjının doğru görünmesini sağlar.</span>
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
                  <span>Maliyet Analizini Kaydet</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
