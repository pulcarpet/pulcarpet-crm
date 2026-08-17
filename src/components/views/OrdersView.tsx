import React, { useState, useEffect } from 'react';
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
  proformas?: ProformaInvoiceData[];
  initialSelectedProforma?: ProformaInvoiceData | null;
  onAddOrder: (order: Order) => void;
  onUpdateOrder?: (order: Order) => void;
  onUpdateOrderStatus: (orderId: string, status: ProductionStatus) => void;
  onDeleteOrder?: (orderId: string) => void;
  onSaveOrderCost?: (orderId: string, breakdown: OrderCostBreakdown) => void;
  searchTerm: string;
}

const getSymbol = (curr?: string) => {
  if (curr === 'USD') return '$';
  if (curr === 'EUR') return '€';
  if (curr === 'GBP') return '£';
  return '₺';
};

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  proformas = [],
  initialSelectedProforma = null,
  onAddOrder,
  onUpdateOrder,
  onUpdateOrderStatus,
  onDeleteOrder,
  onSaveOrderCost,
  searchTerm,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activePrintOrder, setActivePrintOrder] = useState<Order | null>(null);
  const [activeProformaData, setActiveProformaData] = useState<Partial<ProformaInvoiceData> | null>(null);
  const [activeCostOrder, setActiveCostOrder] = useState<Order | null>(null);
  const [activeDetailOrder, setActiveDetailOrder] = useState<Order | null>(null);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultDeliveryStr = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Proforma Import & Conversion State
  const [selectedProformaId, setSelectedProformaId] = useState<string>('');
  const [proformaBanner, setProformaBanner] = useState<string>('');

  // New Custom Order Modal State
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    company: '',
    phone: '',
    shippingAddress: 'İstanbul',
    createdAt: todayStr,
    deliveryDate: defaultDeliveryStr,
    currency: 'TL' as 'TL' | 'USD' | 'EUR' | 'GBP',
    hasAdvancePayment: false,
    advancePaymentAmount: 0,
    advancePaymentCurrency: 'TL' as 'TL' | 'USD' | 'EUR' | 'GBP',
    advancePaymentNotes: '',
    items: [
      {
        id: `ITEM-1`,
        collectionName: '',
        colorCode: '',
        dimensionMode: 'sqm' as 'sqm' | 'dimensions',
        widthCm: 0,
        lengthCm: 0,
        quantity: 1,
        areaM2: 50,
        fiberType: 'bambu_ipek' as const,
        edgeFinish: 'overlok' as const,
        unitPricePerM2: 1250,
      }
    ],
  });

  const applyProformaToForm = (pf: ProformaInvoiceData) => {
    let orderCurr: 'TL' | 'USD' | 'EUR' | 'GBP' = 'USD';
    if (pf.currency === 'TRY') orderCurr = 'TL';
    else if (pf.currency === 'EUR') orderCurr = 'EUR';
    else if (pf.currency === 'GBP') orderCurr = 'GBP';

    const mappedItems = pf.items.map((pi, index) => {
      let width = 0;
      let length = 0;
      let dimensionMode: 'sqm' | 'dimensions' = 'sqm';

      const fullText = `${pi.subSpec || ''} ${pi.description || ''}`;
      const match = fullText.match(/(\d{2,4})\s*[xX*×]\s*(\d{2,4})/);
      if (match && Number(match[1]) > 0 && Number(match[2]) > 0) {
        width = Number(match[1]);
        length = Number(match[2]);
        dimensionMode = 'dimensions';
      } else {
        dimensionMode = 'sqm';
      }

      const singleM2 = dimensionMode === 'dimensions'
        ? (width * length) / 10000
        : (Number(pi.sqm) || 0);

      const totalItemM2 = singleM2 * (Number(pi.rolls) || 1);
      const totalPrice = Number(pi.amount) || (totalItemM2 * Number(pi.unitPrice || 0));

      return {
        id: `ITEM-${Date.now()}-${index}`,
        collectionName: pi.description || 'Proforma Halı',
        colorCode: pi.subSpec || 'STD',
        dimensionMode,
        widthCm: width,
        lengthCm: length,
        quantity: Number(pi.rolls) || 1,
        areaM2: Number(singleM2.toFixed(2)),
        fiberType: 'bambu_ipek' as const,
        pileHeightMm: 10,
        edgeFinish: 'overlok' as const,
        unitPricePerM2: Number(pi.unitPrice) || 0,
        totalPrice: Number(totalPrice.toFixed(2)),
      };
    });

    const pfTotal = pf.items.reduce((sum, item) => sum + (Number(item.amount) || (Number(item.sqm) * Number(item.unitPrice) * (Number(item.rolls) || 1))), 0);
    const advance30 = Number((pfTotal * 0.3).toFixed(2));

    setNewOrderForm({
      customerName: pf.customerName || 'Proforma Müşterisi',
      company: pf.customerName + (pf.country ? ` (${pf.country})` : ''),
      phone: '+90 500 000 00 00',
      shippingAddress: [pf.addressLine1, pf.addressLine2, pf.country].filter(Boolean).join(', ') || 'İstanbul',
      createdAt: todayStr,
      deliveryDate: defaultDeliveryStr,
      currency: orderCurr,
      hasAdvancePayment: true,
      advancePaymentAmount: advance30,
      advancePaymentCurrency: orderCurr,
      advancePaymentNotes: `Proforma Fatura #${pf.invoiceNumber || 'PI'} onaylandı. %30 ön ödeme alındı.`,
      items: mappedItems.length > 0 ? mappedItems : [
        {
          id: `ITEM-1`,
          collectionName: 'Özel Halı',
          colorCode: 'STD',
          dimensionMode: 'sqm',
          widthCm: 0,
          lengthCm: 0,
          quantity: 1,
          areaM2: 50,
          fiberType: 'bambu_ipek' as const,
          edgeFinish: 'overlok' as const,
          unitPricePerM2: 150,
        }
      ],
    });

    setSelectedProformaId(pf.invoiceNumber || pf.id || '');
    setProformaBanner(`✓ Proforma #${pf.invoiceNumber || 'PI'} (${pf.customerName}) verileri aktarıldı! ${mappedItems.some(i => i.dimensionMode === 'sqm') ? 'Metrekare (m²) formatı korundu, otomatik en-boy eklenmedi.' : ''}`);
  };

  useEffect(() => {
    if (initialSelectedProforma) {
      setIsNewOrderModalOpen(true);
      applyProformaToForm(initialSelectedProforma);
    }
  }, [initialSelectedProforma]);

  const handleAddItem = (defaultMode: 'sqm' | 'dimensions' = 'sqm') => {
    setNewOrderForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `ITEM-${Date.now()}-${prev.items.length + 1}`,
          collectionName: '',
          colorCode: '',
          dimensionMode: defaultMode,
          widthCm: defaultMode === 'dimensions' ? 200 : 0,
          lengthCm: defaultMode === 'dimensions' ? 300 : 0,
          quantity: 1,
          areaM2: defaultMode === 'dimensions' ? 6 : 50,
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
    const isSqm = item.dimensionMode === 'sqm' || (!item.widthCm && !item.lengthCm);
    const itemSingleM2 = isSqm
      ? Number(item.areaM2 || 0)
      : (Number(item.widthCm || 0) * Number(item.lengthCm || 0)) / 10000;
    return acc + itemSingleM2 * Number(item.quantity || 1);
  }, 0);

  const totalOrderAmount = newOrderForm.items.reduce((acc, item) => {
    const isSqm = item.dimensionMode === 'sqm' || (!item.widthCm && !item.lengthCm);
    const itemSingleM2 = isSqm
      ? Number(item.areaM2 || 0)
      : (Number(item.widthCm || 0) * Number(item.lengthCm || 0)) / 10000;
    return acc + itemSingleM2 * Number(item.unitPricePerM2 || 0) * Number(item.quantity || 1);
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
    { key: 'musteri_onayi', label: '1. Sipariş & Ön Ödeme', icon: Coins, color: 'text-amber-800 border-amber-300 bg-amber-50' },
    { key: 'dokuma', label: '2. Üretimde (Termin)', icon: Clock, color: 'text-indigo-800 border-indigo-300 bg-indigo-50' },
    { key: 'teslim', label: '3. Teslim Edildi (Bitti)', icon: CheckCircle, color: 'text-emerald-800 border-emerald-300 bg-emerald-50' },
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
      const isSqmMode = item.dimensionMode === 'sqm' || (!item.widthCm && !item.lengthCm);
      const itemSingleM2 = isSqmMode
        ? Number(item.areaM2 || 0)
        : (Number(item.widthCm || 0) * Number(item.lengthCm || 0)) / 10000;
      const itemTotalM2 = itemSingleM2 * Number(item.quantity || 1);
      const totalItemPrice = itemTotalM2 * Number(item.unitPricePerM2 || 0);

      totalM2Combined += itemTotalM2;
      totalAmountCombined += totalItemPrice;

      return {
        id: item.id || `ITEM-${Date.now()}-${index}`,
        collectionName: item.collectionName || `Kalem #${index + 1}`,
        colorCode: item.colorCode || '',
        dimensionMode: isSqmMode ? 'sqm' : 'dimensions',
        widthCm: isSqmMode ? 0 : Number(item.widthCm || 0),
        lengthCm: isSqmMode ? 0 : Number(item.lengthCm || 0),
        quantity: Number(item.quantity || 1),
        areaM2: Number(itemSingleM2.toFixed(2)),
        fiberType: item.fiberType,
        pileHeightMm: 10,
        edgeFinish: item.edgeFinish,
        unitPricePerM2: Number(item.unitPricePerM2 || 0),
        totalPrice: Number(totalItemPrice.toFixed(2)),
      };
    });

    const created: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      orderNumber: `PUL-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerName: newOrderForm.customerName || 'İç Mimar Siparişi',
      company: newOrderForm.company || 'Müşteri Projesi',
      phone: newOrderForm.phone || '+90 532 000 00 00',
      items: formattedItems,
      totalM2: Number(totalM2Combined.toFixed(2)),
      totalAmount: Number(totalAmountCombined.toFixed(2)),
      status: 'musteri_onayi',
      customerApproved: false,
      createdAt: newOrderForm.createdAt || todayStr,
      deliveryDate: newOrderForm.deliveryDate || defaultDeliveryStr,
      shippingAddress: newOrderForm.shippingAddress,
      isCustomProduction: true,
      currency: newOrderForm.currency || 'TL',
      hasAdvancePayment: newOrderForm.hasAdvancePayment,
      advancePaymentAmount: newOrderForm.hasAdvancePayment ? Number(newOrderForm.advancePaymentAmount || 0) : 0,
      advancePaymentCurrency: newOrderForm.hasAdvancePayment ? (newOrderForm.advancePaymentCurrency || newOrderForm.currency || 'TL') : undefined,
      advancePaymentNotes: newOrderForm.advancePaymentNotes || '',
    };

    onAddOrder(created);
    setNewOrderForm({
      customerName: '',
      company: '',
      phone: '',
      shippingAddress: 'İstanbul',
      createdAt: todayStr,
      deliveryDate: defaultDeliveryStr,
      currency: 'TL',
      hasAdvancePayment: false,
      advancePaymentAmount: 0,
      advancePaymentCurrency: 'TL',
      advancePaymentNotes: '',
      items: [
        {
          id: `ITEM-${Date.now()}-1`,
          collectionName: '',
          colorCode: '',
          dimensionMode: 'sqm',
          widthCm: 0,
          lengthCm: 0,
          quantity: 1,
          areaM2: 50,
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
          <p className="text-xs text-slate-500 mt-0.5">Sipariş & ön ödeme, üretimdeki siparişler ve teslim edilen halıların canlı takibi</p>
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
                  <button
                    onClick={() => setActiveDetailOrder(order)}
                    title="Sipariş detayını ve satır satır içerikleri açmak için tıklayın"
                    className="text-sm font-extrabold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors font-mono cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{order.orderNumber}</span>
                    <span className="text-[10px] font-sans font-bold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200">🔍 İçeriği Gör</span>
                  </button>
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

              {/* Ön Ödeme & Bakiye Takip Barı */}
              {(() => {
                const hasAdv = order.hasAdvancePayment ?? (order.advancePaymentAmount ? order.advancePaymentAmount > 0 : false);
                const advAmt = order.advancePaymentAmount || 0;
                const orderSym = getSymbol(order.currency);
                const advSym = getSymbol(order.advancePaymentCurrency || order.currency);
                const isSameCurrency = (order.advancePaymentCurrency || order.currency || 'TL') === (order.currency || 'TL');
                const remainingAmt = Math.max(0, order.totalAmount - advAmt);

                return (
                  <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg font-bold shrink-0 ${hasAdv ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">Ön Ödeme Durumu:</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdateOrder) {
                                const newHasAdv = !hasAdv;
                                onUpdateOrder({
                                  ...order,
                                  hasAdvancePayment: newHasAdv,
                                  advancePaymentAmount: newHasAdv ? (advAmt || Math.round(order.totalAmount * 0.3)) : 0,
                                  advancePaymentCurrency: order.advancePaymentCurrency || order.currency || 'TL',
                                });
                              }
                            }}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer border transition-all ${
                              hasAdv
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                            }`}
                          >
                            {hasAdv ? '✓ Ön Ödeme Alındı' : 'Ön Ödemesiz Üretim (Tıkla Değiştir)'}
                          </button>
                        </div>
                        
                        {hasAdv ? (
                          <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center gap-3 font-mono">
                            <span>Alınan: <strong className="text-emerald-700 font-bold">{advAmt.toLocaleString('tr-TR')} {advSym}</strong></span>
                            <span>Kalan Bakiye: <strong className="text-indigo-700 font-bold">
                              {isSameCurrency
                                ? `${remainingAmt.toLocaleString('tr-TR')} ${orderSym}`
                                : `${order.totalAmount.toLocaleString('tr-TR')} ${orderSym} - ${advAmt.toLocaleString('tr-TR')} ${advSym}`
                              }
                            </strong></span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 mt-0.5">Sipariş ön ödemesiz üretime alındı. Toplam Tutar: {order.totalAmount.toLocaleString('tr-TR')} {orderSym}</p>
                        )}
                      </div>
                    </div>

                    {/* Inline advance payment amount editor */}
                    {hasAdv && onUpdateOrder && (
                      <div className="flex items-center gap-1.5 self-end sm:self-auto bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
                        <span className="text-[10px] text-slate-500 font-medium pl-1">Alınan:</span>
                        <input
                          type="number"
                          value={advAmt || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            onUpdateOrder({
                              ...order,
                              hasAdvancePayment: true,
                              advancePaymentAmount: val,
                            });
                          }}
                          className="w-20 bg-slate-50 border border-slate-200 text-slate-900 px-2 py-1 rounded text-xs font-mono font-bold focus:outline-none focus:border-indigo-500"
                        />
                        <select
                          value={order.advancePaymentCurrency || order.currency || 'TL'}
                          onChange={(e) => {
                            onUpdateOrder({
                              ...order,
                              advancePaymentCurrency: e.target.value as any,
                            });
                          }}
                          className="bg-slate-100 border border-slate-200 text-slate-900 text-xs font-bold px-1.5 py-1 rounded cursor-pointer focus:outline-none hover:bg-slate-200"
                        >
                          <option value="TL">₺ (TL)</option>
                          <option value="USD">$ (USD)</option>
                          <option value="EUR">€ (EUR)</option>
                          <option value="GBP">£ (GBP)</option>
                        </select>
                      </div>
                    )}
                  </div>
                );
              })()}

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
                        {onUpdateOrder ? (
                          <input
                            type="date"
                            value={order.deliveryDate || ''}
                            onChange={(e) => {
                              onUpdateOrder({
                                ...order,
                                deliveryDate: e.target.value,
                              });
                            }}
                            className="bg-white border border-slate-300 text-slate-900 px-1.5 py-0.5 rounded text-xs font-mono font-bold cursor-pointer hover:border-amber-500"
                          />
                        ) : (
                          <strong className="text-slate-900 font-mono text-xs">{order.deliveryDate || 'Belirtilmedi'}</strong>
                        )}
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

              {/* Step Transition Quick Action Button */}
              {(() => {
                if (order.status === 'musteri_onayi') {
                  return (
                    <button
                      onClick={() => onUpdateOrderStatus(order.id, 'dokuma')}
                      className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
                    >
                      <Clock className="w-4 h-4 text-amber-300" />
                      <span>🚀 Bir Sonraki Aşama: Üretime Geçir (Termin Süreci Başlasın) →</span>
                    </button>
                  );
                } else if (order.status !== 'teslim') {
                  return (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-amber-50/70 border border-amber-200 p-3 rounded-xl">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>Sipariş Üretimde! Termin Tarihi: <strong className="font-mono text-indigo-900">{order.deliveryDate}</strong></span>
                      </div>
                      <button
                        onClick={() => onUpdateOrderStatus(order.id, 'teslim')}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
                      >
                        <CheckCircle className="w-4 h-4" /> ✅ Teslim Edildi Olarak Tıkla & Bitir
                      </button>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-emerald-50 border border-emerald-200/80 p-3 rounded-xl flex items-center justify-between text-xs">
                      <span className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" /> Teslim Edildi - Üretim ve Süreç Tamamlandı
                      </span>
                      <span className="text-[11px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">TAMAMLANDI</span>
                    </div>
                  );
                }
              })()}

              {/* Items & Carpet Specification Details - Satır Satır Tablo Görünümü */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 overflow-x-auto space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 px-2 py-1 border-b border-slate-200">
                  <span className="flex items-center gap-1.5 text-indigo-700">
                    <Layers className="w-3.5 h-3.5" /> Sipariş İçerik Kalemleri ({order.items.length} Kalem)
                  </span>
                  <span className="font-mono text-slate-500">Toplam: {order.totalM2.toFixed(2)} m²</span>
                </div>

                {/* Table Header for Desktop */}
                <div className="hidden lg:grid lg:grid-cols-[28px_1.5fr_110px_140px_60px_90px_110px_120px] gap-2 items-center px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono border-b border-slate-200/80">
                  <span>#</span>
                  <span>Koleksiyon / Ürün Adı</span>
                  <span>Renk Kodu</span>
                  <span>Ölçü (En×Boy / m²)</span>
                  <span className="text-center">Adet</span>
                  <span className="text-right">Toplam m²</span>
                  <span>Kenar Bitişi</span>
                  <span className="text-right">Kalem Tutarı</span>
                </div>

                {/* Rows (Satır Satır) */}
                {order.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 lg:grid-cols-[28px_1.5fr_110px_140px_60px_90px_110px_120px] gap-2 items-center bg-white hover:bg-slate-100/80 p-2 lg:p-1.5 rounded-lg border border-slate-200 transition-colors text-xs font-mono"
                  >
                    <span className="w-5 h-5 rounded bg-slate-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0 border border-slate-200 font-mono">
                      {idx + 1}
                    </span>
                    <div className="font-bold text-slate-900 font-sans">{item.collectionName}</div>
                    <div className="text-slate-600 text-[11px]"><span className="lg:hidden text-slate-400 font-sans">Renk: </span>{item.colorCode}</div>
                    <div className="font-bold">
                      <span className="lg:hidden text-slate-400 font-sans">Ölçü: </span>
                      {item.dimensionMode === 'sqm' || (!item.widthCm && !item.lengthCm) ? (
                        <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px] font-sans font-semibold">
                          Doğrudan {item.areaM2} m²
                        </span>
                      ) : (
                        <span className="text-indigo-600">
                          {item.widthCm} x {item.lengthCm} cm
                        </span>
                      )}
                    </div>
                    <div className="text-slate-900 font-bold text-left lg:text-center"><span className="lg:hidden text-slate-400 font-sans">Adet: </span>{item.quantity}</div>
                    <div className="text-slate-700 font-semibold text-left lg:text-right"><span className="lg:hidden text-slate-400 font-sans">m²: </span>{item.areaM2.toFixed(2)} m²</div>
                    <div>
                      <span className="text-slate-800 uppercase font-bold text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-sans">
                        {item.edgeFinish}
                      </span>
                    </div>
                    <div className="text-indigo-700 font-bold text-left lg:text-right">
                      {((item.areaM2 || 1) * (item.unitPricePerM2 || 1250) * (item.quantity || 1)).toLocaleString('tr-TR')} ₺
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl lg:max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl p-4 sm:p-6 space-y-5 shadow-2xl relative text-xs">
            <button
              onClick={() => setIsNewOrderModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" /> Yeni Özel Halı Siparişi Gir
            </h3>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-4">
              {/* Proforma Import Select Box */}
              <div className="bg-amber-950/40 border border-amber-500/50 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-amber-300 font-bold text-xs flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-400" /> Hazır Proforma Faturadan Otomatik Sipariş Doldur
                  </label>
                  <span className="text-[10px] text-amber-400 font-medium">Onaylanan proformayı seçin, müşteri, kalemler ve ön ödeme otomatik dolsun</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedProformaId}
                    onChange={(e) => {
                      const pfId = e.target.value;
                      setSelectedProformaId(pfId);
                      if (pfId) {
                        const found = proformas.find(p => (p.invoiceNumber || p.id) === pfId);
                        if (found) {
                          applyProformaToForm(found);
                        }
                      }
                    }}
                    className="flex-1 bg-slate-900 border border-amber-500/60 text-amber-100 p-2 rounded-lg text-xs font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="">-- Onaylı Proforma Fatura Seçin ({proformas.length} Hazır Proforma Mutfakta) --</option>
                    {proformas.map((pf, idx) => {
                      const total = pf.items.reduce((s, i) => s + (i.amount || (i.sqm * i.unitPrice * (i.rolls || 1))), 0);
                      return (
                        <option key={pf.id || pf.invoiceNumber || idx} value={pf.invoiceNumber || pf.id}>
                          {pf.invoiceNumber || 'PI'} • {pf.customerName} ({total.toLocaleString('tr-TR')} {getSymbol(pf.currency)})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {proformaBanner && (
                  <div className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/90 border border-emerald-500/60 p-2 rounded-lg flex items-center justify-between shadow-xs">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                      {proformaBanner}
                    </span>
                    <button
                      type="button"
                      onClick={() => setProformaBanner('')}
                      className="text-emerald-400 hover:text-white text-xs font-bold pl-2 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

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
                      className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded-lg focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Firma / Tel</label>
                    <input
                      type="text"
                      placeholder="Karaca Otel A.Ş."
                      value={newOrderForm.company}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, company: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded-lg focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Teslimat Adresi / Şehir</label>
                    <input
                      type="text"
                      placeholder="İstanbul / Etiler"
                      value={newOrderForm.shippingAddress}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, shippingAddress: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded-lg focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Sipariş Giriş Tarihi *</label>
                    <input
                      type="date"
                      required
                      value={newOrderForm.createdAt}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, createdAt: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded-lg font-mono focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Söz Verilen Termin Tarihi *</label>
                    <input
                      type="date"
                      required
                      value={newOrderForm.deliveryDate}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, deliveryDate: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded-lg font-mono focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-300 font-bold mb-1">Sipariş Genel Para Birimi *</label>
                    <select
                      value={newOrderForm.currency}
                      onChange={(e) => {
                        const curr = e.target.value as any;
                        setNewOrderForm({ ...newOrderForm, currency: curr, advancePaymentCurrency: curr });
                      }}
                      className="w-full bg-slate-800 border border-amber-600/80 text-amber-300 p-2 rounded-lg font-bold text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="TL">₺ - Türk Lirası (TL)</option>
                      <option value="USD">$ - Dolar (USD)</option>
                      <option value="EUR">€ - Euro (EUR)</option>
                      <option value="GBP">£ - Sterlin (GBP)</option>
                    </select>
                  </div>
                </div>

                {/* Ön Ödeme Seçeneği */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <label className="block text-slate-300 font-bold mb-1">Ön Ödeme Durumu *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewOrderForm({ ...newOrderForm, hasAdvancePayment: false, advancePaymentAmount: 0 })}
                      className={`p-2 rounded-lg border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        !newOrderForm.hasAdvancePayment
                          ? 'bg-slate-800 text-amber-300 border-amber-500 shadow-xs'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <X className="w-4 h-4 text-slate-400" />
                      <span>Ön Ödemesiz Üretim</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewOrderForm({ ...newOrderForm, hasAdvancePayment: true, advancePaymentAmount: newOrderForm.advancePaymentAmount || Math.round(totalOrderAmount * 0.3) })}
                      className={`p-2 rounded-lg border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        newOrderForm.hasAdvancePayment
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-xs'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <Coins className="w-4 h-4 text-emerald-400" />
                      <span>Ön Ödeme Alındı</span>
                    </button>
                  </div>

                  {newOrderForm.hasAdvancePayment && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 bg-emerald-950/30 p-3 rounded-lg border border-emerald-800/50">
                      <div>
                        <label className="block text-emerald-300 font-bold mb-1">Ön Ödeme Para Birimi *</label>
                        <select
                          value={newOrderForm.advancePaymentCurrency}
                          onChange={(e) => setNewOrderForm({ ...newOrderForm, advancePaymentCurrency: e.target.value as any })}
                          className="w-full bg-slate-800 border border-emerald-600 text-emerald-200 p-2 rounded-lg font-bold text-xs focus:outline-none cursor-pointer"
                        >
                          <option value="TL">₺ - Türk Lirası (TL)</option>
                          <option value="USD">$ - Dolar (USD)</option>
                          <option value="EUR">€ - Euro (EUR)</option>
                          <option value="GBP">£ - Sterlin (GBP)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-emerald-300 font-bold mb-1">
                          Alınan Tutar ({getSymbol(newOrderForm.advancePaymentCurrency)}) *
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          required={newOrderForm.hasAdvancePayment}
                          placeholder="Örn: 2500.50"
                          value={newOrderForm.advancePaymentAmount || ''}
                          onChange={(e) => setNewOrderForm({ ...newOrderForm, advancePaymentAmount: Number(e.target.value) })}
                          className="w-full bg-slate-800 border border-emerald-600 text-emerald-200 p-2 rounded-lg font-mono font-bold focus:outline-none text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-emerald-300/80 font-medium mb-1">Ön Ödeme Notu / Dekont No</label>
                        <input
                          type="text"
                          placeholder="Örn: Banka havalesi #9210"
                          value={newOrderForm.advancePaymentNotes}
                          onChange={(e) => setNewOrderForm({ ...newOrderForm, advancePaymentNotes: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded-lg focus:outline-none text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Multiple Product Items List - Compact Table Layout */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-4 h-4" /> Sipariş Kalemleri ({newOrderForm.items.length} Kalem)
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddItem('sqm')}
                      className="px-2.5 py-1.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Metrekare (m²) Kalem
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddItem('dimensions')}
                      className="px-2.5 py-1.5 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> + En×Boy (cm) Kalem
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 space-y-1.5 overflow-x-auto">
                  {/* Table Header for Desktop */}
                  <div className="hidden lg:grid lg:grid-cols-[28px_1.4fr_1fr_180px_60px_90px_100px_100px_32px] gap-2 items-center px-2 py-1 text-[10px] font-bold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                    <span>#</span>
                    <span>Ürün / Koleksiyon Adı</span>
                    <span>Renk / Kod</span>
                    <span>Ölçü (m² veya En×Boy)</span>
                    <span>Adet</span>
                    <span>m² Fiyat ({getSymbol(newOrderForm.currency)})</span>
                    <span>Kenar Bitişi</span>
                    <span className="text-right">Hesaplanan</span>
                    <span></span>
                  </div>

                  {newOrderForm.items.map((item, idx) => {
                    const isSqmMode = item.dimensionMode === 'sqm' || (!item.widthCm && !item.lengthCm);
                    const itemSingleM2 = isSqmMode
                      ? Number(item.areaM2 || 0)
                      : (Number(item.widthCm || 0) * Number(item.lengthCm || 0)) / 10000;
                    const itemTotalM2 = itemSingleM2 * Number(item.quantity || 1);
                    const itemPrice = itemTotalM2 * Number(item.unitPricePerM2 || 0);

                    return (
                      <div
                        key={item.id || idx}
                        className="grid grid-cols-1 lg:grid-cols-[28px_1.4fr_1fr_180px_60px_90px_100px_100px_32px] gap-2 items-center bg-slate-900/80 hover:bg-slate-900 p-2 lg:p-1.5 rounded-lg border border-slate-800/80 transition-colors"
                      >
                        <div className="flex items-center justify-between lg:justify-start">
                          <span className="w-6 h-6 rounded bg-slate-800 text-amber-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="lg:hidden text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Sil
                          </button>
                        </div>

                        {/* Koleksiyon Adı */}
                        <div>
                          <input
                            type="text"
                            required
                            placeholder="Ürün / Koleksiyon *"
                            value={item.collectionName}
                            onChange={(e) => handleItemChange(idx, 'collectionName', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700/80 focus:border-amber-500 text-white px-2.5 py-1.5 rounded-md text-xs focus:outline-none"
                          />
                        </div>

                        {/* Renk / Kod */}
                        <div>
                          <input
                            type="text"
                            placeholder="Renk / Kod"
                            value={item.colorCode}
                            onChange={(e) => handleItemChange(idx, 'colorCode', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700/80 focus:border-amber-500 text-white px-2.5 py-1.5 rounded-md text-xs focus:outline-none"
                          />
                        </div>

                        {/* Ölçü (m² veya En x Boy Seçimi ve Girdisi) */}
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <button
                              type="button"
                              onClick={() => {
                                handleItemChange(idx, 'dimensionMode', 'sqm');
                                if (!item.areaM2 && item.widthCm && item.lengthCm) {
                                  handleItemChange(idx, 'areaM2', Number(((item.widthCm * item.lengthCm) / 10000).toFixed(2)));
                                }
                              }}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                                isSqmMode
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              m²
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleItemChange(idx, 'dimensionMode', 'dimensions');
                                if (!item.widthCm) handleItemChange(idx, 'widthCm', 200);
                                if (!item.lengthCm) handleItemChange(idx, 'lengthCm', 300);
                              }}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                                !isSqmMode
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              En×Boy
                            </button>
                          </div>

                          {isSqmMode ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                required
                                placeholder="m² girin"
                                value={item.areaM2 || ''}
                                onChange={(e) => handleItemChange(idx, 'areaM2', Number(e.target.value))}
                                className="w-full bg-slate-950 border border-emerald-500/70 focus:border-emerald-400 text-emerald-300 px-2 py-1 rounded-md text-xs font-mono text-center focus:outline-none"
                              />
                              <span className="text-[10px] text-emerald-400 font-bold shrink-0">m²</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                required
                                placeholder="En"
                                value={item.widthCm || ''}
                                onChange={(e) => handleItemChange(idx, 'widthCm', Number(e.target.value))}
                                className="w-1/2 bg-slate-950 border border-slate-700/80 focus:border-indigo-400 text-white px-1.5 py-1 rounded-md text-xs font-mono text-center focus:outline-none"
                              />
                              <span className="text-slate-400 text-xs font-bold">×</span>
                              <input
                                type="number"
                                min="1"
                                required
                                placeholder="Boy"
                                value={item.lengthCm || ''}
                                onChange={(e) => handleItemChange(idx, 'lengthCm', Number(e.target.value))}
                                className="w-1/2 bg-slate-950 border border-slate-700/80 focus:border-indigo-400 text-white px-1.5 py-1 rounded-md text-xs font-mono text-center focus:outline-none"
                              />
                            </div>
                          )}
                        </div>

                        {/* Adet */}
                        <div className="flex lg:block items-center justify-between">
                          <span className="lg:hidden text-[10px] text-slate-400">Adet:</span>
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.quantity || ''}
                            onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                            className="w-16 lg:w-full bg-slate-950 border border-slate-700/80 focus:border-amber-500 text-white px-1.5 py-1.5 rounded-md text-xs font-mono text-center focus:outline-none"
                          />
                        </div>

                        {/* Birim Fiyat */}
                        <div className="flex lg:block items-center justify-between">
                          <span className="lg:hidden text-[10px] text-slate-400">m² Fiyat ({getSymbol(newOrderForm.currency)}):</span>
                          <input
                            type="number"
                            step="any"
                            required
                            min="0"
                            placeholder="10.50"
                            value={item.unitPricePerM2 ?? ''}
                            onChange={(e) => handleItemChange(idx, 'unitPricePerM2', e.target.value === '' ? 0 : Number(e.target.value))}
                            className="w-24 lg:w-full bg-slate-950 border border-slate-700/80 focus:border-amber-500 text-white px-1.5 py-1.5 rounded-md text-xs font-mono text-right focus:outline-none"
                          />
                        </div>

                        {/* Kenar Bitişi */}
                        <div className="flex lg:block items-center justify-between">
                          <span className="lg:hidden text-[10px] text-slate-400">Kenar:</span>
                          <select
                            value={item.edgeFinish}
                            onChange={(e) => handleItemChange(idx, 'edgeFinish', e.target.value)}
                            className="w-28 lg:w-full bg-slate-950 border border-slate-700/80 focus:border-amber-500 text-white px-1 py-1.5 rounded-md text-xs focus:outline-none"
                          >
                            <option value="overlok">Overlok</option>
                            <option value="sacagli">Pamuk Saçaklı</option>
                            <option value="deri_biye">Deri Biyeli</option>
                            <option value="katlama">Katlama</option>
                          </select>
                        </div>

                        {/* Toplam */}
                        <div className="text-right font-mono text-xs flex lg:block items-center justify-between">
                          <span className="lg:hidden text-[10px] text-slate-400">Hesaplanan:</span>
                          <div>
                            <div className="text-[10px] text-slate-400">{itemTotalM2.toFixed(2)} m²</div>
                            <div className="text-emerald-400 font-bold text-xs">
                              {itemPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getSymbol(newOrderForm.currency)}
                            </div>
                          </div>
                        </div>

                        {/* Sil */}
                        <div className="hidden lg:flex items-center justify-center">
                          {newOrderForm.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-950/50 transition-colors cursor-pointer"
                              title="Kalemi Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Item Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddItem('sqm')}
                    className="py-2 border border-dashed border-emerald-700/60 hover:border-emerald-500 bg-slate-950/40 hover:bg-emerald-500/10 text-emerald-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
                  >
                    <Plus className="w-4 h-4" /> + Doğrudan Metrekare (m²) Kalem Ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddItem('dimensions')}
                    className="py-2 border border-dashed border-indigo-700/60 hover:border-indigo-500 bg-slate-950/40 hover:bg-indigo-500/10 text-indigo-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
                  >
                    <Plus className="w-4 h-4" /> + En × Boy (cm) Kalem Ekle
                  </button>
                </div>
              </div>

              {/* Total Summary Footer */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Toplam m²</span>
                  <span className="text-amber-400 font-bold text-sm">{totalOrderM2.toFixed(2)} m²</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Sipariş Tutarı</span>
                  <span className="text-white font-bold text-sm">
                    {totalOrderAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {getSymbol(newOrderForm.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Alınan Ön Ödeme</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {newOrderForm.hasAdvancePayment 
                      ? `${Number(newOrderForm.advancePaymentAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${getSymbol(newOrderForm.advancePaymentCurrency)}`
                      : 'Ön Ödemesiz'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Kalan Bakiye</span>
                  <span className="text-indigo-400 font-extrabold text-sm">
                    {newOrderForm.currency === newOrderForm.advancePaymentCurrency
                      ? `${Math.max(0, totalOrderAmount - (newOrderForm.hasAdvancePayment ? Number(newOrderForm.advancePaymentAmount || 0) : 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${getSymbol(newOrderForm.currency)}`
                      : `${totalOrderAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${getSymbol(newOrderForm.currency)} - ${Number(newOrderForm.advancePaymentAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${getSymbol(newOrderForm.advancePaymentCurrency)}`
                    }
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-lg shadow-md cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Siparişi Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Production Sheet Print Modal */}
      {activePrintOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:block">
          <div className="bg-white text-slate-900 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl relative font-sans printable-a4-page">
            <button
              onClick={() => setActivePrintOrder(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 print:hidden"
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
                  <th className="p-2 border">Ölçü (En×Boy / m²)</th>
                  <th className="p-2 border">m²</th>
                  <th className="p-2 border">Kenar</th>
                </tr>
              </thead>
              <tbody>
                {activePrintOrder.items.map((it) => (
                  <tr key={it.id} className="border-b">
                    <td className="p-2 border font-semibold">{it.collectionName}</td>
                    <td className="p-2 border font-mono font-bold">
                      {it.dimensionMode === 'sqm' || (!it.widthCm && !it.lengthCm) ? (
                        <span className="text-emerald-700 font-bold">{it.areaM2} m² (Doğrudan m²)</span>
                      ) : (
                        `${it.widthCm} x ${it.lengthCm} cm`
                      )}
                    </td>
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
                  document.body.classList.add('printing-modal');
                  window.print();
                  setTimeout(() => {
                    document.body.classList.remove('printing-modal');
                  }, 1000);
                }}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 print:hidden cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Fişi Yazdır
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal (Satır Satır Detay Görünümü) */}
      {activeDetailOrder && (() => {
        const orderSym = getSymbol(activeDetailOrder.currency);
        const advSym = getSymbol(activeDetailOrder.advancePaymentCurrency || activeDetailOrder.currency);
        const hasAdv = activeDetailOrder.hasAdvancePayment ?? (activeDetailOrder.advancePaymentAmount ? activeDetailOrder.advancePaymentAmount > 0 : false);
        const advAmt = activeDetailOrder.advancePaymentAmount || 0;
        const remainingAmt = Math.max(0, activeDetailOrder.totalAmount - advAmt);

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5">
            <div className="bg-white text-slate-900 w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl relative">
              <button
                onClick={() => setActiveDetailOrder(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl font-mono font-extrabold text-lg border border-indigo-200">
                    {activeDetailOrder.orderNumber}
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">{activeDetailOrder.customerName}</h2>
                    <p className="text-xs text-slate-500">{activeDetailOrder.company} • {activeDetailOrder.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-100 text-slate-800 font-bold px-3 py-1.5 rounded-lg border border-slate-200 font-mono">
                    Toplam: {activeDetailOrder.totalAmount.toLocaleString('tr-TR')} {orderSym}
                  </span>
                  <button
                    onClick={() => {
                      setActivePrintOrder(activeDetailOrder);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-4 h-4" /> Yazdır
                  </button>
                </div>
              </div>

              {/* Order Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Sipariş Tarihi</span>
                  <strong className="text-slate-900 font-bold">{activeDetailOrder.createdAt || 'Belirtilmedi'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Söz Verilen Termin</span>
                  <strong className="text-indigo-700 font-bold">{activeDetailOrder.deliveryDate || 'Belirtilmedi'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Ön Ödeme Bilgisi</span>
                  {hasAdv ? (
                    <span className="text-emerald-700 font-bold">✓ Alındı ({advAmt.toLocaleString('tr-TR')} {advSym})</span>
                  ) : (
                    <span className="text-slate-600 font-bold">Ön Ödemesiz Sipariş</span>
                  )}
                </div>
              </div>

              {/* Satır Satır Ürün Kalemleri Tablosu */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" /> Sipariş Kalemleri (Satır Satır Tablo)
                  </h3>
                  <span className="text-xs text-slate-500 font-mono font-bold">
                    {activeDetailOrder.items.length} Kalem • {activeDetailOrder.totalM2.toFixed(2)} m²
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto bg-slate-50 p-2">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider font-mono font-bold text-slate-500 bg-slate-100/80">
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Koleksiyon / Desen Adı</th>
                        <th className="p-2.5">Renk Kodu</th>
                        <th className="p-2.5">Ölçü (En×Boy / m²)</th>
                        <th className="p-2.5 text-center">Adet</th>
                        <th className="p-2.5 text-right">Toplam m²</th>
                        <th className="p-2.5">Kenar Bitişi</th>
                        <th className="p-2.5 text-right">m² Birim Fiyatı</th>
                        <th className="p-2.5 text-right">Kalem Toplamı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {activeDetailOrder.items.map((item, idx) => {
                        const isSqm = item.dimensionMode === 'sqm' || (!item.widthCm && !item.lengthCm);
                        const itemM2 = item.areaM2 || (isSqm ? 0 : ((item.widthCm * item.lengthCm) / 10000)) * (item.quantity || 1);
                        const unitRate = item.unitPricePerM2 || 1250;
                        const lineTotal = item.totalPrice || (itemM2 * unitRate);

                        return (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 font-mono font-bold text-slate-400 text-center">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-slate-900">{item.collectionName}</td>
                            <td className="p-2.5 font-mono text-slate-600">{item.colorCode}</td>
                            <td className="p-2.5 font-mono font-bold">
                              {isSqm ? (
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px] font-sans">
                                  Doğrudan {item.areaM2} m²
                                </span>
                              ) : (
                                <span className="text-indigo-700">{item.widthCm} x {item.lengthCm} cm</span>
                              )}
                            </td>
                            <td className="p-2.5 font-mono text-center font-bold text-slate-800">{item.quantity}</td>
                            <td className="p-2.5 font-mono text-right font-semibold text-slate-900">{itemM2.toFixed(2)} m²</td>
                            <td className="p-2.5">
                              <span className="text-[10px] bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded font-bold uppercase">
                                {item.edgeFinish}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-right text-slate-600">{unitRate.toLocaleString('tr-TR')} {orderSym}</td>
                            <td className="p-2.5 font-mono text-right font-extrabold text-indigo-600">
                              {lineTotal.toLocaleString('tr-TR')} {orderSym}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="text-slate-500 font-mono">
                  Sipariş Durumu: <strong className="text-indigo-700 font-bold uppercase">{activeDetailOrder.status}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveDetailOrder(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
