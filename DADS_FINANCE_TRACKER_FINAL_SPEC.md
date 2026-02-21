# 🏦 Dad's Retirement Finance Tracker — Complete Build Spec (v4 FINAL)

> **For Claude Code**: Generate the ENTIRE project from this spec in one shot. This is a fully offline PWA — NO backend, NO Firebase, NO authentication. All data lives in IndexedDB. Backup/restore via ZIP files. Hosted as a static site on GitHub Pages.

---

## TABLE OF CONTENTS

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Complete Folder Structure](#3-complete-folder-structure)
4. [Data Layer — IndexedDB](#4-data-layer--indexeddb)
5. [TypeScript Types](#5-typescript-types)
6. [Reusable Core Patterns](#6-reusable-core-patterns)
7. [Page-by-Page Detailed Spec](#7-page-by-page-detailed-spec)
8. [Routing & Navigation](#8-routing--navigation)
9. [Design System & Styling](#9-design-system--styling)
10. [Backup & Restore System](#10-backup--restore-system)
11. [Fake Data / Demo Mode](#11-fake-data--demo-mode)
12. [PWA Configuration](#12-pwa-configuration)
13. [GitHub Pages Deployment](#13-github-pages-deployment)
14. [Post-Deploy Usage Guide](#14-post-deploy-usage-guide)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                        │
│                                                          │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────┐  │
│  │  React App  │──▶│  IndexedDB   │   │  Service     │  │
│  │  (UI + Logic)│   │  (All Data + │   │  Worker      │  │
│  │             │◀──│   Files)     │   │  (Offline)   │  │
│  └──────┬──────┘   └──────┬───────┘   └──────────────┘  │
│         │                 │                              │
│         ▼                 ▼                              │
│  ┌─────────────┐   ┌──────────────┐                     │
│  │  Computed   │   │  ZIP Export/ │                     │
│  │  Values     │   │  Import      │                     │
│  │  (dynamic)  │   │  (backup)    │                     │
│  └─────────────┘   └──────────────┘                     │
│                                                          │
│  NO SERVER. NO AUTH. NO API CALLS. EVERYTHING IS LOCAL.  │
└──────────────────────────────────────────────────────────┘

Hosting: GitHub Pages (free, static)
Transfer: Download ZIP → share via Drive/WhatsApp → Upload on other device
```

### Key Principles

| Principle | Implementation |
|---|---|
| **Zero backend** | No Firebase, no server, no database. IndexedDB is the database. |
| **Zero auth** | No login page. App opens directly to dashboard. Data is on-device only. |
| **Offline-first** | PWA with service worker. Works without internet after first load. |
| **Portable data** | Full backup as ZIP (data + files). Quick backup as JSON (data only). |
| **Free hosting** | GitHub Pages. No Firebase project, no billing, no secrets. |
| **Demo safe** | Fake data mode loads realistic dummy data for showing the app to others. |
| **Dynamic computations** | Net worth, FD maturity countdowns, retirement progress — all computed from stored data in real-time. |

---

## 2. Tech Stack & Dependencies

### Install command (single shot)

```bash
npm create vite@latest dad-finance -- --template react-ts
cd dad-finance
npm install idb react-router-dom recharts lucide-react date-fns jszip file-saver
npm install -D tailwindcss @tailwindcss/vite vite-plugin-pwa @types/file-saver
```

### Dependency purposes

| Package | Purpose |
|---|---|
| `react` + `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `idb` | Promise-based IndexedDB wrapper (by Jake Archibald, tiny, excellent) |
| `recharts` | Charts on dashboard (donut, bar) |
| `lucide-react` | Icons |
| `date-fns` | Date formatting and calculations |
| `jszip` | Create/read ZIP files for backup/restore |
| `file-saver` | Trigger browser file downloads |
| `tailwindcss` | Styling |
| `vite-plugin-pwa` | Service worker + PWA manifest |

---

## 3. Complete Folder Structure

**Claude Code: Create EVERY file listed below with complete working code. No placeholders. No TODOs.**

```
dad-finance/
├── .github/
│   └── workflows/
│       └── deploy.yml                 # GitHub Pages deploy action
├── public/
│   ├── favicon.svg                    # ₹ icon
│   ├── icon-192.png                   # PWA icon (generate simple one)
│   ├── icon-512.png                   # PWA icon large
│   └── robots.txt
├── src/
│   ├── main.tsx                       # React entry point
│   ├── App.tsx                        # Router + Demo mode provider
│   ├── db.ts                          # IndexedDB setup with idb
│   ├── types.ts                       # ALL TypeScript interfaces
│   ├── utils/
│   │   ├── currency.ts                # Indian ₹ formatting (lakhs, crores)
│   │   ├── dates.ts                   # Date formatting + maturity helpers
│   │   ├── backup.ts                  # ZIP export + JSON export logic
│   │   ├── restore.ts                 # ZIP import + JSON import logic
│   │   └── fakeData.ts               # Realistic dummy data generator
│   ├── context/
│   │   └── DemoContext.tsx             # Demo/Fake data mode toggle
│   ├── hooks/
│   │   ├── useStore.ts                # GENERIC IndexedDB CRUD hook (replaces useCollection)
│   │   ├── useFileStore.ts            # IndexedDB file storage hook
│   │   └── useDemoMode.ts             # Consume demo context
│   ├── components/
│   │   ├── Layout.tsx                 # App shell: TopBar + BottomNav + Outlet
│   │   ├── FormModal.tsx              # Dynamic form modal (field config driven)
│   │   ├── DataCard.tsx               # Reusable expandable data card
│   │   ├── ConfirmDialog.tsx          # "Are you sure?" delete dialog
│   │   ├── EmptyState.tsx             # No-data placeholder with CTA
│   │   ├── FileUploader.tsx           # File picker + IndexedDB storage
│   │   ├── FilePreview.tsx            # Image/PDF preview modal
│   │   ├── StatCard.tsx               # Dashboard stat display card
│   │   ├── ProgressBar.tsx            # Animated progress bar
│   │   ├── LoadingSpinner.tsx         # Loading state
│   │   ├── FilterChips.tsx            # Horizontal filter chip bar
│   │   └── DemoBanner.tsx             # "Demo Mode" banner shown when active
│   ├── pages/
│   │   ├── DashboardPage.tsx          # Home: totals, chart, quick links
│   │   ├── BankAccountsPage.tsx       # Bank login details CRUD
│   │   ├── IdsCardsPage.tsx           # IDs and cards CRUD
│   │   ├── LiquidAssetsPage.tsx       # FD + MF summary with sections
│   │   ├── FixedDepositsPage.tsx      # FD deep dive + add/edit
│   │   ├── MutualFundsPage.tsx        # MF deep dive + add/edit
│   │   ├── IlliquidAssetsPage.tsx     # Properties + land CRUD
│   │   ├── RetirementTrackerPage.tsx  # Action items checklist
│   │   ├── DocumentVaultPage.tsx      # File upload + browse
│   │   └── SettingsPage.tsx           # Backup, Restore, Demo mode, Clear data
│   └── styles/
│       └── globals.css                # Tailwind + CSS variables + custom styles
├── index.html                         # Vite entry HTML
├── vite.config.ts                     # Vite + Tailwind + PWA plugin config
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── .gitignore
├── package.json
└── README.md
```

**Total: ~35 files. All with complete implementations.**

---

## 4. Data Layer — IndexedDB

### `src/db.ts` — Database Setup

Use the `idb` library for a clean, promise-based IndexedDB API.

```ts
// src/db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface DadFinanceDB extends DBSchema {
  bankAccounts: {
    key: string;
    value: BankAccount;
    indexes: { 'by-bank': string };
  };
  idsAndCards: {
    key: string;
    value: IdCard;
    indexes: { 'by-type': string };
  };
  fixedDeposits: {
    key: string;
    value: FixedDeposit;
    indexes: { 'by-bank': string; 'by-maturity': string };
  };
  mutualFunds: {
    key: string;
    value: MutualFund;
    indexes: { 'by-category': string };
  };
  retirementItems: {
    key: string;
    value: RetirementItem;
    indexes: { 'by-status': string; 'by-priority': string };
  };
  properties: {
    key: string;
    value: Property;
    indexes: { 'by-type': string };
  };
  documents: {
    key: string;
    value: UploadedDocument;
    indexes: { 'by-category': string };
  };
  files: {
    key: string;          // matches document ID or a reference ID
    value: StoredFile;    // { id, blob, fileName, fileType, fileSize }
  };
}

const DB_NAME = 'dad-finance-db';
const DB_VERSION = 1;

export async function getDB(): Promise<IDBPDatabase<DadFinanceDB>> {
  return openDB<DadFinanceDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Bank Accounts
      const bankStore = db.createObjectStore('bankAccounts', { keyPath: 'id' });
      bankStore.createIndex('by-bank', 'bankName');

      // IDs and Cards
      const idStore = db.createObjectStore('idsAndCards', { keyPath: 'id' });
      idStore.createIndex('by-type', 'type');

      // Fixed Deposits
      const fdStore = db.createObjectStore('fixedDeposits', { keyPath: 'id' });
      fdStore.createIndex('by-bank', 'bank');
      fdStore.createIndex('by-maturity', 'maturityDate');

      // Mutual Funds
      const mfStore = db.createObjectStore('mutualFunds', { keyPath: 'id' });
      mfStore.createIndex('by-category', 'category');

      // Retirement Items
      const retStore = db.createObjectStore('retirementItems', { keyPath: 'id' });
      retStore.createIndex('by-status', 'status');
      retStore.createIndex('by-priority', 'priority');

      // Properties
      const propStore = db.createObjectStore('properties', { keyPath: 'id' });
      propStore.createIndex('by-type', 'type');

      // Documents (metadata)
      const docStore = db.createObjectStore('documents', { keyPath: 'id' });
      docStore.createIndex('by-category', 'category');

      // Files (binary blobs — PDFs, images)
      db.createObjectStore('files', { keyPath: 'id' });
    },
  });
}

// Helper to clear ALL data (used in Settings page)
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const storeNames: (keyof DadFinanceDB)[] = [
    'bankAccounts', 'idsAndCards', 'fixedDeposits', 'mutualFunds',
    'retirementItems', 'properties', 'documents', 'files'
  ];
  const tx = db.transaction(storeNames, 'readwrite');
  await Promise.all(storeNames.map(name => tx.objectStore(name).clear()));
  await tx.done;
}
```

### `StoredFile` type for binary file storage

```ts
// Stored in the 'files' object store
interface StoredFile {
  id: string;              // Same ID as the document it belongs to, or a unique ref
  blob: Blob;              // The actual binary file data
  fileName: string;
  fileType: string;        // MIME type: 'application/pdf', 'image/jpeg', etc.
  fileSize: number;        // Size in bytes
}
```

### How files work in IndexedDB

- When user uploads a document → the actual `Blob` is stored in the `files` store
- The `documents` store holds metadata (label, category, tags) with a reference `fileId`
- To display: read the blob from `files` store → create a `URL.createObjectURL(blob)` → render
- **No size limits from our side** — IndexedDB can handle hundreds of MB
- Browser may prompt for permission if storage exceeds ~50MB (user just clicks "Allow")

---

## 5. TypeScript Types

### `src/types.ts`

**Claude Code: Generate this file exactly as specified.**

```ts
// ──────────────────────────────────────
// Common
// ──────────────────────────────────────
export interface BaseEntity {
  id: string;
  createdAt: string;       // ISO 8601 string (not Timestamp, since no Firebase)
  updatedAt: string;       // ISO 8601 string
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
  fileId: string;           // reference to 'files' store for uploaded scan
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
  startDate: string;        // ISO date string
  maturityDate: string;     // ISO date string
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
  deadline: string | null;     // ISO date string or null
  status: RetirementStatus;
  completedAt: string | null;  // ISO date string or null
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
  fileIds: string[];            // references to 'files' store
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
  fileId: string;             // reference to 'files' store
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
  defaultValue?: any;
  half?: boolean;              // half-width for side-by-side layout
}

// ──────────────────────────────────────
// Store names (for generic hook)
// ──────────────────────────────────────
export type StoreName =
  | 'bankAccounts' | 'idsAndCards' | 'fixedDeposits' | 'mutualFunds'
  | 'retirementItems' | 'properties' | 'documents' | 'files';
```

---

## 6. Reusable Core Patterns

### 6.1 `useStore` Hook — GENERIC IndexedDB CRUD

**This is the backbone. Every data page uses it. Implement it fully.**

```ts
// src/hooks/useStore.ts
//
// Usage on any page:
//   const { data, loading, add, update, remove, refresh } = useStore<FixedDeposit>('fixedDeposits');
//
// Implementation requirements:
// - Opens DB via getDB()
// - On mount: loads all items from the specified object store
// - Returns typed array sorted by createdAt descending
// - add(item): generates UUID id + createdAt/updatedAt, puts into store, refreshes
// - update(id, partial): merges fields + updates updatedAt, puts into store, refreshes
// - remove(id): deletes from store, refreshes
// - refresh(): re-reads all items (call after any mutation)
// - loading: true while initial load is happening
//
// ID generation: use crypto.randomUUID()
//
// IMPORTANT: In demo mode (from DemoContext), this hook should return fake data
// instead of reading from IndexedDB, and add/update/remove should be no-ops.
```

### 6.2 `useFileStore` Hook — File Storage

```ts
// src/hooks/useFileStore.ts
//
// Usage:
//   const { saveFile, getFile, getFileUrl, deleteFile } = useFileStore();
//
//   // Save a file
//   const fileId = await saveFile(file);  // file is a File object from input
//
//   // Get a blob URL for display
//   const url = await getFileUrl(fileId); // returns URL.createObjectURL(blob)
//
//   // Delete a file
//   await deleteFile(fileId);
//
// Implementation:
// - saveFile(file: File): generates UUID, stores { id, blob: file, fileName, fileType, fileSize } in 'files' store
// - getFile(id): reads from 'files' store, returns StoredFile or null
// - getFileUrl(id): reads blob, returns URL.createObjectURL(blob) — REMEMBER to revoke when done
// - deleteFile(id): removes from 'files' store
// - getAllFiles(): returns all StoredFile entries (used for backup)
```

### 6.3 `FormModal` Component — UNIVERSAL FORM

```tsx
// src/components/FormModal.tsx
//
// Props:
//   open: boolean
//   onClose: () => void
//   title: string
//   fields: FieldConfig[]
//   onSubmit: (data: Record<string, any>) => Promise<void>
//   initialData?: Record<string, any>    // For edit mode
//   submitLabel?: string                 // Default: "Save"
//
// Behavior:
// - Slide-up modal on mobile, centered modal on desktop
// - Generates fields dynamically from FieldConfig array
// - Supports: text, number, date, select, checkbox, textarea, password, url
// - Password fields have show/hide toggle (eye icon from lucide)
// - Validates required fields — show red border + "Required" text on empty required fields
// - Loading spinner on submit button while saving
// - Clears form on successful submit and closes
// - Half-width fields (half: true) render side by side using flex
// - Backdrop click or X button closes
// - Escape key closes
// - Form scrolls if content exceeds modal height
```

### 6.4 `DataCard` Component

```tsx
// src/components/DataCard.tsx
//
// Props:
//   title: string
//   subtitle?: string
//   badges?: { label: string; variant: 'navy' | 'gold' | 'green' | 'red' | 'yellow' }[]
//   expandedContent?: ReactNode
//   onEdit?: () => void
//   onDelete?: () => void
//   rightContent?: ReactNode             // e.g., ₹ amount
//   icon?: ReactNode
//   onClick?: () => void                 // for navigation cards
//
// Behavior:
// - Tap to expand/collapse (smooth animation, max-height transition)
// - Edit (pencil icon) and Delete (trash icon) buttons in expanded view
// - Delete triggers ConfirmDialog
// - Supports right-aligned content (amounts, badges)
```

### 6.5 `DemoBanner` Component

```tsx
// src/components/DemoBanner.tsx
//
// Shown at the top of every page when demo mode is active.
// Sticky banner: "🎭 Demo Mode — Showing fake data" + "Exit Demo" button
// Gold background, navy text, small font
// Clicking "Exit Demo" returns to real data
```

---

## 7. Page-by-Page Detailed Spec

### 7.0 NO LOGIN PAGE

There is **no login page**. The app opens directly to the Dashboard. All data is local.

---

### 7.1 🏠 Dashboard Page (`/`)

**Route:** `/` (home)

**This is the command center. Everything summarized at a glance.**

**Data fetching:** Use `useStore` for ALL stores simultaneously:
```ts
const { data: fds } = useStore<FixedDeposit>('fixedDeposits');
const { data: mfs } = useStore<MutualFund>('mutualFunds');
const { data: properties } = useStore<Property>('properties');
const { data: retirementItems } = useStore<RetirementItem>('retirementItems');
```

**Computed values (all dynamic, recalculated on every render):**
```ts
const fdTotal = fds.reduce((sum, fd) => sum + fd.principalAmount, 0);
const mfTotal = mfs.reduce((sum, mf) => sum + mf.currentValue, 0);
const liquidTotal = fdTotal + mfTotal;
const illiquidTotal = properties.reduce((sum, p) => sum + p.estimatedValue, 0);
const netWorth = liquidTotal + illiquidTotal;
const completedRetirement = retirementItems.filter(i => i.status === 'completed').length;
const totalRetirement = retirementItems.length;
const collectedAmount = retirementItems
  .filter(i => i.status === 'completed')
  .reduce((sum, i) => sum + (i.expectedAmount || 0), 0);
```

**Layout (top to bottom):**

1. **Top Bar:** "Dad's Finance Hub" title + ⚙️ Settings gear icon (top right → `/settings`)

2. **Net Worth Card** (full width, hero card)
   - Label: "Total Net Worth"
   - Value: ₹XX,XX,XXX (large, monospace font, gold color)
   - Gradient background: navy to navy-light

3. **Two-column tappable cards:**

   **Liquid Assets Card** (left) → taps to `/liquid`
   - 💧 Droplets icon + "Liquid Assets"
   - Total: ₹XX,XX,XXX
   - Sub-text: "FDs: ₹XXL · MFs: ₹XXL"
   - "View Details →" at bottom

   **Illiquid Assets Card** (right) → taps to `/illiquid`
   - 🏠 Home icon + "Illiquid Assets"
   - Total: ₹XX,XX,XXX
   - Sub-text: "X Houses · Y Land"
   - "View Details →" at bottom

4. **Asset Breakdown Donut Chart** (full width card)
   - Recharts `<PieChart>` with `<Pie>` (innerRadius for donut)
   - 3 slices: FDs (gold #C8956C), MFs (green #2D8B6F), Properties (navy #1B2A4A)
   - Center text: "Total" + net worth amount
   - Legend below with amounts + percentages
   - If no data: show `EmptyState` component

5. **Retirement Progress Card** → taps to `/retirement`
   - "🎯 Retirement Progress"
   - "X of Y completed · ₹XX,XX,XXX collected"
   - Animated progress bar
   - Next pending item preview
   - If no items: "Start tracking retirement →"

6. **Quick Links Row** (horizontal scroll)
   - 🏦 Bank Accounts → `/bank-accounts`
   - 🪪 IDs & Cards → `/ids-cards`
   - 📁 Documents → `/documents`
   - ⚙️ Settings → `/settings`

**Currency formatting function** (`src/utils/currency.ts`):
```ts
// Format in Indian numbering: 1,00,000 (lakhs) and 1,00,00,000 (crores)
export function formatCurrency(amount: number): string {
  if (amount === 0) return '₹0';
  const isNegative = amount < 0;
  const abs = Math.abs(Math.round(amount));
  const str = abs.toString();
  let result = '';
  
  if (str.length <= 3) {
    result = str;
  } else {
    result = str.slice(-3);
    let remaining = str.slice(0, -3);
    while (remaining.length > 2) {
      result = remaining.slice(-2) + ',' + result;
      remaining = remaining.slice(0, -2);
    }
    if (remaining) result = remaining + ',' + result;
  }
  
  return (isNegative ? '-₹' : '₹') + result;
}

// Short format: ₹25L, ₹1.5Cr
export function formatCurrencyShort(amount: number): string {
  if (amount >= 10000000) return '₹' + (amount / 10000000).toFixed(1) + 'Cr';
  if (amount >= 100000) return '₹' + (amount / 100000).toFixed(1) + 'L';
  if (amount >= 1000) return '₹' + (amount / 1000).toFixed(1) + 'K';
  return '₹' + amount;
}
```

---

### 7.2 🏦 Bank Accounts Page (`/bank-accounts`)

**Route:** `/bank-accounts`

**Header:** "Bank Accounts" + count badge

**Form fields:**
```ts
const BANK_ACCOUNT_FIELDS: FieldConfig[] = [
  { name: 'bankName', label: 'Bank Name', type: 'text', required: true, placeholder: 'e.g. State Bank of India' },
  { name: 'accountNumber', label: 'Account Number', type: 'text', required: true },
  { name: 'accountType', label: 'Account Type', type: 'select', required: true,
    options: [
      { value: 'savings', label: 'Savings' },
      { value: 'current', label: 'Current' },
      { value: 'salary', label: 'Salary' },
      { value: 'pension', label: 'Pension' },
    ]},
  { name: 'branch', label: 'Branch', type: 'text', placeholder: 'e.g. MG Road, Bangalore' },
  { name: 'ifscCode', label: 'IFSC Code', type: 'text', placeholder: 'e.g. SBIN0001234' },
  { name: 'loginUsername', label: 'Net Banking Username', type: 'text' },
  { name: 'loginPassword', label: 'Net Banking Password', type: 'password' },
  { name: 'netBankingUrl', label: 'Net Banking URL', type: 'url', placeholder: 'https://...' },
  { name: 'nomineeName', label: 'Nominee', type: 'text' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];
```

**Card display:**
- Title: Bank Name
- Subtitle: Account Type badge + masked account number (`XXXX XXXX 1234`)
- Expanded: Full account number (copy button), IFSC, username (copy button), password (hidden ••• with 👁️ toggle + copy button), net banking URL (clickable), nominee, notes
- Edit / Delete in expanded view
- **Copy button implementation:** `navigator.clipboard.writeText(value)` with a brief "Copied!" toast

**FAB:** "+" bottom-right → FormModal add mode

---

### 7.3 🪪 IDs & Cards Page (`/ids-cards`)

**Route:** `/ids-cards`

**Header:** "IDs & Cards" + count

**FilterChips:** `All | IDs | Bank Cards | Insurance | Other`

**Form fields:**
```ts
const ID_CARD_FIELDS: FieldConfig[] = [
  { name: 'type', label: 'Type', type: 'select', required: true,
    options: [
      { value: 'aadhaar', label: 'Aadhaar' },
      { value: 'pan', label: 'PAN Card' },
      { value: 'passport', label: 'Passport' },
      { value: 'voter_id', label: 'Voter ID' },
      { value: 'driving_license', label: 'Driving License' },
      { value: 'credit_card', label: 'Credit Card' },
      { value: 'debit_card', label: 'Debit Card' },
      { value: 'health_insurance', label: 'Health Insurance' },
      { value: 'other', label: 'Other' },
    ]},
  { name: 'label', label: 'Label', type: 'text', required: true, placeholder: 'e.g. SBI Debit Card' },
  { name: 'cardNumber', label: 'Card/ID Number', type: 'text', required: true },
  { name: 'issuer', label: 'Issuer', type: 'text', placeholder: 'e.g. SBI, UIDAI' },
  { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
  { name: 'linkedBank', label: 'Linked Bank', type: 'text' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];
```

**Card display:**
- Title: Label
- Subtitle: Type badge + masked number (last 4)
- Expanded: full number (with copy), expiry, linked bank, notes
- Option to attach a photo/scan via FileUploader (stores in `files` store, saves `fileId` on the IdCard)
- If fileId exists: show thumbnail preview, tap to open FilePreview modal

---

### 7.4 💧 Liquid Assets Page (`/liquid`)

**Route:** `/liquid`

**Header:** "Liquid Assets" + Total: ₹XX,XX,XXX

**Section 1 — Fixed Deposits**
- Sub-header: "Fixed Deposits" + subtotal + "View All →" link to `/liquid/fds`
- Top 5 FDs as compact cards: bank, principal (formatted), rate %, maturity date
- "**+ Add FD**" button → FormModal with FD fields (adds to `fixedDeposits` store)

**Section 2 — Mutual Funds**
- Sub-header: "Mutual Funds" + subtotal + "View All →" link to `/liquid/mfs`
- Top 5 MFs: fund name, current value, category badge
- "**+ Add MF**" button → FormModal with MF fields (adds to `mutualFunds` store)

**Section 3 — Split Chart**
- Recharts horizontal stacked bar OR pie showing FD vs MF percentages
- Legend with amounts

---

### 7.5 📊 Fixed Deposits Deep Dive (`/liquid/fds`)

**Route:** `/liquid/fds`

**Header:** "Fixed Deposits" + count + back arrow to `/liquid`

**Summary bar (pinned):**
- Total Invested: ₹XX,XX,XXX
- Maturity Value: ₹XX,XX,XXX (sum of maturityAmount, or principalAmount if maturityAmount is 0)
- Avg Interest Rate: X.X% (weighted average by principal)

**Dynamic status calculation per FD:**
```ts
const today = new Date();
const maturity = new Date(fd.maturityDate);
const daysToMaturity = differenceInDays(maturity, today);

if (daysToMaturity < 0) status = 'matured';       // 🔴
else if (daysToMaturity <= 30) status = 'maturing'; // 🟡
else status = 'active';                             // 🟢
```

**Form fields:**
```ts
const FD_FIELDS: FieldConfig[] = [
  { name: 'bank', label: 'Bank', type: 'text', required: true, placeholder: 'e.g. SBI' },
  { name: 'accountName', label: 'Account Holder Name', type: 'text', required: true },
  { name: 'fdNumber', label: 'FD Number', type: 'text' },
  { name: 'principalAmount', label: 'Principal Amount (₹)', type: 'number', required: true },
  { name: 'interestRate', label: 'Interest Rate (%)', type: 'number', required: true, step: 0.01 },
  { name: 'startDate', label: 'Start Date', type: 'date', required: true, half: true },
  { name: 'maturityDate', label: 'Maturity Date', type: 'date', required: true, half: true },
  { name: 'maturityAmount', label: 'Maturity Amount (₹)', type: 'number' },
  { name: 'interestPayout', label: 'Interest Payout', type: 'select',
    options: [
      { value: 'cumulative', label: 'Cumulative' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'quarterly', label: 'Quarterly' },
      { value: 'yearly', label: 'Yearly' },
    ]},
  { name: 'autoRenew', label: 'Auto Renew', type: 'checkbox' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];
```

**Card display per FD:**
- Title: Bank + " — " + FD Number (or "No FD#" if empty)
- Subtitle: Account Name
- Right: Principal amount (large, monospace)
- Badges: rate (e.g., "7.1%"), payout type, status (🟢/🟡/🔴)
- Expanded: all fields, maturity countdown ("Matures in X days" or "Matured X days ago"), notes

**Sort:** By maturity date ascending (nearest first)

---

### 7.6 📈 Mutual Funds Deep Dive (`/liquid/mfs`)

**Route:** `/liquid/mfs`

**Header:** "Mutual Funds" + count + back arrow

**Summary bar:**
- Total Invested: ₹XX,XX,XXX
- Current Value: ₹XX,XX,XXX
- Gain/Loss: ₹XX,XXX (green if positive, red if negative) + percentage
  ```ts
  const gainLoss = totalCurrentValue - totalInvested;
  const gainLossPercent = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;
  ```

**Form fields:**
```ts
const MF_FIELDS: FieldConfig[] = [
  { name: 'fundName', label: 'Fund Name', type: 'text', required: true, placeholder: 'e.g. HDFC Balanced Advantage' },
  { name: 'amcName', label: 'AMC Name', type: 'text', placeholder: 'e.g. HDFC AMC' },
  { name: 'folioNumber', label: 'Folio Number', type: 'text' },
  { name: 'investedAmount', label: 'Invested Amount (₹)', type: 'number', required: true },
  { name: 'currentValue', label: 'Current Value (₹)', type: 'number', required: true },
  { name: 'category', label: 'Category', type: 'select', required: true,
    options: [
      { value: 'equity', label: 'Equity' },
      { value: 'debt', label: 'Debt' },
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'elss', label: 'ELSS' },
      { value: 'liquid', label: 'Liquid' },
      { value: 'other', label: 'Other' },
    ]},
  { name: 'sipActive', label: 'SIP Active', type: 'checkbox' },
  { name: 'sipAmount', label: 'SIP Amount (₹/month)', type: 'number' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];
```

**Card display:**
- Title: Fund Name
- Subtitle: AMC + category badge
- Right: Current value (large) + gain/loss % below (green/red)
- SIP badge if active
- Expanded: all details, invested vs current, folio

---

### 7.7 🏠 Illiquid Assets (`/illiquid`)

**Route:** `/illiquid`

**Header:** "Illiquid Assets" + Total: ₹XX,XX,XXX

**Form fields:**
```ts
const PROPERTY_FIELDS: FieldConfig[] = [
  { name: 'type', label: 'Type', type: 'select', required: true,
    options: [
      { value: 'house', label: 'House / Flat' },
      { value: 'land', label: 'Land / Plot' },
      { value: 'commercial', label: 'Commercial' },
      { value: 'other', label: 'Other' },
    ]},
  { name: 'label', label: 'Label', type: 'text', required: true, placeholder: 'e.g. Bangalore Flat' },
  { name: 'address', label: 'Full Address', type: 'textarea', required: true },
  { name: 'estimatedValue', label: 'Estimated Current Value (₹)', type: 'number', required: true },
  { name: 'purchaseValue', label: 'Purchase Value (₹)', type: 'number' },
  { name: 'purchaseDate', label: 'Purchase Date', type: 'date' },
  { name: 'areaSqft', label: 'Area (sq ft)', type: 'number' },
  { name: 'ownershipType', label: 'Ownership', type: 'select',
    options: [
      { value: 'sole', label: 'Sole Owner' },
      { value: 'joint', label: 'Joint Owner' },
    ]},
  { name: 'coOwner', label: 'Co-Owner Name', type: 'text' },
  { name: 'registrationNumber', label: 'Registration Number', type: 'text' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];
```

**Card display:**
- Left icon: 🏠 house, 🌾 land, 🏢 commercial
- Title: Label
- Subtitle: Address (truncated to 1 line)
- Right: Estimated Value (large)
- Badges: type, ownership
- Expanded: all details, purchase vs current value, area, registration
- Attach documents per property (FileUploader, stores fileIds in property.fileIds array)

---

### 7.8 🎯 Retirement Tracker (`/retirement`)

**Route:** `/retirement`

**Header:** "Retirement Tracker"

**Progress section (top, always visible):**
- "X of Y completed"
- Progress bar (animated)
- "Expected: ₹XX,XX,XXX · Collected: ₹XX,XX,XXX"

**Three sections:**

**📋 Pending** (expanded by default)
- Items with `status === 'pending'`
- Each: checkbox (empty) + title + category badge + priority indicator + expected amount
- Sorted by priority (high → medium → low) then deadline

**🔄 In Progress** (expanded by default)
- Items with `status === 'in_progress'`
- Checkbox shows half-state (◐ or styled accordingly)

**✅ Completed** (collapsed by default)
- Items with `status === 'completed'`
- Shows completed date + amount
- Green checkbox

**Status transitions:**
- Tap checkbox on pending item → changes to `in_progress`
- Tap checkbox on in_progress item → changes to `completed` + sets `completedAt = new Date().toISOString()`
- Tap checkbox on completed item → reverts to `pending` + clears `completedAt`
- Alternatively: tap card to edit and manually set status via dropdown

**Form fields:**
```ts
const RETIREMENT_FIELDS: FieldConfig[] = [
  { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. Collect Gratuity' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'category', label: 'Category', type: 'select', required: true,
    options: [
      { value: 'pension', label: 'Pension' },
      { value: 'gratuity', label: 'Gratuity' },
      { value: 'pf', label: 'Provident Fund' },
      { value: 'leave_encashment', label: 'Leave Encashment' },
      { value: 'insurance', label: 'Insurance' },
      { value: 'tax', label: 'Tax Related' },
      { value: 'other', label: 'Other' },
    ]},
  { name: 'expectedAmount', label: 'Expected Amount (₹)', type: 'number' },
  { name: 'deadline', label: 'Deadline', type: 'date' },
  { name: 'priority', label: 'Priority', type: 'select', required: true,
    options: [
      { value: 'high', label: '⚡ High' },
      { value: 'medium', label: '🔵 Medium' },
      { value: 'low', label: '⬜ Low' },
    ]},
  { name: 'status', label: 'Status', type: 'select',
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
    ]},
  { name: 'notes', label: 'Notes', type: 'textarea' },
];
```

**Quick-add presets** (shown as chips when "+" is tapped):
```ts
const RETIREMENT_PRESETS = [
  { title: 'Collect Gratuity', category: 'gratuity' },
  { title: 'Collect Provident Fund', category: 'pf' },
  { title: 'Leave Encashment', category: 'leave_encashment' },
  { title: 'Setup Pension', category: 'pension' },
  { title: 'File Final Tax Return', category: 'tax' },
  { title: 'Transfer Salary Account', category: 'other' },
  { title: 'Update All Nominees', category: 'other' },
  { title: 'Collect Service Certificate', category: 'other' },
  { title: 'Health Insurance Continuation', category: 'insurance' },
  { title: 'Superannuation Settlement', category: 'other' },
  { title: 'Group Insurance Claim', category: 'insurance' },
  { title: 'KYC Updates Everywhere', category: 'other' },
];
```

Tapping a chip pre-fills title + category in the form. User can edit before saving.

---

### 7.9 📁 Document Vault (`/documents`)

**Route:** `/documents`

**Header:** "Document Vault" + count

**Upload section:**
- Large dashed-border upload area: "Tap to upload files"
- Uses FileUploader component
- After file selected: prompt for label + category (via a small inline form or mini FormModal)
- Show upload progress (reading file into IndexedDB)
- Accepted: PDF, JPG, JPEG, PNG, WEBP (validate before storing)
- Max size per file: 10MB (validate, show error if exceeded)

**Filter tabs:** `All | Bank | Tax | Insurance | Property | Retirement | Medical | Other`

**Document grid (2 columns on mobile, 3 on desktop):**
- Each card: file icon (📄 PDF / 🖼️ image based on fileType), label, category badge, file size, upload date
- Tap → FilePreview modal:
  - Images: full-screen preview with zoom
  - PDFs: render inline if possible, or show download button
  - "Download" button that triggers `saveAs(blob, fileName)` using file-saver
- Edit metadata (label, category, tags, notes)
- Delete (with confirmation — also deletes blob from `files` store)

**Search bar:** Filters by label (client-side search, since all data is local)

---

### 7.10 ⚙️ Settings Page (`/settings`)

**Route:** `/settings`

**This page is critical. It houses backup/restore/demo/clear functionality.**

**Layout — vertical sections:**

#### Section 1: Backup & Restore
```
┌─────────────────────────────────────────┐
│  💾 Backup & Restore                    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 📦 Full Backup (ZIP)           │    │
│  │ Data + all uploaded files       │    │
│  │ [Download Full Backup]          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 📄 Quick Backup (JSON)         │    │
│  │ Data only, no files (~few KB)   │    │
│  │ [Download Data Backup]          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 📥 Restore from Backup         │    │
│  │ Upload a .zip or .json file     │    │
│  │ [Choose File to Restore]        │    │
│  │                                 │    │
│  │ ⚠️ This will REPLACE all        │    │
│  │ current data. Make a backup     │    │
│  │ first!                          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Last backup: Never / Jan 15, 2025     │
└─────────────────────────────────────────┘
```

#### Section 2: Demo Mode
```
┌─────────────────────────────────────────┐
│  🎭 Demo Mode                          │
│                                         │
│  Show the app with realistic fake data  │
│  without revealing your real finances.  │
│  Your real data stays untouched.        │
│                                         │
│  [ Toggle: OFF / ON ]                   │
│                                         │
│  When ON: all pages show fake data.     │
│  When OFF: your real data is shown.     │
└─────────────────────────────────────────┘
```

#### Section 3: Danger Zone
```
┌─────────────────────────────────────────┐
│  ⚠️ Danger Zone                         │
│                                         │
│  [🗑️ Clear All Data]                    │
│                                         │
│  Permanently deletes ALL data including │
│  uploaded files. This cannot be undone. │
│  Make a backup first!                   │
│                                         │
│  Requires typing "DELETE" to confirm.   │
└─────────────────────────────────────────┘
```

#### Section 4: About
```
┌─────────────────────────────────────────┐
│  ℹ️ About                               │
│                                         │
│  Dad's Finance Tracker v1.0             │
│  All data stored locally on this device │
│  No data is sent to any server          │
│                                         │
│  Storage used: ~XX MB                   │
└─────────────────────────────────────────┘
```

**Storage estimate:** Use `navigator.storage.estimate()` to show used/available storage.

---

## 8. Routing & Navigation

### Route structure in `App.tsx`

```tsx
<BrowserRouter basename="/dad-finance-tracker">  {/* basename matches GitHub repo name */}
  <DemoProvider>
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/bank-accounts" element={<BankAccountsPage />} />
        <Route path="/ids-cards" element={<IdsCardsPage />} />
        <Route path="/liquid" element={<LiquidAssetsPage />} />
        <Route path="/liquid/fds" element={<FixedDepositsPage />} />
        <Route path="/liquid/mfs" element={<MutualFundsPage />} />
        <Route path="/illiquid" element={<IlliquidAssetsPage />} />
        <Route path="/retirement" element={<RetirementTrackerPage />} />
        <Route path="/documents" element={<DocumentVaultPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  </DemoProvider>
</BrowserRouter>
```

**IMPORTANT:** `basename` must match the GitHub repo name for GitHub Pages to work.

### Bottom Navigation (4 tabs + settings accessible from top bar)

| Icon (lucide) | Label | Route | Active when |
|---|---|---|---|
| `Home` | Home | `/` | exact `/` |
| `Droplets` | Assets | `/liquid` | starts with `/liquid` or `/illiquid` |
| `Target` | Retire | `/retirement` | starts with `/retirement` |
| `FolderOpen` | Docs | `/documents` | starts with `/documents` |

### Top Bar
- Left: Back arrow (if not on `/`) using `navigate(-1)`
- Center: Page title
- Right: ⚙️ gear icon → `/settings`
- If demo mode active: `DemoBanner` shown below top bar

---

## 9. Design System & Styling

### `src/styles/globals.css`

```css
@import 'tailwindcss';

/* ─── Google Fonts ─── */
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');

/* ─── CSS Variables ─── */
:root {
  --color-navy: #1B2A4A;
  --color-navy-light: #2A3F6A;
  --color-gold: #C8956C;
  --color-gold-light: #E8C9A8;
  --color-gold-pale: #FDF6EF;

  --color-positive: #2D8B6F;
  --color-positive-light: #E8F5EF;
  --color-warning: #D4A034;
  --color-warning-light: #FFF8E8;
  --color-danger: #D94F4F;
  --color-danger-light: #FEF0F0;

  --color-bg: #F7F8FA;
  --color-card: #FFFFFF;
  --color-text: #1A1A2E;
  --color-text-muted: #6B7280;
  --color-border: #E5E7EB;
  --color-border-light: #F3F4F6;

  --font-display: 'DM Serif Display', serif;
  --font-body: 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --radius-lg: 16px;
  --radius-md: 12px;
  --radius-sm: 8px;
}

body {
  font-family: var(--font-body);
  background-color: var(--color-bg);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
  margin: 0;
  padding: 0;
  overscroll-behavior: none;
}

h1, h2, h3 { font-family: var(--font-display); }

.currency { font-family: var(--font-mono); font-weight: 600; }
.currency-large { font-family: var(--font-mono); font-weight: 600; font-size: 1.75rem; }
.currency-hero { font-family: var(--font-mono); font-weight: 600; font-size: 2.25rem; }

.card {
  background: var(--color-card);
  border-radius: var(--radius-md);
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  border: 1px solid var(--color-border-light);
  padding: 1rem;
  transition: box-shadow 0.2s ease;
}
.card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.card-gold-accent { border-left: 3px solid var(--color-gold); }
.card-tappable { cursor: pointer; }
.card-tappable:active { transform: scale(0.98); }

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}
.badge-navy { background: #E8EBF0; color: var(--color-navy); }
.badge-gold { background: var(--color-gold-pale); color: #8B6340; }
.badge-green { background: var(--color-positive-light); color: var(--color-positive); }
.badge-red { background: var(--color-danger-light); color: var(--color-danger); }
.badge-yellow { background: var(--color-warning-light); color: #8B6F1A; }

.fab {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-gold);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(200,149,108,0.4);
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 40;
}
.fab:hover { transform: scale(1.05); }
.fab:active { transform: scale(0.95); }

.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 50;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
@media (min-width: 768px) {
  .modal-overlay { align-items: center; }
}

.modal-content {
  background: white;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
  animation: slideUp 0.3s ease;
}
@media (min-width: 768px) {
  .modal-content {
    border-radius: var(--radius-lg);
    max-width: 480px;
  }
}
@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.bottom-nav {
  position: fixed; bottom: 0; left: 0; right: 0;
  height: 64px;
  background: white;
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 30;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.top-bar {
  position: fixed; top: 0; left: 0; right: 0;
  height: 56px;
  background: var(--color-navy);
  color: white;
  display: flex;
  align-items: center;
  padding: 0 16px;
  z-index: 30;
}

.page {
  padding: 72px 16px 80px 16px;
  max-width: 768px;
  margin: 0 auto;
}

.progress-track {
  background: var(--color-border-light);
  border-radius: 9999px;
  height: 10px;
  overflow: hidden;
}
.progress-fill {
  background: var(--color-gold);
  height: 100%;
  border-radius: 9999px;
  transition: width 0.6s ease;
}

.demo-banner {
  position: fixed;
  top: 56px; left: 0; right: 0;
  background: var(--color-gold-pale);
  border-bottom: 2px solid var(--color-gold);
  color: #8B6340;
  text-align: center;
  padding: 6px 16px;
  font-size: 0.8rem;
  font-weight: 600;
  z-index: 29;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* When demo banner is visible, push page down */
.page-with-demo { padding-top: 102px; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-in { animation: fadeIn 0.3s ease forwards; }

.upload-zone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.upload-zone:hover {
  border-color: var(--color-gold);
  background: var(--color-gold-pale);
}

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }

/* Toast notification */
.toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-navy);
  color: white;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  z-index: 60;
  animation: fadeIn 0.3s ease;
}
```

---

## 10. Backup & Restore System

### `src/utils/backup.ts` — Export Logic

```ts
// Full backup (ZIP): data.json + files/ folder
//
// Structure of the ZIP:
// backup.zip
// ├── data.json           ← all structured data from all stores
// └── files/
//     ├── {fileId1}.pdf
//     ├── {fileId2}.jpg
//     └── ...
//
// data.json structure:
// {
//   version: 1,
//   exportedAt: "2025-01-15T10:30:00Z",
//   bankAccounts: [...],
//   idsAndCards: [...],
//   fixedDeposits: [...],
//   mutualFunds: [...],
//   retirementItems: [...],
//   properties: [...],
//   documents: [...],
//   fileManifest: [
//     { id: "abc123", fileName: "pan-card.jpg", fileType: "image/jpeg", fileSize: 125000 },
//     ...
//   ]
// }
//
// Implementation:
// 1. Read all stores using getDB()
// 2. Read all files from 'files' store
// 3. Build data.json with all structured data + fileManifest
// 4. Create ZIP using JSZip:
//    - Add data.json as text
//    - For each file: add blob to files/{id}.{extension}
// 5. Generate ZIP blob
// 6. Trigger download using file-saver: saveAs(blob, 'dad-finance-backup-YYYY-MM-DD.zip')
//
// Quick backup (JSON only):
// Same data.json, no files folder, saved directly as .json
// saveAs(new Blob([json], {type: 'application/json'}), 'dad-finance-data-YYYY-MM-DD.json')
```

### `src/utils/restore.ts` — Import Logic

```ts
// Restore from file:
//
// 1. User selects a file (.zip or .json)
// 2. Detect type by extension/MIME
//
// If .json:
//   - Parse JSON
//   - Validate version and structure
//   - Clear all existing stores
//   - Write all data to respective stores
//   - Show success message with counts
//
// If .zip:
//   - Unzip using JSZip
//   - Read data.json from ZIP
//   - Parse and validate
//   - Clear all existing stores
//   - Write all structured data to stores
//   - For each file in fileManifest:
//     - Read corresponding blob from files/ folder in ZIP
//     - Store in 'files' IndexedDB store
//   - Show success message with counts
//
// Error handling:
// - Invalid file format → show error
// - Corrupted ZIP → show error
// - Missing data.json → show error
// - Partial restore → show warning with what succeeded
//
// IMPORTANT: Always confirm with user before restoring
// "This will replace ALL current data. Are you sure?"
// Require user to check a checkbox: "I understand this will delete my current data"
```

### Backup metadata tracking

Store last backup date in localStorage (this is the ONLY thing in localStorage):
```ts
localStorage.setItem('lastBackupDate', new Date().toISOString());
```

Show on Settings page: "Last backup: January 15, 2025" or "Last backup: Never"

---

## 11. Fake Data / Demo Mode

### `src/context/DemoContext.tsx`

```tsx
// DemoContext provides:
// - isDemo: boolean
// - toggleDemo: () => void
//
// When isDemo is true:
// - useStore hook returns fake data instead of IndexedDB data
// - add/update/remove operations are no-ops (fake data is read-only)
// - DemoBanner is shown on all pages
// - Settings page shows demo toggle as ON
//
// When isDemo is false:
// - Normal IndexedDB operations
// - DemoBanner hidden
//
// Demo state stored in React state (lost on refresh) — this is intentional
// so the app always starts in real mode.
```

### `src/utils/fakeData.ts`

**Claude Code: Generate realistic Indian financial fake data.**

```ts
// This file exports functions that return arrays of fake data for each store.
// The data should look realistic but be obviously fake to the developer.
// Use Indian names, Indian banks, realistic interest rates, etc.

export function getFakeBankAccounts(): BankAccount[] {
  return [
    {
      id: 'demo-bank-1',
      bankName: 'State Bank of India',
      accountNumber: '20341056789',
      accountType: 'savings',
      branch: 'Koramangala, Bangalore',
      ifscCode: 'SBIN0004321',
      loginUsername: 'rameshdemo',
      loginPassword: 'Demo@1234',
      netBankingUrl: 'https://retail.onlinesbi.sbi',
      nomineeName: 'Suresh Kumar',
      notes: 'Primary savings account',
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2024-06-15T10:00:00Z',
    },
    {
      id: 'demo-bank-2',
      bankName: 'HDFC Bank',
      accountNumber: '50100123456789',
      accountType: 'salary',
      branch: 'Indiranagar, Bangalore',
      ifscCode: 'HDFC0001234',
      loginUsername: 'ramesh.hdfc',
      loginPassword: 'HdfcDemo@99',
      netBankingUrl: 'https://netbanking.hdfcbank.com',
      nomineeName: 'Suresh Kumar',
      notes: 'Salary account — convert to savings post retirement',
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2024-06-15T10:00:00Z',
    },
    {
      id: 'demo-bank-3',
      bankName: 'ICICI Bank',
      accountNumber: '012345678901',
      accountType: 'savings',
      branch: 'Jayanagar, Bangalore',
      ifscCode: 'ICIC0001234',
      loginUsername: 'ramesh_icici',
      loginPassword: 'IciciDemo#55',
      netBankingUrl: 'https://infinity.icicibank.com',
      nomineeName: 'Lakshmi Devi',
      notes: 'Joint account with wife',
      createdAt: '2024-07-01T10:00:00Z',
      updatedAt: '2024-07-01T10:00:00Z',
    },
  ];
}

export function getFakeFixedDeposits(): FixedDeposit[] {
  return [
    {
      id: 'demo-fd-1',
      bank: 'SBI',
      accountName: 'Ramesh Kumar',
      fdNumber: 'FD20230045123',
      principalAmount: 1500000,
      interestRate: 7.1,
      startDate: '2023-06-15',
      maturityDate: '2026-06-15',
      maturityAmount: 1838000,
      interestPayout: 'cumulative',
      autoRenew: true,
      notes: '',
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2024-06-15T10:00:00Z',
    },
    {
      id: 'demo-fd-2',
      bank: 'HDFC',
      accountName: 'Ramesh Kumar',
      fdNumber: 'HDFCFD789456',
      principalAmount: 2500000,
      interestRate: 7.5,
      startDate: '2024-01-10',
      maturityDate: '2027-01-10',
      maturityAmount: 3093750,
      interestPayout: 'cumulative',
      autoRenew: false,
      notes: 'High yield 3-year FD',
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z',
    },
    {
      id: 'demo-fd-3',
      bank: 'ICICI',
      accountName: 'Ramesh & Lakshmi Kumar',
      fdNumber: 'ICICIFD112233',
      principalAmount: 2000000,
      interestRate: 7.25,
      startDate: '2024-03-01',
      maturityDate: '2025-03-01',
      maturityAmount: 2145000,
      interestPayout: 'quarterly',
      autoRenew: true,
      notes: 'Joint FD — quarterly interest for expenses',
      createdAt: '2024-03-01T10:00:00Z',
      updatedAt: '2024-03-01T10:00:00Z',
    },
    {
      id: 'demo-fd-4',
      bank: 'Post Office',
      accountName: 'Ramesh Kumar',
      fdNumber: 'POTD445566',
      principalAmount: 1000000,
      interestRate: 7.5,
      startDate: '2023-09-15',
      maturityDate: '2028-09-15',
      maturityAmount: 1435629,
      interestPayout: 'cumulative',
      autoRenew: false,
      notes: '5 year tax saver FD',
      createdAt: '2023-09-15T10:00:00Z',
      updatedAt: '2023-09-15T10:00:00Z',
    },
    {
      id: 'demo-fd-5',
      bank: 'SBI',
      accountName: 'Lakshmi Devi',
      fdNumber: 'FD20240078901',
      principalAmount: 1500000,
      interestRate: 6.8,
      startDate: '2024-06-01',
      maturityDate: '2025-06-01',
      maturityAmount: 1602000,
      interestPayout: 'monthly',
      autoRenew: true,
      notes: 'Monthly interest for household expenses',
      createdAt: '2024-06-01T10:00:00Z',
      updatedAt: '2024-06-01T10:00:00Z',
    },
  ];
}

export function getFakeMutualFunds(): MutualFund[] {
  return [
    {
      id: 'demo-mf-1',
      fundName: 'HDFC Balanced Advantage Fund',
      amcName: 'HDFC AMC',
      folioNumber: '1234567890',
      investedAmount: 1200000,
      currentValue: 1450000,
      category: 'hybrid',
      sipActive: true,
      sipAmount: 10000,
      notes: '',
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2024-06-15T10:00:00Z',
    },
    {
      id: 'demo-mf-2',
      fundName: 'SBI Bluechip Fund',
      amcName: 'SBI Mutual Fund',
      folioNumber: '9876543210',
      investedAmount: 800000,
      currentValue: 1050000,
      category: 'equity',
      sipActive: false,
      sipAmount: 0,
      notes: 'Lump sum investment, SIP stopped',
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2024-06-15T10:00:00Z',
    },
    {
      id: 'demo-mf-3',
      fundName: 'ICICI Pru Liquid Fund',
      amcName: 'ICICI Prudential AMC',
      folioNumber: '5544332211',
      investedAmount: 500000,
      currentValue: 520000,
      category: 'liquid',
      sipActive: false,
      sipAmount: 0,
      notes: 'Emergency fund parking',
      createdAt: '2024-08-01T10:00:00Z',
      updatedAt: '2024-08-01T10:00:00Z',
    },
  ];
}

export function getFakeRetirementItems(): RetirementItem[] {
  return [
    {
      id: 'demo-ret-1',
      title: 'Collect Gratuity',
      description: 'Submit Form I to HR. Expected 15 days salary per year of service.',
      category: 'gratuity',
      expectedAmount: 500000,
      deadline: '2025-04-30',
      status: 'in_progress',
      completedAt: null,
      priority: 'high',
      notes: 'HR said 4-6 weeks processing time',
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T10:00:00Z',
    },
    {
      id: 'demo-ret-2',
      title: 'Collect Provident Fund',
      description: 'File PF withdrawal claim on EPFO portal.',
      category: 'pf',
      expectedAmount: 2500000,
      deadline: '2025-05-31',
      status: 'pending',
      completedAt: null,
      priority: 'high',
      notes: 'Need UAN and Aadhaar linked',
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T10:00:00Z',
    },
    {
      id: 'demo-ret-3',
      title: 'Leave Encashment',
      description: 'Encash accumulated earned leave.',
      category: 'leave_encashment',
      expectedAmount: 350000,
      deadline: '2025-03-31',
      status: 'in_progress',
      completedAt: null,
      priority: 'medium',
      notes: '240 days accumulated',
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T10:00:00Z',
    },
    {
      id: 'demo-ret-4',
      title: 'Setup Monthly Pension',
      description: 'Submit pension forms to accounts dept.',
      category: 'pension',
      expectedAmount: 45000,
      deadline: '2025-04-01',
      status: 'pending',
      completedAt: null,
      priority: 'high',
      notes: 'This is monthly amount, not lump sum',
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T10:00:00Z',
    },
    {
      id: 'demo-ret-5',
      title: 'Collect Service Certificate',
      description: 'Get final service certificate from admin.',
      category: 'other',
      expectedAmount: 0,
      deadline: '2025-02-28',
      status: 'completed',
      completedAt: '2025-01-20T10:00:00Z',
      priority: 'medium',
      notes: 'Collected on Jan 20',
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-20T10:00:00Z',
    },
    {
      id: 'demo-ret-6',
      title: 'File Final Tax Return',
      description: 'File ITR for the last financial year of service.',
      category: 'tax',
      expectedAmount: 0,
      deadline: '2025-07-31',
      status: 'pending',
      completedAt: null,
      priority: 'medium',
      notes: 'Collect Form 16 first',
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T10:00:00Z',
    },
    {
      id: 'demo-ret-7',
      title: 'Health Insurance Continuation',
      description: 'Apply for CGHS card or setup private health insurance.',
      category: 'insurance',
      expectedAmount: 0,
      deadline: '2025-03-31',
      status: 'pending',
      completedAt: null,
      priority: 'high',
      notes: 'Must not have a gap in coverage',
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T10:00:00Z',
    },
    {
      id: 'demo-ret-8',
      title: 'Group Insurance Settlement',
      description: 'Claim group insurance benefit from employer.',
      category: 'insurance',
      expectedAmount: 100000,
      deadline: null,
      status: 'completed',
      completedAt: '2025-02-01T10:00:00Z',
      priority: 'low',
      notes: 'Settled ₹1L on Feb 1',
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-02-01T10:00:00Z',
    },
  ];
}

export function getFakeProperties(): Property[] {
  return [
    {
      id: 'demo-prop-1',
      type: 'house',
      label: '3BHK Flat, Koramangala',
      address: 'Flat 402, Prestige Ozone, 5th Block, Koramangala, Bangalore 560034',
      estimatedValue: 9500000,
      purchaseValue: 4500000,
      purchaseDate: '2010-03-15',
      areaSqft: 1450,
      ownershipType: 'sole',
      coOwner: '',
      registrationNumber: 'BLR-2010-KRM-45621',
      fileIds: [],
      notes: 'Currently living here. Home loan paid off in 2020.',
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2024-06-15T10:00:00Z',
    },
    {
      id: 'demo-prop-2',
      type: 'land',
      label: 'Farm Land, Guntur',
      address: 'Survey No. 145, Pedakakani Village, Guntur District, Andhra Pradesh',
      estimatedValue: 2500000,
      purchaseValue: 800000,
      purchaseDate: '2005-11-20',
      areaSqft: 21780,
      ownershipType: 'joint',
      coOwner: 'Suresh Kumar (brother)',
      registrationNumber: 'AP-GNT-2005-14523',
      fileIds: [],
      notes: 'Agricultural land, 0.5 acres. Joint with brother.',
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2024-06-15T10:00:00Z',
    },
    {
      id: 'demo-prop-3',
      type: 'land',
      label: 'Plot, Electronic City',
      address: 'Plot 23, Phase 2, Electronic City, Bangalore 560100',
      estimatedValue: 3500000,
      purchaseValue: 1200000,
      purchaseDate: '2012-08-10',
      areaSqft: 2400,
      ownershipType: 'sole',
      coOwner: '',
      registrationNumber: 'BLR-2012-EC-78901',
      fileIds: [],
      notes: 'Vacant plot. Good appreciation.',
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2024-06-15T10:00:00Z',
    },
  ];
}

export function getFakeIdsAndCards(): IdCard[] {
  return [
    {
      id: 'demo-id-1',
      type: 'aadhaar',
      label: 'Aadhaar Card',
      cardNumber: '9876 5432 1098',
      issuer: 'UIDAI',
      expiryDate: '',
      linkedBank: 'SBI',
      fileId: '',
      notes: '',
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2024-06-15T10:00:00Z',
    },
    {
      id: 'demo-id-2',
      type: 'pan',
      label: 'PAN Card',
      cardNumber: 'ABCDE1234F',
      issuer: 'Income Tax Dept',
      expiryDate: '',
      linkedBank: '',
      fileId: '',
      notes: '',
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2024-06-15T10:00:00Z',
    },
    {
      id: 'demo-id-3',
      type: 'debit_card',
      label: 'SBI Debit Card',
      cardNumber: '4567 8901 2345 6789',
      issuer: 'SBI',
      expiryDate: '2027-09-30',
      linkedBank: 'State Bank of India',
      fileId: '',
      notes: 'RuPay card',
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2024-06-15T10:00:00Z',
    },
    {
      id: 'demo-id-4',
      type: 'health_insurance',
      label: 'Star Health Insurance',
      cardNumber: 'SHI-2024-789456',
      issuer: 'Star Health',
      expiryDate: '2025-12-31',
      linkedBank: '',
      fileId: '',
      notes: 'Family floater 10L cover',
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2024-06-15T10:00:00Z',
    },
    {
      id: 'demo-id-5',
      type: 'passport',
      label: 'Passport',
      cardNumber: 'T1234567',
      issuer: 'Govt of India',
      expiryDate: '2030-05-15',
      linkedBank: '',
      fileId: '',
      notes: '',
      createdAt: '2024-06-15T10:00:00Z',
      updatedAt: '2024-06-15T10:00:00Z',
    },
  ];
}

export function getFakeDocuments(): UploadedDocument[] {
  return []; // Documents are empty in demo since we can't fake blobs
}

// Summary of fake data totals:
// FDs: ₹85,00,000 (85L)
// MFs: ₹30,20,000 (invested ₹25L, current ₹30.2L)
// Liquid Total: ~₹1,15,20,000
// Properties: ₹1,55,00,000 (1.55Cr)
// Net Worth: ~₹2,70,20,000 (2.7Cr)
// Retirement: 2/8 completed
```

---

## 12. PWA Configuration

### `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/dad-finance-tracker/',  // MUST match GitHub repo name for GitHub Pages
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: "Dad's Finance Tracker",
        short_name: 'DadFinance',
        description: 'Track and manage retirement finances — fully offline',
        theme_color: '#1B2A4A',
        background_color: '#F7F8FA',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/dad-finance-tracker/',
        start_url: '/dad-finance-tracker/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
});
```

### PWA Icons

**`public/favicon.svg`:**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#1B2A4A"/>
  <text x="50" y="68" font-family="serif" font-size="55" font-weight="bold" fill="#C8956C" text-anchor="middle">₹</text>
</svg>
```

**For icon-192.png and icon-512.png:** Claude Code should generate these programmatically using a canvas script or an npm package, OR create them as simple SVGs and convert. If too complex, create placeholder PNGs and add a note in README that user can generate proper icons using https://favicon.io or similar.

---

## 13. GitHub Pages Deployment

### `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### GitHub Pages Setup (one-time, on phone browser)

1. Go to your GitHub repo → **Settings** → **Pages**
2. Under "Build and deployment", select **Source: GitHub Actions**
3. That's it. The workflow above handles everything.
4. After first push, your app will be live at: `https://YOUR_USERNAME.github.io/dad-finance-tracker/`

**NO Firebase project needed. NO secrets needed. NO environment variables needed. Just push and it deploys.**

### `.gitignore`

```
node_modules/
dist/
.env
*.log
.DS_Store
```

---

## 14. Post-Deploy Usage Guide

### For the user (include in README.md):

#### First time setup
1. Open `https://YOUR_USERNAME.github.io/dad-finance-tracker/` on your phone
2. Tap the browser menu → "Add to Home Screen" (or "Install App")
3. Open the app from your home screen — it now works like a native app
4. Start adding data!

#### Recommended data entry order
1. 🏦 Bank Accounts (you'll reference these from other sections)
2. 🪪 IDs & Cards (Aadhaar, PAN, passport, debit/credit cards)
3. 💰 Fixed Deposits (all existing FDs with rates, dates)
4. 📈 Mutual Funds (if any)
5. 🏠 Properties (house, land with estimated values)
6. 🎯 Retirement Items (use quick-add presets!)
7. 📁 Upload important documents (scans, PDFs)
8. ✅ Check Dashboard — verify totals look right

#### Backing up your data
1. Go to ⚙️ Settings
2. Tap "Download Full Backup" (ZIP with data + files) — do this monthly
3. Tap "Download Data Backup" (JSON, tiny) — do this weekly
4. Save the file to Google Drive, email it to yourself, or WhatsApp it

#### Moving to a new phone
1. Install the app on the new phone (visit the URL + Add to Home Screen)
2. Go to ⚙️ Settings → Restore from Backup
3. Select your latest backup file (ZIP or JSON)
4. All your data is restored!

#### Showing the app to others
1. Go to ⚙️ Settings
2. Toggle "Demo Mode" ON
3. The app now shows realistic fake data
4. Your real data is completely hidden and untouched
5. Toggle OFF to return to your real data

---

## 15. README.md Content

**Claude Code: Generate this as the project README.md.**

````markdown
# 🏦 Dad's Finance Tracker

A fully offline Progressive Web App to track and manage retirement finances. All data stays on your device — no servers, no accounts, no cloud.

## Features

- 📊 **Dashboard** — Total net worth, liquid/illiquid breakdown, asset allocation chart
- 🏦 **Bank Accounts** — Store login details with masked passwords
- 🪪 **IDs & Cards** — All identification and cards with document scans
- 💰 **Fixed Deposits** — Track FDs with maturity dates, rates, and countdown
- 📈 **Mutual Funds** — Track holdings, gains, and SIPs
- 🏠 **Illiquid Assets** — Houses, land, commercial property
- 🎯 **Retirement Tracker** — Checklist for retirement benefits with progress tracking
- 📁 **Document Vault** — Upload and organize important documents
- 💾 **Backup/Restore** — Full ZIP backup or lightweight JSON export
- 🎭 **Demo Mode** — Show the app with fake data to protect privacy
- 📱 **PWA** — Install on phone, works fully offline

## Tech Stack

React · TypeScript · Vite · IndexedDB · Tailwind CSS · Recharts · JSZip

## How It Works

All data is stored in your browser's IndexedDB. Nothing is sent to any server. To move data between devices, use the backup/restore feature in Settings.

## Deployment (Zero CLI required)

Just push to `main` branch → GitHub Actions automatically installs dependencies, builds the app, and deploys to GitHub Pages. No local setup needed.

Your app will be available at: `https://YOUR_USERNAME.github.io/dad-finance-tracker/`

## Local Development (optional, only if you have a laptop)

```bash
npm install
npm run dev
```

## Setup on Phone

1. Open the URL in Chrome/Safari
2. Tap menu → "Add to Home Screen"
3. Open from home screen — works like a native app!

## Privacy

🔒 **Your data never leaves your device.** There is no server, no database, no analytics, no tracking. Everything is stored locally in your browser.

## License

Private — for personal family use only.
````

---

**END OF SPEC.**

**Claude Code: Generate ALL files with complete, working implementations. No placeholders. No TODOs. Every page must be fully functional with CRUD operations, proper styling, navigation, backup/restore, and demo mode. After generating all files, initialize a git repo, commit everything, and push to the user's GitHub repository. The GitHub Actions workflow will handle building and deploying — no local dev server is needed.**
