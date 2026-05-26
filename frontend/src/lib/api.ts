import axios from 'axios';

/** IPv4 loopback — avoids Windows resolving localhost to ::1 when backend listens on IPv4 only. */
const DEFAULT_BACKEND_API = 'http://127.0.0.1:5000/api';

function resolveApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');

  // Browser: call backend directly (CORS is enabled). Avoids Next.js dev-proxy ECONNRESET.
  if (typeof window !== 'undefined') return DEFAULT_BACKEND_API;

  return DEFAULT_BACKEND_API;
}

const API_BASE_URL = resolveApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

export function formatApiError(err: unknown, fallback = 'Something went wrong.'): string {
  if (!axios.isAxiosError(err)) {
    return err instanceof Error ? err.message : fallback;
  }
  const data = err.response?.data as { error?: string; details?: string } | undefined;
  if (data?.error) return data.details ? `${data.error}: ${data.details}` : data.error;
  if (err.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
  if (!err.response) {
    return `Cannot reach the API at ${API_BASE_URL}. Make sure the backend is running (cd backend && npm run dev).`;
  }
  return fallback;
}

// Attach JWT to every request
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ────────────────────────────────────────────────────────────────────
export const auth = {
  register: (data: any) => apiClient.post('/auth/register', data),
  login: (data: any) => apiClient.post('/auth/login', data),
  verifyWallet: (data: any) => apiClient.post('/auth/verify-wallet', data),
  getBalance: (walletAddress: string) => apiClient.get(`/auth/balance/${walletAddress}`),
};

// ─── Agents ──────────────────────────────────────────────────────────────────
export const agents = {
  getAll: (page = 1, limit = 10) => apiClient.get('/agents', { params: { page, limit } }),
  getById: (id: string) => apiClient.get(`/agents/${id}`),
  create: (data: any) => apiClient.post('/agents', data),
  update: (id: string, data: any) => apiClient.put(`/agents/${id}`, data),
  delete: (id: string) => apiClient.delete(`/agents/${id}`),
  fork: (id: string, data: any) => apiClient.post(`/agents/${id}/fork`, data),
  publish: (id: string, data?: { isPublished?: boolean }) =>
    apiClient.patch(`/agents/${id}/publish`, data),
  getStats: (id: string) => apiClient.get(`/agents/${id}/stats`),
  getAccess: (id: string) => apiClient.get(`/agents/${id}/access`),
};

// ─── Payments ────────────────────────────────────────────────────────────────
export const payments = {
  // Stripe test mode
  stripeCreateSession: (data: { agentId: string; paymentType?: string }) =>
    apiClient.post('/payments/stripe/create-session', data),
  stripeVerify: (sessionId: string) =>
    apiClient.get(`/payments/stripe/verify/${sessionId}`),

  // Legacy Locus checkout
  initiate: (data: any) => apiClient.post('/payments/initiate', data),

  // Manual payment flow
  manualInitiate: (data: any) => apiClient.post('/payments/manual/initiate', data),
  manualConfirm: (id: string) => apiClient.patch(`/payments/manual/${id}/confirm`),

  // Stripe Payment Link (demo checkout)
  stripeLinkInitiate: (data: {
    agentId: string;
    amount: number;
    paymentType: string;
    rentalDays?: number;
  }) => apiClient.post('/payments/stripe-link/initiate', data),
  stripeLinkComplete: (paymentId: string) =>
    apiClient.post('/payments/stripe-link/complete', { paymentId }),

  getStatus: (id: string) => apiClient.get(`/payments/${id}`),
  getHistory: (walletAddress: string) =>
    apiClient.get(`/payments/history/${walletAddress}`),
  getPending: () => apiClient.get('/payments/pending'),
};

// ─── Execute ─────────────────────────────────────────────────────────────────
export const execute = {
  // Multi-turn chat (preferred) — longer timeout for AI providers
  chat: (agentId: string, messages: { role: 'user' | 'assistant'; content: string }[]) =>
    apiClient.post(`/execute/${agentId}/chat`, { messages }, { timeout: 120000 }),
  // Legacy single-turn
  run: (agentId: string, input: string) =>
    apiClient.post(`/execute/${agentId}`, { input }),
  getAgentHistory: (agentId: string) =>
    apiClient.get(`/execute/${agentId}/history`),
  getMyHistory: () => apiClient.get('/execute/my/history'),
};

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviews = {
  getForAgent: (agentId: string, page = 1, limit = 10) =>
    apiClient.get(`/reviews/${agentId}`, { params: { page, limit } }),
  submit: (agentId: string, data: { rating: number; comment?: string }) =>
    apiClient.post(`/reviews/${agentId}`, data),
  delete: (agentId: string) => apiClient.delete(`/reviews/${agentId}`),
};

// ─── AI ──────────────────────────────────────────────────────────────────────
export const ai = {
  status: () => apiClient.get('/ai/status'),
  generateIdeas: (data: any) => apiClient.post('/ai/ideas', data),
  generatePromptTemplate: (data: any) => apiClient.post('/ai/prompt-template', data),
  summarize: (text: string) => apiClient.post('/ai/summarize', { text }),
};

// ─── Marketplace ─────────────────────────────────────────────────────────────
export const marketplace = {
  getAgents: (page = 1, limit = 12, category?: string) =>
    apiClient.get('/marketplace', { params: { page, limit, category } }),
  search: (q: string, filters?: any) =>
    apiClient.get('/marketplace/search', { params: { q, ...filters } }),
  getCategories: () => apiClient.get('/marketplace/categories'),
  getTrending: () => apiClient.get('/marketplace/trending'),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const dashboard = {
  getEarnings: () => apiClient.get('/dashboard/earnings'),
  getAgents: () => apiClient.get('/dashboard/agents'),
  getSubscriptions: () => apiClient.get('/dashboard/subscriptions'),
  getAnalytics: (period = '30d') =>
    apiClient.get('/dashboard/analytics', { params: { period } }),
};
