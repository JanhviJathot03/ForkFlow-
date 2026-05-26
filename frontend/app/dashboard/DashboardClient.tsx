'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { agents as agentsApi, dashboard, payments, execute } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { MarketplaceNav } from '@/components/layout/MarketplaceNav';

export default function DashboardClient() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [earnings, setEarnings] = useState<any>(null);
  const [myAgents, setMyAgents] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [execHistory, setExecHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'purchases' | 'history'>(
    'overview'
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadDashboard = async () => {
      try {
        const [earningsRes, agentsRes, subscriptionsRes, historyRes] = await Promise.all([
          dashboard.getEarnings(),
          dashboard.getAgents(),
          dashboard.getSubscriptions(),
          execute.getMyHistory(),
        ]);

        setEarnings(earningsRes.data.earnings);
        setMyAgents(agentsRes.data.agents);
        setSubscriptions(subscriptionsRes.data.subscriptions);
        setExecHistory(historyRes.data.executions || []);
      } catch (error) {
        console.error('Failed to load dashboard', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  // Handle payment return from Stripe
  useEffect(() => {
    if (!user) return;
    const mockPaymentId = searchParams.get('mockPaymentId');
    const paymentStatus = searchParams.get('payment');

    if (!mockPaymentId && !paymentStatus) return;

    if (mockPaymentId) {
      payments.getStatus(mockPaymentId).catch(() => {});
      setPaymentNotice('Mock payment recorded. Your dashboard will update shortly.');
    } else if (paymentStatus === 'success') {
      setPaymentNotice('Payment confirmed. Your access and earnings are updating.');
    } else if (paymentStatus === 'cancelled') {
      setPaymentNotice('Payment cancelled. No changes were made.');
    }
  }, [searchParams, user]);

  const handlePublishToggle = async (agentId: string, currentStatus: string) => {
    setPublishingId(agentId);
    try {
      const nextPublished = currentStatus !== 'published';
      await agentsApi.publish(agentId, { isPublished: nextPublished });
      setMyAgents((current) =>
        current.map((a) =>
          a.id === agentId ? { ...a, status: nextPublished ? 'published' : 'draft' } : a
        )
      );
    } catch {
      alert('Failed to update publish status');
    } finally {
      setPublishingId(null);
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen bg-black text-white">
      <MarketplaceNav />
      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-28 pb-16">
        <div className="flex items-start justify-between gap-6 mb-10">
          <div>
            <h1 className="font-heading italic text-5xl tracking-[-2px]">Dashboard</h1>
            <p className="mt-2 text-white/70 font-body">
              Manage your agents, subscriptions, and execution history.
            </p>
          </div>
          <Link
            href="/builder"
            className="liquid-glass-strong rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          >
            Build an agent
          </Link>
        </div>

        {paymentNotice ? (
          <div className="mb-6 liquid-glass rounded-[1.25rem] px-6 py-4 text-sm text-white/90">
            {paymentNotice}
          </div>
        ) : null}

        {loading ? (
          <div className="liquid-glass rounded-[1.25rem] p-8 text-white/70">Loading…</div>
        ) : !user ? (
          <div className="liquid-glass rounded-[1.25rem] p-8">
            <p className="text-white/80">Please sign in first.</p>
            <Link href="/login" className="mt-4 inline-block text-white underline">
              Go to login
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="liquid-glass rounded-[1.25rem] p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-white/70">Earnings</p>
              <p className="mt-3 font-heading  text-4xl tracking-[-1px]">
                50 USD 
              </p>
              <p className="mt-2 text-sm text-white/70 font-body">
                Active subscriptions: {earnings?.activeSubscriptions ?? 1}
              </p>
            </div>

            <div className="liquid-glass rounded-[1.25rem] p-6">
              <div className="flex gap-2 flex-wrap mb-4">
                {(['overview', 'agents', 'purchases', 'history'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      activeTab === t ? 'liquid-glass-strong' : 'liquid-glass text-white/80'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {activeTab === 'agents' ? (
                <div className="space-y-3">
                  {(myAgents || []).map((a) => (
                    <div
                      key={a.id}
                      className="liquid-glass rounded-[1.25rem] px-5 py-4 flex items-center justify-between gap-4"
                    >
                      <div>
                        <p className="font-semibold">{a.name}</p>
                        <p className="text-xs text-white/70 capitalize">{a.status}</p>
                      </div>
                      <button
                        onClick={() => handlePublishToggle(a.id, a.status)}
                        disabled={publishingId === a.id}
                        className="liquid-glass-strong rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-60"
                      >
                        {publishingId === a.id ? 'Updating…' : 'Toggle publish'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/70 font-body">
                  Select a tab to view details.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


