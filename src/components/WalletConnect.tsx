import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Wallet, ArrowRight, Zap, Shield, Users, Loader2, Layers, Sun, Moon, LogIn } from 'lucide-react';

interface WalletConnectProps {
    onEnterApp?: () => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ onEnterApp }) => {
    const { authenticate, loading, isAuthenticated, stxAddress } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const saved = localStorage.getItem('theme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        setTheme(saved);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const handleConnect = async () => {
        setError(null);
        setIsConnecting(true);
        try {
            await authenticate();
            // If onEnterApp is provided and we successfully connected, enter the app
            if (onEnterApp) {
                onEnterApp();
            }
        } catch (err: any) {
            console.error('Connection error:', err);
            setError(err?.message || 'Failed to connect wallet. Please try again.');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleEnterApp = () => {
        if (onEnterApp) {
            onEnterApp();
        }
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-6 relative"
            style={{ backgroundColor: 'var(--bg-primary)' }}
        >
            {/* Theme Toggle - Top Right */}
            <button
                onClick={toggleTheme}
                className="absolute top-6 right-6 btn-ghost"
                aria-label="Toggle theme"
            >
                {theme === 'dark' ? (
                    <Sun className="w-5 h-5" />
                ) : (
                    <Moon className="w-5 h-5" />
                )}
            </button>

            <div className="max-w-2xl w-full text-center animate-slide-up">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-orange-500/30">
                        <Layers className="w-10 h-10 text-white" />
                    </div>
                </div>

                {/* Title */}
                <h1
                    className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4"
                    style={{ color: 'var(--text-primary)' }}
                >
                    Stack<span style={{ color: 'var(--accent-orange)' }}>Send</span>
                </h1>

                {/* Subtitle */}
                <p
                    className="text-lg sm:text-xl max-w-lg mx-auto mb-10 leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    Send STX and SIP-010 tokens to multiple recipients in a single transaction.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                    {isAuthenticated ? (
                        <>
                            {/* Authenticated user - show Go to App button */}
                            <button
                                onClick={handleEnterApp}
                                className="btn-primary text-lg px-8 py-4"
                                style={{
                                    boxShadow: '0 10px 40px -10px rgba(249, 115, 22, 0.5)',
                                }}
                            >
                                <LogIn className="w-5 h-5" />
                                <span>Go to App</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                            <div
                                className="flex items-center gap-2 px-6 py-3 rounded-xl"
                                style={{ backgroundColor: 'var(--bg-tertiary)' }}
                            >
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                                    {stxAddress?.slice(0, 8)}...{stxAddress?.slice(-6)}
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Not authenticated - show Connect Wallet button */}
                            <button
                                onClick={handleConnect}
                                disabled={isConnecting || loading}
                                className="btn-primary text-lg px-8 py-4"
                                style={{
                                    boxShadow: '0 10px 40px -10px rgba(249, 115, 22, 0.5)',
                                }}
                            >
                                {isConnecting || loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Connecting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Wallet className="w-5 h-5" />
                                        <span>Connect Wallet</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                            <a
                                href="https://stacks.co"
                                target="_blank"
                                rel="noreferrer"
                                className="btn-secondary text-lg px-8 py-4"
                            >
                                Learn about Stacks
                            </a>
                        </>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div
                        className="p-4 rounded-xl max-w-md mx-auto mb-8 text-left"
                        style={{
                            backgroundColor: 'var(--error-light)',
                            color: 'var(--error)'
                        }}
                    >
                        <p className="text-sm font-medium">{error}</p>
                        <p className="text-xs mt-2 opacity-80">
                            Make sure you have a Stacks wallet installed (e.g., Leather or Xverse).
                        </p>
                    </div>
                )}

                {/* Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <div
                        className="card card-hover p-6 text-center transition-all"
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                            style={{
                                backgroundColor: 'var(--accent-orange-light)',
                                color: 'var(--accent-orange)'
                            }}
                        >
                            <Zap className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Efficient</h3>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            Batch up to 50 transfers in a single transaction
                        </p>
                    </div>

                    <div
                        className="card card-hover p-6 text-center transition-all"
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                            style={{
                                backgroundColor: 'var(--success-light)',
                                color: 'var(--success)'
                            }}
                        >
                            <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Secure</h3>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            Powered by Clarity smart contracts
                        </p>
                    </div>

                    <div
                        className="card card-hover p-6 text-center transition-all"
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                            style={{
                                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                color: '#8b5cf6'
                            }}
                        >
                            <Users className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>User Friendly</h3>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            Easy copy-paste support for addresses
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="fixed bottom-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                Built on Stacks · Secured by Bitcoin
            </div>
        </div>
    );
};
