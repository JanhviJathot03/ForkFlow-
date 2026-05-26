'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { marketplace } from '@/lib/api';
import { PageVideoBackground } from '@/components/layout/PageVideoBackground';
import { MarketplaceNav } from '@/components/layout/MarketplaceNav';
import { MARKETPLACE_LIST_VIDEO } from '@/lib/videos';

const CATEGORIES = ['All', 'Research', 'Development', 'Content', 'Finance', 'Social'];

function getPriceDisplay(agent: any): string {
  if (agent.pricingModel === 'subscription') {
    const p = parseFloat(agent.monthlyCost || 0);
    return p > 0 ? `$${p}/mo` : 'Free';
  }
  if (agent.pricingModel === 'pay_per_use') {
    const p = parseFloat(agent.payPerUsePrice || 0);
    return p > 0 ? `$${p}/use` : 'Free';
  }
  const p = parseFloat(agent.purchasePrice || 0);
  return p > 0 ? `$${p}` : 'Free';
}

export default function MarketplacePage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);
      try {
        let response;
        if (search) {
          response = await marketplace.search(search, category ? { category } : {});
          setAgents(response.data.results || []);
        } else {
          response = await marketplace.getAgents(1, 12, category ?? undefined);
          setAgents(response.data.agents || []);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [category, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  return (
    <div className="relative min-h-screen bg-black text-white">
      <PageVideoBackground src={MARKETPLACE_LIST_VIDEO} videoOpacity={0.5} scrimOpacity={0.75} />
      <MarketplaceNav />

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-28 pb-16">
       <h1 className="font-heading italic text-white text-5xl md:text-6xl tracking-[-2px] mb-4">
          Discover agents
        </h1>
        <p className="text-white/70 font-body font-light mb-10 max-w-2xl">
          Browse, purchase, and run AI agents built by creators on ForkFlow.
        </p>

        <form onSubmit={handleSearch} className="mb-8 flex flex-wrap gap-3">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search agents..."
            className="flex-1 min-w-[200px] liquid-glass rounded-full px-5 py-3 text-white placeholder:text-white/45 outline-none font-body"
          />
          <button
            type="submit"
            className="liquid-glass-strong rounded-full px-6 py-3 font-semibold text-white font-body"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSearchInput('');
              }}
              className="liquid-glass rounded-full px-5 py-3 text-white/90 font-body"
            >
              Clear
            </button>
          )}
        </form>

        <div className="mb-10 flex gap-3 flex-wrap">
          {CATEGORIES.map((cat) => {
            const active = category === cat.toLowerCase() || (cat === 'All' && !category);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat === 'All' ? null : cat.toLowerCase())}
                className={`px-4 py-2 rounded-full font-medium font-body transition ${
                  active ? 'liquid-glass-strong text-white' : 'liquid-glass text-white/75 hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card h-64 animate-pulse flex flex-col">
                <div className="glass-card-header h-28 shrink-0" />
                <div className="glass-card-body flex-1" />
              </div>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="liquid-glass rounded-[1.25rem] p-12 text-center">
            <p className="text-white/70 font-body text-lg">No agents found.</p>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                }}
                className="mt-4 text-white underline font-body text-sm"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Link
                key={agent.id}
                href={`/marketplace/${agent.id}`}
                className="glass-card flex flex-col hover:opacity-95 transition group"
              >
                <div className="glass-card-header h-28 flex items-center justify-center shrink-0">
                  <span className="font-heading  text-5xl text-white/90">
                  🤖
                  </span>
                </div>
                <div className="glass-card-body p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-body font-semibold leading-tight text-white">{agent.name}</h3>
                    <span className="shrink-0 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] text-white/90 capitalize font-body backdrop-blur-sm">
                      {agent.category}
                    </span>
                  </div>
                  <p className="text-white/65 text-sm mb-4 flex-1 line-clamp-2 font-body font-light">
                    {agent.description}
                  </p>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="font-heading italic text-xl text-white">{getPriceDisplay(agent)}</span>
                    <div className="flex items-center gap-3 text-xs text-white/60 font-body">
                      <span>⭐ {parseFloat(agent.ratings || 0).toFixed(1)}</span>
                      <span>↓ {agent.downloads || 0}</span>
                    </div>
                  </div>
                  {agent.creator?.username && (
                    <p className="mt-2 text-xs text-white/45 font-body">by {agent.creator.username}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
