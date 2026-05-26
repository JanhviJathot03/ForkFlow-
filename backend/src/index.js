const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const agentRoutes = require('./routes/agents');
const paymentRoutes = require('./routes/payments');
const aiRoutes = require('./routes/ai');
const marketplaceRoutes = require('./routes/marketplace');
const dashboardRoutes = require('./routes/dashboard');
const executeRoutes = require('./routes/execute');
const reviewRoutes = require('./routes/reviews');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

// ── CORS ─────────────────────────────────────────────────────────────────────
// Allow the frontend origin AND the Next.js server-side proxy (same host,
// different port). In dev we allow all localhost origins for convenience.
const allowedOrigins = new Set([
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
]);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    // In development allow any localhost origin
    if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    storage: 'local-memory',
    ai: require('./services/aiService').activeProvider(),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/dashboard', authMiddleware.authenticateToken, dashboardRoutes);
app.use('/api/execute', executeRoutes);
app.use('/api/reviews', reviewRoutes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(errorHandler);
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Startup ───────────────────────────────────────────────────────────────────
async function startServer() {
  const publicApiUrl = process.env.API_URL?.trim() || `http://localhost:${PORT}`;
  const aiProvider = require('./services/aiService').activeProvider();

  // Start listening immediately (long timeout for AI chat requests)
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════════════╗
║  🚀 Locus Agents Backend                     ║
║  🔗 ${publicApiUrl.padEnd(43)}║
║  🤖 AI provider : ${aiProvider.padEnd(27)}║
║  📝 Environment : ${(process.env.NODE_ENV || 'development').padEnd(27)}║
║  💾 Storage     : Local Memory               ║
╚══════════════════════════════════════════════╝
    `);
  });
  server.timeout = 120000;
  server.keepAliveTimeout = 120000;

  // Initialize local storage
  try {
    await db.sequelize.authenticate();
    console.log('✓ Local storage initialized');
    await db.sequelize.sync();
    console.log('✓ Local storage synced');
  } catch (error) {
    console.warn('⚠ Local storage init warning:', error.message);
  }
}

startServer();

module.exports = app;
