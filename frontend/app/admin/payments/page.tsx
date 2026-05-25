'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { payments } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface PendingPayment {
  id: string;
  amount: string;
  paymentType: string;
  status: string;
  createdAt: string;
  metadata: { instructions?: string; receiver?: string; manual?: boolean };
  agent?: { id: string; name: string; category: string };
  payer?: { id: string; walletAddress: string; username?: string };
  receiver?: { id: string; walletAddress: string; username?: string };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminPaymentsPage() {
  const { user } = useAuthStore();
  const [pendingList, setPendingList] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());

  const loadPending = useCallback(async () => {
    try {
      const res = await payments.getPending();
      setPendingList(res.data.payments || []);
    } catch (err: any) {
      console.error('Failed to load pending payments', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
    // Refresh every 30s
    const interval = setInterval(loadPending, 30000);
    return () => clearInterval(interval);
  }, [loadPending]);

  const handleConfirm = async (paymentId: string) => {
    setConfirmingId(paymentId);
    setErrors((prev) => ({ ...prev, [paymentId]: '' }));
    try {
      await payments.manualConfirm(paymentId);
      setConfirmed((prev) => new Set([...prev, paymentId]));
      // Remove from list after short delay
      setTimeout(() => {
        setPendingList((prev) => prev.filter((p) => p.id !== paymentId));
        setConfirmed((prev) => { const s = new Set(prev); s.delete(paymentId); return s; });
      }, 2000);
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        [paymentId]: err?.response?.data?.error || 'Confirmation failed',
      }));
    } finally {
      setConfirmingId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold mb-2">Not logged in</p>
          <Link href="/login" className="text-blue-400 hover:underline">Log in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-1">Admin</p>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Pending Payments
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Review manual payments and confirm access for buyers.
            </p>
          </div>
          <button
            onClick={loadPending}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Pending', value: pendingList.length, color: 'text-yellow-400' },
            { label: 'Confirmed this session', value: confirmed.size, color: 'text-green-400' },
            { label: 'Auto-refresh', value: '30s', color: 'text-slate-400' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Payment list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-800 animate-pulse border border-slate-700" />
            ))}
          </div>
        ) : pendingList.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <p className="text-4xl mb-4">🎉</p>
            <p className="text-lg font-semibold text-slate-300">No pending payments</p>
            <p className="text-slate-500 text-sm mt-2">All caught up. New payments will appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingList.map((payment) => {
              const isConfirmed = confirmed.has(payment.id);
              const isConfirming = confirmingId === payment.id;
              const error = errors[payment.id];

              return (
                <div
                  key={payment.id}
                  className={`rounded-2xl border p-5 transition ${
                    isConfirmed
                      ? 'border-green-500/40 bg-green-500/5'
                      : 'border-slate-700 bg-slate-900/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">

                    {/* Left: payment info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-lg font-bold text-blue-400">
                          ${parseFloat(payment.amount).toFixed(2)}
                        </span>
                        <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs text-slate-300 capitalize">
                          {payment.paymentType?.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-500">{timeAgo(payment.createdAt)}</span>
                      </div>

                      {/* Agent */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Agent:</span>
                        {payment.agent ? (
                          <Link
                            href={`/marketplace/${payment.agent.id}`}
                            className="font-medium text-white hover:text-blue-400 transition"
                          >
                            {payment.agent.name}
                          </Link>
                        ) : (
                          <span className="text-slate-500">Unknown</span>
                        )}
                      </div>

                      {/* Buyer */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">Buyer:</span>
                        <span className="font-mono text-slate-300 text-xs">
                          {payment.payer?.username || payment.payer?.walletAddress?.slice(0, 16) + '...' || 'Unknown'}
                        </span>
                      </div>

                      {/* Payment ID */}
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>ID:</span>
                        <code className="font-mono">{payment.id.slice(0, 20)}…</code>
                        <Link
                          href={`/checkout/${payment.id}`}
                          target="_blank"
                          className="text-blue-400 hover:underline"
                        >
                          View checkout page ↗
                        </Link>
                      </div>

                      {error && (
                        <p className="text-xs text-red-400">{error}</p>
                      )}
                    </div>

                    {/* Right: action */}
                    <div className="shrink-0">
                      {isConfirmed ? (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-green-500/20 border border-green-500/30 px-4 py-2 text-sm font-semibold text-green-300">
                          ✓ Confirmed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConfirm(payment.id)}
                          disabled={isConfirming}
                          className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                          {isConfirming ? (
                            <span className="flex items-center gap-2">
                              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Confirming…
                            </span>
                          ) : (
                            '✓ Mark as Paid'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Note about DEV_ALLOW_MANUAL_CONFIRM */}
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-400">Note</p>
          <p>Confirming a payment grants the buyer immediate access to the agent and updates the creator's earnings.</p>
          <p>This page requires <code className="text-slate-300">DEV_ALLOW_MANUAL_CONFIRM=true</code> in the backend <code className="text-slate-300">.env</code>.</p>
          <p>In production, replace this with a proper role-based admin check.</p>
        </div>
      </div>
    </div>
  );
}
