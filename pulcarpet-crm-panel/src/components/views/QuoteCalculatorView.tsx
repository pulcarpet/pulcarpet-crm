import React, { useState } from 'react';
import { Quote } from '../../types';
import { 
  Calculator, 
  Sparkles, 
  Ruler, 
  FileText, 
  Printer, 
  CheckCircle2, 
  Layers, 
  Plus, 
  Trash2,
  Percent,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { ProformaInvoiceModal, ProformaInvoiceData } from '../ProformaInvoiceModal';

interface QuoteCalculatorViewProps {
  quotes: Quote[];
  onAddQuote: (quote: Quote) => void;
  onOpenProforma?: (initialData?: Partial<ProformaInvoiceData>) => void;
}

interface CalcLineItem {
  id: string;
  name: string;
  widthCm: number;
  lengthCm: number;
  quantity: number;
  materialPricePerM2: number;
  edgeFinishBonusPerM2: number;
  edgeFinishName: string;
}

export const QuoteCalculatorView: React.FC<QuoteCalculatorViewProps> = ({
  quotes,
  onAddQuote,
  onOpenProforma,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState<'TL' | 'USD' | 'EUR' | 'GBP'>('TL');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₺';

  const [lineItems, setLineItems] = useState<CalcLineItem[]>([
    {
      id: '1',
      name: 'Bambu İpek Halı',
      widthCm: 200,
      lengthCm: 300,
      quantity: 1,
      materialPricePerM2: 1250,
      edgeFinishBonusPerM2: 0,
      edgeFinishName: 'Overlok',
    },
  ]);

  // AI Quote Insights State
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiInsight, setAiInsight] = useState<any>(null);

  // Active Quote Modal for Print
  const [activePrintQuote, setActivePrintQuote] = useState<any | null>(null);
  const [isProformaOpen, setIsProformaOpen] = useState(false);

  const handleAddItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: Date.now().toString(),
        name: 'Özel Kesim Halı',
        widthCm: 200,
        lengthCm: 300,
        quantity: 1,
        materialPricePerM2: 1000,
        edgeFinishBonusPerM2: 0,
        edgeFinishName: 'Overlok',
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((i) => i.id !== id));
    }
  };

  // Calculations
  const calculatedItems = lineItems.map((item) => {
    const m2 = (item.widthCm * item.lengthCm) / 10000;
    const totalM2 = m2 * item.quantity;
    const unitRate = item.materialPricePerM2;
    const itemTotal = totalM2 * unitRate;
    return { ...item, m2, totalM2, unitRate, itemTotal };
  });

  const totalAreaM2 = calculatedItems.reduce((sum, i) => sum + i.totalM2, 0);
  const subtotalAmount = calculatedItems.reduce((sum, i) => sum + i.itemTotal, 0);
  const discountAmount = (subtotalAmount * discountPercent) / 100;
  const netSubtotal = subtotalAmount - discountAmount;
  const taxAmount = netSubtotal * 0.20; // %20 KDV
  const grandTotal = netSubtotal + taxAmount;

  const handleAnalyzeWithAi = async () => {
    setIsAnalyzingAi(true);
    setAiInsight(null);

    try {
      const res = await fetch('/api/ai/calculate-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          projectDetails: `${company} - Toplam ${totalAreaM2.toFixed(1)} m² Halı Siparişi`,
          items: calculatedItems,
        }),
      });
      const data = await res.json();
      if (data.aiQuoteInsight) {
        setAiInsight(data.aiQuoteInsight);
        if (data.aiQuoteInsight.suggestedDiscountPercent) {
          setDiscountPercent(data.aiQuoteInsight.suggestedDiscountPercent);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleSaveAndPrintQuote = () => {
    const newQuote: Quote = {
      id: `QUO-${Math.floor(1000 + Math.random() * 9000)}`,
      quoteNumber: `TKF-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerName,
      company,
      email,
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: calculatedItems.map((ci) => ({
        id: ci.id,
        productName: ci.name,
        dimensions: `${ci.widthCm}x${ci.lengthCm} cm`,
        areaM2: ci.m2,
        quantity: ci.quantity,
        unitPrice: ci.unitRate,
        totalPrice: ci.itemTotal,
      })),
      subtotal: subtotalAmount,
      discountPercent,
      taxAmount,
      grandTotal,
      currency,
      status: 'Gönderildi',
      notes: 'PulCarpet Halı San. Tic. A.Ş. teklif şartlarına tabidir.',
    };

    onAddQuote(newQuote);
    setActivePrintQuote(newQuote);
  };

  return (
    <div id="quote-calculator-view" className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600" /> Özel Halı Fiyat & m² Hesaplama Motoru
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dinamik boyutlandırma, iplik ve kenar biye maliyeti hesaplayıcı
          </p>
        </div>

        <button
          onClick={handleAnalyzeWithAi}
          disabled={isAnalyzingAi}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
        >
          <Sparkles className="w-4 h-4 fill-white" />
          <span>{isAnalyzingAi ? 'AI Analiz Ediyor...' : 'Google AI İskonto & Strateji Değerlendir'}</span>
        </button>
      </div>

      {/* AI Smart Suggestion Card */}
      {aiInsight && (
        <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-xl space-y-2 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Google Gemini Satış Değerlendirmesi
          </div>
          <p className="text-xs text-slate-800 leading-relaxed font-medium">
            {aiInsight.recommendationSummary}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs pt-2 border-t border-indigo-100 font-mono">
            <span className="text-emerald-700 font-bold">Önerilen İskonto: %{aiInsight.suggestedDiscountPercent}</span>
            <span className="text-blue-700 font-bold">Üretim Süresi: {aiInsight.estimatedProductionDays} İş Günü</span>
            <span className="text-purple-700 font-bold">Ağır Müşteri Skoru: {aiInsight.leadPriorityScore}/100</span>
          </div>
        </div>
      )}

      {/* Calculator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Line Items Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Metadata Card */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-3 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Müşteri & Proje Bilgileri
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Müşteri / Yetkili</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Örn: Sn. Ahmet Yılmaz"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-2 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Firma Adı</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Örn: Yılmaz İnşaat A.Ş."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-2 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">E-Posta</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Örn: ahmet@yilmaz.com"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-2 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Para Birimi</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as 'TL' | 'USD' | 'EUR' | 'GBP')}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-2 rounded-lg focus:outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="TL">₺ - Türk Lirası (TL)</option>
                  <option value="USD">$ - ABD Doları (USD)</option>
                  <option value="EUR">€ - Euro (EUR)</option>
                  <option value="GBP">£ - İngiliz Sterlini (GBP)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Line Items List */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                Halı Kalemleri & Ölçü Tablosu
              </h3>
              <button
                onClick={handleAddItem}
                className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Kalem Ekle
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5 overflow-x-auto">
              {/* Table Header for Desktop */}
              <div className="hidden lg:grid lg:grid-cols-[28px_1.5fr_72px_72px_56px_90px_110px_120px_32px] gap-2 items-center px-2 py-1.5 text-[10px] font-bold text-slate-500 border-b border-slate-200 uppercase tracking-wider font-mono">
                <span>#</span>
                <span>Ürün / Koleksiyon Adı</span>
                <span>En (cm)</span>
                <span>Boy (cm)</span>
                <span>Adet</span>
                <span>m² Fiyat ({currencySymbol})</span>
                <span>Kenar Bitişi</span>
                <span className="text-right">Hesaplanan</span>
                <span></span>
              </div>

              {calculatedItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 lg:grid-cols-[28px_1.5fr_72px_72px_56px_90px_110px_120px_32px] gap-2 items-center bg-white hover:bg-slate-100/80 p-2 lg:p-1.5 rounded-lg border border-slate-200 transition-colors shadow-2xs"
                >
                  <div className="flex items-center justify-between lg:justify-start">
                    <span className="w-6 h-6 rounded bg-slate-100 text-indigo-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-slate-200">
                      {idx + 1}
                    </span>
                    {calculatedItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="lg:hidden text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Sil
                      </button>
                    )}
                  </div>

                  {/* Koleksiyon / Kalem Adı */}
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Ürün / Koleksiyon *"
                      value={item.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLineItems(lineItems.map((li) => (li.id === item.id ? { ...li, name: val } : li)));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-slate-900 px-2.5 py-1.5 rounded-md text-xs font-medium focus:outline-none"
                    />
                  </div>

                  {/* En (cm) */}
                  <div className="flex lg:block items-center justify-between">
                    <span className="lg:hidden text-[10px] text-slate-400">En (cm):</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={item.widthCm || ''}
                      onChange={(e) =>
                        setLineItems(
                          lineItems.map((li) => (li.id === item.id ? { ...li, widthCm: Number(e.target.value) } : li))
                        )
                      }
                      className="w-20 lg:w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-slate-900 px-1.5 py-1.5 rounded-md text-xs font-mono font-bold text-center focus:outline-none"
                    />
                  </div>

                  {/* Boy (cm) */}
                  <div className="flex lg:block items-center justify-between">
                    <span className="lg:hidden text-[10px] text-slate-400">Boy (cm):</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={item.lengthCm || ''}
                      onChange={(e) =>
                        setLineItems(
                          lineItems.map((li) => (li.id === item.id ? { ...li, lengthCm: Number(e.target.value) } : li))
                        )
                      }
                      className="w-20 lg:w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-slate-900 px-1.5 py-1.5 rounded-md text-xs font-mono font-bold text-center focus:outline-none"
                    />
                  </div>

                  {/* Adet */}
                  <div className="flex lg:block items-center justify-between">
                    <span className="lg:hidden text-[10px] text-slate-400">Adet:</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={item.quantity || ''}
                      onChange={(e) =>
                        setLineItems(
                          lineItems.map((li) => (li.id === item.id ? { ...li, quantity: Number(e.target.value) } : li))
                        )
                      }
                      className="w-16 lg:w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-slate-900 px-1.5 py-1.5 rounded-md text-xs font-mono font-bold text-center focus:outline-none"
                    />
                  </div>

                  {/* m2 Birim Fiyatı */}
                  <div className="flex lg:block items-center justify-between">
                    <span className="lg:hidden text-[10px] text-slate-400">m² Fiyatı:</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.materialPricePerM2 ?? ''}
                      onChange={(e) => {
                        const price = e.target.value === '' ? 0 : Number(e.target.value);
                        setLineItems(
                          lineItems.map((li) => (li.id === item.id ? { ...li, materialPricePerM2: price } : li))
                        );
                      }}
                      placeholder="10.50"
                      className="w-24 lg:w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-slate-900 px-1.5 py-1.5 rounded-md text-xs font-mono font-bold text-center focus:outline-none"
                    />
                  </div>

                  {/* Kenar Bitişi */}
                  <div>
                    <input
                      type="text"
                      list={`edge-options-${item.id}`}
                      value={item.edgeFinishName}
                      onChange={(e) => {
                        const name = e.target.value;
                        setLineItems(
                          lineItems.map((li) =>
                            li.id === item.id ? { ...li, edgeFinishName: name, edgeFinishBonusPerM2: 0 } : li
                          )
                        );
                      }}
                      placeholder="Overlok / Saçak"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-slate-900 px-2 py-1.5 rounded-md text-xs font-medium focus:outline-none"
                    />
                    <datalist id={`edge-options-${item.id}`}>
                      <option value="Overlok" />
                      <option value="Pamuk Saçaklı" />
                      <option value="Deri Biyeli" />
                      <option value="Katlama" />
                      <option value="Saçaksız" />
                    </datalist>
                  </div>

                  {/* Hesaplanan m2 & Tutar */}
                  <div className="flex lg:flex-col lg:items-end justify-between text-right text-[11px] font-mono leading-tight py-1 lg:py-0">
                    <span className="text-slate-500 text-[10px]">{item.totalM2.toFixed(2)} m²</span>
                    <span className="text-indigo-600 font-extrabold">
                      {item.itemTotal.toLocaleString('tr-TR')} {currencySymbol}
                    </span>
                  </div>

                  {/* Delete Action Button */}
                  <div className="hidden lg:flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={calculatedItems.length <= 1}
                      className={`p-1.5 rounded-md transition-colors ${
                        calculatedItems.length > 1
                          ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                          : 'text-slate-300 cursor-not-allowed'
                      }`}
                      title="Kalemi sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Summary & Action Card */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl flex flex-col justify-between space-y-6 shadow-sm">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Teklif Maliyet Özeti</span>
              <span className="text-xs font-mono text-indigo-600 font-bold">{totalAreaM2.toFixed(2)} m²</span>
            </h3>

            <div className="space-y-2.5 text-xs font-mono text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Ara Toplam (Brüt):</span>
                <span className="font-bold">{subtotalAmount.toLocaleString('tr-TR')} {currencySymbol}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Percent className="w-3 h-3 text-indigo-600" /> İskonto Oranı:
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-14 bg-slate-50 border border-slate-200 text-indigo-600 font-bold text-right px-1.5 py-0.5 rounded"
                  />
                  <span className="font-bold">%</span>
                </div>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold text-[11px]">
                  <span>İskonto Tutarı:</span>
                  <span>-{discountAmount.toLocaleString('tr-TR')} {currencySymbol}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">KDV (%20):</span>
                <span className="font-bold">+{taxAmount.toLocaleString('tr-TR')} {currencySymbol}</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm font-bold">
                <span className="text-slate-900">Genel Toplam:</span>
                <span className="text-xl text-indigo-600 font-extrabold">{grandTotal.toLocaleString('tr-TR')} {currencySymbol}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                const proformaData: Partial<ProformaInvoiceData> = {
                  customerName: company || customerName,
                  addressLine1: 'Atatürk Mah. Sanayi Cad. No:14',
                  addressLine2: '34300 İstanbul',
                  country: 'TURKEY',
                  currency: currency === 'TL' ? 'TRY' : (currency as any),
                  items: calculatedItems.map((ci) => ({
                    id: ci.id,
                    description: ci.name,
                    subSpec: `${ci.widthCm}x${ci.lengthCm} cm (${ci.edgeFinishName})`,
                    rolls: ci.quantity,
                    sqm: Number(ci.totalM2.toFixed(2)),
                    unitPrice: currency === 'TL' ? Number((ci.unitRate / 33).toFixed(2)) : ci.unitRate,
                    amount: currency === 'TL' ? Number(((ci.totalM2 * ci.unitRate) / 33).toFixed(2)) : Number((ci.totalM2 * ci.unitRate).toFixed(2)),
                  })),
                  grossWeightKg: Math.round(totalAreaM2 * 2.8),
                  netWeightKg: Math.round(totalAreaM2 * 2.5),
                };
                if (onOpenProforma) {
                  onOpenProforma(proformaData);
                } else {
                  setIsProformaOpen(true);
                }
              }}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" /> Proforma / Commercial Invoice Hazırla (Resmi Şablon)
            </button>

            <button
              onClick={handleSaveAndPrintQuote}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3 rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <FileText className="w-4 h-4" /> CRM Teklifi Kaydet & Yazdır
            </button>
          </div>
        </div>
      </div>

      {/* Quote Preview Modal */}
      {activePrintQuote && (() => {
        const printSym = activePrintQuote.currency === 'USD' ? '$' : activePrintQuote.currency === 'EUR' ? '€' : activePrintQuote.currency === 'GBP' ? '£' : '₺';
        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white text-slate-900 w-full max-w-2xl rounded-2xl p-6 space-y-4 shadow-2xl relative font-sans">
              <button
                onClick={() => setActivePrintQuote(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="border-b pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black font-mono text-slate-900">PULCARPET</h2>
                  <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Halı & Zemin Sistemleri Fiyat Teklifi</p>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-slate-900">{activePrintQuote.quoteNumber}</div>
                  <div className="text-slate-500">Tarih: {activePrintQuote.date}</div>
                  <div className="text-slate-500">Geçerlilik: {activePrintQuote.validUntil}</div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <div><strong>Müşteri:</strong> {activePrintQuote.customerName}</div>
                <div><strong>Firma:</strong> {activePrintQuote.company}</div>
                <div><strong>E-Posta:</strong> {activePrintQuote.email}</div>
                <div><strong>Para Birimi:</strong> {activePrintQuote.currency || 'TL'} ({printSym})</div>
              </div>

              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="p-2 border">Açıklama</th>
                    <th className="p-2 border">Ölçü</th>
                    <th className="p-2 border">Adet</th>
                    <th className="p-2 border">Birim Fiyat</th>
                    <th className="p-2 border text-right">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {activePrintQuote.items.map((it: any) => (
                    <tr key={it.id} className="border-b">
                      <td className="p-2 border font-semibold">{it.productName}</td>
                      <td className="p-2 border font-mono">{it.dimensions}</td>
                      <td className="p-2 border font-mono">{it.quantity}</td>
                      <td className="p-2 border font-mono">{it.unitPrice} {printSym}/m²</td>
                      <td className="p-2 border text-right font-mono font-bold">{it.totalPrice.toLocaleString('tr-TR')} {printSym}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-right text-xs space-y-1 font-mono pt-2 border-t">
                <div>Ara Toplam: {activePrintQuote.subtotal.toLocaleString('tr-TR')} {printSym}</div>
                <div>İskonto (%{activePrintQuote.discountPercent}): -{((activePrintQuote.subtotal * activePrintQuote.discountPercent)/100).toLocaleString('tr-TR')} {printSym}</div>
                <div>KDV (%20): {activePrintQuote.taxAmount.toLocaleString('tr-TR')} {printSym}</div>
                <div className="text-base font-extrabold text-amber-600">
                  Genel Toplam: {activePrintQuote.grandTotal.toLocaleString('tr-TR')} {printSym}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-slate-900 text-white px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Teklifi Yazdır / PDF İndir
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Proforma Commercial Invoice Modal */}
      {isProformaOpen && (
        <ProformaInvoiceModal
          initialData={{
            customerName: company || customerName,
            addressLine1: 'Atatürk Mah. Sanayi Cad. No:14',
            addressLine2: '34300 İstanbul',
            country: 'TURKEY',
            currency: 'USD',
            items: calculatedItems.map((ci) => ({
              id: ci.id,
              description: ci.name,
              subSpec: `${ci.widthCm}x${ci.lengthCm} cm (${ci.edgeFinishName})`,
              rolls: ci.quantity,
              sqm: Number(ci.totalM2.toFixed(2)),
              unitPrice: Number((ci.unitRate / 33).toFixed(2)), // approx USD
              amount: Number(((ci.totalM2 * ci.unitRate) / 33).toFixed(2)),
            })),
            grossWeightKg: Math.round(totalAreaM2 * 2.8),
            netWeightKg: Math.round(totalAreaM2 * 2.5),
          }}
          onClose={() => setIsProformaOpen(false)}
        />
      )}
    </div>
  );
};
