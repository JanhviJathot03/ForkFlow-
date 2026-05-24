# 🧪 Quick Testing Guide - Locus Agents

## Prerequisites
- Backend running on http://localhost:5000
- Frontend running on http://localhost:3000
- MetaMask extension installed
- Test ETH on Sepolia testnet

---

## 1️⃣ Test Backend Health

```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-05-24T12:00:00.000Z"
}
```

---

## 2️⃣ Test Wallet Connection (Frontend)

1. Go to http://localhost:3000
2. Look for "Connect Wallet" button (to be implemented)
3. Click to connect MetaMask
4. Approve connection in MetaMask popup
5. Check if wallet address appears in UI

---

## 3️⃣ Test Agent Creation API

```bash
# First, get a token (simulate login)
TOKEN="test_token_12345"

# Create an agent
curl -X POST http://localhost:5000/api/agents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Research Agent",
    "description": "A test agent for research",
    "category": "research",
    "promptTemplate": "You are a helpful research assistant",
    "features": ["Real-time data", "PDF export"],
    "price": 0.05,
    "pricingModel": "subscription"
  }'
```

**Response should include:**
```json
{
  "success": true,
  "agent": {
    "id": "...",
    "name": "Test Research Agent",
    "creator": "..."
  }
}
```

---

## 4️⃣ Test Agent Listing

```bash
curl http://localhost:5000/api/agents
```

**Response:**
```json
{
  "success": true,
  "agents": [
    {
      "id": "agent-1",
      "name": "AI Research Agent",
      "price": 0.05,
      "rating": 4.8
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1 }
}
```

---

## 5️⃣ Test Marketplace

```bash
curl http://localhost:5000/api/marketplace
```

---

## 6️⃣ Test Locus Payment Initiation (When API Key Set)

```bash
TOKEN="test_token_12345"

curl -X POST http://localhost:5000/api/payments/initiate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent-1",
    "amount": 0.05,
    "paymentType": "purchase"
  }'
```

**Response (when Locus API key configured):**
```json
{
  "success": true,
  "paymentId": "pay_1234...",
  "checkoutUrl": "https://checkout.locus.app/...",
  "amount": "0.05"
}
```

---

## 7️⃣ Test Marketplace Categories

```bash
curl http://localhost:5000/api/marketplace/categories
```

**Response:**
```json
{
  "success": true,
  "categories": [
    { "id": "research", "name": "Research", "count": 45 },
    { "id": "development", "name": "Development", "count": 78 }
  ]
}
```

---

## 8️⃣ Test Frontend Marketplace Page

1. Go to http://localhost:3000/marketplace
2. Should show list of agents (currently mock data)
3. Click on an agent card
4. Should navigate to agent details (when implemented)

---

## 9️⃣ Test Frontend Builder

1. Go to http://localhost:3000/builder
2. Fill in agent creation form:
   - Name: "My Test Agent"
   - Description: "Test description"
   - Category: "Research"
   - Price: "0.05"
3. Click "Create Agent"
4. Should show success message (when backend connected)

---

## 🔟 Manual API Testing with Postman/Insomnia

### Postman Collection Template

**Base URL:** `http://localhost:5000/api`

#### Endpoints to Test:

**AUTH**
- `POST /auth/register` 
- `GET /auth/balance/0x1234...`

**AGENTS**
- `GET /agents`
- `POST /agents` (requires auth)
- `GET /agents/agent-1`
- `POST /agents/agent-1/fork` (requires auth)

**PAYMENTS**
- `POST /payments/initiate` (requires auth + Locus key)
- `GET /payments/pay_123`

**MARKETPLACE**
- `GET /marketplace`
- `GET /marketplace/categories`
- `GET /marketplace/trending`

**DASHBOARD**
- `GET /dashboard/earnings` (requires auth)
- `GET /dashboard/agents` (requires auth)

---

## 🔧 Debugging Checklist

- [ ] Backend console shows no errors
- [ ] Frontend console has no errors (DevTools → Console)
- [ ] MetaMask is connected to Sepolia testnet
- [ ] Environment variables are set (.env, .env.local)
- [ ] PostgreSQL is running
- [ ] Redis is running (if Docker not used)
- [ ] Locus API credentials are correct

---

## 📊 Next Testing Phase

Once basic APIs working:

1. **Database Integration**
   - Create actual users table
   - Save agents to database
   - Query agents from database

2. **Payment Testing**
   - Register with Locus
   - Test payment flow
   - Verify webhook handling

3. **Frontend Integration**
   - Connect frontend to real backend
   - Test agent creation form
   - Test payment flow

4. **Smart Contracts (Optional)**
   - Deploy contract to Sepolia
   - Test ownership verification
   - Test royalty distribution

---

## ✅ Successful Test Indicators

✅ All API endpoints respond without 500 errors  
✅ Frontend pages load  
✅ MetaMask connects  
✅ Locus API calls work (when credentials added)  
✅ No console errors  
✅ Database queries working  

---

**Ready to test? Let's go! 🚀**
