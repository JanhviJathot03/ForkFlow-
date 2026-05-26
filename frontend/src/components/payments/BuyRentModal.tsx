'use client';

import { useState } from 'react';
import { payments } from '@/lib/api';
import { savePendingStripePayment } from '@/lib/stripePayment';
import {
  canBuyAgent,
  canRentAgent,
  getBuyLabel,
  getBuyPriceLabel,
  resolveAgentPayment,
} from '@/lib/agentPricing';

interface BuyRentModalProps {
  agent: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const RENT_DURATIONS = [
  { label: '1 Month', days: 30 },
  { label: '3 Months', days: 90 },
  { label: '6 Months', days: 180 },
];

export function BuyRentModal({ agent, isOpen, onClose }: BuyRentModalProps) {
  const buyAvailable = canBuyAgent(agent);
  const rentAvailable = canRentAgent(agent);

  const [mode, setMode] = useState<'buy' | 'rent'>(buyAvailable ? 'buy' : 'rent');
  const [rentalDuration, setRentalDuration] = useState(30);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const resolved = resolveAgentPayment(agent, mode, rentalDuration);

  const getPriceDisplay = () => {
    if (resolved.amount <= 0) return 'Free';
    return `$${resolved.amount.toFixed(2)}`;
  };

  const handleStripeCheckout = async () => {
    if (resolved.amount <= 0) {
      alert('This agent has no price set for the selected option.');
      return;
    }

    setLoading(true);
    try {
      const response = await payments.stripeLinkInitiate({
        agentId: agent.id,
        paymentType: resolved.paymentType,
        amount: resolved.amount,
        rentalDays: resolved.rentalDays,
      });

      savePendingStripePayment({
        paymentId: response.data.paymentId,
        agentId: agent.id,
        agentName: agent.name,
      });

      window.location.href = response.data.checkoutUrl;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      alert(err?.response?.data?.error || 'Could not start Stripe checkout.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">{agent.name}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>

          {!buyAvailable && !rentAvailable ? (
            <p className="text-slate-400 text-sm">
              This agent is free — you already have access without payment.
            </p>
          ) : (
            <>
              {buyAvailable && rentAvailable && (
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setMode('buy')}
                    className={`flex-1 py-2 rounded-lg font-semibold transition ${
                      mode === 'buy'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {getBuyLabel(agent.pricingModel)}
                  </button>
                  <button
                    onClick={() => setMode('rent')}
                    className={`flex-1 py-2 rounded-lg font-semibold transition ${
                      mode === 'rent'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Rent (Temporary)
                  </button>
                </div>
              )}

              {mode === 'rent' && rentAvailable && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3 text-slate-300">
                    Rental Duration
                  </label>
                  <div className="space-y-2">
                    {RENT_DURATIONS.map((duration) => (
                      <button
                        key={duration.days}
                        onClick={() => setRentalDuration(duration.days)}
                        className={`w-full p-3 rounded-lg text-left transition font-medium ${
                          rentalDuration === duration.days
                            ? 'bg-blue-500/20 border-2 border-blue-500 text-blue-300'
                            : 'bg-slate-800 border-2 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {duration.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-slate-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-slate-400 mb-1">
                  {mode === 'rent' ? 'Rental cost' : getBuyPriceLabel(agent.pricingModel)}
                </p>
                <p className="text-3xl font-bold text-blue-400">{getPriceDisplay()}</p>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                You will be redirected to Stripe test checkout. After paying, return to this agent
                page — access unlocks automatically.
              </p>

              <button
                onClick={handleStripeCheckout}
                disabled={loading || resolved.amount <= 0}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition"
              >
                {loading ? 'Redirecting to Stripe...' : 'Pay with Stripe'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
