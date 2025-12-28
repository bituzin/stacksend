import { connect, disconnect, isConnected, getLocalStorage, request } from '@stacks/connect';
import { createNetwork } from '@stacks/network';
import type { StacksNetwork } from '@stacks/network';
import { useState, useEffect, useCallback } from 'react';
import { reownModal, isReownConfigured } from '../config/reown-config';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';

// Types for the stored address data
interface StoredAddresses {
    addresses?: {
        stx?: Array<{ address: string; publicKey?: string }>;
        btc?: Array<{ address: string; publicKey?: string }>;
    };
}

type WalletType = 'stacks' | 'bitcoin' | null;

interface AuthState {
    isAuthenticated: boolean;
    stxAddress: string | null;
    btcAddress: string | null;
    publicKey: string | null;
    walletType: WalletType;
}

export const useAuth = () => {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        stxAddress: null,
        btcAddress: null,
        publicKey: null,
        walletType: null,
    });
    const [network, setNetwork] = useState<StacksNetwork>(createNetwork('mainnet'));
    const [loading, setLoading] = useState(false);

    // Reown AppKit hooks for Bitcoin wallet
    const { address: reownAddress, isConnected: isReownConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider('bip122');

    // Check initial connection state on mount
    useEffect(() => {
        const checkConnection = () => {
            // Check Stacks connection
            if (isConnected()) {
                const data = getLocalStorage() as StoredAddresses | null;
                if (data?.addresses?.stx?.[0]) {
                    const address = data.addresses.stx[0].address;
                    setAuthState({
                        isAuthenticated: true,
                        stxAddress: address,
                        btcAddress: data.addresses.btc?.[0]?.address || null,
                        publicKey: data.addresses.stx[0].publicKey || null,
                        walletType: 'stacks',
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

    // Monitor Reown Bitcoin wallet connection
    useEffect(() => {
        if (isReownConnected && reownAddress) {
            setAuthState(prev => ({
                ...prev,
                isAuthenticated: true,
                btcAddress: reownAddress,
                walletType: 'bitcoin',
            }));
        } else if (!isReownConnected && authState.walletType === 'bitcoin') {
            // Bitcoin wallet disconnected
            setAuthState({
                isAuthenticated: false,
                stxAddress: null,
                btcAddress: null,
                publicKey: null,
                walletType: null,
            });
        }
    }, [isReownConnected, reownAddress, authState.walletType]);

    // Connect Stacks wallet using @stacks/connect API
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
                    walletType: 'stacks',
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
            console.error('Failed to connect Stacks wallet:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // Connect Bitcoin wallet using Reown AppKit
    const connectBitcoin = useCallback(async () => {
        if (!isReownConfigured()) {
            throw new Error('Reown is not configured. Please add VITE_REOWN_PROJECT_ID to your .env file.');
        }

        setLoading(true);
        try {
            // Open Reown modal for Bitcoin wallet connection
            await reownModal?.open();
            // State will be updated by the useEffect monitoring isReownConnected
        } catch (error) {
            console.error('Failed to connect Bitcoin wallet:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    // Disconnect wallet
    const signOut = useCallback(async () => {
        // Disconnect based on wallet type
        if (authState.walletType === 'stacks') {
            disconnect();
        } else if (authState.walletType === 'bitcoin') {
            await reownModal?.disconnect();
        }

        setAuthState({
            isAuthenticated: false,
            stxAddress: null,
            btcAddress: null,
            publicKey: null,
            walletType: null,
        });
    }, [authState.walletType]);

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
        walletType: authState.walletType,
        loading,

        // For backwards compatibility with existing code
        userData: authState.isAuthenticated ? {
            stxAddress: authState.stxAddress,
            btcAddress: authState.btcAddress,
            publicKey: authState.publicKey,
        } : null,

        // Actions
        authenticate, // Stacks wallet connection
        connectBitcoin, // Bitcoin wallet connection via Reown
        disconnect: signOut,
        getStxAddress,

        // Network
        network,
        setNetwork,

        // Reown helpers
        isReownConfigured: isReownConfigured(),
        walletProvider, // Bitcoin wallet provider from Reown
    };
};
