export type PaymentMode = 'buy' | 'rent';

export interface ResolvedPayment {
  amount: number;
  paymentType: string;
  rentalDays?: number;
}

export function resolveAgentPayment(
  agent: {
    pricingModel?: string;
    purchasePrice?: number | string;
    monthlyCost?: number | string;
    payPerUsePrice?: number | string;
  },
  mode: PaymentMode,
  rentalDuration = 30
): ResolvedPayment {
  if (mode === 'rent') {
    const monthly = parseFloat(String(agent.monthlyCost ?? 0));
    const months = Math.ceil(rentalDuration / 30);
    return {
      amount: monthly * months,
      paymentType: 'rental',
      rentalDays: rentalDuration,
    };
  }

  const pricingModel = agent.pricingModel || 'purchase';
  if (pricingModel === 'subscription') {
    return {
      amount: parseFloat(String(agent.monthlyCost ?? 0)),
      paymentType: 'subscription',
    };
  }
  if (pricingModel === 'pay_per_use') {
    return {
      amount: parseFloat(String(agent.payPerUsePrice ?? 0)),
      paymentType: 'pay_per_use',
    };
  }
  return {
    amount: parseFloat(String(agent.purchasePrice ?? 0)),
    paymentType: 'purchase',
  };
}

export function canRentAgent(agent: { monthlyCost?: number | string }) {
  return parseFloat(String(agent.monthlyCost ?? 0)) > 0;
}

export function canBuyAgent(agent: Parameters<typeof resolveAgentPayment>[0]) {
  return resolveAgentPayment(agent, 'buy').amount > 0;
}

export function getBuyLabel(pricingModel?: string) {
  if (pricingModel === 'subscription') return 'Subscribe';
  if (pricingModel === 'pay_per_use') return 'Buy access';
  return 'Buy (One-time)';
}

export function getBuyPriceLabel(pricingModel?: string) {
  if (pricingModel === 'subscription') return 'Monthly price';
  if (pricingModel === 'pay_per_use') return 'Per-use price';
  return 'Purchase price';
}
