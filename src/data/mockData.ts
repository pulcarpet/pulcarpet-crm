import { Customer, Order, CarpetProduct, Quote, ArchitecturalProject, FinancialAccountItem, VatTransaction, ParasutConfig, ParasutInvoice } from '../types';

// Empty lists ready for operational production usage
export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_FINANCIAL_ACCOUNTS: FinancialAccountItem[] = [];

export const INITIAL_VAT_TRANSACTIONS: VatTransaction[] = [];

// Paraşüt Invoices (Kesilmiş Satış Faturaları ve Bize Gelen Faturalar)
export const INITIAL_PARASUT_INVOICES: ParasutInvoice[] = [
  {
    id: 'PRS-SALES-869001',
    parasutId: '1095564600',
    invoiceType: 'sales',
    invoiceCategory: 'e-Arşiv',
    invoiceNumber: 'PA02026000000088',
    issueDate: '2026-08-07',
    dueDate: '2026-08-07',
    partyName: 'Sümeyya Sarıca',
    taxNumber: '11111111111',
    netAmount: 5818.18,
    vatAmount: 581.82,
    totalAmount: 6400.00,
    currency: 'TRY',
    paymentStatus: 'gecikti',
    description: 'Bambu İpek Halı Satışı e-Arşiv Faturası',
    itemCount: 1
  },
  {
    id: 'PRS-SALES-869002',
    parasutId: '1095564601',
    invoiceType: 'sales',
    invoiceCategory: 'e-Arşiv',
    invoiceNumber: 'PA02026000000089',
    issueDate: '2026-08-08',
    dueDate: '2026-08-08',
    partyName: 'Sibel Aksakal',
    taxNumber: '11111111111',
    netAmount: 1081.82,
    vatAmount: 108.18,
    totalAmount: 1190.00,
    currency: 'TRY',
    paymentStatus: 'bekliyor',
    description: 'Polyester Makina Halısı e-Arşiv Faturası',
    itemCount: 1
  },
  {
    id: 'PRS-SALES-869003',
    parasutId: '1095564602',
    invoiceType: 'sales',
    invoiceCategory: 'e-Fatura',
    invoiceNumber: 'PF2202600000001',
    issueDate: '2026-07-14',
    dueDate: '2026-08-14',
    partyName: 'SEDA GİDA MAD.SAN.DAĞ.TİC. A.Ş.',
    taxNumber: '7580017906',
    netAmount: 2469.76,
    vatAmount: 246.98,
    totalAmount: 2716.74,
    currency: 'USD',
    paymentStatus: 'bekliyor',
    description: 'Polyester Halı (290,56 m² x 8,50$ - %10 KDV)',
    itemCount: 1
  },
  {
    id: 'PRS-PURCHASE-901',
    parasutId: '1095564701',
    invoiceType: 'purchase',
    invoiceCategory: 'Gelen Alış Faturası',
    invoiceNumber: 'AKS202600001042',
    issueDate: '2026-08-01',
    dueDate: '2026-08-31',
    partyName: 'Aksakal Tekstil San. ve Tic. A.Ş.',
    taxNumber: '0280459102',
    netAmount: 125000.00,
    vatAmount: 25000.00,
    totalAmount: 150000.00,
    currency: 'TRY',
    paymentStatus: 'odendi',
    description: 'Bambu İpek ve Akrilik İplik Alım Faturası',
    itemCount: 12
  },
  {
    id: 'PRS-PURCHASE-902',
    parasutId: '1095564702',
    invoiceType: 'purchase',
    invoiceCategory: 'Gelen Alış Faturası',
    invoiceNumber: 'ERN202600000815',
    issueDate: '2026-08-04',
    dueDate: '2026-09-04',
    partyName: 'Eren İplik Dokuma San. Ltd. Şti.',
    taxNumber: '3480912384',
    netAmount: 84000.00,
    vatAmount: 16800.00,
    totalAmount: 100800.00,
    currency: 'TRY',
    paymentStatus: 'bekliyor',
    description: 'Yün ve Halı İpliği Tedarik Faturası',
    itemCount: 8
  },
  {
    id: 'PRS-PURCHASE-903',
    parasutId: '1095564703',
    invoiceType: 'purchase',
    invoiceCategory: 'Gider Faturası',
    invoiceNumber: 'MNG202600004521',
    issueDate: '2026-08-05',
    dueDate: '2026-08-20',
    partyName: 'MNG Kargo Lojistik A.Ş.',
    taxNumber: '6220048192',
    netAmount: 14500.00,
    vatAmount: 2900.00,
    totalAmount: 17400.00,
    currency: 'TRY',
    paymentStatus: 'odendi',
    description: 'Fabrika Ürün Sevkiyat ve Lojistik Taşımacılık Hizmeti',
    itemCount: 45
  },
  {
    id: 'PRS-PURCHASE-904',
    parasutId: '1095564704',
    invoiceType: 'purchase',
    invoiceCategory: 'Gelen Alış Faturası',
    invoiceNumber: 'SNT202600000312',
    issueDate: '2026-08-06',
    dueDate: '2026-08-25',
    partyName: 'Sentez Halı Dokuma & Baskı Tesisleri',
    taxNumber: '7610492811',
    netAmount: 62000.00,
    vatAmount: 12400.00,
    totalAmount: 74400.00,
    currency: 'TRY',
    paymentStatus: 'gecikti',
    description: 'Fason Halı Dokuma ve Konfeksiyon İşçilik Faturası',
    itemCount: 6
  },
  {
    id: 'PRS-PURCHASE-905',
    parasutId: '1095564705',
    invoiceType: 'purchase',
    invoiceCategory: 'Gider Faturası',
    invoiceNumber: 'TRS202600009814',
    issueDate: '2026-08-07',
    dueDate: '2026-08-22',
    partyName: 'Toroslar Elektrik Perakende Satış A.Ş.',
    taxNumber: '8520194820',
    netAmount: 38500.00,
    vatAmount: 7700.00,
    totalAmount: 46200.00,
    currency: 'TRY',
    paymentStatus: 'bekliyor',
    description: 'Fabrika ve Üretim Tesisi Sanayi Elektrik Tüketimi',
    itemCount: 1
  },
  {
    id: 'PRS-PURCHASE-906',
    parasutId: '1041330310',
    invoiceType: 'purchase',
    invoiceCategory: 'Gelen Alış Faturası',
    invoiceNumber: 'FSC2026000001842',
    issueDate: '2026-08-05',
    dueDate: '2026-08-20',
    partyName: 'Fesa Otel Turizm San. ve Tic. A.Ş.',
    taxNumber: '3850129481',
    netAmount: 2920.06,
    vatAmount: 292.01,
    totalAmount: 3240.00,
    currency: 'TRY',
    paymentStatus: 'bekliyor',
    description: 'Konaklama Hizmet Faturası (Matrah: 2.920,06 ₺, KDV %10: 292,01 ₺, Konaklama Vergisi %2: 27,93 ₺)',
    itemCount: 1
  },
  {
    id: 'PRS-PURCHASE-907',
    parasutId: '1095564707',
    invoiceType: 'purchase',
    invoiceCategory: 'Gelen Alış Faturası',
    invoiceNumber: 'IST202600000045',
    issueDate: '2026-08-08',
    dueDate: '2026-08-28',
    partyName: 'Gaziantep OSB Uluslararası Lojistik & Antrepo A.Ş.',
    taxNumber: '4120391827',
    netAmount: 25000.00,
    vatAmount: 0.00,
    totalAmount: 25000.00,
    currency: 'TRY',
    paymentStatus: 'bekliyor',
    description: 'Serbest Bölge Lojistik & Transit Taşımacılık (3065 Sayılı Kanun 14/1 Vergi İstisna Muafiyet Bedeli)',
    itemCount: 1
  }
];

// Paraşüt API Configuration Default State
export const INITIAL_PARASUT_CONFIG: ParasutConfig = {
  clientId: '',
  clientSecret: '',
  companyId: '',
  username: '',
  password: '',
  isConnected: false,
  lastSyncTime: 'Canlı Senkronizasyon Bekleniyor',
  autoPolling: true,
  syncIntervalMinutes: 15
};

export const INITIAL_PRODUCTS: CarpetProduct[] = [
  {
    id: 'PROD-01',
    code: 'PC-SILK-100',
    barcode: '8691001002001',
    name: 'PulCarpet SilkTouch Bambu İpek',
    category: 'Bambu İpek',
    fiberType: 'bambu_ipek',
    pileHeightMm: 10,
    densityPoints: 1200000,
    colorVariants: ['Vizon Parlak', 'Sedef Beyaz', 'Açık Gri', 'Zümrüt Yeşili', 'Şampanya'],
    pricePerM2: 1250,
    stockM2: 450,
    image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80',
    description: 'Doğal bambu elyafından üretilen yüksek parıltılı, ipeksi tuşeli lüks konut ve rezidans halısı.'
  },
  {
    id: 'PROD-02',
    code: 'PC-ROYAL-800',
    barcode: '8691001002002',
    name: 'PulCarpet Royal Otel & Proje Halısı',
    category: 'Proje/Otel',
    fiberType: 'akrilik',
    pileHeightMm: 12,
    densityPoints: 950000,
    colorVariants: ['Krem Altın', 'Laci Bordo', 'Antrasit Bronz'],
    pricePerM2: 800,
    stockM2: 1800,
    image: 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=600&q=80',
    description: 'Alev almazlık ve aşınma sertifikalı, yüksek trafikli otel lobby ve koridorları için geliştirilmiş rulo halı.'
  },
  {
    id: 'PROD-03',
    code: 'PC-WOOL-500',
    barcode: '8691001002003',
    name: 'PulCarpet Saf Yün Anatolia Klasik',
    category: 'Klasik',
    fiberType: 'yun',
    pileHeightMm: 14,
    densityPoints: 1500000,
    colorVariants: ['Kök Boya Kırmızı', 'Geleneksel Mavi', 'Fildişi'],
    pricePerM2: 1100,
    stockM2: 320,
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80',
    description: '%100 Yeni Zelanda yününden özel dokuma, antialerjik ve ısı yalıtımlı geleneksel usta işçiliği.'
  },
  {
    id: 'PROD-04',
    code: 'PC-CAMII-100',
    barcode: '8691001002004',
    name: 'PulCarpet Saf Cami Halısı',
    category: 'Camii',
    fiberType: 'yun',
    pileHeightMm: 16,
    densityPoints: 1100000,
    colorVariants: ['Gül Kurusu Saflı', 'Turkuaz Saflı', 'Neft Yeşili'],
    pricePerM2: 950,
    stockM2: 1200,
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80',
    description: 'Diz izi yapmayan, güve yemez işlem görmüş, saflı mimari ibadethane halısı.'
  },
  {
    id: 'PROD-05',
    code: 'PC-LOFT-300',
    barcode: '8691001002005',
    name: 'PulCarpet Modern Loft Geometry',
    category: 'Modern',
    fiberType: 'akrilik',
    pileHeightMm: 11,
    densityPoints: 850000,
    colorVariants: ['Gri Bej', 'Mermer Desen', 'Siyah Beyaz Linear'],
    pricePerM2: 720,
    stockM2: 600,
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    description: 'Geometrik 3D kabartma dokulu modern şehir evleri için kolay temizlenebilir koleksiyon.'
  }
];

export const INITIAL_QUOTES: Quote[] = [];

export const INITIAL_PROJECTS: ArchitecturalProject[] = [];
