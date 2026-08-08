import React from 'react';
import { Search, Bell, Sparkles, User, Layers, RefreshCw, ShieldCheck, LogOut, FileText, FileSpreadsheet, ScanBarcode } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onOpenAiAssistant: () => void;
  onOpenBarcodeScanner?: () => void;
  onRefreshData?: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  currentUser?: { username: string; name: string; role: string; token: string } | null;
  onLogout?: () => void;
  onOpenProformaModal?: () => void;
  onOpenExcelModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenAiAssistant,
  onOpenBarcodeScanner,
  onRefreshData,
  searchTerm,
  setSearchTerm,
  currentUser,
  onLogout,
  onOpenProformaModal,
  onOpenExcelModal,
}) => {
  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Genel Bakış & Performans';
      case 'barcode': return 'Barkod Okutma & Hızlı Stok Girişi';
      case 'customers': return 'Müşteri İlişkileri & CRM (Leads)';
      case 'orders': return 'Siparişler & Özel Üretim Takibi';
      case 'quotes': return 'Teklif Hazırlama & m² Hesaplayıcı';
      case 'catalog': return 'Halı Koleksiyonları & Stok Kataloğu';
      case 'projects': return 'Mimari Projeler & Numune Talepleri';
      case 'ai-assistant': return 'Google AI Akıllı Halı Asistanı';
      default: return 'PulCarpet CRM Paneli';
    }
  };

  return (
    <header id="crm-header" className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 px-4 lg:px-6 py-3 transition-all shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Title & Status */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800 shadow-xs hidden sm:flex items-center justify-center shrink-0">
            <img 
              src="https://static.wixstatic.com/media/5fac6b_04dd19d7de6b40acbfaea55afa21114a~mv2.png" 
              alt="PULCARPET Logo" 
              referrerPolicy="no-referrer"
              className="h-7 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{getTitle()}</h1>
              <span className="bg-emerald-50 text-emerald-600 text-[10px] sm:text-xs px-2 py-0.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                OPERASYONEL
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate">PULCARPET Coilmat & Carpet</p>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Global Search */}
          <div className="relative flex-1 sm:w-64 bg-slate-100/80 px-3 py-1.5 rounded-full flex items-center gap-2 border border-slate-200/80">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Sipariş, SKU veya müşteri ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-xs text-slate-800 w-full focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Barcode Scanner Quick Button */}
          {onOpenBarcodeScanner && (
            <button
              id="btn-open-barcode"
              onClick={onOpenBarcodeScanner}
              title="Barkod Okutma ve Hızlı Stok Girişi Modülü"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <ScanBarcode className="w-4 h-4 text-indigo-400" />
              <span>Barkod Okut</span>
            </button>
          )}

          {/* Excel / CSV Import Button */}
          {onOpenExcelModal && (
            <button
              id="btn-open-excel"
              onClick={onOpenExcelModal}
              title="Excel (.xlsx, .xls) veya CSV Sürükleyip Bırakarak İçe Aktar"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel İçe Aktar</span>
            </button>
          )}

          {/* Proforma Invoice Button */}
          {onOpenProformaModal && (
            <button
              id="btn-open-proforma"
              onClick={onOpenProformaModal}
              title="Commercial / Proforma Invoice Şablonu Hazırla"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>Proforma Fatura</span>
            </button>
          )}

          {/* AI Launch Button */}
          <button
            id="btn-quick-ai"
            onClick={onOpenAiAssistant}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>AI Asistan</span>
          </button>

          {/* Refresh */}
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              title="Verileri Yenile"
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Notifications */}
          <div className="relative">
            <button className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
            </button>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {currentUser ? currentUser.name.slice(0, 2).toUpperCase() : 'KK'}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-900">{currentUser ? currentUser.name : 'Kadir KORKMAZ'}</div>
              <div className="text-[10px] text-indigo-600 font-semibold">{currentUser ? currentUser.role : 'Genel Yönetici'}</div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Güvenli Çıkış Yap"
                className="ml-1 p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
