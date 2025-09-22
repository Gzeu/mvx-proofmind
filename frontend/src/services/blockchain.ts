import {
  Address,
  SmartContract,
  ContractFunction,
  ResultsParser,
  AbiRegistry,
  SmartContractAbi,
  Transaction,
  TransactionPayload,
  GasLimit,
} from '@multiversx/sdk-core';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers';
import { WalletProvider } from '@multiversx/sdk-web-wallet-provider';
import { ExtensionProvider } from '@multiversx/sdk-extension-provider';
import { WalletConnectV2Provider } from '@multiversx/sdk-wallet-connect-provider';
import { HWProvider } from '@multiversx/sdk-hw-provider';
import {
  CertificateData,
  CreateCertificateRequest,
  UpdateCertificateRequest,
  VerificationStatus,
  NetworkConfig,
  WalletInfo,
} from '@/types';

class BlockchainService {
  private networkProvider: ProxyNetworkProvider;
  private contract: SmartContract;
  private provider: any;
  private config: NetworkConfig;

  constructor() {
    // Default to DevNet configuration - update for MainNet
    this.config = {
      chainId: 'D', // 'D' for DevNet, '1' for MainNet
      gasPrice: 1000000000,
      gasLimit: 10000000,
      contractAddress: process.env.VITE_CONTRACT_ADDRESS || '',
      explorerUrl: 'https://devnet-explorer.multiversx.com',
      apiUrl: 'https://devnet-gateway.multiversx.com',
    };

    this.networkProvider = new ProxyNetworkProvider(this.config.apiUrl);
    this.contract = new SmartContract({
      address: new Address(this.config.contractAddress),
    });
  }

  // Wallet Connection Methods
  async connectWallet(providerType: 'web' | 'extension' | 'walletconnect' | 'hardware'): Promise<WalletInfo> {
    try {
      switch (providerType) {
        case 'web':
          this.provider = new WalletProvider('https://devnet-wallet.multiversx.com');
          break;
        case 'extension':
          this.provider = ExtensionProvider.getInstance();
          await this.provider.init();
          break;
        case 'walletconnect':
          this.provider = new WalletConnectV2Provider({
            projectId: process.env.VITE_WALLETCONNECT_PROJECT_ID || '',
            metadata: {
              name: 'MVX-ProofMind',
              description: 'AI-powered blockchain certification system',
              url: 'https://mvx-proofmind.vercel.app',
              icons: ['https://mvx-proofmind.vercel.app/icon.png'],
            },
          });
          break;
        case 'hardware':
          this.provider = new HWProvider();
          break;
        default:
          throw new Error('Unsupported provider type');
      }

      const isConnected = await this.provider.login();
      if (!isConnected) {
        throw new Error('Failed to connect wallet');
      }

      const address = this.provider.getAddress();
      const account = await this.networkProvider.getAccount(new Address(address));

      return {
        address,
        balance: account.balance.toString(),
        isConnected: true,
        provider: providerType,
      };
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    if (this.provider) {
      await this.provider.logout();
      this.provider = null;
    }
  }

  // Certificate Management Methods
  async createCertificate(request: CreateCertificateRequest): Promise<string> {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const interaction = this.contract.methods
        .certifyAction([
          request.proof_text,
          request.proof_id,
          request.category || 'GENERAL',
          request.metadata || '{}',
          request.ai_tags || [],
        ])
        .withGasLimit(new GasLimit(this.config.gasLimit));

      const transaction = interaction.buildTransaction();
      const txHash = await this.provider.signAndSendTransaction(transaction);
      
      return txHash;
    } catch (error) {
      console.error('Create certificate error:', error);
      throw error;
    }
  }

  async updateCertificate(request: UpdateCertificateRequest): Promise<string> {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const interaction = this.contract.methods
        .updateProof([
          request.proof_id,
          request.new_proof_text,
          request.new_category,
          request.new_metadata,
          request.new_ai_tags,
        ])
        .withGasLimit(new GasLimit(this.config.gasLimit));

      const transaction = interaction.buildTransaction();
      const txHash = await this.provider.signAndSendTransaction(transaction);
      
      return txHash;
    } catch (error) {
      console.error('Update certificate error:', error);
      throw error;
    }
  }

  // Query Methods
  async getCertificate(userAddress: string, proofId: string): Promise<CertificateData | null> {
    try {
      const query = this.contract.createQuery({
        func: new ContractFunction('getProof'),
        args: [new Address(userAddress), Buffer.from(proofId)],
      });

      const response = await this.networkProvider.queryContract(query);
      const resultsParser = new ResultsParser();
      const parsed = resultsParser.parseQueryResponse(response, query.func);

      if (parsed.length === 0) {
        return null;
      }

      // Parse the certificate data from the response
      const certificate = this.parseCertificateFromResponse(parsed[0]);
      return certificate;
    } catch (error) {
      console.error('Get certificate error:', error);
      return null;
    }
  }

  async getUserCertificates(userAddress: string): Promise<CertificateData[]> {
    try {
      const query = this.contract.createQuery({
        func: new ContractFunction('getUserProofs'),
        args: [new Address(userAddress)],
      });

      const response = await this.networkProvider.queryContract(query);
      const resultsParser = new ResultsParser();
      const parsed = resultsParser.parseQueryResponse(response, query.func);

      if (parsed.length === 0) {
        return [];
      }

      // Parse multiple certificates from the response
      const certificates = parsed.map((item) => this.parseCertificateFromResponse(item));
      return certificates;
    } catch (error) {
      console.error('Get user certificates error:', error);
      return [];
    }
  }

  async getTotalCertificates(): Promise<number> {
    try {
      const query = this.contract.createQuery({
        func: new ContractFunction('getTotalProofs'),
        args: [],
      });

      const response = await this.networkProvider.queryContract(query);
      const resultsParser = new ResultsParser();
      const parsed = resultsParser.parseQueryResponse(response, query.func);

      return parsed.length > 0 ? parseInt(parsed[0].toString()) : 0;
    } catch (error) {
      console.error('Get total certificates error:', error);
      return 0;
    }
  }

  async getCategoryStats(category: string): Promise<number> {
    try {
      const query = this.contract.createQuery({
        func: new ContractFunction('getCategoryStats'),
        args: [Buffer.from(category)],
      });

      const response = await this.networkProvider.queryContract(query);
      const resultsParser = new ResultsParser();
      const parsed = resultsParser.parseQueryResponse(response, query.func);

      return parsed.length > 0 ? parseInt(parsed[0].toString()) : 0;
    } catch (error) {
      console.error('Get category stats error:', error);
      return 0;
    }
  }

  // Utility Methods
  private parseCertificateFromResponse(response: any): CertificateData {
    // This is a simplified parser - in production, use proper ABI parsing
    return {
      proof_text: response.proof_text?.toString() || '',
      timestamp: parseInt(response.timestamp?.toString() || '0'),
      proof_id: response.proof_id?.toString() || '',
      category: response.category?.toString() || '',
      metadata: response.metadata?.toString() || '{}',
      ai_tags: response.ai_tags?.map((tag: any) => tag.toString()) || [],
      confidence_score: parseInt(response.confidence_score?.toString() || '0'),
      verification_status: this.parseVerificationStatus(response.verification_status),
      created_by: response.created_by?.toString() || '',
    };
  }

  private parseVerificationStatus(status: any): VerificationStatus {
    const statusStr = status?.toString() || 'Pending';
    return Object.values(VerificationStatus).includes(statusStr as VerificationStatus)
      ? (statusStr as VerificationStatus)
      : VerificationStatus.Pending;
  }

  async waitForTransaction(txHash: string): Promise<any> {
    try {
      const transaction = await this.networkProvider.getTransaction(txHash, true);
      return transaction;
    } catch (error) {
      console.error('Wait for transaction error:', error);
      throw error;
    }
  }

  getExplorerUrl(txHash: string): string {
    return `${this.config.explorerUrl}/transactions/${txHash}`;
  }

  getConfig(): NetworkConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
export default blockchainService;