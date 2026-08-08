import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Receipt, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Building2, 
  Calendar, 
  DollarSign, 
  Send,
  X,
  FileCheck
} from 'lucide-react';
import { FinancialAccountItem, VatTransaction } from '../types';

// Configure pdfjs worker with local URL
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch (e) {
  console.warn('pdfjs worker configuration warning:', e);
}

export interface ExtractedOcrInvoice {
  documentType: 'alacak' | 'borc' | 'kdv_ihracat' | 'okc_fis';
  documentTypeName?: string;
  partyName: string;
  taxNumber?: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  companyCategory?: string;
  summaryNote: string;
  items?: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice: number;
  }>;
}

interface InvoiceOcrDropzoneProps {
  onProcessInvoice: (
    financialItem: FinancialAccountItem,
    vatItem?: VatTransaction
  ) => void;
  onClose?: () => void;
}

export const InvoiceOcrDropzone: React.FC<InvoiceOcrDropzoneProps> = ({
  onProcessInvoice,
  onClose,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // OCR Data state for confirmation & edit before saving
  const [ocrResult, setOcrResult] = useState<ExtractedOcrInvoice | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const compressImageIfNeeded = (dataUrl: string, mimeType: string): Promise<{ dataUrl: string; mimeType: string }> => {
    return new Promise((resolve) => {
      if (!mimeType.startsWith('image/')) {
        return resolve({ dataUrl, mimeType });
      }

      const img = new Image();
      img.onload = () => {
        const MAX_SIZE = 1600;
        let width = img.width;
        let height = img.height;

        if (width <= MAX_SIZE && height <= MAX_SIZE) {
          // Re-encode to JPEG 0.85 to compress base64 size
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve({ dataUrl, mimeType });
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          return resolve({ dataUrl: compressedDataUrl, mimeType: 'image/jpeg' });
        }

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve({ dataUrl, mimeType });

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({ dataUrl: compressedDataUrl, mimeType: 'image/jpeg' });
      };
      img.onerror = () => resolve({ dataUrl, mimeType });
      img.src = dataUrl;
    });
  };

  const convertPdfToJpeg = async (pdfBase64: string): Promise<{ dataUrl: string; mimeType: string }> => {
    try {
      const base64Clean = pdfBase64.replace(/^data:[^;]+;base64,/, '').trim();
      const binaryStr = window.atob(base64Clean);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const loadingTask = pdfjsLib.getDocument({ data: bytes });
      const pdf = await loadingTask.promise;
      
      if (!pdf || pdf.numPages === 0) {
        throw new Error('PDF dosyası içinde sayfa tespit edilemedi.');
      }

      const pagesToRender = Math.min(pdf.numPages, 2);
      const renderedPages: HTMLCanvasElement[] = [];

      for (let i = 1; i <= pagesToRender; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = viewport.width;
        pageCanvas.height = viewport.height;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport, canvas: pageCanvas } as any).promise;
          renderedPages.push(pageCanvas);
        }
      }

      if (renderedPages.length === 0) {
        throw new Error('PDF sayfaları işlenemedi.');
      }

      if (renderedPages.length === 1) {
        return { dataUrl: renderedPages[0].toDataURL('image/jpeg', 0.85), mimeType: 'image/jpeg' };
      }

      const combinedWidth = Math.max(...renderedPages.map(c => c.width));
      const combinedHeight = renderedPages.reduce((sum, c) => sum + c.height, 0);

      const combinedCanvas = document.createElement('canvas');
      combinedCanvas.width = combinedWidth;
      combinedCanvas.height = combinedHeight;
      const combinedCtx = combinedCanvas.getContext('2d');

      if (combinedCtx) {
        let currentY = 0;
        for (const pCanvas of renderedPages) {
          combinedCtx.drawImage(pCanvas, 0, currentY);
          currentY += pCanvas.height;
        }
        return { dataUrl: combinedCanvas.toDataURL('image/jpeg', 0.85), mimeType: 'image/jpeg' };
      }

      return { dataUrl: renderedPages[0].toDataURL('image/jpeg', 0.85), mimeType: 'image/jpeg' };
    } catch (err) {
      console.warn('PDF image conversion fallback to raw PDF:', err);
      return { dataUrl: pdfBase64, mimeType: 'application/pdf' };
    }
  };

  const handleFileSelect = (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setFileName(file.name);

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('Dosya boyutu çok yüksek (Maksimum 25MB yükleyebilirsiniz).');
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name);

    if (!isImage && !isPdf) {
      setErrorMsg('Lütfen sadece PDF veya Görsel (PNG, JPG, WEBP) formatında fatura/fiş belgesi yükleyin.');
      return;
    }

    const detectedMimeType = isPdf ? 'application/pdf' : (file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onerror = () => {
      setErrorMsg('Dosya okunurken bir hata oluştu. Lütfen dosyayı tekrar seçin.');
    };
    reader.onload = async () => {
      const rawResult = reader.result as string;
      setIsScanning(true);

      let finalDataUrl = rawResult;
      let finalMimeType = detectedMimeType;

      if (isPdf) {
        const pdfConverted = await convertPdfToJpeg(rawResult);
        finalDataUrl = pdfConverted.dataUrl;
        finalMimeType = pdfConverted.mimeType;
      } else {
        const compressed = await compressImageIfNeeded(rawResult, detectedMimeType);
        finalDataUrl = compressed.dataUrl;
        finalMimeType = compressed.mimeType;
      }

      setPreviewImage(finalDataUrl);
      processFileWithOcr(finalDataUrl, finalMimeType);
    };
    reader.readAsDataURL(file);
  };

  const processFileWithOcr = async (base64Data: string, mimeType: string) => {
    setIsScanning(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/ai/parse-invoice-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64Data,
          mimeType: mimeType || 'image/jpeg',
        }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch (jsonErr) {
        console.error('OCR API non-JSON response:', jsonErr);
      }

      if (!response.ok || !data?.success) {
        const rawErr = data?.error;
        let backendError = '';
        if (typeof rawErr === 'string') {
          backendError = rawErr;
        } else if (rawErr && typeof rawErr === 'object') {
          backendError = rawErr.message || JSON.stringify(rawErr);
        }

        if (backendError) {
          throw new Error(backendError);
        }
        if (response.status === 413) {
          throw new Error('Dosya boyutu sunucu sınırını aşıyor. Lütfen daha küçük bir dosya seçin.');
        } else if (response.status === 404) {
          throw new Error('OCR servisine erişilemedi (404). Lütfen sunucu bağlantısını kontrol edin.');
        } else {
          throw new Error(`Fatura ayrıştırılamadı (HTTP ${response.status}). Lütfen belgenin netliğini kontrol edin.`);
        }
      }

      setOcrResult(data.ocrData);
    } catch (err: any) {
      console.error('OCR Process Error:', err);
      setErrorMsg(err.message || 'Fatura OCR taranırken hata oluştu.');
    } finally {
      setIsScanning(false);
    }
  };

  // Demo Samples for testing without real PDF upload
  const loadDemoInvoice = (type: 'iplik_alis' | 'okc_fis' | 'musteri_satis') => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsScanning(true);

    setTimeout(() => {
      if (type === 'iplik_alis') {
        setFileName('Tedarikci_Iplik_Alis_Faturasi_GIB2026.pdf');
        setPreviewImage('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80');
        setOcrResult({
          documentType: 'borc',
          documentTypeName: 'GİB e-Fatura (Tedarikçi Alış)',
          partyName: 'Aksu Sentetik İplik ve Tekstil San. A.Ş.',
          taxNumber: '1029384756',
          invoiceNumber: 'GIB2026000084920',
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          netAmount: 125000,
          vatRate: 20,
          vatAmount: 25000,
          totalAmount: 150000,
          companyCategory: 'İplik & Hammadde Tedarikçisi',
          summaryNote: '2.500 Kg Bambu İpek ve Saf Yün Dokuma İpliği Alımı',
          items: [
            { description: 'Bambu İpek İplik 100% Doğal 24/2', quantity: 1500, unitPrice: 50, totalPrice: 75000 },
            { description: 'Saf Yeni Zelanda Yünü İplik Beyaz', quantity: 1000, unitPrice: 50, totalPrice: 50000 }
          ]
        });
      } else if (type === 'okc_fis') {
        setFileName('OKC_YazarKasa_Z_Raporu_Fisi.png');
        setPreviewImage('https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80');
        setOcrResult({
          documentType: 'okc_fis',
          documentTypeName: 'ÖKC Yazar Kasa / Perakende Satış Fişi',
          partyName: 'PulCarpet Nişantaşı Mağaza ÖKC',
          taxNumber: '7890123456',
          invoiceNumber: 'OKC-Z-004291',
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          netAmount: 18500,
          vatRate: 20,
          vatAmount: 3700,
          totalAmount: 22200,
          companyCategory: 'ÖKC Perakende',
          summaryNote: 'Nişantaşı Mağazası Gün İçi Perakende Halı & Yolluk Peşin Satış Fişi',
          items: [
            { description: '120x180 Bambu İpek Yolluk Peşin Satış', quantity: 2, unitPrice: 9250, totalPrice: 18500 }
          ]
        });
      } else {
        setFileName('Musteri_Satis_EFatura_GIB2026.pdf');
        setPreviewImage('https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80');
        setOcrResult({
          documentType: 'alacak',
          documentTypeName: 'E-Arşiv Müşteri Satış Faturası',
          partyName: 'Hilton Bosphorus Otel İşletmeleri A.Ş.',
          taxNumber: '4650098123',
          invoiceNumber: 'GIB2026000010982',
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
          netAmount: 280000,
          vatRate: 20,
          vatAmount: 56000,
          totalAmount: 336000,
          companyCategory: 'Müşteri',
          summaryNote: '350 m² Otel Lobi Royal Akrilik Halı Özel Üretim ve Montaj',
          items: [
            { description: 'Royal Otel Akrilik Alev Almaz Halı Özel Ölçü', quantity: 350, unitPrice: 800, totalPrice: 280000 }
          ]
        });
      }
      setIsScanning(false);
    }, 900);
  };

  const handleSaveToAccounting = () => {
    if (!ocrResult) return;

    // Build Financial Account Item
    const finItem: FinancialAccountItem = {
      id: `FIN-OCR-${Date.now().toString().slice(-6)}`,
      type: ocrResult.documentType === 'borc' ? 'borc' : 'alacak',
      partyName: ocrResult.partyName || 'Bilinmeyen Cari',
      companyCategory: ocrResult.companyCategory || (ocrResult.documentType === 'borc' ? 'Tedarikçi' : 'Müşteri'),
      phone: '0212 900 00 00',
      amount: ocrResult.totalAmount || 0,
      dueDate: ocrResult.dueDate || new Date().toISOString().split('T')[0],
      issueDate: ocrResult.date || new Date().toISOString().split('T')[0],
      status: 'bekliyor',
      invoiceNumber: ocrResult.invoiceNumber || `OCR-${Date.now().toString().slice(-4)}`,
      parasutSynced: true,
      notes: `[AI OCR Otomatik İşleme] ${ocrResult.summaryNote}`
    };

    // Build VAT Item if applicable
    let vatItem: VatTransaction | undefined;
    if (ocrResult.vatAmount > 0 || ocrResult.documentType === 'kdv_ihracat') {
      let vatType: VatTransaction['type'] = 'alis_kdvli';
      if (ocrResult.documentType === 'alacak') vatType = 'yurttici_satis_kdvli';
      else if (ocrResult.documentType === 'kdv_ihracat') vatType = 'ihracat_satisi';
      else if (ocrResult.documentType === 'okc_fis') vatType = 'yurttici_satis_kdvli';

      vatItem = {
        id: `VAT-OCR-${Date.now().toString().slice(-6)}`,
        type: vatType,
        title: ocrResult.summaryNote || 'OCR Fatura KDV Kaydı',
        partyName: ocrResult.partyName,
        invoiceNo: ocrResult.invoiceNumber,
        date: ocrResult.date,
        netAmount: ocrResult.netAmount || 0,
        vatRate: ocrResult.vatRate || 0,
        vatAmount: ocrResult.vatAmount || 0,
        exportRefundAmount: vatType === 'ihracat_satisi' ? ocrResult.netAmount * 0.20 : 0,
        currency: 'TRY',
        notes: `e-Fatura OCR Taraması - VKN: ${ocrResult.taxNumber || 'Belirtilmedi'}`
      };
    }

    onProcessInvoice(finItem, vatItem);
    setSuccessMsg(`✓ ${ocrResult.partyName} faturası başarıyla Cari Hesaplara ve KDV Defterine işlendi!`);
    
    setTimeout(() => {
      setOcrResult(null);
      setPreviewImage(null);
      setFileName(null);
      if (onClose) onClose();
    }, 1800);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 md:p-6 shadow-xl border border-indigo-800/50 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-indigo-800/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-black text-white flex items-center gap-2">
              Akıllı Fatura & ÖKC Fiş Drag & Drop OCR
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                Gemini Vision AI
              </span>
            </h3>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              E-Fatura PDF'i, ÖKC yazar kasa fişi veya makbuz görselini sürükleyip bırakın, sistem cari ve KDV tutarlarını otomatik çıkarsın.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-indigo-300 hover:text-white hover:bg-indigo-900/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Drag & Drop Zone */}
      {!ocrResult && !isScanning && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            let droppedFile: File | null = null;
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              droppedFile = e.dataTransfer.files[0];
            } else if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
              const item = e.dataTransfer.items[0];
              if (item.kind === 'file') {
                droppedFile = item.getAsFile();
              }
            }
            if (droppedFile) {
              handleFileSelect(droppedFile);
            } else {
              setErrorMsg('Bırakılan nesne geçerli bir dosya olarak algılanamadı.');
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-indigo-400 bg-indigo-900/40 scale-[1.01]'
              : 'border-indigo-700/60 hover:border-indigo-400 bg-slate-900/60 hover:bg-indigo-950/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />

          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-inner">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <div className="text-sm font-bold text-white">
              Fatura PDF, ÖKC Fiş veya Görsel Dosyasını Buraya Sürükleyin
            </div>
            <div className="text-xs text-indigo-300/80 mt-1">
              veya bilgisayarınızdan seçmek için tıklayın (PDF, PNG, JPG, WEBP)
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-2">
            <span className="text-[10px] bg-slate-800 text-indigo-200 px-2.5 py-1 rounded-md border border-indigo-800">
              📄 E-Fatura / E-Arşiv PDF
            </span>
            <span className="text-[10px] bg-slate-800 text-indigo-200 px-2.5 py-1 rounded-md border border-indigo-800">
              🧾 ÖKC / Yazar Kasa Fişi
            </span>
            <span className="text-[10px] bg-slate-800 text-indigo-200 px-2.5 py-1 rounded-md border border-indigo-800">
              🚚 İplik & Fason Alış Faturası
            </span>
          </div>
        </div>
      )}

      {/* Demo Shortcuts for Instant Testing */}
      {!ocrResult && !isScanning && (
        <div className="bg-slate-950/50 p-3.5 rounded-xl border border-indigo-900/50 flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-emerald-400" /> Veya hazır örnek belgelerle anında deneyin:
          </span>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadDemoInvoice('iplik_alis')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-rose-300 rounded-lg border border-rose-800/40 transition-colors cursor-pointer"
            >
              🚚 Tedarikçi İplik Alış Faturası
            </button>
            <button
              onClick={() => loadDemoInvoice('okc_fis')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 rounded-lg border border-amber-800/40 transition-colors cursor-pointer"
            >
              🧾 ÖKC Yazar Kasa Fişi
            </button>
            <button
              onClick={() => loadDemoInvoice('musteri_satis')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-300 rounded-lg border border-emerald-800/40 transition-colors cursor-pointer"
            >
              🏢 Müşteri E-Arşiv Satış Faturası
            </button>
          </div>
        </div>
      )}

      {/* Loading & Scanning Animation State */}
      {isScanning && (
        <div className="bg-slate-950/80 p-8 rounded-xl border border-indigo-500/40 text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-white">
              Fatura Metinleri & Tutar Bilgileri OCR Taramasından Geçiyor...
            </div>
            <div className="text-xs text-indigo-300/80 mt-1">
              Gemini Vision AI: Firma Unvanı, Vergi No, KDV Oranı ve Matrahlar Ayıklanıyor
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success Message */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-200 text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Extracted OCR Results Form & Preview */}
      {ocrResult && (
        <div className="bg-slate-950/80 rounded-xl p-5 border border-indigo-700/60 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold text-white">OCR Taraması Tamamlandı</span>
              <span className="text-xs bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded font-mono">
                {fileName || 'Tarama Belgesi'}
              </span>
            </div>

            <button
              onClick={() => {
                setOcrResult(null);
                setPreviewImage(null);
              }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Yeniden Yükle
            </button>
          </div>

          {/* Form Fields & Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Left: Document details */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-indigo-300 mb-1">
                  Belge Türü & Cari Kategorisi
                </label>
                <div className="flex gap-2">
                  <select
                    value={ocrResult.documentType}
                    onChange={(e) => setOcrResult({ ...ocrResult, documentType: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  >
                    <option value="alacak">Müşteri Satış Faturası (Alacak)</option>
                    <option value="borc">Tedarikçi Alış Faturası (Borç)</option>
                    <option value="okc_fis">ÖKC Yazar Kasa Fişi</option>
                    <option value="kdv_ihracat">İhracat Faturası (%0 KDV)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-indigo-300 mb-1">
                  Karşı Firma Unvanı
                </label>
                <input
                  type="text"
                  value={ocrResult.partyName}
                  onChange={(e) => setOcrResult({ ...ocrResult, partyName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-indigo-300 mb-1">
                    Vergi / TCKN No
                  </label>
                  <input
                    type="text"
                    value={ocrResult.taxNumber || ''}
                    onChange={(e) => setOcrResult({ ...ocrResult, taxNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-indigo-300 mb-1">
                    Fatura / Fiş No
                  </label>
                  <input
                    type="text"
                    value={ocrResult.invoiceNumber}
                    onChange={(e) => setOcrResult({ ...ocrResult, invoiceNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-indigo-300 mb-1">
                    Belge Tarihi
                  </label>
                  <input
                    type="date"
                    value={ocrResult.date}
                    onChange={(e) => setOcrResult({ ...ocrResult, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-indigo-300 mb-1">
                    Vade Tarihi
                  </label>
                  <input
                    type="date"
                    value={ocrResult.dueDate}
                    onChange={(e) => setOcrResult({ ...ocrResult, dueDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Right: Amounts & Financial breakdown */}
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-indigo-300 border-b border-slate-800 pb-2 flex justify-between">
                <span>Tutar ve KDV Dağılımı</span>
                <span className="text-emerald-400 font-mono">Paraşüt Uyumlu</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Matrah (KDV Hariç)</label>
                  <input
                    type="number"
                    value={ocrResult.netAmount}
                    onChange={(e) => {
                      const net = parseFloat(e.target.value) || 0;
                      const vat = (net * (ocrResult.vatRate || 20)) / 100;
                      setOcrResult({
                        ...ocrResult,
                        netAmount: net,
                        vatAmount: vat,
                        totalAmount: net + vat,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">KDV Oranı (%)</label>
                  <select
                    value={ocrResult.vatRate}
                    onChange={(e) => {
                      const rate = parseInt(e.target.value) || 0;
                      const vat = (ocrResult.netAmount * rate) / 100;
                      setOcrResult({
                        ...ocrResult,
                        vatRate: rate,
                        vatAmount: vat,
                        totalAmount: ocrResult.netAmount + vat,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white font-bold"
                  >
                    <option value={20}>%20</option>
                    <option value={10}>%10</option>
                    <option value={1}>%1</option>
                    <option value={0}>%0 (İhracat / İstisna)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
                <div>
                  <div className="text-[10px] text-slate-400">Hesaplanan KDV</div>
                  <div className="text-sm font-mono font-bold text-indigo-300">
                    {ocrResult.vatAmount.toLocaleString('tr-TR')} ₺
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400">Genel Toplam (Yazılan)</div>
                  <div className="text-base font-mono font-black text-emerald-400">
                    {ocrResult.totalAmount.toLocaleString('tr-TR')} ₺
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Açıklama / Fatura Notu</label>
                <textarea
                  rows={2}
                  value={ocrResult.summaryNote}
                  onChange={(e) => setOcrResult({ ...ocrResult, summaryNote: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
            <span className="text-xs text-indigo-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Doğrudan Cari Hesap Bakiye Tablosuna ve KDV Defterine Kaydedilir.
            </span>

            <button
              onClick={handleSaveToAccounting}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" /> Cari Hesap & KDV Defterine Doğrudan İşle
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
