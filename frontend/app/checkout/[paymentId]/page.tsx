'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { payments } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface PaymentDetails {
  paymentId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  amount: string;
  paymentType: string;
  metadata: {
    instructions?: string;
    receiver?: string;
    manual?: boolean;
  };
  agent?: { id: string; name: string; category: string };
  payer?: { id: string; walletAddress: string; username?: string };
  createdAt: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="ml-2 rounded-md border border-slate-600 px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-700 transition"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    completed: 'bg-green-500/20 text-green-300 border-green-500/30',
    failed: 'bg-red-500/20 text-red-300 border-red-500/30',
    refunded: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };
  const labels: Record<string, string> = {
    pending: '⏳ Awaiting Payment',
    completed: '✓ Payment Confirmed',
    failed: '✕ Payment Failed',
    refunded: '↩ Refunded',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
}

export default function CheckoutPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const loadPayment = useCallback(async () => {
    try {
      const res = await payments.getStatus(paymentId);
      setPayment(res.data);
    } catch {
      setPayment(null);
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    loadPayment();
  }, [loadPayment]);

  // Poll every 10s while pending so the page auto-updates when admin confirms
  useEffect(() => {
    if (!payment || payment.status !== 'pending') return;
    const interval = setInterval(async () => {
      try {
        const res = await payments.getStatus(paymentId);
        setPayment(res.data);
        if (res.data.status === 'completed') clearInterval(interval);
      } catch {
        // ignore poll errors
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [payment?.status, paymentId]);

  // Dev/admin: mark as paid directly from this page
  const handleMarkPaid = async () => {
    setConfirming(true);
    setConfirmError(null);
    try {
      await payments.manualConfirm(paymentId);
      await loadPayment();
    } catch (err: any) {
      setConfirmError(err?.response?.data?.error || 'Could not confirm payment. Is DEV_ALLOW_MANUAL_CONFIRM=true?');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">Payment not found</p>
          <Link href="/marketplace" className="text-blue-400 hover:underline">Back to marketplace</Link>
        </div>
      </div>
    );
  }

  const isCompleted = payment.status === 'completed';
  const instructions = payment.metadata?.instructions || '';
  const receiver = payment.metadata?.receiver || '';

  // Parse receiver into parts (UPI line + crypto line)
  const receiverParts = receiver.split('|').map((s) => s.trim()).filter(Boolean);

  // Parse instructions into steps (split on \n)
  const instructionLines = instructions.split(/\\n|\n/).map((s) => s.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-2xl px-4 py-16">

        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400 mb-3">Payment</p>
          <h1 className="text-3xl font-bold mb-4">
            {isCompleted ? 'Access Granted' : 'Complete Your Payment'}
          </h1>
          <StatusBadge status={payment.status} />
        </div>

        {/* Agent + amount card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Agent</p>
              <p className="text-lg font-semibold">{payment.agent?.name || 'Unknown Agent'}</p>
              {payment.agent?.category && (
                <p className="text-sm text-slate-400 capitalize mt-0.5">{payment.agent.category}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Amount</p>
              <p className="text-3xl font-bold text-blue-400">${parseFloat(payment.amount).toFixed(2)}</p>
              <p className="text-xs text-slate-500 capitalize mt-0.5">{payment.paymentType?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Completed state */}
        {isCompleted ? (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-8 text-center space-y-4">
            <div className="text-5xl">✅</div>
            <p className="text-xl font-semibold text-green-300">Payment confirmed!</p>
            <p className="text-slate-300 text-sm">
              Your access to <strong>{payment.agent?.name}</strong> has been unlocked.
            </p>
            <Link
              href={`/marketplace/${payment.agent?.id}`}
              className="inline-block mt-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 font-semibold text-white hover:opacity-90 transition"
            >
              Run Agent →
            </Link>
          </div>
        ) : (
          <>
            {/* Payment instructions */}
            <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6 mb-6 space-y-5">
              <h2 className="text-lg font-semibold">Payment Instructions</h2>

              {/* Receiver addresses */}
              {receiverParts.length > 0 && (
                <div className="space-y-3">
                  {receiverParts.map((part, i) => {
                    const isUpi = part.toLowerCase().startsWith('upi');
                    const isCrypto = part.toLowerCase().startsWith('crypto') || part.startsWith('0x');
                    const value = part.includes(':') ? part.split(':').slice(1).join(':').trim() : part;
                    return (
                      <div key={i} className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                        <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                          {isUpi ? '📱 UPI' : isCrypto ? '🔗 Crypto Wallet' : '💳 Payment Address'}
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm font-mono text-white break-all">{value}</code>
                          <CopyButton text={value} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Step-by-step instructions */}
              {instructionLines.length > 0 && (
                <div className="space-y-2">
                  {instructionLines.map((line, i) => (
                    <div key={i} className="flex gap-3 text-sm text-slate-300">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Amount reminder */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-blue-200">
                Send exactly <strong className="text-white">${parseFloat(payment.amount).toFixed(2)}</strong> and keep your transaction ID / UTR number handy.
              </div>
            </div>

            {/* "I've Paid" section */}
            <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6 space-y-4">
              <h2 className="text-lg font-semibold">After Paying</h2>
              <p className="text-sm text-slate-400">
                Once you've sent the payment, click below. The creator will verify and unlock your access — usually within a few minutes.
              </p>

              {confirmError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  {confirmError}
                </div>
              )}

              <button
                onClick={handleMarkPaid}
                disabled={confirming}
                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-3.5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {confirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Confirming...
                  </span>
                ) : (
                  "✓ I've Paid — Confirm Access"
                )}
              </button>

              <p className="text-xs text-slate-500 text-center">
                This page auto-refreshes every 10 seconds. Payment ID: <code className="text-slate-400">{paymentId.slice(0, 8)}…</code>
              </p>
            </div>
          </>
        )}

        {/* Back link */}
        <div className="mt-8 text-center">
          {payment.agent?.id && (
            <Link href={`/marketplace/${payment.agent.id}`} className="text-slate-500 hover:text-slate-300 text-sm transition">
              ← Back to agent
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
