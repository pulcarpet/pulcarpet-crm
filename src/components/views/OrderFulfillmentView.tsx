import React, { useState, useEffect, useRef } from 'react';
import { 
  OrderFulfillmentReport, 
  OrderFulfillmentItem, 
  OrderScanLogItem,
  CarpetProduct,
  Order
} from '../../types';
import { INITIAL_FULFILLMENT_REPORT, playScanAudio } from '../../data/orderFulfillmentData';
import { 
  ScanBarcode, 
  Search, 
  Plus, 
  Printer, 
  History, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Camera, 
  Volume2, 
  VolumeX, 
  Tag, 
  ArrowUpRight, 
  ArrowDownLeft, 
  X,
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  RotateCcw, 
  Layers, 
  Package, 
  Filter, 
  Building2, 
  FileText, 
  ShieldAlert, 
  ChevronRight,
  Boxes,
  Percent,
  TrendingUp,
  Eye,
  SlidersHorizontal,
  FileCheck2
} from 'lucide-react';

interface OrderFulfillmentViewProps {
  products: CarpetProduct[];
  orders: Order[];
  onUpdateProducts?: (products: CarpetProduct[]) => void;
  currentUser?: { username: string; name: string; role: string; token: string } | null;
}

export const OrderFulfillmentView: React.FC<OrderFulfillmentViewProps> = ({
  products,
  orders,
  onUpdateProducts,
  currentUser,
}) => {
  // Main State for Fulfillment Reports
  const [reports, setReports] = useState<OrderFulfillmentReport[]>(() => {
    const saved = localStorage.getItem('pulcarpet_fulfillment_reports');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If saved has old foreign data (PUTI-11.08.2026 or ANKYRA), reset to clean PulCarpet template
          const hasOldForeignData = parsed.some((r: any) => 
            r?.id?.includes('PUTI') || 
            r?.orderNumber?.includes('PUTI-11.08.2026') || 
            r?.productGroup?.includes('Ankyra')
          );
          if (!hasOldForeignData) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Error parsing saved reports', e);
      }
    }
    return [INITIAL_FULFILLMENT_REPORT];
  });

  const [activeReportId, setActiveReportId] = useState<string>(reports[0]?.id || INITIAL_FULFILLMENT_REPORT.id);
  const currentReport = reports.find(r => r.id === activeReportId) || reports[0] || INITIAL_FULFILLMENT_REPORT;

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCollectionFilter, setSelectedCollectionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Bekliyor' | 'Eksik' | 'Tamam' | 'Fazla'>('all');

  // Barcode Scanner State
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lastScanResult, setLastScanResult] = useState<{
    status: 'success' | 'warning' | 'error';
    title: string;
    message: string;
    item?: OrderFulfillmentItem;
    time: string;
  } | null>(null);

  // Modals
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState<boolean>(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [excessConfirmItem, setExcessConfirmItem] = useState<{ item: OrderFulfillmentItem; barcode: string } | null>(null);

  // Excel / CSV Text Paste Input
  const [excelPasteText, setExcelPasteText] = useState<string>('');
  const [importOrderNo, setImportOrderNo] = useState<string>(`SIP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [importBrand, setImportBrand] = useState<string>('PulCarpet Müşteri');
  const [importEdgeFinish, setImportEdgeFinish] = useState<string>('Overlok & Saçak');
  const [importTolerance, setImportTolerance] = useState<string>('±%5');

  // Ref for continuous USB/Bluetooth scanner input
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastScannedBarcodeRef = useRef<string>('');

  // Save to LocalStorage whenever reports change
  useEffect(() => {
    localStorage.setItem('pulcarpet_fulfillment_reports', JSON.stringify(reports));
  }, [reports]);

  // Recalculate metrics for a report
  const recalculateReport = (report: OrderFulfillmentReport): OrderFulfillmentReport => {
    let totalOrderQty = 0;
    let totalOrderSqm = 0;
    let totalScannedQty = 0;
    let totalScannedSqm = 0;
    let excessQty = 0;
    let missingQty = 0;

    const updatedItems = report.items.map(item => {
      const orderQty = Number(item.orderQuantity) || 0;
      const scannedQty = Number(item.scannedQuantity) || 0;
      
      // Calculate unit area in m2
      let unitSqm = 0;
      if (item.dimensions) {
        const parts = item.dimensions.toLowerCase().replace('cm', '').split('x');
        if (parts.length === 2) {
          const w = parseFloat(parts[0]) || 0;
          const l = parseFloat(parts[1]) || 0;
          unitSqm = (w * l) / 10000;
        }
      }
      if (!unitSqm && orderQty > 0) {
        unitSqm = (item.orderSqm || 0) / orderQty;
      }

      const orderSqm = Number((orderQty * unitSqm).toFixed(2));
      const scannedSqm = Number((scannedQty * unitSqm).toFixed(2));
      
      let remainingQty = 0;
      let remainingSqm = 0;
      let excessItemQty = 0;
      let excessItemSqm = 0;
      let diffPercent = 0;
      let status: 'Bekliyor' | 'Eksik' | 'Tamam' | 'Fazla' = 'Bekliyor';

      if (scannedQty === 0) {
        remainingQty = orderQty;
        remainingSqm = orderSqm;
        diffPercent = -100;
        status = 'Bekliyor';
      } else if (scannedQty < orderQty) {
        remainingQty = orderQty - scannedQty;
        remainingSqm = Number((remainingQty * unitSqm).toFixed(2));
        diffPercent = Number((((scannedQty - orderQty) / orderQty) * 100).toFixed(2));
        status = 'Eksik';
      } else if (scannedQty === orderQty) {
        remainingQty = 0;
        remainingSqm = 0;
        diffPercent = 0;
        status = 'Tamam';
      } else {
        // Scanned > Order
        excessItemQty = scannedQty - orderQty;
        excessItemSqm = Number((excessItemQty * unitSqm).toFixed(2));
        diffPercent = Number((((scannedQty - orderQty) / orderQty) * 100).toFixed(2));
        status = 'Fazla';
      }

      totalOrderQty += orderQty;
      totalOrderSqm += orderSqm;
      totalScannedQty += scannedQty;
      totalScannedSqm += scannedSqm;
      if (excessItemQty > 0) excessQty += excessItemQty;
      if (remainingQty > 0) missingQty += remainingQty;

      return {
        ...item,
        orderSqm,
        scannedSqm,
        remainingQuantity: remainingQty,
        remainingSqm,
        excessQuantity: excessItemQty,
        excessSqm: excessItemSqm,
        differencePercent: diffPercent,
        status
      };
    });

    const completionPercent = totalOrderSqm > 0 ? Math.min(100, Math.round((totalScannedSqm / totalOrderSqm) * 100)) : 0;
    const remainingSqm = Number(Math.max(0, totalOrderSqm - totalScannedSqm).toFixed(2));

    return {
      ...report,
      items: updatedItems,
      totalSkuCount: updatedItems.length,
      totalOrderQuantity: totalOrderQty,
      totalOrderSqm: Number(totalOrderSqm.toFixed(2)),
      totalScannedQuantity: totalScannedQty,
      totalScannedSqm: Number(totalScannedSqm.toFixed(2)),
      completionPercent,
      remainingSqm,
      missingCount: -missingQty,
      excessCount: excessQty,
      updatedAt: new Date().toISOString()
    };
  };

  // Group Collection Summaries for the top cards (PDF Header format)
  const collectionSummaries = React.useMemo(() => {
    const map: { [key: string]: { totalOrderQty: number; totalOrderSqm: number; scannedQty: number; scannedSqm: number; count: number } } = {};
    
    currentReport.items.forEach(item => {
      const col = item.collectionName || 'DİĞER';
      if (!map[col]) {
        map[col] = { totalOrderQty: 0, totalOrderSqm: 0, scannedQty: 0, scannedSqm: 0, count: 0 };
      }
      map[col].totalOrderQty += item.orderQuantity;
      map[col].totalOrderSqm += item.orderSqm;
      map[col].scannedQty += item.scannedQuantity;
      map[col].scannedSqm += item.scannedSqm;
      map[col].count += 1;
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      totalOrderQty: data.totalOrderQty,
      totalOrderSqm: Number(data.totalOrderSqm.toFixed(2)),
      scannedQty: data.scannedQty,
      scannedSqm: Number(data.scannedSqm.toFixed(2)),
      count: data.count,
      percent: data.totalOrderSqm > 0 ? Math.round((data.scannedSqm / data.totalOrderSqm) * 100) : 0
    })).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [currentReport]);

  // Zero-Error (Poka-Yoke) Scan Handler
  const handleScanProcess = (rawCode: string, forceExcess: boolean = false) => {
    const code = rawCode.trim();
    if (!code) return;

    const now = Date.now();
    // Double scan guard (1.5 sec debounce on same barcode)
    if (!forceExcess && code === lastScannedBarcodeRef.current && (now - lastScanTimeRef.current) < 1200) {
      if (soundEnabled) playScanAudio(false);
      setLastScanResult({
        status: 'warning',
        title: 'Çift Okuma Engellendi',
        message: `"${code}" barkodu çok hızlı tekrar okutuldu. Yanlışlıkla çift düşüm engellendi.`,
        time: new Date().toLocaleTimeString('tr-TR')
      });
      setBarcodeInput('');
      return;
    }

    lastScanTimeRef.current = now;
    lastScannedBarcodeRef.current = code;

    // Search item in current report by Barcode, Pattern Code, or exact SKU Name
    const matchingItem = currentReport.items.find(it => 
      (it.barcode && it.barcode.toLowerCase() === code.toLowerCase()) ||
      (it.skuName && it.skuName.toLowerCase().includes(code.toLowerCase())) ||
      (it.patternCode && it.patternCode.toLowerCase() === code.toLowerCase())
    );

    const operatorName = currentUser ? currentUser.name : 'Kadir KORKMAZ';

    // 1. ERROR: Product Not In Order
    if (!matchingItem) {
      if (soundEnabled) playScanAudio(false);
      
      const newLog: OrderScanLogItem = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toLocaleString('tr-TR'),
        barcode: code,
        skuName: 'Bilinmeyen / Siparişte Yok',
        collectionName: '-',
        dimensions: '-',
        action: 'scan_error_unknown',
        quantityDelta: 0,
        operator: operatorName,
        notes: `HATA: ${code} barkodlu ürün bu sipariş listesinde bulunmuyor!`
      };

      const updatedReport: OrderFulfillmentReport = {
        ...currentReport,
        scanLogs: [newLog, ...(currentReport.scanLogs || [])]
      };

      setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));

      setLastScanResult({
        status: 'error',
        title: '🚨 DİKKAT: ÜRÜN SİPARİŞTE YOK!',
        message: `Okutulan "${code}" barkodu ${currentReport.orderNumber} sipariş listesinde bulunmuyor. Yanlış ürün yüklenmesi engellendi.`,
        time: new Date().toLocaleTimeString('tr-TR')
      });

      setBarcodeInput('');
      return;
    }

    // 2. WARNING: Order Quantity Already Fulfilled (Tolerans / Fazla Okuma Onayı)
    if (!forceExcess && matchingItem.scannedQuantity >= matchingItem.orderQuantity) {
      if (soundEnabled) playScanAudio(false);
      setExcessConfirmItem({ item: matchingItem, barcode: code });
      setLastScanResult({
        status: 'warning',
        title: '⚠️ SİPARİŞ ADEDİ TAMAMLANDI',
        message: `${matchingItem.skuName} için sipariş adedi (${matchingItem.orderQuantity} Adet) dolmuştur. Fazla çıkış yapmak için onaylayınız.`,
        item: matchingItem,
        time: new Date().toLocaleTimeString('tr-TR')
      });
      setBarcodeInput('');
      return;
    }

    // 3. SUCCESS: Increment Scanned Quantity
    const updatedItems = currentReport.items.map(it => {
      if (it.id === matchingItem.id) {
        return {
          ...it,
          scannedQuantity: it.scannedQuantity + 1
        };
      }
      return it;
    });

    const isExcess = (matchingItem.scannedQuantity + 1) > matchingItem.orderQuantity;

    const newLog: OrderScanLogItem = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleString('tr-TR'),
      barcode: code,
      skuName: matchingItem.skuName,
      collectionName: matchingItem.collectionName,
      dimensions: matchingItem.dimensions,
      action: isExcess ? 'scan_excess' : 'scan_success',
      quantityDelta: 1,
      operator: operatorName,
      notes: isExcess ? `Fazla Çıkış (+${matchingItem.scannedQuantity + 1 - matchingItem.orderQuantity})` : 'Normal Çıkış (+1)'
    };

    const calculatedReport = recalculateReport({
      ...currentReport,
      items: updatedItems,
      scanLogs: [newLog, ...(currentReport.scanLogs || [])]
    });

    setReports(prev => prev.map(r => r.id === calculatedReport.id ? calculatedReport : r));

    if (soundEnabled) playScanAudio(true);

    setLastScanResult({
      status: 'success',
      title: '✅ BAŞARILI OKUTMA (+1 ADET)',
      message: `${matchingItem.skuName} (${matchingItem.scannedQuantity + 1}/${matchingItem.orderQuantity} Adet Hazırlandı)`,
      item: matchingItem,
      time: new Date().toLocaleTimeString('tr-TR')
    });

    setBarcodeInput('');
    setExcessConfirmItem(null);
  };

  // Undo / Subtract 1 Scan
  const handleUndoScan = (item: OrderFulfillmentItem) => {
    if (item.scannedQuantity <= 0) return;

    const updatedItems = currentReport.items.map(it => {
      if (it.id === item.id) {
        return {
          ...it,
          scannedQuantity: Math.max(0, it.scannedQuantity - 1)
        };
      }
      return it;
    });

    const operatorName = currentUser ? currentUser.name : 'Kadir KORKMAZ';

    const newLog: OrderScanLogItem = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleString('tr-TR'),
      barcode: item.barcode,
      skuName: item.skuName,
      collectionName: item.collectionName,
      dimensions: item.dimensions,
      action: 'undo_scan',
      quantityDelta: -1,
      operator: operatorName,
      notes: 'Manuel Düzeltme / Geri Al (-1)'
    };

    const calculatedReport = recalculateReport({
      ...currentReport,
      items: updatedItems,
      scanLogs: [newLog, ...(currentReport.scanLogs || [])]
    });

    setReports(prev => prev.map(r => r.id === calculatedReport.id ? calculatedReport : r));

    setLastScanResult({
      status: 'info' as any,
      title: 'Geri Alındı (-1 Adet)',
      message: `${item.skuName} çıkış sayısı 1 adet azaltıldı.`,
      item,
      time: new Date().toLocaleTimeString('tr-TR')
    });
  };

  // Reset / Clear All Scans for the current report
  const handleResetScans = () => {
    if (!window.confirm(`${currentReport.orderNumber} siparişine ait tüm okutulan veriler sıfırlanacak. Emin misiniz?`)) {
      return;
    }

    const updatedItems = currentReport.items.map(it => ({
      ...it,
      scannedQuantity: 0
    }));

    const calculated = recalculateReport({
      ...currentReport,
      items: updatedItems,
      scanLogs: [
        {
          id: `LOG-${Date.now()}`,
          timestamp: new Date().toLocaleString('tr-TR'),
          barcode: '-',
          skuName: 'Tüm Liste Sıfırlandı',
          collectionName: '-',
          dimensions: '-',
          action: 'undo_scan',
          quantityDelta: 0,
          operator: currentUser?.name || 'Kadir KORKMAZ',
          notes: 'Sipariş okutmaları operatör tarafından sıfırlandı.'
        },
        ...(currentReport.scanLogs || [])
      ]
    });

    setReports(prev => prev.map(r => r.id === calculated.id ? calculated : r));
  };

  // Excel / CSV Raw Text Import Parser
  const handleParseExcelImport = () => {
    if (!excelPasteText.trim()) {
      alert('Lütfen Excel veya CSV içeriğini yapıştırınız.');
      return;
    }

    const lines = excelPasteText.trim().split('\n');
    const parsedItems: OrderFulfillmentItem[] = [];

    lines.forEach((line, idx) => {
      // Split by tab or semicolon or comma
      const parts = line.includes('\t') ? line.split('\t') : line.includes(';') ? line.split(';') : line.split(',');
      if (parts.length < 2) return;

      const rawName = parts[0]?.trim() || `ÜRÜN ${idx + 1}`;
      // Skip header if detected
      if (rawName.toLowerCase().includes('ürün') && idx === 0) return;

      const rawQty = parseInt(parts[1]?.replace(/\D/g, '') || '1', 10) || 1;
      const rawSqm = parseFloat(parts[2]?.replace(',', '.') || '0') || 0;
      const rawBarcode = parts[3]?.trim() || `86990100${(1000 + idx).toString()}`;

      // Try extract collection name (first word)
      const nameParts = rawName.split(' ');
      const collectionName = nameParts[0]?.toUpperCase() || 'PULCARPET';
      
      // Try extract dimensions (e.g. 160x230, 200x300)
      const dimMatch = rawName.match(/(\d{2,3})x(\d{2,3})/i);
      const dimensions = dimMatch ? dimMatch[0] : '160x230';

      parsedItems.push({
        id: `SKU-IMP-${Date.now()}-${idx}`,
        sequenceNumber: idx + 1,
        skuName: rawName,
        collectionName,
        patternCode: nameParts[1] || 'MODEL',
        color: nameParts.slice(2).join(' ') || 'STANDART',
        dimensions,
        barcode: rawBarcode,
        orderQuantity: rawQty,
        orderSqm: rawSqm,
        scannedQuantity: 0,
        scannedSqm: 0,
        remainingQuantity: rawQty,
        remainingSqm: rawSqm,
        excessQuantity: 0,
        excessSqm: 0,
        differencePercent: -100,
        status: 'Bekliyor'
      });
    });

    if (parsedItems.length === 0) {
      alert('Geçerli ürün satırı bulunamadı. Lütfen sütunları kontrol ediniz.');
      return;
    }

    const newReport: OrderFulfillmentReport = recalculateReport({
      id: `RPT-${Date.now()}`,
      reportNo: `SEVK-${new Date().getFullYear()}-${reports.length + 1}`,
      reportDate: `${new Date().toLocaleDateString('tr-TR')} - ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`,
      orderNumber: importOrderNo || `SIP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      orderDate: new Date().toLocaleDateString('tr-TR'),
      customerBrand: importBrand || 'PulCarpet Müşteri',
      edgeFinishType: importEdgeFinish || 'Overlok & Saçak',
      notes: 'Excel üzerinden içe aktarılan sipariş.',
      orderStatus: 'Hazırlanıyor',
      tolerancePercent: importTolerance || '±%5',
      productGroup: 'PulCarpet Halı Koleksiyonu',
      department: 'Depo / Sevkiyat & Lojistik',
      items: parsedItems,
      totalSkuCount: parsedItems.length,
      totalOrderQuantity: 0,
      totalOrderSqm: 0,
      totalScannedQuantity: 0,
      totalScannedSqm: 0,
      completionPercent: 0,
      remainingSqm: 0,
      missingCount: 0,
      excessCount: 0,
      scanLogs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    setReports([newReport, ...reports]);
    setActiveReportId(newReport.id);
    setIsExcelImportModalOpen(false);
    setExcelPasteText('');
    alert(`Tebrikler! ${parsedItems.length} kalemlik yeni sipariş başarıyla oluşturuldu.`);
  };

  // Convert CRM Order to Fulfillment Session
  const handleCreateFromCrmOrder = (crmOrder: Order) => {
    if (!crmOrder.items || crmOrder.items.length === 0) {
      alert('Bu siparişte henüz ürün kalemi bulunmuyor.');
      return;
    }

    const convertedItems: OrderFulfillmentItem[] = crmOrder.items.map((item, idx) => {
      const w = item.widthCm || 160;
      const l = item.lengthCm || 230;
      const dimensions = `${w}x${l}`;
      const qty = item.quantity || 1;
      const sqm = item.areaM2 || ((w * l) / 10000) * qty;

      // Find barcode in catalog if available
      const matchingProduct = products.find(p => 
        (p.collectionName && p.collectionName.toLowerCase() === item.collectionName.toLowerCase()) ||
        (p.name && p.name.toLowerCase().includes(item.collectionName.toLowerCase()))
      );
      const barcode = matchingProduct?.barcode || `869000${(2000 + idx).toString()}`;

      return {
        id: `PUL-CRM-${Date.now()}-${idx}`,
        sequenceNumber: idx + 1,
        skuName: `PULCARPET ${item.collectionName.toUpperCase()} ${item.colorCode} ${dimensions}`,
        collectionName: item.collectionName.toUpperCase(),
        patternCode: item.colorCode || 'STANDART',
        color: item.colorCode || 'ÖZEL',
        dimensions,
        widthCm: w,
        lengthCm: l,
        barcode,
        orderQuantity: qty,
        orderSqm: Number(sqm.toFixed(2)),
        scannedQuantity: 0,
        scannedSqm: 0,
        remainingQuantity: qty,
        remainingSqm: Number(sqm.toFixed(2)),
        excessQuantity: 0,
        excessSqm: 0,
        differencePercent: -100,
        status: 'Bekliyor'
      };
    });

    const newReport: OrderFulfillmentReport = recalculateReport({
      id: `RPT-${Date.now()}`,
      reportNo: `SEVK-${new Date().getFullYear()}-${reports.length + 1}`,
      reportDate: `${new Date().toLocaleDateString('tr-TR')} - ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`,
      orderNumber: crmOrder.orderNumber,
      orderDate: crmOrder.createdAt ? new Date(crmOrder.createdAt).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR'),
      customerBrand: crmOrder.customerName || crmOrder.company || 'PulCarpet Müşteri',
      edgeFinishType: crmOrder.items[0]?.edgeFinish || 'Overlok & Saçak',
      notes: crmOrder.notes || `${crmOrder.customerName} - ${crmOrder.company} siparişi.`,
      orderStatus: 'Hazırlanıyor',
      tolerancePercent: '±%5',
      productGroup: 'PulCarpet Özel Üretim / Koleksiyon',
      department: 'Depo / Sevkiyat & Lojistik',
      items: convertedItems,
      totalSkuCount: convertedItems.length,
      totalOrderQuantity: 0,
      totalOrderSqm: 0,
      totalScannedQuantity: 0,
      totalScannedSqm: 0,
      completionPercent: 0,
      remainingSqm: 0,
      missingCount: 0,
      excessCount: 0,
      scanLogs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    setReports([newReport, ...reports]);
    setActiveReportId(newReport.id);
    setIsNewOrderModalOpen(false);
    alert(`"${crmOrder.orderNumber}" numaralı sipariş barkod okutma istasyonuna yüklendi!`);
  };

  // Start fresh blank order
  const handleCreateBlankOrder = () => {
    const defaultOrderNo = `SIP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newReport: OrderFulfillmentReport = {
      id: `RPT-${Date.now()}`,
      reportNo: `SEVK-${new Date().getFullYear()}-${reports.length + 1}`,
      reportDate: `${new Date().toLocaleDateString('tr-TR')} - ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`,
      orderNumber: defaultOrderNo,
      orderDate: new Date().toLocaleDateString('tr-TR'),
      customerBrand: 'PulCarpet Müşteri Sevkiyatı',
      edgeFinishType: 'Overlok & Saçak',
      notes: 'Yeni boş sipariş sevkiyat oturumu.',
      orderStatus: 'Hazırlanıyor',
      tolerancePercent: '±%5',
      productGroup: 'PulCarpet Halı Koleksiyonu',
      department: 'Depo / Sevkiyat & Lojistik',
      items: [],
      totalSkuCount: 0,
      totalOrderQuantity: 0,
      totalOrderSqm: 0,
      totalScannedQuantity: 0,
      totalScannedSqm: 0,
      completionPercent: 0,
      remainingSqm: 0,
      missingCount: 0,
      excessCount: 0,
      scanLogs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setReports([newReport, ...reports]);
    setActiveReportId(newReport.id);
    setIsNewOrderModalOpen(false);
  };

  // Filtered Table Items
  const filteredItems = currentReport.items.filter(item => {
    const matchesSearch = 
      item.skuName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.collectionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.dimensions && item.dimensions.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCollection = selectedCollectionFilter === 'all' || item.collectionName === selectedCollectionFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesCollection && matchesStatus;
  });

  return (
    <div id="order-fulfillment-view" className="space-y-4 pb-12">
      {/* 1. Header & Quick Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-black font-mono tracking-wider">
              {currentReport.orderNumber}
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {currentReport.orderStatus}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Rapor No: <strong className="text-slate-800 font-mono">{currentReport.reportNo}</strong>
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1">
            Sipariş Durum ve Çıkış Kontrolü (Hatasız Barkod İstasyonu)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sipariş hazırlandıkça halıları tek tek okutun; koleksiyon ilerlemelerini ve eksik/fazla durumunu canlı izleyin.
          </p>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Order Selector Dropdown */}
          {reports.length > 1 && (
            <select
              value={activeReportId}
              onChange={(e) => setActiveReportId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              {reports.map(rep => (
                <option key={rep.id} value={rep.id}>
                  {rep.orderNumber} ({rep.completionPercent}% - {rep.customerBrand})
                </option>
              ))}
            </select>
          )}

          <button
            id="btn-open-new-order"
            onClick={() => setIsNewOrderModalOpen(true)}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            <span>Yeni Sipariş / CRM'den Çek</span>
          </button>

          <button
            id="btn-open-excel-import"
            onClick={() => setIsExcelImportModalOpen(true)}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel'den Yapıştır</span>
          </button>

          <button
            id="btn-print-report"
            onClick={() => setIsPrintModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-400" />
            <span>PDF / Rapor Çıktısı</span>
          </button>

          <button
            onClick={() => setIsLogModalOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Kütük ({currentReport.scanLogs?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* 2. Poka-Yoke Zero-Error Barcode Scanner Bar */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-2xl border border-slate-800 p-4 sm:p-5 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Input & Barcode Gun Listener */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black tracking-wider uppercase text-emerald-400 flex items-center gap-1.5">
                <ScanBarcode className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Hatasız Barkod Okutma & Halı Çıkışı</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors ${
                    soundEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                  <span>{soundEnabled ? 'Ses Açık' : 'Sessiz'}</span>
                </button>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  El Terminali / Tabanca Otomatik Dinleniyor
                </span>
              </div>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleScanProcess(barcodeInput);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <ScanBarcode className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Barkod okutun veya Desen / SKU yazıp Enter'a basın (ör: 8699010010084, FREYA 1138)..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full bg-slate-900/90 border-2 border-emerald-500/60 rounded-xl pl-11 pr-4 py-2.5 text-sm font-mono font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-inner"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs px-5 py-3 rounded-xl transition-all cursor-pointer active:scale-95 shadow-md flex items-center gap-1.5 shrink-0"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Okut (+1)</span>
              </button>

              <button
                type="button"
                onClick={handleResetScans}
                title="Tüm okutmaları sıfırla"
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all cursor-pointer shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Quick Stats Pill inside Scanner */}
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center gap-4 shrink-0 justify-around">
            <div className="text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Okutulan</div>
              <div className="text-lg font-black text-emerald-400 font-mono">
                {currentReport.totalScannedQuantity} <span className="text-xs text-slate-400">/ {currentReport.totalOrderQuantity}</span>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Tamamlanma</div>
              <div className="text-lg font-black text-indigo-400 font-mono">
                %{currentReport.completionPercent}
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Kalan M²</div>
              <div className="text-lg font-black text-amber-400 font-mono">
                {currentReport.remainingSqm} <span className="text-xs text-slate-400">m²</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Feedback Toast Banner */}
        {lastScanResult && (
          <div 
            className={`mt-3 p-3 rounded-xl border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
              lastScanResult.status === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                : lastScanResult.status === 'warning'
                ? 'bg-amber-950/80 border-amber-500/50 text-amber-200'
                : 'bg-rose-950/90 border-rose-500 text-rose-100 shadow-lg shadow-rose-950/50'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {lastScanResult.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              {lastScanResult.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />}
              {lastScanResult.status === 'error' && <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />}
              <div className="min-w-0">
                <div className="text-xs font-black tracking-wide truncate">{lastScanResult.title}</div>
                <div className="text-[11px] opacity-90 truncate">{lastScanResult.message}</div>
              </div>
            </div>
            <span className="text-[10px] font-mono opacity-70 shrink-0">{lastScanResult.time}</span>
          </div>
        )}
      </div>

      {/* 3. Koleksiyon Bazında Hazırlık Kutucukları (Siparişe Bağlı Ürün Detayları) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Boxes className="w-4 h-4 text-slate-600" />
            <span>Siparişe Bağlı Koleksiyon Hazırlık Detayları</span>
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {collectionSummaries.length} Koleksiyon
          </span>
        </div>

        {/* Collection Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {collectionSummaries.map((col) => {
            const isSelected = selectedCollectionFilter === col.name;
            const isComplete = col.scannedQty >= col.totalOrderQty && col.totalOrderQty > 0;
            return (
              <button
                key={col.name}
                onClick={() => setSelectedCollectionFilter(isSelected ? 'all' : col.name)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500'
                    : isComplete
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-200 hover:bg-emerald-100/80'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {/* Progress bar background */}
                <div 
                  className={`absolute bottom-0 left-0 top-0 opacity-15 pointer-events-none transition-all ${
                    isComplete ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${col.percent}%` }}
                />

                <div className="relative z-10">
                  <div className="text-xs font-black tracking-tight truncate">{col.name}</div>
                  <div className={`text-[11px] font-bold mt-0.5 ${isSelected ? 'text-emerald-300' : 'text-slate-600'}`}>
                    {col.totalOrderQty.toLocaleString('tr-TR')} Adet | {col.totalOrderSqm}m²
                  </div>
                </div>

                <div className="relative z-10 mt-2 pt-1 border-t border-slate-200/50 flex items-center justify-between text-[10px] font-mono">
                  <span className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                    Okunan: <strong className="text-emerald-600">{col.scannedQty}</strong>
                  </span>
                  <span className={`font-black ${col.percent === 100 ? 'text-emerald-600' : isSelected ? 'text-indigo-300' : 'text-indigo-600'}`}>
                    %{col.percent}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Sipariş Genel Durumu Tablosu (Özet Metrikler - PDF Birebir) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <span>Sipariş Genel Durum Özeti</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Total SKU</div>
            <div className="text-base font-black text-slate-900 font-mono mt-0.5">{currentReport.totalSkuCount}</div>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Total Adet</div>
            <div className="text-base font-black text-slate-900 font-mono mt-0.5">{currentReport.totalOrderQuantity.toLocaleString('tr-TR')}</div>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 font-bold uppercase">Total M2</div>
            <div className="text-base font-black text-slate-900 font-mono mt-0.5">{currentReport.totalOrderSqm.toLocaleString('tr-TR')}</div>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="text-[10px] text-emerald-800 font-bold uppercase">Okutulan Adet</div>
            <div className="text-base font-black text-emerald-700 font-mono mt-0.5">{currentReport.totalScannedQuantity.toLocaleString('tr-TR')}</div>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="text-[10px] text-emerald-800 font-bold uppercase">Okutulan M2</div>
            <div className="text-base font-black text-emerald-700 font-mono mt-0.5">{currentReport.totalScannedSqm.toLocaleString('tr-TR')}</div>
          </div>
          <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-200">
            <div className="text-[10px] text-indigo-800 font-bold uppercase">Tamamlanma</div>
            <div className="text-base font-black text-indigo-700 font-mono mt-0.5">%{currentReport.completionPercent}</div>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
            <div className="text-[10px] text-amber-800 font-bold uppercase">Kalan M2</div>
            <div className="text-base font-black text-amber-700 font-mono mt-0.5">{currentReport.remainingSqm.toLocaleString('tr-TR')}</div>
          </div>
          <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
            <div className="text-[10px] text-rose-800 font-bold uppercase">Eksik / Fazla (Adet)</div>
            <div className="text-base font-black text-rose-700 font-mono mt-0.5">
              {currentReport.missingCount} / +{currentReport.excessCount}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Detailed SKU Table & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filters Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="SKU, Koleksiyon veya Barkod ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {selectedCollectionFilter !== 'all' && (
              <button
                onClick={() => setSelectedCollectionFilter('all')}
                className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>{selectedCollectionFilter}</span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {(['all', 'Bekliyor', 'Eksik', 'Tamam', 'Fazla'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {st === 'all' ? 'Tüm Kalemler' : st}
              </button>
            ))}
          </div>
        </div>

        {/* The Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                <th className="p-2.5 text-center w-10">Sıra</th>
                <th className="p-2.5">Ürün İsmi</th>
                <th className="p-2.5 text-center">Ebat</th>
                <th className="p-2.5 text-center">Barkod</th>
                <th className="p-2.5 text-center bg-slate-800">Sipariş Adet</th>
                <th className="p-2.5 text-center bg-slate-800">Sipariş M²</th>
                <th className="p-2.5 text-center bg-emerald-950 text-emerald-300">Okutulan Adet</th>
                <th className="p-2.5 text-center bg-emerald-950 text-emerald-300">Okutulan M²</th>
                <th className="p-2.5 text-center bg-amber-950 text-amber-300">Kalan Adet</th>
                <th className="p-2.5 text-center bg-amber-950 text-amber-300">Kalan M²</th>
                <th className="p-2.5 text-center">Fazla Adet</th>
                <th className="p-2.5 text-center">Fark (%)</th>
                <th className="p-2.5 text-center">Durum</th>
                <th className="p-2.5 text-center w-20">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {filteredItems.map((item, idx) => {
                const isComplete = item.status === 'Tamam';
                const isExcess = item.status === 'Fazla';
                const isPending = item.status === 'Bekliyor';
                return (
                  <tr 
                    key={item.id}
                    className={`transition-colors ${
                      isComplete 
                        ? 'bg-emerald-50/40 hover:bg-emerald-50' 
                        : isExcess 
                        ? 'bg-rose-50/40 hover:bg-rose-50'
                        : isPending
                        ? 'hover:bg-slate-50'
                        : 'bg-amber-50/30 hover:bg-amber-50/60'
                    }`}
                  >
                    <td className="p-2.5 text-center text-slate-500 font-mono text-[11px]">
                      {item.sequenceNumber || idx + 1}
                    </td>
                    <td className="p-2.5 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{item.skuName}</span>
                      </div>
                    </td>
                    <td className="p-2.5 text-center font-mono font-semibold text-slate-700">
                      {item.dimensions || '-'}
                    </td>
                    <td className="p-2.5 text-center font-mono text-[11px] text-slate-500">
                      {item.barcode || '-'}
                    </td>
                    <td className="p-2.5 text-center font-mono font-black text-slate-900 bg-slate-50/50">
                      {item.orderQuantity}
                    </td>
                    <td className="p-2.5 text-center font-mono text-slate-700 bg-slate-50/50">
                      {item.orderSqm}
                    </td>
                    <td className="p-2.5 text-center font-mono font-black text-emerald-700 bg-emerald-50/50">
                      {item.scannedQuantity}
                    </td>
                    <td className="p-2.5 text-center font-mono text-emerald-700 bg-emerald-50/50">
                      {item.scannedSqm}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-amber-700 bg-amber-50/50">
                      {item.remainingQuantity}
                    </td>
                    <td className="p-2.5 text-center font-mono text-amber-700 bg-amber-50/50">
                      {item.remainingSqm}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-rose-700">
                      {item.excessQuantity > 0 ? `+${item.excessQuantity}` : '0'}
                    </td>
                    <td className="p-2.5 text-center font-mono font-semibold text-slate-600">
                      {item.differencePercent}%
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isComplete
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : isExcess
                          ? 'bg-rose-100 text-rose-900 border border-rose-300'
                          : isPending
                          ? 'bg-slate-100 text-slate-700 border border-slate-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleScanProcess(item.barcode || item.skuName)}
                          title="Hızlı +1 Okut"
                          className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md cursor-pointer active:scale-95 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        {item.scannedQuantity > 0 && (
                          <button
                            onClick={() => handleUndoScan(item)}
                            title="Geri Al (-1)"
                            className="p-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-md cursor-pointer active:scale-95 transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer count */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Toplam {filteredItems.length} Kalem Listeleniyor</span>
          <span className="font-mono font-bold text-slate-800">
            Sipariş Adeti: {currentReport.totalOrderQuantity.toLocaleString('tr-TR')} | Okutulan: {currentReport.totalScannedQuantity.toLocaleString('tr-TR')}
          </span>
        </div>
      </div>

      {/* MODAL 1: Excess Scan Confirmation Modal */}
      {excessConfirmItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="text-base font-black text-slate-900">Sipariş Miktarı Doldu!</h3>
                <p className="text-xs text-slate-500">Bu ürün için istenen tüm adetler zaten okutulmuştur.</p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">{excessConfirmItem.item.skuName}</div>
              <div className="text-slate-600">Sipariş Adeti: <strong>{excessConfirmItem.item.orderQuantity}</strong></div>
              <div className="text-slate-600">Şu An Okutulan: <strong className="text-emerald-700">{excessConfirmItem.item.scannedQuantity}</strong></div>
              <div className="text-amber-800 font-bold mt-1">Bu okutma fazlalık (+1) olarak kaydedilecektir.</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setExcessConfirmItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                İptal Et
              </button>
              <button
                onClick={() => handleScanProcess(excessConfirmItem.barcode, true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black cursor-pointer"
              >
                Fazla Olarak Onayla (+1)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1.5: New Order & CRM Order Selector Modal */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">Yeni Sipariş Başlat / CRM'den Çek</h3>
              </div>
              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Option A: Pick from CRM Orders */}
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>1. CRM'deki Kayıtlı Siparişlerden Seç</span>
                <span className="text-[11px] text-slate-500 font-normal">{orders.length} Sipariş Mevcut</span>
              </div>
              
              {orders.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                  CRM sisteminde henüz kayıtlı sipariş bulunmuyor. Aşağıdan boş oturum başlatabilir veya Excel'den aktarabilirsiniz.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                  {orders.map((ord) => (
                    <div 
                      key={ord.id}
                      className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl flex items-center justify-between gap-3 transition-colors text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="font-mono text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">{ord.orderNumber}</span>
                          <span>{ord.customerName}</span>
                          {ord.company && <span className="text-slate-500">({ord.company})</span>}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {ord.items?.length || 0} Kalem Halı | Toplam {ord.totalM2 || 0} m² | Durum: {ord.status}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCreateFromCrmOrder(ord)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                      >
                        İstasyona Yükle
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Option B: Direct Blank Session */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">2. Boş Bir Sevkiyat Oturumu Başlat</div>
                <div className="text-[11px] text-slate-500">Sıfırdan temiz bir sipariş açıp ürünleri okutun veya Excel'den aktarın.</div>
              </div>
              <button
                onClick={handleCreateBlankOrder}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Boş Oturum Aç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Excel / CSV Quick Import Modal */}
      {isExcelImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Excel / Sipariş Listesi İçe Aktarma</h3>
              </div>
              <button
                onClick={() => setIsExcelImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Sipariş No</label>
                <input
                  type="text"
                  value={importOrderNo}
                  onChange={(e) => setImportOrderNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Etiket / Firma Markası</label>
                <input
                  type="text"
                  value={importBrand}
                  onChange={(e) => setImportBrand(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Saçak / Overlok Tipi</label>
                <input
                  type="text"
                  value={importEdgeFinish}
                  onChange={(e) => setImportEdgeFinish(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Tolerans</label>
                <input
                  type="text"
                  value={importTolerance}
                  onChange={(e) => setImportTolerance(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Excel Tablosunu Buraya Yapıştırın (Ürün İsmi [Tab] Adet [Tab] M² [Tab] Barkod)
              </label>
              <textarea
                rows={8}
                value={excelPasteText}
                onChange={(e) => setExcelPasteText(e.target.value)}
                placeholder="Örnek:&#10;FREYA 1138 KİREMİT 200x300	10	60.0	8699010010084&#10;OTANTİK 1026 ÇOK RENKLİ 160x230	80	294.4	8699010010237"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Excel'deki hücreleri kopyalayıp (Ctrl+C) buraya yapıştırmanız (Ctrl+V) yeterlidir.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsExcelImportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={handleParseExcelImport}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Siparişi Oluştur ve Yükle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Audit Trail & Scan Logs */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">
                  Barkod Çıkış Kütüğü ({currentReport.scanLogs?.length || 0} İşlem)
                </h3>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {(currentReport.scanLogs || []).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Henüz barkod okutma işlemi yapılmadı.</div>
              ) : (
                (currentReport.scanLogs || []).map((log) => (
                  <div 
                    key={log.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg ${
                        log.action === 'scan_success' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : log.action === 'scan_excess'
                          ? 'bg-amber-100 text-amber-800'
                          : log.action === 'undo_scan'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        <ScanBarcode className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{log.skuName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Barkod: {log.barcode} | Operatör: <strong>{log.operator}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-slate-800 text-[11px]">{log.timestamp}</div>
                      <div className="text-[10px] text-slate-500">{log.notes}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Exact Printable PDF Report (PDF Formatına Birebir Sadık Çıktı) */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white text-slate-950 max-w-4xl w-full p-6 sm:p-8 rounded-2xl shadow-2xl my-auto space-y-4 max-h-[95vh] overflow-y-auto print:p-0 print:m-0 print:max-w-none print:shadow-none">
            {/* Top Toolbar (Hidden when printing) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900">Sipariş Durum Raporu Önizleme (A4)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Yazdır / PDF Olarak Kaydet</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* --- REPORT BODY (Exact Look from User's PDF) --- */}
            <div className="space-y-4 border border-slate-300 p-6 rounded-xl bg-white font-sans text-xs">
              {/* Report Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black tracking-tighter text-slate-900 font-serif">PULCARPET GROUP</span>
                    <span className="text-xs text-slate-400">|</span>
                    <span className="text-xs font-bold text-slate-600">Sipariş & Sevkiyat Kontrol Sistemi</span>
                  </div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                    Sipariş Durum Raporu
                  </h1>
                </div>

                <div className="text-right text-[11px] space-y-0.5">
                  <div><strong>Rapor Tarihi:</strong> {currentReport.reportDate}</div>
                  <div><strong>Rapor No:</strong> {currentReport.reportNo}</div>
                  <div><strong>Sipariş No:</strong> {currentReport.orderNumber}</div>
                  <div><strong>Departman:</strong> {currentReport.department}</div>
                </div>
              </div>

              {/* Sipariş Bilgisi Tablosu */}
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase text-slate-600">Sipariş Bilgisi</div>
                <div className="grid grid-cols-5 gap-2 border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-center">
                  <div>
                    <div className="text-[9px] text-slate-500 uppercase font-bold">Sipariş No</div>
                    <div className="font-bold text-slate-900 font-mono">{currentReport.orderNumber}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 uppercase font-bold">Sipariş Tarihi</div>
                    <div className="font-bold text-slate-900">{currentReport.orderDate}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 uppercase font-bold">Etiket Markası</div>
                    <div className="font-bold text-slate-900">{currentReport.customerBrand}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 uppercase font-bold">Saçak/Overlok</div>
                    <div className="font-bold text-slate-900">{currentReport.edgeFinishType}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 uppercase font-bold">Açıklama</div>
                    <div className="font-bold text-slate-900">{currentReport.notes || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Sipariş Durumu Tablosu */}
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase text-slate-600">Sipariş Durumu</div>
                <div className="grid grid-cols-4 gap-2 border border-slate-300 rounded-lg p-2.5 bg-slate-50 text-center">
                  <div>
                    <div className="text-[9px] text-slate-500 uppercase font-bold">Sipariş Durumu</div>
                    <div className="font-bold text-emerald-800">{currentReport.orderStatus}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 uppercase font-bold">Tolerans</div>
                    <div className="font-bold text-slate-900 font-mono">{currentReport.tolerancePercent}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 uppercase font-bold">Ürün Grubu</div>
                    <div className="font-bold text-slate-900">{currentReport.productGroup}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 uppercase font-bold">Son Düzenleme</div>
                    <div className="font-bold text-slate-900">{new Date(currentReport.updatedAt).toLocaleDateString('tr-TR')}</div>
                  </div>
                </div>
              </div>

              {/* Koleksiyon Kutuları (Siparişe Bağlı Ürün Detayları) */}
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase text-slate-600">Siparişe Bağlı Ürün Detayları</div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center">
                  {collectionSummaries.map((col) => (
                    <div key={col.name} className="border border-slate-300 rounded-lg p-1.5 bg-white">
                      <div className="font-black text-slate-900 text-[11px]">{col.name}</div>
                      <div className="text-[9px] text-slate-600 mt-0.5">{col.totalOrderQty} Adet | {col.totalOrderSqm}m²</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sipariş Genel Durumu */}
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase text-slate-600">Sipariş Genel Durumu</div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 border border-slate-300 rounded-lg p-2 bg-slate-100 text-center font-mono">
                  <div>
                    <div className="text-[8px] text-slate-500 font-bold uppercase font-sans">Total SKU</div>
                    <div className="font-bold text-xs">{currentReport.totalSkuCount}</div>
                  </div>
                  <div>
                    <div className="text-[8px] text-slate-500 font-bold uppercase font-sans">Total Adet</div>
                    <div className="font-bold text-xs">{currentReport.totalOrderQuantity.toLocaleString('tr-TR')}</div>
                  </div>
                  <div>
                    <div className="text-[8px] text-slate-500 font-bold uppercase font-sans">Total M2</div>
                    <div className="font-bold text-xs">{currentReport.totalOrderSqm.toLocaleString('tr-TR')}</div>
                  </div>
                  <div>
                    <div className="text-[8px] text-slate-500 font-bold uppercase font-sans">Okutulan Adet</div>
                    <div className="font-bold text-xs text-emerald-800">{currentReport.totalScannedQuantity.toLocaleString('tr-TR')}</div>
                  </div>
                  <div>
                    <div className="text-[8px] text-slate-500 font-bold uppercase font-sans">Okutulan M2</div>
                    <div className="font-bold text-xs text-emerald-800">{currentReport.totalScannedSqm.toLocaleString('tr-TR')}</div>
                  </div>
                  <div>
                    <div className="text-[8px] text-slate-500 font-bold uppercase font-sans">Tamamlanma</div>
                    <div className="font-bold text-xs text-indigo-800">%{currentReport.completionPercent}</div>
                  </div>
                  <div>
                    <div className="text-[8px] text-slate-500 font-bold uppercase font-sans">Kalan M2</div>
                    <div className="font-bold text-xs text-amber-800">{currentReport.remainingSqm.toLocaleString('tr-TR')}</div>
                  </div>
                  <div>
                    <div className="text-[8px] text-slate-500 font-bold uppercase font-sans">Eksik/Fazla</div>
                    <div className="font-bold text-xs text-rose-800">{currentReport.missingCount} / +{currentReport.excessCount}</div>
                  </div>
                </div>
              </div>

              {/* Ürün Listesi Tablosu */}
              <div className="space-y-1 pt-2">
                <div className="text-[10px] font-black uppercase text-slate-600">Ürün Listesi</div>
                <table className="w-full text-left text-[10px] border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold">
                      <th className="p-1.5 border border-slate-700 text-center w-8">Sıra</th>
                      <th className="p-1.5 border border-slate-700">Ürün İsmi</th>
                      <th className="p-1.5 border border-slate-700 text-center">Sipariş Adeti</th>
                      <th className="p-1.5 border border-slate-700 text-center">Sipariş M2</th>
                      <th className="p-1.5 border border-slate-700 text-center">Okutulan Adet</th>
                      <th className="p-1.5 border border-slate-700 text-center">Okutulan M2</th>
                      <th className="p-1.5 border border-slate-700 text-center">Kalan Adet</th>
                      <th className="p-1.5 border border-slate-700 text-center">Kalan M2</th>
                      <th className="p-1.5 border border-slate-700 text-center">Fazla Adet</th>
                      <th className="p-1.5 border border-slate-700 text-center">Fark (%)</th>
                      <th className="p-1.5 border border-slate-700 text-center">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-mono">
                    {currentReport.items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-1 border border-slate-300 text-center">{item.sequenceNumber || idx + 1}</td>
                        <td className="p-1 border border-slate-300 font-sans font-bold">{item.skuName}</td>
                        <td className="p-1 border border-slate-300 text-center">{item.orderQuantity}</td>
                        <td className="p-1 border border-slate-300 text-center">{item.orderSqm}</td>
                        <td className="p-1 border border-slate-300 text-center font-bold">{item.scannedQuantity}</td>
                        <td className="p-1 border border-slate-300 text-center">{item.scannedSqm}</td>
                        <td className="p-1 border border-slate-300 text-center">{item.remainingQuantity}</td>
                        <td className="p-1 border border-slate-300 text-center">{item.remainingSqm}</td>
                        <td className="p-1 border border-slate-300 text-center">{item.excessQuantity}</td>
                        <td className="p-1 border border-slate-300 text-center">{item.differencePercent}%</td>
                        <td className="p-1 border border-slate-300 text-center font-sans font-bold">{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Report Footer */}
              <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-500">
                <div>Operasyon & Sevkiyat Kontrol Sistemi | PULCARPET CRM & Warehouse</div>
                <div>Sayfa: 1 / 1</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
