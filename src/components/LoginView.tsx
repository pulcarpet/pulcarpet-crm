import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  KeyRound, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Building2,
  Globe,
  Layers,
  ArrowRight
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (userData: { username: string; name: string; role: string; token: string }) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'production' | 'sales'>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Registered system accounts
  const validAccounts = [
    { user: 'admin', pass: 'pulcarpet2026', role: 'admin' as const, name: 'Kadir KORKMAZ (Sistem Yöneticisi)' },
    { user: 'uretim', pass: 'fabrika123', role: 'production' as const, name: 'Mehmet Demir (Fabrika Müdürü)' },
    { user: 'satis', pass: 'satis123', role: 'sales' as const, name: 'Elif Kaya (Satış Müdürü)' },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      if (!username.trim() || !password.trim()) {
        setErrorMessage('Kullanıcı adı ve şifre boş bırakılamaz.');
        return;
      }

      if (password.length < 4) {
        setErrorMessage('Güvenlik gereği şifre en az 4 karakter olmalıdır.');
        return;
      }

      // Strict Auth Validation
      const inputUser = username.trim().toLowerCase();
      const inputPass = password.trim();

      const matchedAccount = validAccounts.find(
        (a) => a.user === inputUser && a.pass === inputPass
      );

      if (!matchedAccount) {
        setErrorMessage('Geçersiz kullanıcı adı veya şifre! Lütfen yetkili sistem bilgilerinizi kontrol ediniz.');
        return;
      }

      // Successful Auth
      const sessionData = {
        username: matchedAccount.user,
        name: matchedAccount.name,
        role: matchedAccount.role === 'admin' ? 'Genel Yönetici' : matchedAccount.role === 'production' ? 'Üretim Sorumlusu' : 'Satış Temsilcisi',
        token: `PUL-SEC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      if (rememberMe) {
        localStorage.setItem('pulcarpet_auth_token', JSON.stringify(sessionData));
      } else {
        sessionStorage.setItem('pulcarpet_auth_token', JSON.stringify(sessionData));
      }

      onLoginSuccess(sessionData);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative z-10">
        
        {/* Left Branding & Security Info Panel */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-slate-950 p-2 rounded-2xl border border-slate-800 shadow-lg shadow-indigo-950/50 flex items-center justify-center">
                <img 
                  src="https://static.wixstatic.com/media/5fac6b_04dd19d7de6b40acbfaea55afa21114a~mv2.png" 
                  alt="PulCarpet Logo" 
                  referrerPolicy="no-referrer"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white">PulCarpet</h1>
                <p className="text-[11px] text-indigo-300 font-semibold tracking-wider uppercase">Coilmat & Carpet ERP Portal</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>256-Bit SSL Şifreli Giriş</span>
              </div>

              <h2 className="text-2xl font-black text-white leading-snug">
                Kurumsal Halı Üretim & Finans Yönetimi
              </h2>

              <p className="text-xs text-slate-400 leading-relaxed">
                Bu sistem yetkili PulCarpet personeli içindir. Müşteri cari bakiyeleri, Paraşüt canlı muhasebe verileri ve sipariş onayları üst düzey güvenlik altındadır.
              </p>
            </div>
          </div>

          {/* Security Features List */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Oturum Süresi Güvenlik Takibi</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Paraşüt API OAuth Token Koruması</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Yetki Bazlı Rol Yönetimi (RBAC)</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-between bg-slate-900">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-400" /> Yetkili Kullanıcı Girişi
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">v2.4 SECURE</span>
            </div>

            {errorMessage && (
              <div className="mb-5 bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Giriş Rolü
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      role === 'admin'
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    Yönetici
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('production')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      role === 'production'
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    Fabrika
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('sales')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      role === 'sales'
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    Satış CRM
                  </button>
                </div>
              </div>

              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Kullanıcı Adı</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Kullanıcı adınız..."
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Şifre</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="••••••••"
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

              {/* Remember Me & Protection info */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Oturumu Açık Tut</span>
                </label>

                <span className="text-[11px] text-slate-500 hover:underline cursor-pointer">Şifremi Unuttum</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Giriş Doğrulanıyor...</span>
                ) : (
                  <>
                    <span>Güvenli Giriş Yap</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center text-[10px] text-slate-600">
            © 2026 PulCarpet Halı Tekstil A.Ş. Tüm hakları saklıdır.
          </div>
        </div>

      </div>
    </div>
  );
};
