import { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { telegramService } from '../../services/telegram.js';

export async function handleSTXTransferWebhook(req: Request, res: Response): Promise<void> {
    try {
        console.log('🔍 ===== STX TRANSFER WEBHOOK =====');
        console.log('Timestamp:', new Date().toISOString());
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        console.log('Body:', JSON.stringify(req.body, null, 2));

        const payload = req.body;

        // Send immediate 200 OK to acknowledge receipt
        res.status(200).json({ received: true });

        // Validate payload structure (but don't fail the request)
        if (!payload?.apply || !Array.isArray(payload.apply)) {
            console.log('⚠️  Unexpected payload structure - may be test ping');
            return;
        }


        const network = payload.chainhook?.network || 'unknown'; // 'mainnet' or 'testnet'

        // Process each block from apply array
        for (const block of payload.apply) {
            const blockHeight = block.block_identifier?.index;
            const timestamp = block.timestamp;
            const transactions = block.transactions || [];

            console.log(`📦 Block ${blockHeight}, ${transactions.length} transaction(s)`);

            // Process each transaction
            for (const tx of transactions) {
                const txId = tx.transaction_identifier?.hash;
                const success = tx.metadata?.success;
                const operations = tx.operations || [];

                console.log(`🔍 TX ${txId?.slice(0, 12)}... success=${success}`);

                if (!success) {
                    console.log('⚠️  Skipping failed transaction');
                    continue;
                }

                // CRITICAL: Parse contract call to extract function arguments
                const contractCallOp = operations.find(
                    (op: any) => op.type === 'CONTRACT_CALL' && op.metadata?.function_name === 'send-many-stx'
                );

                if (!contractCallOp) {
                    console.log('⚠️  No send-many-stx contract call found');
                    continue;
                }

                // Extract sender
                const senderAddress = contractCallOp.account?.address || tx.metadata?.sender;

                // Extract recipients list from decoded arguments
                const functionArgs = contractCallOp.metadata?.function_args_decoded || contractCallOp.metadata?.function_args;

                if (!functionArgs || !Array.isArray(functionArgs) || functionArgs.length === 0) {
                    console.log('⚠️  Missing or invalid function arguments');
                    continue;
                }

                // First argument is the recipients list
                const recipientsList = functionArgs[0];

                if (!Array.isArray(recipientsList)) {
                    console.log('⚠️  Recipients is not an array');
                    continue;
                }

                console.log(`📋 Found ${recipientsList.length} recipient(s)`);

                // Calculate total amount
                const totalAmount = recipientsList.reduce((sum: number, r: any) => {
                    return sum + (typeof r.ustx === 'number' ? r.ustx : parseInt(r.ustx || '0'));
                }, 0);

                // Save transfer to database
                const transferId = await db.insertTransfer({
                    tx_id: txId,
                    block_height: blockHeight,
                    timestamp,
                    sender_address: senderAddress,
                    transfer_type: 'STX',
                    token_contract: null,
                    total_amount: totalAmount,
                    recipient_count: recipientsList.length,
                    network,
                });

                console.log(`✅ Transfer saved with ID: ${transferId}`);

                // Process each recipient
                for (let i = 0; i < recipientsList.length; i++) {
                    const recipient = recipientsList[i];
                    const recipientAddress = recipient.to;
                    const amount = typeof recipient.ustx === 'number' ? recipient.ustx : parseInt(recipient.ustx || '0');

                    // Convert microSTX to STX
                    const amountInSTX = amount / 1_000_000;

                    // Save recipient
                    const recipientId = await db.insertRecipient({
                        transfer_id: transferId,
                        recipient_address: recipientAddress,
                        amount,
                        amount_decimals: amountInSTX,
                        position_in_list: i,
                    });

                    console.log(`💾 Recipient ${i + 1}: ${recipientAddress} - ${amountInSTX} STX`);

                    // Check if user has Telegram linked
                    const user = await db.getUserByAddress(recipientAddress);

                    if (user?.telegram_chat_id && user.notification_enabled) {
                        // Send Telegram notification
                        const messageId = await telegramService.sendTransferNotification({
                            chatId: user.telegram_chat_id,
                            recipientAddress,
                            amount: amountInSTX.toFixed(6),
                            tokenSymbol: 'STX',
                            txId,
                            senderAddress,
                            network,
                        });

                        // Log notification
                        await db.insertNotification({
                            recipient_id: recipientId,
                            telegram_chat_id: user.telegram_chat_id,
                            message_text: `Received ${amountInSTX} STX`,
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
                            amount: amountInSTX,
                            token: 'STX',
                            from: senderAddress,
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
                        total_amount: totalAmount / 1_000_000,
                        token: 'STX',
                    },
                });
            }
        }


        console.log('🔍 ===== END WEBHOOK =====');
        // Response already sent at the beginning

    } catch (error: any) {
        console.error('❌ Webhook error:', error);
        console.error('Stack:', error.stack);
        // Don't send response - already sent at the beginning
    }
}
