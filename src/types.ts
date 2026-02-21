// ──────────────────────────────────────
// Common
// ──────────────────────────────────────
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────
// Bank Account
// ──────────────────────────────────────
export interface BankAccount extends BaseEntity {
  bankName: string;
  accountNumber: string;
  accountType: 'savings' | 'current' | 'salary' | 'pension';
  branch: string;
  ifscCode: string;
  loginUsername: string;
  loginPassword: string;
  netBankingUrl: string;
  nomineeName: string;
  notes: string;
}

// ──────────────────────────────────────
// ID / Card
// ──────────────────────────────────────
export type IdCardType =
  | 'aadhaar' | 'pan' | 'passport' | 'voter_id' | 'driving_license'
  | 'credit_card' | 'debit_card' | 'health_insurance' | 'other';

export interface IdCard extends BaseEntity {
  type: IdCardType;
  label: string;
  cardNumber: string;
  issuer: string;
  expiryDate: string;
  linkedBank: string;
  fileId: string;
  notes: string;
}

// ──────────────────────────────────────
// Fixed Deposit
// ──────────────────────────────────────
export interface FixedDeposit extends BaseEntity {
  bank: string;
  accountName: string;
  fdNumber: string;
  principalAmount: number;
  interestRate: number;
  startDate: string;
  maturityDate: string;
  maturityAmount: number;
  interestPayout: 'cumulative' | 'monthly' | 'quarterly' | 'yearly';
  autoRenew: boolean;
  notes: string;
}

// ──────────────────────────────────────
// Mutual Fund
// ──────────────────────────────────────
export interface MutualFund extends BaseEntity {
  fundName: string;
  amcName: string;
  folioNumber: string;
  investedAmount: number;
  currentValue: number;
  category: 'equity' | 'debt' | 'hybrid' | 'elss' | 'liquid' | 'other';
  sipActive: boolean;
  sipAmount: number;
  notes: string;
}

// ──────────────────────────────────────
// Retirement Action Item
// ──────────────────────────────────────
export type RetirementCategory =
  | 'pension' | 'gratuity' | 'pf' | 'insurance' | 'tax' | 'leave_encashment' | 'other';

export type RetirementStatus = 'pending' | 'in_progress' | 'completed';

export type Priority = 'high' | 'medium' | 'low';

export interface RetirementItem extends BaseEntity {
  title: string;
  description: string;
  category: RetirementCategory;
  expectedAmount: number;
  deadline: string | null;
  status: RetirementStatus;
  completedAt: string | null;
  priority: Priority;
  notes: string;
}

// ──────────────────────────────────────
// Property (Illiquid Asset)
// ──────────────────────────────────────
export interface Property extends BaseEntity {
  type: 'house' | 'land' | 'commercial' | 'other';
  label: string;
  address: string;
  estimatedValue: number;
  purchaseValue: number;
  purchaseDate: string | null;
  areaSqft: number;
  ownershipType: 'sole' | 'joint';
  coOwner: string;
  registrationNumber: string;
  fileIds: string[];
  notes: string;
}

// ──────────────────────────────────────
// Document (Vault) — metadata only
// ──────────────────────────────────────
export type DocumentCategory =
  | 'bank' | 'tax' | 'insurance' | 'property' | 'retirement' | 'medical' | 'other';

export interface UploadedDocument extends BaseEntity {
  label: string;
  category: DocumentCategory;
  fileId: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  tags: string[];
  notes: string;
}

// ──────────────────────────────────────
// Stored File (binary blob in IndexedDB)
// ──────────────────────────────────────
export interface StoredFile {
  id: string;
  blob: Blob;
  fileName: string;
  fileType: string;
  fileSize: number;
}

// ──────────────────────────────────────
// Form Field Configuration (for FormModal)
// ──────────────────────────────────────
export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea' | 'password' | 'url';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  step?: number;
  defaultValue?: unknown;
  half?: boolean;
}

// ──────────────────────────────────────
// Store names (for generic hook)
// ──────────────────────────────────────
export type StoreName =
  | 'bankAccounts' | 'idsAndCards' | 'fixedDeposits' | 'mutualFunds'
  | 'retirementItems' | 'properties' | 'documents' | 'files';
