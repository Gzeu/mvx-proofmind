// MultiversX and Certificate Types
export interface CertificateData {
  proof_text: string;
  timestamp: number;
  proof_id: string;
  category: string;
  metadata: string;
  ai_tags: string[];
  confidence_score: number;
  verification_status: VerificationStatus;
  created_by: string;
}

export enum VerificationStatus {
  Pending = 'Pending',
  Verified = 'Verified',
  Rejected = 'Rejected',
  Flagged = 'Flagged',
}

export interface CreateCertificateRequest {
  proof_text: string;
  proof_id: string;
  category?: string;
  metadata?: string;
  ai_tags?: string[];
}

export interface UpdateCertificateRequest {
  proof_id: string;
  new_proof_text?: string;
  new_category?: string;
  new_metadata?: string;
  new_ai_tags?: string[];
}

// Wallet and Connection Types
export interface WalletInfo {
  address: string;
  balance: string;
  isConnected: boolean;
  provider: string;
}

export interface NetworkConfig {
  chainId: string;
  gasPrice: number;
  gasLimit: number;
  contractAddress: string;
  explorerUrl: string;
  apiUrl: string;
}

// AI and Analytics Types
export interface AIAnalysis {
  confidence_score: number;
  predicted_category: string;
  anomaly_score: number;
  recommendations: string[];
  trends: TrendData[];
}

export interface TrendData {
  date: string;
  value: number;
  category?: string;
}

export interface CategoryStats {
  category: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

// Dashboard Types
export interface DashboardStats {
  totalCertificates: number;
  verifiedCertificates: number;
  pendingCertificates: number;
  categoriesCount: number;
  lastActivityDate: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    fill?: boolean;
  }[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Form Types
export interface CertificateFormData {
  title: string;
  description: string;
  category: string;
  metadata: Record<string, any>;
  tags: string[];
}

// Search and Filter Types
export interface SearchFilters {
  category?: string;
  verification_status?: VerificationStatus;
  date_from?: string;
  date_to?: string;
  search_text?: string;
}

export interface SortOptions {
  field: 'timestamp' | 'category' | 'confidence_score';
  direction: 'asc' | 'desc';
}

// Theme and UI Types
export interface ThemeConfig {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
}

export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

// Export commonly used constants
export const CERTIFICATE_CATEGORIES = [
  'GENERAL',
  'EDUCATION',
  'PROFESSIONAL',
  'EVENT',
  'TIMESTAMP',
  'ACHIEVEMENT',
  'VERIFICATION',
] as const;

export type CertificateCategory = typeof CERTIFICATE_CATEGORIES[number];

export const VERIFICATION_STATUSES = [
  VerificationStatus.Pending,
  VerificationStatus.Verified,
  VerificationStatus.Rejected,
  VerificationStatus.Flagged,
] as const;