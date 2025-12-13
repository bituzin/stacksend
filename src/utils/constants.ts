// Contract configuration
// This should be updated with the actual deployed contract address after deployment
// Format: "SPXXXXXXXX.contract-name" (dot notation, not ::)
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

// Maximum recipients allowed by the smart contract
export const MAX_RECIPIENTS_CONTRACT = 50;

// Plan configurations
export const PLANS = {
    starter: {
        name: 'Starter',
        maxRecipients: 5,
        description: 'Perfect for small batches',
    },
    pro: {
        name: 'Pro',
        maxRecipients: 10,
        description: 'For regular multisend users',
    },
    max: {
        name: 'Max',
        maxRecipients: 20,
        description: 'High volume transfers',
    },
    ultra: {
        name: 'Ultra',
        maxRecipients: 50,
        description: 'Maximum capacity',
    },
} as const;

export type PlanKey = keyof typeof PLANS;

// Network configurations
export const NETWORKS = {
    mainnet: {
        name: 'Mainnet',
        explorerUrl: 'https://explorer.stacks.co',
    },
    testnet: {
        name: 'Testnet',
        explorerUrl: 'https://explorer.stacks.co',
    },
} as const;
