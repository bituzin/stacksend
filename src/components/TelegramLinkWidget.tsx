import { useState, useEffect } from 'react';
import { Bell, BellOff, ExternalLink } from 'lucide-react';
import { backendAPI } from '../lib/backend-api';

interface TelegramLinkWidgetProps {
    walletAddress: string | null;
}

export function TelegramLinkWidget({ walletAddress }: TelegramLinkWidgetProps) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (walletAddress) {
            loadUser();
        }
    }, [walletAddress]);

    const loadUser = async () => {
        if (!walletAddress) return;

        try {
            const userData = await backendAPI.getUser(walletAddress);
            setUser(userData);
        } catch (err: any) {
            console.error('Failed to load user:', err);
        }
    };

    const toggleNotifications = async () => {
        if (!walletAddress || !user) return;

        setLoading(true);
        setError(null);

        try {
            await backendAPI.setNotificationEnabled(walletAddress, !user.notification_enabled);
            await loadUser();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!walletAddress) {
        return null;
    }

    const isTelegramLinked = user?.telegram_chat_id;

    return (
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">Telegram Notifications</h3>
                    <p className="text-sm text-gray-400">Get instant alerts when you receive transfers</p>
                </div>
                {isTelegramLinked && (
                    <button
                        onClick={toggleNotifications}
                        disabled={loading}
                        className={`p-2 rounded-lg transition-all ${user.notification_enabled
                            ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                            : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                            }`}
                        title={user.notification_enabled ? 'Notifications enabled' : 'Notifications disabled'}
                    >
                        {user.notification_enabled ? (
                            <Bell className="w-5 h-5" />
                        ) : (
                            <BellOff className="w-5 h-5" />
                        )}
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            {isTelegramLinked ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-green-400 font-semibold">Connected</span>
                            </div>
                            {user.telegram_username && (
                                <p className="text-sm text-gray-400">@{user.telegram_username}</p>
                            )}
                        </div>
                        <div className="text-right">
                            <span className={`text-sm ${user.notification_enabled ? 'text-blue-400' : 'text-gray-500'}`}>
                                {user.notification_enabled ? 'Notifications ON' : 'Notifications OFF'}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-sm text-gray-300 mb-2">
                            ✅ You'll receive notifications when you receive STX or fungible tokens via StackSend
                        </p>
                        <p className="text-xs text-gray-500">
                            Connected on {new Date(user.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-sm text-blue-300 mb-3">
                            Link your Telegram to receive instant notifications when you receive transfers!
                        </p>
                        <ol className="text-sm text-gray-300 space-y-2 ml-4 list-decimal">
                            <li>Open Telegram and search for our bot</li>
                            <li>Send <code className="px-2 py-1 bg-gray-800 rounded text-blue-400">/start</code></li>
                            <li>Follow the instructions to link your wallet</li>
                        </ol>
                    </div>

                    <a
                        href={`https://t.me/${import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'stacksendbot'}?start=${walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-blue-500/50"
                    >
                        Open Telegram Bot
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            )}
        </div>
    );
}
