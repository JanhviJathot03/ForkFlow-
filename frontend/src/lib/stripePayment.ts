export const PENDING_STRIPE_PAYMENT_KEY = 'locus_pending_stripe_payment';

export interface PendingStripePayment {
  paymentId: string;
  agentId: string;
  agentName?: string;
  createdAt: string;
}

export function savePendingStripePayment(
  data: Pick<PendingStripePayment, 'paymentId' | 'agentId' | 'agentName'>
) {
  if (typeof window === 'undefined') return;
  const payload: PendingStripePayment = {
    ...data,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(PENDING_STRIPE_PAYMENT_KEY, JSON.stringify(payload));
}

export function getPendingStripePayment(): PendingStripePayment | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PENDING_STRIPE_PAYMENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingStripePayment;
  } catch {
    return null;
  }
}

export function clearPendingStripePayment() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PENDING_STRIPE_PAYMENT_KEY);
}
