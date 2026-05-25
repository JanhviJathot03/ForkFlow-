'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { agents as agentsApi, dashboard, payments, execute } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function DashboardPage() {
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
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'purchases' | 'history'>('overview');

  useEffect(() => { setMounted(true); }, []);

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

  if (!mounted) return null; // prevent SSR/client mismatch

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white px-4 py-20">
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-4">Creator Dashboard</h1>
          <p className="text-slate-400 mb-6">Connect your wallet and log in to view your earnings, agents, and history.</p>
          <Link href="/login" className="inline-block rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white hover:bg-blue-600 transition">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'agents', label: `My Agents (${myAgents.length})` },
    { id: 'purchases', label: `Subscriptions (${subscriptions.length})` },
    { id: 'history', label: `Run History (${execHistory.length})` },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-400 mt-2 text-sm truncate">
            {user.username || user.walletAddress}
          </p>
        </div>

        {paymentNotice && (
          <div className="mb-6 rounded-2xl border border-blue-500/40 bg-blue-500/10 px-6 py-4 text-sm text-blue-100 flex justify-between">
            <span>{paymentNotice}</span>
            <button onClick={() => setPaymentNotice(null)} className="text-blue-300 hover:text-white ml-4">✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-800 pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-slate-400">Loading dashboard...</div>
        ) : (
          <>
            {/* ── Overview ─────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-4 gap-5">
                  {[
                    { label: 'Total Earnings', value: `${earnings?.totalEarnings ?? 0} ETH`, color: 'text-blue-400' },
                    { label: 'This Month', value: `${earnings?.thisMonth ?? 0} ETH`, color: 'text-purple-400' },
                    { label: 'Published Agents', value: myAgents.filter((a) => a.status === 'published').length, color: 'text-green-400' },
                    { label: 'Total Executions', value: execHistory.length, color: 'text-pink-400' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                      <p className="text-slate-400 text-sm">{stat.label}</p>
                      <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Recent executions */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold mb-4">Recent Runs</h2>
                  {execHistory.length === 0 ? (
                    <p className="text-slate-500 text-sm">No executions yet. <Link href="/marketplace" className="text-blue-400 hover:underline">Browse agents</Link> to get started.</p>
                  ) : (
                    <div className="space-y-3">
                      {execHistory.slice(0, 5).map((exec) => (
                        <div key={exec.id} className="flex items-center justify-between rounded-xl bg-slate-950/60 px-4 py-3">
                          <div>
                            <p className="font-medium text-sm">{exec.agent?.name || 'Unknown Agent'}</p>
                            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{exec.input}</p>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              exec.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                              exec.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                              'bg-yellow-500/20 text-yellow-300'
                            }`}>
                              {exec.status}
                            </span>
                            <p className="text-xs text-slate-500 mt-1">{exec.durationMs ? `${exec.durationMs}ms` : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── My Agents ────────────────────────────────────────────── */}
            {activeTab === 'agents' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Your Agents</h2>
                  <Link href="/builder" className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition">
                    + Create Agent
                  </Link>
                </div>
                {myAgents.length === 0 ? (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center">
                    <p className="text-slate-400 mb-4">You haven't created any agents yet.</p>
                    <Link href="/builder" className="text-blue-400 hover:underline">Build your first agent →</Link>
                  </div>
                ) : (
                  myAgents.map((agent) => (
                    <div key={agent.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold">{agent.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            agent.status === 'published' ? 'bg-green-500/20 text-green-300' : 'bg-slate-700 text-slate-400'
                          }`}>
                            {agent.status}
                          </span>
                        </div>
                        <div className="flex gap-4 mt-1 text-sm text-slate-400">
                          <span>{agent.earnings} ETH earned</span>
                          <span>{agent.executions} executions</span>
                          <span>{agent.views} downloads</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Link
                          href={`/marketplace/${agent.id}`}
                          className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handlePublishToggle(agent.id, agent.status)}
                          disabled={publishingId === agent.id}
                          className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-500/20 disabled:opacity-60 transition"
                        >
                          {publishingId === agent.id ? '...' : agent.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Subscriptions / Purchases ─────────────────────────────── */}
            {activeTab === 'purchases' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Active Subscriptions & Purchases</h2>
                {subscriptions.length === 0 ? (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center">
                    <p className="text-slate-400 mb-4">No active subscriptions.</p>
                    <Link href="/marketplace" className="text-blue-400 hover:underline">Browse the marketplace →</Link>
                  </div>
                ) : (
                  subscriptions.map((sub) => (
                    <div key={sub.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{sub.agentName}</p>
                        <p className="text-sm text-slate-400 mt-0.5">{sub.monthlyPrice} ETH/month</p>
                        {sub.nextBillingDate && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Expires: {new Date(sub.nextBillingDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          sub.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {sub.status}
                        </span>
                        <Link
                          href={`/marketplace/${sub.agentId}`}
                          className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
                        >
                          Run
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Run History ───────────────────────────────────────────── */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Execution History</h2>
                {execHistory.length === 0 ? (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center">
                    <p className="text-slate-400">No executions yet.</p>
                  </div>
                ) : (
                  execHistory.map((exec) => (
                    <div key={exec.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-semibold">{exec.agent?.name || 'Unknown Agent'}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              exec.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                              exec.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                              'bg-yellow-500/20 text-yellow-300'
                            }`}>
                              {exec.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 mb-1">
                            <span className="text-slate-500">Input: </span>{exec.input}
                          </p>
                          {exec.output && (
                            <p className="text-sm text-slate-300 line-clamp-2">
                              <span className="text-slate-500">Output: </span>{exec.output}
                            </p>
                          )}
                          {exec.errorMessage && (
                            <p className="text-sm text-red-400">Error: {exec.errorMessage}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0 text-xs text-slate-500">
                          <p>{new Date(exec.createdAt).toLocaleDateString()}</p>
                          {exec.durationMs && <p>{exec.durationMs}ms</p>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
