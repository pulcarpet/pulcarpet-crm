import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  DollarSign, 
  Euro, 
  PoundSterling, 
  Coins, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Edit3, 
  Building2, 
  FileText,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

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
  invoiceTitle?: string;
  invoiceNumber?: string;
  date: string;
  incoterms: string;
  customerName: string;
  addressLine1: string;
  addressLine2: string;
  country: string;
  currency: ProformaCurrency;
  items: ProformaItem[];
  grossWeightKg: number;
  netWeightKg: number;
  totalPackages?: string | number;
  customBankDetails?: Record<ProformaCurrency, BankDetails>;
}

interface ProformaInvoiceModalProps {
  initialData?: Partial<ProformaInvoiceData>;
  onClose: () => void;
  onSaveProforma?: (data: ProformaInvoiceData) => void;
}

// Default Bank Accounts for Pulcarpet (Pulur Tekstil) by Currency
const DEFAULT_BANK_ACCOUNTS: Record<ProformaCurrency, BankDetails> = {
  USD: {
    accountName: 'PULUR TEKSTİL DIŞ TİC. LTD. ŞTİ.',
    bankName: 'TÜRKİYE HALK BANKASI A.Ş.',
    iban: 'TR87 0001 2001 3140 0053 1005 30',
    swiftCode: 'TRHBTR2A',
  },
  EUR: {
    accountName: 'PULUR TEKSTİL DIŞ TİC. LTD. ŞTİ.',
    bankName: 'TÜRKİYE HALK BANKASI A.Ş. (EUR HESABI)',
    iban: 'TR34 0001 2001 3140 0053 1005 31',
    swiftCode: 'TRHBTR2A',
  },
  GBP: {
    accountName: 'PULUR TEKSTİL DIŞ TİC. LTD. ŞTİ.',
    bankName: 'TÜRKİYE HALK BANKASI A.Ş. (GBP HESABI)',
    iban: 'TR12 0001 2001 3140 0053 1005 32',
    swiftCode: 'TRHBTR2A',
  },
  TRY: {
    accountName: 'PULUR TEKSTİL DIŞ TİC. LTD. ŞTİ.',
    bankName: 'TÜRKİYE HALK BANKASI A.Ş. (TL HESABI)',
    iban: 'TR65 0001 2001 3140 0053 1005 29',
    swiftCode: 'TRHBTR2A',
  },
};

export const ProformaInvoiceModal: React.FC<ProformaInvoiceModalProps> = ({
  initialData,
  onClose,
  onSaveProforma,
}) => {
  // Currency Choice
  const [currency, setCurrency] = useState<ProformaCurrency>(initialData?.currency || 'USD');

  // Customer & Invoice Metadata
  const [invoiceTitle, setInvoiceTitle] = useState(initialData?.invoiceTitle || 'COMMERCIAL INVOICE');
  const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoiceNumber || 'PRF-2026-0089');
  const [customerName, setCustomerName] = useState(initialData?.customerName || 'ECO COVER');
  const [addressLine1, setAddressLine1] = useState(initialData?.addressLine1 || 'Voergårdvej 8');
  const [addressLine2, setAddressLine2] = useState(initialData?.addressLine2 || 'DK-9200 Aalborg SV');
  const [country, setCountry] = useState(initialData?.country || 'DENMARK');

  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [incoterms, setIncoterms] = useState(initialData?.incoterms || 'EXW - Ankara');

  // Weights & Package Details
  const [grossWeightKg, setGrossWeightKg] = useState<number>(initialData?.grossWeightKg || 1420);
  const [netWeightKg, setNetWeightKg] = useState<number>(initialData?.netWeightKg || 1320);
  const [totalPackages, setTotalPackages] = useState<string | number>(initialData?.totalPackages || '14 Pallets / Packages');

  // Bank accounts config (allows editing stored IBANs)
  const [bankAccounts, setBankAccounts] = useState<Record<ProformaCurrency, BankDetails>>(() => {
    return initialData?.customBankDetails || DEFAULT_BANK_ACCOUNTS;
  });

  const [isEditingBank, setIsEditingBank] = useState(false);
  const [copied, setCopied] = useState(false);

  // Items List
  const [items, setItems] = useState<ProformaItem[]>(
    initialData?.items && initialData.items.length > 0
      ? initialData.items
      : [
          {
            id: '1',
            description: '14 mm * 100 RED OHRID',
            subSpec: '100x1500 per roll',
            rolls: 14,
            sqm: 210,
            unitPrice: 6.1,
            amount: 1281.0,
          },
          {
            id: '2',
            description: '14 mm * 100 BLUE OHRID',
            subSpec: '100x1500 per roll',
            rolls: 14,
            sqm: 210,
            unitPrice: 6.1,
            amount: 1281.0,
          },
          {
            id: '3',
            description: 'ECO TURQUISE',
            subSpec: '',
            rolls: 2,
            sqm: 30,
            unitPrice: 4.15,
            amount: 124.5,
          },
        ]
  );

  // Symbol helper
  const getCurrencySymbol = (curr: ProformaCurrency) => {
    switch (curr) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      case 'TRY':
        return '₺';
    }
  };

  // Recalculate amount for item
  const updateItem = (id: string, field: keyof ProformaItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        // calculate amount: if unitPrice and sqm available
        if (field === 'sqm' || field === 'unitPrice' || field === 'rolls') {
          const sqmVal = field === 'sqm' ? Number(value) : updated.sqm;
          const priceVal = field === 'unitPrice' ? Number(value) : updated.unitPrice;
          updated.amount = Number((sqmVal * priceVal).toFixed(2));
        }
        return updated;
      })
    );
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: 'PULCARPET Coilmat / Carpet Serisi',
        subSpec: 'Rulo özel kesim',
        rolls: 1,
        sqm: 50,
        unitPrice: 10,
        amount: 500,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((i) => i.id !== id));
    }
  };

  // Totals
  const totalRolls = items.reduce((sum, i) => sum + (Number(i.rolls) || 0), 0);
  const totalSqm = items.reduce((sum, i) => sum + (Number(i.sqm) || 0), 0);
  const grandTotal = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  // Active Bank details
  const activeBank = bankAccounts[currency];

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = `
=== ${invoiceTitle} (${invoiceNumber}) ===
Müşteri: ${customerName}
Tarih: ${date} | Incoterms: ${incoterms} | Fatura No: ${invoiceNumber}
Para Birimi: ${currency} (${getCurrencySymbol(currency)})

ÜRÜNLER:
${items.map((i) => `- ${i.description} (${i.subSpec}): ${i.rolls} Rulo / ${i.sqm} m² @ ${getCurrencySymbol(currency)}${i.unitPrice} = ${getCurrencySymbol(currency)}${i.amount}`).join('\n')}

TOPLAM TUTAR: ${getCurrencySymbol(currency)} ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
Brüt Ağırlık: ${grossWeightKg} Kg | Net Ağırlık: ${netWeightKg} Kg | Toplam Kap: ${totalPackages}

BANKA BİLGİLERİ (${currency}):
Hesap Adı: ${activeBank.accountName}
Banka: ${activeBank.bankName}
IBAN: ${activeBank.iban}
SWIFT Code: ${activeBank.swiftCode}
`;
    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl text-slate-100 shadow-2xl flex flex-col max-h-[95vh] print:max-h-none print:border-0 print:shadow-none print:w-full print:bg-white print:text-black">
        
        {/* Top Control Header - Hidden in Print */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                PULCARPET Commercial / Proforma Invoice Oluşturucu
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                  Şablon Uyumlu
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Resmi matbu şablona göre döviz para birimi ve otomatik IBAN entegrasyonlu
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kopyalandı!' : 'Metni Kopyala'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Yazdır / PDF Kaydet</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Currency & Quick Settings Bar - Hidden in Print */}
        <div className="bg-slate-950/70 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          {/* Currency Question Chips */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Coins className="w-4 h-4 text-amber-400" /> Para Birimi Seçin:
            </span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {(['USD', 'EUR', 'GBP', 'TRY'] as ProformaCurrency[]).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    currency === curr
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {curr === 'USD' && <DollarSign className="w-3.5 h-3.5" />}
                  {curr === 'EUR' && <Euro className="w-3.5 h-3.5" />}
                  {curr === 'GBP' && <PoundSterling className="w-3.5 h-3.5" />}
                  {curr === 'TRY' && <span className="text-xs font-bold">₺</span>}
                  <span>{curr}</span>
                </button>
              ))}
            </div>
          </div>

          {/* IBAN Quick Preview & Edit Toggle */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg text-slate-300 flex items-center gap-2">
              <span className="text-indigo-400 font-bold">{currency} IBAN:</span>
              <span className="text-white font-bold">{activeBank.iban}</span>
            </div>
            <button
              onClick={() => setIsEditingBank(!isEditingBank)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold cursor-pointer flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3 text-indigo-400" />
              <span>IBAN Düzenle</span>
            </button>
          </div>
        </div>

        {/* Bank Details Editor Panel (Optional Dropdown) - Hidden in Print */}
        {isEditingBank && (
          <div className="p-4 bg-indigo-950/40 border-b border-indigo-500/30 text-xs space-y-3 print:hidden">
            <div className="font-bold text-indigo-300 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> {currency} Para Birimi İçin Banka & IBAN Bilgilerini Özelleştir
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Hesap Sahibi Unvanı</label>
                <input
                  type="text"
                  value={activeBank.accountName}
                  onChange={(e) =>
                    setBankAccounts({
                      ...bankAccounts,
                      [currency]: { ...activeBank, accountName: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Banka Adı</label>
                <input
                  type="text"
                  value={activeBank.bankName}
                  onChange={(e) =>
                    setBankAccounts({
                      ...bankAccounts,
                      [currency]: { ...activeBank, bankName: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">IBAN Numarası</label>
                <input
                  type="text"
                  value={activeBank.iban}
                  onChange={(e) =>
                    setBankAccounts({
                      ...bankAccounts,
                      [currency]: { ...activeBank, iban: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">SWIFT Kodu</label>
                <input
                  type="text"
                  value={activeBank.swiftCode}
                  onChange={(e) =>
                    setBankAccounts({
                      ...bankAccounts,
                      [currency]: { ...activeBank, swiftCode: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* PROFORMA INVOICE DOCUMENT CANVAS (Exact Template) */}
        <div className="p-6 lg:p-10 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible">
          
          {/* Printable A4 Document Sheet */}
          <div className="max-w-4xl mx-auto space-y-6 print:max-w-none print:w-full">
            
            {/* 1. Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-900 pb-6">
              
              {/* Top Left: Logo & Slogan */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-amber-500 font-sans">
                    Pulcarpet
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-400 tracking-widest lowercase italic font-serif">
                  Pamperyourself
                </div>
              </div>

              {/* Top Right: Pulur Tekstil Legal Details */}
              <div className="text-right text-xs space-y-0.5 font-sans font-bold text-slate-900">
                <div className="text-sm font-black text-slate-900">PULUR TEKSTİL DIŞ TİC. LTD. ŞTİ.</div>
                <div className="text-slate-700 font-medium">Tatlıkuyu mah 1312/3 sokak no:14/a</div>
                <div className="text-slate-700 font-medium">Gebze / Kocaeli / TURKEY</div>
              </div>
            </div>

            {/* 2. Customer & Date / Incoterms Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start pt-2">
              {/* Left: Customer Address Box */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider print:hidden">Müşteri Bilgileri</div>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Müşteri / Firma Adı"
                  className="w-full text-base font-extrabold text-slate-900 uppercase border-b border-transparent hover:border-slate-300 focus:border-indigo-600 outline-none print:border-none p-0"
                />
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Adres Satırı 1"
                  className="w-full text-xs font-semibold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-indigo-600 outline-none print:border-none p-0"
                />
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Şehir / Posta Kodu"
                  className="w-full text-xs font-semibold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-indigo-600 outline-none print:border-none p-0"
                />
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Ülke"
                  className="w-full text-xs font-bold text-slate-900 uppercase border-b border-transparent hover:border-slate-300 focus:border-indigo-600 outline-none print:border-none p-0"
                />
              </div>

              {/* Right: Date, Incoterms & Invoice No Box */}
              <div className="space-y-2 text-right sm:text-right font-sans">
                <div className="flex items-center justify-end gap-2 text-xs">
                  <span className="font-extrabold text-slate-900 uppercase">DATE :</span>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-32 text-right text-xs font-bold border-b border-slate-300 focus:border-indigo-600 outline-none print:border-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 text-xs">
                  <span className="font-extrabold text-slate-900 uppercase">INCOTERMS :</span>
                  <input
                    type="text"
                    value={incoterms}
                    onChange={(e) => setIncoterms(e.target.value)}
                    className="w-40 text-right text-xs font-bold border-b border-slate-300 focus:border-indigo-600 outline-none print:border-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 text-xs">
                  <span className="font-extrabold text-slate-900 uppercase">INVOICE NO :</span>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="PRF-2026-001"
                    className="w-36 text-right text-xs font-mono font-extrabold border-b border-slate-300 focus:border-indigo-600 outline-none print:border-none text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* 3. Commercial / Proforma Invoice Banner Title (Editable) */}
            <div className="pt-2">
              <div className="text-center font-black text-lg sm:text-xl text-slate-900 uppercase tracking-wider border-y-2 border-slate-900 py-2 bg-slate-50 print:bg-transparent">
                <input
                  type="text"
                  value={invoiceTitle}
                  onChange={(e) => setInvoiceTitle(e.target.value)}
                  placeholder="COMMERCIAL INVOICE / PROFORMA INVOICE"
                  className="w-full text-center font-black text-lg sm:text-xl text-slate-900 uppercase tracking-wider bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-indigo-600 print:border-none"
                />
              </div>
            </div>

            {/* 4. Main Products Table */}
            <div className="space-y-2">
              <table className="w-full text-left text-xs border-2 border-slate-900 border-collapse">
                <thead>
                  <tr className="bg-slate-100 print:bg-transparent text-slate-900 font-extrabold border-b-2 border-slate-900 uppercase text-[11px]">
                    <th className="p-2.5 border-r-2 border-slate-900 w-[45%]">DESCRIPTION OF GOODS</th>
                    <th className="p-2.5 border-r-2 border-slate-900 text-center w-[12%]">ROLLS</th>
                    <th className="p-2.5 border-r-2 border-slate-900 text-center w-[13%]">SQM</th>
                    <th className="p-2.5 border-r-2 border-slate-900 text-right w-[15%]">UNIT PRICES</th>
                    <th className="p-2.5 text-right w-[15%]">AMOUNT ({currency})</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id} className="border-b border-slate-400 group">
                      {/* Description */}
                      <td className="p-2 border-r-2 border-slate-900 align-top">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="w-full font-bold text-slate-900 outline-none bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded p-0.5"
                        />
                        <input
                          type="text"
                          value={item.subSpec || ''}
                          onChange={(e) => updateItem(item.id, 'subSpec', e.target.value)}
                          placeholder="Spesifikasyon (ör: 100x1500 per roll)"
                          className="w-full text-[11px] text-slate-600 outline-none bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded p-0.5 mt-0.5"
                        />
                      </td>

                      {/* Rolls */}
                      <td className="p-2 border-r-2 border-slate-900 text-center align-top font-bold text-slate-900">
                        <input
                          type="number"
                          value={item.rolls}
                          onChange={(e) => updateItem(item.id, 'rolls', Number(e.target.value))}
                          className="w-16 text-center font-bold outline-none bg-transparent focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded p-0.5"
                        />
                      </td>

                      {/* SQM */}
                      <td className="p-2 border-r-2 border-slate-900 text-center align-top font-bold text-slate-900">
                        <input
                          type="number"
                          value={item.sqm}
                          onChange={(e) => updateItem(item.id, 'sqm', Number(e.target.value))}
                          className="w-16 text-center font-bold outline-none bg-transparent focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded p-0.5"
                        />
                      </td>

                      {/* Unit Prices */}
                      <td className="p-2 border-r-2 border-slate-900 text-right align-top font-bold text-slate-900">
                        <div className="flex items-center justify-end gap-1">
                          <span>{getCurrencySymbol(currency)}</span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                            className="w-20 text-right font-bold outline-none bg-transparent focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded p-0.5"
                          />
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="p-2 text-right align-top font-extrabold text-slate-900 relative">
                        <div className="flex items-center justify-end gap-1">
                          <span>{getCurrencySymbol(currency)}</span>
                          <span>{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>

                        {/* Delete row button (hover in edit mode) */}
                        {items.length > 1 && (
                          <button
                            onClick={() => removeItem(item.id)}
                            className="absolute right-1 top-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-rose-50 rounded print:hidden"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* GRAND TOTAL ROW */}
                  <tr className="border-t-2 border-slate-900 font-black text-slate-900 bg-slate-50 print:bg-transparent">
                    <td className="p-2.5 border-r-2 border-slate-900 uppercase font-black tracking-wider">
                      GRAND TOTAL
                    </td>
                    <td className="p-2.5 border-r-2 border-slate-900 text-center font-extrabold">
                      {totalRolls}
                    </td>
                    <td className="p-2.5 border-r-2 border-slate-900 text-center font-extrabold">
                      {totalSqm}
                    </td>
                    <td className="p-2.5 border-r-2 border-slate-900 text-right"></td>
                    <td className="p-2.5 text-right font-black text-sm text-slate-900">
                      {getCurrencySymbol(currency)} {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Add item button - Hidden in print */}
              <div className="pt-1 print:hidden flex justify-start">
                <button
                  onClick={addItem}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-lg border border-slate-200 hover:border-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" /> Kalem / Ürün Ekle
                </button>
              </div>
            </div>

            {/* 5. Footer Grid: Weights Left & Bank Details Right */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t-2 border-slate-900 items-start">
              
              {/* Bottom Left: Weights & Packages */}
              <div className="space-y-2 text-xs font-bold text-slate-900">
                <div className="flex items-center gap-2">
                  <span className="w-28 shrink-0">Gross weight :</span>
                  <input
                    type="number"
                    value={grossWeightKg}
                    onChange={(e) => setGrossWeightKg(Number(e.target.value))}
                    className="w-20 font-bold border-b border-slate-300 outline-none print:border-none"
                  />
                  <span>Kg</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-28 shrink-0">Net weight :</span>
                  <input
                    type="number"
                    value={netWeightKg}
                    onChange={(e) => setNetWeightKg(Number(e.target.value))}
                    className="w-20 font-bold border-b border-slate-300 outline-none print:border-none"
                  />
                  <span>Kg</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-28 shrink-0">Total packages :</span>
                  <input
                    type="text"
                    value={totalPackages}
                    onChange={(e) => setTotalPackages(e.target.value)}
                    placeholder="e.g. 14 Pallets / 28 Boxes"
                    className="w-48 font-bold border-b border-slate-300 outline-none print:border-none text-slate-900"
                  />
                </div>
              </div>

              {/* Bottom Right: OUR BANK DETAILS (Dynamic IBAN) */}
              <div className="border-2 border-slate-900 p-3 text-xs space-y-1 font-sans">
                <div className="text-center font-black uppercase text-slate-900 border-b border-slate-900 pb-1 mb-2 tracking-wider">
                  OUR BANK DETAILS ({currency})
                </div>

                <div className="flex items-start gap-1 font-extrabold text-slate-900">
                  <span className="w-20 shrink-0">ACCOUNT:</span>
                  <span className="uppercase">{activeBank.accountName}</span>
                </div>

                <div className="flex items-start gap-1 font-extrabold text-slate-900">
                  <span className="w-20 shrink-0">BANK:</span>
                  <span className="uppercase">{activeBank.bankName}</span>
                </div>

                <div className="flex items-start gap-1 font-black text-slate-900">
                  <span className="w-20 shrink-0">IBAN:</span>
                  <span className="font-mono tracking-wider">{activeBank.iban}</span>
                </div>

                <div className="flex items-start gap-1 font-extrabold text-slate-900">
                  <span className="w-20 shrink-0">SWIFT CODE:</span>
                  <span className="font-mono">{activeBank.swiftCode}</span>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Modal Footer Controls - Hidden in Print */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>PULARPET resmi fatura formatında hazırlanmaktadır.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
            >
              Kapat
            </button>

            <button
              onClick={() => {
                if (onSaveProforma) {
                  onSaveProforma({
                    invoiceTitle,
                    invoiceNumber,
                    date,
                    incoterms,
                    customerName,
                    addressLine1,
                    addressLine2,
                    country,
                    currency,
                    items,
                    grossWeightKg,
                    netWeightKg,
                    totalPackages,
                    customBankDetails: bankAccounts,
                  });
                }
                handlePrint();
              }}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Yazdır / PDF İndir</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
