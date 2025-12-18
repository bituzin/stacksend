import TelegramBot from 'node-telegram-bot-api';
import { db } from '../db/client.js';
import { config } from '../config/env.js';

class TelegramService {
    private bot: TelegramBot;

    constructor() {
        // Enable polling to listen for commands
        this.bot = new TelegramBot(config.telegram.botToken, { polling: true });

        // Set up command handlers
        this.setupCommands();

        console.log('✅ Telegram bot initialized with polling');
    }

    private setupCommands() {
        // Handle /start command
        this.bot.onText(/\/start/, async (msg) => {
            const chatId = msg.chat.id;
            await this.handleStartCommand(chatId);
        });

        // Handle /status, /enable, /disable 
        this.bot.onText(/\/status|\/enable|\/disable/, async (msg) => {
            const chatId = msg.chat.id;
            await this.bot.sendMessage(chatId, 'Link your wallet in the StackSend app first!');
        });

        console.log('✅ Bot commands registered');
    }

    /**
     * Send transfer notification to user
     */
    async sendTransferNotification(params: {
        chatId: number;
        recipientAddress: string;
        amount: string;
        tokenSymbol: string;
        txId: string;
        senderAddress: string;
        network: string;
    }): Promise<number | null> {
        const { chatId, recipientAddress, amount, tokenSymbol, txId, senderAddress, network } = params;

        const explorerUrl = network === 'mainnet'
            ? `https://explorer.hiro.so/txid/${txId}`
            : `https://explorer.hiro.so/txid/${txId}?chain=testnet`;

        const message = `
🎉 *You received ${amount} ${tokenSymbol}!*

💰 *Amount:* ${amount} ${tokenSymbol}
📬 *To:* \`${recipientAddress.slice(0, 8)}...${recipientAddress.slice(-6)}\`
👤 *From:* \`${senderAddress.slice(0, 8)}...${senderAddress.slice(-6)}\`
🔗 [View Transaction](${explorerUrl})
    `.trim();

        try {
            const result = await this.bot.sendMessage(chatId, message, {
                parse_mode: 'Markdown',
                disable_web_page_preview: false,
            });
            console.log(`✅ Telegram notification sent to ${chatId} for tx ${txId.slice(0, 10)}...`);
            return result.message_id;
        } catch (error: any) {
            console.error(`❌ Failed to send Telegram message to ${chatId}:`, error.message);
            return null;
        }
    }

    /**
     * Send welcome message when user links their wallet
     */
    async sendWelcomeMessage(chatId: number, walletAddress: string): Promise<void> {
        const message = `
👋 *Welcome to StackSend Notifications!*

Your wallet has been linked:
\`${walletAddress}\`

You'll receive instant notifications whenever you receive STX or fungible tokens via StackSend.

🔔 Notifications are *enabled* by default.

*Commands:*
/status - Check your notification status
/disable - Disable notifications
/enable - Enable notifications
    `.trim();

        try {
            await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            console.log(`✅ Welcome message sent to ${chatId}`);
        } catch (error: any) {
            console.error(`❌ Failed to send welcome message:`, error.message);
        }
    }

    /**
     * Send test notification
     */
    async sendTestNotification(chatId: number): Promise<void> {
        const message = '✅ *Test notification successful!*\n\nYou\'re all set up to receive StackSend notifications.';
        try {
            await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            console.log(`✅ Test notification sent to ${chatId}`);
        } catch (error: any) {
            console.error(`❌ Failed to send test notification:`, error.message);
        }
    }

    /**
     * Send status message
     */
    async sendStatusMessage(chatId: number, walletAddress: string, enabled: boolean): Promise<void> {
        const status = enabled ? '✅ Enabled' : '🔕 Disabled';
        const message = `
📊 *Notification Status*

Wallet: \`${walletAddress}\`
Status: ${status}

${enabled ? 'You will receive notifications when you receive STX or fungible tokens.' : 'Notifications are currently disabled. Use /enable to turn them back on.'}
    `.trim();

        try {
            await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } catch (error: any) {
            console.error(`❌ Failed to send status message:`, error.message);
        }
    }

    /**
     * Handle /start command
     */
    async handleStartCommand(chatId: number): Promise<void> {
        const message = `
👋 *Welcome to StackSend Notifications!*

To start receiving notifications, you need to link your Stacks wallet address.

*How to link your wallet:*
1. Go to the StackSend app
2. Connect your wallet
3. Click on "Link Telegram" in the settings
4. Your Telegram will be automatically linked

Once linked, you'll receive instant notifications whenever you receive STX or fungible tokens via StackSend!

*Commands:*
/status - Check your notification status
/disable - Disable notifications
/enable - Enable notifications
    `.trim();

        try {
            await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } catch (error: any) {
            console.error(`❌ Failed to handle /start command:`, error.message);
        }
    }
}

export const telegramService = new TelegramService();
