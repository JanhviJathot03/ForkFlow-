# ⚡ QUICK REFERENCE - Locus Agents

## 🚀 START IN 30 SECONDS

### **Option 1: Docker (Recommended)**
```bash
cd c:\Users\M.T.S\Desktop\Locus
docker-compose up
# Visit http://localhost:3000
```

### **Option 2: Manual Start**

**Terminal 1 - Backend:**
```bash
cd c:\Users\M.T.S\Desktop\Locus\backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd c:\Users\M.T.S\Desktop\Locus\frontend
npm run dev
```

---

## 📍 URLS

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:5000 |
| API Health | http://localhost:5000/health |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## 📚 KEY FILES

| File | Purpose |
|------|---------|
| `README.md` | Full documentation |
| `TESTING.md` | Testing scenarios |
| `BUILD_SUMMARY.md` | What was built |
| `docker-compose.yml` | Container setup |
| `backend/.env.example` | Backend config template |
| `backend/src/index.js` | API server |
| `backend/src/services/locusPayment.js` | 🔌 Locus integration |
| `frontend/app/page.tsx` | Home page |
| `frontend/src/lib/api.ts` | Frontend API client |

---

## 🔑 ENVIRONMENT SETUP

### **Backend (.env)**
```bash
cd backend
cp .env.example .env
# Edit .env and add:
LOCUS_API_KEY=your_key
LOCUS_API_SECRET=your_secret
ETHEREUM_RPC_URL=your_rpc_url
```

### **Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🔌 LOCUS PAYMENT INTEGRATION

### **In Backend Code**
```javascript
// backend/src/services/locusPayment.js
const locusPayment = require('./locusPayment');

// Create payment checkout
await locusPayment.createCheckout(0.05, walletAddress, agentId);

// Verify webhook
locusPayment.verifyWebhookSignature(payload, signature);

// Schedule payout
await locusPayment.scheduleCreatorPayout(walletAddress, amount);
```

### **In Frontend Code**
```javascript
// frontend/src/lib/api.ts
import { payments } from '@/lib/api';

// Initiate payment
const response = await payments.initiate({
  agentId: 'agent-123',
  amount: 0.05,
  paymentType: 'purchase'
});

// Redirect to Locus checkout
window.location.href = response.checkoutUrl;
```

---

## 📡 API ENDPOINTS CHEAT SHEET

### **Agents**
```bash
# List agents
curl http://localhost:5000/api/agents

# Get agent details
curl http://localhost:5000/api/agents/agent-1

# Create agent (needs token)
curl -X POST http://localhost:5000/api/agents \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Agent","description":"desc","category":"research"}'
```

### **Payments**
```bash
# Initiate payment (needs token)
curl -X POST http://localhost:5000/api/payments/initiate \
  -H "Authorization: Bearer TOKEN" \
  -d '{"agentId":"123","amount":0.05}'

# Check payment status
curl http://localhost:5000/api/payments/pay_123
```

### **Marketplace**
```bash
# Browse agents
curl http://localhost:5000/api/marketplace

# Get categories
curl http://localhost:5000/api/marketplace/categories

# Get trending
curl http://localhost:5000/api/marketplace/trending
```

---

## 🧪 TEST QUICK CHECKS

```bash
# 1. Backend health
curl http://localhost:5000/health

# 2. Agents API
curl http://localhost:5000/api/agents

# 3. Marketplace categories
curl http://localhost:5000/api/marketplace/categories

# 4. Check frontend
open http://localhost:3000
```

---

## 🐛 COMMON ISSUES

| Issue | Solution |
|-------|----------|
| Port 5000 in use | `netstat -ano \| findstr :5000` then kill process |
| Port 3000 in use | Change in `frontend/package.json` |
| PostgreSQL error | Install PostgreSQL or use Docker |
| Redis error | Install Redis or use Docker |
| MetaMask not connecting | Check extension installed & Sepolia selected |
| Locus API errors | Verify API keys in `.env` |

---

## 📦 PROJECT STRUCTURE

```
backend/
├── src/
│   ├── index.js                 ← Backend entry
│   ├── routes/                  ← API endpoints
│   ├── services/                ← Business logic
│   │   ├── locusPayment.js     ← 🔌 Locus
│   │   └── web3Service.js      ← Wallet
│   ├── middleware/              ← Auth, errors
│   ├── models/                  ← DB schemas
│   └── config/                  ← Configuration
└── .env                         ← Credentials

frontend/
├── app/
│   ├── page.tsx                 ← Home
│   ├── marketplace/             ← Marketplace
│   ├── builder/                 ← Agent builder
│   └── layout.tsx               ← Layout
├── src/
│   ├── components/              ← React components
│   ├── lib/api.ts               ← API client
│   ├── hooks/useWallet.ts       ← Web3 hook
│   └── store/authStore.ts       ← State
└── .env.local                   ← Config
```

---

## 💡 NEXT STEPS

1. **Run Locus Setup**
   ```bash
   # Get API keys from https://locus.app
   # Add to backend/.env
   ```

2. **Start Servers**
   ```bash
   npm run dev  # backend
   npm run dev  # frontend
   ```

3. **Test Payment Flow**
   ```bash
   # Create agent → Initiate payment → Get Locus URL
   ```

4. **Connect Frontend to Backend**
   - Update API endpoints
   - Test agent creation form
   - Test marketplace browsing

5. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial Locus Agents project"
   git remote add origin https://github.com/username/locus-agents
   git push -u origin main
   ```

---

## 📞 HELP RESOURCES

- **Full Docs:** README.md
- **Testing Guide:** TESTING.md
- **Build Details:** BUILD_SUMMARY.md
- **API Docs:** In README.md
- **Code Comments:** In source files

---

## ✅ READY CHECKLIST

- ✅ Backend ready to start
- ✅ Frontend ready to start
- ✅ Database schemas documented
- ✅ Locus API integration 90% complete
- ✅ Docker configured
- ✅ Documentation complete
- ✅ Test scenarios provided
- ✅ Quick reference provided

**You're all set! 🚀**

---

*Need more details? See the full documentation in README.md*
