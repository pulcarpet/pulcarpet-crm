export type CustomerStatus = 'yeni' | 'gorusmede' | 'teklif' | 'anlasildi' | 'kaybedildi';

export type ProductionStatus = 
  | 'musteri_onayi'
  | 'dokuma'
  | 'teslim';

export type FiberType = 'bambu_ipek' | 'yun' | 'akrilik' | 'viskoz' | 'polyester' | 'pamuk';

export type EdgeFinish = 'overlok' | 'sacagli' | 'deri_biye' | 'katlama';

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  status: CustomerStatus;
  leadScore: number; // 0-100 calculated by AI
  totalDealValue: number;
  lastContact: string;
  notes: string;
  preferredStyle?: string;
  assignedAgent: string;
  currentBalance?: number; // positive = customer owes us (alacaklıyız)
}

export interface CarpetOrderItem {
  id: string;
  collectionName: string;
  colorCode: string;
  dimensionMode?: 'sqm' | 'dimensions'; // 'sqm' = Doğrudan m² (metrekare), 'dimensions' = En x Boy (cm)
  widthCm: number;
  lengthCm: number;
  quantity: number;
  areaM2: number;
  fiberType: FiberType;
  pileHeightMm: number;
  edgeFinish: EdgeFinish;
  unitPricePerM2: number;
  totalPrice: number;
}

export type CostCategory = 'Hammadde' | 'İşçilik' | 'Lojistik' | 'Görünmez/Genel Gider' | 'Komisyon' | 'Diğer';

export interface CostItem {
  id: string;
  title: string;
  amount: number;
  currency?: 'TL' | 'USD' | 'EUR' | 'GBP';
  exchangeRate?: number; // TL equivalent exchange rate if entered in FX
  category: CostCategory;
  isImplicitCost: boolean; // true = Görünmez maliyet (Fire, Ambalaj Yıpranması, POS, Finansman vb.)
  notes?: string;
}

export interface OrderCostBreakdown {
  items: CostItem[];
  defaultCurrency?: 'TL' | 'USD' | 'EUR' | 'GBP';
  usdRate?: number; // Döviz kuru
  eurRate?: number;
  customNotes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  company: string;
  phone: string;
  items: CarpetOrderItem[];
  totalM2: number;
  totalAmount: number;
  status: ProductionStatus;
  createdAt: string;
  deliveryDate: string;
  shippingAddress: string;
  notes?: string;
  isCustomProduction: boolean;
  customerApproved?: boolean;
  approvalDate?: string;
  approvalNotes?: string;
  hasAdvancePayment?: boolean;
  advancePaymentAmount?: number;
  advancePaymentCurrency?: 'TL' | 'USD' | 'EUR' | 'GBP';
  advancePaymentNotes?: string;
  currency?: 'TL' | 'USD' | 'EUR' | 'GBP';
  terminDate?: string;
  parasutSynced?: boolean;
  parasutInvoiceId?: string;
  costBreakdown?: OrderCostBreakdown;
}

export interface CarpetProduct {
  id: string;
  code: string;
  barcode?: string; // EAN-13 / GTIN / Roll Lot Barcode
  name: string;
  category: 'Modern' | 'Klasik' | 'Proje/Otel' | 'Camii' | 'Bambu İpek' | 'Shaggy' | string;
  collectionName?: string; // 1- Koleksiyon adı
  patternCode?: string; // 2- Desen kodu
  dimensions?: string; // 3- Ölçüsü (ör. 200x300 cm)
  purchasePrice?: number; // 4- Alış fiyatı
  purchaseCurrency?: 'TL' | 'USD' | 'EUR' | 'GBP'; // Para birimi (TL, Dolar, Euro, Pound)
  vatOption?: 'kdv_10' | 'kdv_20' | 'ihrac_kayitli'; // KDV Oranı (%10 KDV, %20 KDV, İhraç Kayıtlı)
  salesCurrency?: 'TL' | 'USD' | 'EUR' | 'GBP'; // Satış Para birimi (TL, Dolar, Euro, Pound)
  fiberType: FiberType;
  pileHeightMm: number;
  densityPoints: number; // e.g., 1.200.000 ilme/m2
  colorVariants: string[];
  pricePerM2: number;
  stockM2: number;
  image?: string;
  imageUrl?: string;
  description: string;
}

export interface BarcodeScanLog {
  id: string;
  timestamp: string;
  barcode: string;
  actionType: 'stock_in' | 'stock_out' | 'order_update' | 'lookup' | 'dispatch';
  itemTitle: string;
  quantityM2?: number;
  status: 'success' | 'warning' | 'error';
  message: string;
  operator: string;
}

export interface ScannedBarcodeItem {
  id: string;
  barcode: string;
  patternCode: string; // Desen Kodu (örn: DSN-101, PC-SILK-01)
  collectionName: string; // Koleksiyon Adı (örn: Bambu İpek)
  productName: string; // Ürün Adı
  productCode: string; // Ürün Kodu
  dimensions: string; // Ölçü / Ebat (örn: 200x300 cm)
  unitM2: number; // 1 Parçanın m² Değeri
  quantity: number; // Okutulan Adet / Parça Sayısı
  totalM2: number; // Toplam Metrekare (Adet * unitM2)
  unitPrice?: number; // Birim Fiyat
  currency?: 'TL' | 'USD' | 'EUR' | 'GBP';
  totalPrice?: number; // Toplam Tutar
  scannedAt: string; // Okutma Zamanı
  operator?: string; // Okutan Personel / Yetkili
  actionType?: 'sayim' | 'giris' | 'cikis' | 'sevk' | 'perakende';
  notes?: string; // Özel Not
}

export interface QuoteItem {
  id: string;
  productName: string;
  dimensions: string; // e.g. "200x300 cm"
  areaM2: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerName: string;
  company: string;
  email: string;
  date: string;
  validUntil: string;
  items: QuoteItem[];
  subtotal: number;
  discountPercent: number;
  taxAmount: number;
  grandTotal: number;
  status: 'Taslak' | 'Gönderildi' | 'Onaylandı' | 'Reddedildi';
  currency?: 'TL' | 'USD' | 'EUR' | 'GBP';
  notes: string;
}

export interface ArchitecturalProject {
  id: string;
  title: string;
  architect: string;
  projectType: 'Otel' | 'Rezidans' | 'Ofis' | 'Villa' | 'Cami' | 'Restoran';
  location: string;
  requiredM2: number;
  estimatedBudget: number;
  status: 'Numune Aşamasında' | 'Teklif Verildi' | 'Sözleşme İmzalandı' | 'Tamamlandı';
  sampleStatus: 'Talep Edildi' | 'Hazırlanıyor' | 'Gönderildi' | 'Onaylandı';
  deadline: string;
}

// Financial Receivables & Payables (Kimden Alacaklıyız / Kime Borçluyuz)
export interface FinancialAccountItem {
  id: string;
  type: 'alacak' | 'borc'; // 'alacak' = Kimden Alacaklıyız, 'borc' = Kime Borçluyuz
  partyName: string; // Firma veya Kişi adı
  companyCategory: 'Müşteri' | 'Tedarikçi' | 'İplik Fabrikası' | 'Fason Dokuma' | 'Kargo / Lojistik';
  phone: string;
  amount: number;
  dueDate: string; // Vade tarihi
  issueDate: string; // İşlem / Fatura tarihi
  status: 'bekliyor' | 'gecikti' | 'odendi' | 'kismi_odendi';
  invoiceNumber?: string;
  notes?: string;
  parasutSynced?: boolean;
}

// VAT / KDV & Export Refund Record
export interface VatRefundItemMatch {
  id: string;
  purchaseInvoiceId?: string;
  purchaseInvoiceNo: string;
  purchaseDate: string;
  supplierName: string;
  supplierTaxNo: string;
  itemDescription: string;
  matchedQuantity: number;
  unitOfMeasure: 'm2' | 'kg' | 'adet' | 'saat' | 'paket';
  purchaseNetAmount: number;
  purchaseVatRate: number; // e.g. 20
  purchaseVatAmount: number;
  allocatedIncurredVat: number; // Bu ihracat kalemine yüklenilen KDV tutarı
  notes?: string;
}

export interface VatRefundMatching {
  id: string;
  exportInvoiceId: string;
  exportInvoiceNo: string;
  exportInvoiceDate: string;
  customerName: string;
  exportCurrency: string;
  exportNetAmount: number;
  exportTotalAmount: number;
  customsDeclarationNo?: string; // GÇB Numarası
  customsDeclarationDate?: string;
  matchedItems: VatRefundItemMatch[];
  totalIncurredVat: number; // Toplam Yüklenilen KDV
  maxRefundableVat: number; // Azami İade Edilebilir KDV (%20 Sınırı)
  status: 'taslak' | 'tamamlandi' | 'onaylandi';
  updatedAt: string;
}

export interface VatTransaction {
  id: string;
  type: 'alis_kdvli' | 'ihrac_kayitli_alis' | 'yurttici_satis_kdvli' | 'ihracat_satisi';
  title: string;
  partyName: string;
  invoiceNo: string;
  date: string;
  netAmount: number; // KDV hariç tutar
  vatRate: number; // örn: 20
  vatAmount: number; // KDV tutarı
  exportRefundAmount: number; // İhracat KDV iadesi / alacağı tutarı
  currency: 'TRY' | 'USD' | 'EUR';
  notes?: string;
}

// Paraşüt Integration Settings
export interface ParasutConfig {
  clientId: string;
  clientSecret: string;
  companyId: string;
  username: string;
  password: string;
  isConnected: boolean;
  lastSyncTime: string | null;
  autoPolling: boolean;
  syncIntervalMinutes: number;
}

// Paraşüt Invoices (Kesilmiş Satış Faturaları ve Bize Gelen Faturalar)
export interface ParasutInvoice {
  id: string;
  parasutId: string;
  invoiceType: 'sales' | 'purchase'; // 'sales' = Kesilmiş Satış Faturası, 'purchase' = Bize Gelen Alış Faturası
  invoiceCategory: 'e-Fatura' | 'e-Arşiv' | 'İhracat Faturası' | 'Gelen Alış Faturası' | 'Gider Faturası';
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  partyName: string;
  taxNumber?: string;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;
  paymentStatus: 'odendi' | 'bekliyor' | 'gecikti' | 'kismi_odendi' | 'iptal';
  description?: string;
  itemCount?: number;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  structuredData?: {
    type?: 'quote_preview' | 'lead_analysis' | 'pattern_recommendation';
    data?: any;
  };
}

// Firma / Müşteri / Tedarikçi Özel Ürün Fiyat Listesi
export interface CompanyProductPrice {
  id: string;
  companyName: string; // Firma / Müşteri / Tedarikçi Adı
  companyType: 'tedarikci' | 'musteri' | 'fasoncu'; // Tedarikçi, Müşteri veya Fason Üretici
  productId?: string;
  productName: string; // Ürün / Koleksiyon / Desen
  collectionName?: string;
  patternCode?: string;
  unitPrice: number; // Anlaşılan / Alınan Fiyat
  currency: 'TL' | 'USD' | 'EUR' | 'GBP'; // ₺, $, €, £
  priceType: 'alis' | 'satis'; // Alış Fiyatı veya Özel Satış Fiyatı
  vatOption: 'kdv_10' | 'kdv_20' | 'ihrac_kayitli';
  notes?: string;
  updatedAt: string;
}

// Yapılan Ödeme ve Harcama Kaydı (Kredi Kartı, Şahıs, Tedarikçi vb.)
export interface ExpensePaymentRecord {
  id: string;
  date: string; // İşlem / Ödeme Tarihi (YYYY-MM-DD)
  category: 'kredi_karti' | 'sahis' | 'tedarikci' | 'fason' | 'kira_fatura' | 'personel' | 'diger';
  title: string; // Ödeme / Harcama Başlığı
  payee: string; // Kredi Kartı Banka Adı, Şahıs / Kişi Adı veya Firma
  amount: number; // Ödenen Tutar
  currency: 'TL' | 'USD' | 'EUR' | 'GBP'; // Para birimi
  paymentMethod: 'kredi_karti' | 'nakit' | 'banka_havale' | 'cek_senet'; // Ödeme Şekli
  receiptNo?: string; // Fiş, Dekont veya Belge No
  notes?: string; // Açıklama / Notlar
  operator?: string; // İşlemi Yapan Personel
  createdAt: string;
}

// 📦 Sipariş Durum ve Çıkış Kontrolü / Yanılgısız Barkod Okutma (Poka-Yoke)
export interface OrderFulfillmentItem {
  id: string;
  sequenceNumber: number; // Sıra No (1, 2, 3...)
  skuName: string; // Örn: "FREYA 1138 KİREMİT 200x300"
  collectionName: string; // Örn: "FREYA", "OTANTİK", "BOHEM", "AHU", "ROMA", "RUYA", "VERA", "MİANA"
  patternCode: string; // Örn: "1138"
  color: string; // Örn: "KİREMİT"
  dimensions: string; // Örn: "200x300"
  widthCm?: number;
  lengthCm?: number;
  thicknessMm?: string;
  weight?: string;
  barcode: string; // EAN-13 veya Özel Barkod
  orderQuantity: number; // Sipariş Adeti
  orderSqm: number; // Sipariş M2
  scannedQuantity: number; // Okutulan Adet (Sistemden düşülen / hazırlanan)
  scannedSqm: number; // Okutulan M2
  remainingQuantity: number; // Kalan Adet
  remainingSqm: number; // Kalan M2
  excessQuantity: number; // Fazla Adet
  excessSqm: number; // Fazla M2
  differencePercent: number; // Fark %
  status: 'Bekliyor' | 'Eksik' | 'Tamam' | 'Fazla';
}

export interface OrderScanLogItem {
  id: string;
  timestamp: string;
  barcode: string;
  skuName: string;
  collectionName: string;
  dimensions: string;
  action: 'scan_success' | 'scan_excess' | 'scan_error_unknown' | 'undo_scan';
  quantityDelta: number; // +1 veya -1
  operator: string;
  notes?: string;
}

export interface OrderFulfillmentReport {
  id: string;
  reportNo: string; // Örn: "YÖİM-15.08.2026-2"
  reportDate: string; // Örn: "15.08.2026 - 16.52"
  orderNumber: string; // Örn: "PUTI-11.08.2026"
  orderDate: string; // Örn: "11.08.2026"
  customerBrand: string; // Örn: "Firma Özel", "PULCARPET"
  edgeFinishType: string; // Örn: "Karışık", "Saçaklı", "Overlok"
  notes: string;
  orderStatus: 'Açık' | 'Hazırlanıyor' | 'Sevke Hazır' | 'Tamamlandı' | 'Kapatıldı';
  tolerancePercent: string; // Örn: "±%5"
  productGroup: string; // Örn: "Ankyra Halı", "PulCarpet Koleksiyonu"
  department: string; // Örn: "Yönetim", "Depo / Sevkiyat"
  items: OrderFulfillmentItem[];
  totalSkuCount: number;
  totalOrderQuantity: number;
  totalOrderSqm: number;
  totalScannedQuantity: number;
  totalScannedSqm: number;
  completionPercent: number;
  remainingSqm: number;
  missingCount: number;
  excessCount: number;
  scanLogs: OrderScanLogItem[];
  createdAt: string;
  updatedAt: string;
}

export type ProformaCurrency = 'USD' | 'EUR' | 'GBP' | 'TRY';

export interface BankDetails {
  accountName: string;
  bankName: string;
  iban: string;
  swiftCode: string;
}

export interface ProformaItem {
  id: string;
  description: string;
  subSpec?: string;
  rolls: number;
  sqm: number;
  unitPrice: number;
  amount: number;
}

export interface ProformaInvoiceData {
  id?: string;
  invoiceTitle?: string;
  invoiceNumber?: string;
  date: string;
  sellerInfo?: {
    companyName: string;
    address: string;
    taxOffice: string;
    taxNumber: string;
    phone: string;
    email: string;
    website: string;
  };
  buyerInfo?: {
    companyName: string;
    contactPerson: string;
    address: string;
    taxOffice: string;
    taxNumber: string;
    phone: string;
    email: string;
    country: string;
  };
  deliveryTerms?: string;
  paymentTerms?: string;
  estimatedDelivery?: string;
  originCountry?: string;
  hsCode?: string;
  currency?: ProformaCurrency;
  exchangeRate?: number;
  items: ProformaItem[];
  subtotal: number;
  discountRate?: number;
  discountAmount?: number;
  vatRate?: number;
  vatAmount?: number;
  shippingCost?: number;
  grandTotal: number;
  bankDetails?: BankDetails;
  notes?: string;
  authorizedSigner?: string;
  signatureTitle?: string;
  createdAt?: string;
  updatedAt?: string;
}


