import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter, TorusWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface UserProfile {
  walletAddress: string;
  avatar: string;
  name: string;
  createdAt: Date;
}

interface WalletContextType {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  isConnected: boolean;
  walletAddress: string | null;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: React.FC<WalletContextProviderProps> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { publicKey, connected, disconnect } = useWallet();

  const walletAddress = publicKey?.toBase58() || null;
  const isConnected = connected;

  // Load user profile from localStorage on mount
  useEffect(() => {
    if (walletAddress) {
      const savedProfile = localStorage.getItem(`userProfile_${walletAddress}`);
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        // Create default profile for new users
        const defaultProfile: UserProfile = {
          walletAddress,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`,
          name: `User_${walletAddress.slice(0, 8)}`,
          createdAt: new Date(),
        };
        setUserProfile(defaultProfile);
        localStorage.setItem(`userProfile_${walletAddress}`, JSON.stringify(defaultProfile));
      }
    } else {
      setUserProfile(null);
    }
  }, [walletAddress]);

  // Save profile changes to localStorage
  const updateUserProfile = (profile: UserProfile | null) => {
    setUserProfile(profile);
    if (profile && walletAddress) {
      localStorage.setItem(`userProfile_${walletAddress}`, JSON.stringify(profile));
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    disconnect();
    setUserProfile(null);
  };

  return (
    <WalletContext.Provider
      value={{
        userProfile,
        setUserProfile: updateUserProfile,
        isConnected,
        walletAddress,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

interface AppWalletProviderProps {
  children: ReactNode;
}

export const AppWalletProvider: React.FC<AppWalletProviderProps> = ({ children }) => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = clusterApiUrl(network);

  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network }),
    new TorusWalletAdapter(),
  ];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletContextProvider>
            {children}
          </WalletContextProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};