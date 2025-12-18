# Chainhooks + Telegram Deployment Guide

Complete step-by-step guide to deploy StackSend with Chainhooks and Telegram notifications.

## Prerequisites

- [ ] Telegram account
- [ ] Railway account (or similar PaaS)
- [ ] Hiro Platform account
- [ ] Domain name (optional, for production)

---

## Part 1: Create Telegram Bot

### Step 1: Talk to BotFather

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Follow prompts:
   - **Name**: StackSend Notifications (or your choice)
   - **Username**: Must end with "bot", e.g., `stacksend_notifications_bot`
4. Copy the **bot token** (looks like `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. Copy your **bot username**

### Step 2: Configure Bot Settings

```
/setdescription
Get instant notifications when you receive STX or fungible tokens via StackSend

/setabouttext
StackSend Notifications Bot - Real-time transfer alerts

/setcommands
start - Link your wallet
status - Check notification status
enable - Enable notifications
disable - Disable notifications
```

---

## Part 2: Deploy Backend to Railway

### Step 1: Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd /path/to/stacksend
railway init
```

### Step 2: Add PostgreSQL Database

1. In Railway dashboard, click **"New"** → **"Database"** → **"PostgreSQL"**
2. Wait for provisioning
3. Copy the `DATABASE_URL` from the PostgreSQL service

### Step 3: Set Environment Variables

```bash
# Navigate to backend
cd backend

# Set variables in Railway
railway variables set DATABASE_URL="$POSTGRES_URL"
railway variables set HIRO_API_KEY="your-hiro-api-key"
railway variables set TELEGRAM_BOT_TOKEN="your-bot-token-from-botfather"
railway variables set TELEGRAM_BOT_USERNAME="your_bot_username"
railway variables set NODE_ENV="production"
railway variables set PORT="3001"

# Contract addresses
railway variables set MULTISEND_CONTRACT_MAINNET="SP31DP8F8CF2GXSZBHHHK5J6Y061744E1TNFGYWYV.multisend"
railway variables set MULTISEND_CONTRACT_TESTNET="ST31DP8F8CF2GXSZBHHHK5J6Y061744E1TP7FRGHT.multisend"
```

### Step 4: Get Backend URL

After deployment, Railway will give you a URL like:
```
https://stacksend-backend-production.up.railway.app
```

Update `BACKEND_URL`:
```bash
railway variables set BACKEND_URL="https://your-backend.up.railway.app"
```

### Step 5: Run Database Migration

```bash
# Connect to Railway PostgreSQL
railway connect postgres

# In psql shell:
\i src/db/schema.sql

# Verify tables
\dt

# Should show: users, transfers, recipients, notifications, activity_feed

# Exit
\q
```

### Step 6: Deploy Backend

```bash
# From backend directory
git add .
git commit -m "Add chainhooks backend"
git push

# Railway auto-deploys from git
```

### Step 7: Verify Backend

```bash
curl https://your-backend.up.railway.app/health

# Should return: {"status":"ok","timestamp":"..."}
```

---

## Part 3: Register Chainhooks

### Step 1: Get Hiro API Key

1. Go to https://platform.hiro.so
2. Create account or login
3. Navigate to **API Keys**
4. Create new key for Chainhooks
5. Copy the API key

### Step 2: Update Backend .env

```bash
# In backend directory, create .env
cat > .env << EOF
DATABASE_URL=your-railway-postgres-url
HIRO_API_KEY=your-hiro-api-key
BACKEND_URL=https://your-backend.railway.app
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_BOT_USERNAME=your_bot_username
MULTISEND_CONTRACT_MAINNET=SP31DP8F8CF2GXSZBHHHK5J6Y061744E1TNFGYWYV.multisend
MULTISEND_CONTRACT_TESTNET=ST31DP8F8CF2GXSZBHHHK5J6Y061744E1TP7FRGHT.multisend
NODE_ENV=production
PORT=3001
EOF
```

### Step 3: Register Chainhooks

```bash
# From backend directory
npm run register-chainhooks
```

**Expected Output**:
```
📡 Registering chainhooks...
✅ STX transfer chainhook registered for mainnet: uuid-xxx
✅ STX transfer chainhook registered for testnet: uuid-xxx
✅ FT transfer chainhook registered for mainnet: uuid-xxx
✅ FT transfer chainhook registered for testnet: uuid-xxx
✅ All chainhooks registered successfully
```

### Step 4: Verify in Hiro Platform

1. Go to https://platform.hiro.so
2. Navigate to **Chainhooks**
3. You should see 4 chainhooks listed:
   - `stacksend-stx-transfers-mainnet`
   - `stacksend-stx-transfers-testnet`
   - `stacksend-ft-transfers-mainnet`
   - `stacksend-ft-transfers-testnet`

---

## Part 4: Deploy Frontend to Vercel

### Step 1: Create Frontend .env

```bash
# In stacksend root directory
cat > .env << EOF
VITE_CONTRACT_ADDRESS_MAINNET=SP31DP8F8CF2GXSZBHHHK5J6Y061744E1TNFGYWYV.multisend
VITE_CONTRACT_ADDRESS_TESTNET=ST31DP8F8CF2GXSZBHHHK5J6Y061744E1TP7FRGHT.multisend
VITE_BACKEND_URL=https://your-backend.railway.app
VITE_TELEGRAM_BOT_USERNAME=your_bot_username
EOF
```

### Step 2: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: stacksend
# - Directory: ./
# - Build command: npm run build
# - Output directory: dist
```

### Step 3: Set Environment Variables in Vercel

1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Add each variable from `.env`
3. Redeploy:

```bash
vercel --prod
```

---

## Part 5: Testing

### Test 1: Telegram Bot

1. Open Telegram
2. Search for your bot: `@your_bot_username`
3. Send `/start`
4. Verify you get welcome message

### Test 2: Backend Health

```bash
curl https://your-backend.railway.app/health
```

### Test 3: Testnet Transfer

1. Open your deployed StackSend app
2. Connect wallet (testnet)
3. Link Telegram:
   - Click "Open Telegram Bot"
   - Follow linking instructions
4. Send test transfer to 2-3 recipients (including yourself)
5. **Verify**:
   - Check Railway logs for webhook
   - Check database for new records
   - Check Telegram for notification
   - Check activity feed in app

### Test 4: Check Railway Logs

```bash
railway logs --service backend
```

Look for:
```
🔍 ===== STX TRANSFER WEBHOOK =====
📦 Block 12345, 1 transaction(s)
🔍 TX 0x1234...
📋 Found 3 recipient(s)
✅ Transfer saved with ID: 1
💾 Recipient 1: SP... - 0.5 STX
📱 Notification sent to 123456789
🔍 ===== END WEBHOOK =====
```

### Test 5: Check Database

```bash
railway connect postgres

# In psql:
SELECT * FROM transfers ORDER BY created_at DESC LIMIT 5;
SELECT * FROM recipients ORDER BY created_at DESC LIMIT 10;
SELECT * FROM notifications WHERE message_sent = true LIMIT 5;
```

---

## Part 6: Mainnet Deployment

### Step 1: Register Mainnet Chainhooks

Already done if you ran `register-chainhooks` earlier. Verify in Hiro Platform.

### Step 2: Test with Small Amount

1. Switch app to mainnet
2. Send small STX transfer (0.1 STX) to 2 recipients
3. Verify webhook triggers
4. Verify notification sent

---

## Troubleshooting

### Webhooks Not Receiving

**Check**:
1. Backend URL in chainhook registration is correct
2. Backend is publicly accessible
3. Railway service is running
4. Hiro Platform shows chainhook as "active"

**Fix**:
```bash
# Check Railway logs
railway logs | grep "WEBHOOK"

# Re-register chainhooks
cd backend && npm run register-chainhooks
```

### Telegram Not Sending

**Check**:
1. Bot token is correct
2. User has linked Telegram
3. Notifications are enabled in user settings

**Debug**:
```bash
# Check notification logs
railway logs | grep "Telegram"

# Check database
railway connect postgres
SELECT * FROM users WHERE telegram_chat_id IS NOT NULL;
SELECT * FROM notifications WHERE message_sent = false;
```

### Database Connection Errors

**Check**:
1. `DATABASE_URL` is correct
2. SSL settings match Railway requirements

**Fix**:
```typescript
// In backend/src/db/client.ts
ssl: { rejectUnauthorized: false }  // Required for Railway
```

---

## Monitoring

### Railway Logs

```bash
# Real-time logs
railway logs --service backend --follow

# Filter for webhooks
railway logs | grep "WEBHOOK"

# Filter for errors
railway logs | grep "ERROR"
```

### Database Queries

```sql
-- Recent transfers
SELECT * FROM transfers ORDER BY created_at DESC LIMIT 10;

-- Notification success rate
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN message_sent THEN 1 ELSE 0 END) as sent,
  ROUND(100.0 * SUM(CASE WHEN message_sent THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM notifications;

-- Active users
SELECT COUNT(*) FROM users WHERE telegram_chat_id IS NOT NULL;
```

---

## Rollback Plan

If something goes wrong:

1. **Disable Chainhooks** in Hiro Platform
2. **Revert Frontend** in Vercel (Deployments → Previous → Promote)
3. **Rollback Database** (if needed):
   ```sql
   DROP TABLE IF EXISTS notifications CASCADE;
   DROP TABLE IF EXISTS activity_feed CASCADE;
   DROP TABLE IF EXISTS recipients CASCADE;
   DROP TABLE IF EXISTS transfers CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   ```

---

## Post-Deployment

### 1. Monitor for 24 Hours

- Check Railway logs every few hours
- Verify notifications are sending
- Monitor database growth

### 2. Set Up Alerts

In Railway dashboard:
- Set up usage alerts
- Configure error notifications

### 3. Update Documentation

Document:
- Backend URL
- Bot username
- Chainhook UUIDs
- Any custom configuration

---

## Success Checklist

- [ ] Telegram bot created and configured
- [ ] Backend deployed to Railway
- [ ] PostgreSQL database migrated
- [ ] Chainhooks registered (4 total)
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set
- [ ] Testnet transfer tested successfully
- [ ] Telegram notifications received
- [ ] Activity feed showing transfers
- [ ] Mainnet tested with small amount
- [ ] Monitoring set up

**Congratulations! Your StackSend Chainhooks + Telegram integration is live! 🎉**
