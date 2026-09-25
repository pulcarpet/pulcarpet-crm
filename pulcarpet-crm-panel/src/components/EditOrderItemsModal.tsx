import React, { useState } from 'react';
import { Order, CarpetOrderItem, FiberType, EdgeFinish } from '../types';
import { Plus, Trash2, X, CheckCircle, Layers, Ruler, Edit3, ArrowRight } from 'lucide-react';

interface EditOrderItemsModalProps {
  order: Order;
  onClose: () => void;
  onSave: (updatedOrder: Order) => void;
}

export const EditOrderItemsModal: React.FC<EditOrderItemsModalProps> = ({
  order,
  onClose,
  onSave,
}) => {
  const [items, setItems] = useState<CarpetOrderItem[]>(order.items || []);

  // New Item Input State
  const [newItemCollection, setNewItemCollection] = useState('');
  const [newItemColor, setNewItemColor] = useState('');
  const [newItemDimensionMode, setNewItemDimensionMode] = useState<'sqm' | 'dimensions'>('sqm');
  const [newItemWidth, setNewItemWidth] = useState<number>(200);
  const [newItemLength, setNewItemLength] = useState<number>(300);
  const [newItemSqm, setNewItemSqm] = useState<number>(10);
  const [newItemQuantity, setNewItemQuantity] = useState<number>(1);
  const [newItemFiber, setNewItemFiber] = useState<FiberType>('bambu_ipek');
  const [newItemEdge, setNewItemEdge] = useState<EdgeFinish>('overlok');
  const [newItemUnitPrice, setNewItemUnitPrice] = useState<number>(1250);

  const getSymbol = (c?: string) => {
    if (c === 'USD') return '$';
    if (c === 'EUR') return '€';
    if (c === 'GBP') return '£';
    return '₺';
  };

  const currencySym = getSymbol(order.currency);

  // Recalculate totals
  const totalM2 = items.reduce((sum, item) => sum + (Number(item.areaM2) || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);

  const handleUpdateItem = (id: string, field: keyof CarpetOrderItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };

        const isSqm = updated.dimensionMode === 'sqm' || (!updated.widthCm && !updated.lengthCm);
        const singleM2 = isSqm ? Number(updated.areaM2 || 0) : (Number(updated.widthCm || 0) * Number(updated.lengthCm || 0)) / 10000;
        const qty = Number(updated.quantity || 1);
        const totalArea = singleM2 * (isSqm ? 1 : qty);
        const unitRate = Number(updated.unitPricePerM2 || 0);

        if (field === 'widthCm' || field === 'lengthCm' || field === 'quantity' || field === 'unitPricePerM2' || field === 'areaM2') {
          updated.totalPrice = Number((totalArea * unitRate).toFixed(2));
          if (!isSqm) {
            updated.areaM2 = Number(totalArea.toFixed(2));
          }
        }

        return updated;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert('Siparişte en az 1 kalem ürün bulunmalıdır.');
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemCollection.trim()) {
      alert('Lütfen koleksiyon / halı adını girin.');
      return;
    }

    const isSqm = newItemDimensionMode === 'sqm';
    const singleM2 = isSqm ? Number(newItemSqm || 1) : (Number(newItemWidth || 0) * Number(newItemLength || 0)) / 10000;
    const itemAreaTotal = isSqm ? Number(newItemSqm || 1) : singleM2 * Number(newItemQuantity || 1);
    const itemTotalPrice = itemAreaTotal * Number(newItemUnitPrice || 0);

    const createdItem: CarpetOrderItem = {
      id: `ITEM-ADD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      collectionName: newItemCollection.trim(),
      colorCode: newItemColor.trim() || 'Özel Renk',
      dimensionMode: newItemDimensionMode,
      widthCm: isSqm ? 0 : Number(newItemWidth),
      lengthCm: isSqm ? 0 : Number(newItemLength),
      quantity: Number(newItemQuantity || 1),
      areaM2: Number(itemAreaTotal.toFixed(2)),
      fiberType: newItemFiber,
      pileHeightMm: 10,
      edgeFinish: newItemEdge,
      unitPricePerM2: Number(newItemUnitPrice || 0),
      totalPrice: Number(itemTotalPrice.toFixed(2)),
    };

    setItems([...items, createdItem]);

    // Reset inputs for next addition
    setNewItemCollection('');
    setNewItemColor('');
    setNewItemSqm(10);
    setNewItemQuantity(1);
  };

  const handleSaveAll = () => {
    const updatedOrder: Order = {
      ...order,
      items,
      totalM2: Number(totalM2.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
    };
    onSave(updatedOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Siparişe İlave Kalem Ekle & Düzenle
                <span className="font-mono text-xs text-indigo-400 font-bold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                  {order.orderNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Müşteri: <strong className="text-slate-200">{order.customerName}</strong> {order.company && `(${order.company})`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Current Items List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Mevcut Sipariş Kalemleri ({items.length} Kalem)</span>
              <span className="text-indigo-400 font-mono">Toplam: {totalM2.toFixed(2)} m² • {totalAmount.toLocaleString('tr-TR')} {currencySym}</span>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800 bg-slate-950/60">
              {items.map((item, idx) => {
                const isSqm = item.dimensionMode === 'sqm' || (!item.widthCm && !item.lengthCm);
                return (
                  <div
                    key={item.id}
                    className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-indigo-950 text-indigo-400 font-mono font-bold flex items-center justify-center shrink-0 border border-indigo-800 text-[11px]">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white text-xs truncate">
                          {item.collectionName}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap gap-2">
                          <span className="font-mono text-amber-300">Renk: {item.colorCode}</span>
                          <span>•</span>
                          <span>İplik: {item.fiberType}</span>
                          <span>•</span>
                          <span>Kenar: {item.edgeFinish}</span>
                        </div>
                      </div>
                    </div>

                    {/* Inline Quick Modifiers */}
                    <div className="flex items-center gap-3 flex-wrap justify-end">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400">Ölçü/m²:</span>
                        {isSqm ? (
                          <input
                            type="number"
                            step="any"
                            value={item.areaM2 || ''}
                            onChange={(e) => handleUpdateItem(item.id, 'areaM2', Number(e.target.value))}
                            className="w-16 bg-slate-900 border border-slate-700 text-white font-mono px-2 py-1 rounded text-xs text-right"
                          />
                        ) : (
                          <span className="font-mono font-bold text-indigo-300 bg-indigo-950/80 px-2 py-1 rounded border border-indigo-900">
                            {item.widthCm}x{item.lengthCm} cm
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">m²</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400">Adet:</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity || 1}
                          onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                          className="w-14 bg-slate-900 border border-slate-700 text-white font-mono px-2 py-1 rounded text-xs text-center font-bold"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400">Birim Fiyat:</span>
                        <input
                          type="number"
                          value={item.unitPricePerM2 || ''}
                          onChange={(e) => handleUpdateItem(item.id, 'unitPricePerM2', Number(e.target.value))}
                          className="w-20 bg-slate-900 border border-slate-700 text-white font-mono px-2 py-1 rounded text-xs text-right font-bold"
                        />
                        <span className="text-[11px] text-slate-400">{currencySym}</span>
                      </div>

                      <div className="font-mono font-extrabold text-emerald-400 text-right w-24">
                        {item.totalPrice.toLocaleString('tr-TR')} {currencySym}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        title="Kalemi Çıkart"
                        className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/50 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add New Item Section */}
          <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs">
              <Plus className="w-4 h-4" />
              <span>Siparişe Yeni İlave Halı / Kalem Ekle</span>
            </div>

            <form onSubmit={handleAddNewItem} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-slate-300 font-semibold block mb-1">
                  Koleksiyon / Halı Adı *
                </label>
                <input
                  type="text"
                  required
                  value={newItemCollection}
                  onChange={(e) => setNewItemCollection(e.target.value)}
                  placeholder="Örn: Bambu İpek El Dokuma / Asukka Modern"
                  className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Renk / Desen Kodu
                </label>
                <input
                  type="text"
                  value={newItemColor}
                  onChange={(e) => setNewItemColor(e.target.value)}
                  placeholder="Örn: PC-BAMBOO-04 Vizon"
                  className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Ölçü Giriş Şekli
                </label>
                <select
                  value={newItemDimensionMode}
                  onChange={(e) => setNewItemDimensionMode(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none cursor-pointer font-bold"
                >
                  <option value="sqm">Doğrudan m² (Metrekare)</option>
                  <option value="dimensions">En x Boy (cm)</option>
                </select>
              </div>

              {newItemDimensionMode === 'dimensions' ? (
                <>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">En (cm)</label>
                    <input
                      type="number"
                      value={newItemWidth}
                      onChange={(e) => setNewItemWidth(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 text-white font-mono px-3 py-2 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Boy (cm)</label>
                    <input
                      type="number"
                      value={newItemLength}
                      onChange={(e) => setNewItemLength(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 text-white font-mono px-3 py-2 rounded-xl"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Toplam m²</label>
                  <input
                    type="number"
                    step="any"
                    value={newItemSqm}
                    onChange={(e) => setNewItemSqm(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 text-white font-mono px-3 py-2 rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Adet (Parça)</label>
                <input
                  type="number"
                  min="1"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-mono px-3 py-2 rounded-xl text-center font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Birim Fiyat ({currencySym}/m²)
                </label>
                <input
                  type="number"
                  step="any"
                  value={newItemUnitPrice}
                  onChange={(e) => setNewItemUnitPrice(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-mono px-3 py-2 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">İplik Tipi</label>
                <select
                  value={newItemFiber}
                  onChange={(e) => setNewItemFiber(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl cursor-pointer"
                >
                  <option value="bambu_ipek">Bambu İpek</option>
                  <option value="yun">Yün</option>
                  <option value="akrilik">Akrilik</option>
                  <option value="viskoz">Viskoz</option>
                  <option value="polyester">Polyester</option>
                  <option value="pamuk">Pamuk</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Kenar Biye</label>
                <select
                  value={newItemEdge}
                  onChange={(e) => setNewItemEdge(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl cursor-pointer"
                >
                  <option value="overlok">Overlok</option>
                  <option value="sacagli">Saçaklı</option>
                  <option value="deri_biye">Deri Biye</option>
                  <option value="katlama">Katlama</option>
                </select>
              </div>

              <div className="sm:col-span-2 md:col-span-2 flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Kalemi Bu Siparişe Ekle</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer Summary & Action */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400">Güncel Toplam m²: </span>
              <strong className="text-white font-bold">{totalM2.toFixed(2)} m²</strong>
            </div>
            <div>
              <span className="text-slate-400">Yeni Sipariş Tutarı: </span>
              <strong className="text-emerald-400 font-extrabold text-sm">
                {totalAmount.toLocaleString('tr-TR')} {currencySym}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <CheckCircle className="w-4 h-4 text-emerald-200" />
              <span>Değişiklikleri Kaydet & Siparişi Güncelle</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
