'use client';

import { useState } from 'react';
import { payments } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface PaymentButtonProps {
  agentId: string;
  amount: number;
  paymentType?: 'purchase' | 'subscription' | 'pay_per_use';
  label?: string;
  className?: string;
  onSuccess?: (checkoutUrl: string) => void;
}

export function PaymentButton({
  agentId,
  amount,
  paymentType = 'purchase',
  label = 'Pay Manually',
  className = '',
  onSuccess,
}: PaymentButtonProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [manualPayment, setManualPayment] = useState<{
    paymentId: string;
    instructions: string;
    receiver: string;
  } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      alert('Please log in with your wallet first.');
      return;
    }

    setLoading(true);

    try {
      const response = await payments.manualInitiate({
        agentId,
        amount,
        paymentType,
      });

      setManualPayment({
        paymentId: response.data.paymentId,
        instructions: response.data.instructions,
        receiver: response.data.receiver,
      });
    } catch (error) {
      console.error('Payment failed', error);
      alert('Payment initiation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!manualPayment) {
      return;
    }

    setConfirming(true);

    try {
      await payments.manualConfirm(manualPayment.paymentId);
      alert('Payment marked as completed.');
      setManualPayment(null);
    } catch (error) {
      console.error('Payment confirmation failed', error);
      alert('Could not confirm payment.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handlePayment}
        disabled={loading}
        className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {loading ? 'Preparing instructions...' : label}
      </button>

      {manualPayment ? (
        <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-4 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Manual Payment</p>
          <p className="mt-3 text-slate-300">Receiver: <span className="font-semibold text-white">{manualPayment.receiver}</span></p>
          <p className="mt-3 whitespace-pre-line text-slate-300">{manualPayment.instructions}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setManualPayment(null)}
              className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {confirming ? 'Confirming...' : 'Mark Paid (Dev)'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
