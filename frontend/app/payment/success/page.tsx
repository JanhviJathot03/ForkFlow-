'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { payments } from '@/lib/api';
import { clearPendingStripePayment, getPendingStripePayment } from '@/lib/stripePayment';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [agentId, setAgentId] = useState<string | null>(null);
  const [message, setMessage] = useState('Confirming your payment...');

  useEffect(() => {
    const pending = getPendingStripePayment();
    if (!pending) {
      setStatus('error');
      setMessage('No pending payment found. Start checkout from an agent page first.');
      return;
    }

    setAgentId(pending.agentId);

    payments
      .stripeLinkComplete(pending.paymentId)
      .then(() => {
        clearPendingStripePayment();
        setStatus('done');
        setMessage('Payment confirmed! You now have access to this agent.');
        setTimeout(() => {
          router.replace(`/marketplace/${pending.agentId}?payment=success`);
        }, 1500);
      })
      .catch((err: { response?: { data?: { error?: string } } }) => {
        setStatus('error');
        setMessage(err?.response?.data?.error || 'Could not confirm payment. Try opening the agent page again.');
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center">
        {status === 'loading' && (
          <div className="animate-pulse text-slate-400">{message}</div>
        )}
        {status === 'done' && (
          <>
            <p className="text-4xl mb-4">✓</p>
            <h1 className="text-xl font-bold text-green-300 mb-2">Payment successful</h1>
            <p className="text-slate-400 text-sm">{message}</p>
            <p className="text-slate-500 text-xs mt-4">Redirecting to your agent...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-xl font-bold text-red-300 mb-2">Something went wrong</h1>
            <p className="text-slate-400 text-sm">{message}</p>
            {agentId ? (
              <Link
                href={`/marketplace/${agentId}`}
                className="mt-6 inline-block rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
              >
                Go to agent
              </Link>
            ) : (
              <Link
                href="/marketplace"
                className="mt-6 inline-block rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
              >
                Browse marketplace
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
