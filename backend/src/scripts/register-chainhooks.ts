import { registerAllChainhooks } from '../services/chainhooks.js';

async function main() {
    console.log('🚀 Registering chainhooks...');

    try {
        await registerAllChainhooks();
        console.log('✅ All chainhooks registered successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to register chainhooks:', error);
        process.exit(1);
    }
}

main();
