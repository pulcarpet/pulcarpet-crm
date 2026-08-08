import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Upload, CheckCircle, AlertCircle, X, Download, Plus, ArrowRight, Table } from 'lucide-react';
import { Order, CarpetProduct, Customer, CarpetOrderItem } from '../types';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportOrders?: (orders: Order[]) => void;
  onImportProducts?: (products: CarpetProduct[]) => void;
  onImportCustomers?: (customers: Customer[]) => void;
  defaultType?: 'orders' | 'products' | 'customers';
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportOrders,
  onImportProducts,
  onImportCustomers,
  defaultType = 'orders',
}) => {
  const [importType, setImportType] = useState<'orders' | 'products' | 'customers'>(defaultType);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processExcelFile = (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setErrorMsg('Excel dosyasında okunabilir veri satırı bulunamadı.');
          setParsedData([]);
          return;
        }

        setParsedData(rawJson);
      } catch (err: any) {
        console.error('Excel okuma hatası:', err);
        setErrorMsg('Excel dosyası okunamadı. Lütfen geçerli bir .xlsx veya .csv dosyası yükleyin.');
        setParsedData([]);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Dosya okuma esnasında bir hata oluştu.');
    };
    reader.readAsBinaryString(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls') ||
        file.name.endsWith('.csv')
      ) {
        processExcelFile(file);
      } else {
        setErrorMsg('Lütfen sadece .xlsx, .xls veya .csv uzantılı Excel dosyaları sürükleyin.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processExcelFile(e.target.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (parsedData.length === 0) return;

    try {
      if (importType === 'orders' && onImportOrders) {
        const newOrders: Order[] = parsedData.map((row, idx) => {
          const widthCm = Number(row['En (cm)'] || row['En'] || row['width'] || 200);
          const lengthCm = Number(row['Boy (cm)'] || row['Boy'] || row['length'] || 300);
          const quantity = Number(row['Adet'] || row['quantity'] || 1);
          const unitPrice = Number(row['m2 Birim Fiyat'] || row['Fiyat'] || row['price'] || 1200);
          const areaM2 = (widthCm * lengthCm) / 10000;
          const totalPrice = areaM2 * unitPrice * quantity;

          const item: CarpetOrderItem = {
            id: `ITEM-EXCEL-${Date.now()}-${idx}`,
            collectionName: String(row['Koleksiyon/Ürün'] || row['Ürün Adı'] || row['Ürün'] || 'Excel İthal Halı'),
            colorCode: String(row['Renk/Kod'] || row['Renk'] || 'PC-EXCEL'),
            widthCm,
            lengthCm,
            quantity,
            areaM2,
            fiberType: 'bambu_ipek',
            pileHeightMm: 10,
            edgeFinish: 'overlok',
            unitPricePerM2: unitPrice,
            totalPrice,
          };

          return {
            id: `ORD-EXCEL-${Math.floor(1000 + Math.random() * 9000)}`,
            orderNumber: String(row['Sipariş No'] || `PC-${Math.floor(10000 + Math.random() * 89999)}`),
            customerName: String(row['Müşteri Adı'] || row['Müşteri'] || 'Excel Müşterisi'),
            company: String(row['Firma'] || row['Şirket'] || ''),
            phone: String(row['Telefon'] || row['Tel'] || '+90 500 000 0000'),
            items: [item],
            totalM2: areaM2 * quantity,
            totalAmount: totalPrice,
            status: 'musteri_onayi',
            createdAt: new Date().toISOString().split('T')[0],
            deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            shippingAddress: String(row['Adres'] || row['Şehir'] || 'İstanbul'),
            isCustomProduction: true,
          };
        });

        onImportOrders(newOrders);
        setSuccessMsg(`${newOrders.length} adet sipariş Excel'den başarıyla içe aktarıldı!`);
      } else if (importType === 'products' && onImportProducts) {
        const newProducts: CarpetProduct[] = parsedData.map((row, idx) => ({
          id: `PRD-EXCEL-${Date.now()}-${idx}`,
          code: String(row['Ürün Kod'] || row['Kod'] || `EXCEL-PC-${idx + 1}`),
          name: String(row['Ürün Adı'] || row['Ad'] || row['Koleksiyon'] || 'Excel Koleksiyonu'),
          category: 'Bambu İpek',
          fiberType: 'bambu_ipek',
          pileHeightMm: 10,
          densityPoints: 1200000,
          colorVariants: [String(row['Renk'] || 'Vizon/Gümüş')],
          pricePerM2: Number(row['Fiyat'] || row['m2 Fiyatı'] || 1250),
          stockM2: Number(row['Stok (m2)'] || row['Stok'] || 500),
          image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&q=80&w=800',
        }));

        onImportProducts(newProducts);
        setSuccessMsg(`${newProducts.length} adet ürün kataloğa eklendi!`);
      } else if (importType === 'customers' && onImportCustomers) {
        const newCustomers: Customer[] = parsedData.map((row, idx) => ({
          id: `CUST-EXCEL-${Date.now()}-${idx}`,
          name: String(row['Müşteri Adı'] || row['Ad Soyad'] || row['İsim'] || 'Excel Müşterisi'),
          company: String(row['Firma'] || row['Şirket'] || ''),
          email: String(row['E-posta'] || row['Email'] || 'ornek@musteri.com'),
          phone: String(row['Telefon'] || row['Tel'] || '+90 500 000 0000'),
          city: String(row['Şehir'] || row['Adres'] || 'İstanbul'),
          status: 'gorusmede',
          leadScore: 85,
          totalDealValue: Number(row['Toplam Bütçe'] || row['Tutar'] || 50000),
          lastContact: new Date().toISOString().split('T')[0],
          notes: 'Excel aktarımı ile eklendi',
          assignedAgent: 'Ahmet Yılmaz',
        }));

        onImportCustomers(newCustomers);
        setSuccessMsg(`${newCustomers.length} müşteri CRM veritabanına aktarıldı!`);
      }

      setTimeout(() => {
        onClose();
        setParsedData([]);
        setFileName(null);
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Veri aktarımı sırasında bir hata oluştu. Sütun isimlerini kontrol ediniz.');
    }
  };

  const downloadSampleTemplate = () => {
    let sampleData: any[] = [];
    let templateName = 'pulcarpet_sample_template.xlsx';

    if (importType === 'orders') {
      sampleData = [
        {
          'Müşteri Adı': 'Selin Karaca',
          'Firma': 'Karaca İç Mimarlık',
          'Telefon': '+90 532 100 2030',
          'Koleksiyon/Ürün': 'SilkTouch Bambu İpek',
          'Renk/Kod': 'PC-B-104 Vizon',
          'En (cm)': 200,
          'Boy (cm)': 300,
          'Adet': 2,
          'm2 Birim Fiyat': 1450,
          'Adres': 'İstanbul / Etiler',
        },
        {
          'Müşteri Adı': 'Mert Yılmaz',
          'Firma': 'Otel Bosphorus',
          'Telefon': '+90 533 444 5566',
          'Koleksiyon/Ürün': 'Royal Otel Serisi',
          'Renk/Kod': 'PC-R-802 Gold',
          'En (cm)': 400,
          'Boy (cm)': 600,
          'Adet': 1,
          'm2 Birim Fiyat': 1850,
          'Adres': 'İstanbul / Beşiktaş',
        },
      ];
      templateName = 'pulcarpet_siparis_sablonu.xlsx';
    } else if (importType === 'products') {
      sampleData = [
        {
          'Ürün Kod': 'PC-SK-101',
          'Ürün Adı': 'SilkTouch Bambu İpek',
          'Renk': 'Vizon / Krem',
          'm2 Fiyatı': 1450,
          'Stok (m2)': 850,
        },
        {
          'Ürün Kod': 'PC-RY-302',
          'Ürün Adı': 'Royal Otel Axminster',
          'Renk': 'Lacivert Gold',
          'm2 Fiyatı': 1950,
          'Stok (m2)': 1200,
        },
      ];
      templateName = 'pulcarpet_urun_sablonu.xlsx';
    } else {
      sampleData = [
        {
          'Müşteri Adı': 'Zeynep Kaya',
          'Firma': 'Kaya Dekorasyon',
          'E-posta': 'zeynep@kayadekor.com',
          'Telefon': '+90 535 999 8877',
          'Şehir': 'Ankara',
          'Toplam Bütçe': 120000,
        },
      ];
      templateName = 'pulcarpet_musteri_sablonu.xlsx';
    }

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Şablon');
    XLSX.writeFile(wb, templateName);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 relative text-slate-200 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Excel / CSV Sürükle & Bırak İçe Aktar
              </h3>
              <p className="text-xs text-slate-400">
                Bilgisayarınızdaki Excel (.xlsx, .xls) veya CSV dosyanızı buraya bırakarak verileri aktarın.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setImportType('orders');
              setParsedData([]);
              setFileName(null);
            }}
            className={`py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
              importType === 'orders'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sipariş İçe Aktar
          </button>
          <button
            type="button"
            onClick={() => {
              setImportType('products');
              setParsedData([]);
              setFileName(null);
            }}
            className={`py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
              importType === 'products'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ürün Kataloğu Aktar
          </button>
          <button
            type="button"
            onClick={() => {
              setImportType('customers');
              setParsedData([]);
              setFileName(null);
            }}
            className={`py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
              importType === 'customers'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Müşteri Listesi Aktar
          </button>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
            isDragging
              ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
              : fileName
              ? 'border-emerald-500/50 bg-slate-950/60'
              : 'border-slate-700 hover:border-amber-500/50 bg-slate-950/40 hover:bg-slate-950/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
            <Upload className="w-8 h-8 animate-bounce" />
          </div>

          <div>
            <p className="text-sm font-bold text-white">
              {fileName ? fileName : 'Excel Dosyanızı Buraya Sürükleyip Bırakın'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              veya bilgisayarınızdan dosya seçmek için <span className="text-amber-400 underline font-semibold">tıklayın</span> (.xlsx, .xls, .csv)
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-bold">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Parsed Data Preview Table */}
        {parsedData.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Table className="w-4 h-4" /> Okunan Veri Önizlemesi ({parsedData.length} Satır Tespit Edildi)
              </span>
              <span className="text-emerald-400 text-[11px] font-mono">Hazır</span>
            </div>

            <div className="max-h-48 overflow-auto border border-slate-800 rounded-xl bg-slate-950 text-[11px] font-mono">
              <table className="w-full text-left">
                <thead className="bg-slate-800/80 text-slate-300 sticky top-0 border-b border-slate-700">
                  <tr>
                    {Object.keys(parsedData[0]).slice(0, 6).map((key) => (
                      <th key={key} className="p-2 truncate max-w-[120px]">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {parsedData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      {Object.values(row).slice(0, 6).map((val: any, j) => (
                        <td key={j} className="p-2 truncate max-w-[120px]">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedData.length > 5 && (
              <p className="text-[10px] text-slate-400 text-center">
                ...ve {parsedData.length - 5} satır daha aktarılacak.
              </p>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={downloadSampleTemplate}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-amber-400" /> Örnek Excel Şablonu İndir
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
            >
              İptal
            </button>
            <button
              type="button"
              disabled={parsedData.length === 0}
              onClick={handleConfirmImport}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                parsedData.length > 0
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer shadow-lg'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-4 h-4" /> {parsedData.length} Satırı İçe Aktar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
