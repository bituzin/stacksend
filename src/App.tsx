import { useEffect, useState, useCallback } from 'react';
import { RecipientTable } from './components/RecipientTable';
import { WalletConnect } from './components/WalletConnect';
import { NetworkToggle } from './components/NetworkToggle';
import { PlanSelector } from './components/PlanSelector';
import { TelegramLinkWidget } from './components/TelegramLinkWidget';
import { ActivityFeed } from './components/ActivityFeed';
import { useAuth } from './hooks/useAuth';
import { getContractAddress } from './utils/constants';
import { Sun, Moon, LogOut, Layers, Home } from 'lucide-react';

function App() {
  const [theme, setTheme] = useState('light');
  const [maxRecipients, setMaxRecipients] = useState(5);
  const [showLanding, setShowLanding] = useState(true);
  const { isAuthenticated, stxAddress, disconnect, network } = useAuth();

  // Determine if we're on mainnet based on network chainId
  const isMainnet = network?.chainId !== 2147483648; // testnet chainId
  const contractAddress = getContractAddress(isMainnet);

  useEffect(() => {
    const saved = localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(saved);
    applyTheme(saved);
  }, []);

  // Auto-sync landing state: if user was on landing and becomes authenticated,
  // keep them on landing (they can manually click Go to App)
  // But if showLanding is false and they're not authenticated, show landing
  useEffect(() => {
    if (!isAuthenticated && !showLanding) {
      console.log('🔄 User lost authentication, showing landing');
      setShowLanding(true);
    }
  }, [isAuthenticated, showLanding]);

  const applyTheme = (newTheme: string) => {
    document.documentElement.setAttribute('data-theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const handleEnterApp = useCallback(() => {
    console.log('📱 App.handleEnterApp called, setting showLanding to false');
    setShowLanding(false);
  }, []);

  const handleGoToLanding = useCallback(() => {
    setShowLanding(true);
  }, []);

  console.log('🔍 App render:', { showLanding, isAuthenticated, stxAddress: stxAddress?.slice(0, 8) });

  // Show landing page if explicitly requested OR if not authenticated
  if (showLanding || !isAuthenticated) {
    console.log('📄 Rendering WalletConnect because:', { showLanding, isAuthenticated });
    return <WalletConnect key={isAuthenticated ? 'authenticated' : 'unauthenticated'} onEnterApp={handleEnterApp} />;
  }

  console.log('🎯 Rendering main app');

  // Scroll to top when entering app to ensure proper render
  useEffect(() => {
    if (!showLanding && isAuthenticated) {
      console.log('📜 Scrolling to top');
      window.scrollTo(0, 0);
    }
  }, [showLanding, isAuthenticated]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md border-b"
        style={{
          backgroundColor: 'var(--bg-header)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md flex-shrink-0">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold truncate" style={{ color: 'var(--text-primary)' }}>StackSend</h1>
                {stxAddress && (
                  <p
                    className="text-xs font-mono hidden sm:block"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {stxAddress.slice(0, 6)}...{stxAddress.slice(-4)}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="hidden sm:flex items-center gap-2">
                <NetworkToggle />
                <PlanSelector onPlanChange={setMaxRecipients} />
              </div>

              {/* Home - Go to Landing */}
              <button
                onClick={handleGoToLanding}
                className="btn-ghost"
                aria-label="Go to home"
                title="Go to landing page"
              >
                <Home className="w-5 h-5" />
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="btn-ghost"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* Disconnect */}
              <button
                onClick={disconnect}
                className="btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                aria-label="Disconnect wallet"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile-only second row for Network and Plan */}
          <div className="flex sm:hidden items-center gap-2 pb-2">
            <NetworkToggle />
            <PlanSelector onPlanChange={setMaxRecipients} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Plan Info Card */}
        <div
          className="card p-4 mb-6 flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-orange-light)' }}
            >
              <Layers className="w-5 h-5" style={{ color: 'var(--accent-orange)' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Current Plan Limit
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                You can send to up to <strong className="font-semibold" style={{ color: 'var(--accent-orange)' }}>{maxRecipients}</strong> recipients per transaction
              </p>
            </div>
          </div>
        </div>

        {/* Recipient Table */}
        <div className="card" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <RecipientTable contractAddress={contractAddress} maxRecipients={maxRecipients} />
        </div>

        {/* Telegram Notifications */}
        <div className="mt-8">
          <TelegramLinkWidget walletAddress={stxAddress} />
        </div>

        {/* Activity Feed */}
        <div className="mt-8">
          <ActivityFeed walletAddress={stxAddress} />
        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t py-6 mt-auto"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Built on Stacks • Secured by Bitcoin
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
