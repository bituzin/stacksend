import { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { telegramService } from '../../services/telegram.js';

export async function handleSTXTransferWebhook(req: Request, res: Response): Promise<void> {
    try {
        const payload = req.body;

        // Send immediate 200 OK to acknowledge receipt
        res.status(200).json({ received: true });

        console.log('📥 STX Webhook received');

        // Validate payload structure (but don't fail the request)
        if (!payload?.apply || !Array.isArray(payload.apply)) {
            console.warn('⚠️  Invalid payload structure');
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

                // Check if this is a send-many-stx call by examining metadata.description
                const description = tx.metadata?.description || '';
                if (!description.includes('send-many-stx')) {
                    console.log('⚠️  Not a send-many-stx transaction');
                    continue;
                }

                console.log('✅ Found send-many-stx call!');

                // Extract sender from metadata
                const senderAddress = tx.metadata?.sender;
                if (!senderAddress) {
                    console.log('❌ No sender address found');
                    continue;
                }

                // Parse recipients from operations (CREDIT operations)
                const creditOps = operations.filter((op: any) => op.type === 'CREDIT');

                console.log(`📊 Found ${creditOps.length} CREDIT operations`);

                const recipients: Array<{ address: string; amount: number }> = [];
                let totalAmount = 0;

                // Extract recipients from CREDIT operations
                for (const op of creditOps) {
                    const recipient = op.account?.address;
                    const amount = parseInt(op.amount?.value || '0');

                    // Filter out non-STX transfers and sender receiving change
                    if (recipient && amount > 0 && op.amount?.currency?.symbol === 'STX' && recipient !== senderAddress) {
                        recipients.push({ address: recipient, amount });
                        totalAmount += amount;
                    }
                }

                if (recipients.length === 0) {
                    console.log('⚠️  No valid recipients found');
                    continue;
                }

                console.log(`📋 Parsed ${recipients.length} recipient(s), total: ${totalAmount} µSTX`);

                // Save transfer to database
                const transferId = await db.insertTransfer({
                    tx_id: txId,
                    block_height: blockHeight,
                    timestamp,
                    sender_address: senderAddress,
                    transfer_type: 'STX',
                    token_contract: null,
                    total_amount: totalAmount,
                    recipient_count: recipients.length,
                    network,
                });

                console.log(`✅ Transfer saved with ID: ${transferId}`);

                // Process each recipient
                for (let i = 0; i < recipients.length; i++) {
                    const { address: recipientAddress, amount } = recipients[i];

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
                        recipient_count: recipients.length,
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
