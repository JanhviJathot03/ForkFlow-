'use client';

import { useState } from 'react';
import { payments } from '@/lib/api';

interface BuyRentModalProps {
  agent: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const RENT_DURATIONS = [
  { label: '1 Month', days: 30, price: 'calculateMonthly' },
  { label: '3 Months', days: 90, price: 'calculate3Months' },
  { label: '6 Months', days: 180, price: 'calculate6Months' },
];

export function BuyRentModal({ agent, isOpen, onClose, onSuccess }: BuyRentModalProps) {
  const [mode, setMode] = useState<'buy' | 'rent'>('buy');
  const [rentalDuration, setRentalDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [paymentReceiver, setPaymentReceiver] = useState('');

  if (!isOpen) return null;

  const getPriceDisplay = () => {
    if (mode === 'buy') {
      const price = parseFloat(agent.purchasePrice || 0);
      return `$${price.toFixed(2)}`;
    } else {
      // For rental, calculate based on monthly cost and duration
      const monthlyPrice = parseFloat(agent.monthlyCost || 0);
      const months = Math.ceil(rentalDuration / 30);
      const totalPrice = monthlyPrice * months;
      return `$${totalPrice.toFixed(2)}`;
    }
  };

  const handleInitiatePayment = async () => {
    setLoading(true);
    try {
      const paymentType = mode === 'buy' ? 'purchase' : 'rental';
      const amount = mode === 'buy' 
        ? parseFloat(agent.purchasePrice || 0)
        : parseFloat(agent.monthlyCost || 0) * Math.ceil(rentalDuration / 30);

      const response = await payments.manualInitiate({
        agentId: agent.id,
        paymentType,
        amount,
        rentalDays: mode === 'rent' ? rentalDuration : undefined,
      });

      setInstructions(response.data.instructions);
      setPaymentReceiver(response.data.receiver);
      setPaymentInitiated(true);
    } catch (error: any) {
      console.error('Payment initiation failed:', error);
      alert(error.response?.data?.error || 'Payment initiation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    setLoading(true);
    try {
      const response = await payments.manualConfirm({
        agentId: agent.id,
        paymentType: mode === 'buy' ? 'purchase' : 'rental',
        rentalDays: mode === 'rent' ? rentalDuration : undefined,
      });

      alert('Payment confirmed! Agent ' + mode + ' successful.');
      setPaymentInitiated(false);
      setInstructions('');
      setMode('buy');
      setRentalDuration(30);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Payment confirmation failed:', error);
      alert(error.response?.data?.error || 'Payment confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">{agent.name}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {!paymentInitiated ? (
            <>
              {/* Mode toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setMode('buy')}
                  className={`flex-1 py-2 rounded-lg font-semibold transition ${
                    mode === 'buy'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Buy (One-time)
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

              {mode === 'rent' && (
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

              <div className="bg-slate-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-400 mb-1">
                  {mode === 'buy' ? 'Purchase Price' : 'Rental Cost'}
                </p>
                <p className="text-3xl font-bold text-blue-400">{getPriceDisplay()}</p>
              </div>

              <button
                onClick={handleInitiatePayment}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white font-semibold py-3 rounded-lg transition"
              >
                {loading ? 'Processing...' : `Proceed to Payment`}
              </button>
            </>
          ) : (
            <>
              {/* Payment instructions */}
              <div className="space-y-4">
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-sm text-slate-400 mb-2">Send payment to:</p>
                  <p className="text-white font-mono break-all">{paymentReceiver}</p>
                </div>

                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-300 mb-2">Payment Instructions:</p>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{instructions}</p>
                </div>

                <button
                  onClick={handleMarkPaid}
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-slate-600 text-white font-semibold py-3 rounded-lg transition"
                >
                  {loading ? 'Confirming...' : 'Mark as Paid (Dev)'}
                </button>

                <button
                  onClick={() => {
                    setPaymentInitiated(false);
                    setInstructions('');
                  }}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition"
                >
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
