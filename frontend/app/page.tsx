'use client';

import { useState } from 'react';
import { ai } from '@/lib/api';

export default function Home() {
  const [sampleText, setSampleText] = useState('Summarize a short paragraph here to test the local AI flow.');
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const handleSummarize = async () => {
    setSummaryLoading(true);
    setSummaryError('');

    try {
      const response = await ai.summarize(sampleText);
      setSummary(response.data.summary || '');
    } catch (error) {
      console.error('Failed to summarize text', error);
      setSummaryError('Local AI is not responding. Check Ollama or the backend.');
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950">
      <main className="max-w-7xl mx-auto px-4 py-20">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Locus Agents
          </h1>
          <p className="text-2xl text-slate-300 mb-8 max-w-2xl mx-auto">
            The Decentralized Marketplace for AI Agents
          </p>
          <p className="text-lg text-slate-400 mb-10 max-w-3xl mx-auto">
            Create, monetize, and deploy AI agents on Ethereum. Own your agents, earn from them, and collaborate through the open creator economy.
          </p>
          
          <div className="flex gap-4 justify-center">
            <a href="/marketplace" className="px-8 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition">
              Explore Marketplace
            </a>
            <a href="/builder" className="px-8 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg font-semibold transition">
              Build Agent
            </a>
          </div>
        </section>

        {/* Local AI Demo */}
        <section className="mb-20 rounded-2xl border border-slate-700 bg-slate-900/70 p-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="text-3xl font-bold text-cyan-300">Try the local AI flow</h2>
              <p className="mt-3 text-slate-300">
                This uses the free dev AI endpoint backed by Ollama or a local fallback.
              </p>

              <div className="mt-6 space-y-4">
                <textarea
                  value={sampleText}
                  onChange={(e) => setSampleText(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-400 outline-none transition"
                  placeholder="Paste a paragraph to summarize"
                />
                <button
                  type="button"
                  onClick={handleSummarize}
                  disabled={summaryLoading}
                  className="rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {summaryLoading ? 'Summarizing...' : 'Summarize with Local AI'}
                </button>
                {summaryError ? (
                  <p className="text-sm text-red-300">{summaryError}</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Summary</p>
              <div className="mt-4 whitespace-pre-wrap text-sm text-slate-200">
                {summary || 'Run the summary to see local AI output here.'}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-slate-800/50 backdrop-blur p-8 rounded-lg border border-slate-700">
            <h3 className="text-xl font-bold mb-3 text-blue-400">🛠️ Easy Builder</h3>
            <p className="text-slate-300">
              Create AI agents without coding. Choose templates, configure prompts, and deploy instantly.
            </p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur p-8 rounded-lg border border-slate-700">
            <h3 className="text-xl font-bold mb-3 text-purple-400">💰 Monetize</h3>
            <p className="text-slate-300">
              Earn from your agents through subscriptions, pay-per-use, or one-time purchases. Instant payments via Locus.
            </p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur p-8 rounded-lg border border-slate-700">
            <h3 className="text-xl font-bold mb-3 text-pink-400">🔗 Own & Fork</h3>
            <p className="text-slate-300">
              Fork agents, improve them, and earn royalties. Build on top of existing agents collaboratively.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-4xl font-bold text-blue-400">1K+</p>
            <p className="text-slate-400">AI Agents</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-purple-400">50K+</p>
            <p className="text-slate-400">Users</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-pink-400">$2M+</p>
            <p className="text-slate-400">Transacted</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-cyan-400">100K+</p>
            <p className="text-slate-400">Executions</p>
          </div>
        </section>
      </main>
    </div>
  );
}
