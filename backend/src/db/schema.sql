-- StackSend Database Schema
-- For tracking multisend transfers and Telegram notifications

-- Users table with Telegram integration
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE,
    telegram_chat_id BIGINT UNIQUE,
    telegram_username TEXT,
    notification_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transfers table for both STX and FT
CREATE TABLE IF NOT EXISTS transfers (
    id SERIAL PRIMARY KEY,
    tx_id TEXT NOT NULL,
    block_height INTEGER NOT NULL,
    timestamp BIGINT NOT NULL,
    sender_address TEXT NOT NULL,
    transfer_type TEXT NOT NULL, -- 'STX' or 'FT'
    token_contract TEXT, -- NULL for STX, contract identifier for FT
    total_amount BIGINT NOT NULL, -- Total amount sent in transaction
    recipient_count INTEGER NOT NULL,
    network TEXT NOT NULL, -- 'mainnet' or 'testnet'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tx_id)
);

-- Individual recipient entries
CREATE TABLE IF NOT EXISTS recipients (
    id SERIAL PRIMARY KEY,
    transfer_id INTEGER NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
    recipient_address TEXT NOT NULL,
    amount BIGINT NOT NULL,
    amount_decimals NUMERIC(30, 8), -- Human-readable amount
    position_in_list INTEGER NOT NULL, -- Position in original recipients list
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications log
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INTEGER NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,
    telegram_chat_id BIGINT NOT NULL,
    message_text TEXT NOT NULL,
    message_sent BOOLEAN DEFAULT false,
    telegram_message_id INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP
);

-- Activity feed for frontend
CREATE TABLE IF NOT EXISTS activity_feed (
    id SERIAL PRIMARY KEY,
    user_address TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'received' or 'sent'
    transfer_id INTEGER NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES recipients(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_transfers_tx ON transfers(tx_id);
CREATE INDEX IF NOT EXISTS idx_transfers_sender ON transfers(sender_address);
CREATE INDEX IF NOT EXISTS idx_transfers_network ON transfers(network);
CREATE INDEX IF NOT EXISTS idx_recipients_address ON recipients(recipient_address);
CREATE INDEX IF NOT EXISTS idx_recipients_transfer ON recipients(transfer_id);
CREATE INDEX IF NOT EXISTS idx_recipients_notification ON recipients(notification_sent) WHERE notification_sent = false;
CREATE INDEX IF NOT EXISTS idx_notifications_chat ON notifications(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_feed(user_address);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_feed(created_at DESC);
