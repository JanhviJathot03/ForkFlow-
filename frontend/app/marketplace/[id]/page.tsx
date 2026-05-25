'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { agents as agentsApi, payments, execute, reviews as reviewsApi, ai } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { BuyRentModal } from '@/components/payments/BuyRentModal';

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
            star <= (hover || value) ? 'text-yellow-400' : 'text-slate-600'
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
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

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
    loadAgent();
    loadReviews();
    // Check AI provider status
    ai.status().then((r) => setAiProvider(r.data.provider)).catch(() => setAiProvider('unknown'));
  }, [loadAgent, loadReviews]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // ── Handle Stripe return ─────────────────────────────────────────────────
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      setPaymentNotice('Verifying payment...');
      payments.stripeVerify(sessionId).then((res) => {
        if (res.data.success) {
          setPaymentNotice('Payment confirmed! You now have access to this agent.');
          setHasAccess(true);
          setAccessVia('purchase');
        } else {
          setPaymentNotice('Payment is still processing. Refresh in a moment.');
        }
      }).catch(() => {
        setPaymentNotice('Could not verify payment. Contact support if you were charged.');
      });
    } else if (paymentStatus === 'cancelled') {
      setPaymentNotice('Payment cancelled. No charge was made.');
    }
  }, [searchParams]);

  // ── Payment handlers ─────────────────────────────────────────────────────
  const handleStripeCheckout = async () => {
    if (!user) return alert('Please log in first.');
    if (!agent) return;
    setPaymentLoading(true);
    try {
      const res = await payments.stripeCreateSession({
        agentId: agent.id,
        paymentType: agent.pricingModel,
      });
      window.location.href = res.data.checkoutUrl;
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to start checkout. Is Stripe configured?');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleManualPayment = async () => {
    if (!user) return alert('Please log in first.');
    if (!agent) return;
    setPaymentLoading(true);
    try {
      const res = await payments.manualInitiate({
        agentId: agent.id,
        amount: getPrice(agent),
        paymentType: agent.pricingModel,
      });
      // Redirect to the dedicated checkout page
      router.push(`/checkout/${res.data.paymentId}`);
    } catch {
      alert('Failed to initiate payment.');
    } finally {
      setPaymentLoading(false);
    }
  };

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
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Something went wrong.';
      setChatError(msg);
      // Remove the user message we optimistically added if it failed
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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">Loading agent...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">Agent not found</p>
          <button onClick={() => router.push('/marketplace')} className="text-blue-400 hover:underline">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-14">

        {/* Payment notice banner */}
        {paymentNotice && (
          <div className="mb-6 rounded-2xl border border-blue-500/40 bg-blue-500/10 px-6 py-4 text-sm text-blue-100 flex justify-between items-center">
            <span>{paymentNotice}</span>
            <button onClick={() => setPaymentNotice(null)} className="text-blue-300 hover:text-white ml-4">✕</button>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">

          {/* ── Left: Agent info ─────────────────────────────────────────── */}
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/40">
              <div className="mb-4 flex items-center gap-3">
                <span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300 capitalize">
                  {agent.category}
                </span>
                {agent.pricingModel !== 'purchase' && (
                  <span className="inline-flex rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1 text-sm text-purple-300 capitalize">
                    {agent.pricingModel.replace('_', ' ')}
                  </span>
                )}
              </div>

              <h1 className="text-4xl font-bold">{agent.name}</h1>
              <p className="mt-4 text-lg leading-8 text-slate-300">{agent.description}</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <p className="text-sm text-slate-400">Creator</p>
                  <p className="mt-1 font-medium truncate">
                    {agent.creator?.username || agent.creator?.walletAddress?.slice(0, 10) + '...' || 'Unknown'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <p className="text-sm text-slate-400">Rating</p>
                  <p className="mt-1 font-medium">
                    ⭐ {parseFloat(String(agent.ratings || 0)).toFixed(1)} / 5
                    {reviewStats && <span className="text-slate-500 text-sm ml-1">({reviewStats.totalReviews})</span>}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <p className="text-sm text-slate-400">Downloads</p>
                  <p className="mt-1 font-medium">{agent.downloads || 0}</p>
                </div>
              </div>

              {agent.features?.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold mb-3">Features</h2>
                  <div className="flex flex-wrap gap-2">
                    {agent.features.map((f) => (
                      <span key={f} className="rounded-full border border-slate-700 bg-slate-950/60 px-4 py-1.5 text-sm text-slate-300">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* ── Chat with Agent ───────────────────────────────────────── */}
            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/70 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                    {agent.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{agent.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{agent.category} agent</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {aiProvider && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                      aiProvider === 'groq'   ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                      aiProvider === 'openai' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                      aiProvider === 'ollama' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                               'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                    }`}>
                      {aiProvider === 'fallback' ? '⚠ No AI' : `✓ ${aiProvider}`}
                    </span>
                  )}
                  {messages.length > 0 && (
                    <button
                      onClick={() => { setMessages([]); setChatError(null); }}
                      className="text-xs text-slate-500 hover:text-slate-300 transition px-2 py-1 rounded-lg hover:bg-slate-800"
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
                    <p className="text-slate-500 text-sm text-center">
                      <a href="/login" className="text-blue-400 hover:underline">Log in</a> to chat with this agent.
                    </p>
                  </div>
                ) : !canAccess ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <p className="text-4xl">🔒</p>
                      <p className="text-slate-400 text-sm">Purchase this agent to start chatting.</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl">
                      {agent.category === 'research' ? '🔬' :
                       agent.category === 'development' ? '💻' :
                       agent.category === 'content' ? '✍️' :
                       agent.category === 'finance' ? '📈' :
                       agent.category === 'social' ? '📱' : '🤖'}
                    </div>
                    <p className="font-semibold text-slate-200">{agent.name}</p>
                    <p className="text-slate-500 text-sm text-center max-w-xs">
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
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {agent.name[0]}
                          </div>
                        )}
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-blue-500 text-white rounded-br-sm'
                            : 'bg-slate-800 text-slate-100 rounded-bl-sm'
                        }`}>
                          <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            U
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Typing indicator */}
                    {chatLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold shrink-0">
                          {agent.name[0]}
                        </div>
                        <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3">
                          <div className="flex gap-1 items-center h-4">
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}

                    {chatError && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
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
                  className="border-t border-slate-800 px-4 py-3 flex gap-3 items-end"
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
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 outline-none transition resize-none disabled:opacity-60"
                    style={{ minHeight: '42px', maxHeight: '120px' }}
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
            <section className="rounded-[2rem] border border-slate-800 bg-slate-900/70 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Reviews</h2>
                {reviewStats && (
                  <div className="flex items-center gap-2">
                    <StarRating value={Math.round(reviewStats.averageRating)} />
                    <span className="text-slate-400 text-sm">
                      {reviewStats.averageRating.toFixed(1)} ({reviewStats.totalReviews})
                    </span>
                  </div>
                )}
              </div>

              {/* Submit review form */}
              {user && canAccess && (
                <form onSubmit={handleReviewSubmit} className="mb-8 rounded-xl border border-slate-700 bg-slate-950/50 p-5 space-y-4">
                  <p className="text-sm font-semibold text-slate-300">Leave a review</p>
                  <StarRating value={reviewRating} onChange={setReviewRating} />
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    placeholder="Share your experience (optional)..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 outline-none transition resize-none text-sm"
                  />
                  {reviewError && <p className="text-red-400 text-sm">{reviewError}</p>}
                  <button
                    type="submit"
                    disabled={reviewLoading || !reviewRating}
                    className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
                  >
                    {reviewLoading ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}

              {/* Review list */}
              {reviewList.length === 0 ? (
                <p className="text-slate-500 text-sm">No reviews yet. Be the first!</p>
              ) : (
                <div className="space-y-4">
                  {reviewList.map((review) => (
                    <div key={review.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <StarRating value={review.rating} />
                          <span className="text-sm font-medium">
                            {review.user?.username || review.user?.walletAddress?.slice(0, 10) + '...' || 'Anonymous'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-slate-300 mt-1">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* ── Right: Purchase sidebar ──────────────────────────────────── */}
          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 sticky top-6">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Pricing</p>
              <p className="mt-3 text-4xl font-bold text-blue-400">{getPriceDisplay(agent)}</p>
              <p className="mt-2 text-slate-400 text-sm capitalize">
                {agent.pricingModel.replace('_', ' ')} access
              </p>

              {canAccess ? (
                <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
                  ✓ You have access to this agent.
                  {accessVia && <span className="block text-xs text-green-400 mt-1">via {accessVia}</span>}
                </div>
              ) : !user ? (
                <a
                  href="/login"
                  className="mt-6 block w-full text-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-3 font-semibold text-white transition hover:opacity-90"
                >
                  Log in to Purchase
                </a>
              ) : (
                <d<button
                    onClick={() => setBuyRentModalOpen(true)}
                    disabled={paymentLoading}
                    className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {paymentLoading ? 'Loading...' : '🛒 Buy or Rent Agent'}
                  </button>
                </div>
              )}
            </div>

            {/* Buy/Rent Modal */}
            {agent && (
              <BuyRentModal
                agent={agent}
                isOpen={buyRentModalOpen}
                onClose={() => setBuyRentModalOpen(false)}
                onSuccess={() => {
                  checkAccess();
                  loadAgent();
                }}
              />
              </div>
              )}
            </div>

            {/* What happens next */}
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="text-lg font-semibold mb-4">What happens next</h2>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex gap-2"><span className="text-blue-400">1.</span> Click a payment button above.</li>
                <li className="flex gap-2"><span className="text-blue-400">2.</span> Follow the payment instructions on the next page.</li>
                <li className="flex gap-2"><span className="text-blue-400">3.</span> Click "I've Paid" — access unlocks after creator confirms.</li>
                <li className="flex gap-2"><span className="text-blue-400">4.</span> Come back here to run the agent and leave a review.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
