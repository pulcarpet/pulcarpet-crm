import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Calculator, 
  Grid, 
  Building2, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  Award,
  Wallet,
  Receipt,
  User,
  Settings,
  Lock,
  LogOut,
  ShieldCheck,
  PieChart,
  ScanBarcode
} from 'lucide-react';
import { UserProfileModal } from './UserProfileModal';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingOrdersCount: number;
  newLeadsCount: number;
  currentUser?: { username: string; name: string; role: string; token: string } | null;
  onUpdateUser?: (updatedUser: { username: string; name: string; role: string; token: string }) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingOrdersCount,
  newLeadsCount,
  currentUser,
  onUpdateUser,
  onLogout,
}) => {
  const [showProfileModal, setShowProfileModal] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard, badge: null },
    { id: 'finance', label: 'Finans & Paraşüt (Cari/KDV)', icon: Wallet, badge: 'Canlı Sync' },
    { id: 'profitability', label: 'Satış Kârlılığı & Maliyetler', icon: PieChart, badge: 'Gerçek Kâr' },
    { id: 'barcode', label: 'Barkod Okutma & Stok Girişi', icon: ScanBarcode, badge: 'Hızlı Okuma' },
    { id: 'customers', label: 'Müşteriler & CRM', icon: Users, badge: newLeadsCount > 0 ? `${newLeadsCount} Yeni` : null },
    { id: 'orders', label: 'Siparişler & Üretim', icon: Package, badge: pendingOrdersCount > 0 ? `${pendingOrdersCount}` : null },
    { id: 'quotes', label: 'Teklif & m² Hesaplayıcı', icon: Calculator, badge: null },
    { id: 'catalog', label: 'Halı & Stok Kataloğu', icon: Grid, badge: null },
    { id: 'projects', label: 'Mimari Projeler (B2B)', icon: Building2, badge: 'Pro' },
    { id: 'ai-assistant', label: 'Google AI Asistan', icon: Sparkles, badge: 'Gemini', highlight: true },
  ];

  return (
    <aside id="crm-sidebar" className="w-full lg:w-64 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between shrink-0">
      <div className="p-3 lg:p-4">
        {/* Brand Logo & Header */}
        <div className="flex items-center justify-between gap-2 px-1 py-2 mb-2 lg:mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-slate-950 px-2 py-1.5 rounded-xl border border-slate-800 shadow-sm flex items-center justify-center shrink-0">
              <img 
                src="https://static.wixstatic.com/media/5fac6b_04dd19d7de6b40acbfaea55afa21114a~mv2.png" 
                alt="PULCARPET Logo" 
                referrerPolicy="no-referrer"
                className="h-7 w-auto object-contain max-w-[110px]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-extrabold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30 font-mono tracking-wider shrink-0">
                  CRM
                </span>
              </div>
              <div className="text-[9px] uppercase font-bold text-slate-400 tracking-tight truncate mt-0.5">
                Coilmat & Carpet
              </div>
            </div>
          </div>
          <span className="lg:hidden text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 shrink-0">
            Mobil
          </span>
        </div>

        {/* Navigation Links - Horizontal scroll on mobile, vertical stack on desktop */}
        <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 pb-2 lg:pb-0 scrollbar-none">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between px-3 lg:px-3.5 py-2 lg:py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 lg:shrink whitespace-nowrap lg:whitespace-normal ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold shadow-xs'
                    : item.highlight
                    ? 'text-indigo-300 hover:bg-slate-800/80 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 lg:gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : item.highlight ? 'text-indigo-400' : 'opacity-70'}`} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5 ml-2 lg:ml-0">
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 lg:px-2 py-0.5 rounded-full font-bold ${
                      isActive 
                        ? 'bg-indigo-500 text-white' 
                        : item.highlight 
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' 
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="hidden lg:block w-3.5 h-3.5 text-indigo-400" />}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Bottom User Panel Card */}
      <div className="p-3 lg:p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
        <button
          onClick={() => setShowProfileModal(true)}
          className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 border border-slate-700/80 p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between text-left group shadow-sm hover:border-indigo-500/50"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-inner border border-indigo-400/30">
              {currentUser ? currentUser.name.slice(0, 2).toUpperCase() : 'KK'}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                {currentUser ? currentUser.name : 'Kadir KORKMAZ'}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{currentUser?.role === 'admin' ? 'Genel Yönetici' : currentUser?.role || 'Genel Yönetici'}</span>
              </div>
            </div>
          </div>

          <div className="p-1 text-slate-400 group-hover:text-white bg-slate-800/60 rounded-md border border-slate-700/60">
            <Settings className="w-3.5 h-3.5" />
          </div>
        </button>

        <div className="hidden lg:flex items-center justify-between text-[10px] text-slate-400 px-1 pt-0.5">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            2FA Korumalı
          </span>
          <button
            onClick={() => setShowProfileModal(true)}
            className="text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <Lock className="w-2.5 h-2.5" /> Şifre Değiştir
          </button>
        </div>
      </div>

      {/* User Profile & Password Change Modal */}
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
    </aside>
  );
};

