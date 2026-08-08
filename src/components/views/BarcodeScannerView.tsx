import React, { useState, useEffect } from 'react';
import { CarpetProduct, Order, CompanyProductPrice } from '../../types';
import { 
  ScanBarcode, 
  Search, 
  Plus, 
  PackageCheck, 
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
  Edit,
  Trash2,
  Sliders,
  Maximize2,
  Copy,
  Eye,
  Settings,
  Globe,
  RefreshCw,
  Upload,
  Download,
  FileSpreadsheet,
  Link,
  Database,
  CheckCircle,
  Save,
  FileText,
  Layers,
  Filter,
  Building2,
  DollarSign,
  Box
} from 'lucide-react';

interface BarcodeScannerViewProps {
  products: CarpetProduct[];
  orders: Order[];
  onUpdateProducts: (products: CarpetProduct[]) => void;
  onUpdateOrders: (orders: Order[]) => void;
  currentUser?: { username: string; name: string; role: string; token: string } | null;
}

interface StockMovementLog {
  id: string;
  timestamp: string;
  productCode: string;
  productName: string;
  barcode: string;
  type: 'in' | 'out';
  quantityM2: number;
  previousStockM2: number;
  newStockM2: number;
  reason: string;
  operator: string;
}

const DEMO_PRODUCT_IDS = ['PROD-01', 'PROD-02', 'PROD-03', 'PROD-04'];

// SVG Barcode Renderer for Crisp Thermal Label Printing
const BarcodeSvg: React.FC<{ code: string; height?: number }> = ({ code, height = 40 }) => {
  const cleanCode = (code || '8699010020012').replace(/\D/g, '').padEnd(13, '0').slice(0, 13);
  
  const bars: number[] = [1, 0, 1];
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(cleanCode[i] || '0', 10);
    const pattern = (digit * 17 + i * 13) % 128;
    for (let b = 0; b < 7; b++) {
      bars.push((pattern >> (6 - b)) & 1);
    }
    if (i === 5) {
      bars.push(0, 1, 0, 1, 0);
    }
  }
  bars.push(1, 0, 1);

  const barWidth = 1.6;
  const totalWidth = bars.length * barWidth;

  return (
    <div className="flex flex-col items-center justify-center my-0.5">
      <svg width={totalWidth} height={height} className="max-w-full">
        {bars.map((isDark, idx) => (
          isDark ? (
            <rect
              key={idx}
              x={idx * barWidth}
              y={0}
              width={barWidth}
              height={height}
              fill="#000000"
            />
          ) : null
        ))}
      </svg>
      <div className="font-mono font-bold text-[10px] tracking-widest text-black mt-0.5">
        {cleanCode.replace(/(\d{1})(\d{6})(\d{6})/, '$1 $2 $3')}
      </div>
    </div>
  );
};

export const BarcodeScannerView: React.FC<BarcodeScannerViewProps> = ({
  products,
  orders,
  onUpdateProducts,
  onUpdateOrders,
  currentUser,
}) => {
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<CarpetProduct | null>(null);
  const [quantityInput, setQuantityInput] = useState<string>('50');
  const [movementReason, setMovementReason] = useState<string>('Fabrika Ambar Girişi');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // New Product Modal if scanned barcode not found
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState<boolean>(false);
  const [newProdName, setNewProdName] = useState<string>('');
  const [newProdPieceQuantity, setNewProdPieceQuantity] = useState<string>('10');

  // Manual Barcode Entry Fields (Koleksiyon Adı, Desen Kodu, Ölçüsü, Alış Fiyatı, Para Birimi & KDV)
  const [newProdCollectionName, setNewProdCollectionName] = useState<string>('Bambu İpek Koleksiyonu');
  const [newProdPatternCode, setNewProdPatternCode] = useState<string>('DSN-101');
  const [newProdDimensions, setNewProdDimensions] = useState<string>('200x300 cm');
  const [newProdPurchasePrice, setNewProdPurchasePrice] = useState<string>('450');
  const [newProdPurchaseCurrency, setNewProdPurchaseCurrency] = useState<'TL' | 'USD' | 'EUR' | 'GBP'>('TL');
  const [newProdVatOption, setNewProdVatOption] = useState<'kdv_10' | 'kdv_20' | 'ihrac_kayitli'>('kdv_20');

  // Barcode Scan Intake Confirmation Modal (Detaylı Stok İçeri Alış)
  const [isScanIntakeModalOpen, setIsScanIntakeModalOpen] = useState<boolean>(false);
  const [scanIntakeProduct, setScanIntakeProduct] = useState<CarpetProduct | null>(null);
  const [scanIntakeDimensions, setScanIntakeDimensions] = useState<string>('200x300 cm');
  const [scanIntakePieceQuantity, setScanIntakePieceQuantity] = useState<string>('1');
  const [scanIntakeUnitPrice, setScanIntakeUnitPrice] = useState<string>('450');
  const [scanIntakeCurrency, setScanIntakeCurrency] = useState<'TL' | 'USD' | 'EUR' | 'GBP'>('TL');
  const [scanIntakeVat, setScanIntakeVat] = useState<'kdv_10' | 'kdv_20' | 'ihrac_kayitli'>('kdv_20');
  const [scanIntakeReason, setScanIntakeReason] = useState<string>('Fabrika Ambar Girişi');

  // Firma / Tedarikçi Ürün Özel Fiyat Listesi States
  const [companyPrices, setCompanyPrices] = useState<CompanyProductPrice[]>(() => {
    try {
      const saved = localStorage.getItem('company_product_prices_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading company prices:', e);
    }
    return [
      {
        id: 'cpp-1',
        companyName: 'Gaziantep İplik & Tekstil A.Ş.',
        companyType: 'tedarikci',
        productName: 'Bambu İpek - DSN-101 (200x300)',
        collectionName: 'Bambu İpek',
        patternCode: 'DSN-101',
        unitPrice: 420,
        currency: 'TL',
        priceType: 'alis',
        vatOption: 'kdv_20',
        notes: 'Yıllık hammadde tedarik anlaşması fiyatı',
        updatedAt: '2026-08-01',
      },
      {
        id: 'cpp-2',
        companyName: 'Marmara Halı Mağazaları Ltd.',
        companyType: 'musteri',
        productName: 'Royal İpek Serisi - Vizon (160x230)',
        collectionName: 'Royal İpek',
        patternCode: 'RYL-402',
        unitPrice: 65,
        currency: 'USD',
        priceType: 'satis',
        vatOption: 'ihrac_kayitli',
        notes: 'İhracat kayıtlı özel bayi satış fiyatı',
        updatedAt: '2026-08-05',
      },
    ];
  });

  const [newCompName, setNewCompName] = useState<string>('');
  const [newCompType, setNewCompType] = useState<'tedarikci' | 'musteri' | 'fasoncu'>('tedarikci');
  const [newCompProductName, setNewCompProductName] = useState<string>('');
  const [newCompUnitPrice, setNewCompUnitPrice] = useState<string>('');
  const [newCompCurrency, setNewCompCurrency] = useState<'TL' | 'USD' | 'EUR' | 'GBP'>('TL');
  const [newCompPriceType, setNewCompPriceType] = useState<'alis' | 'satis'>('alis');
  const [newCompVat, setNewCompVat] = useState<'kdv_10' | 'kdv_20' | 'ihrac_kayitli'>('kdv_20');
  const [newCompNotes, setNewCompNotes] = useState<string>('');
  const [compPriceSearchQuery, setCompPriceSearchQuery] = useState<string>('');
  const [compTypeFilter, setCompTypeFilter] = useState<string>('all');

  // Save company prices to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('company_product_prices_v1', JSON.stringify(companyPrices));
    } catch (e) {
      console.error('Error saving company prices:', e);
    }
  }, [companyPrices]);

  // Label Customization States
  const [isLabelEditModalOpen, setIsLabelEditModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  const [labelBrand, setLabelBrand] = useState<string>('PULCARPET HALI');
  const [labelCollection, setLabelCollection] = useState<string>('Bambu İpek Koleksiyonu');
  const [labelProductName, setLabelProductName] = useState<string>('Royal İpek Halı');
  const [labelProductCode, setLabelProductCode] = useState<string>('PC-SILK-01');
  const [labelBarcodeNo, setLabelBarcodeNo] = useState<string>('8699010020012');
  const [labelPriceText, setLabelPriceText] = useState<string>('1.250 ₺ / m²');
  const [labelNoteText, setLabelNoteText] = useState<string>('Yerli Üretim • 1.200.000 Nokta');

  // Label Visibility Toggles
  const [showLabelBrand, setShowLabelBrand] = useState<boolean>(true);
  const [showLabelCollection, setShowLabelCollection] = useState<boolean>(true);
  const [showLabelCode, setShowLabelCode] = useState<boolean>(true);
  const [showLabelPrice, setShowLabelPrice] = useState<boolean>(true);
  const [showLabelNote, setShowLabelNote] = useState<boolean>(true);

  // Print Settings & Dimension Presets
  const [labelSizePreset, setLabelSizePreset] = useState<'100x100' | '40x40' | '50x30' | '100x50' | '20x20' | 'A4_4x4' | 'A4_3x8' | 'custom'>('100x100');
  const [customWidthCm, setCustomWidthCm] = useState<number>(10);
  const [customHeightCm, setCustomHeightCm] = useState<number>(10);
  const [printCopies, setPrintCopies] = useState<number>(1);

  // Filter products state (to show/hide demos in quick selector)
  const [hideDemoProductsInSelector, setHideDemoProductsInSelector] = useState<boolean>(false);

  // Active Sub-Tab: 'scanner' | 'definition' | 'batch' | 'company_prices'
  const [activeTab, setActiveTab] = useState<'scanner' | 'definition' | 'batch' | 'company_prices'>('scanner');

  // Barcode Definition Catalog Filters & Inline Editing
  const [definitionSearchQuery, setDefinitionSearchQuery] = useState<string>('');
  const [definitionBarcodeFilter, setDefinitionBarcodeFilter] = useState<'all' | 'with' | 'without'>('all');
  const [editingBarcodeProductId, setEditingBarcodeProductId] = useState<string | null>(null);
  const [editingBarcodeValue, setEditingBarcodeValue] = useState<string>('');

  // Batch Barcode Paste State
  const [batchPasteInput, setBatchPasteInput] = useState<string>('');

  // GS1 Türkiye (online.gs1tr.org) Integration States
  const [isGs1ModalOpen, setIsGs1ModalOpen] = useState<boolean>(false);
  const [gs1Gln, setGs1Gln] = useState<string>('8699010000000');
  const [gs1CompanyName, setGs1CompanyName] = useState<string>('PULCARPET TEKSTİL HALI SAN. VEC TİC. A.Ş.');
  const [gs1Username, setGs1Username] = useState<string>('pulcarpet_gs1');
  const [gs1ApiKey, setGs1ApiKey] = useState<string>('');
  const [isSyncingGs1, setIsSyncingGs1] = useState<boolean>(false);
  const [gs1LookupQuery, setGs1LookupQuery] = useState<string>('8699010020012');
  const [gs1LookupResult, setGs1LookupResult] = useState<any>(null);

  // Load GS1 TR Config on mount
  useEffect(() => {
    fetch('/api/gs1tr/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.gln) setGs1Gln(data.gln);
        if (data.companyName) setGs1CompanyName(data.companyName);
        if (data.username) setGs1Username(data.username);
        if (data.apiKey) setGs1ApiKey(data.apiKey);
      })
      .catch((err) => console.error('GS1 config load error:', err));
  }, []);

  // Save GS1 TR Config
  const handleSaveGs1Config = async () => {
    try {
      const res = await fetch('/api/gs1tr/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gln: gs1Gln,
          companyName: gs1CompanyName,
          username: gs1Username,
          apiKey: gs1ApiKey,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'GS1 Türkiye (online.gs1tr.org) ayarları kaydedildi.');
      } else {
        showToast('error', data.error || 'GS1 TR ayarları kaydedilemedi.');
      }
    } catch (err: any) {
      showToast('error', 'GS1 TR bağlantı hatası: ' + err.message);
    }
  };

  // Sync products with online.gs1tr.org
  const handleSyncWithGs1Tr = async () => {
    setIsSyncingGs1(true);
    try {
      const res = await fetch('/api/gs1tr/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.syncedProducts)) {
        onUpdateProducts(data.syncedProducts);
        showToast('success', data.message || `online.gs1tr.org ile ${products.length} ürün senkronize edildi!`);
      } else {
        showToast('error', data.error || 'GS1 TR senkronizasyonu başarısız.');
      }
    } catch (err: any) {
      showToast('error', 'GS1 TR senkronizasyon hatası: ' + err.message);
    } finally {
      setIsSyncingGs1(false);
    }
  };

  // Live lookup EAN on GS1 TR
  const handleLookupGs1Ean = async () => {
    if (!gs1LookupQuery.trim()) return;
    try {
      const res = await fetch(`/api/gs1tr/lookup/${gs1LookupQuery.trim()}`);
      const data = await res.json();
      setGs1LookupResult(data);
      if (data.success) {
        showToast('success', `GS1 TR Sorgusu Başarılı: ${data.gtin} (${data.brand})`);
      }
    } catch (err: any) {
      showToast('error', 'GS1 TR EAN sorgulama hatası: ' + err.message);
    }
  };

  // Import GS1 TR Excel/CSV File
  const handleImportGs1File = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        // Parse lines searching for 13-digit numbers starting with 869
        const lines = text.split(/\r?\n/);
        let importedCount = 0;
        const updatedProds = [...products];

        lines.forEach((line, idx) => {
          const match = line.match(/\b(869\d{10})\b/);
          if (match && match[1]) {
            const gtin = match[1];
            // If we have a product matching this index or line, update its barcode
            if (updatedProds[importedCount]) {
              updatedProds[importedCount] = {
                ...updatedProds[importedCount],
                barcode: gtin,
              };
              importedCount++;
            }
          }
        });

        if (importedCount > 0) {
          onUpdateProducts(updatedProds);
          showToast('success', `online.gs1tr.org dosyasından ${importedCount} adet GS1 EAN-13 barkodu aktarıldı!`);
        } else {
          showToast('info', 'Dosya içinde 869 ile başlayan geçerli GS1 EAN-13 barkodu bulunamadı.');
        }
      } catch (err: any) {
        showToast('error', 'GS1 TR dosya okuma hatası: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Stock Movements History (Stored in localStorage)
  const [movementsLog, setMovementsLog] = useState<StockMovementLog[]>(() => {
    try {
      const saved = localStorage.getItem('pulcarpet_stock_movements');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse stock movements', e);
    }
    return [
      {
        id: 'log-1',
        timestamp: new Date(Date.now() - 3600000 * 2).toLocaleString('tr-TR'),
        productCode: 'PC-SILK-01',
        productName: 'PulCarpet Royal Bambu İpek',
        barcode: '8699010020012',
        type: 'in',
        quantityM2: 120,
        previousStockM2: 130,
        newStockM2: 250,
        reason: 'Fabrika Ambar Girişi',
        operator: currentUser?.name || 'Kadir KORKMAZ',
      },
      {
        id: 'log-2',
        timestamp: new Date(Date.now() - 3600000 * 24).toLocaleString('tr-TR'),
        productCode: 'PC-WOOL-02',
        productName: 'PulCarpet Anadolu Saf Yün',
        barcode: '8699010020029',
        type: 'out',
        quantityM2: 45,
        previousStockM2: 225,
        newStockM2: 180,
        reason: 'Müşteri Siparişi Sevk',
        operator: currentUser?.name || 'Kadir KORKMAZ',
      }
    ];
  });

  // When selectedProduct changes, sync default label texts
  useEffect(() => {
    if (selectedProduct) {
      setLabelCollection(selectedProduct.category || 'Halı Koleksiyonu');
      setLabelProductName(selectedProduct.name);
      setLabelProductCode(selectedProduct.code);
      setLabelBarcodeNo(selectedProduct.barcode || '8699010020012');
      setLabelPriceText(selectedProduct.pricePerM2 ? `${selectedProduct.pricePerM2.toLocaleString('tr-TR')} ₺ / m²` : '1.250 ₺ / m²');
      setLabelNoteText(`Hav: ${selectedProduct.pileHeightMm || 10}mm • Sıklık: ${selectedProduct.densityPoints ? selectedProduct.densityPoints.toLocaleString('tr-TR') : '1.200.000'}`);
    }
  }, [selectedProduct]);

  useEffect(() => {
    try {
      localStorage.setItem('pulcarpet_stock_movements', JSON.stringify(movementsLog));
    } catch (e) {
      console.error('Failed to save stock movements', e);
    }
  }, [movementsLog]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const playBeepSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio context error ignore
    }
  };

  // Helper to parse dimension string (e.g. "200x300 cm") into m² per unit
  const calculateM2FromDimensionString = (dimStr: string): number => {
    if (!dimStr) return 6;
    const match = dimStr.match(/(\d+)\s*[xX*×]\s*(\d+)/);
    if (match) {
      const w = parseFloat(match[1]);
      const h = parseFloat(match[2]);
      if (w > 0 && h > 0) {
        const wM = w > 20 ? w / 100 : w;
        const hM = h > 20 ? h / 100 : h;
        return Math.round(wM * hM * 100) / 100;
      }
    }
    return 6;
  };

  // Search/Scan barcode logic
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = scannedBarcode.trim();
    if (!query) {
      showToast('error', 'Lütfen geçerli bir barkod numarası veya ürün kodu giriniz.');
      return;
    }

    const found = products.find(
      (p) => 
        (p.barcode && p.barcode.toLowerCase() === query.toLowerCase()) ||
        p.code.toLowerCase() === query.toLowerCase() ||
        p.id.toLowerCase() === query.toLowerCase()
    );

    if (found) {
      setSelectedProduct(found);
      setScanIntakeProduct(found);
      setScanIntakeDimensions(found.dimensions || '200x300 cm');
      setScanIntakeUnitPrice(String(found.purchasePrice || 450));
      setScanIntakeCurrency(found.purchaseCurrency || 'TL');
      setScanIntakeVat(found.vatOption || 'kdv_20');
      setScanIntakePieceQuantity('1');
      setIsScanIntakeModalOpen(true);
      playBeepSound();
      showToast('success', `Barkod okundu: "${found.name}" (${found.code}). Detaylar soruluyor.`);
    } else {
      setSelectedProduct(null);
      if (window.confirm(`"${query}" barkod numarası bulunamadı. Bu barkodla doğrudan yeni ürün ve stok tanımlamak ister misiniz?`)) {
        setNewProdName(`Halı - ${query}`);
        setNewProdCollectionName('Yeni Koleksiyon');
        setNewProdPatternCode('DSN-01');
        setNewProdPieceQuantity('10');
        setIsNewProductModalOpen(true);
      } else {
        showToast('info', `"${query}" barkod numarası stokta bulunamadı.`);
      }
    }
  };

  // Select random product test
  const handleScanRandomProduct = () => {
    const list = hideDemoProductsInSelector
      ? products.filter((p) => !DEMO_PRODUCT_IDS.includes(p.id) && !p.id.startsWith('PROD-0'))
      : products;

    if (list.length === 0) {
      showToast('error', 'Okutulacak ürün listede kalmadı.');
      return;
    }
    const randomProd = list[Math.floor(Math.random() * list.length)];
    const codeToScan = randomProd.barcode || randomProd.code;
    setScannedBarcode(codeToScan);
    setSelectedProduct(randomProd);
    setScanIntakeProduct(randomProd);
    setScanIntakeDimensions(randomProd.dimensions || '200x300 cm');
    setScanIntakeUnitPrice(String(randomProd.purchasePrice || 450));
    setScanIntakeCurrency(randomProd.purchaseCurrency || 'TL');
    setScanIntakeVat(randomProd.vatOption || 'kdv_20');
    setScanIntakePieceQuantity('1');
    setIsScanIntakeModalOpen(true);
    playBeepSound();
    showToast('success', `Rastgele barkod okundu: ${randomProd.name}`);
  };

  // Stock Increase / Decrease (+m²)
  const handleStockAdjustment = (type: 'in' | 'out') => {
    if (!selectedProduct) {
      showToast('error', 'Lütfen önce stok girişi yapılacak bir ürün okutun veya seçin.');
      return;
    }

    const amount = parseFloat(quantityInput);
    if (isNaN(amount) || amount <= 0) {
      showToast('error', 'Lütfen geçerli bir m² miktarı giriniz.');
      return;
    }

    const currentStock = selectedProduct.stockM2 || 0;
    if (type === 'out' && amount > currentStock) {
      if (!window.confirm(`Girilmiş m² miktarı (${amount} m²), mevcut stoktan (${currentStock} m²) fazladır. Devam edilsin mi?`)) {
        return;
      }
    }

    const newStock = type === 'in' ? currentStock + amount : Math.max(0, currentStock - amount);

    const updatedProducts = products.map((p) =>
      p.id === selectedProduct.id ? { ...p, stockM2: newStock } : p
    );
    onUpdateProducts(updatedProducts);

    setSelectedProduct({ ...selectedProduct, stockM2: newStock });

    const newLog: StockMovementLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('tr-TR'),
      productCode: selectedProduct.code,
      productName: selectedProduct.name,
      barcode: selectedProduct.barcode || 'Yok',
      type,
      quantityM2: amount,
      previousStockM2: currentStock,
      newStockM2: newStock,
      reason: movementReason,
      operator: currentUser?.name || 'Kadir KORKMAZ',
    };

    setMovementsLog([newLog, ...movementsLog]);
    playBeepSound();
    showToast(
      'success',
      type === 'in'
        ? `+${amount} m² stok eklendi! Yeni stok: ${newStock} m²`
        : `-${amount} m² stok düşüldü! Yeni stok: ${newStock} m²`
    );
  };

  // Handle confirming scanned product intake with exact dimensions & pieces
  const handleConfirmScanIntake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanIntakeProduct) return;

    const pieces = parseFloat(scanIntakePieceQuantity) || 1;
    const m2PerPiece = calculateM2FromDimensionString(scanIntakeDimensions);
    const totalM2Added = Math.round(pieces * m2PerPiece * 100) / 100;
    const currentStock = scanIntakeProduct.stockM2 || 0;
    const newStock = Math.round((currentStock + totalM2Added) * 100) / 100;

    const unitPriceVal = parseFloat(scanIntakeUnitPrice) || 0;

    const updatedProducts = products.map((p) =>
      p.id === scanIntakeProduct.id
        ? {
            ...p,
            stockM2: newStock,
            dimensions: scanIntakeDimensions,
            purchasePrice: unitPriceVal,
            purchaseCurrency: scanIntakeCurrency,
            vatOption: scanIntakeVat,
          }
        : p
    );

    onUpdateProducts(updatedProducts);
    setSelectedProduct({ ...scanIntakeProduct, stockM2: newStock, dimensions: scanIntakeDimensions });
    setIsScanIntakeModalOpen(false);

    const newLog: StockMovementLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('tr-TR'),
      productCode: scanIntakeProduct.code,
      productName: scanIntakeProduct.name,
      barcode: scanIntakeProduct.barcode || 'Yok',
      type: 'in',
      quantityM2: totalM2Added,
      previousStockM2: currentStock,
      newStockM2: newStock,
      reason: `${scanIntakeReason} (${pieces} Adet - Ölçü: ${scanIntakeDimensions})`,
      operator: currentUser?.name || 'Kadir KORKMAZ',
    };

    setMovementsLog([newLog, ...movementsLog]);
    playBeepSound();
    showToast(
      'success',
      `"${scanIntakeProduct.name}" için ${pieces} adet (${scanIntakeDimensions}, Toplam +${totalM2Added} m²) stoğa alındı!`
    );
  };

  // Delete Demo Products from list
  const handleDeleteDemoProducts = () => {
    const demoCount = products.filter((p) => DEMO_PRODUCT_IDS.includes(p.id) || p.id.startsWith('PROD-0')).length;
    if (demoCount === 0) {
      showToast('info', 'Listede temizlenecek demo ürün bulunamadı.');
      return;
    }

    if (window.confirm(`Stok listesindeki ${demoCount} adet varsayılan demo ürünü tamamen silmek istediğinize emin misiniz?`)) {
      const updated = products.filter((p) => !DEMO_PRODUCT_IDS.includes(p.id) && !p.id.startsWith('PROD-0'));
      onUpdateProducts(updated);
      if (selectedProduct && (DEMO_PRODUCT_IDS.includes(selectedProduct.id) || selectedProduct.id.startsWith('PROD-0'))) {
        setSelectedProduct(null);
      }
      showToast('success', `${demoCount} adet demo ürün silindi.`);
    }
  };

  // Create fast product with scanned barcode
  const handleCreateFastProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      showToast('error', 'Ürün adı boş olamaz.');
      return;
    }

    const barcodeVal = scannedBarcode.trim() || `86990${Math.floor(100000000 + Math.random() * 900000000)}`;
    const pieces = parseFloat(newProdPieceQuantity) || 1;
    const m2PerPiece = calculateM2FromDimensionString(newProdDimensions);
    const totalM2Calculated = Math.round(pieces * m2PerPiece * 100) / 100;

    const newProduct: CarpetProduct = {
      id: `prod-bc-${Date.now()}`,
      name: newProdName.trim(),
      code: newProdPatternCode.trim() ? `PC-${newProdPatternCode.trim()}` : `PC-${Math.floor(100 + Math.random() * 900)}`,
      barcode: barcodeVal,
      category: newProdCollectionName.trim() || 'Halı',
      collectionName: newProdCollectionName.trim() || 'Özel Koleksiyon',
      patternCode: newProdPatternCode.trim() || 'DSN-101',
      dimensions: newProdDimensions.trim() || '200x300 cm',
      purchasePrice: parseFloat(newProdPurchasePrice) || 0,
      purchaseCurrency: newProdPurchaseCurrency,
      vatOption: newProdVatOption,
      salesCurrency: 'TL',
      pricePerM2: 1250,
      stockM2: totalM2Calculated,
      pileHeightMm: 10,
      densityPoints: 1200000,
      fiberType: 'bambu_ipek',
      colorVariants: ['Vizon', 'Sedef'],
      description: `Elle tanımlanan ${newProdCollectionName} koleksiyonu. Desen: ${newProdPatternCode}, Ölçü: ${newProdDimensions}. Stok: ${pieces} Adet (${totalM2Calculated} m²).`,
      image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80',
    };

    onUpdateProducts([newProduct, ...products]);
    setSelectedProduct(newProduct);
    setIsNewProductModalOpen(false);

    const newLog: StockMovementLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('tr-TR'),
      productCode: newProduct.code,
      productName: newProduct.name,
      barcode: newProduct.barcode || barcodeVal,
      type: 'in',
      quantityM2: totalM2Calculated,
      previousStockM2: 0,
      newStockM2: totalM2Calculated,
      reason: `Elle Tanımlama ve Doğrudan Stok Girişi (${pieces} Adet / ${newProduct.dimensions})`,
      operator: currentUser?.name || 'Kadir KORKMAZ',
    };
    setMovementsLog([newLog, ...movementsLog]);
    showToast('success', `Yeni ürün "${newProduct.name}" (${pieces} adet, ${totalM2Calculated} m²) doğrudan stoğa eklendi!`);
  };

  // Add Company - Product Price Agreement
  const handleCreateCompanyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim() || !newCompProductName.trim() || !newCompUnitPrice.trim()) {
      showToast('error', 'Lütfen firma adı, ürün adı ve fiyat tutarını doldurunuz.');
      return;
    }

    const newItem: CompanyProductPrice = {
      id: `cpp-${Date.now()}`,
      companyName: newCompName.trim(),
      companyType: newCompType,
      productName: newCompProductName.trim(),
      unitPrice: parseFloat(newCompUnitPrice) || 0,
      currency: newCompCurrency,
      priceType: newCompPriceType,
      vatOption: newCompVat,
      notes: newCompNotes.trim() || undefined,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    setCompanyPrices([newItem, ...companyPrices]);
    setNewCompName('');
    setNewCompProductName('');
    setNewCompUnitPrice('');
    setNewCompNotes('');
    showToast('success', `"${newItem.companyName}" için özel ${newItem.priceType === 'alis' ? 'alış' : 'satış'} fiyatı eklendi!`);
  };

  // Delete Company Price Record
  const handleDeleteCompanyPrice = (id: string) => {
    if (window.confirm('Bu firma fiyat kaydını silmek istediğinize emin misiniz?')) {
      setCompanyPrices(companyPrices.filter((c) => c.id !== id));
      showToast('info', 'Firma fiyat kaydı silindi.');
    }
  };

  // Clear all demo products from system
  const handleClearAllDemoProducts = () => {
    if (window.confirm('Sistemdeki tüm varsayılan demo/örnek ürünleri silmek istediğinize emin misiniz?')) {
      const nonDemo = products.filter((p) => !DEMO_PRODUCT_IDS.includes(p.id) && !p.id.startsWith('PROD-0'));
      onUpdateProducts(nonDemo);
      if (selectedProduct && (DEMO_PRODUCT_IDS.includes(selectedProduct.id) || selectedProduct.id.startsWith('PROD-0'))) {
        setSelectedProduct(nonDemo[0] || null);
      }
      showToast('info', 'Tüm demo ürünler sistemden temizlendi!');
    }
  };

  // EAN-13 Checksum Calculation & Auto Turkish 869 Generator
  const calculateEan13Checksum = (digits12: string): string => {
    const clean = digits12.replace(/\D/g, '').padEnd(12, '0').slice(0, 12);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const d = parseInt(clean[i], 10);
      sum += i % 2 === 0 ? d : d * 3;
    }
    const checksum = (10 - (sum % 10)) % 10;
    return clean + checksum;
  };

  const generateRandomTurkishEan13 = (): string => {
    const prefix = '86990';
    const middle = Math.floor(1000000 + Math.random() * 9000000).toString();
    return calculateEan13Checksum(prefix + middle);
  };

  // Auto assign GS1 EAN-13 to all missing products
  const handleAutoAssignEanToAllMissing = () => {
    const missing = products.filter((p) => !p.barcode || !p.barcode.trim());
    if (missing.length === 0) {
      showToast('info', 'Barkodsuz ürün bulunamadı. Tüm ürünlerin zaten tanımlı bir barkod numarası mevcut.');
      return;
    }
    if (window.confirm(`${missing.length} adet barkodsuz ürüne otomatik Türkiye GS1 EAN-13 (869...) barkodları atansın mı?`)) {
      const updated = products.map((p) => {
        if (!p.barcode || !p.barcode.trim()) {
          return { ...p, barcode: generateRandomTurkishEan13() };
        }
        return p;
      });
      onUpdateProducts(updated);
      showToast('success', `${missing.length} adet barkodsuz ürüne otomatik GS1 EAN-13 barkodu atandı!`);
    }
  };

  // Inline Barcode Edit Save
  const handleSaveInlineBarcode = (productId: string, newBcVal: string) => {
    const clean = newBcVal.trim();
    if (!clean) {
      showToast('error', 'Barkod numarası boş olamaz.');
      return;
    }
    const updated = products.map((p) => (p.id === productId ? { ...p, barcode: clean } : p));
    onUpdateProducts(updated);
    setEditingBarcodeProductId(null);
    showToast('success', 'Ürün barkod numarası başarıyla güncellendi.');
  };

  // Batch Barcode Matching & Assign
  const handleApplyBatchBarcodeMatch = () => {
    if (!batchPasteInput.trim()) {
      showToast('error', 'Lütfen eşleştirilecek ürün kodları ve barkodları giriniz.');
      return;
    }
    const lines = batchPasteInput.split(/\r?\n/);
    let matchedCount = 0;
    const updated = [...products];

    lines.forEach((line) => {
      const parts = line.split(/[,;\t|]+/).map((s) => s.trim());
      if (parts.length >= 2) {
        const key = parts[0];
        const newBc = parts[1];
        if (key && newBc) {
          const idx = updated.findIndex(
            (p) => p.code.toLowerCase() === key.toLowerCase() || p.name.toLowerCase() === key.toLowerCase() || p.id.toLowerCase() === key.toLowerCase()
          );
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], barcode: newBc };
            matchedCount++;
          }
        }
      }
    });

    if (matchedCount > 0) {
      onUpdateProducts(updated);
      showToast('success', `Toplu işlem başarılı! ${matchedCount} ürünün barkodu güncellendi.`);
      setBatchPasteInput('');
    } else {
      showToast('error', 'Eşleşen ürün kodu bulunamadı. Lütfen "ÜrünKodu, Barkod" formatında giriniz.');
    }
  };

  // Trigger System Browser Print
  const handlePrintLabel = () => {
    setPrintCopies(1);
    setIsPrintModalOpen(true);
  };

  const handleExecutePrint = () => {
    document.body.classList.add('printing-barcode');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-barcode');
    }, 1000);
  };

  // Filtered selector list
  const selectorProducts = hideDemoProductsInSelector
    ? products.filter((p) => !DEMO_PRODUCT_IDS.includes(p.id) && !p.id.startsWith('PROD-0'))
    : products;

  return (
    <div id="barcode-scanner-view" className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-white font-bold text-xs shadow-lg flex items-center justify-between animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-600'
              : notification.type === 'error'
              ? 'bg-rose-600'
              : 'bg-indigo-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-white" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-white hover:opacity-80 font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'scanner'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ScanBarcode className="w-4 h-4 text-indigo-400" />
            <span>Barkod Okutma & Stok Terminali</span>
          </button>

          <button
            onClick={() => setActiveTab('definition')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'definition'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Tag className="w-4 h-4 text-emerald-400" />
            <span>Barkod Tanımlama & Elle Giriş Katalogu</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-1.5 py-0.5 rounded-md">
              {products.filter((p) => !!p.barcode && p.barcode.trim() !== '').length} / {products.length} Barkodlu
            </span>
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'batch'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            <span>Toplu Barkod Yapıştır & Eşleştir</span>
          </button>

          <button
            onClick={() => setActiveTab('company_prices')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'company_prices'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Firma - Ürün Alış/Satış Fiyat Listesi</span>
            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-1.5 py-0.5 rounded-md">
              {companyPrices.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGs1ModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>online.gs1tr.org Portalı</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Scanner View */}
      {activeTab === 'scanner' && (
        <div className="space-y-6">
          {/* Top Banner & Scanner Controls */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ScanBarcode className="w-5 h-5 text-indigo-600" /> Barkod Okutma & Stok Giriş Terminali
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              El tipi barkod okuyucu (USB/Bluetooth) veya arama alanına barkod girerek anında m² stok girişi ve çıkışı yapın.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                soundEnabled
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
              title="Okutma Sesini Aç/Kapat"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-600" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? 'Ses Açık' : 'Sessiz'}</span>
            </button>

            <button
              onClick={() => setIsCameraActive(!isCameraActive)}
              className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isCameraActive
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
              }`}
            >
              <Camera className="w-4 h-4 text-indigo-600" />
              <span>{isCameraActive ? 'Kamerayı Kapat' : 'Kamera / Optik Tara'}</span>
            </button>

            <button
              onClick={() => setIsGs1ModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="https://online.gs1tr.org portalından EAN kodlarını otomatik çek ve senkronize et"
            >
              <Globe className="w-4 h-4 text-emerald-200" />
              <span>online.gs1tr.org EAN Çek</span>
            </button>

            <button
              onClick={handleScanRandomProduct}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Rastgele Örnek Okut</span>
            </button>
          </div>
        </div>

        {/* Live Camera Simulation Header if active */}
        {isCameraActive && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-3 relative overflow-hidden">
            <div className="w-full max-w-sm h-36 mx-auto bg-slate-900 border-2 border-dashed border-indigo-500/60 rounded-xl flex flex-col items-center justify-center relative">
              <div className="w-3/4 h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse" />
              <ScanBarcode className="w-12 h-12 text-slate-700 absolute opacity-30" />
              <span className="text-[11px] font-mono text-indigo-300 font-bold mt-4 bg-slate-950/80 px-2 py-1 rounded">
                Kamera Aktif: Barkodu Kırmızı Çizgiye Hizalayın
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Not: USB Barkod Okuyucu kullanıyorsanız kameraya gerek kalmadan doğrudan klavyeden okutabilirsiniz.
            </p>
          </div>
        )}

        {/* Barcode Form Input Search */}
        <form onSubmit={handleBarcodeSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <ScanBarcode className="w-5 h-5 text-indigo-600 absolute left-3 top-3" />
            <input
              type="text"
              value={scannedBarcode}
              onChange={(e) => setScannedBarcode(e.target.value)}
              placeholder="Barkod (EAN-13) okutun veya ürün kodu girin (ör: 8699010020012 veya PC-SILK-01)"
              className="w-full bg-slate-50 border border-slate-300 font-mono font-bold text-sm pl-10 pr-4 py-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Search className="w-4 h-4 text-indigo-400" />
            <span>Barkod Sorgula</span>
          </button>
        </form>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Product Card & Quick Adjust */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProduct ? (
            <div className="bg-white border-2 border-indigo-500/40 rounded-xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      {selectedProduct.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">{selectedProduct.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="bg-slate-900 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                        {selectedProduct.code}
                      </span>
                      <span className="bg-indigo-50 text-indigo-700 font-mono font-bold text-[11px] px-2 py-0.5 rounded border border-indigo-200">
                        EAN: {selectedProduct.barcode || 'Belirtilmemiş'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right bg-emerald-50 border border-emerald-200 p-3 rounded-xl shrink-0">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Mevcut Toplam Stok</span>
                  <span className="text-2xl font-black font-mono text-emerald-600">
                    {selectedProduct.stockM2 || 0} <span className="text-xs font-bold text-emerald-700">m²</span>
                  </span>
                </div>
              </div>

              {/* Specs Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono">
                <div>
                  <span className="text-slate-400 block font-sans text-[11px]">Birim Fiyat:</span>
                  <span className="text-slate-900 font-bold">{selectedProduct.pricePerM2?.toLocaleString('tr-TR')} ₺/m²</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans text-[11px]">Hav Yüksekliği:</span>
                  <span className="text-slate-900 font-bold">{selectedProduct.pileHeightMm || 10} mm</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans text-[11px]">Dokuma Sıklığı:</span>
                  <span className="text-slate-900 font-bold">{selectedProduct.densityPoints?.toLocaleString('tr-TR') || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans text-[11px]">Renk Çeşitleri:</span>
                  <span className="text-slate-900 font-bold">{selectedProduct.colorVariants?.length || 1} Renk</span>
                </div>
              </div>

              {/* Fast Stock Giriş / Çıkış Action Box */}
              <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-indigo-600" />
                  Hızlı Stok Ekleme / Düşme İşlemi
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Miktar (Metrekare - m²):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="1"
                        value={quantityInput}
                        onChange={(e) => setQuantityInput(e.target.value)}
                        className="w-full bg-white border border-slate-300 font-mono font-bold text-base p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-500 font-mono">m²</span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2">
                      {['10', '25', '50', '100', '250'].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setQuantityInput(preset)}
                          className={`text-[11px] font-mono font-bold px-2 py-1 rounded border transition-all cursor-pointer ${
                            quantityInput === preset
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          +{preset}m²
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      İşlem Nedeni / Açıklaması:
                    </label>
                    <select
                      value={movementReason}
                      onChange={(e) => setMovementReason(e.target.value)}
                      className="w-full bg-white border border-slate-300 font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Fabrika Ambar Girişi">Fabrika Ambar Girişi (+)</option>
                      <option value="Tedarikçi Alış Faturası Girişi">Tedarikçi Alış Faturası Girişi (+)</option>
                      <option value="Sayım Fazlası Düzeltme">Sayım Fazlası Düzeltme (+)</option>
                      <option value="Müşteri Siparişi Sevk">Müşteri Siparişi Sevk (-)</option>
                      <option value="Mağaza / Mağaza Sevk">Mağaza / Şube Sevk (-)</option>
                      <option value="Hasar / Defo Fire Çıkışı">Hasar / Defo Fire Çıkışı (-)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    onClick={() => handleStockAdjustment('in')}
                    className="w-full sm:w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <ArrowDownLeft className="w-4 h-4 text-emerald-100" />
                    <span>+{quantityInput || 0} m² Stok Girişi Yap (Ekle)</span>
                  </button>

                  <button
                    onClick={() => handleStockAdjustment('out')}
                    className="w-full sm:w-1/2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <ArrowUpRight className="w-4 h-4 text-rose-100" />
                    <span>-{quantityInput || 0} m² Stok Çıkışı Yap (Düş)</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-indigo-100">
                  <button
                    type="button"
                    onClick={() => {
                      setScanIntakeProduct(selectedProduct);
                      setScanIntakeDimensions(selectedProduct.dimensions || '200x300 cm');
                      setScanIntakeUnitPrice(String(selectedProduct.purchasePrice || 450));
                      setScanIntakeCurrency(selectedProduct.purchaseCurrency || 'TL');
                      setScanIntakeVat(selectedProduct.vatOption || 'kdv_20');
                      setScanIntakePieceQuantity('1');
                      setIsScanIntakeModalOpen(true);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <PackageCheck className="w-4 h-4 text-emerald-300" />
                    <span>Detaylı Ölçü & Adet Onayı İle İçeri Alış Yap</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center space-y-4">
              <ScanBarcode className="w-14 h-14 text-indigo-400 mx-auto opacity-60" />
              <div>
                <h3 className="text-base font-bold text-slate-800">Okutulmuş Ürün Bekleniyor</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Yukarıdaki arama kutusuna el tipi okuyucu ile barkod okutun veya listedeki ürün barkodlarından birini seçin.
                </p>
              </div>

              {scannedBarcode && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl max-w-md mx-auto text-left space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>"{scannedBarcode}" Barkodu Stokta Bulunamadı</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Bu barkod numarası sistemde tanımlı değil. Hemen yeni ürün oluşturup stoğa ekleyebilirsiniz.
                  </p>
                  <button
                    onClick={() => {
                      setNewProdName(`Halı Serisi (${scannedBarcode.slice(-4)})`);
                      setIsNewProductModalOpen(true);
                    }}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Bu Barkod İle Yeni Halı Ürünü Oluştur</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Catalog Quick Pick List & Demo Removal Header */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                Stoktaki Ürünlerden Hızlı Barkod Seç
              </h4>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHideDemoProductsInSelector(!hideDemoProductsInSelector)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    hideDemoProductsInSelector
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                  title="Demoları gizle/göster"
                >
                  {hideDemoProductsInSelector ? 'Demolar Gizli' : 'Demoları Gizle'}
                </button>

                <button
                  onClick={handleDeleteDemoProducts}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  title="Tüm varsayılan demo ürünleri kalıcı olarak sil"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Demoları Sil</span>
                </button>
              </div>
            </div>

            {selectorProducts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 font-medium">
                Seçilen filtreye uygun stok ürünü bulunamadı.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {selectorProducts.map((p) => {
                  const isDemo = DEMO_PRODUCT_IDS.includes(p.id) || p.id.startsWith('PROD-0');

                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProduct(p);
                        setScannedBarcode(p.barcode || p.code);
                        playBeepSound();
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        selectedProduct?.id === p.id
                          ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/20'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {isDemo && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1 rounded">Demo</span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>KOD: {p.code}</span>
                          <span>•</span>
                          <span>BC: {p.barcode || 'Yok'}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black font-mono text-emerald-600">{p.stockM2 || 0} m²</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Printable Label Preview & Customizer */}
        <div className="space-y-6">
          {/* Active Interactive Barcode Label Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-indigo-600" />
                Barkod Etiketi Önizleme
              </h4>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsLabelEditModalOpen(true)}
                  className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-300 transition-all flex items-center gap-1 cursor-pointer"
                  title="Etiket metinlerini ve koleksiyon adını düzenle"
                >
                  <Edit className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Düzenle</span>
                </button>

                <button
                  onClick={handlePrintLabel}
                  className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-white" />
                  <span>Yazdır & Ayarlar</span>
                </button>
              </div>
            </div>

            {/* Label Size Preset Tabs */}
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 text-[11px]">
              <span className="text-slate-400 font-bold text-[10px] uppercase shrink-0">Ölçü:</span>
              {[
                { id: '4x4', name: '4x4 cm' },
                { id: '2x2', name: '2x2 cm' },
                { id: '5x3', name: '5x3 cm' },
                { id: '10x5', name: '10x5 cm' },
              ].map((sz) => (
                <button
                  key={sz.id}
                  onClick={() => setLabelSizePreset(sz.id as any)}
                  className={`px-2 py-0.5 rounded border font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                    labelSizePreset === sz.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sz.name}
                </button>
              ))}
            </div>

            {/* Dynamic Customizable Label Canvas Box */}
            <div className="bg-slate-100 border-2 border-dashed border-slate-300 p-4 rounded-xl text-center space-y-2 relative group overflow-hidden">
              <button
                onClick={() => setIsLabelEditModalOpen(true)}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-slate-700 p-1.5 rounded-lg shadow-xs opacity-0 group-hover:opacity-100 transition-all cursor-pointer text-[10px] font-bold flex items-center gap-1 border border-slate-200"
              >
                <Sliders className="w-3 h-3 text-indigo-600" />
                Dizayn Et
              </button>

              {/* Company / Brand Name */}
              {showLabelBrand && (
                <div className="font-extrabold text-sm text-slate-900 tracking-wider uppercase border-b border-slate-200/60 pb-1">
                  {labelBrand}
                </div>
              )}

              {/* Collection Name */}
              {showLabelCollection && (
                <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide">
                  {labelCollection}
                </div>
              )}

              {/* Product Name */}
              <div className="text-xs font-black text-slate-900 leading-tight">
                {labelProductName}
              </div>

              {/* Code */}
              {showLabelCode && (
                <div className="text-[10px] font-mono text-slate-500">
                  KOD: <span className="font-bold text-slate-800">{labelProductCode}</span>
                </div>
              )}

              {/* Barcode Lines Visual */}
              <div className="bg-white border border-slate-300 p-2.5 rounded-lg inline-block my-1 shadow-2xs w-full max-w-[210px]">
                <div className="flex justify-between items-center h-10 px-1">
                  {[...Array(30)].map((_, i) => (
                    <div
                      key={i}
                      className="h-full bg-slate-950"
                      style={{ width: i % 3 === 0 ? '3px' : i % 5 === 0 ? '1px' : '2px' }}
                    />
                  ))}
                </div>
                <div className="text-[11px] font-mono font-bold tracking-widest text-slate-900 mt-1">
                  {labelBarcodeNo}
                </div>
              </div>

              {/* Price & Note */}
              <div className="space-y-0.5">
                {showLabelPrice && (
                  <div className="text-xs font-extrabold text-slate-900 font-mono">
                    {labelPriceText}
                  </div>
                )}

                {showLabelNote && (
                  <div className="text-[10px] text-slate-500 font-sans italic">
                    {labelNoteText}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Field Toggles */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-600 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLabelCollection}
                  onChange={(e) => setShowLabelCollection(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Koleksiyon İsmi</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLabelPrice}
                  onChange={(e) => setShowLabelPrice(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Fiyat Bilgisi</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLabelNote}
                  onChange={(e) => setShowLabelNote(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Ek Not / Özellik</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLabelBrand}
                  onChange={(e) => setShowLabelBrand(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Firma / Marka</span>
              </label>
            </div>
          </div>

          {/* Movement History Log */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-600" />
                Son Stok Hareketleri Geçmişi
              </h4>
              <span className="text-[10px] font-mono text-slate-400">{movementsLog.length} Kayıt</span>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-xs">
              {movementsLog.map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{log.productName}</span>
                    <span
                      className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                        log.type === 'in'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {log.type === 'in' ? `+${log.quantityM2} m²` : `-${log.quantityM2} m²`}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 flex items-center justify-between font-mono">
                    <span>{log.reason}</span>
                    <span>{log.timestamp}</span>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span>Stok: {log.previousStockM2} → {log.newStockM2} m²</span>
                    <span>İşlem: {log.operator}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

      {/* Tab 2: Barcode Definition & Manual Entry Catalog */}
      {activeTab === 'definition' && (
        <div className="space-y-6 animate-fade-in">
          {/* Definition Header & Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-emerald-600" /> Ürün Barkod Tanımlama & Elle Giriş Katalogu
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Katalogunuzdaki ürünlere tek tek elle barkod (EAN-13 / GTIN) tanımlayabilir, rastgele 869 GS1 barkodu üretebilir veya toplu atama yapabilirsiniz.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleAutoAssignEanToAllMissing}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Tüm Barkodsuzlara Otomatik GS1 (869) Ata</span>
                </button>

                <button
                  onClick={() => {
                    setNewProdName('');
                    setNewProdPieceQuantity('10');
                    setIsNewProductModalOpen(true);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>+ Elle Yeni Ürün & Barkod Tanımla</span>
                </button>

                <button
                  onClick={handleClearAllDemoProducts}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Varsayılan demo ve örnek ürünlerin tamamını sistemden siler"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Demoları Komple Sil</span>
                </button>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={definitionSearchQuery}
                  onChange={(e) => setDefinitionSearchQuery(e.target.value)}
                  placeholder="Ürün adı, koleksiyon veya barkod no ile süzün..."
                  className="w-full bg-slate-50 border border-slate-200 font-bold text-xs pl-9 pr-4 py-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => setDefinitionBarcodeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    definitionBarcodeFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tümü ({products.length})
                </button>
                <button
                  onClick={() => setDefinitionBarcodeFilter('without')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    definitionBarcodeFilter === 'without'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Barkodsuzlar ({products.filter((p) => !p.barcode || p.barcode.trim() === '').length})
                </button>
                <button
                  onClick={() => setDefinitionBarcodeFilter('with')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    definitionBarcodeFilter === 'with'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Barkodlular ({products.filter((p) => !!p.barcode && p.barcode.trim() !== '').length})
                </button>
              </div>
            </div>
          </div>

          {/* Product Barcode Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products
              .filter((p) => {
                const matchesSearch =
                  p.name.toLowerCase().includes(definitionSearchQuery.toLowerCase()) ||
                  p.code.toLowerCase().includes(definitionSearchQuery.toLowerCase()) ||
                  (p.barcode && p.barcode.toLowerCase().includes(definitionSearchQuery.toLowerCase())) ||
                  p.category.toLowerCase().includes(definitionSearchQuery.toLowerCase());

                if (!matchesSearch) return false;
                if (definitionBarcodeFilter === 'with') return !!p.barcode && p.barcode.trim() !== '';
                if (definitionBarcodeFilter === 'without') return !p.barcode || p.barcode.trim() === '';
                return true;
              })
              .map((p) => {
                const isEditingThis = editingBarcodeProductId === p.id;
                const hasBarcode = !!p.barcode && p.barcode.trim() !== '';

                return (
                  <div
                    key={p.id}
                    className={`bg-white border rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between space-y-3 ${
                      hasBarcode ? 'border-slate-200 hover:border-indigo-300' : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.imageUrl || 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=200&q=80'}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
                          />
                          <div>
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide block">
                              {p.category}
                            </span>
                            <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{p.name}</h4>
                            <span className="text-[11px] font-mono text-slate-500 font-bold block">
                              Kod: {p.code}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            hasBarcode ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {hasBarcode ? 'Barkod Var' : 'Barkod Yok'}
                        </span>
                      </div>

                      {/* Barcode Section / Inline Editor */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                          <span>Barkod Numarası:</span>
                          {!isEditingThis && (
                            <button
                              onClick={() => {
                                setEditingBarcodeProductId(p.id);
                                setEditingBarcodeValue(p.barcode || '');
                              }}
                              className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Edit className="w-3 h-3" /> Düzenle
                            </button>
                          )}
                        </div>

                        {isEditingThis ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={editingBarcodeValue}
                                onChange={(e) => setEditingBarcodeValue(e.target.value)}
                                placeholder="EAN-13 barkod girin"
                                className="flex-1 bg-white border border-indigo-400 font-mono font-bold text-xs p-2 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => setEditingBarcodeValue(generateRandomTurkishEan13())}
                                className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 p-2 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                                title="Rastgele Türkiye GS1 (869) EAN-13 Üret"
                              >
                                🎲 869 Üret
                              </button>
                            </div>

                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingBarcodeProductId(null)}
                                className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg cursor-pointer"
                              >
                                İptal
                              </button>
                              <button
                                onClick={() => handleSaveInlineBarcode(p.id, editingBarcodeValue)}
                                className="px-3 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-2xs cursor-pointer flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" /> Kaydet
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-sm text-slate-900 tracking-wider">
                              {hasBarcode ? p.barcode : '— Tanımsız —'}
                            </span>
                            {hasBarcode && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(p.barcode || '');
                                  showToast('success', 'Barkod kopyalandı.');
                                }}
                                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                                title="Barkodu Kopyala"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Product Specifications Badge Block (1-Koleksiyon, 2-Desen, 3-Ölçü, 4-Alış Fiyatı & KDV) */}
                      <div className="bg-slate-100/80 border border-slate-200/80 rounded-xl p-2.5 text-[11px] space-y-1.5">
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                          <div>
                            <span className="text-slate-500 font-medium block text-[10px]">1- Koleksiyon:</span>
                            <span className="font-bold text-slate-800 line-clamp-1">{p.collectionName || p.category || 'Bambu İpek'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium block text-[10px]">2- Desen Kodu:</span>
                            <span className="font-mono font-bold text-indigo-700">{p.patternCode || p.code}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium block text-[10px]">3- Ölçüsü:</span>
                            <span className="font-bold text-slate-800">{p.dimensions || '200x300 cm'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium block text-[10px]">4- Alış Fiyatı:</span>
                            <span className="font-mono font-bold text-emerald-700">
                              {p.purchaseCurrency === 'USD' ? '$' : p.purchaseCurrency === 'EUR' ? '€' : '₺'}
                              {p.purchasePrice ? p.purchasePrice.toLocaleString('tr-TR') : '450'}
                            </span>
                          </div>
                        </div>

                        {/* VAT Badge */}
                        <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-semibold">Vergi Durumu:</span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {p.vatOption === 'kdv_10'
                              ? '%10 KDV'
                              : p.vatOption === 'ihrac_kayitli'
                              ? 'İhraç Kayıtlı (%0)'
                              : '%20 KDV'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 font-bold px-1">
                        <span>Stok: <strong className="text-slate-900 font-mono">{p.stockM2} m²</strong></span>
                        <span>Satış: <strong className="text-indigo-700 font-mono">{p.pricePerM2?.toLocaleString('tr-TR')} ₺/m²</strong></span>
                      </div>
                    </div>

                    {/* Footer Action */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setLabelProductName(p.name);
                          setLabelProductCode(p.code);
                          setLabelCollection(`${p.category} Koleksiyonu`);
                          setLabelBarcodeNo(p.barcode || generateRandomTurkishEan13());
                          setLabelPriceText(`${p.pricePerM2?.toLocaleString('tr-TR') || 1250} ₺ / m²`);
                          setIsPrintModalOpen(true);
                        }}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Etiket Bastır</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Tab 3: Batch Barcode Paste & Match */}
      {activeTab === 'batch' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6 animate-fade-in">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" /> Toplu Barkod Yapıştır & Eşleştir
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Excel veya Word listenizdeki <strong>"Ürün Kodu, Barkod"</strong> veya <strong>"Ürün Adı, Barkod"</strong> verilerini kopyalayıp aşağıdaki alana yapıştırarak tüm ürünlerinize saniyeler içinde toplu barkod tanımlayın.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-800 block">
              Toplu Veri Alanı (Her Satıra Bir Ürün & Barkod):
            </label>
            <textarea
              rows={8}
              value={batchPasteInput}
              onChange={(e) => setBatchPasteInput(e.target.value)}
              placeholder={`Örnek Format (Virgül, Noktalı Virgül veya Tab ile ayrılmış):
PC-SILK-01, 8699010020012
PC-SILK-02, 8699010020029
PC-WOOL-01, 8699010020036
Bambu Yün Anatolia, 8699010020043`}
              className="w-full bg-slate-50 border border-slate-300 font-mono text-xs p-4 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Girilen Satır Sayısı: <strong>{batchPasteInput.split(/\r?\n/).filter((l) => l.trim()).length}</strong>
            </span>

            <button
              onClick={handleApplyBatchBarcodeMatch}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 text-white" />
              <span>Toplu Barkod Güncellemesini Uygula</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Company - Product Price Agreements List */}
      {activeTab === 'company_prices' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Info Banner & Add Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-600" /> Firma & Tedarikçi Özel Ürün Alış/Satış Fiyat Listesi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hangi firmanın, tedarikçinin veya müşterinin hangi ürünü ne kadardan aldığını/sattığını (TL, Dolar, Euro, Pound) ve KDV eklemelerini (+%10, +%20) listeleyin.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Toplam {companyPrices.length} Kayıtlı Anlaşma</span>
              </div>
            </div>

            {/* Form for Adding New Company Price */}
            <form onSubmit={handleCreateCompanyPrice} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                <Plus className="w-4 h-4 text-amber-600" /> Yeni Firma - Ürün Özel Fiyat Anlaşması Ekle
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Company Name & Type */}
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Firma / Müşteri / Tedarikçi Adı <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newCompName}
                      onChange={(e) => setNewCompName(e.target.value)}
                      placeholder="ör: Gaziantep İplik & Tekstil A.Ş."
                      className="w-full bg-white border border-slate-300 font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  {/* Quick Company Suggestions */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-bold">Öneri:</span>
                    {['Gaziantep İplik A.Ş.', 'Saray Halı A.Ş.', 'Marmara Mağazaları', 'Yurt Dışı Müşterisi'].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setNewCompName(sug)}
                        className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded hover:bg-slate-100 cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">Firma Tipi:</label>
                    <select
                      value={newCompType}
                      onChange={(e) => setNewCompType(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 font-bold text-xs p-2.5 rounded-xl text-slate-900"
                    >
                      <option value="tedarikci">Tedarikçi (Hammadde / Halı Satıcısı)</option>
                      <option value="musteri">Müşteri / Bayi (Satış Yapılan Firma)</option>
                      <option value="fasoncu">Fason Üretici / Atölye</option>
                    </select>
                  </div>
                </div>

                {/* Product Selection & Price Type */}
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Ürün / Koleksiyon / Desen <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newCompProductName}
                      onChange={(e) => setNewCompProductName(e.target.value)}
                      placeholder="ör: Bambu İpek - DSN-101 (200x300 cm)"
                      className="w-full bg-white border border-slate-300 font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  {/* Existing Product Chips */}
                  {products.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap max-h-16 overflow-y-auto">
                      <span className="text-[10px] text-slate-400 font-bold shrink-0">Katalogtan Seç:</span>
                      {products.slice(0, 5).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setNewCompProductName(`${p.collectionName || p.category} - ${p.patternCode || p.code}`)}
                          className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded hover:bg-indigo-100 cursor-pointer truncate max-w-[140px]"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">İşlem Tipi:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewCompPriceType('alis')}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          newCompPriceType === 'alis'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Alış Fiyatı (Biz Alıyoruz)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCompPriceType('satis')}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          newCompPriceType === 'satis'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Satış Fiyatı (Biz Satıyoruz)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Amount, Currency & VAT */}
                <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-800 block mb-1">Birim Fiyat Tutarı:</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newCompUnitPrice}
                        onChange={(e) => setNewCompUnitPrice(e.target.value)}
                        placeholder="450"
                        className="w-full bg-slate-50 border border-slate-300 font-mono font-bold text-xs p-2.5 rounded-xl text-slate-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-800 block mb-1">Para Birimi:</label>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { id: 'TL', label: '₺' },
                          { id: 'USD', label: '$' },
                          { id: 'EUR', label: '€' },
                          { id: 'GBP', label: '£' },
                        ].map((curr) => (
                          <button
                            key={curr.id}
                            type="button"
                            onClick={() => setNewCompCurrency(curr.id as any)}
                            className={`py-2 text-[10px] font-bold rounded-lg border transition-all cursor-pointer text-center ${
                              newCompCurrency === curr.id
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {curr.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-800 block mb-1">KDV / Vergi Oranı:</label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'kdv_10', label: '%10 KDV' },
                        { id: 'kdv_20', label: '%20 KDV' },
                        { id: 'ihrac_kayitli', label: 'İhraç Kayıtlı (%0)' },
                      ].map((vat) => (
                        <button
                          key={vat.id}
                          type="button"
                          onClick={() => setNewCompVat(vat.id as any)}
                          className={`py-1.5 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer text-center ${
                            newCompVat === vat.id
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {vat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live VAT Calculation Preview */}
                  {(() => {
                    const priceVal = parseFloat(newCompUnitPrice) || 0;
                    const currSym = newCompCurrency === 'USD' ? '$' : newCompCurrency === 'EUR' ? '€' : newCompCurrency === 'GBP' ? '£' : '₺';
                    const vatRate = newCompVat === 'kdv_10' ? 0.10 : newCompVat === 'kdv_20' ? 0.20 : 0;
                    const vatAmt = priceVal * vatRate;
                    const totalWithVat = priceVal + vatAmt;

                    return (
                      <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg text-[11px] font-mono font-bold text-amber-900 flex items-center justify-between">
                        <span>
                          {newCompVat === 'kdv_10' && '+ %10 KDV Dahil:'}
                          {newCompVat === 'kdv_20' && '+ %20 KDV Dahil:'}
                          {newCompVat === 'ihrac_kayitli' && 'İhraç Kayıtlı (%0):'}
                        </span>
                        <span className="text-xs font-black text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                          {totalWithVat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currSym}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <input
                  type="text"
                  value={newCompNotes}
                  onChange={(e) => setNewCompNotes(e.target.value)}
                  placeholder="Sipariş / anlaşma notu veya teslimat koşulu ekleyin (isteğe bağlı)..."
                  className="w-full max-w-md bg-white border border-slate-300 font-bold text-xs p-2.5 rounded-xl text-slate-900 mr-2"
                />

                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-white" />
                  <span>Fiyat Anlaşmasını Kaydet</span>
                </button>
              </div>
            </form>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={compPriceSearchQuery}
                  onChange={(e) => setCompPriceSearchQuery(e.target.value)}
                  placeholder="Firma adı, ürün veya notlarda ara..."
                  className="w-full bg-slate-50 border border-slate-200 font-bold text-xs pl-9 pr-4 py-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                {[
                  { id: 'all', label: 'Tümü' },
                  { id: 'tedarikci', label: 'Tedarikçiler' },
                  { id: 'musteri', label: 'Müşteriler' },
                  { id: 'alis', label: 'Alış Fiyatları' },
                  { id: 'satis', label: 'Satış Fiyatları' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setCompTypeFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      compTypeFilter === f.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List Table / Cards */}
            <div className="space-y-3">
              {companyPrices
                .filter((cp) => {
                  const matchSearch =
                    cp.companyName.toLowerCase().includes(compPriceSearchQuery.toLowerCase()) ||
                    cp.productName.toLowerCase().includes(compPriceSearchQuery.toLowerCase()) ||
                    (cp.notes && cp.notes.toLowerCase().includes(compPriceSearchQuery.toLowerCase()));

                  if (!matchSearch) return false;
                  if (compTypeFilter === 'tedarikci') return cp.companyType === 'tedarikci';
                  if (compTypeFilter === 'musteri') return cp.companyType === 'musteri';
                  if (compTypeFilter === 'alis') return cp.priceType === 'alis';
                  if (compTypeFilter === 'satis') return cp.priceType === 'satis';
                  return true;
                })
                .map((item) => {
                  const currSym = item.currency === 'USD' ? '$' : item.currency === 'EUR' ? '€' : item.currency === 'GBP' ? '£' : '₺';
                  const vatRate = item.vatOption === 'kdv_10' ? 0.10 : item.vatOption === 'kdv_20' ? 0.20 : 0;
                  const vatCalculated = item.unitPrice * (1 + vatRate);

                  return (
                    <div
                      key={item.id}
                      className="bg-slate-50 border border-slate-200 hover:border-amber-300 p-4 rounded-xl shadow-2xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              item.companyType === 'tedarikci'
                                ? 'bg-purple-100 text-purple-800'
                                : item.companyType === 'musteri'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.companyType === 'tedarikci' ? 'Tedarikçi' : item.companyType === 'musteri' ? 'Müşteri' : 'Fasoncu'}
                          </span>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              item.priceType === 'alis'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.priceType === 'alis' ? 'Alış Fiyatı' : 'Satış Fiyatı'}
                          </span>

                          <h4 className="font-bold text-sm text-slate-900">{item.companyName}</h4>
                        </div>

                        <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-slate-400" />
                          <span>Ürün: {item.productName}</span>
                        </div>

                        {item.notes && (
                          <p className="text-[11px] text-slate-500 italic font-medium">"{item.notes}"</p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 border-t md:border-t-0 border-slate-200 pt-2 md:pt-0 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Ham Birim Fiyat</span>
                          <span className="text-lg font-black font-mono text-slate-900">
                            {item.unitPrice.toLocaleString('tr-TR')} {currSym}
                          </span>

                          <span className="text-[10px] font-bold text-emerald-700 block mt-0.5 font-mono">
                            {item.vatOption === 'kdv_10' && `+%10 KDV Dahil: ${vatCalculated.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currSym}`}
                            {item.vatOption === 'kdv_20' && `+%20 KDV Dahil: ${vatCalculated.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currSym}`}
                            {item.vatOption === 'ihrac_kayitli' && `İhraç Kayıtlı (%0 KDV)`}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteCompanyPrice(item.id)}
                          className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-all cursor-pointer"
                          title="Firma Fiyat Kaydını Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

              {companyPrices.length === 0 && (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-slate-500 text-xs">
                  Henüz kaydedilmiş firma özel fiyat anlaşması bulunmuyor. Yukarıdaki formdan ekleyebilirsiniz.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Label Edit Modal */}
      {isLabelEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit className="w-4 h-4 text-indigo-400" />
                Barkod Etiketi Metin & İçerik Düzenleme
              </h3>
              <button onClick={() => setIsLabelEditModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Firma / Marka Adı:</label>
                <input
                  type="text"
                  value={labelBrand}
                  onChange={(e) => setLabelBrand(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 font-bold text-xs p-2.5 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Koleksiyon / Kategori İsmi:</label>
                <input
                  type="text"
                  value={labelCollection}
                  onChange={(e) => setLabelCollection(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 font-bold text-xs p-2.5 rounded-xl text-indigo-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Ürün / Halı Adı:</label>
                <input
                  type="text"
                  value={labelProductName}
                  onChange={(e) => setLabelProductName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 font-bold text-xs p-2.5 rounded-xl text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Ürün Kodu:</label>
                  <input
                    type="text"
                    value={labelProductCode}
                    onChange={(e) => setLabelProductCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 font-mono text-xs p-2.5 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Barkod Numarası:</label>
                  <input
                    type="text"
                    value={labelBarcodeNo}
                    onChange={(e) => setLabelBarcodeNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 font-mono text-xs p-2.5 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Fiyat Metni:</label>
                  <input
                    type="text"
                    value={labelPriceText}
                    onChange={(e) => setLabelPriceText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 font-bold text-xs p-2.5 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Ek Açıklama / Özellik:</label>
                  <input
                    type="text"
                    value={labelNoteText}
                    onChange={(e) => setLabelNoteText(e.target.value)}
                    placeholder="ör: Hav: 10mm • %100 Bambu"
                    className="w-full bg-slate-50 border border-slate-300 text-xs p-2.5 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLabelEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xs cursor-pointer"
                >
                  Tamam / Önizlemede Gör
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview & Page Layout Settings Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-6">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Barkod Etiketi Yazdırma & Sayfa Düzeni Ayarları</h3>
              </div>
              <button onClick={() => setIsPrintModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Preset Sizes Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">Etiket Ölçüsü & Kağıt Formatı Seçin:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: '100x100', label: '100mm x 100mm (10x10 cm Kare)', desc: '4x4 inç Termal Rulo Etiket (Varsayılan)' },
                    { id: '40x40', label: '40mm x 40mm (4x4 cm Kare)', desc: 'Küçük Rulo Termal Etiket' },
                    { id: '50x30', label: '50mm x 30mm (5x3 cm)', desc: 'Dikdörtgen Rulo Termal' },
                    { id: '100x50', label: '100mm x 50mm (10x5 cm)', desc: 'Koli / Ambar Etiketi' },
                    { id: '20x20', label: '20mm x 20mm (2x2 cm)', desc: 'Körlü / Mikro Etiket' },
                    { id: 'A4_4x4', label: 'A4 Sayfa (16\'lı Grid)', desc: 'A4 Lazer/Mürekkep Sayfası' },
                    { id: 'A4_3x8', label: 'A4 Sayfa (24\'lü Grid)', desc: 'A4 Lazer/Mürekkep Sayfası' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setLabelSizePreset(p.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        labelSizePreset === p.id
                          ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900">{p.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Print Copies Control */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800 block">Yazdırılacak Adet (Kopya Sayısı):</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 5, 10, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPrintCopies(num)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          printCopies === num
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {num} Adet
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={printCopies}
                      onChange={(e) => setPrintCopies(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-white border border-slate-300 font-mono font-bold text-sm p-2.5 rounded-xl text-slate-900"
                    />
                  </div>

                  <div className="text-xs font-bold text-indigo-700 bg-white p-2.5 rounded-xl border border-slate-200">
                    {labelSizePreset === '100x100' && '100mm x 100mm (10x10 cm) Kare Termal Rulo Etiket'}
                    {labelSizePreset === '40x40' && '40mm x 40mm Kare Rulo Termal Etiket'}
                    {labelSizePreset === '20x20' && '20mm x 20mm Mikro Rulo Termal Etiket'}
                    {labelSizePreset === '50x30' && '50mm x 30mm Dikdörtgen Rulo Termal Etiket'}
                    {labelSizePreset === '100x50' && '100mm x 50mm Ambar / Koli Etiketi'}
                    {labelSizePreset === 'A4_4x4' && 'A4 Sayfa - 16 Adet Etiket Grid'}
                    {labelSizePreset === 'A4_3x8' && 'A4 Sayfa - 24 Adet Etiket Grid'}
                  </div>
                </div>
              </div>

              {/* Print Preview Canvas Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 block">
                    Ekran Önizlemesi (Seçili: {printCopies} Adet Etiket):
                  </label>
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                    Sadece Etiket Yazdırılır (Tüm Sayfa Değil)
                  </span>
                </div>

                <div className="bg-slate-200 p-6 rounded-xl border border-slate-300 max-h-64 overflow-y-auto flex flex-wrap gap-4 justify-center">
                  {[...Array(Math.min(printCopies, 12))].map((_, idx) => (
                    <div
                      key={idx}
                      className={`bg-white border-2 border-slate-800 p-3 text-center rounded-lg shadow-sm flex flex-col justify-between ${
                        labelSizePreset === '100x100'
                          ? 'w-48 h-48 text-[11px]'
                          : labelSizePreset === '20x20'
                          ? 'w-24 h-24 text-[8px]'
                          : labelSizePreset === '40x40'
                          ? 'w-32 h-32 text-[9px]'
                          : labelSizePreset === '50x30'
                          ? 'w-40 h-28 text-[9px]'
                          : labelSizePreset === '100x50'
                          ? 'w-52 h-28 text-[10px]'
                          : 'w-48 h-48 text-[11px]'
                      }`}
                    >
                      <div>
                        {showLabelBrand && <div className="font-extrabold text-black uppercase tracking-tight truncate border-b border-slate-300 pb-0.5 text-[10px]">{labelBrand}</div>}
                        {showLabelCollection && <div className="text-indigo-700 font-bold truncate text-[10px] mt-0.5">{labelCollection}</div>}
                        <div className="font-black truncate text-slate-900 my-0.5">{labelProductName}</div>
                      </div>

                      <div className="my-0.5">
                        <BarcodeSvg code={labelBarcodeNo} height={labelSizePreset === '100x100' ? 36 : 28} />
                      </div>

                      {showLabelPrice && (
                        <div className="font-mono font-bold text-slate-900 text-[10px] border-t border-slate-200 pt-0.5">
                          {labelPriceText}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Print Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Kapat
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleExecutePrint();
                  }}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>Sadece Etiketi Yazdır ({printCopies} Adet)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* New Product Fast Registration Modal */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-6">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ScanBarcode className="w-4 h-4 text-indigo-400" />
                Elle Barkod & Ürün Tanımlama
              </h3>
              <button onClick={() => setIsNewProductModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFastProduct} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Barcode Number */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Barkod Numarası (GS1 / EAN-13):</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={scannedBarcode}
                    onChange={(e) => setScannedBarcode(e.target.value)}
                    placeholder="ör: 8699010020012"
                    className="flex-1 bg-slate-50 border border-slate-300 font-mono font-bold text-xs p-2.5 rounded-xl text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setScannedBarcode(generateRandomTurkishEan13())}
                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold text-xs px-3 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1"
                    title="Rastgele GS1 Türkiye (869) EAN-13 Üret"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>869 Üret</span>
                  </button>
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Ürün / Halı Adı <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="ör: PulCarpet Saf Yün Anatolia"
                  className="w-full bg-slate-50 border border-slate-300 font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* 1 - Koleksiyon Adı & Adet / Stok Miktarı */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    1. Koleksiyon Adı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProdCollectionName}
                    onChange={(e) => setNewProdCollectionName(e.target.value)}
                    placeholder="ör: Bambu İpek Koleksiyonu"
                    className="w-full bg-slate-50 border border-slate-300 font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-emerald-800 block mb-1 flex items-center justify-between">
                    <span>Eldeki Adet (Parça / Rulo) <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-bold">Direkt Stoğa İşler</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newProdPieceQuantity}
                    onChange={(e) => setNewProdPieceQuantity(e.target.value)}
                    placeholder="ör: 10"
                    className="w-full bg-emerald-50 border border-emerald-300 font-mono font-bold text-xs p-2.5 rounded-xl text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* 2 - Desen Kodu & 3 - Ölçüsü */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    2. Desen Kodu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProdPatternCode}
                    onChange={(e) => setNewProdPatternCode(e.target.value)}
                    placeholder="ör: DSN-1024 / 402-Vizon"
                    className="w-full bg-slate-50 border border-slate-300 font-mono font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    3. Ölçüsü (Ebat) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProdDimensions}
                    onChange={(e) => setNewProdDimensions(e.target.value)}
                    placeholder="ör: 200x300 cm veya 160x230 cm"
                    className="w-full bg-slate-50 border border-slate-300 font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Quick Dimension Chips & Live Calculated Stock */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-bold">Hızlı Ölçü:</span>
                  {['200x300 cm', '160x230 cm', '120x180 cm', '80x150 cm', '300x400 cm', 'Rulo / Özel'].map((dim) => (
                    <button
                      key={dim}
                      type="button"
                      onClick={() => setNewProdDimensions(dim)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                        newProdDimensions === dim
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {dim}
                    </button>
                  ))}
                </div>

                {/* Calculated Total Stock Banner */}
                {(() => {
                  const pieces = parseFloat(newProdPieceQuantity) || 1;
                  const m2Unit = calculateM2FromDimensionString(newProdDimensions);
                  const totalCalculated = Math.round(pieces * m2Unit * 100) / 100;
                  return (
                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Box className="w-4 h-4 text-emerald-600" />
                        <span>Hesaplanan Toplam Stok Miktarı ({pieces} Adet x {m2Unit} m²):</span>
                      </span>
                      <span className="text-xs font-black font-mono text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs">
                        +{totalCalculated} m²
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* 4 - Alış Fiyatı, Para Birimi & KDV Seçenekleri */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3">
                <label className="text-xs font-bold text-slate-900 block border-b border-slate-200 pb-1.5">
                  4. Alış Fiyatı, Para Birimi & Vergi (KDV)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Alış Fiyat Tutarı:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProdPurchasePrice}
                      onChange={(e) => setNewProdPurchasePrice(e.target.value)}
                      placeholder="450"
                      className="w-full bg-white border border-slate-300 font-mono font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Para Birimi Seçimi:</label>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { id: 'TL', label: '₺ TL' },
                        { id: 'USD', label: '$ USD' },
                        { id: 'EUR', label: '€ EUR' },
                        { id: 'GBP', label: '£ GBP' },
                      ].map((curr) => (
                        <button
                          key={curr.id}
                          type="button"
                          onClick={() => setNewProdPurchaseCurrency(curr.id as any)}
                          className={`py-2 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                            newProdPurchaseCurrency === curr.id
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {curr.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* KDV Options */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">KDV / Vergi Durumu:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'kdv_10', label: '%10 KDV' },
                      { id: 'kdv_20', label: '%20 KDV' },
                      { id: 'ihrac_kayitli', label: 'İhraç Kayıtlı (%0)' },
                    ].map((vat) => (
                      <button
                        key={vat.id}
                        type="button"
                        onClick={() => setNewProdVatOption(vat.id as any)}
                        className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer text-center ${
                          newProdVatOption === vat.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {vat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live KDV Calculation Banner */}
                {(() => {
                  const pPrice = parseFloat(newProdPurchasePrice) || 0;
                  const currSym = newProdPurchaseCurrency === 'USD' ? '$' : newProdPurchaseCurrency === 'EUR' ? '€' : newProdPurchaseCurrency === 'GBP' ? '£' : '₺';
                  const vatRate = newProdVatOption === 'kdv_10' ? 0.10 : newProdVatOption === 'kdv_20' ? 0.20 : 0;
                  const vatAmount = pPrice * vatRate;
                  const totalWithVat = pPrice + vatAmount;

                  return (
                    <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-xs font-mono font-bold text-amber-900 flex items-center justify-between">
                      <span>
                        {newProdVatOption === 'kdv_10' && '+ %10 KDV Eklenmiş Net Alış Fiyatı:'}
                        {newProdVatOption === 'kdv_20' && '+ %20 KDV Eklenmiş Net Alış Fiyatı:'}
                        {newProdVatOption === 'ihrac_kayitli' && 'İhraç Kayıtlı (%0 KDV):'}
                      </span>
                      <span className="text-xs font-black text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                        {totalWithVat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currSym}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>Kaydet ve Stoğa Ekle</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Scan Intake Confirmation Modal (Barkod Okutulduğunda Detay Soran Modal) */}
      {isScanIntakeModalOpen && scanIntakeProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-6">
            <div className="bg-indigo-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-400" />
                Stok İçeri Alış & Detay Onayı
              </h3>
              <button onClick={() => setIsScanIntakeModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmScanIntake} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
              {/* Product Info Banner */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center gap-3">
                <img
                  src={scanIntakeProduct.image}
                  alt={scanIntakeProduct.name}
                  className="w-14 h-14 object-cover rounded-lg border border-slate-300 shrink-0"
                />
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                      {scanIntakeProduct.code}
                    </span>
                    <span className="bg-slate-200 text-slate-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                      Barkod: {scanIntakeProduct.barcode || 'Yok'}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 truncate">{scanIntakeProduct.name}</h4>
                  <p className="text-[11px] text-slate-500">Mevcut Stok: <strong className="text-slate-900">{scanIntakeProduct.stockM2} m²</strong></p>
                </div>
              </div>

              {/* 1 - Giriş Ölçüsü & Adet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Giriş Yapılacak Ölçü (cm) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={scanIntakeDimensions}
                    onChange={(e) => setScanIntakeDimensions(e.target.value)}
                    placeholder="ör: 200x300 cm"
                    className="w-full bg-slate-50 border border-slate-300 font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-emerald-800 block mb-1">
                    Giren Adet (Parça / Rulo) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={scanIntakePieceQuantity}
                    onChange={(e) => setScanIntakePieceQuantity(e.target.value)}
                    placeholder="1"
                    className="w-full bg-emerald-50 border border-emerald-300 font-mono font-bold text-xs p-2.5 rounded-xl text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Quick Dimension Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-bold">Hızlı Ölçü:</span>
                  {['200x300 cm', '160x230 cm', '120x180 cm', '80x150 cm', '300x400 cm'].map((dim) => (
                    <button
                      key={dim}
                      type="button"
                      onClick={() => setScanIntakeDimensions(dim)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                        scanIntakeDimensions === dim
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {dim}
                    </button>
                  ))}
                </div>

                {/* Total m² Calculation Summary Banner */}
                {(() => {
                  const pieces = parseFloat(scanIntakePieceQuantity) || 1;
                  const m2Unit = calculateM2FromDimensionString(scanIntakeDimensions);
                  const totalAdded = Math.round(pieces * m2Unit * 100) / 100;
                  const newTotalStock = Math.round(((scanIntakeProduct.stockM2 || 0) + totalAdded) * 100) / 100;

                  return (
                    <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl text-xs font-bold text-emerald-900 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Eklenen Miktar ({pieces} Adet x {m2Unit} m²):</span>
                        <span className="text-sm font-black font-mono text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
                          +{totalAdded} m²
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-emerald-800 border-t border-emerald-200 pt-1">
                        <span>Giriş Sonrası Toplam Stok:</span>
                        <span className="font-mono font-bold">{newTotalStock} m²</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 2 - Birim Alış Fiyatı, Para Birimi & KDV */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-3">
                <label className="text-xs font-bold text-slate-900 block border-b border-slate-200 pb-1.5">
                  Alış Fiyatı, Para Birimi & KDV Durumu
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Birim Alış Fiyatı:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={scanIntakeUnitPrice}
                      onChange={(e) => setScanIntakeUnitPrice(e.target.value)}
                      placeholder="450"
                      className="w-full bg-white border border-slate-300 font-mono font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Para Birimi:</label>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { id: 'TL', label: '₺ TL' },
                        { id: 'USD', label: '$ USD' },
                        { id: 'EUR', label: '€ EUR' },
                        { id: 'GBP', label: '£ GBP' },
                      ].map((curr) => (
                        <button
                          key={curr.id}
                          type="button"
                          onClick={() => setScanIntakeCurrency(curr.id as any)}
                          className={`py-2 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                            scanIntakeCurrency === curr.id
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {curr.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* VAT Choice */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Vergi (KDV) Durumu:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'kdv_10', label: '%10 KDV' },
                      { id: 'kdv_20', label: '%20 KDV' },
                      { id: 'ihrac_kayitli', label: 'İhraç Kayıtlı (%0)' },
                    ].map((vat) => (
                      <button
                        key={vat.id}
                        type="button"
                        onClick={() => setScanIntakeVat(vat.id as any)}
                        className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer text-center ${
                          scanIntakeVat === vat.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {vat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3 - Giriş Nedeni / Ambar */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Giriş Nedeni / Ambar Belgesi:</label>
                <input
                  type="text"
                  value={scanIntakeReason}
                  onChange={(e) => setScanIntakeReason(e.target.value)}
                  placeholder="ör: Fabrika Ambar Girişi / Tedarikçi Alış Faturası"
                  className="w-full bg-slate-50 border border-slate-300 font-bold text-xs p-2.5 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsScanIntakeModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <PackageCheck className="w-4 h-4 text-white" />
                  <span>İçeri Alışı Onayla ve Stoğa Kaydet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GS1 Türkiye (online.gs1tr.org) Integration & EAN Sync Modal */}
      {isGs1ModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-6">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                  <Globe className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    GS1 Türkiye (online.gs1tr.org) EAN Entegrasyonu
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Resmi GS1 Türkiye portalından EAN-13 barkodlarınızı otomatik çekin ve ürün kataloğunuzla eşleştirin.
                  </p>
                </div>
              </div>
              <button onClick={() => setIsGs1ModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Box 1: Live GS1 TR Portal Settings & One-Click Sync */}
              <div className="bg-emerald-50/60 border border-emerald-200 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-700" />
                    <h4 className="text-xs font-bold text-emerald-950">
                      GS1 Türkiye Firma Bilgileri & Otomatik Senkronizasyon
                    </h4>
                  </div>
                  <span className="bg-emerald-200 text-emerald-900 font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                    online.gs1tr.org
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">GS1 GLN / Firma Kodu (869...):</label>
                    <input
                      type="text"
                      value={gs1Gln}
                      onChange={(e) => setGs1Gln(e.target.value)}
                      placeholder="ör: 8699010000000"
                      className="w-full bg-white border border-emerald-300 font-mono font-bold p-2.5 rounded-xl text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">GS1 TR Tescilli Firma Adı:</label>
                    <input
                      type="text"
                      value={gs1CompanyName}
                      onChange={(e) => setGs1CompanyName(e.target.value)}
                      className="w-full bg-white border border-emerald-300 font-bold p-2.5 rounded-xl text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">GS1 Portal Kullanıcı Kimliği / Kodu:</label>
                    <input
                      type="text"
                      value={gs1Username}
                      onChange={(e) => setGs1Username(e.target.value)}
                      placeholder="online.gs1tr.org kullanıcı adı"
                      className="w-full bg-white border border-emerald-300 font-mono p-2.5 rounded-xl text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">GS1 API / Portal Erişim Anahtarı:</label>
                    <input
                      type="password"
                      value={gs1ApiKey}
                      onChange={(e) => setGs1ApiKey(e.target.value)}
                      placeholder="İsteğe bağlı API Key / Token"
                      className="w-full bg-white border border-emerald-300 font-mono p-2.5 rounded-xl text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    onClick={handleSaveGs1Config}
                    className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                  >
                    Ayarları Kaydet
                  </button>

                  <button
                    onClick={handleSyncWithGs1Tr}
                    disabled={isSyncingGs1}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 text-emerald-100 ${isSyncingGs1 ? 'animate-spin' : ''}`} />
                    <span>{isSyncingGs1 ? 'Senkronize Ediliyor...' : 'GS1 Türkiye\'den EAN Kodlarını Otomatik Çek'}</span>
                  </button>
                </div>
              </div>

              {/* Box 2: GS1 TR Excel / CSV Export Import */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                    online.gs1tr.org Portalından İndirilen Excel / CSV Dosyası Yükle
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">.xlsx, .csv, .txt</span>
                </div>

                <p className="text-xs text-slate-600">
                  https://online.gs1tr.org adresindeki üye panelinizden indirdiğiniz EAN/GTIN listesini yükleyerek tüm ürünlerinize saniyeler içinde toplu barkod atayabilirsiniz.
                </p>

                <div className="relative border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-white p-4 rounded-xl text-center transition-all cursor-pointer group">
                  <input
                    type="file"
                    accept=".csv,.txt,.xlsx,.xls"
                    onChange={handleImportGs1File}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-800 block">GS1 TR Dosyası Seçmek veya Sürüklemek İçin Tıklayın</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">869 ile başlayan GTIN numaraları otomatik tespit edilir</span>
                </div>
              </div>

              {/* Box 3: Single GTIN Live Verification */}
              <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Search className="w-4 h-4 text-indigo-600" />
                  Tekil GS1 GTIN / EAN Sorgulama & Doğrulama
                </h4>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={gs1LookupQuery}
                    onChange={(e) => setGs1LookupQuery(e.target.value)}
                    placeholder="Sorgulanacak EAN-13 (ör: 8699010020012)"
                    className="flex-1 bg-white border border-slate-300 font-mono font-bold text-xs p-2.5 rounded-xl text-slate-900"
                  />
                  <button
                    onClick={handleLookupGs1Ean}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    GS1'de Sorgula
                  </button>
                </div>

                {gs1LookupResult && (
                  <div className="bg-white border border-indigo-200 p-3.5 rounded-xl text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between text-slate-900 font-bold">
                      <span>GTIN: {gs1LookupResult.gtin}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-sans">
                        GS1 TR Onaylı (869)
                      </span>
                    </div>
                    <div className="text-slate-600 font-sans">
                      Firma / Marka: <strong>{gs1LookupResult.brand}</strong>
                    </div>
                    <div className="text-slate-500 text-[11px] font-sans">
                      Menşei: {gs1LookupResult.country} • GLN: {gs1LookupResult.gln}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsGs1ModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 cursor-pointer shadow-xs"
                >
                  Tamam / Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Print-Only Barcode Label Container (Visible ONLY during window.print()) */}
      <div id="printable-barcode-section" className="hidden print:block bg-white text-black p-0 m-0">
        <div className={`m-0 p-0 bg-white ${
          labelSizePreset.startsWith('A4')
            ? 'grid grid-cols-3 gap-3 p-4'
            : 'flex flex-col items-start justify-start'
        }`}>
          {[...Array(Math.max(1, printCopies))].map((_, idx) => (
            <div
              key={idx}
              className="bg-white border-2 border-black text-center flex flex-col justify-between box-border overflow-hidden"
              style={{
                width:
                  labelSizePreset === '100x100'
                    ? '100mm'
                    : labelSizePreset === '40x40'
                    ? '40mm'
                    : labelSizePreset === '20x20'
                    ? '20mm'
                    : labelSizePreset === '50x30'
                    ? '50mm'
                    : labelSizePreset === '100x50'
                    ? '100mm'
                    : labelSizePreset === 'A4_4x4'
                    ? '65mm'
                    : labelSizePreset === 'A4_3x8'
                    ? '60mm'
                    : '100mm',
                height:
                  labelSizePreset === '100x100'
                    ? '100mm'
                    : labelSizePreset === '40x40'
                    ? '40mm'
                    : labelSizePreset === '20x20'
                    ? '20mm'
                    : labelSizePreset === '50x30'
                    ? '30mm'
                    : labelSizePreset === '100x50'
                    ? '50mm'
                    : labelSizePreset === 'A4_4x4'
                    ? '65mm'
                    : labelSizePreset === 'A4_3x8'
                    ? '33mm'
                    : '100mm',
                padding:
                  labelSizePreset === '100x100'
                    ? '4mm'
                    : labelSizePreset === '20x20'
                    ? '1mm'
                    : '2mm',
                pageBreakAfter: labelSizePreset.startsWith('A4') ? 'auto' : (idx === printCopies - 1 ? 'avoid' : 'always'),
                breakAfter: labelSizePreset.startsWith('A4') ? 'auto' : (idx === printCopies - 1 ? 'avoid' : 'page'),
                margin: '0 auto',
              }}
            >
              {/* Header */}
              <div>
                {showLabelBrand && (
                  <div className={`font-black text-black uppercase tracking-tight text-center border-b-2 border-black pb-1 mb-1 ${
                    labelSizePreset === '100x100' ? 'text-xs' : 'text-[9px]'
                  }`}>
                    {labelBrand}
                  </div>
                )}
                {showLabelCollection && (
                  <div className={`font-bold text-black text-center ${
                    labelSizePreset === '100x100' ? 'text-xs' : 'text-[9px]'
                  }`}>
                    {labelCollection}
                  </div>
                )}
                <div className={`font-black text-black text-center uppercase tracking-wide my-0.5 ${
                  labelSizePreset === '100x100' ? 'text-sm font-extrabold' : 'text-[10px]'
                }`}>
                  {labelProductName}
                </div>
                {showLabelCode && labelProductCode && (
                  <div className={`font-mono font-bold text-black text-center ${
                    labelSizePreset === '100x100' ? 'text-xs' : 'text-[8px]'
                  }`}>
                    Kod: {labelProductCode}
                  </div>
                )}
              </div>

              {/* Barcode SVG */}
              <div className="my-1 flex flex-col items-center justify-center">
                <BarcodeSvg
                  code={labelBarcodeNo}
                  height={
                    labelSizePreset === '100x100'
                      ? 52
                      : labelSizePreset === '100x50'
                      ? 40
                      : labelSizePreset === '20x20'
                      ? 18
                      : 28
                  }
                />
              </div>

              {/* Footer Details & Price */}
              <div>
                {showLabelNote && labelNoteText && labelSizePreset === '100x100' && (
                  <div className="text-[10px] text-black font-semibold text-center mb-1 bg-slate-100 p-1 rounded border border-black">
                    {labelNoteText}
                  </div>
                )}

                {showLabelPrice && (
                  <div className={`font-mono font-black text-black text-center border-t-2 border-black pt-1 ${
                    labelSizePreset === '100x100' ? 'text-sm' : 'text-[10px]'
                  }`}>
                    {labelPriceText}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

