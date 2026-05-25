# Supabase Setup Guide for Locus

This guide will help you migrate from local PostgreSQL to Supabase for hosting your Locus agents database.

## Step 1: Create a Supabase Account & Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up with email or GitHub
3. Create a new project:
   - Organization: Create one if needed
   - Project name: `locus-agents` (or your preference)
   - Password: Generate a strong password (save it!)
   - Region: Choose closest to your users (e.g., US East)
   - Pricing: Start with Free tier

4. Wait 2-3 minutes for project to initialize

## Step 2: Get Your Connection String

1. In Supabase dashboard, go to **Settings → Database**
2. Look for **Connection string** section
3. Copy the **URI** (not the Psql section)
4. It looks like: `postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres`
5. Replace `[PASSWORD]` with the password you generated in Step 1

## Step 3: Update Backend Configuration

1. Edit `.env` in your backend folder:

```bash
# Replace this:
DATABASE_URL=postgresql://postgres:Janhvi%4003@localhost:5432/locus_agents

# With this (from Step 2):
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
```

2. Save the file

## Step 4: Install Supabase CLI (Optional but Recommended)

```bash
npm install -g @supabase/cli
```

Then test your connection:
```bash
supabase db pull
```

## Step 5: Run Database Migrations

**IMPORTANT**: This will create tables in Supabase. Make sure you're connected to Supabase in `.env`.

```bash
cd backend
npm run migrate
```

Or if that doesn't work:
```bash
npx sequelize-cli db:migrate
```

## Step 6: Test Connection

Start your backend and check for connection errors:

```bash
npm start
```

Should see:
```
Database connected successfully!
Server running on port 5000
```

## Step 7: Update Frontend (if needed)

No changes needed if your backend `.env` API_URL already points to your deployment.

For local dev, frontend still uses `http://localhost:5000/api`

## Troubleshooting

### "connection refused" error
- Check if password is correct in connection string
- Make sure you replaced `[PASSWORD]` and `[PROJECT-ID]` with actual values
- Check your IP is in Supabase whitelist (Settings → Database → Connection pooling)

### "relation does not exist" error
- Database tables weren't created. Run migrations again:
  ```bash
  npm run migrate
  ```

### How to check Supabase database
- Go to Supabase dashboard
- Click "SQL Editor" in left sidebar
- Run: `SELECT * FROM agents LIMIT 5;`

## Deploying Backend to Production

Once Supabase is working:

1. Deploy your backend (Render, Railway, Vercel, etc.)
2. Set `DATABASE_URL` env var to your Supabase connection string
3. Set other env vars (JWT_SECRET, OLLAMA settings, etc.)
4. Update frontend `.env.local` to point to your deployed backend URL

### Popular hosting options:
- **Render.com** - Easy, free tier available
- **Railway.app** - Simple setup
- **Heroku** - Requires credit card, but easy
- **DigitalOcean** - More control, ~$5/month

## Backup Your Data

Once live, backup your Supabase data weekly:

```sql
-- In Supabase SQL Editor, run:
COPY (SELECT * FROM agents) TO STDOUT WITH CSV HEADER;
```

Or use Supabase dashboard: Settings → Backups → Request Backup

## Next Steps

1. ✅ Supabase configured locally
2. Deploy backend to production hosting
3. Deploy frontend to Vercel, Netlify, or similar
4. Update frontend to point to production backend URL
5. Monitor your app and scale as needed!

Questions? Check [Supabase docs](https://supabase.com/docs)
