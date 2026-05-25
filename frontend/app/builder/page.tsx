'use client';

import { useState, useEffect } from 'react';
import { agents, ai, auth } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function BuilderPage() {
  const { user, login } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'research',
    promptTemplate: '',
    features: '',
    pricingModel: 'subscription',
    price: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
  const [aiIdeas, setAiIdeas] = useState('');
  const [ideaDomain, setIdeaDomain] = useState('research');
  const [ideaGoal, setIdeaGoal] = useState('Build a useful agent for my audience');
  const [devLoginLoading, setDevLoginLoading] = useState(false);

  // Avoid hydration mismatch — don't render auth-dependent UI until mounted
  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please login first');
      return;
    }

    setLoading(true);

    try {
      const response = await agents.create({
        ...formData,
        features: formData.features.split(',').map((f) => f.trim()),
        price: parseFloat(formData.price),
      });

      setSuccess(true);
      setFormData({
        name: '',
        description: '',
        category: 'research',
        promptTemplate: '',
        features: '',
        pricingModel: 'subscription',
        price: '',
      });

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error creating agent:', error);
      alert('Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateIdeas = async () => {
    setIdeaLoading(true);

    try {
      const response = await ai.generateIdeas({
        domain: ideaDomain,
        goal: ideaGoal,
        pricingModel: formData.pricingModel,
      });

      setAiIdeas(response.data.ideas || '');
    } catch (error) {
      console.error('Failed to generate ideas:', error);
      alert('Could not generate ideas right now');
    } finally {
      setIdeaLoading(false);
    }
  };

  const handleGeneratePrompt = async () => {
    if (!formData.name || !formData.description) {
      alert('Add a name and description first');
      return;
    }

    setPromptLoading(true);

    try {
      const response = await ai.generatePromptTemplate({
        name: formData.name,
        description: formData.description,
        features: formData.features
          .split(',')
          .map((feature) => feature.trim())
          .filter(Boolean),
      });

      setFormData((current) => ({
        ...current,
        promptTemplate: response.data.promptTemplate || current.promptTemplate,
      }));
    } catch (error) {
      console.error('Failed to generate prompt template:', error);
      alert('Could not generate prompt template right now');
    } finally {
      setPromptLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setDevLoginLoading(true);

    try {
      const response = await auth.register({
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        message: 'dev-login',
        signature: 'dev-login',
      });

      const userPayload = response.data.user ?? {
        id: 'dev-user',
        walletAddress: response.data.walletAddress,
      };

      login(userPayload, response.data.token);
    } catch (error) {
      console.error('Dev login failed', error);
      alert('Dev login failed. Check backend auth settings.');
    } finally {
      setDevLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-5xl font-bold mb-12 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Build Your AI Agent
        </h1>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] mb-10">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold mb-4">AI Assistant</h2>
            <p className="text-sm text-slate-400 mb-6">
              Generate starter ideas and prompt templates using AI.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Domain</label>
                <input
                  type="text"
                  value={ideaDomain}
                  onChange={(e) => setIdeaDomain(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 outline-none transition"
                  placeholder="research, finance, content, support"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Goal</label>
                <textarea
                  value={ideaGoal}
                  onChange={(e) => setIdeaGoal(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 outline-none transition"
                  placeholder="What should this agent help users do?"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateIdeas}
                disabled={ideaLoading}
                className="w-full rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {ideaLoading ? 'Generating ideas...' : 'Generate Agent Ideas'}
              </button>
            </div>

            {aiIdeas ? (
              <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400 mb-3">Ideas</h3>
                <pre className="whitespace-pre-wrap text-sm text-slate-300 leading-6">{aiIdeas}</pre>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            {mounted && !user && (
              <div className="bg-yellow-900/20 border border-yellow-700 p-4 rounded-lg mb-8">
                <p className="text-yellow-300">
                  Please login with your wallet to create an agent
                </p>
                <button
                  type="button"
                  onClick={handleDevLogin}
                  disabled={devLoginLoading}
                  className="mt-4 w-full rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {devLoginLoading ? 'Signing in...' : 'Dev Login (No Wallet)'}
                </button>
              </div>
            )}

            {success && (
              <div className="bg-green-900/20 border border-green-700 p-4 rounded-lg mb-8">
                <p className="text-green-300">
                  ✓ Agent created successfully! Check your dashboard.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="rounded-lg border border-slate-700 bg-slate-800 p-8">
              {/* Agent Name */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Agent Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., AI Research Agent"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 outline-none transition"
                  required
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what your agent does"
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 outline-none transition"
                  required
                />
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:border-blue-500 outline-none transition"
                >
                  <option>research</option>
                  <option>development</option>
                  <option>content</option>
                  <option>finance</option>
                  <option>social</option>
                </select>
              </div>

              {/* Prompt Template */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label className="block text-sm font-semibold">Prompt Template</label>
                  <button
                    type="button"
                    onClick={handleGeneratePrompt}
                    disabled={promptLoading}
                    className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {promptLoading ? 'Generating...' : 'Generate with AI'}
                  </button>
                </div>
                <textarea
                  value={formData.promptTemplate}
                  onChange={(e) => setFormData({ ...formData, promptTemplate: e.target.value })}
                  placeholder="Define the system prompt for your agent"
                  rows={6}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              {/* Features */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Features (comma-separated)</label>
                <input
                  type="text"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="e.g., Real-time data, PDF reports, Email alerts"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Pricing Model</label>
                  <select
                    value={formData.pricingModel}
                    onChange={(e) => setFormData({ ...formData, pricingModel: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:border-blue-500 outline-none transition"
                  >
                    <option>subscription</option>
                    <option>pay_per_use</option>
                    <option>purchase</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Price (ETH)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.05"
                    className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || (mounted && !user)}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white font-semibold py-3 rounded-lg transition"
              >
                {loading ? 'Creating...' : 'Create Agent'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
