import { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { telegramService } from '../../services/telegram.js';

export async function handleFTTransferWebhook(req: Request, res: Response): Promise<void> {
    try {
        console.log('🔍 ===== FT TRANSFER WEBHOOK =====');
        console.log('Timestamp:', new Date().toISOString());
        console.log('Body:', JSON.stringify(req.body, null, 2));

        const payload = req.body;

        // Validate payload structure
        if (!payload.event?.apply || !Array.isArray(payload.event.apply)) {
            console.log('⚠️  Invalid payload structure');
            res.status(400).json({ error: 'Invalid payload' });
            return;
        }

        const network = payload.event.network;

        // Process each block
        for (const block of payload.event.apply) {
            const blockHeight = block.block_identifier?.index;
            const timestamp = block.timestamp;
            const transactions = block.transactions || [];

            console.log(`📦 Block ${blockHeight}, ${transactions.length} transaction(s)`);

            for (const tx of transactions) {
                const txId = tx.transaction_identifier?.hash;
                const success = tx.metadata?.success;
                const operations = tx.operations || [];

                console.log(`🔍 TX ${txId?.slice(0, 12)}... success=${success}`);

                if (!success) {
                    console.log('⚠️  Skipping failed transaction');
                    continue;
                }

                // Find contract call operation for send-many-ft
                const contractCallOp = operations.find(
                    (op: any) => op.type === 'CONTRACT_CALL' && op.metadata?.function_name === 'send-many-ft'
                );

                if (!contractCallOp) {
                    console.log('⚠️  No send-many-ft contract call found');
                    continue;
                }

                const senderAddress = contractCallOp.account?.address || tx.metadata?.sender;

                // Extract function arguments
                // For FT: first arg is token contract, second is recipients list
                const functionArgs = contractCallOp.metadata?.function_args_decoded || contractCallOp.metadata?.function_args;

                if (!functionArgs || !Array.isArray(functionArgs) || functionArgs.length < 2) {
                    console.log('⚠️  Missing or invalid function arguments');
                    continue;
                }

                const tokenContract = functionArgs[0]; // Token contract principal
                const recipientsList = functionArgs[1]; // Recipients list

                if (!Array.isArray(recipientsList)) {
                    console.log('⚠️  Recipients is not an array');
                    continue;
                }

                console.log(`📋 Token: ${tokenContract}`);
                console.log(`📋 Found ${recipientsList.length} recipient(s)`);

                // Extract token symbol from contract (simplified - assumes last part is name)
                const tokenSymbol = tokenContract.includes('Wrapped-Bitcoin') ? 'sBTC'
                    : tokenContract.split('.').pop() || 'FT';

                // Determine decimals (8 for sBTC, 6 for most others)
                const decimals = tokenSymbol === 'sBTC' ? 8 : 6;

                // Calculate total amount
                const totalAmount = recipientsList.reduce((sum: number, r: any) => {
                    return sum + (typeof r.amount === 'number' ? r.amount : parseInt(r.amount || '0'));
                }, 0);

                // Save transfer
                const transferId = await db.insertTransfer({
                    tx_id: txId,
                    block_height: blockHeight,
                    timestamp,
                    sender_address: senderAddress,
                    transfer_type: 'FT',
                    token_contract: tokenContract,
                    total_amount: totalAmount,
                    recipient_count: recipientsList.length,
                    network,
                });

                console.log(`✅ Transfer saved with ID: ${transferId}`);

                // Process each recipient
                for (let i = 0; i < recipientsList.length; i++) {
                    const recipient = recipientsList[i];
                    const recipientAddress = recipient.to;
                    const amount = typeof recipient.amount === 'number' ? recipient.amount : parseInt(recipient.amount || '0');

                    // Convert to human-readable amount
                    const amountInTokens = amount / Math.pow(10, decimals);

                    // Save recipient
                    const recipientId = await db.insertRecipient({
                        transfer_id: transferId,
                        recipient_address: recipientAddress,
                        amount,
                        amount_decimals: amountInTokens,
                        position_in_list: i,
                    });

                    console.log(`💾 Recipient ${i + 1}: ${recipientAddress} - ${amountInTokens} ${tokenSymbol}`);

                    // Check if user has Telegram linked
                    const user = await db.getUserByAddress(recipientAddress);

                    if (user?.telegram_chat_id && user.notification_enabled) {
                        // Send Telegram notification
                        const messageId = await telegramService.sendTransferNotification({
                            chatId: user.telegram_chat_id,
                            recipientAddress,
                            amount: amountInTokens.toFixed(decimals),
                            tokenSymbol,
                            txId,
                            senderAddress,
                            network,
                        });

                        // Log notification
                        await db.insertNotification({
                            recipient_id: recipientId,
                            telegram_chat_id: user.telegram_chat_id,
                            message_text: `Received ${amountInTokens} ${tokenSymbol}`,
                            message_sent: messageId !== null,
                            telegram_message_id: messageId,
                        });

                        // Mark as sent
                        if (messageId) {
                            await db.markNotificationSent(recipientId);
                        }

                        console.log(`📱 Notification ${messageId ? 'sent' : 'failed'} to ${user.telegram_chat_id}`);
                    } else {
                        console.log(`ℹ️  No Telegram linked for ${recipientAddress}`);
                    }

                    // Add to activity feed
                    await db.insertActivityFeed({
                        user_address: recipientAddress,
                        event_type: 'received',
                        transfer_id: transferId,
                        recipient_id: recipientId,
                        metadata: {
                            amount: amountInTokens,
                            token: tokenSymbol,
                            from: senderAddress,
                            token_contract: tokenContract,
                        },
                    });
                }

                // Add sender activity
                await db.insertActivityFeed({
                    user_address: senderAddress,
                    event_type: 'sent',
                    transfer_id: transferId,
                    recipient_id: null,
                    metadata: {
                        recipient_count: recipientsList.length,
                        total_amount: totalAmount / Math.pow(10, decimals),
                        token: tokenSymbol,
                        token_contract: tokenContract,
                    },
                });
            }
        }

        console.log('🔍 ===== END WEBHOOK =====');
        res.status(200).json({ success: true });

    } catch (error: any) {
        console.error('❌ Webhook error:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({ error: 'Internal server error' });
    }
}
