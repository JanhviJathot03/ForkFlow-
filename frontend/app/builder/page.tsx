'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { agents, ai } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { PageVideoBackground } from '@/components/layout/PageVideoBackground';
import { MarketplaceNav } from '@/components/layout/MarketplaceNav';
import { BUILDER_VIDEO } from '@/lib/videos';
import { GlassCard } from '@/components/ui/GlassCard';

const inputClass =
  'w-full liquid-glass rounded-xl px-4 py-2.5 text-white placeholder:text-white/40 outline-none font-body text-sm';

export default function BuilderPage() {
  const { user } = useAuthStore();
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please login first');
      return;
    }

    setLoading(true);

    try {
      await agents.create({
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

  return (
    <div className="relative min-h-screen bg-black text-white">
      <PageVideoBackground src={BUILDER_VIDEO} videoOpacity={0.2} scrimOpacity={0.75} />
      <MarketplaceNav />

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-28 pb-16">
        <h1 className="font-heading italic text-white text-5xl md:text-6xl tracking-[-2px] mb-4">
          Build your agent
        </h1>
        <p className="text-white/70 font-body font-light mb-10 max-w-2xl">
          Define your agent, generate ideas with AI, and publish to the marketplace.
        </p>

        <div className="grid gap-6  lg:grid-cols-[0.9fr_1.1fr]">
          <GlassCard
            unified
            bodyClassName="p-6"
            header={
              <div className="mb-6">
                <h2 className="text-xl font-semibold font-body text-white">AI assistant</h2>
                <p className="text-sm text-white/70 mt-1 font-body font-light">
                  Generate starter ideas and prompt templates using AI.
                </p>
              </div>
            }
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 font-body text-white/90">
                  Domain
                </label>
                <input
                  type="text"
                  value={ideaDomain}
                  onChange={(e) => setIdeaDomain(e.target.value)}
                  className={inputClass}
                  placeholder="research, finance, content, support"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 font-body text-white/90">
                  Goal
                </label>
                <textarea
                  value={ideaGoal}
                  onChange={(e) => setIdeaGoal(e.target.value)}
                  rows={4}
                  className={`${inputClass} resize-none`}
                  placeholder="What should this agent help users do?"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateIdeas}
                disabled={ideaLoading}
                className="w-full rounded-full liquid-glass-strong px-4 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 font-body"
              >
                {ideaLoading ? 'Generating ideas...' : 'Generate agent ideas'}
              </button>
            </div>

            {aiIdeas ? (
              <div className="mt-6 rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/55 mb-3 font-body">
                  Ideas
                </h3>
                <pre className="whitespace-pre-wrap text-sm text-white/80 leading-6 font-body">
                  {aiIdeas}
                </pre>
              </div>
            ) : null}
          </GlassCard>

          <GlassCard
            unified
            bodyClassName="p-6"
            header={
              <div className="mb-6">
                <h2 className="text-xl font-semibold font-body text-white">Create agent</h2>
                <p className="text-sm text-white/70 mt-1 font-body font-light">
                  Configure your agent and publish to the marketplace.
                </p>
              </div>
            }
          >
            {mounted && !user && (
              <div className="liquid-glass-strong rounded-xl p-4 mb-8 border border-white/10">
                <p className="text-white/90 mb-3 font-body text-sm">
                  You need to be logged in to create an agent.
                </p>
                <Link
                  href="/login"
                  className="block w-full text-center rounded-full liquid-glass-strong px-4 py-2.5 text-white font-semibold transition font-body text-sm"
                >
                  Go to login
                </Link>
              </div>
            )}

            {success && (
              <div className="liquid-glass-strong rounded-xl p-4 mb-8 border border-green-400/20">
                <p className="text-green-300 font-body text-sm">
                  Agent created successfully. Check your dashboard.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 font-body text-white/90">
                  Agent name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., AI Research Agent"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 font-body text-white/90">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what your agent does"
                  rows={4}
                  className={`${inputClass} resize-none`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 font-body text-white/90">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={inputClass}
                >
                  <option value="research">research</option>
                  <option value="development">development</option>
                  <option value="content">content</option>
                  <option value="finance">finance</option>
                  <option value="social">social</option>
                </select>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label className="block text-sm font-semibold font-body text-white/90">
                    Prompt template
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePrompt}
                    disabled={promptLoading}
                    className="rounded-full liquid-glass px-3 py-1.5 text-sm font-semibold text-white/90 transition disabled:cursor-not-allowed disabled:opacity-60 font-body"
                  >
                    {promptLoading ? 'Generating...' : 'Generate with AI'}
                  </button>
                </div>
                <textarea
                  value={formData.promptTemplate}
                  onChange={(e) => setFormData({ ...formData, promptTemplate: e.target.value })}
                  placeholder="Define the system prompt for your agent"
                  rows={6}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 font-body text-white/90">
                  Features (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="e.g., Real-time data, PDF reports, Email alerts"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 font-body text-white/90">
                    Pricing model
                  </label>
                  <select
                    value={formData.pricingModel}
                    onChange={(e) => setFormData({ ...formData, pricingModel: e.target.value })}
                    className={inputClass}
                  >
                    <option value="subscription">subscription</option>
                    <option value="pay_per_use">pay_per_use</option>
                    <option value="purchase">purchase</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 font-body text-white/90">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="9.99"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || (mounted && !user)}
                className="w-full rounded-full liquid-glass-strong text-white font-semibold py-3 transition disabled:opacity-60 disabled:cursor-not-allowed font-body"
              >
                {loading ? 'Creating...' : 'Create agent'}
              </button>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
