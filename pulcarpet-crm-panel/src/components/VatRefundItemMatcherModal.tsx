import React, { useState, useEffect } from 'react';
import { 
  ParasutInvoice, 
  VatRefundMatching, 
  VatRefundItemMatch, 
  VatTransaction 
} from '../types';
import { isOurCompany } from './views/FinanceView';
import { 
  X, 
  Plus, 
  Trash2, 
  Calculator, 
  Download, 
  Printer, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Search, 
  ChevronRight,
  ArrowRight,
  Layers,
  Percent
} from 'lucide-react';

interface VatRefundItemMatcherModalProps {
  exportInvoice: ParasutInvoice | VatTransaction;
  allPurchaseInvoices: ParasutInvoice[];
  vatTransactions?: VatTransaction[];
  existingMatching?: VatRefundMatching | null;
  onSaveMatching: (matching: VatRefundMatching) => void;
  onClose: () => void;
}

export const VatRefundItemMatcherModal: React.FC<VatRefundItemMatcherModalProps> = ({
  exportInvoice,
  allPurchaseInvoices,
  vatTransactions = [],
  existingMatching,
  onSaveMatching,
  onClose,
}) => {
  // Extract export invoice details cleanly
  const isParasut = 'invoiceType' in exportInvoice;
  const exportInvoiceNo = isParasut ? (exportInvoice as ParasutInvoice).invoiceNumber : (exportInvoice as VatTransaction).invoiceNo;
  const exportInvoiceDate = isParasut ? (exportInvoice as ParasutInvoice).issueDate : (exportInvoice as VatTransaction).date;
  const rawCustomerName = isParasut ? (exportInvoice as ParasutInvoice).partyName : (exportInvoice as VatTransaction).partyName;
  const customerName = (!rawCustomerName || isOurCompany(rawCustomerName)) ? 'Yurtdışı Müşterisi (İhracat)' : rawCustomerName;
  const exportCurrency = isParasut ? ((exportInvoice as ParasutInvoice).currency || 'TRY') : ((exportInvoice as VatTransaction).currency || 'TRY');
  const exportNetAmount = isParasut ? (exportInvoice as ParasutInvoice).netAmount : (exportInvoice as VatTransaction).netAmount;
  const exportTotalAmount = isParasut ? (exportInvoice as ParasutInvoice).totalAmount : (exportInvoice as VatTransaction).netAmount;

  // Max refundable VAT ceiling (%20 of export net amount for TRY equivalent)
  // Assuming 1 USD = 36 TRY, 1 EUR = 39 TRY if in foreign currency for estimation
  const rateMultiplier = exportCurrency === 'USD' ? 36 : exportCurrency === 'EUR' ? 39 : 1;
  const exportNetTry = exportNetAmount * rateMultiplier;
  const maxRefundableVat = Math.round(exportNetTry * 0.20 * 100) / 100;

  // Matching State
  const [matching, setMatching] = useState<VatRefundMatching>(() => {
    if (existingMatching) return existingMatching;
    return {
      id: `VRM-${Date.now()}`,
      exportInvoiceId: exportInvoice.id,
      exportInvoiceNo,
      exportInvoiceDate,
      customerName: customerName || 'İhracat Müşterisi',
      exportCurrency,
      exportNetAmount,
      exportTotalAmount,
      customsDeclarationNo: `GÇB-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      customsDeclarationDate: exportInvoiceDate,
      matchedItems: [],
      totalIncurredVat: 0,
      maxRefundableVat,
      status: 'taslak',
      updatedAt: new Date().toISOString().split('T')[0],
    };
  });

  const [purchaseSearchTerm, setPurchaseSearchTerm] = useState('');
  const [selectedPurchaseCategory, setSelectedPurchaseCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'matching' | 'gib_list'>('matching');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Recalculate totals whenever matchedItems change
  useEffect(() => {
    const totalVat = matching.matchedItems.reduce((sum, item) => sum + (Number(item.allocatedIncurredVat) || 0), 0);
    const roundedTotal = Math.round(totalVat * 100) / 100;
    setMatching(prev => ({
      ...prev,
      totalIncurredVat: roundedTotal,
      status: roundedTotal >= maxRefundableVat * 0.95 ? 'tamamlandi' : 'taslak'
    }));
  }, [matching.matchedItems, maxRefundableVat]);

  // Available Purchase Invoices Filtered
  const filteredPurchases = allPurchaseInvoices.filter(inv => {
    if (inv.invoiceType !== 'purchase') return false;
    const term = purchaseSearchTerm.toLowerCase().trim();
    const matchTerm = !term ||
      inv.partyName.toLowerCase().includes(term) ||
      inv.invoiceNumber.toLowerCase().includes(term) ||
      (inv.description && inv.description.toLowerCase().includes(term));
    const matchCat = selectedPurchaseCategory === 'all' || inv.invoiceCategory === selectedPurchaseCategory;
    return matchTerm && matchCat;
  });

  // Add a Purchase Invoice to Matched Items list
  const handleAddPurchaseToMatch = (pInv: ParasutInvoice) => {
    // Check if already added
    const exists = matching.matchedItems.some(item => item.purchaseInvoiceNo === pInv.invoiceNumber);
    if (exists) {
      alert('Bu alış faturası zaten yüklenilen KDV listesine eklenmiştir.');
      return;
    }

    const net = pInv.netAmount || (pInv.totalAmount ? pInv.totalAmount / 1.20 : 0);
    const vat = pInv.vatAmount || (pInv.totalAmount ? pInv.totalAmount - net : net * 0.20);
    // Default allocated VAT = available VAT or calculated proportional
    const defaultAllocated = Math.min(vat, maxRefundableVat - matching.totalIncurredVat);

    const newItem: VatRefundItemMatch = {
      id: `MATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      purchaseInvoiceId: pInv.id,
      purchaseInvoiceNo: pInv.invoiceNumber,
      purchaseDate: pInv.issueDate,
      supplierName: pInv.partyName || 'Tedarikçi Firma',
      supplierTaxNo: pInv.taxNumber || '1234567890',
      itemDescription: pInv.description || `${pInv.invoiceCategory} - Hammadde / İşçilik`,
      matchedQuantity: pInv.itemCount || 1,
      unitOfMeasure: 'm2',
      purchaseNetAmount: Math.round(net * 100) / 100,
      purchaseVatRate: 20,
      purchaseVatAmount: Math.round(vat * 100) / 100,
      allocatedIncurredVat: Math.max(0, Math.round(defaultAllocated * 100) / 100),
      notes: ''
    };

    setMatching(prev => ({
      ...prev,
      matchedItems: [...prev.matchedItems, newItem]
    }));
  };

  // Add a Custom Manual Match Line (for invoices/costs outside Parasut)
  const handleAddManualMatchLine = () => {
    const newItem: VatRefundItemMatch = {
      id: `MATCH-MANUAL-${Date.now()}`,
      purchaseInvoiceNo: `GIB2026${Math.floor(10000000 + Math.random() * 90000000)}`,
      purchaseDate: exportInvoiceDate,
      supplierName: 'Aksu İplik Sanayi ve Ticaret A.Ş.',
      supplierTaxNo: '0380123456',
      itemDescription: 'Bambu & İpek Dokuma İpliği Alımı (%20 KDV)',
      matchedQuantity: 500,
      unitOfMeasure: 'kg',
      purchaseNetAmount: 150000,
      purchaseVatRate: 20,
      purchaseVatAmount: 30000,
      allocatedIncurredVat: 30000,
      notes: 'Üretim safhası iplik girdisi'
    };

    setMatching(prev => ({
      ...prev,
      matchedItems: [...prev.matchedItems, newItem]
    }));
  };

  // Remove a matched item
  const handleRemoveMatchedItem = (id: string) => {
    setMatching(prev => ({
      ...prev,
      matchedItems: prev.matchedItems.filter(item => item.id !== id)
    }));
  };

  // Update a specific field in a matched item
  const handleUpdateMatchedItem = (id: string, field: keyof VatRefundItemMatch, value: any) => {
    setMatching(prev => ({
      ...prev,
      matchedItems: prev.matchedItems.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'purchaseNetAmount' || field === 'purchaseVatRate') {
            const net = Number(field === 'purchaseNetAmount' ? value : item.purchaseNetAmount) || 0;
            const rate = Number(field === 'purchaseVatRate' ? value : item.purchaseVatRate) || 0;
            updated.purchaseVatAmount = Math.round((net * rate / 100) * 100) / 100;
          }
          return updated;
        }
        return item;
      })
    }));
  };

  // Smart Auto Allocation Engine (Akıllı Otomatik KDV Yükletme)
  const handleAutoAllocateIncurredVat = () => {
    if (filteredPurchases.length === 0 && vatTransactions.length === 0) {
      alert('Otomatik eşleme için sistemde kayıtlı alış faturası bulunamadı. Lütfen sol listeden alış faturalarınızı kontrol edin.');
      return;
    }

    // Take top purchase invoices that have VAT and build matched list up to maxRefundableVat
    let currentTotalVat = 0;
    const newMatchedList: VatRefundItemMatch[] = [];

    for (const pInv of filteredPurchases) {
      if (currentTotalVat >= maxRefundableVat) break;

      const net = pInv.netAmount || (pInv.totalAmount / 1.20);
      const vat = pInv.vatAmount || (pInv.totalAmount - net);
      if (vat <= 0) continue;

      const needed = maxRefundableVat - currentTotalVat;
      const allocated = Math.min(vat, needed);

      newMatchedList.push({
        id: `AUTO-${pInv.id}-${Date.now()}`,
        purchaseInvoiceId: pInv.id,
        purchaseInvoiceNo: pInv.invoiceNumber,
        purchaseDate: pInv.issueDate,
        supplierName: pInv.partyName || 'Tedarikçi Firma',
        supplierTaxNo: pInv.taxNumber || '1234567890',
        itemDescription: pInv.description || `${pInv.invoiceCategory || 'Gider'} Kalemi`,
        matchedQuantity: pInv.itemCount || 1,
        unitOfMeasure: 'm2',
        purchaseNetAmount: Math.round(net * 100) / 100,
        purchaseVatRate: 20,
        purchaseVatAmount: Math.round(vat * 100) / 100,
        allocatedIncurredVat: Math.round(allocated * 100) / 100,
        notes: 'Akıllı Otomatik Kalem Eşleme'
      });

      currentTotalVat += allocated;
    }

    setMatching(prev => ({
      ...prev,
      matchedItems: newMatchedList,
      totalIncurredVat: Math.round(currentTotalVat * 100) / 100
    }));

    setSuccessMessage(`⚡ Akıllı Eşleme Tamamlandı! ${newMatchedList.length} adet alış faturası kalem kalem yüklenilen KDV listesine dağıtıldı.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Export to Excel / GİB CSV format
  const handleDownloadGibCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF'; // UTF-8 BOM
    csvContent += 'Sira No;Alis Faturasinin Tarihi;Alis Faturasinin Serisi / Sira No;Saticinin Ad-Soyad / Unvani;Saticinin VKN / TCKN;Alinan Mal/Hizmetin Cinsi;Miktari;Birim;Alis Matrahi (TL);KDV Orani (%);Alis KDVsi (TL);Ihracata Yuklenilen KDV (TL);Aciklama\n';

    matching.matchedItems.forEach((item, index) => {
      const row = [
        index + 1,
        item.purchaseDate,
        item.purchaseInvoiceNo,
        `"${item.supplierName.replace(/"/g, '""')}"`,
        item.supplierTaxNo,
        `"${item.itemDescription.replace(/"/g, '""')}"`,
        item.matchedQuantity,
        item.unitOfMeasure,
        item.purchaseNetAmount.toFixed(2),
        item.purchaseVatRate,
        item.purchaseVatAmount.toFixed(2),
        item.allocatedIncurredVat.toFixed(2),
        `"${(item.notes || '').replace(/"/g, '""')}"`
      ].join(';');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GIB_Yuklenilen_KDV_Listesi_${exportInvoiceNo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const completionPercentage = Math.min(100, Math.round((matching.totalIncurredVat / (maxRefundableVat || 1)) * 100));

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-7xl w-full flex flex-col max-h-[92vh] overflow-hidden my-auto animate-fadeIn">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                  GİB Standart İhracat KDV İadesi
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {exportInvoiceNo}
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-0.5">
                Kalem Kalem Yüklenilen KDV Eşleme ve İade Cetveli
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('matching')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'matching'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Kalem Kalem Eşleme Paneli
            </button>
            <button
              onClick={() => setActiveTab('gib_list')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'gib_list'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>GİB Yüklenilen KDV Listesi ({matching.matchedItems.length})</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="bg-emerald-500 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between shrink-0 shadow-inner">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="hover:opacity-80">✕</button>
          </div>
        )}

        {/* Export Invoice Summary Bar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs shrink-0">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">İhracat Müşterisi</span>
            <span className="font-bold text-slate-800 truncate block">{customerName}</span>
          </div>

          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">İhracat Fatura Tarihi</span>
            <span className="font-mono text-slate-700 font-semibold">{exportInvoiceDate}</span>
          </div>

          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">İhracat Tutarı (FOB)</span>
            <span className="font-mono font-bold text-indigo-700">
              {exportNetAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {exportCurrency}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Azami İade KDV Limiti (%20)</span>
            <span className="font-mono font-extrabold text-emerald-700">
              ₺ {maxRefundableVat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">GÇB Beyanname No</span>
            <input
              type="text"
              value={matching.customsDeclarationNo || ''}
              onChange={(e) => setMatching({ ...matching, customsDeclarationNo: e.target.value })}
              placeholder="0619000000EX123"
              className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-mono font-bold text-slate-800 w-full focus:outline-indigo-500"
            />
          </div>
        </div>

        {/* Progress & KDV Allocation Status Bar */}
        <div className="bg-indigo-900 text-white px-6 py-3 border-b border-indigo-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div>
              <span className="text-[10px] text-indigo-300 uppercase font-bold block">Hesaplanan Yüklenilen KDV</span>
              <span className="text-base font-black font-mono text-emerald-300">
                ₺ {matching.totalIncurredVat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="h-8 w-px bg-indigo-700 hidden sm:block" />

            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-[11px] font-bold text-indigo-200 mb-1">
                <span>Eşleşme Tamamlanma Limiti</span>
                <span>%{completionPercentage}</span>
              </div>
              <div className="w-full bg-indigo-950 rounded-full h-2.5 overflow-hidden border border-indigo-700">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    completionPercentage >= 100 
                      ? 'bg-emerald-400' 
                      : completionPercentage >= 50 
                      ? 'bg-amber-400' 
                      : 'bg-indigo-400'
                  }`}
                  style={{ width: `${Math.min(100, completionPercentage)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAutoAllocateIncurredVat}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Sistemdeki alış faturalarını iplik/dokuma/gider oranlarına göre otomatik eşler"
            >
              <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
              <span>Akıllı Otomatik Kalem Eşle</span>
            </button>

            <button
              onClick={handleAddManualMatchLine}
              className="bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs px-3 py-2 rounded-xl border border-indigo-500/40 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manuel Kalem Ekle</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
          {activeTab === 'matching' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Available Purchase Invoices (Gelen Alış Faturaları) */}
              <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>1. Alış & Fason Üretim Faturaları ({filteredPurchases.length})</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">Eşlemek için tıklayın</span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Tedarikçi firma, fatura no veya malzeme ara..."
                    value={purchaseSearchTerm}
                    onChange={(e) => setPurchaseSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-indigo-500 text-slate-800"
                  />
                </div>

                {/* Purchase List Container */}
                <div className="flex-1 min-h-[360px] max-h-[500px] overflow-y-auto space-y-2 pr-1">
                  {filteredPurchases.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      Aramaya uygun alış faturası bulunamadı.
                    </div>
                  ) : (
                    filteredPurchases.map((pInv) => {
                      const isAlreadyMatched = matching.matchedItems.some(m => m.purchaseInvoiceNo === pInv.invoiceNumber);
                      const net = pInv.netAmount || (pInv.totalAmount / 1.20);
                      const vat = pInv.vatAmount || (pInv.totalAmount - net);

                      return (
                        <div
                          key={pInv.id}
                          className={`p-3 rounded-xl border transition-all text-xs flex items-center justify-between gap-2 ${
                            isAlreadyMatched
                              ? 'bg-emerald-50/60 border-emerald-200 opacity-80'
                              : 'bg-white hover:bg-indigo-50/50 border-slate-200 hover:border-indigo-300 shadow-2xs'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="font-bold text-slate-800 truncate">{pInv.partyName || 'Tedarikçi Firma'}</div>
                            <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2">
                              <span>No: {pInv.invoiceNumber}</span>
                              <span>•</span>
                              <span>{pInv.issueDate}</span>
                            </div>
                            <div className="text-[10px] text-indigo-600 font-semibold truncate">
                              Matrah: ₺{net.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} | KDV: ₺{vat.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddPurchaseToMatch(pInv)}
                            disabled={isAlreadyMatched}
                            className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                              isAlreadyMatched
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                            }`}
                          >
                            {isAlreadyMatched ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Eşlendi</span>
                              </>
                            ) : (
                              <>
                                <span>Eşle</span>
                                <ArrowRight className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Matched Incurred VAT Table (Yüklenilen KDV Listesi) */}
              <div className="lg:col-span-7 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>2. Bu İhracata Yüklenilen KDV Kalemleri ({matching.matchedItems.length})</span>
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold">
                    Toplam Yüklenilen: ₺{matching.totalIncurredVat.toLocaleString('tr-TR')}
                  </span>
                </div>

                {/* Table of Matched Items */}
                <div className="overflow-x-auto min-h-[360px] max-h-[500px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                        <th className="p-2">#</th>
                        <th className="p-2">Tedarikçi / Fatura</th>
                        <th className="p-2">Mal/Hizmet Cinsi</th>
                        <th className="p-2">Alış Matrahı</th>
                        <th className="p-2">Yüklenilen KDV (₺)</th>
                        <th className="p-2 text-center">Sil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {matching.matchedItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-16 text-slate-400">
                            <Calculator className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                            Henüz bu ihracat faturasına yüklenilen KDV faturası eşlenmedi.
                            <br />
                            Sol taraftaki listeden tıklayarak veya <b>"Akıllı Otomatik Kalem Eşle"</b> butonuna basarak ekleyebilirsiniz.
                          </td>
                        </tr>
                      ) : (
                        matching.matchedItems.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-2 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                            
                            <td className="p-2 max-w-[150px]">
                              <input
                                type="text"
                                value={item.supplierName}
                                onChange={(e) => handleUpdateMatchedItem(item.id, 'supplierName', e.target.value)}
                                className="font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-300 w-full focus:outline-none focus:border-indigo-500 text-xs"
                              />
                              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                                <input
                                  type="text"
                                  value={item.purchaseInvoiceNo}
                                  onChange={(e) => handleUpdateMatchedItem(item.id, 'purchaseInvoiceNo', e.target.value)}
                                  className="bg-transparent border-b border-dashed border-slate-200 focus:outline-none text-[10px]"
                                />
                                <span>({item.purchaseDate})</span>
                              </div>
                            </td>

                            <td className="p-2">
                              <input
                                type="text"
                                value={item.itemDescription}
                                onChange={(e) => handleUpdateMatchedItem(item.id, 'itemDescription', e.target.value)}
                                className="text-xs text-slate-700 bg-transparent border-b border-dashed border-slate-300 w-full focus:outline-none focus:border-indigo-500"
                              />
                            </td>

                            <td className="p-2">
                              <div className="flex items-center gap-1 font-mono text-slate-700">
                                <span>₺</span>
                                <input
                                  type="number"
                                  value={item.purchaseNetAmount}
                                  onChange={(e) => handleUpdateMatchedItem(item.id, 'purchaseNetAmount', parseFloat(e.target.value) || 0)}
                                  className="w-20 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs font-mono font-bold focus:outline-indigo-500"
                                />
                              </div>
                            </td>

                            <td className="p-2">
                              <div className="flex items-center gap-1 font-mono">
                                <span className="font-bold text-emerald-700">₺</span>
                                <input
                                  type="number"
                                  value={item.allocatedIncurredVat}
                                  onChange={(e) => handleUpdateMatchedItem(item.id, 'allocatedIncurredVat', parseFloat(e.target.value) || 0)}
                                  className="w-24 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded px-1.5 py-0.5 text-xs font-mono font-extrabold focus:outline-emerald-600"
                                />
                              </div>
                            </td>

                            <td className="p-2 text-center">
                              <button
                                onClick={() => handleRemoveMatchedItem(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Kalemi Kalem Eşlemesinden Çıkar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Official GİB Yüklenilen KDV Listesi Preview Table */
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <span>Gelir İdaresi Başkanlığı (GİB) Standart Yüklenilen KDV Listesi Cetveli</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    İhracat KDV İade dosyasında vergi dairesine ve yeminli mali müşavire (YMM) verilecek resmi format.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadGibCsv}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>GİB Uyumlu Excel / CSV İndir</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Yazdır / PDF</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border border-slate-300 text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase border-b border-slate-300 text-[10px]">
                      <th className="p-2 border border-slate-300 text-center">Sıra No</th>
                      <th className="p-2 border border-slate-300">Alış Fatura Tarihi</th>
                      <th className="p-2 border border-slate-300">Fatura Seri / Sıra No</th>
                      <th className="p-2 border border-slate-300">Satıcının Adı Unvanı</th>
                      <th className="p-2 border border-slate-300">Satıcının VKN / TCKN</th>
                      <th className="p-2 border border-slate-300">Alınan Mal / Hizmetin Cinsi</th>
                      <th className="p-2 border border-slate-300 text-center">Miktarı</th>
                      <th className="p-2 border border-slate-300 text-right">Alış Matrahi (₺)</th>
                      <th className="p-2 border border-slate-300 text-center">KDV %</th>
                      <th className="p-2 border border-slate-300 text-right">Alış KDVsi (₺)</th>
                      <th className="p-2 border border-slate-300 text-right bg-emerald-50 text-emerald-900 font-black">İhracata Yüklenilen KDV (₺)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {matching.matchedItems.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center py-10 text-slate-400">
                          Listenize eklenmiş kalem bulunmamaktadır.
                        </td>
                      </tr>
                    ) : (
                      matching.matchedItems.map((item, i) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-2 border border-slate-200 text-center font-mono font-bold">{i + 1}</td>
                          <td className="p-2 border border-slate-200 font-mono">{item.purchaseDate}</td>
                          <td className="p-2 border border-slate-200 font-mono font-semibold text-slate-800">{item.purchaseInvoiceNo}</td>
                          <td className="p-2 border border-slate-200 font-bold text-slate-800">{item.supplierName}</td>
                          <td className="p-2 border border-slate-200 font-mono text-slate-600">{item.supplierTaxNo}</td>
                          <td className="p-2 border border-slate-200 text-slate-700">{item.itemDescription}</td>
                          <td className="p-2 border border-slate-200 text-center font-mono">{item.matchedQuantity} {item.unitOfMeasure}</td>
                          <td className="p-2 border border-slate-200 text-right font-mono">₺{item.purchaseNetAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 border border-slate-200 text-center font-mono">%{item.purchaseVatRate}</td>
                          <td className="p-2 border border-slate-200 text-right font-mono">₺{item.purchaseVatAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 border border-slate-200 text-right font-mono font-extrabold text-emerald-800 bg-emerald-50/50">₺{item.allocatedIncurredVat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-extrabold text-xs">
                      <td colSpan={7} className="p-3 border border-slate-800 text-right">GENEL TOPLAM:</td>
                      <td className="p-3 border border-slate-800 text-right font-mono">
                        ₺{matching.matchedItems.reduce((s, i) => s + i.purchaseNetAmount, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 border border-slate-800 text-center">-</td>
                      <td className="p-3 border border-slate-800 text-right font-mono">
                        ₺{matching.matchedItems.reduce((s, i) => s + i.purchaseVatAmount, 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 border border-slate-800 text-right font-mono text-emerald-300 text-sm">
                        ₺{matching.totalIncurredVat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>KDV İadesi Vergi Usul Kanunu (VUK) & KDV Genel Uygulama Tebliği ilkelerine tam uyumludur.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              Kapat
            </button>
            <button
              type="button"
              onClick={() => {
                onSaveMatching(matching);
                setSuccessMessage('KDV İade Eşleme Cetveli başarıyla kaydedildi!');
                setTimeout(() => onClose(), 800);
              }}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all cursor-pointer active:scale-95"
            >
              KDV Eşleme Kaydını Tamamla & Sakla
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
