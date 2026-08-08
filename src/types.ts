export type CustomerStatus = 'yeni' | 'gorusmede' | 'teklif' | 'anlasildi' | 'kaybedildi';

export type ProductionStatus = 
  | 'musteri_onayi'
  | 'musteri_onayladi'
  | 'iplik_boya'
  | 'dokuma'
  | 'kesim' 
  | 'kalite_kontrol' 
  | 'paketleme' 
  | 'kargo' 
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
  category: CostCategory;
  isImplicitCost: boolean; // true = Görünmez maliyet (Fire, Ambalaj Yıpranması, POS, Finansman vb.)
  notes?: string;
}

export interface OrderCostBreakdown {
  items: CostItem[];
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
