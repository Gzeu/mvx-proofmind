import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Brain, Plus, Menu, X, Home, FileText, BarChart3, Settings } from 'lucide-react';
import Dashboard from './components/Dashboard';
import WalletConnect from './components/WalletConnect';
import CertificateForm from './components/CertificateForm';
import { WalletInfo, CertificateData } from './types';
import blockchainService from './services/blockchain';

type View = 'dashboard' | 'certificates' | 'analytics' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [showCertificateForm, setShowCertificateForm] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<CertificateData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (wallet?.address) {
      loadUserCertificates();
    }
  }, [wallet]);

  const loadUserCertificates = async () => {
    if (!wallet?.address) return;
    
    try {
      setLoading(true);
      const userCerts = await blockchainService.getUserCertificates(wallet.address);
      setCertificates(userCerts);
    } catch (error) {
      console.error('Error loading certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCertificateSuccess = () => {
    loadUserCertificates();
    setEditingCertificate(null);
  };

  const handleEditCertificate = (certificate: CertificateData) => {
    setEditingCertificate(certificate);
    setShowCertificateForm(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <Brain className="mx-auto w-16 h-16 text-primary-600 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MVX-ProofMind</h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-powered blockchain certification system on MultiversX
          </p>
          <WalletConnect onWalletChange={setWallet} />
        </div>

        {wallet && (
          <div className="mb-8">
            <Dashboard userAddress={wallet.address} />
          </div>
        )}

        {wallet && (
          <div className="text-center">
            <button
              onClick={() => setShowCertificateForm(true)}
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Certificate
            </button>
          </div>
        )}

        {wallet && (
          <CertificateForm
            isOpen={showCertificateForm}
            onClose={() => {
              setShowCertificateForm(false);
              setEditingCertificate(null);
            }}
            onSuccess={handleCertificateSuccess}
            editingCertificate={editingCertificate}
            userAddress={wallet.address}
          />
        )}

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
              <span className="text-gray-700">Loading...</span>
            </div>
          </div>
        )}

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </div>
  );
}

export default App;