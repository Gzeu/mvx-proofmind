import React, { useState, useEffect } from 'react';
import { Wallet, Smartphone, Monitor, Usb, LogOut, Copy, ExternalLink } from 'lucide-react';
import { WalletInfo } from '@/types';
import blockchainService from '@/services/blockchain';
import toast from 'react-hot-toast';

interface WalletConnectProps {
  onWalletChange: (wallet: WalletInfo | null) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onWalletChange }) => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if wallet is already connected (from localStorage or previous session)
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    try {
      // Check localStorage for previous connection
      const savedWallet = localStorage.getItem('mvx-proofmind-wallet');
      if (savedWallet) {
        const walletInfo = JSON.parse(savedWallet);
        setWallet(walletInfo);
        onWalletChange(walletInfo);
      }
    } catch (error) {
      console.error('Error checking existing connection:', error);
    }
  };

  const connectWallet = async (providerType: 'web' | 'extension' | 'walletconnect' | 'hardware') => {
    setConnecting(true);
    try {
      const walletInfo = await blockchainService.connectWallet(providerType);
      setWallet(walletInfo);
      onWalletChange(walletInfo);
      
      // Save to localStorage
      localStorage.setItem('mvx-proofmind-wallet', JSON.stringify(walletInfo));
      
      toast.success(`Connected to ${providerType} wallet successfully!`);
      setShowModal(false);
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await blockchainService.disconnectWallet();
      setWallet(null);
      onWalletChange(null);
      
      // Clear localStorage
      localStorage.removeItem('mvx-proofmind-wallet');
      
      toast.success('Wallet disconnected successfully!');
    } catch (error: any) {
      console.error('Wallet disconnection error:', error);
      toast.error(error.message || 'Failed to disconnect wallet');
    }
  };

  const copyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      toast.success('Address copied to clipboard!');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatBalance = (balance: string) => {
    const egldBalance = parseFloat(balance) / Math.pow(10, 18);
    return egldBalance.toFixed(4);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'web':
        return <Monitor className="w-5 h-5" />;
      case 'extension':
        return <Smartphone className="w-5 h-5" />;
      case 'walletconnect':
        return <Smartphone className="w-5 h-5" />;
      case 'hardware':
        return <Usb className="w-5 h-5" />;
      default:
        return <Wallet className="w-5 h-5" />;
    }
  };

  if (wallet) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              {getProviderIcon(wallet.provider)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900">
                  {formatAddress(wallet.address)}
                </span>
                <button
                  onClick={copyAddress}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copy address"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <a
                  href={`${blockchainService.getConfig().explorerUrl}/accounts/${wallet.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="View on Explorer"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <p className="text-xs text-gray-500">
                Balance: {formatBalance(wallet.balance)} EGLD
              </p>
            </div>
          </div>
          <button
            onClick={disconnectWallet}
            className="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        <Wallet className="w-5 h-5 mr-2" />
        Connect Wallet
      </button>

      {/* Wallet Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Connect Wallet</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => connectWallet('web')}
                disabled={connecting}
                className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Monitor className="w-6 h-6 text-primary-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Web Wallet</div>
                  <div className="text-sm text-gray-500">Connect via web interface</div>
                </div>
              </button>

              <button
                onClick={() => connectWallet('extension')}
                disabled={connecting}
                className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Smartphone className="w-6 h-6 text-primary-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Browser Extension</div>
                  <div className="text-sm text-gray-500">DeFi Wallet or MultiversX Extension</div>
                </div>
              </button>

              <button
                onClick={() => connectWallet('walletconnect')}
                disabled={connecting}
                className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Smartphone className="w-6 h-6 text-primary-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">WalletConnect</div>
                  <div className="text-sm text-gray-500">Connect mobile wallet via QR code</div>
                </div>
              </button>

              <button
                onClick={() => connectWallet('hardware')}
                disabled={connecting}
                className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Usb className="w-6 h-6 text-primary-600 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Hardware Wallet</div>
                  <div className="text-sm text-gray-500">Ledger or other hardware devices</div>
                </div>
              </button>
            </div>

            {connecting && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                  <span className="text-sm text-gray-600">Connecting...</span>
                </div>
              </div>
            )}

            <div className="mt-6 text-xs text-gray-500 text-center">
              By connecting a wallet, you agree to our Terms of Service and Privacy Policy.
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WalletConnect;