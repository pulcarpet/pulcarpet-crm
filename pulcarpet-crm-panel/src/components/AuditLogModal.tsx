import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  User, 
  Smartphone, 
  Lock, 
  Key, 
  RefreshCw, 
  X, 
  FileText, 
  Activity, 
  AlertTriangle,
  CheckCircle2,
  Laptop
} from 'lucide-react';
import { getRecentAuditLogs, AuditLogEntry } from '../lib/firebase';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getRecentAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(l => {
    if (filterAction === 'ALL') return true;
    if (filterAction === 'AUTH') return l.action.startsWith('LOGIN') || l.action.startsWith('LOGOUT') || l.action.startsWith('SESSION');
    if (filterAction === 'OPERATIONS') return !l.action.startsWith('LOGIN') && !l.action.startsWith('LOGOUT');
    return true;
  });

  const getActionBadge = (action: string, status: string) => {
    switch (action) {
      case 'LOGIN_SUCCESS':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 2FA Giriş Başarılı</span>;
      case 'LOGIN_2FA_SENT':
        return <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1"><Smartphone className="w-3 h-3" /> SMS Kodu Gönderildi</span>;
      case 'LOGIN_FAILED':
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Hatalı Giriş Denemesi</span>;
      case 'SESSION_LOCKED':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1"><Lock className="w-3 h-3" /> Otomatik Ekran Kilidi</span>;
      case 'SESSION_UNLOCKED':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1"><Key className="w-3 h-3" /> Kilit Açıldı</span>;
      case 'ORDER_CREATED':
        return <span className="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1"><FileText className="w-3 h-3" /> Sipariş Oluşturuldu</span>;
      default:
        return <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">{action}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Güvenlik & Erişim Denetim Günlüğü (Audit Log)
              </h3>
              <p className="text-xs text-slate-400">
                2FA SMS doğrulamaları, yetkili girişleri ve hassas ticari veri işlemleri
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Yenile
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3 bg-slate-950/30 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Filtre:</span>
            <button
              onClick={() => setFilterAction('ALL')}
              className={`px-2.5 py-1 rounded-md font-bold text-xs transition-colors cursor-pointer ${filterAction === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              Tüm Kayıtlar ({logs.length})
            </button>
            <button
              onClick={() => setFilterAction('AUTH')}
              className={`px-2.5 py-1 rounded-md font-bold text-xs transition-colors cursor-pointer ${filterAction === 'AUTH' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              Giriş & 2FA SMS
            </button>
            <button
              onClick={() => setFilterAction('OPERATIONS')}
              className={`px-2.5 py-1 rounded-md font-bold text-xs transition-colors cursor-pointer ${filterAction === 'OPERATIONS' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              Ticari İşlemler
            </button>
          </div>

          <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            256-bit Firebase Auth & Firestore Aktif
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Henüz kaydedilmiş bir güvenlik olayı bulunmuyor.
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredLogs.map((log, idx) => (
                <div 
                  key={log.id || idx}
                  className="bg-slate-950/60 hover:bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getActionBadge(log.action, log.status)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200 flex items-center gap-2">
                        <span>{log.userName || log.userId}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({log.userRole || 'Yönetici'})</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">{log.details}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono shrink-0 md:text-right">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(log.timestamp).toLocaleString('tr-TR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Kadir Korkmaz & PulCarpet Şirket Yönetimi Güvenlik Katmanı</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
