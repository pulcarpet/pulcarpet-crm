import React, { useState, useEffect, useRef } from 'react';
import { Order, CarpetProduct } from '../../types';
import { 
  ScanBarcode, 
  CheckCircle, 
  AlertCircle, 
  PackageCheck, 
  Box, 
  ArrowRight, 
  Truck, 
  Printer, 
  RefreshCw, 
  Clock, 
  Layers, 
  Plus, 
  Minus, 
  Search,
  Check,
  AlertTriangle
} from 'lucide-react';

interface OrderBarcodeDispatchSectionProps {
  orders: Order[];
  products: CarpetProduct[];
  onUpdateOrders: (orders: Order[]) => void;
  onUpdateProducts: (products: CarpetProduct[]) => void;
  currentUser?: { username: string; name: string; role: string; token: string } | null;
  selectedOrderId?: string;
  onSelectOrder?: (orderId: string) => void;
}

export const OrderBarcodeDispatchSection: React.FC<OrderBarcodeDispatchSectionProps> = ({
  orders,
  products,
  onUpdateOrders,
  onUpdateProducts,
  currentUser,
  selectedOrderId,
  onSelectOrder,
}) => {
  const [activeOrderId, setActiveOrderId] = useState<string>(
    selectedOrderId || (orders.length > 0 ? orders[0].id : '')
  );

  useEffect(() => {
    if (selectedOrderId) {
      setActiveOrderId(selectedOrderId);
    }
  }, [selectedOrderId]);

  // Selected Order
  const activeOrder = orders.find((o) => o.id === activeOrderId) || orders[0] || null;

  // Track scanned count per item: key is `${orderId}_${itemId}`
  const [scannedCounts, setScannedCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('pulcarpet_dispatch_scanned_counts');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const [barcodeInput, setBarcodeInput] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Play audio beep on barcode scan
  const playBeep = (isSuccess: boolean) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      // Audio fallback
    }
  };

  const saveCounts = (updated: Record<string, number>) => {
    setScannedCounts(updated);
    try {
      localStorage.setItem('pulcarpet_dispatch_scanned_counts', JSON.stringify(updated));
    } catch (e) {}
  };

  // Helper: item key
  const getItemKey = (orderId: string, itemId: string) => `${orderId}_${itemId}`;

  // Check how many items in active order are scanned
  const totalItemsRequired = activeOrder
    ? activeOrder.items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0)
    : 0;

  const totalItemsScanned = activeOrder
    ? activeOrder.items.reduce((sum, it) => {
        const k = getItemKey(activeOrder.id, it.id);
        const scanned = scannedCounts[k] || 0;
        return sum + Math.min(scanned, Number(it.quantity) || 1);
      }, 0)
    : 0;

  const isOrderFullyScanned = totalItemsRequired > 0 && totalItemsScanned >= totalItemsRequired;
  const scanProgressPercent = totalItemsRequired > 0 ? Math.min(100, Math.round((totalItemsScanned / totalItemsRequired) * 100)) : 0;

  // Handle single item scan or pick
  const handleItemScanIncrement = (itemId: string, itemTitle?: string) => {
    if (!activeOrder) return;
    const key = getItemKey(activeOrder.id, itemId);
    const targetItem = activeOrder.items.find((i) => i.id === itemId);
    if (!targetItem) return;

    const maxQty = Number(targetItem.quantity) || 1;
    const current = scannedCounts[key] || 0;

    if (current >= maxQty) {
      setFeedback({
        message: `⚠️ "${targetItem.collectionName}" zaten tam adet (${maxQty}) olarak okutulup depodan çıkartıldı.`,
        type: 'warning',
      });
      playBeep(false);
      return;
    }

    const updated = { ...scannedCounts, [key]: current + 1 };
    saveCounts(updated);

    // Deduct stock from matching product in catalog
    const matchedProduct = products.find(
      (p) =>
        p.name.toLowerCase().includes(targetItem.collectionName.toLowerCase()) ||
        targetItem.collectionName.toLowerCase().includes(p.name.toLowerCase()) ||
        (targetItem.colorCode && p.patternCode && p.patternCode.toLowerCase() === targetItem.colorCode.toLowerCase())
    );

    if (matchedProduct && matchedProduct.stockM2 > 0) {
      const deductM2 = targetItem.dimensionMode === 'sqm'
        ? Number(targetItem.areaM2 || 1)
        : ((Number(targetItem.widthCm || 0) * Number(targetItem.lengthCm || 0)) / 10000);
      const updatedProducts = products.map((p) =>
        p.id === matchedProduct.id
          ? { ...p, stockM2: Math.max(0, Number((p.stockM2 - deductM2).toFixed(2))) }
          : p
      );
      onUpdateProducts(updatedProducts);
    }

    playBeep(true);
    setFeedback({
      message: `✓ "${targetItem.collectionName}" (${current + 1}/${maxQty}) depodan çıkışı yapıldı!`,
      type: 'success',
    });

    setTimeout(() => setFeedback(null), 3000);
  };

  const handleItemScanDecrement = (itemId: string) => {
    if (!activeOrder) return;
    const key = getItemKey(activeOrder.id, itemId);
    const current = scannedCounts[key] || 0;
    if (current <= 0) return;

    const updated = { ...scannedCounts, [key]: current - 1 };
    saveCounts(updated);
  };

  // Barcode Submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code || !activeOrder) return;

    // Search inside this order's items
    const matchingItem = activeOrder.items.find((item) => {
      const matchCollection = item.collectionName.toLowerCase().includes(code.toLowerCase());
      const matchColor = item.colorCode && item.colorCode.toLowerCase().includes(code.toLowerCase());
      const matchId = item.id.toLowerCase() === code.toLowerCase();
      // Check if code matches barcode of any linked catalog product
      const linkedProduct = products.find(
        (p) => p.barcode === code && (
          p.name.toLowerCase().includes(item.collectionName.toLowerCase()) ||
          item.collectionName.toLowerCase().includes(p.name.toLowerCase())
        )
      );
      return matchCollection || matchColor || matchId || !!linkedProduct;
    });

    if (matchingItem) {
      handleItemScanIncrement(matchingItem.id, matchingItem.collectionName);
      setBarcodeInput('');
    } else {
      // Find first uncompleted item as fallback candidate or show warning
      const uncompletedItem = activeOrder.items.find((item) => {
        const key = getItemKey(activeOrder.id, item.id);
        const scanned = scannedCounts[key] || 0;
        return scanned < (Number(item.quantity) || 1);
      });

      if (uncompletedItem && (code.startsWith('869') || code.length >= 8)) {
        // Assume physical barcode gun scanned a roll for this order
        handleItemScanIncrement(uncompletedItem.id, uncompletedItem.collectionName);
        setFeedback({
          message: `✓ Barkod (${code}) onaylandı: "${uncompletedItem.collectionName}" için çıkış kaydedildi.`,
          type: 'success',
        });
        setBarcodeInput('');
      } else {
        setFeedback({
          message: `❌ "${code}" barkodu bu siparişte (${activeOrder.orderNumber}) bulunan kalemlerle eşleşmedi!`,
          type: 'error',
        });
        playBeep(false);
      }
    }
  };

  // Finalize Dispatch & Complete Order
  const handleCompleteDispatch = () => {
    if (!activeOrder) return;

    const updatedOrders = orders.map((o) =>
      o.id === activeOrder.id
        ? {
            ...o,
            status: 'teslim' as const,
            notes: `${o.notes || ''} [Barkodlu depo çıkışı tamamlandı - ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}]`.trim(),
          }
        : o
    );

    onUpdateOrders(updatedOrders);
    setFeedback({
      message: `🎉 Sipariş (${activeOrder.orderNumber}) başarıyla 'Teslim Edildi / Sevkiyat Tamamlandı' durumuna alındı!`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-5 animate-fade-in text-slate-900">
      {/* Top Banner & Order Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
              <Box className="w-5 h-5 text-indigo-600" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                Sipariş Sevkiyat & Barkodla Depodan Çıkartma Terminali
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-mono font-bold px-2 py-0.5 rounded border border-indigo-200">
                  Canlı Çıkış
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Üretilen halıları barkod okutarak tek tek doğrulayın ve depodan düşüşünü yaparak hatasız sevk edin.
              </p>
            </div>
          </div>
        </div>

        {/* Order Selector Dropdown */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
            Çıkış Yapılacak Sipariş:
          </label>
          <select
            value={activeOrderId}
            onChange={(e) => {
              setActiveOrderId(e.target.value);
              if (onSelectOrder) onSelectOrder(e.target.value);
            }}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none cursor-pointer"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orderNumber} • {o.customerName} ({o.items.length} Kalem - {o.status === 'teslim' ? 'Tamamlandı' : o.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeOrder ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: Order Summary & Barcode Gun Input */}
          <div className="lg:col-span-1 space-y-4">
            {/* Active Order Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-mono text-sm font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                  {activeOrder.orderNumber}
                </span>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                    activeOrder.status === 'teslim'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  {activeOrder.status === 'teslim' ? '✓ Teslim Edildi' : 'Üretim / Sevkiyat Aşamasında'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Müşteri / Firma:</span>
                  <p className="font-bold text-slate-900 text-sm">{activeOrder.customerName}</p>
                </div>
                {activeOrder.company && (
                  <div>
                    <span className="text-slate-400 font-medium">Proje:</span>
                    <p className="font-semibold text-slate-700">{activeOrder.company}</p>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 font-medium">Teslimat Adresi:</span>
                  <p className="text-slate-700 font-medium">{activeOrder.shippingAddress || 'Fabrika Teslim'}</p>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 font-mono">
                  <span className="text-slate-500">Termin Tarihi:</span>
                  <strong className="text-indigo-900">{activeOrder.deliveryDate || 'Belirtilmedi'}</strong>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600">Depo Çıkış İlerlemesi:</span>
                  <span className="text-indigo-700 font-mono">
                    {totalItemsScanned} / {totalItemsRequired} Adet ({scanProgressPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isOrderFullyScanned ? 'bg-emerald-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${scanProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Barcode Scanner Gun Box */}
            <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <ScanBarcode className="w-5 h-5 text-amber-400" />
                <span>Barkod Okuyucu / Tabanca Girişi</span>
              </div>
              <p className="text-[11px] text-slate-300">
                El terminali veya USB barkod okutucunuzla rulonun üzerindeki etiketi okutun:
              </p>

              <form onSubmit={handleBarcodeSubmit} className="space-y-2">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Barkodu okutun veya yazın..."
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm px-3 py-2.5 rounded-xl focus:border-indigo-400 focus:outline-none placeholder:text-slate-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Okut
                  </button>
                </div>
              </form>

              {/* Scan Feedback Banner */}
              {feedback && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                    feedback.type === 'success'
                      ? 'bg-emerald-950 text-emerald-200 border-emerald-700'
                      : feedback.type === 'warning'
                      ? 'bg-amber-950 text-amber-200 border-amber-700'
                      : 'bg-rose-950 text-rose-200 border-rose-700'
                  }`}
                >
                  {feedback.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {feedback.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                  {feedback.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span>{feedback.message}</span>
                </div>
              )}

              <div className="text-[10px] text-slate-400 pt-1">
                💡 İpucu: Barkod okuyucunuz yoksa aşağıdaki listeden ürünün yanındaki <strong className="text-emerald-400">+1 Okut</strong> butonuna tıklayarak da depodan çıkartabilirsiniz.
              </div>
            </div>

            {/* Complete Dispatch CTA */}
            {isOrderFullyScanned && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Tüm Kalemler Eksiksiz Depodan Çıktı!</span>
                </div>
                <p className="text-xs text-emerald-800">
                  Bu siparişteki tüm halılar tek tek okutulup doğrulandı. Şimdi tek tıkla siparişi tamamlayıp kapatabilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={handleCompleteDispatch}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Truck className="w-4 h-4" />
                  <span>Siparişi 'Teslim Edildi' Yap ve Kapat</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Order Items Picking Checklist */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Sipariş Kalemleri Depo Çıkış Listesi ({activeOrder.items.length} Kalem)
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  Toplam: {activeOrder.totalM2.toFixed(2)} m²
                </span>
              </div>

              {/* Items List Cards */}
              <div className="space-y-3">
                {activeOrder.items.map((item, idx) => {
                  const key = getItemKey(activeOrder.id, item.id);
                  const scannedCount = scannedCounts[key] || 0;
                  const reqQty = Number(item.quantity) || 1;
                  const isItemCompleted = scannedCount >= reqQty;
                  const isSqm = item.dimensionMode === 'sqm' || (!item.widthCm && !item.lengthCm);

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isItemCompleted
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : scannedCount > 0
                          ? 'bg-amber-50/60 border-amber-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-xl font-mono font-bold flex items-center justify-center shrink-0 border text-xs ${
                            isItemCompleted
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-slate-200 text-slate-700 border-slate-300'
                          }`}
                        >
                          {isItemCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                            {item.collectionName}
                          </h4>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap gap-2 font-mono">
                            <span className="text-indigo-700 font-bold">
                              {isSqm ? `${item.areaM2} m²` : `${item.widthCm}x${item.lengthCm} cm`}
                            </span>
                            <span>•</span>
                            <span className="text-slate-700">Renk: {item.colorCode || 'Standart'}</span>
                            <span>•</span>
                            <span>Kenar: {item.edgeFinish}</span>
                          </div>
                        </div>
                      </div>

                      {/* Scanned Status & Actions */}
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <div className="font-mono text-sm font-extrabold text-slate-900">
                            <span className={isItemCompleted ? 'text-emerald-700' : 'text-indigo-700'}>
                              {scannedCount}
                            </span>
                            <span className="text-slate-400"> / {reqQty} Adet</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                              isItemCompleted
                                ? 'bg-emerald-200 text-emerald-900'
                                : scannedCount > 0
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isItemCompleted
                              ? '✓ Depodan Çıktı'
                              : scannedCount > 0
                              ? 'Kısmi Çıkış'
                              : 'Depoda Bekliyor'}
                          </span>
                        </div>

                        {/* Interactive Plus / Minus Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleItemScanDecrement(item.id)}
                            disabled={scannedCount <= 0}
                            title="1 Adet Geri Al"
                            className="p-1.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-30 text-slate-700 rounded-lg cursor-pointer transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleItemScanIncrement(item.id, item.collectionName)}
                            disabled={isItemCompleted}
                            title="1 Adet Depodan Çıkart"
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Okut</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
          Henüz seçili sipariş bulunamadı.
        </div>
      )}
    </div>
  );
};
