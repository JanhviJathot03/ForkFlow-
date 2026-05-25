# Quick Start Guide - Locus Marketplace

## 🚀 Get Running in 2 Minutes

### Prerequisites
- Node.js installed
- PostgreSQL running locally (or change `.env` to Supabase)
- Port 3000 and 5000 available

### Step 1: Start Backend (Terminal 1)
```bash
cd backend
npm start
```

Expected output:
```
Database connected successfully!
Server running on port 5000
```

### Step 2: Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```

Expected output:
```
● ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Step 3: Open in Browser
```
http://localhost:3000
```

---

## 📝 Testing Flow (5 minutes)

### Test 1: Email Signup
```
1. Go to http://localhost:3000/signup
2. Enter:
   Email: test@example.com
   Username: testuser
   Password: Test1234!
3. Click "Sign Up"
4. ✅ Should redirect to /dashboard
```

### Test 2: Create an Agent
```
1. Click "Create New Agent" or go to /builder
2. Fill form:
   Name: My Test Agent
   Description: This is a test
   Category: Research
   Pricing Model: Purchase
   Purchase Price: 10
3. Click "Create Agent"
4. ✅ Agent created and auto-published
```

### Test 3: View in Marketplace
```
1. Go to /marketplace
2. ✅ Should see your agent listed
3. Click on it
```

### Test 4: Buy Agent
```
1. On agent detail page
2. Click "🛒 Buy or Rent Agent" button
3. Modal opens, "Buy (One-time)" selected
4. Shows price: $10
5. Click "Proceed to Payment"
6. Shows instructions
7. Click "Mark as Paid (Dev)"
8. ✅ Payment confirmed!
9. Chat should now be enabled
```

### Test 5: Rent Agent (Optional)
```
1. Create another agent with Monthly Cost: $5
2. Click "🛒 Buy or Rent Agent"
3. Click "Rent (Temporary)"
4. Select "3 Months"
5. Shows price: $15 (3 months × $5)
6. Click "Proceed to Payment"
7. Click "Mark as Paid (Dev)"
8. ✅ Rental confirmed for 90 days
```

---

## 🔑 Default Environment Variables

Backend automatically uses (already configured):
```bash
DEV_ALLOW_INSECURE_LOGIN=true
DEV_ALLOW_MANUAL_CONFIRM=true
USE_MOCK_PAYMENTS=true
```

No additional setup needed for local development!

---

## 🐛 If Something Goes Wrong

### Backend won't start
```bash
# Check if port 5000 is in use
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Clear node_modules and reinstall
cd backend
rm -rf node_modules
npm install
npm start
```

### Frontend won't load
```bash
# Clear next cache
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

### Database connection error
Check `backend/.env`:
```
DATABASE_URL=postgresql://postgres:Janhvi%4003@localhost:5432/locus_agents
```

Verify PostgreSQL is running:
```bash
# Mac:
brew services start postgresql

# Linux:
sudo systemctl start postgresql

# Windows:
# Open Services → PostgreSQL → Start
```

### Agents not showing in marketplace
```sql
-- In PostgreSQL terminal:
SELECT COUNT(*) FROM agents;
SELECT COUNT(*) FROM agents WHERE isPublished = true;
```

If 0 results, create an agent first from /builder

---

## 📚 Full Documentation

For detailed information:
- **Testing Guide**: `TESTING_GUIDE.md` - Complete test checklist
- **Supabase Setup**: `SUPABASE_SETUP.md` - Deploy to cloud database
- **Implementation**: `IMPLEMENTATION_SUMMARY.md` - What was built

---

## 🎯 Feature Summary

What's available right now:
- ✅ Email/Password signup & login
- ✅ Agent creation (auto-published)
- ✅ Marketplace listing
- ✅ Buy & Rent options
- ✅ Manual payment flow
- ✅ Agent chat interface
- ✅ Creator dashboard
- ✅ Payment history

---

## 💡 Tips

1. **Use "Dev Login"** for quick testing without signup
2. **"Mark as Paid" button** is for development only - simulates payment
3. **Refresh page** after payment to see updates
4. **Check browser console** (F12) for error messages
5. **Database persists** - agents/payments saved even after restart

---

## 🚀 Ready for Production?

When ready to deploy:

1. **Database**: Follow `SUPABASE_SETUP.md`
2. **Backend**: Deploy to Render, Railway, or Heroku
3. **Frontend**: Deploy to Vercel or Netlify
4. **Payments**: Add Stripe API keys (endpoints already ready)
5. **Update URLs**: Change `.env` API URLs

---

Enjoy building! Questions? Check the full documentation files. 🎉
