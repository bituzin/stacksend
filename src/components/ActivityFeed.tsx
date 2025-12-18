import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, ExternalLink, Loader2 } from 'lucide-react';
import { backendAPI, type ActivityEvent } from '../lib/backend-api';

interface ActivityFeedProps {
    walletAddress: string | null;
}

export function ActivityFeed({ walletAddress }: ActivityFeedProps) {
    const [activity, setActivity] = useState<ActivityEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (walletAddress) {
            loadActivity();
        }
    }, [walletAddress]);

    const loadActivity = async () => {
        if (!walletAddress) return;

        setLoading(true);
        setError(null);

        try {
            const events = await backendAPI.getUserActivity(walletAddress, 50);
            setActivity(events);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatAmount = (event: ActivityEvent) => {
        if (event.amount_decimals) {
            return event.amount_decimals.toFixed(6);
        }
        return event.amount?.toString() || '0';
    };

    const getTokenSymbol = (event: ActivityEvent) => {
        if (event.transfer_type === 'STX') {
            return 'STX';
        }

        if (event.token_contract?.includes('Wrapped-Bitcoin')) {
            return 'sBTC';
        }

        return event.token_contract?.split('.').pop() || 'FT';
    };

    const getExplorerUrl = (txId: string, network: string) => {
        const baseUrl = 'https://explorer.hiro.so/txid';
        return network === 'mainnet'
            ? `${baseUrl}/${txId}`
            : `${baseUrl}/${txId}?chain=testnet`;
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
    };

    if (!walletAddress) {
        return (
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
                <p className="text-gray-400">Connect your wallet to view transfer history</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">Transfer Activity</h3>
                        <p className="text-sm text-gray-400">Your recent StackSend transactions</p>
                    </div>
                    <button
                        onClick={loadActivity}
                        disabled={loading}
                        className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition-all disabled:opacity-50"
                    >
                        <Loader2 className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="p-4 m-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && activity.length === 0 && (
                <div className="p-12 text-center">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
                    <p className="text-gray-400">Loading activity...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && activity.length === 0 && !error && (
                <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ArrowUpRight className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-gray-400 mb-2">No transfer activity yet</p>
                    <p className="text-sm text-gray-500">Your received and sent transfers will appear here</p>
                </div>
            )}

            {/* Activity List */}
            {activity.length > 0 && (
                <div className="divide-y divide-gray-700/50">
                    {activity.map((event) => (
                        <div
                            key={event.id}
                            className="p-4 hover:bg-gray-800/30 transition-colors"
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className={`p-2 rounded-lg ${event.event_type === 'received'
                                    ? 'bg-green-500/10 text-green-400'
                                    : 'bg-blue-500/10 text-blue-400'
                                    }`}>
                                    {event.event_type === 'received' ? (
                                        <ArrowDownRight className="w-5 h-5" />
                                    ) : (
                                        <ArrowUpRight className="w-5 h-5" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-semibold text-white mb-1">
                                                {event.event_type === 'received' ? 'Received' : 'Sent'}{' '}
                                                <span className="text-blue-400">
                                                    {formatAmount(event)} {getTokenSymbol(event)}
                                                </span>
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {event.event_type === 'received' ? 'From' : 'To'}{' '}
                                                <code className="px-1.5 py-0.5 bg-gray-800 rounded text-xs">
                                                    {formatAddress(event.sender_address)}
                                                </code>
                                            </p>
                                            {event.event_type === 'sent' && event.metadata?.recipient_count && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {event.metadata.recipient_count} recipient{event.metadata.recipient_count > 1 ? 's' : ''}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 mb-1">
                                                {formatDate(event.created_at)}
                                            </p>
                                            <span className={`text-xs px-2 py-1 rounded ${event.network === 'mainnet'
                                                ? 'bg-purple-500/10 text-purple-400'
                                                : 'bg-orange-500/10 text-orange-400'
                                                }`}>
                                                {event.network}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Transaction Link */}
                                    <a
                                        href={getExplorerUrl(event.tx_id, event.network)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        View transaction
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Show More */}
            {activity.length >= 50 && (
                <div className="p-4 border-t border-gray-700/50 text-center">
                    <p className="text-sm text-gray-400">Showing most recent 50 transfers</p>
                </div>
            )}
        </div>
    );
}
