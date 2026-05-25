'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { marketplace } from '@/lib/api';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Agent Marketplace
        </h1>
        <p className="text-slate-400 mb-10">Discover and purchase AI agents built by the community.</p>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8 flex gap-3">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search agents..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 outline-none transition"
          />
          <button
            type="submit"
            className="rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white hover:bg-blue-600 transition"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); }}
              className="rounded-xl border border-slate-600 px-4 py-3 text-slate-300 hover:bg-slate-800 transition"
            >
              Clear
            </button>
          )}
        </form>

        {/* Category filters */}
        <div className="mb-10 flex gap-3 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat === 'All' ? null : cat.toLowerCase())}
              className={`px-4 py-2 rounded-lg transition font-medium ${
                (category === cat.toLowerCase() || (cat === 'All' && !category))
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-slate-800 rounded-2xl h-64 animate-pulse border border-slate-700" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">No agents found.</p>
            {search && (
              <button
                onClick={() => { setSearch(''); setSearchInput(''); }}
                className="mt-4 text-blue-400 hover:underline"
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
                className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-blue-500 transition group flex flex-col"
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-36 group-hover:opacity-80 transition flex items-center justify-center">
                  <span className="text-4xl">🤖</span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold leading-tight">{agent.name}</h3>
                    <span className="shrink-0 rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300 capitalize">
                      {agent.category}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mb-4 flex-1 line-clamp-2">{agent.description}</p>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="text-blue-400 font-semibold">{getPriceDisplay(agent)}</span>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span>⭐ {parseFloat(agent.ratings || 0).toFixed(1)}</span>
                      <span>↓ {agent.downloads || 0}</span>
                    </div>
                  </div>
                  {agent.creator?.username && (
                    <p className="mt-2 text-xs text-slate-500">
                      by {agent.creator.username}
                    </p>
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
