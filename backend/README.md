# StackSend Backend

Backend service for monitoring StackSend multisend transactions via Hiro Chainhooks and sending Telegram notifications.

## Features

- 📡 **Real-time monitoring** of STX and FT transfers via Chainhooks
- 💬 **Telegram notifications** when users receive transfers
- 🗄️ **PostgreSQL database** for transfer history and analytics
- 📊 **Activity feed** for frontend integration
- 🔔 **User preferences** for notification settings

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `HIRO_API_KEY` - Your Hiro Platform API key
- `TELEGRAM_BOT_TOKEN` - From BotFather
- `BACKEND_URL` - Your deployed backend URL
- `MULTISEND_CONTRACT_MAINNET` / `MULTISEND_CONTRACT_TESTNET`

### 3. Set Up Database

Create the database schema:

```bash
# Connect to your PostgreSQL database
psql $DATABASE_URL

# Run the schema file
\i src/db/schema.sql

# Verify tables
\dt

# Exit
\q
```

### 4. Register Chainhooks

```bash
npm run register-chainhooks
```

This will register 4 chainhooks:
- STX transfers on mainnet
- STX transfers on testnet
- FT transfers on mainnet
- FT transfers on testnet

### 5. Start Server

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Webhooks (called by Hiro)
```
POST /api/webhooks/stx-transfer
POST /api/webhooks/ft-transfer
```

### User Management
```
POST /api/telegram/link
GET /api/users/:address
GET /api/users/:address/activity
POST /api/users/:address/notifications
```

### Transfers
```
GET /api/transfers/recent
```

## Deployment

### Railway

1. Create new project on Railway
2. Add PostgreSQL database
3. Set environment variables
4. Deploy from GitHub

```bash
railway up
```

### Verify Deployment

```bash
curl https://your-backend.railway.app/health
```

## Telegram Bot Setup

1. Talk to [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow instructions
3. Copy the bot token to `.env`
4. Users link their wallet via the StackSend frontend
5. They'll receive notifications when they receive transfers!

## Database Schema

- **users** - Wallet addresses linked to Telegram
- **transfers** - All multisend transactions
- **recipients** - Individual recipient entries
- **notifications** - Telegram message log
- **activity_feed** - User activity for frontend

## Monitoring

View logs in Railway dashboard or:

```bash
railway logs --service your-service
```

Filter for webhooks:
```bash
railway logs | grep "WEBHOOK"
```

## Troubleshooting

**Webhooks not receiving:**
- Check Hiro Platform dashboard for chainhook status
- Verify `BACKEND_URL` is correct and publicly accessible
- Check Railway logs for errors

**Telegram not sending:**
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check user has linked Telegram via frontend
- Ensure notifications are enabled in user settings

**Database errors:**
- Verify `DATABASE_URL` is correct
- Check SSL settings match your environment
- Run schema migration again if tables are missing
