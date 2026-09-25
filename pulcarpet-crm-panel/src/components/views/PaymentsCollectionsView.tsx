import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Search, 
  Trash2, 
  FileSpreadsheet, 
  Printer, 
  Coins, 
  UserCheck, 
  Building2, 
  Sparkles, 
  History, 
  AlertCircle,
  Filter,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Receipt
} from 'lucide-react';

export interface PaymentCollectionRecord {
  id: string;
  type: 'odeme' | 'tahsilat'; // 'odeme' = Ödeme / Çıkış (-), 'tahsilat' = Tahsilat / Giriş (+)
  date: string; // YYYY-MM-DD
  category: 'kredi_karti' | 'sahis' | 'tedarikci' | 'musteri_tahsilat' | 'fason' | 'kira_fatura' | 'personel' | 'diger';
  title: string;
  partyName: string; // Kredi Kartı Banka Adı, Şahıs / Kişi Adı veya Firma
  amount: number;
  currency: 'TL' | 'USD' | 'EUR' | 'GBP';
  paymentMethod: 'banka_havale' | 'kredi_karti' | 'nakit' | 'cek_senet';
  receiptNo?: string;
  notes?: string;
  operator?: string;
  createdAt: string;
}

interface PaymentsCollectionsViewProps {
  currentUser?: { username: string; name: string; role: string; token: string } | null;
}

export const PaymentsCollectionsView: React.FC<PaymentsCollectionsViewProps> = ({ currentUser }) => {
  // Toast Notification State
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // LocalStorage Persistence for Payments & Collections Records
  const [records, setRecords] = useState<PaymentCollectionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('pulcarpet_payments_collections_v1');
      if (saved) {
        const parsed: PaymentCollectionRecord[] = JSON.parse(saved);
        // Filter out old demo records if present
        const demoIds = ['pay-101', 'pay-102', 'pay-103', 'pay-104', 'pay-105', 'pay-106', 'pay-107'];
        return parsed.filter(r => !demoIds.includes(r.id));
      }
    } catch (e) {
      console.error('Error loading payments & collections records:', e);
    }
    return [];
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pulcarpet_payments_collections_v1', JSON.stringify(records));
    } catch (e) {
      console.error('Error saving records:', e);
    }
  }, [records]);

  // Manual Form State
  const [formType, setFormType] = useState<'odeme' | 'tahsilat'>('odeme');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState<'kredi_karti' | 'sahis' | 'tedarikci' | 'musteri_tahsilat' | 'fason' | 'kira_fatura' | 'personel' | 'diger'>('kredi_karti');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formPartyName, setFormPartyName] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCurrency, setFormCurrency] = useState<'TL' | 'USD' | 'EUR' | 'GBP'>('TL');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'banka_havale' | 'kredi_karti' | 'nakit' | 'cek_senet'>('banka_havale');
  const [formReceiptNo, setFormReceiptNo] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all'); // 'all' | 'odeme' | 'tahsilat'
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');

  // Submit Handler
  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formAmount);
    if (!formTitle.trim() || !formPartyName.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('error', 'Lütfen geçerli işlem başlığı, alıcı/ödeyen adı ve tutar giriniz.');
      return;
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    const newRec: PaymentCollectionRecord = {
      id: `pay-${Date.now()}`,
      type: formType,
      date: formDate || new Date().toISOString().split('T')[0],
      category: formCategory,
      title: formTitle.trim(),
      partyName: formPartyName.trim(),
      amount: parsedAmount,
      currency: formCurrency,
      paymentMethod: formPaymentMethod,
      receiptNo: formReceiptNo.trim() || `ISL-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: formNotes.trim(),
      operator: currentUser?.name || 'Kadir Korkmaz',
      createdAt: `${formDate || new Date().toISOString().split('T')[0]} ${timeStr}`,
    };

    setRecords([newRec, ...records]);
    showToast(
      'success',
      `${newRec.type === 'tahsilat' ? 'Tahsilat' : 'Ödeme'} kaydı (${parsedAmount.toLocaleString('tr-TR')} ${formCurrency}) başarıyla kaydedildi.`
    );

    // Clear form fields
    setFormTitle('');
    setFormPartyName('');
    setFormAmount('');
    setFormReceiptNo('');
    setFormNotes('');
  };

  // Delete Handler
  const handleDeleteRecord = (id: string, title: string) => {
    if (window.confirm(`"${title}" kaydını silmek istediğinize emin misiniz?`)) {
      setRecords(records.filter((r) => r.id !== id));
      showToast('info', 'İşlem kaydı silindi.');
    }
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    if (records.length === 0) {
      showToast('error', 'Dışa aktarılacak işlem kaydı bulunamadı.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'Islem Tipi;Tarih;Kategori;Islem Basligi;Alici / Odeyen / Sahis;Tutar;Para Birimi;Odeme Sekli;Dekont / Belge No;Aciklama;Operator\n';

    records.forEach((rec) => {
      const typeStr = rec.type === 'tahsilat' ? 'TAHSİLAT (+)' : 'ÖDEME (-)';
      const catMap: Record<string, string> = {
        kredi_karti: 'Kredi Kartı',
        sahis: 'Şahıs Ödemesi / Tahsilat',
        tedarikci: 'Tedarikçi Ödemesi',
        musteri_tahsilat: 'Müşteri Tahsilatı',
        fason: 'Fason İmalat',
        kira_fatura: 'Kira / Fatura',
        personel: 'Maaş / Avans',
        diger: 'Diğer Kasa / Banka',
      };

      const methodMap: Record<string, string> = {
        banka_havale: 'Banka Havalesi / EFT',
        kredi_karti: 'Kredi Kartı',
        nakit: 'Nakit Kasa',
        cek_senet: 'Çek / Senet',
      };

      const row = [
        typeStr,
        rec.date,
        catMap[rec.category] || rec.category,
        `"${rec.title.replace(/"/g, '""')}"`,
        `"${rec.partyName.replace(/"/g, '""')}"`,
        rec.amount,
        rec.currency,
        methodMap[rec.paymentMethod] || rec.paymentMethod,
        rec.receiptNo || '',
        `"${(rec.notes || '').replace(/"/g, '""')}"`,
        rec.operator || '',
      ].join(';');

      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Odeme_ve_Tahsilat_Raporu_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Ödeme ve tahsilat raporu CSV dosyası indirildi.');
  };

  // Metric Calculations
  const totalOdemeTL = records
    .filter((r) => r.type === 'odeme' && r.currency === 'TL')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalTahsilatTL = records
    .filter((r) => r.type === 'tahsilat' && r.currency === 'TL')
    .reduce((sum, r) => sum + r.amount, 0);

  const netBalanceTL = totalTahsilatTL - totalOdemeTL;

  const creditCardOdemeTL = records
    .filter((r) => r.type === 'odeme' && r.category === 'kredi_karti' && r.currency === 'TL')
    .reduce((sum, r) => sum + r.amount, 0);

  const sahisNetTL = records
    .filter((r) => r.category === 'sahis' && r.currency === 'TL')
    .reduce((sum, r) => (r.type === 'tahsilat' ? sum + r.amount : sum - r.amount), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Toast Notification Floating Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl text-white font-bold text-xs flex items-center gap-2.5 animate-bounce ${
          toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950/80 to-slate-900 rounded-2xl p-6 text-white shadow-xl space-y-4 relative overflow-hidden border border-emerald-900/40">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Wallet className="w-48 h-48 text-emerald-300" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full">
                Doğrudan Kasa & Banka Hareketi
              </span>
              <span className="text-emerald-400/90 font-mono text-xs">Ayrılmış Finans Modülü v2.5</span>
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
              <Coins className="w-7 h-7 text-emerald-400" /> Yapılan Ödemeler & Alınan Tahsilatlar
            </h2>
            <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl">
              Bu bölümde sadece sizin manuel olarak girdiğiniz kredi kartı ekstre ödemeleri, şahsi borç/alacaklar, tedarikçi ödemeleri ve müşteri tahsilatları takip edilir.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-900/90 hover:bg-slate-800 text-emerald-200 border border-emerald-500/30 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Raporu CSV İndir</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-md transition-all flex items-center gap-2 cursor-pointer border border-emerald-400/30"
            >
              <Printer className="w-4 h-4 text-emerald-100" />
              <span>Yazdır</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Tahsilat (+) */}
        <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
            <span>Toplam Alınan Tahsilat (+)</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 font-mono">
            +{totalTahsilatTL.toLocaleString('tr-TR')} ₺
          </div>
          <p className="text-[10px] text-emerald-700 font-medium">Müşteri & Şahıs nakit/banka girişleri</p>
        </div>

        {/* Card 2: Total Ödeme (-) */}
        <div className="bg-rose-50/80 border border-rose-200 p-4 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
            <span>Toplam Yapılan Ödemeler (-)</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900 font-mono">
            -{totalOdemeTL.toLocaleString('tr-TR')} ₺
          </div>
          <p className="text-[10px] text-rose-700 font-medium">Kredi kartı, şahıs, iplik & fatura harcamaları</p>
        </div>

        {/* Card 3: Net Balance */}
        <div className={`p-4 rounded-2xl shadow-xs space-y-1 border ${
          netBalanceTL >= 0
            ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
            : 'bg-amber-50/80 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold">
            <span>Net Kasa / Banka Bakiyesi</span>
            <Wallet className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black font-mono">
            {netBalanceTL >= 0 ? '+' : ''}{netBalanceTL.toLocaleString('tr-TR')} ₺
          </div>
          <p className="text-[10px] opacity-80 font-medium">
            {netBalanceTL >= 0 ? 'Tahsilat ödemelerden fazla (Kasa Artıda)' : 'Ödemeler tahsilatlardan fazla'}
          </p>
        </div>

        {/* Card 4: Credit Cards & Person Breakdown */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Kredi Kartı & Şahıs Özeti</span>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 pt-0.5">
            KK Ödemeleri: <span className="font-mono text-purple-700">{creditCardOdemeTL.toLocaleString('tr-TR')} ₺</span>
          </div>
          <div className="text-xs text-slate-600 font-medium">
            Şahsi Bakiye Net: <span className={`font-mono font-bold ${sahisNetTL >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{sahisNetTL.toLocaleString('tr-TR')} ₺</span>
          </div>
        </div>
      </div>

      {/* Main Form & Data Table Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Manual Data Entry Form */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleAddRecord} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" /> Manuel Ödeme / Tahsilat Girişi
              </h3>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-mono font-bold px-2 py-0.5 rounded-full">
                SADECE MANUEL KASA
              </span>
            </div>

            {/* Transaction Type Selector Buttons */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">İşlem Yönü / Tipi:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormType('odeme');
                    if (formCategory === 'musteri_tahsilat') setFormCategory('kredi_karti');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                    formType === 'odeme'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-rose-50 border-slate-200'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Ödeme Yapıldı (-)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormType('tahsilat');
                    setFormCategory('musteri_tahsilat');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                    formType === 'tahsilat'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 border-slate-200'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Tahsilat Alındı (+)</span>
                </button>
              </div>
            </div>

            {/* Date & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tarih:</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Kategori:</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 cursor-pointer"
                >
                  {formType === 'odeme' ? (
                    <>
                      <option value="kredi_karti">💳 Kredi Kartı Ödemesi / Ekstre Borcu</option>
                      <option value="sahis">👤 Şahsa / Kişiye Borç Ödemesi</option>
                      <option value="tedarikci">🏭 Tedarikçi / İplik Ödemesi</option>
                      <option value="fason">✂️ Fason İmalat / Yıkama / Overlock</option>
                      <option value="kira_fatura">💡 Kira / Elektrik / Fatura</option>
                      <option value="personel">👷 Maaş / Personel Avansı</option>
                      <option value="diger">📦 Diğer Kasa / Şirket Harcaması</option>
                    </>
                  ) : (
                    <>
                      <option value="musteri_tahsilat">🏢 Müşteri Cari Tahsilatı</option>
                      <option value="sahis">👤 Şahıstan / Kişiden Alacak Tahsilatı</option>
                      <option value="diger">💵 Diğer Para Girişi / Kasa Transferi</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                İşlem / Ödeme / Tahsilat Başlığı:
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={formType === 'odeme' ? "Örn: Garanti BBVA Kredi Kartı Ekstre Borcu" : "Örn: Al-Mansoor Trading Proje Avans Tahsilatı"}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Party Name / Person Name / Card Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {formType === 'odeme' ? "Ödeme Yapılan Alıcı / Kart / Şahıs Adı:" : "Ödeyen Müşteri / Şahıs / Firma Adı:"}
              </label>
              <input
                type="text"
                value={formPartyName}
                onChange={(e) => setFormPartyName(e.target.value)}
                placeholder={formType === 'odeme' ? "Örn: Garanti Bankası KK veya Ahmet Yılmaz" : "Örn: Al-Mansoor Trading W.L.L."}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Amount & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">İşlem Tutarı:</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="Örn: 25000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Para Birimi:</label>
                <select
                  value={formCurrency}
                  onChange={(e) => setFormCurrency(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 cursor-pointer"
                >
                  <option value="TL">Türk Lirası (₺)</option>
                  <option value="USD">Amerikan Doları ($)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="GBP">İngiliz Sterlini (£)</option>
                </select>
              </div>
            </div>

            {/* Payment Method & Receipt / Dekont No */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ödeme Şekli:</label>
                <select
                  value={formPaymentMethod}
                  onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 cursor-pointer"
                >
                  <option value="banka_havale">🏦 Banka Havalesi / EFT / FAST</option>
                  <option value="kredi_karti">💳 Kredi Kartı</option>
                  <option value="nakit">💵 Nakit Kasa</option>
                  <option value="cek_senet">📄 Çek / Senet</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Belge / Dekont / Fiş No:</label>
                <input
                  type="text"
                  value={formReceiptNo}
                  onChange={(e) => setFormReceiptNo(e.target.value)}
                  placeholder="Örn: DEK-882194"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Açıklama / Detaylar:</label>
              <textarea
                rows={2}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="İşlem ile ilgili açıklama notları..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className={`w-full font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-white ${
                formType === 'tahsilat' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{formType === 'tahsilat' ? 'Tahsilat Kaydını Ekle (+)' : 'Ödeme Kaydını Ekle (-)'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Transactions History Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            {/* Table Header & Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Ödeme & Tahsilat İşlem Geçmişi ({records.length})
                </h3>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Type Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 text-slate-700 cursor-pointer"
                >
                  <option value="all">Tüm Yönler (Ödeme & Tahsilat)</option>
                  <option value="odeme">🔴 Sadece Ödemeler (-)</option>
                  <option value="tahsilat">🟢 Sadece Tahsilatlar (+)</option>
                </select>

                {/* Category Filter */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 text-slate-700 cursor-pointer"
                >
                  <option value="all">Tüm Kategoriler</option>
                  <option value="kredi_karti">💳 Kredi Kartı</option>
                  <option value="sahis">👤 Şahıs</option>
                  <option value="tedarikci">🏭 Tedarikçi</option>
                  <option value="musteri_tahsilat">🏢 Müşteri Tahsilat</option>
                  <option value="kira_fatura">💡 Kira & Fatura</option>
                  <option value="personel">👷 Personel</option>
                </select>

                {/* Method Filter */}
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 text-slate-700 cursor-pointer"
                >
                  <option value="all">Tüm Ödeme Şekilleri</option>
                  <option value="banka_havale">Havale / EFT</option>
                  <option value="kredi_karti">Kredi Kartı</option>
                  <option value="nakit">Nakit</option>
                  <option value="cek_senet">Çek / Senet</option>
                </select>
              </div>
            </div>

            {/* Quick Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Başlık, alıcı/ödeyen adı veya dekont no ile arama..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filtered Data Table */}
            {(() => {
              const filtered = records.filter((rec) => {
                const matchesQuery =
                  !searchQuery.trim() ||
                  rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  rec.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (rec.receiptNo && rec.receiptNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (rec.notes && rec.notes.toLowerCase().includes(searchQuery.toLowerCase()));

                const matchesType = filterType === 'all' || rec.type === filterType;
                const matchesCategory = filterCategory === 'all' || rec.category === filterCategory;
                const matchesMethod = filterMethod === 'all' || rec.paymentMethod === filterMethod;

                return matchesQuery && matchesType && matchesCategory && matchesMethod;
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-8 text-center space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-600 font-bold">Filtrelerinize uygun işlem kaydı bulunamadı.</p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="p-2.5">Yön / Tarih</th>
                        <th className="p-2.5">Kategori</th>
                        <th className="p-2.5">Başlık & Şahıs/Firma</th>
                        <th className="p-2.5">Dekont / Şekil</th>
                        <th className="p-2.5 text-right">Tutar</th>
                        <th className="p-2.5 text-center">Sil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((rec) => {
                        const isTahsilat = rec.type === 'tahsilat';
                        let catBg = 'bg-slate-100 text-slate-800';
                        let catLabel = 'Genel';

                        if (rec.category === 'kredi_karti') {
                          catBg = 'bg-purple-100 text-purple-900';
                          catLabel = 'Kredi Kartı';
                        } else if (rec.category === 'sahis') {
                          catBg = 'bg-amber-100 text-amber-900';
                          catLabel = 'Şahıs';
                        } else if (rec.category === 'tedarikci') {
                          catBg = 'bg-indigo-100 text-indigo-900';
                          catLabel = 'Tedarikçi';
                        } else if (rec.category === 'musteri_tahsilat') {
                          catBg = 'bg-emerald-100 text-emerald-900';
                          catLabel = 'Müşteri Tahsilat';
                        } else if (rec.category === 'kira_fatura') {
                          catBg = 'bg-rose-100 text-rose-900';
                          catLabel = 'Kira / Fatura';
                        } else if (rec.category === 'personel') {
                          catBg = 'bg-teal-100 text-teal-900';
                          catLabel = 'Maaş / Avans';
                        }

                        return (
                          <tr key={rec.id} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="p-2.5 font-mono text-[11px] whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  isTahsilat ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {isTahsilat ? '+ Tahsilat' : '- Ödeme'}
                                </span>
                                <span className="text-slate-500">{rec.date}</span>
                              </div>
                            </td>

                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${catBg}`}>
                                {catLabel}
                              </span>
                            </td>

                            <td className="p-2.5">
                              <div className="font-bold text-slate-900">{rec.title}</div>
                              <div className="text-[11px] text-slate-500">
                                {isTahsilat ? 'Ödeyen: ' : 'Alıcı: '}
                                <strong className="text-slate-700">{rec.partyName}</strong>
                                {rec.notes && <span className="block text-[10px] text-slate-400 italic">{rec.notes}</span>}
                              </div>
                            </td>

                            <td className="p-2.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                              <div>{rec.receiptNo || '-'}</div>
                              <span className="text-[9px] text-slate-400 uppercase">{rec.paymentMethod}</span>
                            </td>

                            <td className={`p-2.5 text-right font-mono font-black text-sm whitespace-nowrap ${
                              isTahsilat ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {isTahsilat ? '+' : '-'}{rec.amount.toLocaleString('tr-TR')} {rec.currency}
                            </td>

                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteRecord(rec.id, rec.title)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Kaydı Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
