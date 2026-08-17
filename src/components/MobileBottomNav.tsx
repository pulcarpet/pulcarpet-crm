import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Wallet, 
  ScanBarcode, 
  Menu, 
  X, 
  Users, 
  Calculator, 
  Grid, 
  Building2, 
  TrendingUp, 
  CreditCard, 
  PieChart, 
  Sparkles, 
  Cloud, 
  FileSpreadsheet, 
  FileText, 
  ShieldCheck, 
  Lock, 
  LogOut, 
  Settings,
  ChevronRight,
  Loader2,
  Boxes
} from 'lucide-react';
import { UserProfileModal } from './UserProfileModal';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingOrdersCount: number;
  newLeadsCount: number;
  isCloudSyncing?: boolean;
  onSyncCloud?: () => void;
  currentUser?: { username: string; name: string; role: string; token: string } | null;
  onUpdateUser?: (updated: any) => void;
  onLogout?: () => void;
  onOpenProformaModal?: () => void;
  onOpenExcelModal?: () => void;
  onOpenAuditLog?: () => void;
  onLockSession?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  pendingOrdersCount,
  newLeadsCount,
  isCloudSyncing = false,
  onSyncCloud,
  currentUser,
  onUpdateUser,
  onLogout,
  onOpenProformaModal,
  onOpenExcelModal,
  onOpenAuditLog,
  onLockSession,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const mainTabs = [
    { id: 'dashboard', label: 'Genel', icon: LayoutDashboard, badge: null },
    { id: 'orders', label: 'Siparişler', icon: Package, badge: pendingOrdersCount > 0 ? pendingOrdersCount : null },
    { id: 'barcode', label: 'Barkod', icon: ScanBarcode, badge: null, highlight: true },
    { id: 'finance', label: 'Finans', icon: Wallet, badge: null },
  ];

  const allSections = [
    {
      title: 'FİNANS & YÖNETİM',
      items: [
        { id: 'dashboard', label: 'Genel Bakış & Özet', icon: LayoutDashboard, badge: null },
        { id: 'finance', label: 'Finans, Paraşüt & KDV', icon: Wallet, badge: 'Canlı Sync' },
        { id: 'payments-collections', label: 'Ödemeler & Tahsilatlar (Kasa)', icon: CreditCard, badge: 'Manuel' },
        { id: 'profitability', label: 'Satış Kârlılığı & Maliyetler', icon: PieChart, badge: 'Gerçek Kâr' },
        { id: 'analytics', label: 'Analizler & Grafikler', icon: TrendingUp, badge: null },
      ]
    },
    {
      title: 'OPERASYON & CRM',
      items: [
        { id: 'order-fulfillment', label: 'Sipariş Çıkış & Durum Raporu', icon: Boxes, badge: 'Hatasız Barkod', highlight: true },
        { id: 'orders', label: 'Siparişler & Üretim Takibi', icon: Package, badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} Aktif` : null },
        { id: 'customers', label: 'Müşteri Rehberi & CRM', icon: Users, badge: newLeadsCount > 0 ? `${newLeadsCount} Yeni` : null },
        { id: 'quotes', label: 'Teklif & m² Hesaplayıcı', icon: Calculator, badge: null },
        { id: 'catalog', label: 'Halı & Stok Kataloğu', icon: Grid, badge: null },
        { id: 'projects', label: 'Mimari Projeler (B2B)', icon: Building2, badge: 'Pro' },
        { id: 'barcode', label: 'Barkod Okutma & Stok Girişi', icon: ScanBarcode, badge: 'Hızlı' },
      ]
    },
    {
      title: 'YAPAY ZEKA',
      items: [
        { id: 'ai-assistant', label: 'Google AI Akıllı Asistan', icon: Sparkles, badge: 'Gemini', highlight: true },
      ]
    }
  ];

  return (
    <>
      {/* 1. Fixed Bottom Navigation Bar (Visible only on mobile/tablet screens < lg) */}
      <div id="mobile-bottom-nav" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 shadow-2xl px-2 py-1.5 flex items-center justify-around safe-area-pb">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsDrawerOpen(false);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative cursor-pointer ${
                isActive 
                  ? 'text-emerald-400 font-black' 
                  : tab.highlight
                  ? 'text-indigo-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg transition-transform ${isActive ? 'bg-emerald-500/20 scale-110' : tab.highlight ? 'bg-indigo-500/20' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400 stroke-[2.5]' : tab.highlight ? 'text-indigo-300' : 'opacity-80'}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">{tab.label}</span>
              {tab.badge && (
                <span className="absolute top-0.5 right-2 bg-emerald-500 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Hamburger / All Menu Drawer Trigger */}
        <button
          id="btn-mobile-menu-drawer"
          onClick={() => setIsDrawerOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
            isDrawerOpen ? 'text-emerald-400 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${isDrawerOpen ? 'bg-emerald-500/20 scale-110' : ''}`}>
            <Menu className="w-5 h-5 opacity-80" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">Menü</span>
        </button>
      </div>

      {/* 2. Full Mobile Slide-up / Modal Navigation Drawer */}
      {isDrawerOpen && (
        <div 
          id="mobile-menu-overlay"
          className="lg:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div 
            className="bg-slate-950 border-t border-slate-800 rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-xs flex items-center justify-center shadow-md border border-emerald-400/30">
                  {currentUser ? currentUser.name.slice(0, 2).toUpperCase() : 'KK'}
                </div>
                <div>
                  <div className="text-sm font-bold text-white leading-tight">
                    {currentUser ? currentUser.name : 'Kadir KORKMAZ'}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>{currentUser?.role === 'admin' ? 'Genel Yönetici' : currentUser?.role || 'Genel Yönetici'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-full cursor-pointer active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Buttons Row inside Drawer */}
            <div className="p-3 bg-slate-900/40 border-b border-slate-800/80 grid grid-cols-3 gap-2">
              {onSyncCloud && (
                <button
                  onClick={() => {
                    onSyncCloud();
                    setIsDrawerOpen(false);
                  }}
                  disabled={isCloudSyncing}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-all ${
                    isCloudSyncing
                      ? 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                      : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {isCloudSyncing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400 mb-1" />
                  ) : (
                    <Cloud className="w-4 h-4 text-emerald-400 mb-1" />
                  )}
                  <span className="text-[10px] font-bold">Buluta Eşitle</span>
                </button>
              )}

              {onOpenExcelModal && (
                <button
                  onClick={() => {
                    onOpenExcelModal();
                    setIsDrawerOpen(false);
                  }}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 mb-1" />
                  <span className="text-[10px] font-bold">Excel İçe Aktar</span>
                </button>
              )}

              {onOpenProformaModal && (
                <button
                  onClick={() => {
                    onOpenProformaModal();
                    setIsDrawerOpen(false);
                  }}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-all"
                >
                  <FileText className="w-4 h-4 text-amber-400 mb-1" />
                  <span className="text-[10px] font-bold">Proforma</span>
                </button>
              )}
            </div>

            {/* Menu Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {allSections.map((section, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="text-[10px] font-mono font-black text-emerald-400 tracking-wider px-2">
                    {section.title}
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsDrawerOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black shadow-lg shadow-emerald-950/50 border border-emerald-400/40'
                              : item.highlight
                              ? 'text-amber-300 bg-amber-500/10 border border-amber-500/30'
                              : 'text-slate-300 hover:text-white bg-slate-900/60 border border-slate-800/80 hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isActive ? 'bg-white/20' : item.highlight ? 'bg-amber-500/20' : 'bg-slate-800'}`}>
                              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-amber-300' : 'text-slate-400'}`} />
                            </div>
                            <span className="text-sm">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.badge && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                            <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Bottom Controls */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setShowProfileModal(true);
                  setIsDrawerOpen(false);
                }}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Settings className="w-4 h-4 text-emerald-400" />
                <span>Hesap & Şifre</span>
              </button>

              {onLockSession && (
                <button
                  onClick={() => {
                    onLockSession();
                    setIsDrawerOpen(false);
                  }}
                  className="py-2.5 px-3 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Kilitle</span>
                </button>
              )}

              {onLogout && (
                <button
                  onClick={() => {
                    onLogout();
                    setIsDrawerOpen(false);
                  }}
                  className="py-2.5 px-3 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Çıkış</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal on Mobile */}
      {showProfileModal && currentUser && (
        <UserProfileModal
          currentUser={currentUser}
          onUpdateUser={(updated) => {
            if (onUpdateUser) onUpdateUser(updated);
          }}
          onLogout={() => {
            if (onLogout) onLogout();
          }}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </>
  );
};
