'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { agents as agentsApi, payments, execute, reviews as reviewsApi, ai, formatApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { BuyRentModal } from '@/components/payments/BuyRentModal';
import {
  clearPendingStripePayment,
  getPendingStripePayment,
} from '@/lib/stripePayment';
import { PageVideoBackground } from '@/components/layout/PageVideoBackground';
import { MarketplaceNav } from '@/components/layout/MarketplaceNav';
import { MARKETPLACE_AGENT_VIDEO } from '@/lib/videos';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  features: string[];
  pricingModel: 'purchase' | 'subscription' | 'pay_per_use';
  purchasePrice: number;
  monthlyCost: number;
  payPerUsePrice: number;
  ratings: number;
  downloads: number;
  promptTemplate?: string;
  creator?: { id: string; walletAddress: string; username?: string };
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  user?: { id: string; walletAddress: string; username?: string };
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getPriceDisplay(agent: Agent): string {
  if (agent.pricingModel === 'subscription') {
    const p = parseFloat(String(agent.monthlyCost || 0));
    return p > 0 ? `$${p} / month` : 'Free';
  }
  if (agent.pricingModel === 'pay_per_use') {
    const p = parseFloat(String(agent.payPerUsePrice || 0));
    return p > 0 ? `$${p} per use` : 'Free';
  }
  const p = parseFloat(String(agent.purchasePrice || 0));
  return p > 0 ? `$${p}` : 'Free';
}

function getPrice(agent: Agent): number {
  if (agent.pricingModel === 'subscription') return parseFloat(String(agent.monthlyCost || 0));
  if (agent.pricingModel === 'pay_per_use') return parseFloat(String(agent.payPerUsePrice || 0));
  return parseFloat(String(agent.purchasePrice || 0));
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
          className={`text-2xl transition ${
            star <= (hover || value) ? 'text-yellow-400' : 'text-white/25'
          } ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessVia, setAccessVia] = useState<string | null>(null);
  const [buyRentModalOpen, setBuyRentModalOpen] = useState(false);

  // Payment state
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<string | null>(null);
  const [backendOffline, setBackendOffline] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const pendingPaymentHandled = useRef(false);

  // Reviews state
  const [reviewList, setReviewList] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // ── Load agent + access ──────────────────────────────────────────────────
  const loadAgent = useCallback(async () => {
    try {
      const res = await agentsApi.getById(id);
      setAgent(res.data.agent);
    } catch {
      setAgent(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const checkAccess = useCallback(async () => {
    if (!user) return;
    try {
      const res = await agentsApi.getAccess(id);
      setHasAccess(res.data.hasAccess);
      setAccessVia(res.data.via);
    } catch {
      setHasAccess(false);
    }
  }, [id, user]);

  const loadReviews = useCallback(async () => {
    try {
      const res = await reviewsApi.getForAgent(id);
      setReviewList(res.data.reviews || []);
      setReviewStats(res.data.stats);
    } catch {
      // ignore
    }
  }, [id]);

  useEffect(() => {
    const apiRoot =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ?? 'http://127.0.0.1:5000';
    fetch(`${apiRoot}/health`)
      .then((r) => setBackendOffline(!r.ok))
      .catch(() => setBackendOffline(true));

    loadAgent();
    loadReviews();
    ai.status().then((r) => setAiProvider(r.data.provider)).catch(() => setAiProvider('unknown'));
  }, [loadAgent, loadReviews]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // ── Unlock access after Stripe Payment Link (demo) ───────────────────────
  useEffect(() => {
    if (!user || pendingPaymentHandled.current) return;

    const pending = getPendingStripePayment();
    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');

    const completeStripeLink = (paymentId: string) => {
      pendingPaymentHandled.current = true;
      setPaymentNotice('Confirming your payment...');
      payments
        .stripeLinkComplete(paymentId)
        .then(() => {
          clearPendingStripePayment();
          setPaymentNotice('Payment confirmed! You can use this agent now.');
          setHasAccess(true);
          setAccessVia('purchase');
          checkAccess();
        })
        .catch(() => {
          pendingPaymentHandled.current = false;
          setPaymentNotice('Could not confirm payment. Refresh the page or try again.');
        });
    };

    if (pending?.agentId === id) {
      completeStripeLink(pending.paymentId);
      return;
    }

    if (paymentStatus === 'success' && sessionId) {
      setPaymentNotice('Verifying payment...');
      payments.stripeVerify(sessionId).then((res) => {
        if (res.data.success) {
          setPaymentNotice('Payment confirmed! You now have access to this agent.');
          setHasAccess(true);
          setAccessVia('purchase');
          checkAccess();
        } else {
          setPaymentNotice('Payment is still processing. Refresh in a moment.');
        }
      }).catch(() => {
        setPaymentNotice('Could not verify payment. Contact support if you were charged.');
      });
    } else if (paymentStatus === 'success') {
      setPaymentNotice('Payment received! If chat is locked, refresh this page.');
      checkAccess();
    } else if (paymentStatus === 'cancelled') {
      setPaymentNotice('Payment cancelled. No charge was made.');
    }
  }, [searchParams, user, id, checkAccess]);

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // ── Send chat message ────────────────────────────────────────────────────
  const handleChat = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const newMessages: { role: 'user' | 'assistant'; content: string }[] = [
      ...messages,
      { role: 'user', content: text },
    ];

    setMessages(newMessages);
    setChatInput('');
    setChatLoading(true);
    setChatError(null);

    try {
      const res = await execute.chat(id, newMessages);
      setMessages([...newMessages, { role: 'assistant', content: res.data.reply }]);
    } catch (err: unknown) {
      setChatError(formatApiError(err, 'Chat failed. Is the backend running on port 5000?'));
      setMessages(messages);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Submit review ────────────────────────────────────────────────────────
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewRating) return setReviewError('Please select a rating.');
    setReviewLoading(true);
    setReviewError(null);
    try {
      await reviewsApi.submit(id, { rating: reviewRating, comment: reviewComment });
      setReviewRating(0);
      setReviewComment('');
      await loadReviews();
      await loadAgent();
    } catch (err: any) {
      setReviewError(err?.response?.data?.error || 'Failed to submit review.');
    } finally {
      setReviewLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="relative min-h-screen bg-black text-white flex items-center justify-center">
        <PageVideoBackground src={MARKETPLACE_AGENT_VIDEO} videoOpacity={0.2} scrimOpacity={0.75} />
        <p className="relative z-10 text-white/70 font-body">Loading agent...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="relative min-h-screen bg-black text-white flex items-center justify-center">
        <PageVideoBackground src={MARKETPLACE_AGENT_VIDEO} videoOpacity={0.2} scrimOpacity={0.75} />
        <div className="relative z-10 text-center liquid-glass rounded-[1.25rem] p-10">
          <p className="font-heading italic text-3xl mb-4">Agent not found</p>
          <button
            type="button"
            onClick={() => router.push('/marketplace')}
            className="text-white/80 hover:text-white underline font-body text-sm"
          >
            Back to marketplace
          </button>
        </div>
      </div>
    );
  }

  const price = getPrice(agent);
  const isFree = price === 0;
  const isCreator = user?.id === agent.creator?.id;
  const canAccess = hasAccess || isFree || isCreator;

  return (
    <div className="relative min-h-screen bg-black text-white">
      <PageVideoBackground src={MARKETPLACE_AGENT_VIDEO} videoOpacity={0.2} scrimOpacity={0.75} />
      <MarketplaceNav />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-28 pb-16">

        {backendOffline && (
          <div className="mb-6 liquid-glass rounded-[1.25rem] border border-red-400/30 px-6 py-4 text-sm text-red-200 font-body">
            Backend is not running. Open a terminal, run{' '}
            <code className="text-red-100">cd backend &amp;&amp; npm run dev</code>, then refresh this page.
          </div>
        )}

        {paymentNotice && (
          <div className="mb-6 liquid-glass rounded-[1.25rem] border border-white/20 px-6 py-4 text-sm text-white/90 flex justify-between items-center font-body">
            <span>{paymentNotice}</span>
            <button type="button" onClick={() => setPaymentNotice(null)} className="text-white/60 hover:text-white ml-4">✕</button>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">

          {/* ── Left: Agent info ─────────────────────────────────────────── */}
          <div className="space-y-6">
            <section className="liquid-glass rounded-[1.25rem] p-8">
              <div className="mb-4 flex items-center gap-3 flex-wrap">
                <span className="liquid-glass-strong rounded-full px-4 py-1 text-sm text-white capitalize font-body">
                  {agent.category}
                </span>
                {agent.pricingModel !== 'purchase' && (
                  <span className="liquid-glass rounded-full px-4 py-1 text-sm text-white/85 capitalize font-body">
                    {agent.pricingModel.replace('_', ' ')}
                  </span>
                )}
              </div>

              <h1 className="font-heading italic text-4xl md:text-5xl tracking-[-1px] text-white">{agent.name}</h1>
              <p className="mt-4 text-lg leading-8 text-white/75 font-body font-light">{agent.description}</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="liquid-glass-strong rounded-[1rem] p-4">
                  <p className="text-sm text-white/55 font-body">Creator</p>
                  <p className="mt-1 font-medium truncate font-body text-white">
                    {agent.creator?.username ||
                      (agent.creator?.walletAddress
                        ? `${agent.creator.walletAddress.slice(0, 8)}…`
                        : 'Unknown')}
                  </p>
                </div>
                <div className="liquid-glass-strong rounded-[1rem] p-4">
                  <p className="text-sm text-white/55 font-body">Rating</p>
                  <p className="mt-1 font-medium font-body text-white">
                    ⭐ {parseFloat(String(agent.ratings || 0)).toFixed(1)} / 5
                    {reviewStats && (
                      <span className="text-white/50 text-sm ml-1">({reviewStats.totalReviews})</span>
                    )}
                  </p>
                </div>
                <div className="liquid-glass-strong rounded-[1rem] p-4">
                  <p className="text-sm text-white/55 font-body">Downloads</p>
                  <p className="mt-1 font-medium font-body text-white">{agent.downloads || 0}</p>
                </div>
              </div>

              {agent.features?.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold mb-3 font-body text-white">Features</h2>
                  <div className="flex flex-wrap gap-2">
                    {agent.features.map((f) => (
                      <span
                        key={f}
                        className="liquid-glass rounded-full px-4 py-1.5 text-sm text-white/85 font-body"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* ── Chat with Agent ───────────────────────────────────────── */}
            <section className="liquid-glass rounded-[1.25rem] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full liquid-glass-strong flex items-center justify-center text-sm font-bold font-heading italic">
                    {agent.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm font-body text-white">{agent.name}</p>
                    <p className="text-xs text-white/50 capitalize font-body">{agent.category} agent</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {aiProvider && (
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium font-body liquid-glass ${
                        aiProvider === 'fallback' ? 'text-yellow-300' : 'text-green-300'
                      }`}
                    >
                      {aiProvider === 'fallback' ? '⚠ No AI' : `✓ ${aiProvider}`}
                    </span>
                  )}
                  {messages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setMessages([]);
                        setChatError(null);
                      }}
                      className="text-xs text-white/50 hover:text-white transition px-2 py-1 rounded-lg font-body"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Messages area */}
              <div className="h-[420px] overflow-y-auto px-5 py-4 space-y-4 scroll-smooth">
                {!user ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-white/55 text-sm text-center font-body">
                      <a href="/login" className="text-white hover:underline">
                        Log in
                      </a>{' '}
                      to chat with this agent.
                    </p>
                  </div>
                ) : !canAccess ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <p className="text-4xl">🔒</p>
                      <p className="text-white/55 text-sm font-body">Purchase this agent to start chatting.</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full liquid-glass-strong flex items-center justify-center text-xl">
                      {agent.category === 'research' ? '🔬' :
                       agent.category === 'development' ? '💻' :
                       agent.category === 'content' ? '✍️' :
                       agent.category === 'finance' ? '📈' :
                       agent.category === 'social' ? '📱' : '🤖'}
                    </div>
                    <p className="font-semibold text-white font-body">{agent.name}</p>
                    <p className="text-white/55 text-sm text-center max-w-xs font-body font-light">
                      {agent.category === 'research' ? 'Ask me to research any topic, summarize papers, or find information.' :
                       agent.category === 'development' ? 'Ask me to write code, debug issues, or explain technical concepts.' :
                       agent.category === 'content' ? 'Ask me to write copy, brainstorm ideas, or edit your content.' :
                       agent.category === 'finance' ? 'Ask me about markets, budgeting, investing, or financial analysis.' :
                       agent.category === 'social' ? 'Ask me for post ideas, captions, hashtags, or growth strategies.' :
                       'How can I help you today?'}
                    </p>
                    {aiProvider === 'fallback' && (
                      <p className="text-xs text-yellow-400 text-center max-w-xs">
                        ⚠ No AI provider configured. Add GROQ_API_KEY to backend .env for real responses.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                          <div className="w-7 h-7 rounded-full liquid-glass-strong flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 font-heading italic">
                            {agent.name[0]}
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed font-body ${
                            msg.role === 'user'
                              ? 'liquid-glass-strong text-white rounded-br-sm'
                              : 'liquid-glass text-white/95 rounded-bl-sm'
                          }`}
                        >
                          <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-7 h-7 rounded-full liquid-glass flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            U
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Typing indicator */}
                    {chatLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-7 h-7 rounded-full liquid-glass-strong flex items-center justify-center text-xs font-bold shrink-0 font-heading italic">
                          {agent.name[0]}
                        </div>
                        <div className="liquid-glass rounded-2xl rounded-bl-sm px-4 py-3">
                          <div className="flex gap-1 items-center h-4">
                            <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}

                    {chatError && (
                      <div className="liquid-glass rounded-xl border border-red-400/30 px-4 py-3 text-sm text-red-200 font-body">
                        {chatError}
                      </div>
                    )}

                    <div ref={chatBottomRef} />
                  </>
                )}
              </div>

              {/* Input bar */}
              {user && canAccess && (
                <form
                  onSubmit={handleChat}
                  className="border-t border-white/10 px-4 py-3 flex gap-3 items-end"
                >
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleChat();
                      }
                    }}
                    rows={1}
                    placeholder={`Message ${agent.name}...`}
                    disabled={chatLoading}
                    className="flex-1 liquid-glass rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition resize-none disabled:opacity-60 font-body"
                    style={{ minHeight: '42px', maxHeight: '120px' }}
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="shrink-0 w-10 h-10 rounded-xl liquid-glass-strong flex items-center justify-center text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    {chatLoading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    )}
                  </button>
                </form>
              )}
            </section>

            {/* ── Reviews ───────────────────────────────────────────────── */}
            <section className="liquid-glass rounded-[1.25rem] p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold font-body text-white">Reviews</h2>
                {reviewStats && (
                  <div className="flex items-center gap-2">
                    <StarRating value={Math.round(reviewStats.averageRating)} />
                    <span className="text-white/55 text-sm font-body">
                      {reviewStats.averageRating.toFixed(1)} ({reviewStats.totalReviews})
                    </span>
                  </div>
                )}
              </div>

              {user && canAccess && (
                <form onSubmit={handleReviewSubmit} className="mb-8 liquid-glass-strong rounded-xl p-5 space-y-4">
                  <p className="text-sm font-semibold text-white/90 font-body">Leave a review</p>
                  <StarRating value={reviewRating} onChange={setReviewRating} />
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    placeholder="Share your experience (optional)..."
                    className="w-full liquid-glass rounded-xl px-4 py-3 text-white placeholder:text-white/40 outline-none transition resize-none text-sm font-body"
                  />
                  {reviewError && <p className="text-red-300 text-sm font-body">{reviewError}</p>}
                  <button
                    type="submit"
                    disabled={reviewLoading || !reviewRating}
                    className="rounded-full liquid-glass-strong px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed transition font-body"
                  >
                    {reviewLoading ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}

              {reviewList.length === 0 ? (
                <p className="text-white/55 text-sm font-body">No reviews yet. Be the first!</p>
              ) : (
                <div className="space-y-4">
                  {reviewList.map((review) => (
                    <div key={review.id} className="liquid-glass-strong rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <StarRating value={review.rating} />
                          <span className="text-sm font-medium font-body text-white">
                            {review.user?.username ||
                              (review.user?.walletAddress
                                ? `${review.user.walletAddress.slice(0, 8)}…`
                                : 'Anonymous')}
                          </span>
                        </div>
                        <span className="text-xs text-white/45 font-body">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-white/75 mt-1 font-body">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* ── Right: Purchase sidebar ──────────────────────────────────── */}
          <aside className="space-y-5">
            <div className="liquid-glass rounded-[1.25rem] p-6 sticky top-24">
              <p className="text-sm uppercase tracking-[0.3em] text-white/50 font-body">Pricing</p>
              <p className="mt-3 font-heading italic text-4xl text-white">{getPriceDisplay(agent)}</p>
              <p className="mt-2 text-white/60 text-sm capitalize font-body">
                {agent.pricingModel.replace('_', ' ')} access
              </p>

              {canAccess ? (
                <div className="mt-6 liquid-glass-strong rounded-xl p-4 text-sm text-green-300 font-body border border-green-400/20">
                  ✓ You have access to this agent.
                  {accessVia && <span className="block text-xs text-green-400/90 mt-1">via {accessVia}</span>}
                </div>
              ) : !user ? (
                <a
                  href="/login"
                  className="mt-6 block w-full text-center rounded-full liquid-glass-strong px-5 py-3 font-semibold text-white transition hover:opacity-90 font-body"
                >
                  Log in to Purchase
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setBuyRentModalOpen(true)}
                  className="mt-6 w-full rounded-full liquid-glass-strong px-5 py-3 font-semibold text-white transition hover:opacity-90 font-body"
                >
                  Pay with Stripe
                </button>
              )}
            </div>

            {/* Buy/Rent Modal */}
            <BuyRentModal
              agent={agent}
              isOpen={buyRentModalOpen}
              onClose={() => setBuyRentModalOpen(false)}
              onSuccess={() => {
                checkAccess();
                loadAgent();
              }}
            />

            {/* What happens next */}
            {/* <div className="liquid-glass rounded-[1.25rem] p-6">
              <ul className="space-y-3 text-sm text-white/75 font-body font-light">
                <li className="flex gap-2">
                  <span className="text-white/90">1.</span> Click Pay with Stripe above.
                </li>
                <li className="flex gap-2">
                  <span className="text-white/90">2.</span> Complete checkout on Stripe (test mode).
                </li>
                <li className="flex gap-2">
                  <span className="text-white/90">3.</span> Return to this agent page — access unlocks automatically.
                </li>
                <li className="flex gap-2">
                  <span className="text-white/90">4.</span> Chat with the agent and leave a review.
                </li>
              </ul>
            </div> */}
          </aside>
        </div>
      </div>
    </div>
  );
}
