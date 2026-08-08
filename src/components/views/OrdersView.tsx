import React, { useState } from 'react';
import { Order, ProductionStatus, OrderCostBreakdown, CarpetOrderItem } from '../../types';
import { 
  Package, 
  Plus, 
  Scissors, 
  CheckCircle, 
  Truck, 
  Printer, 
  Ruler, 
  Layers, 
  Sparkles, 
  Clock, 
  X,
  FileSpreadsheet,
  Trash2,
  FileText,
  Calculator,
  Coins,
  Calendar,
  Hourglass,
  AlertTriangle
} from 'lucide-react';
import { ProformaInvoiceModal, ProformaInvoiceData } from '../ProformaInvoiceModal';
import { OrderCostModal } from '../OrderCostModal';

interface OrdersViewProps {
  orders: Order[];
  onAddOrder: (order: Order) => void;
  onUpdateOrderStatus: (orderId: string, status: ProductionStatus) => void;
  onDeleteOrder?: (orderId: string) => void;
  onSaveOrderCost?: (orderId: string, breakdown: OrderCostBreakdown) => void;
  searchTerm: string;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onAddOrder,
  onUpdateOrderStatus,
  onDeleteOrder,
  onSaveOrderCost,
  searchTerm,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activePrintOrder, setActivePrintOrder] = useState<Order | null>(null);
  const [activeProformaData, setActiveProformaData] = useState<Partial<ProformaInvoiceData> | null>(null);
  const [activeCostOrder, setActiveCostOrder] = useState<Order | null>(null);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultDeliveryStr = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // New Custom Order Modal State
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    company: '',
    phone: '',
    shippingAddress: 'İstanbul',
    createdAt: todayStr,
    deliveryDate: defaultDeliveryStr,
    items: [
      {
        id: `ITEM-1`,
        collectionName: '',
        colorCode: '',
        widthCm: 200,
        lengthCm: 300,
        quantity: 1,
        fiberType: 'bambu_ipek' as const,
        edgeFinish: 'overlok' as const,
        unitPricePerM2: 1250,
      }
    ],
  });

  const handleAddItem = () => {
    setNewOrderForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `ITEM-${Date.now()}-${prev.items.length + 1}`,
          collectionName: '',
          colorCode: '',
          widthCm: 200,
          lengthCm: 300,
          quantity: 1,
          fiberType: 'bambu_ipek' as const,
          edgeFinish: 'overlok' as const,
          unitPricePerM2: 1250,
        },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (newOrderForm.items.length <= 1) return;
    setNewOrderForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setNewOrderForm((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const totalOrderM2 = newOrderForm.items.reduce((acc, item) => {
    const area = (Number(item.widthCm || 0) * Number(item.lengthCm || 0)) / 10000;
    return acc + area * Number(item.quantity || 1);
  }, 0);

  const totalOrderAmount = newOrderForm.items.reduce((acc, item) => {
    const area = (Number(item.widthCm || 0) * Number(item.lengthCm || 0)) / 10000;
    return acc + area * Number(item.unitPricePerM2 || 0) * Number(item.quantity || 1);
  }, 0);

  const getDaysInProduction = (createdAt: string) => {
    if (!createdAt) return 0;
    const created = new Date(createdAt);
    const now = new Date();
    created.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getTerminStatus = (deliveryDate: string, isDelivered: boolean) => {
    if (isDelivered) {
      return { text: 'Teslim Edildi', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' };
    }
    if (!deliveryDate) return null;
    const target = new Date(deliveryDate);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `⚠️ Termin ${Math.abs(diffDays)} gün aşıldı!`, bg: 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold animate-pulse' };
    } else if (diffDays === 0) {
      return { text: '🔔 Bugün Teslim Günü!', bg: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold' };
    } else if (diffDays <= 3) {
      return { text: `⏳ Termine son ${diffDays} gün!`, bg: 'bg-amber-50 text-amber-800 border-amber-300 font-bold' };
    } else {
      return { text: `📅 Termine ${diffDays} gün var`, bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-medium' };
    }
  };

  const productionStages: { key: ProductionStatus; label: string; icon: any; color: string }[] = [
    { key: 'musteri_onayi', label: 'Müşteri Onayı Bekliyor', icon: Clock, color: 'text-amber-800 border-amber-300 bg-amber-50' },
    { key: 'musteri_onayladi', label: 'Müşteri Onayladı', icon: CheckCircle, color: 'text-emerald-800 border-emerald-300 bg-emerald-50' },
    { key: 'iplik_boya', label: 'İplik & Boyama', icon: Layers, color: 'text-blue-800 border-blue-300 bg-blue-50' },
    { key: 'dokuma', label: 'Dokuma / Üretimde', icon: Clock, color: 'text-indigo-800 border-indigo-300 bg-indigo-50' },
    { key: 'kesim', label: 'Kesim & Overlok', icon: Scissors, color: 'text-purple-800 border-purple-300 bg-purple-50' },
    { key: 'kalite_kontrol', label: 'Kalite Kontrol', icon: Sparkles, color: 'text-teal-800 border-teal-300 bg-teal-50' },
    { key: 'paketleme', label: 'Paketleme', icon: Package, color: 'text-cyan-800 border-cyan-300 bg-cyan-50' },
    { key: 'kargo', label: 'Kargoda', icon: Truck, color: 'text-sky-800 border-sky-300 bg-sky-50' },
    { key: 'teslim', label: 'Teslim Edildi', icon: CheckCircle, color: 'text-slate-800 border-slate-300 bg-slate-100' },
  ];

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = 
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || o.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let totalM2Combined = 0;
    let totalAmountCombined = 0;

    const formattedItems: CarpetOrderItem[] = newOrderForm.items.map((item, index) => {
      const areaM2 = (Number(item.widthCm) * Number(item.lengthCm)) / 10000;
      const totalItemPrice = areaM2 * Number(item.unitPricePerM2) * Number(item.quantity);

      totalM2Combined += areaM2 * Number(item.quantity);
      totalAmountCombined += totalItemPrice;

      return {
        id: item.id || `ITEM-${Date.now()}-${index}`,
        collectionName: item.collectionName || `Kalem #${index + 1}`,
        colorCode: item.colorCode || '',
        widthCm: Number(item.widthCm),
        lengthCm: Number(item.lengthCm),
        quantity: Number(item.quantity),
        areaM2,
        fiberType: item.fiberType,
        pileHeightMm: 10,
        edgeFinish: item.edgeFinish,
        unitPricePerM2: Number(item.unitPricePerM2),
        totalPrice: totalItemPrice,
      };
    });

    const created: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      orderNumber: `PUL-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerName: newOrderForm.customerName || 'İç Mimar Siparişi',
      company: newOrderForm.company || 'Müşteri Projesi',
      phone: newOrderForm.phone || '+90 532 000 00 00',
      items: formattedItems,
      totalM2: totalM2Combined,
      totalAmount: totalAmountCombined,
      status: 'musteri_onayi',
      customerApproved: false,
      createdAt: newOrderForm.createdAt || todayStr,
      deliveryDate: newOrderForm.deliveryDate || defaultDeliveryStr,
      shippingAddress: newOrderForm.shippingAddress,
      isCustomProduction: true,
    };

    onAddOrder(created);
    setNewOrderForm({
      customerName: '',
      company: '',
      phone: '',
      shippingAddress: 'İstanbul',
      createdAt: todayStr,
      deliveryDate: defaultDeliveryStr,
      items: [
        {
          id: `ITEM-${Date.now()}-1`,
          collectionName: '',
          colorCode: '',
          widthCm: 200,
          lengthCm: 300,
          quantity: 1,
          fiberType: 'bambu_ipek' as const,
          edgeFinish: 'overlok' as const,
          unitPricePerM2: 1250,
        },
      ],
    });
    setIsNewOrderModalOpen(false);
  };

  return (
    <div id="orders-view" className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" /> Siparişler & Atölye Üretim Takibi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Dokuma, kesim, overlok ve kargo aşamalarındaki özel halı siparişleri</p>
        </div>

        <button
          onClick={() => setIsNewOrderModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Yeni Sipariş Gir
        </button>
      </div>

      {/* Production Pipeline Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`px-3.5 py-1.5 rounded-lg border font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedStatus === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Tüm Aşamalar ({orders.length})
        </button>

        {productionStages.map((st) => {
          const count = orders.filter((o) => o.status === st.key).length;
          return (
            <button
              key={st.key}
              onClick={() => setSelectedStatus(st.key)}
              className={`px-3.5 py-1.5 rounded-lg border font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedStatus === st.key
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{st.label}</span>
              <span className="text-[10px] bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded font-mono font-bold">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Orders List / Cards */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const currentStageObj = productionStages.find((s) => s.key === order.status) || productionStages[0];
          return (
            <div
              key={order.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all space-y-4"
            >
              {/* Order Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-indigo-600 font-mono">{order.orderNumber}</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{order.customerName}</h3>
                    <p className="text-[11px] text-slate-500">{order.company} • {order.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base font-extrabold text-slate-900 font-mono">
                    {order.totalAmount.toLocaleString('tr-TR')} ₺
                  </span>
                  <button
                    onClick={() => setActiveCostOrder(order)}
                    title="Satış Bazlı Maliyet ve Görünmez Gider Analizi"
                    className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 cursor-pointer transition-colors flex items-center gap-1 text-xs font-bold"
                  >
                    <Calculator className="w-4 h-4 text-indigo-600" />
                    <span className="hidden sm:inline">Maliyet & Kâr</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveProformaData({
                        customerName: order.company || order.customerName,
                        addressLine1: order.shippingAddress || 'Atatürk Mah. Sanayi Cad.',
                        addressLine2: '34300 İstanbul',
                        country: 'TURKEY',
                        currency: 'USD',
                        items: order.items.map((item) => ({
                          id: item.id,
                          description: `${item.collectionName} (${item.colorCode})`,
                          subSpec: `${item.widthCm}x${item.lengthCm} cm - ${item.edgeFinish.toUpperCase()}`,
                          rolls: item.quantity,
                          sqm: Number(item.areaM2.toFixed(2)),
                          unitPrice: Number((item.unitPricePerM2 / 33).toFixed(2)),
                          amount: Number(((item.areaM2 * item.unitPricePerM2) / 33).toFixed(2)),
                        })),
                        grossWeightKg: Math.round(order.totalM2 * 2.8),
                        netWeightKg: Math.round(order.totalM2 * 2.5),
                      });
                    }}
                    title="Proforma Commercial Invoice Oluştur"
                    className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 cursor-pointer transition-colors flex items-center gap-1 text-xs font-bold"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Proforma</span>
                  </button>
                  <button
                    onClick={() => setActivePrintOrder(order)}
                    title="Atölye Fişi Yazdır"
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  {onDeleteOrder && (
                    <button
                      onClick={() => {
                        if (window.confirm(`${order.orderNumber} nolu siparişi silmek istediğinizden emin misiniz?`)) {
                          onDeleteOrder(order.id);
                        }
                      }}
                      title="Siparişi Sil"
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sipariş Giriş, Söz Verilen Termin & Atölye Süre Çubuğu */}
              {(() => {
                const daysInProd = getDaysInProduction(order.createdAt);
                const terminStatus = getTerminStatus(order.deliveryDate, order.status === 'teslim');
                return (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="flex items-center gap-2.5 text-slate-700">
                      <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block">Sipariş Giriş Tarihi</span>
                        <strong className="text-slate-900 font-mono text-xs">{order.createdAt || 'Belirtilmedi'}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-slate-700">
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium block">Söz Verilen Termin Tarihi</span>
                        <strong className="text-slate-900 font-mono text-xs">{order.deliveryDate || 'Belirtilmedi'}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-purple-100 text-purple-700 rounded-lg shrink-0">
                          <Hourglass className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-medium block">Atölye Süresi</span>
                          <strong className="text-indigo-950 font-bold text-xs">
                            {order.status === 'teslim'
                              ? `${daysInProd} günde tamamlandı`
                              : daysInProd === 0
                              ? 'Bugün girildi (1. gün)'
                              : `${daysInProd} gündür üretimde`}
                          </strong>
                        </div>
                      </div>

                      {terminStatus && (
                        <span className={`px-2.5 py-1 text-[10px] rounded-lg border shadow-2xs whitespace-nowrap ml-auto ${terminStatus.bg}`}>
                          {terminStatus.text}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Items & Carpet Specification Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {order.items.map((item) => (
                  <div key={item.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="font-bold text-slate-900">{item.collectionName}</div>
                    <div className="text-slate-500 flex items-center justify-between">
                      <span>Renk Kodu:</span>
                      <span className="text-slate-800 font-medium">{item.colorCode}</span>
                    </div>
                    <div className="text-slate-500 flex items-center justify-between">
                      <span>Ölçü (En x Boy):</span>
                      <span className="text-indigo-600 font-mono font-bold">{item.widthCm} x {item.lengthCm} cm</span>
                    </div>
                    <div className="text-slate-500 flex items-center justify-between">
                      <span>Toplam m²:</span>
                      <span className="text-slate-900 font-bold">{item.areaM2.toFixed(2)} m² ({item.quantity} Adet)</span>
                    </div>
                    <div className="text-slate-500 flex items-center justify-between">
                      <span>Kenar Bitişi:</span>
                      <span className="text-slate-800 uppercase font-bold text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded">
                        {item.edgeFinish}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Stage Stepper */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center justify-between">
                  <span>Üretim ve Sevkiyat Aşaması Değiştir:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${currentStageObj.color}`}>
                    Mevcut: {currentStageObj.label}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {productionStages.map((st) => {
                    const isCurrent = order.status === st.key;
                    return (
                      <button
                        key={st.key}
                        onClick={() => onUpdateOrderStatus(order.id, st.key)}
                        className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-bold transition-all cursor-pointer whitespace-nowrap ${
                          isCurrent
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Custom Order Modal */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl p-6 space-y-5 shadow-2xl relative text-xs">
            <button
              onClick={() => setIsNewOrderModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" /> Yeni Özel Halı Siparişi Gir
            </h3>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-4">
              {/* Customer & Order Metadata */}
              <div className="bg-slate-950/50 p-3.5 border border-slate-800/80 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Müşteri & Termin Bilgileri</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Müşteri Adı *</label>
                    <input
                      type="text"
                      required
                      placeholder="Selin Karaca"
                      value={newOrderForm.customerName}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Firma / Tel</label>
                    <input
                      type="text"
                      placeholder="Karaca Otel A.Ş."
                      value={newOrderForm.company}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, company: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Teslimat Adresi / Şehir</label>
                    <input
                      type="text"
                      placeholder="İstanbul / Etiler"
                      value={newOrderForm.shippingAddress}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, shippingAddress: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Sipariş Giriş Tarihi *</label>
                    <input
                      type="date"
                      required
                      value={newOrderForm.createdAt}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, createdAt: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Söz Verilen Termin Tarihi *</label>
                    <input
                      type="date"
                      required
                      value={newOrderForm.deliveryDate}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, deliveryDate: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Multiple Product Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-4 h-4" /> Sipariş Kalemleri ({newOrderForm.items.length} Kalem)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Kalem Ekle
                  </button>
                </div>

                {newOrderForm.items.map((item, idx) => {
                  const itemM2 = ((Number(item.widthCm || 0) * Number(item.lengthCm || 0)) / 10000) * Number(item.quantity || 1);
                  const itemPrice = itemM2 * Number(item.unitPricePerM2 || 0);

                  return (
                    <div
                      key={item.id || idx}
                      className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="bg-slate-800 text-amber-400 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                          Kalem #{idx + 1}
                        </span>
                        {newOrderForm.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded-md hover:bg-rose-950/50 transition-colors flex items-center gap-1 text-[11px]"
                            title="Kalemi Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Sil
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-medium mb-1">Ürün / Koleksiyon Adı *</label>
                          <input
                            type="text"
                            required
                            placeholder="Örn: SilkTouch Bambu İpek"
                            value={item.collectionName}
                            onChange={(e) => handleItemChange(idx, 'collectionName', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-medium mb-1">Renk / Kod</label>
                          <input
                            type="text"
                            placeholder="Örn: PC-B-104 Vizon"
                            value={item.colorCode}
                            onChange={(e) => handleItemChange(idx, 'colorCode', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-300 font-medium mb-1">En (cm)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.widthCm}
                            onChange={(e) => handleItemChange(idx, 'widthCm', Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-medium mb-1">Boy (cm)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.lengthCm}
                            onChange={(e) => handleItemChange(idx, 'lengthCm', Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-medium mb-1">Adet</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-medium mb-1">m² Birim Fiyat (TL)</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={item.unitPricePerM2}
                            onChange={(e) => handleItemChange(idx, 'unitPricePerM2', Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-medium mb-1">Kenar Bitişi</label>
                          <select
                            value={item.edgeFinish}
                            onChange={(e) => handleItemChange(idx, 'edgeFinish', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white p-2.5 rounded-lg focus:outline-none focus:border-amber-500"
                          >
                            <option value="overlok">Overlok</option>
                            <option value="sacagli">Pamuk Saçaklı</option>
                            <option value="deri_biye">Deri Biyeli</option>
                            <option value="katlama">Katlama</option>
                          </select>
                        </div>
                      </div>

                      {/* Item subtotal indicator */}
                      <div className="p-2 bg-slate-900/90 border border-slate-800/80 rounded-lg flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Kalem Hesaplaması: <strong className="text-slate-200">{itemM2.toFixed(2)} m²</strong></span>
                        <span className="text-emerald-400 font-bold">{itemPrice.toLocaleString('tr-TR')} ₺</span>
                      </div>
                    </div>
                  );
                })}

                {/* Add Item Action Button */}
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-2.5 border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-950/40 hover:bg-amber-500/5 text-amber-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Yeni Ürün Kalemi Ekle
                </button>
              </div>

              {/* Total Summary Footer */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Genel Sipariş m² Toplamı</span>
                  <span className="text-amber-400 font-bold text-base">{totalOrderM2.toFixed(2)} m²</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Genel Sipariş Tutarı</span>
                  <span className="text-emerald-400 font-extrabold text-base">{totalOrderAmount.toLocaleString('tr-TR')} ₺</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold hover:bg-slate-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-slate-950 rounded-lg font-bold hover:bg-amber-400 cursor-pointer shadow-md"
                >
                  Siparişi Kaydet ({newOrderForm.items.length} Kalem)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Production Sheet Print Modal */}
      {activePrintOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl relative font-sans">
            <button
              onClick={() => setActivePrintOrder(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-extrabold tracking-wider font-mono text-slate-900">PULCARPET</h3>
                <p className="text-xs text-slate-500 font-bold uppercase">Atölye Özel Kesim & Dokuma Fişi</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold font-mono text-amber-600">{activePrintOrder.orderNumber}</div>
                <div className="text-[11px] text-slate-500">{activePrintOrder.createdAt}</div>
              </div>
            </div>

            <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div><strong>Müşteri:</strong> {activePrintOrder.customerName} ({activePrintOrder.company})</div>
              <div><strong>Teslim Adresi:</strong> {activePrintOrder.shippingAddress}</div>
              <div><strong>Telefon:</strong> {activePrintOrder.phone}</div>
            </div>

            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 font-bold text-slate-700">
                <tr>
                  <th className="p-2 border">Koleksiyon</th>
                  <th className="p-2 border">En x Boy</th>
                  <th className="p-2 border">m²</th>
                  <th className="p-2 border">Kenar</th>
                </tr>
              </thead>
              <tbody>
                {activePrintOrder.items.map((it) => (
                  <tr key={it.id} className="border-b">
                    <td className="p-2 border font-semibold">{it.collectionName}</td>
                    <td className="p-2 border font-mono font-bold">{it.widthCm} x {it.lengthCm} cm</td>
                    <td className="p-2 border font-mono">{it.areaM2.toFixed(2)} m²</td>
                    <td className="p-2 border uppercase font-bold text-[10px]">{it.edgeFinish}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-center pt-2">
              <div className="text-xs font-mono font-bold text-slate-700">
                Toplam m²: {activePrintOrder.totalM2.toFixed(2)} m²
              </div>
              <button
                onClick={() => {
                  window.print();
                }}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Fişi Yazdır
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proforma Commercial Invoice Modal */}
      {activeProformaData && (
        <ProformaInvoiceModal
          initialData={activeProformaData}
          onClose={() => setActiveProformaData(null)}
        />
      )}

      {/* Order Cost & Hidden Expenses Modal */}
      {activeCostOrder && (
        <OrderCostModal
          order={activeCostOrder}
          onClose={() => setActiveCostOrder(null)}
          onSaveCost={(orderId, breakdown) => {
            if (onSaveOrderCost) {
              onSaveOrderCost(orderId, breakdown);
            }
          }}
        />
      )}
    </div>
  );
};
