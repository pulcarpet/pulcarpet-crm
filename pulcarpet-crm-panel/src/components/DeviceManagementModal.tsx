import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  Monitor, 
  Laptop, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  X, 
  Plus, 
  Lock, 
  KeyRound, 
  RefreshCw,
  Cpu,
  Globe,
  Clock
} from 'lucide-react';
import { 
  AuthorizedDeviceSlot, 
  DeviceSlotId, 
  getAuthorizedDeviceSlots, 
  getCurrentDeviceInfo, 
  pairCurrentDeviceToSlot, 
  unpairDeviceSlot 
} from '../lib/deviceSecurity';

interface DeviceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { username: string; name: string; role: string };
}

export const DeviceManagementModal: React.FC<DeviceManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [slots, setSlots] = useState<AuthorizedDeviceSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentInfo, setCurrentInfo] = useState<ReturnType<typeof getCurrentDeviceInfo> | null>(null);
  const [selectedSlotForPairing, setSelectedSlotForPairing] = useState<DeviceSlotId | null>(null);
  const [adminPin, setAdminPin] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAuthorizedDeviceSlots();
      setSlots(data);
      setCurrentInfo(getCurrentDeviceInfo());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setActionError(null);
      setActionSuccess(null);
      setSelectedSlotForPairing(null);
      setAdminPin('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePairCurrentDevice = async (slotId: DeviceSlotId) => {
    setActionError(null);
    setActionSuccess(null);

    // Require 2FA Admin SMS code (270391) to authorize a new device
    if (adminPin.trim() !== '270391') {
      setActionError('Güvenlik ihlali: Cihaz eşleştirmek için 6 haneli 2FA SMS doğrulama kodunuzu (270391) girmelisiniz.');
      return;
    }

    setIsProcessing(true);
    try {
      await pairCurrentDeviceToSlot(slotId, currentUser.name);
      setActionSuccess(`Bu cihaz başarıyla [${slotId === 'mobile_phone' ? 'Cep Telefonum' : slotId === 'home_pc' ? 'Evdeki PC' : 'Ofisteki PC'}] olarak sisteme tanımlandı ve kilitlendi.`);
      setSelectedSlotForPairing(null);
      setAdminPin('');
      await loadData();
    } catch (err) {
      setActionError('Cihaz eşleştirme işlemi sırasında bir hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnpair = async (slotId: DeviceSlotId, slotName: string) => {
    if (!window.confirm(`${slotName} eşleştirmesini kaldırmak istediğinizden emin misiniz? Bu cihazın sisteme erişimi derhal durdurulacaktır.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      await unpairDeviceSlot(slotId, currentUser.name);
      setActionSuccess(`${slotName} eşleştirmesi başarıyla kaldırıldı.`);
      await loadData();
    } catch (err) {
      setActionError('Eşleştirme kaldırılırken hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentDeviceIsPairedTo = slots.find(s => s.isCurrentDevice);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fade-in">
      <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                Yetkili Cihaz & Donanım Eşleştirme
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-bold">
                  3 Cihaz Limiti
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Sisteme yalnızca aşağıda tanımlanan 3 cihaz erişebilir. Dışarıdan yabancı girişler tamamen engellenir.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Current Device Detection Banner */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                {currentInfo?.isMobile ? <Smartphone className="w-5 h-5 text-amber-400" /> : <Monitor className="w-5 h-5 text-sky-400" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Şu An Kullandığınız Donanım:</span>
                  {currentDeviceIsPairedTo ? (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Eşleşti: {currentDeviceIsPairedTo.slotName}
                    </span>
                  ) : (
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Henüz Tanımlanmadı
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {currentInfo?.description}
                </div>
              </div>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Yenile</span>
            </button>
          </div>

          {/* Notifications */}
          {actionError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* 3 Authorized Device Slots */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
              Tanımlı Yetkili Donanım Yuvaları (Whitelist)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {slots.map((slot) => {
                const isPaired = Boolean(slot.deviceToken);
                const isCurrent = Boolean(slot.isCurrentDevice);
                const IconComponent = slot.slotId === 'mobile_phone' ? Smartphone : slot.slotId === 'home_pc' ? Laptop : Monitor;

                return (
                  <div 
                    key={slot.slotId}
                    className={`relative p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isCurrent 
                        ? 'bg-indigo-950/30 border-indigo-500/50 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/30' 
                        : isPaired 
                          ? 'bg-slate-950/80 border-emerald-500/30' 
                          : 'bg-slate-950/40 border-slate-800 border-dashed'
                    }`}
                  >
                    <div>
                      {/* Top icon and badge */}
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isPaired ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'
                        }`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        {isPaired ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Aktif Eşleşti
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            Boş Yuva
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-bold text-white mb-1">
                        {slot.slotName}
                      </h4>

                      {/* Device info if paired */}
                      {isPaired ? (
                        <div className="space-y-1.5 text-[11px] text-slate-400">
                          <div className="font-mono text-slate-300 truncate">
                            {slot.osInfo || 'Bilinmiyor'} • {slot.browserInfo || ''}
                          </div>
                          {slot.pairedAt && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              Eşleşme: {new Date(slot.pairedAt).toLocaleDateString('tr-TR')}
                            </div>
                          )}
                          {isCurrent && (
                            <div className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 inline-block mt-1">
                              📍 Şu an bu cihazdasınız
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500">
                          Bu yuvaya henüz bir cihaz tanımlanmadı.
                        </p>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      {isPaired ? (
                        <button
                          type="button"
                          onClick={() => handleUnpair(slot.slotId, slot.slotName)}
                          disabled={isProcessing}
                          className="w-full py-1.5 px-2 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-slate-800 hover:border-rose-500/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eşleştirmeyi Kaldır</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSlotForPairing(slot.slotId);
                            setActionError(null);
                            setActionSuccess(null);
                          }}
                          disabled={isProcessing}
                          className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-indigo-600/30"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Bu Cihazı Buraya Eşleştir</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pairing Confirmation Box */}
          {selectedSlotForPairing && (
            <div className="p-5 bg-gradient-to-br from-indigo-950/80 to-slate-950 border-2 border-indigo-500/50 rounded-2xl space-y-4 animate-fade-in shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-400" />
                    Cihaz Eşleştirme Güvenlik Onayı
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Şu an kullandığınız bu cihazı <span className="text-amber-400 font-bold">[{selectedSlotForPairing === 'mobile_phone' ? 'Cep Telefonum' : selectedSlotForPairing === 'home_pc' ? 'Evdeki PC' : 'Ofisteki PC'}]</span> olarak yetkilendirmek üzeresiniz.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSlotForPairing(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1 font-mono">
                <div>Donanım: {currentInfo?.description}</div>
                <div className="text-[10px] text-slate-400">Token: {currentInfo?.token.substring(0, 18)}...</div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    maxLength={6}
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="2FA SMS Kodu (270391)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono tracking-widest"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handlePairCurrentDevice(selectedSlotForPairing)}
                    disabled={isProcessing || !adminPin.trim()}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Cihazı Onayla & Eşleştir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSlotForPairing(null)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Rules Summary */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs text-slate-400 space-y-1.5">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Nasıl Korunuyorsunuz?</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
              <li>Cihazınızın donanımsal tarayıcı parmak izi eşleştirildikten sonra sadece bu 3 cihazdan giriş kabul edilir.</li>
              <li>İnternet kafe, yabancı bilgisayar veya başka bir telefondan giriş yapılmak istendiğinde anında engellenir.</li>
              <li>Bilgisayarınızı veya telefonunuzu yenilediğinizde buradan eski eşleştirmeyi silip yenisini tanımlayabilirsiniz.</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
