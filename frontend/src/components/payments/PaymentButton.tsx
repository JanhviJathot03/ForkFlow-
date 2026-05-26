'use client';

import { useState } from 'react';
import { payments } from '@/lib/api';
import { savePendingStripePayment } from '@/lib/stripePayment';
import { useAuthStore } from '@/store/authStore';

interface PaymentButtonProps {
  agentId: string;
  agentName?: string;
  amount: number;
  paymentType?: 'purchase' | 'subscription' | 'pay_per_use' | 'rental';
  rentalDays?: number;
  label?: string;
  className?: string;
}

export function PaymentButton({
  agentId,
  agentName,
  amount,
  paymentType = 'purchase',
  rentalDays,
  label = 'Pay with Stripe',
  className = '',
}: PaymentButtonProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      alert('Please log in first.');
      return;
    }

    if (amount <= 0) {
      alert('This agent has no price set.');
      return;
    }

    setLoading(true);

    try {
      const response = await payments.stripeLinkInitiate({
        agentId,
        amount,
        paymentType,
        rentalDays,
      });

      savePendingStripePayment({
        paymentId: response.data.paymentId,
        agentId,
        agentName,
      });

      window.location.href = response.data.checkoutUrl;
    } catch (error) {
      console.error('Payment failed', error);
      alert('Could not start Stripe checkout. Is the backend running?');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? 'Redirecting to Stripe...' : label}
    </button>
  );
}
