import { useState } from 'react';
import { createNetwork } from '@stacks/network';
import { useAuth } from '../hooks/useAuth';
import { Globe, TestTube } from 'lucide-react';

export const NetworkToggle: React.FC = () => {
    const { setNetwork } = useAuth();
    const [isMainnet, setIsMainnet] = useState(true);

    const toggle = () => {
        const newNetwork = isMainnet ? createNetwork('testnet') : createNetwork('mainnet');
        setNetwork(newNetwork);
        setIsMainnet(!isMainnet);
    };

    return (
        <button
            onClick={toggle}
            className="btn-ghost text-sm"
            style={{
                color: isMainnet ? 'var(--success)' : 'var(--warning)',
            }}
        >
            {isMainnet ? (
                <>
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline">Mainnet</span>
                </>
            ) : (
                <>
                    <TestTube className="w-4 h-4" />
                    <span className="hidden sm:inline">Testnet</span>
                </>
            )}
        </button>
    );
};
