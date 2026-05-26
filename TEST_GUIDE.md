# Quick Test Guide

## Test Accounts
```
Builder Account:
- Email: builder@locus.app
- Password: password123

Buyer Account:
- Email: buyer@locus.app
- Password: password456
```

## API Endpoints to Test

### 1. Login (Both Accounts)
```
POST http://localhost:5000/api/auth/login
{
  "email": "builder@locus.app",
  "password": "password123"
}
```

### 2. Browse Marketplace
```
GET http://localhost:5000/api/marketplace?page=1&limit=12
```

### 3. Get Specific Agent
```
GET http://localhost:5000/api/agents/[agentId]
```

### 4. Create New Agent (Builder Only - Requires Auth Token)
```
POST http://localhost:5000/api/agents
Authorization: Bearer [token]
{
  "name": "My New Agent",
  "description": "Does something awesome",
  "category": "research",
  "promptTemplate": "You are helpful...",
  "features": ["Feature 1", "Feature 2"],
  "pricingModel": "subscription",
  "price": 19.99
}
```

### 5. Search Marketplace
```
GET http://localhost:5000/api/marketplace/search?q=research&category=research
```

## Flow to Test
1. ✅ Login as builder (builder@locus.app)
2. ✅ Go to marketplace - should see 3 sample agents
3. ✅ Create a new agent
4. ✅ Verify it appears in marketplace
5. ✅ Login as buyer (buyer@locus.app)
6. ✅ Browse and see all agents
7. ✅ Test agent details page

## Key Changes Made
- ✅ Database removed (using local JSON storage)
- ✅ 2 dummy accounts created with different roles
- ✅ 3 sample agents pre-loaded
- ✅ Removed "Dev Login" button from UI
- ✅ Fixed marketplace route (removed Sequelize dependencies)
- ✅ Updated model factory with findAndCountAll support
