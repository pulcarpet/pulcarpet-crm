import React, { useState } from 'react';
import { Order } from '../types';
import { Coins, X, CheckCircle, DollarSign, Calendar, CreditCard, ShieldCheck } from 'lucide-react';

interface AdvancePaymentModalProps {
  order: Order;
  onClose: () => void;
  onSave: (updatedOrder: Order) => void;
}

export const AdvancePaymentModal: React.FC<AdvancePaymentModalProps> = ({
  order,
  onClose,
  onSave,
}) => {
  const [amount, setAmount] = useState<number>(order.advancePaymentAmount || 0);
  const [currency, setCurrency] = useState<'TL' | 'USD' | 'EUR' | 'GBP'>(
    order.advancePaymentCurrency || order.currency || 'TL'
  );
  const [notes, setNotes] = useState<string>(
    order.advancePaymentNotes || 'Banka Havalesi / Ön Ödeme'
  );
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const getSymbol = (c: string) => {
    if (c === 'USD') return '$';
    if (c === 'EUR') return '€';
    if (c === 'GBP') return '£';
    return '₺';
  };

  const remainingBalance = Math.max(0, order.totalAmount - (amount || 0));

  const handleQuickPercent = (pct: number) => {
    const calculated = Math.round((order.totalAmount * pct) / 100);
    setAmount(calculated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasAdv = amount > 0;
    const updated: Order = {
      ...order,
      hasAdvancePayment: hasAdv,
      advancePaymentAmount: amount,
      advancePaymentCurrency: currency,
      advancePaymentNotes: notes,
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl text-slate-100 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Ön Ödeme & Tahsilat Girişi</h3>
              <p className="text-xs text-slate-400">
                Sipariş: <span className="font-mono text-indigo-400 font-bold">{order.orderNumber}</span> • {order.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Financial Overview */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Sipariş Toplam Tutarı:</span>
            <span className="font-mono font-bold text-white text-sm">
              {order.totalAmount.toLocaleString('tr-TR')} {getSymbol(order.currency || 'TL')}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Girilen Ön Ödeme (Kapora):</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {amount.toLocaleString('tr-TR')} {getSymbol(currency)}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-800/80 pt-2">
            <span className="text-slate-400">Kalan Bakiye:</span>
            <span className="font-mono font-extrabold text-amber-400 text-sm">
              {remainingBalance.toLocaleString('tr-TR')} {getSymbol(order.currency || 'TL')}
            </span>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-200 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" /> Tahsil Edilen Ön Ödeme Tutarı
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleQuickPercent(30)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded border border-slate-700 text-[10px]"
                >
                  %30
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPercent(50)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded border border-slate-700 text-[10px]"
                >
                  %50
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPercent(100)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold rounded border border-slate-700 text-[10px]"
                >
                  Tamamı
                </button>
                <button
                  type="button"
                  onClick={() => setAmount(0)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold rounded border border-slate-700 text-[10px]"
                >
                  Sıfırla
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="any"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                placeholder="Ön ödeme tutarı girin"
                className="flex-1 bg-slate-950 border border-slate-700 text-white font-mono font-bold px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 text-white font-bold px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="TL">₺ (TL)</option>
                <option value="USD">$ (USD)</option>
                <option value="EUR">€ (EUR)</option>
                <option value="GBP">£ (GBP)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-200 block mb-1">
              Ödeme Notu / Dekont Numarası / Banka
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Örn: Garanti Bankası EFT - Dekont No: 289410"
              className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-200 block mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tahsilat / Ödeme Tarihi
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white font-mono px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none cursor-pointer"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <CheckCircle className="w-4 h-4 text-emerald-200" />
              <span>Ön Ödemeyi Kaydet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
