import React, { useState } from 'react';
import { ScannedBarcodeItem, CarpetProduct } from '../../types';
import { exportScannedBarcodesToExcel, exportScannedBarcodesToCSV, calculateM2FromDimensions } from '../../utils/excelExport';
import {
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  Search,
  Check,
  AlertCircle,
  Copy,
  ScanBarcode,
  Layers,
  Sparkles,
  Printer,
  Edit2,
  RefreshCw,
  SlidersHorizontal,
  Table,
  PieChart,
  ArrowUpDown
} from 'lucide-react';

interface ScannedBarcodeExcelSectionProps {
  scannedItems: ScannedBarcodeItem[];
  onUpdateScannedItems: (items: ScannedBarcodeItem[]) => void;
  products: CarpetProduct[];
  currentUser?: { username: string; name: string; role: string; token: string } | null;
  onScanDirect?: (barcode: string) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  isCompact?: boolean;
}

export const ScannedBarcodeExcelSection: React.FC<ScannedBarcodeExcelSectionProps> = ({
  scannedItems,
  onUpdateScannedItems,
  products,
  currentUser,
  showToast,
  isCompact = false,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'detailed' | 'summary'>('detailed');
  const [quickBarcodeInput, setQuickBarcodeInput] = useState<string>('');
  const [quickPieceInput, setQuickPieceInput] = useState<string>('1');
  const [isBatchPasteModalOpen, setIsBatchPasteModalOpen] = useState<boolean>(false);
  const [batchPasteText, setBatchPasteText] = useState<string>('');
  const [isManualAddModalOpen, setIsManualAddModalOpen] = useState<boolean>(false);

  // Manual Add Form States
  const [manualBarcode, setManualBarcode] = useState<string>('');
  const [manualPatternCode, setManualPatternCode] = useState<string>('DSN-101');
  const [manualCollection, setManualCollection] = useState<string>('Bambu İpek Koleksiyonu');
  const [manualProdName, setManualProdName] = useState<string>('Royal Bambu İpek Halı');
  const [manualDimensions, setManualDimensions] = useState<string>('200x300 cm');
  const [manualQuantity, setManualQuantity] = useState<string>('1');
  const [manualUnitPrice, setManualUnitPrice] = useState<string>('1250');
  const [manualNotes, setManualNotes] = useState<string>('Ambar Sayımı');

  // Inline Editing
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('1');
  const [editDimensions, setEditDimensions] = useState<string>('200x300 cm');
  const [editPatternCode, setEditPatternCode] = useState<string>('');

  // Calculations
  const totalItemCount = scannedItems.length;
  const totalPieceQuantity = scannedItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalSquareMeters = Math.round(
    scannedItems.reduce((sum, item) => sum + (Number(item.totalM2) || (item.quantity * item.unitM2) || 0), 0) * 100
  ) / 100;
  
  // Unique pattern count
  const uniquePatterns = new Set(scannedItems.map((item) => item.patternCode.trim().toUpperCase())).size;

  // Filtered List
  const filteredItems = scannedItems.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (item.barcode && item.barcode.toLowerCase().includes(q)) ||
      (item.patternCode && item.patternCode.toLowerCase().includes(q)) ||
      (item.productName && item.productName.toLowerCase().includes(q)) ||
      (item.collectionName && item.collectionName.toLowerCase().includes(q)) ||
      (item.dimensions && item.dimensions.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  });

  // Handle Quick Scan Input from Barcode Gun
  const handleQuickScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const barcodeVal = quickBarcodeInput.trim();
    if (!barcodeVal) {
      showToast('error', 'Lütfen okutulacak bir barkod veya desen kodu giriniz.');
      return;
    }

    const piecesToAdd = Math.max(1, parseInt(quickPieceInput, 10) || 1);

    // Look up product in catalog
    const matchedProduct = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === barcodeVal.toLowerCase()) ||
        p.code.toLowerCase() === barcodeVal.toLowerCase() ||
        (p.patternCode && p.patternCode.toLowerCase() === barcodeVal.toLowerCase()) ||
        p.id.toLowerCase() === barcodeVal.toLowerCase()
    );

    const now = new Date();
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('tr-TR');
    const timestamp = `${dateStr} ${timeStr}`;

    // Check if item already exists in scanned list
    const existingIndex = scannedItems.findIndex(
      (it) => it.barcode.toLowerCase() === barcodeVal.toLowerCase() || (matchedProduct && it.productCode === matchedProduct.code)
    );

    if (existingIndex !== -1) {
      // Update existing row
      const updated = [...scannedItems];
      const existing = updated[existingIndex];
      const newQty = existing.quantity + piecesToAdd;
      const newTotalM2 = Math.round(newQty * existing.unitM2 * 100) / 100;
      const newTotalPrice = existing.unitPrice ? Math.round(newQty * existing.unitPrice * 100) / 100 : undefined;

      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        totalM2: newTotalM2,
        totalPrice: newTotalPrice,
        scannedAt: timestamp,
      };

      onUpdateScannedItems(updated);
      showToast('success', `"${existing.productName}" adedi güncellendi (+${piecesToAdd} adet). Toplam: ${newQty} Adet / ${newTotalM2} m²`);
    } else {
      // Add new scanned item
      const dims = matchedProduct?.dimensions || '200x300 cm';
      const uM2 = calculateM2FromDimensions(dims);
      const totM2 = Math.round(piecesToAdd * uM2 * 100) / 100;
      const uPrice = matchedProduct?.pricePerM2 || matchedProduct?.purchasePrice || 1250;

      const newItem: ScannedBarcodeItem = {
        id: `scan-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        barcode: matchedProduct?.barcode || barcodeVal,
        patternCode: matchedProduct?.patternCode || matchedProduct?.code || `DSN-${barcodeVal.slice(-4)}`,
        collectionName: matchedProduct?.collectionName || matchedProduct?.category || 'Bambu İpek Koleksiyonu',
        productName: matchedProduct?.name || `Halı (${barcodeVal})`,
        productCode: matchedProduct?.code || `PC-${barcodeVal.slice(-4)}`,
        dimensions: dims,
        unitM2: uM2,
        quantity: piecesToAdd,
        totalM2: totM2,
        unitPrice: uPrice,
        currency: (matchedProduct?.salesCurrency as any) || 'TL',
        totalPrice: Math.round(piecesToAdd * uPrice * 100) / 100,
        scannedAt: timestamp,
        operator: currentUser?.name || 'Kadir Korkmaz',
        actionType: 'sayim',
        notes: matchedProduct ? 'Katalog Eşleşmesi' : 'Elle / Hızlı Okutma',
      };

      onUpdateScannedItems([newItem, ...scannedItems]);
      showToast('success', `Yeni barkod eklendi: "${newItem.patternCode}" (${piecesToAdd} Adet, ${totM2} m²)`);
    }

    setQuickBarcodeInput('');
    setQuickPieceInput('1');
  };

  // Adjust Item Quantity (+ / -)
  const handleAdjustQuantity = (id: string, delta: number) => {
    const updated = scannedItems.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        const newTotalM2 = Math.round(newQty * item.unitM2 * 100) / 100;
        const newTotalPrice = item.unitPrice ? Math.round(newQty * item.unitPrice * 100) / 100 : undefined;
        return {
          ...item,
          quantity: newQty,
          totalM2: newTotalM2,
          totalPrice: newTotalPrice,
        };
      }
      return item;
    });
    onUpdateScannedItems(updated);
  };

  // Delete Single Item
  const handleDeleteItem = (id: string, title: string) => {
    if (window.confirm(`"${title}" barkod kaydını listeden silmek istediğinize emin misiniz?`)) {
      const updated = scannedItems.filter((it) => it.id !== id);
      onUpdateScannedItems(updated);
      showToast('info', 'Barkod kaydı listeden silindi.');
    }
  };

  // Clear Entire Scanned List
  const handleClearAll = () => {
    if (scannedItems.length === 0) return;
    if (window.confirm(`Listede bulunan tüm ${scannedItems.length} adet barkod kaydı silinecektir. Emin misiniz?`)) {
      onUpdateScannedItems([]);
      showToast('info', 'Okutulan barkod listesi temizlendi. Yeni sayım başlatabilirsiniz.');
    }
  };

  // Save Inline Edit
  const handleSaveInlineEdit = (id: string) => {
    const qty = Math.max(1, parseInt(editQuantity, 10) || 1);
    const uM2 = calculateM2FromDimensions(editDimensions);
    const totM2 = Math.round(qty * uM2 * 100) / 100;

    const updated = scannedItems.map((it) => {
      if (it.id === id) {
        return {
          ...it,
          quantity: qty,
          dimensions: editDimensions,
          patternCode: editPatternCode.trim() || it.patternCode,
          unitM2: uM2,
          totalM2: totM2,
          totalPrice: it.unitPrice ? Math.round(qty * it.unitPrice * 100) / 100 : undefined,
        };
      }
      return it;
    });

    onUpdateScannedItems(updated);
    setEditingItemId(null);
    showToast('success', 'Satır bilgileri ve m² hesaplaması güncellendi.');
  };

  // Handle Manual Add Modal Submit
  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Math.max(1, parseInt(manualQuantity, 10) || 1);
    const uM2 = calculateM2FromDimensions(manualDimensions);
    const totM2 = Math.round(qty * uM2 * 100) / 100;
    const uPrice = parseFloat(manualUnitPrice) || 0;
    const bc = manualBarcode.trim() || `86990${Math.floor(100000000 + Math.random() * 900000000)}`;

    const now = new Date();
    const timestamp = `${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR')}`;

    const newItem: ScannedBarcodeItem = {
      id: `scan-manual-${Date.now()}`,
      barcode: bc,
      patternCode: manualPatternCode.trim() || 'DSN-101',
      collectionName: manualCollection.trim() || 'Halı Koleksiyonu',
      productName: manualProdName.trim() || 'Özel Seri Halı',
      productCode: `PC-${manualPatternCode.trim() || '01'}`,
      dimensions: manualDimensions.trim() || '200x300 cm',
      unitM2: uM2,
      quantity: qty,
      totalM2: totM2,
      unitPrice: uPrice,
      currency: 'TL',
      totalPrice: Math.round(qty * uPrice * 100) / 100,
      scannedAt: timestamp,
      operator: currentUser?.name || 'Kadir Korkmaz',
      actionType: 'sayim',
      notes: manualNotes.trim() || 'Manuel Eklendi',
    };

    onUpdateScannedItems([newItem, ...scannedItems]);
    setIsManualAddModalOpen(false);
    showToast('success', `"${newItem.patternCode}" (${qty} adet, ${totM2} m²) listeye eklendi.`);
  };

  // Handle Batch Paste Submit
  const handleBatchPasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchPasteText.trim()) {
      showToast('error', 'Lütfen yapıştırılacak barkod veya desen listesi giriniz.');
      return;
    }

    const lines = batchPasteText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const now = new Date();
    const timestamp = `${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR')}`;

    const newItems: ScannedBarcodeItem[] = [];

    lines.forEach((line) => {
      // Split by tab, semicolon, comma or pipe
      const parts = line.split(/[\t;,|]+/).map((p) => p.trim());
      const rawCode = parts[0] || '';
      if (!rawCode) return;

      const rawQty = parts[1] ? parseInt(parts[1], 10) || 1 : 1;
      const rawDims = parts[2] || '200x300 cm';
      const rawPattern = parts[3] || rawCode;

      // Look up in products
      const matched = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === rawCode.toLowerCase()) ||
          p.code.toLowerCase() === rawCode.toLowerCase() ||
          (p.patternCode && p.patternCode.toLowerCase() === rawCode.toLowerCase())
      );

      const dims = matched?.dimensions || rawDims;
      const uM2 = calculateM2FromDimensions(dims);
      const totM2 = Math.round(rawQty * uM2 * 100) / 100;
      const uPrice = matched?.pricePerM2 || matched?.purchasePrice || 1250;

      newItems.push({
        id: `scan-batch-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        barcode: matched?.barcode || (rawCode.startsWith('869') ? rawCode : `86990${Math.floor(100000000 + Math.random() * 900000000)}`),
        patternCode: matched?.patternCode || matched?.code || rawPattern,
        collectionName: matched?.collectionName || matched?.category || 'Koleksiyon Halı',
        productName: matched?.name || `Halı ${rawPattern}`,
        productCode: matched?.code || `PC-${rawPattern}`,
        dimensions: dims,
        unitM2: uM2,
        quantity: rawQty,
        totalM2: totM2,
        unitPrice: uPrice,
        currency: 'TL',
        totalPrice: Math.round(rawQty * uPrice * 100) / 100,
        scannedAt: timestamp,
        operator: currentUser?.name || 'Kadir Korkmaz',
        actionType: 'sayim',
        notes: 'Toplu Yapıştırma İle Eklendi',
      });
    });

    if (newItems.length > 0) {
      onUpdateScannedItems([...newItems, ...scannedItems]);
      setIsBatchPasteModalOpen(false);
      setBatchPasteText('');
      showToast('success', `${newItems.length} kalem ürün listeye aktarıldı ve m² hesaplamaları tamamlandı!`);
    } else {
      showToast('error', 'Geçerli satır tespit edilemedi.');
    }
  };

  // Grouped Summary Data for Desen İcmali
  const patternSummary = React.useMemo(() => {
    const map: Record<string, {
      patternCode: string;
      collectionName: string;
      dimensions: string;
      unitM2: number;
      totalQty: number;
      totalM2: number;
      barcodes: string[];
    }> = {};

    scannedItems.forEach((it) => {
      const key = `${it.patternCode.trim().toUpperCase()}__${it.dimensions.trim()}`;
      if (!map[key]) {
        map[key] = {
          patternCode: it.patternCode.trim().toUpperCase(),
          collectionName: it.collectionName,
          dimensions: it.dimensions,
          unitM2: it.unitM2,
          totalQty: 0,
          totalM2: 0,
          barcodes: [],
        };
      }
      map[key].totalQty += it.quantity;
      map[key].totalM2 += it.totalM2;
      if (it.barcode && !map[key].barcodes.includes(it.barcode)) {
        map[key].barcodes.push(it.barcode);
      }
    });

    return Object.values(map);
  }, [scannedItems]);

  // Trigger Excel Export
  const handleExportExcel = () => {
    if (scannedItems.length === 0) {
      showToast('error', 'Dışa aktarılacak okutulmuş barkod bulunmuyor.');
      return;
    }
    const success = exportScannedBarcodesToExcel(scannedItems);
    if (success) {
      showToast('success', 'Excel tablosu (.xlsx) başarıyla hazırlandı ve indirildi!');
    } else {
      showToast('error', 'Excel oluşturulurken bir hata oluştu.');
    }
  };

  // Trigger CSV Export
  const handleExportCSV = () => {
    if (scannedItems.length === 0) {
      showToast('error', 'Dışa aktarılacak okutulmuş barkod bulunmuyor.');
      return;
    }
    const success = exportScannedBarcodesToCSV(scannedItems);
    if (success) {
      showToast('success', 'CSV dosyası indirildi.');
    } else {
      showToast('error', 'CSV oluşturulurken bir hata oluştu.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Metrics Summary Cards Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Okutulan Kalem
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-slate-900 font-mono">{totalItemCount}</span>
              <span className="text-xs font-bold text-slate-500">Çeşit Barkod</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <ScanBarcode className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Toplam Adet (Parça)
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-emerald-600 font-mono">{totalPieceQuantity}</span>
              <span className="text-xs font-bold text-emerald-700">Adet Halı</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Toplam Metrekare
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-blue-600 font-mono">{totalSquareMeters}</span>
              <span className="text-xs font-bold text-blue-700">m² Alan</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Table className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Farklı Desen Sayısı
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-purple-600 font-mono">{uniquePatterns}</span>
              <span className="text-xs font-bold text-purple-700">Desen Kodu</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <PieChart className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Header & Quick Scanning Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Okutulan Barkodlar, Adet & m² Excel Raporlama
              </h3>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                Canlı Liste
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Okuttuğunuz veya yapıştırdığınız tüm barkodların adet, m² ve desen kodları otomatik hesaplanır; 2 sekmeli profesyonel Excel (.xlsx) dosyası olarak anında indirilir.
            </p>
          </div>

          {/* Major Export Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportExcel}
              disabled={scannedItems.length === 0}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer ${
                scannedItems.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              title="Okutulan tüm barkodları ve desen icmalini Excel dosyası olarak indir"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>Excel İndir (.xlsx)</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={scannedItems.length === 0}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="CSV formatında indir"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => setIsBatchPasteModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-4 h-4 text-indigo-600" />
              <span>Toplu Barkod Yapıştır</span>
            </button>

            <button
              onClick={() => setIsManualAddModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-300" />
              <span>+ Elle Ekle</span>
            </button>

            <button
              onClick={handleClearAll}
              disabled={scannedItems.length === 0}
              className="px-3 py-2.5 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
              title="Listeyi Sıfırla"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Sıfırla</span>
            </button>
          </div>
        </div>

        {/* Quick Scan Input Box */}
        <form onSubmit={handleQuickScanSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <ScanBarcode className="w-5 h-5 text-emerald-600 absolute left-3 top-2.5" />
            <input
              type="text"
              value={quickBarcodeInput}
              onChange={(e) => setQuickBarcodeInput(e.target.value)}
              placeholder="Hızlı barkod okutun veya desen kodu girin (ör: 8699010020012 veya DSN-101)..."
              className="w-full bg-slate-50 border border-slate-300 font-mono font-bold text-xs pl-10 pr-4 py-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-slate-600">Adet:</span>
              <input
                type="number"
                min="1"
                step="1"
                value={quickPieceInput}
                onChange={(e) => setQuickPieceInput(e.target.value)}
                className="w-14 bg-white border border-slate-200 font-mono font-bold text-xs px-2 py-1 rounded text-center text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Listeye Ekle</span>
            </button>
          </div>
        </form>

        {/* View Switcher Tabs & Search Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('detailed')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'detailed'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-indigo-600" />
              <span>Barkod Detay Listesi ({filteredItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('summary')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'summary'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieChart className="w-3.5 h-3.5 text-purple-600" />
              <span>Desen & Ölçü İcmali ({patternSummary.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Desen, barkod, ölçü ile filtrele..."
              className="w-full bg-slate-50 border border-slate-200 font-bold text-xs pl-9 pr-4 py-2 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Main Table: Detailed Scanned Items View */}
      {viewMode === 'detailed' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <ScanBarcode className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">Okutulmuş Barkod Kaydı Bulunmuyor</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Yukarıdaki arama çubuğundan barkod okutabilir, toplu barkod yapıştırabilir veya "+ Elle Ekle" butonuyla satır oluşturabilirsiniz.
              </p>
              <button
                onClick={() => setIsManualAddModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>İlk Barkodu Elle Ekle</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800">
                    <th className="p-3.5 text-center w-12">#</th>
                    <th className="p-3.5">Barkod No (EAN-13)</th>
                    <th className="p-3.5">Desen Kodu</th>
                    <th className="p-3.5">Koleksiyon & Ürün Adı</th>
                    <th className="p-3.5">Ölçü / Ebat</th>
                    <th className="p-3.5 text-center">Adet (Parça)</th>
                    <th className="p-3.5 text-right">Birim m²</th>
                    <th className="p-3.5 text-right font-extrabold text-emerald-400">Toplam m²</th>
                    <th className="p-3.5 text-slate-300">Okutma Zamanı</th>
                    <th className="p-3.5 text-center w-24">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item, index) => {
                    const isEditing = editingItemId === item.id;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                        }`}
                      >
                        {/* Sıra */}
                        <td className="p-3.5 text-center font-mono font-bold text-slate-400">
                          {index + 1}
                        </td>

                        {/* Barkod No */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {item.barcode || '—'}
                            </span>
                            {item.barcode && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(item.barcode);
                                  showToast('info', 'Barkod kopyalandı.');
                                }}
                                className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                                title="Barkodu Kopyala"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Desen Kodu */}
                        <td className="p-3.5">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editPatternCode}
                              onChange={(e) => setEditPatternCode(e.target.value)}
                              className="w-24 bg-white border border-indigo-400 font-mono font-bold text-xs p-1 rounded"
                            />
                          ) : (
                            <span className="bg-indigo-50 text-indigo-700 font-mono font-extrabold px-2 py-0.5 rounded border border-indigo-200">
                              {item.patternCode}
                            </span>
                          )}
                        </td>

                        {/* Koleksiyon & Ürün Adı */}
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{item.productName}</div>
                          <div className="text-[10px] text-slate-500">{item.collectionName}</div>
                        </td>

                        {/* Ölçü / Ebat */}
                        <td className="p-3.5">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editDimensions}
                              onChange={(e) => setEditDimensions(e.target.value)}
                              className="w-28 bg-white border border-indigo-400 font-mono text-xs p-1 rounded"
                            />
                          ) : (
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              {item.dimensions}
                            </span>
                          )}
                        </td>

                        {/* Adet (Parça) */}
                        <td className="p-3.5 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              min="1"
                              value={editQuantity}
                              onChange={(e) => setEditQuantity(e.target.value)}
                              className="w-16 bg-white border border-indigo-400 font-mono font-bold text-xs p-1 rounded text-center"
                            />
                          ) : (
                            <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                              <button
                                onClick={() => handleAdjustQuantity(item.id, -1)}
                                className="w-5 h-5 rounded bg-white hover:bg-slate-200 font-bold text-slate-700 text-xs flex items-center justify-center cursor-pointer shadow-2xs"
                                title="1 Adet Azalt"
                              >
                                -
                              </button>
                              <span className="font-mono font-black text-xs text-slate-900 min-w-[20px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleAdjustQuantity(item.id, 1)}
                                className="w-5 h-5 rounded bg-white hover:bg-slate-200 font-bold text-slate-700 text-xs flex items-center justify-center cursor-pointer shadow-2xs"
                                title="1 Adet Artır"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Birim m² */}
                        <td className="p-3.5 text-right font-mono text-slate-600">
                          {item.unitM2} m²
                        </td>

                        {/* Toplam m² */}
                        <td className="p-3.5 text-right">
                          <span className="font-mono font-black text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                            {item.totalM2} m²
                          </span>
                        </td>

                        {/* Okutma Zamanı */}
                        <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                          {item.scannedAt}
                        </td>

                        {/* İşlem Butonları */}
                        <td className="p-3.5 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleSaveInlineEdit(item.id)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-lg cursor-pointer"
                                title="Kaydet"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingItemId(null)}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-1.5 rounded-lg cursor-pointer"
                                title="İptal"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingItemId(item.id);
                                  setEditQuantity(String(item.quantity));
                                  setEditDimensions(item.dimensions);
                                  setEditPatternCode(item.patternCode);
                                }}
                                className="text-slate-400 hover:text-indigo-600 p-1 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                                title="Düzenle"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id, item.productName)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Footer Genel Toplam Satırı */}
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-700">
                    <td colSpan={5} className="p-3.5 text-right font-extrabold uppercase tracking-wider text-amber-300">
                      GENEL TOPLAM ({filteredItems.length} Kalem):
                    </td>
                    <td className="p-3.5 text-center font-mono font-black text-amber-300 text-sm">
                      {totalPieceQuantity} Adet
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-300">
                      —
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-emerald-400 text-sm">
                      {totalSquareMeters} m²
                    </td>
                    <td colSpan={2} className="p-3.5 text-right">
                      <button
                        onClick={handleExportExcel}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Excel İndir</span>
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Summary Table: Grouped by Pattern Code & Dimensions */}
      {viewMode === 'summary' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-600" />
                Desen Kodu ve Ölçüye Göre İcmal Özeti
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Aynı desene ve ölçüye sahip okutulmuş tüm halıların toplanmış adet ve m² dökümü
              </p>
            </div>
            <button
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>İcmali Excel Olarak İndir</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-semibold">
                  <th className="p-3.5 text-center w-12">#</th>
                  <th className="p-3.5">Desen Kodu</th>
                  <th className="p-3.5">Koleksiyon</th>
                  <th className="p-3.5">Ölçü / Ebat</th>
                  <th className="p-3.5 text-right">Birim m²</th>
                  <th className="p-3.5 text-center font-bold text-amber-300">Toplam Adet</th>
                  <th className="p-3.5 text-right font-black text-emerald-400">Toplam m²</th>
                  <th className="p-3.5">İlişkili Barkodlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patternSummary.map((grp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                    <td className="p-3.5 font-mono font-black text-indigo-700">
                      <span className="bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                        {grp.patternCode}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">{grp.collectionName}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-700">{grp.dimensions}</td>
                    <td className="p-3.5 text-right font-mono text-slate-600">{grp.unitM2} m²</td>
                    <td className="p-3.5 text-center font-mono font-black text-slate-900 bg-amber-50/50">
                      {grp.totalQty} Adet
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-emerald-600 bg-emerald-50/50">
                      {Math.round(grp.totalM2 * 100) / 100} m²
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">
                      {grp.barcodes.join(', ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold text-xs">
                  <td colSpan={5} className="p-3.5 text-right font-extrabold uppercase text-amber-300">
                    İCMAL GENEL TOPLAMI:
                  </td>
                  <td className="p-3.5 text-center font-mono font-black text-amber-300 text-sm">
                    {totalPieceQuantity} Adet
                  </td>
                  <td className="p-3.5 text-right font-mono font-black text-emerald-400 text-sm">
                    {totalSquareMeters} m²
                  </td>
                  <td className="p-3.5 text-slate-400 text-right">
                    {patternSummary.length} Farklı Desen
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Batch Paste Barcode & Pattern Lines */}
      {isBatchPasteModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Copy className="w-5 h-5 text-indigo-600" />
                Toplu Barkod / Desen Yapıştır & Excel Listesi Oluştur
              </h3>
              <button
                onClick={() => setIsBatchPasteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Elinizdeki barkod numaralarını, ürün kodlarını veya desen listesini alt alta yapıştırın. Sistem otomatik olarak ürünleri katalogla eşleştirip adet ve m² değerlerini hesaplayacaktır.
            </p>

            <form onSubmit={handleBatchPasteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Barkod / Desen Satırları (Her satıra bir adet veya "Barkod, Adet, Ölçü"):
                </label>
                <textarea
                  rows={8}
                  value={batchPasteText}
                  onChange={(e) => setBatchPasteText(e.target.value)}
                  placeholder={`8699010020012
8699010020029	2	160x230 cm
DSN-101	5	200x300 cm
PC-SILK-01	3	200x300 cm`}
                  className="w-full bg-slate-50 border border-slate-300 font-mono text-xs p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 leading-relaxed"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBatchPasteModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Satırları İçe Aktar & Hesapla</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Manual Add Single Item */}
      {isManualAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Listeye Elle Barkod & Desen Kaydı Ekle
              </h3>
              <button
                onClick={() => setIsManualAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualAddSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Barkod No (EAN-13):</label>
                  <input
                    type="text"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder="86990..."
                    className="w-full bg-slate-50 border border-slate-300 font-mono font-bold text-xs p-2 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Desen Kodu:</label>
                  <input
                    type="text"
                    value={manualPatternCode}
                    onChange={(e) => setManualPatternCode(e.target.value)}
                    placeholder="ör: DSN-101"
                    className="w-full bg-slate-50 border border-slate-300 font-mono font-bold text-xs p-2 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Koleksiyon Adı:</label>
                  <input
                    type="text"
                    value={manualCollection}
                    onChange={(e) => setManualCollection(e.target.value)}
                    placeholder="Bambu İpek Koleksiyonu"
                    className="w-full bg-slate-50 border border-slate-300 text-xs font-bold p-2 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ürün Adı:</label>
                  <input
                    type="text"
                    value={manualProdName}
                    onChange={(e) => setManualProdName(e.target.value)}
                    placeholder="Royal Bambu İpek Halı"
                    className="w-full bg-slate-50 border border-slate-300 text-xs font-bold p-2 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ölçü / Ebat:</label>
                  <select
                    value={manualDimensions}
                    onChange={(e) => setManualDimensions(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 font-mono text-xs font-bold p-2 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="200x300 cm">200x300 cm (6.00 m²)</option>
                    <option value="160x230 cm">160x230 cm (3.68 m²)</option>
                    <option value="120x180 cm">120x180 cm (2.16 m²)</option>
                    <option value="80x300 cm">80x300 cm (2.40 m²)</option>
                    <option value="80x150 cm">80x150 cm (1.20 m²)</option>
                    <option value="300x400 cm">300x400 cm (12.00 m²)</option>
                    <option value="100x200 cm">100x200 cm (2.00 m²)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Adet (Parça):</label>
                  <input
                    type="number"
                    min="1"
                    value={manualQuantity}
                    onChange={(e) => setManualQuantity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 font-mono font-bold text-xs p-2 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 text-center"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Birim Fiyat (₺):</label>
                  <input
                    type="number"
                    value={manualUnitPrice}
                    onChange={(e) => setManualUnitPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 font-mono font-bold text-xs p-2 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Açıklama / Not:</label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Ambar sayımı, parti no vb."
                  className="w-full bg-slate-50 border border-slate-300 text-xs p-2 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsManualAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Listeye Ekle</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
