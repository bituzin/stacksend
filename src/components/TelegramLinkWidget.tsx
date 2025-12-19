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
        <div className="card p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Telegram Notifications</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Get instant alerts when you receive transfers</p>
                </div>
                {isTelegramLinked && (
                    <button
                        onClick={toggleNotifications}
                        disabled={loading}
                        className="p-2 rounded-lg transition-all"
                        style={{
                            backgroundColor: user.notification_enabled ? 'var(--accent-orange-light)' : 'var(--bg-tertiary)',
                            color: user.notification_enabled ? 'var(--accent-orange)' : 'var(--text-muted)'
                        }}
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
                <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--error-light)', border: '1px solid var(--error)', color: 'var(--error)' }}>
                    {error}
                </div>
            )}

            {isTelegramLinked ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--success-light)', border: `1px solid var(--success)` }}>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--success)' }} />
                                <span className="font-semibold" style={{ color: 'var(--success)' }}>Connected</span>
                            </div>
                            {user.telegram_username && (
                                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>@{user.telegram_username}</p>
                            )}
                        </div>
                        <div className="text-right">
                            <span className="text-sm" style={{ color: user.notification_enabled ? 'var(--accent-orange)' : 'var(--text-muted)' }}>
                                {user.notification_enabled ? 'Notifications ON' : 'Notifications OFF'}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                            ✅ You'll receive notifications when you receive STX or fungible tokens via StackSend
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Connected on {new Date(user.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--accent-orange-light)', border: `1px solid var(--accent-orange)` }}>
                        <p className="text-sm mb-3" style={{ color: 'var(--accent-orange)' }}>
                            Link your Telegram to receive instant notifications when you receive transfers!
                        </p>
                        <ol className="text-sm space-y-2 ml-4 list-decimal" style={{ color: 'var(--text-primary)' }}>
                            <li>Open Telegram and search for our bot</li>
                            <li>Send <code className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent-orange)' }}>/start</code></li>
                            <li>Follow the instructions to link your wallet</li>
                        </ol>
                    </div>

                    <a
                        href={`https://t.me/${import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'stacksendbot'}?start=${walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary flex items-center justify-center gap-2 w-full"
                    >
                        Open Telegram Bot
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            )}
        </div>
    );
}
