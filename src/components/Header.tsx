import React from 'react';
import { Search, Bell, Sparkles, User, Layers, RefreshCw, ShieldCheck, LogOut, FileText, FileSpreadsheet, ScanBarcode, Lock, Cloud, Loader2 } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onOpenAiAssistant: () => void;
  onOpenBarcodeScanner?: () => void;
  onRefreshData?: () => void;
  onSyncCloud?: () => void;
  isCloudSyncing?: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  currentUser?: { username: string; name: string; role: string; token: string } | null;
  onLogout?: () => void;
  onOpenProformaModal?: () => void;
  onOpenExcelModal?: () => void;
  onOpenAuditLog?: () => void;
  onLockSession?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenAiAssistant,
  onOpenBarcodeScanner,
  onRefreshData,
  onSyncCloud,
  isCloudSyncing = false,
  searchTerm,
  setSearchTerm,
  currentUser,
  onLogout,
  onOpenProformaModal,
  onOpenExcelModal,
  onOpenAuditLog,
  onLockSession,
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
    <header id="crm-header" className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 transition-all shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
        {/* Left Title & Status */}
        <div className="flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800 shadow-xs flex items-center justify-center shrink-0">
              <img 
                src="https://static.wixstatic.com/media/5fac6b_04dd19d7de6b40acbfaea55afa21114a~mv2.png" 
                alt="PULCARPET Logo" 
                referrerPolicy="no-referrer"
                className="h-6 sm:h-7 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 tracking-tight truncate">{getTitle()}</h1>
                <span className="bg-emerald-50 text-emerald-600 text-[9px] sm:text-xs px-1.5 py-0.2 rounded-full border border-emerald-200 font-semibold flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  CANLI
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate hidden xs:block">PULCARPET Coilmat & Carpet</p>
            </div>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-nowrap justify-between md:justify-end w-full md:w-auto">
          {/* Global Search */}
          <div className="relative flex-1 md:w-56 lg:w-64 bg-slate-100/90 px-3 py-1.5 rounded-full flex items-center gap-2 border border-slate-200/80">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Ara (Sipariş, SKU, Müşteri)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-xs text-slate-800 w-full focus:outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Cloud Sync Button & Status */}
            {onSyncCloud && (
              <button
                id="btn-sync-cloud"
                onClick={onSyncCloud}
                disabled={isCloudSyncing}
                title="Bilgisayar ve Telefon Arasında Tüm Verileri Canlı Buluta Eşitle"
                className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95 ${
                  isCloudSyncing 
                    ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse' 
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 shadow-xs'
                }`}
              >
                {isCloudSyncing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                    <span className="hidden sm:inline">Eşitleniyor...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px] sm:text-xs">Eşitle</span>
                  </>
                )}
              </button>
            )}

            {/* Barcode Scanner Quick Button (Tablet & desktop) */}
            {onOpenBarcodeScanner && (
              <button
                id="btn-open-barcode"
                onClick={onOpenBarcodeScanner}
                title="Barkod Okutma ve Hızlı Stok Girişi Modülü"
                className="hidden md:flex bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all shadow-xs items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <ScanBarcode className="w-4 h-4 text-indigo-400" />
                <span>Barkod</span>
              </button>
            )}

            {/* Excel / CSV Import Button */}
            {onOpenExcelModal && (
              <button
                id="btn-open-excel"
                onClick={onOpenExcelModal}
                title="Excel (.xlsx, .xls) veya CSV Sürükleyip Bırakarak İçe Aktar"
                className="hidden lg:flex bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all shadow-xs items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel</span>
              </button>
            )}

            {/* Proforma Invoice Button */}
            {onOpenProformaModal && (
              <button
                id="btn-open-proforma"
                onClick={onOpenProformaModal}
                title="Commercial / Proforma Invoice Şablonu Hazırla"
                className="hidden lg:flex bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all shadow-xs items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <FileText className="w-4 h-4" />
                <span>Proforma</span>
              </button>
            )}

            {/* AI Launch Button */}
            <button
              id="btn-quick-ai"
              onClick={onOpenAiAssistant}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 fill-white" />
              <span className="text-[11px] sm:text-xs">AI</span>
            </button>

            {/* Refresh */}
            {onRefreshData && (
              <button
                onClick={onRefreshData}
                title="Verileri Yenile"
                className="p-1.5 sm:p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}

            {/* Security 2FA Audit & Lock Controls */}
            {onOpenAuditLog && (
              <button
                onClick={onOpenAuditLog}
                title="2FA SMS & Güvenlik Denetim Günlüğü (Audit Log)"
                className="hidden xl:flex p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 transition-colors items-center gap-1 text-xs font-bold cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Güvenlik</span>
              </button>
            )}

            {onLockSession && (
              <button
                onClick={onLockSession}
                title="Ekranı Güvenli Kilitle"
                className="hidden sm:flex p-1.5 sm:p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl border border-amber-200 transition-colors items-center gap-1 text-xs font-bold cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                <span className="hidden xl:inline">Kilitle</span>
              </button>
            )}

            {/* User Profile & Logout */}
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {currentUser ? currentUser.name.slice(0, 2).toUpperCase() : 'KK'}
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-slate-900">{currentUser ? currentUser.name : 'Kadir KORKMAZ'}</div>
                <div className="text-[10px] text-indigo-600 font-semibold">{currentUser ? currentUser.role : 'Genel Yönetici'}</div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Güvenli Çıkış Yap"
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-all cursor-pointer hidden sm:block"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
