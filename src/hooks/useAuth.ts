import { connect, disconnect, isConnected, getLocalStorage, request } from '@stacks/connect';
import { createNetwork } from '@stacks/network';
import type { StacksNetwork } from '@stacks/network';
import { useState, useEffect, useCallback } from 'react';

// Types for the stored address data
interface StoredAddresses {
    addresses?: {
        stx?: Array<{ address: string; publicKey?: string }>;
        btc?: Array<{ address: string; publicKey?: string }>;
    };
}

interface AuthState {
    isAuthenticated: boolean;
    stxAddress: string | null;
    btcAddress: string | null;
    publicKey: string | null;
}

export const useAuth = () => {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        stxAddress: null,
        btcAddress: null,
        publicKey: null,
    });
    const [network, setNetwork] = useState<StacksNetwork>(createNetwork('mainnet'));
    const [loading, setLoading] = useState(false);

    // Check initial connection state on mount
    useEffect(() => {
        const checkConnection = () => {
            if (isConnected()) {
                const data = getLocalStorage() as StoredAddresses | null;
                if (data?.addresses?.stx?.[0]) {
                    const address = data.addresses.stx[0].address;
                    setAuthState({
                        isAuthenticated: true,
                        stxAddress: address,
                        btcAddress: data.addresses.btc?.[0]?.address || null,
                        publicKey: data.addresses.stx[0].publicKey || null,
                    });

                    // Auto-detect network from address prefix
                    // ST = testnet, SP = mainnet
                    if (address.startsWith('ST')) {
                        setNetwork(createNetwork('testnet'));
                    } else if (address.startsWith('SP')) {
                        setNetwork(createNetwork('mainnet'));
                    }
                }
            }
        };
        checkConnection();
    }, []);

    // Connect wallet using the new @stacks/connect API
    const authenticate = useCallback(async () => {
        setLoading(true);
        try {
            // The connect() function opens wallet selector and requests addresses
            const response = await connect();

            // After connect, get the stored data
            const data = getLocalStorage() as StoredAddresses | null;

            if (data?.addresses?.stx?.[0]) {
                const address = data.addresses.stx[0].address;
                setAuthState({
                    isAuthenticated: true,
                    stxAddress: address,
                    btcAddress: data.addresses.btc?.[0]?.address || null,
                    publicKey: data.addresses.stx[0].publicKey || null,
                });

                // Auto-detect network from address prefix
                if (address.startsWith('ST')) {
                    setNetwork(createNetwork('testnet'));
                } else if (address.startsWith('SP')) {
                    setNetwork(createNetwork('mainnet'));
                }
            }

            return response;
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // Disconnect wallet
    const signOut = useCallback(() => {
        disconnect();
        setAuthState({
            isAuthenticated: false,
            stxAddress: null,
            btcAddress: null,
            publicKey: null,
        });
    }, []);

    // Helper to get current STX address
    const getStxAddress = useCallback(async () => {
        try {
            const response = await request('stx_getAddresses');
            return response;
        } catch (error) {
            console.error('Failed to get STX addresses:', error);
            throw error;
        }
    }, []);

    return {
        // Auth state
        isAuthenticated: authState.isAuthenticated,
        stxAddress: authState.stxAddress,
        btcAddress: authState.btcAddress,
        publicKey: authState.publicKey,
        loading,

        // For backwards compatibility with existing code
        userData: authState.isAuthenticated ? {
            stxAddress: authState.stxAddress,
            btcAddress: authState.btcAddress,
            publicKey: authState.publicKey,
        } : null,

        // Actions
        authenticate,
        disconnect: signOut,
        getStxAddress,

        // Network
        network,
        setNetwork,
    };
};
