import axios from 'axios';

function resolveApiBaseUrl() {
  // In the browser, always use the Next.js proxy (/api/*) to avoid CORS.
  // The proxy in next.config.ts forwards these to the backend.
  if (typeof window !== 'undefined') {
    return '/api';
  }
  // On the server (SSR), call the backend directly.
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/+$/, '');
  return 'http://localhost:5000/api';
}

const API_BASE_URL = resolveApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

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

  getStatus: (id: string) => apiClient.get(`/payments/${id}`),
  getHistory: (walletAddress: string) =>
    apiClient.get(`/payments/history/${walletAddress}`),
  getPending: () => apiClient.get('/payments/pending'),
};

// ─── Execute ─────────────────────────────────────────────────────────────────
export const execute = {
  // Multi-turn chat (preferred)
  chat: (agentId: string, messages: { role: 'user' | 'assistant'; content: string }[]) =>
    apiClient.post(`/execute/${agentId}/chat`, { messages }),
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
