import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  LogOut,
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { logSecurityAudit } from '../lib/firebase';

interface LockScreenProps {
  currentUser: { username: string; name: string; role: string; token: string };
  onUnlock: () => void;
  onLogout: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ currentUser, onUnlock, onLogout }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      // Valid account passwords check
      const validPasses: Record<string, string[]> = {
        kadirkorkmaz: ['Kadirkrkmz12..', 'kadirkrkmz12..', '1234'],
        admin: ['Kadirkrkmz12..', 'pulcarpet2026', '1234']
      };

      const allowed = validPasses[currentUser.username.toLowerCase()] || ['Kadirkrkmz12..', '1234'];

      if (allowed.includes(password.trim())) {
        logSecurityAudit({
          userId: currentUser.username,
          userName: currentUser.name,
          userRole: currentUser.role,
          action: 'SESSION_UNLOCKED',
          details: 'Kullanıcı ekran kilidini başarıyla açtı.',
          status: 'SUCCESS'
        });
        onUnlock();
      } else {
        setError('Geçersiz şifre! Lütfen şifrenizi kontrol ediniz.');
        logSecurityAudit({
          userId: currentUser.username,
          userName: currentUser.name,
          userRole: currentUser.role,
          action: 'LOGIN_FAILED',
          details: 'Ekran kilidini açarken hatalı şifre girildi.',
          status: 'WARNING'
        });
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fade-in">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 p-0.5 mx-auto mb-4 shadow-xl">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-indigo-400">
              <Lock className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Güvenli Oturum Kilitlendi</span>
          </div>

          <h2 className="text-xl font-extrabold text-white">{currentUser.name}</h2>
          <p className="text-xs text-slate-400 mb-6 font-mono">{currentUser.role} • {currentUser.username}</p>

          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Kilit Açma Şifresi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Şifrenizi giriniz..."
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isVerifying ? (
                <span>Doğrulanıyor...</span>
              ) : (
                <>
                  <span>Kilidi Aç ve Devam Et</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onLogout}
              className="text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Farklı Hesapla Giriş Yap</span>
            </button>
            <span className="text-[11px] text-slate-500">Otomatik Kilit Koruması</span>
          </div>
        </div>
      </div>
    </div>
  );
};
