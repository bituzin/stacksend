import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { handleSTXTransferWebhook } from './api/webhooks/stx-transfer.js';
import { handleFTTransferWebhook } from './api/webhooks/ft-transfer.js';
import { db } from './db/client.js';
import { telegramService } from './services/telegram.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Webhook endpoints
app.post('/api/webhooks/stx-transfer', handleSTXTransferWebhook);
app.post('/api/webhooks/ft-transfer', handleFTTransferWebhook);

// Telegram linking endpoint
app.post('/api/telegram/link', async (req, res) => {
    try {
        const { walletAddress, chatId, username } = req.body;

        if (!walletAddress || !chatId) {
            return res.status(400).json({ error: 'Missing walletAddress or chatId' });
        }

        await db.linkTelegram(walletAddress, chatId, username);

        // Send welcome message
        await telegramService.sendWelcomeMessage(chatId, walletAddress);

        res.json({ success: true, message: 'Telegram linked successfully' });
    } catch (error: any) {
        console.error('❌ Telegram link error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user activity
app.get('/api/users/:address/activity', async (req, res) => {
    try {
        const { address } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;

        const activity = await db.getUserActivity(address, limit);

        res.json({ activity });
    } catch (error: any) {
        console.error('❌ Activity fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user settings
app.get('/api/users/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const user = await db.getUserByAddress(address);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error: any) {
        console.error('❌ User fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update notification settings
app.post('/api/users/:address/notifications', async (req, res) => {
    try {
        const { address } = req.params;
        const { enabled } = req.body;

        if (typeof enabled !== 'boolean') {
            return res.status(400).json({ error: 'enabled must be a boolean' });
        }

        await db.setNotificationEnabled(address, enabled);

        res.json({ success: true, enabled });
    } catch (error: any) {
        console.error('❌ Notification update error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get recent transfers
app.get('/api/transfers/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const transfers = await db.getRecentTransfers(limit);

        res.json({ transfers });
    } catch (error: any) {
        console.error('❌ Transfers fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const port = config.server.port;
app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
    console.log(`🌍 Environment: ${config.server.env}`);
    console.log(`📡 Backend URL: ${config.server.url}`);
});
