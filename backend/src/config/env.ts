import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().url(),

    // Chainhooks
    HIRO_API_KEY: z.string().min(1, 'HIRO_API_KEY is required'),

    // Server
    BACKEND_URL: z.string().url(),
    PORT: z.string().default('3001'),
    NODE_ENV: z.enum(['development', 'production']).default('development'),

    // Telegram
    TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
    TELEGRAM_BOT_USERNAME: z.string().min(1, 'TELEGRAM_BOT_USERNAME is required'),

    // Contracts
    MULTISEND_CONTRACT_MAINNET: z.string().min(1),
    MULTISEND_CONTRACT_TESTNET: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
}

export const config = {
    database: {
        url: parsed.data.DATABASE_URL,
    },
    chainhooks: {
        apiKey: parsed.data.HIRO_API_KEY,
    },
    server: {
        port: parseInt(parsed.data.PORT),
        url: parsed.data.BACKEND_URL,
        env: parsed.data.NODE_ENV,
    },
    telegram: {
        botToken: parsed.data.TELEGRAM_BOT_TOKEN,
        botUsername: parsed.data.TELEGRAM_BOT_USERNAME,
    },
    contracts: {
        mainnet: parsed.data.MULTISEND_CONTRACT_MAINNET,
        testnet: parsed.data.MULTISEND_CONTRACT_TESTNET,
    },
};
