# ⚡ Locus Agents - Complete Setup Guide

## 🚀 Project Overview

**Locus Agents** is a decentralized marketplace for AI agents built on Ethereum with Locus Payments integration.

**Features:**
- ✅ Create AI agents with no-code builder
- ✅ Monetize agents (subscribe, pay-per-use, purchase)
- ✅ Fork agents and earn royalties
- ✅ Instant crypto payments via Locus API
- ✅ Creator dashboard with analytics
- ✅ Web3 wallet integration (MetaMask)

---

## 📂 Project Structure

```
Locus/
├── frontend/                 # Next.js React app
│   ├── app/                 # Pages (home, marketplace, builder)
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── lib/api.ts       # API client
│   │   ├── hooks/           # useWallet, etc.
│   │   └── store/           # Zustand state management
│   └── package.json
│
├── backend/                  # Node.js Express API
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Locus API, Web3, etc.
│   │   ├── models/          # Database schemas
│   │   ├── middleware/      # Auth, error handling
│   │   └── index.js         # Main server file
│   ├── .env.example
│   └── package.json
│
├── smart-contracts/         # Solidity contracts (future)
├── agent-engine/            # AI agent execution (future)
├── docker-compose.yml
└── README.md
```

---

## 🛠️ Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- npm or yarn
- PostgreSQL 16 (or Docker)
- Redis (or Docker)
- MetaMask browser extension

### Option 1: Using Docker (Recommended)

```bash
# 1. Create .env file with your credentials
cp backend/.env.example backend/.env

# Edit backend/.env and add:
# LOCUS_API_KEY=your_key
# LOCUS_API_SECRET=your_secret
# ETHEREUM_RPC_URL=your_rpc_url

# 2. Start all services
docker-compose up

# Now visiting:
# Frontend: http://localhost:3000
# Backend: http://localhost:5000/health
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

### Option 2: Manual Setup

#### Backend Setup
```bash
cd backend

# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env

# 3. Edit .env with your config
# DATABASE_URL=postgresql://user:pass@localhost:5432/locus_agents
# REDIS_URL=redis://localhost:6379
# LOCUS_API_KEY=your_api_key
# ... (see .env.example)

# 4. Install & Start PostgreSQL + Redis locally
# macOS: brew install postgresql redis
# Ubuntu: sudo apt install postgresql redis-server

# 5. Create database
createdb locus_agents_dev

# 6. Start server
npm run dev
# Server running at http://localhost:5000
```

#### Frontend Setup
```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000/api
EOF

# 3. Start dev server
npm run dev
# Frontend running at http://localhost:3000
```

---

## 🌐 Deployment Setup

For hosting, use a managed database and separate frontend/backend environments:

1. Create a hosted PostgreSQL database with Neon, Supabase, Railway, Render, or AWS RDS.
2. Set the backend production env vars:
  - `DATABASE_URL`
  - `DB_SSL=true` if your provider requires SSL
  - `REDIS_URL`
  - `JWT_SECRET`
  - `FRONTEND_URL`
  - `API_URL`
  - `LOCUS_API_KEY`, `LOCUS_API_SECRET`, `LOCUS_WEBHOOK_SECRET`
3. Set the frontend production env var:
  - `NEXT_PUBLIC_API_URL`
4. Deploy the backend first, then point the frontend at the deployed backend URL.
5. Keep local Postgres only for development and seed/demo work.

Recommended split:

- Frontend: Vercel or any static/Next.js host
- Backend: Render, Railway, Fly.io, or a Node host
- Database: Neon, Supabase, Railway, Render, or AWS RDS
- Redis: Upstash, Redis Cloud, or your host's managed Redis offering

## 🆓 Free and Local Dev Mode

The repo now supports a mostly free development setup:

- AI generation can run through local Ollama instead of OpenAI or Claude.
- Locus checkout falls back to a mock checkout flow in development when the real keys are absent.
- Redis becomes optional in local dev and can be replaced by a no-op mock client.
- Public free Ethereum Sepolia RPC is used by default for wallet checks.

To run the local AI option:

1. Install Ollama.
2. Pull a model such as `llama3.1:8b`.
3. Start Ollama at `http://localhost:11434`.
4. Set `LLM_PROVIDER=ollama` and `OLLAMA_MODEL=llama3.1:8b` in `backend/.env`.

For payments in local dev, leave `USE_MOCK_PAYMENTS=true` so checkout redirects stay internal and do not require Locus credentials.

---

## 🔌 Locus Payment Integration

### Setup Steps

1. **Register with Locus**
   - Go to https://locus.app
   - Create business account
   - Get API Key & Secret
   - Configure webhook endpoint

2. **Add Credentials to .env**
   ```
   LOCUS_API_KEY=your_api_key
   LOCUS_API_SECRET=your_api_secret
   LOCUS_WEBHOOK_SECRET=your_webhook_secret
   ```

3. **API Endpoints Ready**
   - `POST /api/payments/initiate` - Create checkout
   - `POST /api/payments/webhook` - Receive confirmations
   - `GET /api/payments/:id` - Check status

### Payment Flow

```
User clicks "Buy" 
  ↓
Frontend calls POST /api/payments/initiate
  ↓
Backend calls Locus API → returns checkoutUrl
  ↓
User redirected to Locus checkout
  ↓
Locus processes payment
  ↓
Locus sends webhook to POST /api/payments/webhook
  ↓
Backend grants access + records transaction
  ↓
Creator receives payout (automatic via Locus)
```

---

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register/login with wallet
- `POST /api/auth/verify-wallet` - Verify wallet signature
- `GET /api/auth/balance/:walletAddress` - Get wallet balance

### Agents
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent details
- `POST /api/agents` - Create agent (auth required)
- `PUT /api/agents/:id` - Update agent (auth required)
- `DELETE /api/agents/:id` - Delete agent (auth required)
- `POST /api/agents/:id/fork` - Fork agent (auth required)
- `GET /api/agents/:id/stats` - Get analytics (auth required)

### Payments
- `POST /api/payments/initiate` - Start payment
- `GET /api/payments/:id` - Check payment status
- `POST /api/payments/webhook` - Locus webhook
- `GET /api/payments/history/:wallet` - Payment history

### Marketplace
- `GET /api/marketplace` - Browse agents
- `GET /api/marketplace/search` - Search agents
- `GET /api/marketplace/categories` - Get categories
- `GET /api/marketplace/trending` - Trending agents

### Dashboard
- `GET /api/dashboard/earnings` - Creator earnings
- `GET /api/dashboard/agents` - User's agents
- `GET /api/dashboard/subscriptions` - User subscriptions
- `GET /api/dashboard/analytics` - Revenue analytics

---

## 🧪 Testing the System

### 1. Test Wallet Connection
```bash
curl http://localhost:5000/api/auth/balance/0x1234...
```

### 2. Test Agent Creation
```bash
curl -X POST http://localhost:5000/api/agents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "description": "A test AI agent",
    "category": "research",
    "promptTemplate": "You are a helpful assistant",
    "features": ["feature1"],
    "price": 0.05
  }'
```

### 3. Test Marketplace
```bash
curl http://localhost:5000/api/marketplace
```

### 4. Test Payment Initiation
```bash
curl -X POST http://localhost:5000/api/payments/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-1",
    "amount": 0.05,
    "paymentType": "purchase"
  }'
```

---

## 🗄️ Database Setup

### PostgreSQL Tables (To Create)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  email VARCHAR(255),
  username VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Agents table
CREATE TABLE agents (
  id VARCHAR(36) PRIMARY KEY,
  creator_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  price DECIMAL(18, 8),
  is_published BOOLEAN DEFAULT false,
  forked_from VARCHAR(36),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id VARCHAR(36) PRIMARY KEY,
  payer_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  agent_id VARCHAR(36) REFERENCES agents(id),
  amount DECIMAL(18, 8),
  payment_type VARCHAR(20), -- 'purchase', 'subscription', 'pay_per_use'
  status VARCHAR(20), -- 'pending', 'completed', 'failed'
  locus_payment_id VARCHAR(255),
  transaction_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔑 Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/locus_agents

# Cache
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_ultra_secure_secret_key

# Locus Payment API
LOCUS_API_KEY=your_locus_api_key
LOCUS_API_SECRET=your_locus_api_secret
LOCUS_WEBHOOK_SECRET=your_locus_webhook_secret

# Ethereum
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
ETHEREUM_PRIVATE_KEY=your_private_key
ETHEREUM_NETWORK=sepolia

# Frontend
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:5000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_ETHEREUM_RPC=https://sepolia.infura.io/v3/YOUR_KEY
```

---

## 📦 Deployment

### Deploy Frontend (Vercel)
```bash
cd frontend
vercel deploy
```

### Deploy Backend (Heroku)
```bash
cd backend
heroku create locus-agents-api
heroku addons:create heroku-postgresql:standard-0
git push heroku main
```

### Deploy Smart Contracts (Ethereum Testnet)
```bash
cd smart-contracts
npm install -g hardhat
npx hardhat run scripts/deploy.js --network sepolia
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000
kill -9 <PID>
```

### PostgreSQL Connection Error
```bash
# Check PostgreSQL is running
psql -U postgres
# If not: brew services start postgresql
```

### Redis Connection Error
```bash
# Check Redis is running
redis-cli ping
# If not: redis-server
```

### MetaMask Not Connected
- Check browser has MetaMask extension
- Switch to Sepolia testnet
- Request test ETH from faucet

---

## 📝 Next Steps

1. **Database Migration** - Create database tables
2. **Smart Contracts** - Deploy Solidity contracts
3. **Agent Execution** - Build LangChain wrapper
4. **Frontend Components** - Complete UI
5. **Testing** - Write unit & integration tests
6. **Deployment** - Deploy to production

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit pull request

## 📄 License

MIT License - See LICENSE file

## 💬 Support

For issues & questions:
- Open GitHub issue
- Join our Discord
- Email: support@locus.app

---

**Happy Building! 🚀**
