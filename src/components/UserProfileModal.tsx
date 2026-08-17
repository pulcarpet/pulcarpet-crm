import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  ShieldCheck, 
  KeyRound, 
  BellRing, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles,
  Smartphone,
  History,
  ShieldAlert
} from 'lucide-react';

interface UserProfileModalProps {
  currentUser: {
    username: string;
    name: string;
    role: string;
    token: string;
  };
  onUpdateUser: (updatedUser: { username: string; name: string; role: string; token: string }) => void;
  onLogout: () => void;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  onUpdateUser,
  onLogout,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'security' | 'notifications'>('password');
  
  // Profile edit fields
  const [name, setName] = useState(currentUser.name || 'Kadir KORKMAZ');
  const [username] = useState(currentUser.username || 'admin');

  // Password edit fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notification Toggles
  const [notifications, setNotifications] = useState({
    invoiceOcr: true,
    crmLeads: true,
    orderProduction: true,
    emailDigest: false,
  });

  // 2FA status
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(true);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('Ad Soyad alanı boş bırakılamaz.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const updated = {
        ...currentUser,
        name: name.trim(),
      };
      onUpdateUser(updated);
      setIsSubmitting(false);
      setSuccessMsg('✓ Profil bilgileriniz başarıyla güncellendi.');
    }, 500);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword) {
      setErrorMsg('Lütfen mevcut şifrenizi giriniz.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Yeni şifre ile şifre tekrarı uyuşmuyor.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg('✓ Şifreniz başarıyla değiştirildi ve güvenli bir şekilde güncellendi!');
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md border border-indigo-400/30">
              {name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                {name}
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-mono font-bold px-2 py-0.5 rounded-full border border-indigo-500/40">
                  {currentUser.role === 'admin' ? 'Sistem Yöneticisi' : currentUser.role}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Kullanıcı Hesabı, Güvenlik & Şifre Yönetim Paneli
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => { setActiveTab('password'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'password'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" /> Şifre Değiştir
          </button>

          <button
            onClick={() => { setActiveTab('profile'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" /> Profil Bilgileri
          </button>

          <button
            onClick={() => { setActiveTab('security'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Güvenlik & 2FA
          </button>

          <button
            onClick={() => { setActiveTab('notifications'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'notifications'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BellRing className="w-4 h-4" /> Bildirim Tercihleri
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Status Banners */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: Password Change */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-400" /> Şifre Yenileme Güvenlik Adımları
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Güvenliğiniz için yeni şifrenizin en az 6 karakter uzunluğunda olması, harf ve rakam içermesi önerilir.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mevcut Şifreniz
                  </label>
                  <input
                    type="password"
                    placeholder="Mevcut şifrenizi girin..."
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Yeni Şifre
                    </label>
                    <input
                      type="password"
                      placeholder="Yeni şifreniz..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Yeni Şifre (Tekrar)
                    </label>
                    <input
                      type="password"
                      placeholder="Yeni şifreyi tekrar girin..."
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  {isSubmitting ? 'Şifre Güncelleniyor...' : 'Şifreyi Değiştir & Kaydet'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Profile Info */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" /> Personel / Yönetici Kimliği
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-indigo-500 outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Kullanıcı Adı (Sistem Girişi)
                    </label>
                    <input
                      type="text"
                      value={username}
                      disabled
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-400 font-mono cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Sistem Yetki Rolü
                    </label>
                    <input
                      type="text"
                      value={currentUser.role === 'admin' ? 'Genel Yönetici (Tam Yetkili)' : currentUser.role}
                      disabled
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-emerald-400 font-semibold cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      E-Posta Adresi
                    </label>
                    <input
                      type="email"
                      value="kadir.korkmaz@pulcarpet.com"
                      readOnly
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Profil Bilgilerini Güncelle'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Security & 2FA */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">İki Faktörlü Doğrulama (2FA)</div>
                      <div className="text-[11px] text-slate-400">Girişlerde SMS veya Authenticator kodu ile ekstra güvenlik katmanı</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsTwoFactorEnabled(!isTwoFactorEnabled)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isTwoFactorEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isTwoFactorEnabled ? '✓ Aktif' : 'Pasif'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" /> Son Oturum & Cihaz Hareketleri
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <div>
                      <div className="font-semibold text-white">Mevcut Oturum (Bu Cihaz)</div>
                      <div className="text-[10px] text-slate-400 font-mono">IP: 85.105.142.92 • Chrome (Windows 11)</div>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                      Şimdi Aktif
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
                    <div>
                      <div className="font-semibold text-slate-300">PULCARPET Mobil CRM Uygulaması</div>
                      <div className="text-[10px] text-slate-400 font-mono">iPhone 15 Pro • Bugün 11:40</div>
                    </div>
                    <span className="text-[10px] text-slate-500">2 saat önce</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-indigo-400" /> Anlık CRM & Sistem Bildirimleri
                </div>

                <div className="space-y-2.5 text-xs">
                  <label className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-800/80">
                    <div>
                      <div className="font-semibold text-white">Fatura & ÖKC Fiş OCR Bildirimleri</div>
                      <div className="text-[10px] text-slate-400">Yüklenen e-fatura taranıp cariye işlendiğinde bildirim ver</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.invoiceOcr}
                      onChange={(e) => setNotifications({ ...notifications, invoiceOcr: e.target.checked })}
                      className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-800/80">
                    <div>
                      <div className="font-semibold text-white">Yeni Müşteri & Mimar CRM Müracaatları</div>
                      <div className="text-[10px] text-slate-400">Yeni potansiyel müşteri eklendiğinde ekrana uyarı çıkar</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.crmLeads}
                      onChange={(e) => setNotifications({ ...notifications, crmLeads: e.target.checked })}
                      className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-800/80">
                    <div>
                      <div className="font-semibold text-white">Fabrika Dokuma & Sevkiyat Güncellemeleri</div>
                      <div className="text-[10px] text-slate-400">Sipariş kargo veya teslime geçtiğinde uyarı ver</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.orderProduction}
                      onChange={(e) => setNotifications({ ...notifications, orderProduction: e.target.checked })}
                      className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Oturumu Kapat
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
