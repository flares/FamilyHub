import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { BankAccount, IdCard, FixedDeposit, MutualFund, RetirementItem, Property, UploadedDocument, StoredFile } from './types';

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
    key: string;
    value: StoredFile;
  };
}

const DB_NAME = 'dad-finance-db';
const DB_VERSION = 1;

export async function getDB(): Promise<IDBPDatabase<DadFinanceDB>> {
  return openDB<DadFinanceDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const bankStore = db.createObjectStore('bankAccounts', { keyPath: 'id' });
      bankStore.createIndex('by-bank', 'bankName');

      const idStore = db.createObjectStore('idsAndCards', { keyPath: 'id' });
      idStore.createIndex('by-type', 'type');

      const fdStore = db.createObjectStore('fixedDeposits', { keyPath: 'id' });
      fdStore.createIndex('by-bank', 'bank');
      fdStore.createIndex('by-maturity', 'maturityDate');

      const mfStore = db.createObjectStore('mutualFunds', { keyPath: 'id' });
      mfStore.createIndex('by-category', 'category');

      const retStore = db.createObjectStore('retirementItems', { keyPath: 'id' });
      retStore.createIndex('by-status', 'status');
      retStore.createIndex('by-priority', 'priority');

      const propStore = db.createObjectStore('properties', { keyPath: 'id' });
      propStore.createIndex('by-type', 'type');

      const docStore = db.createObjectStore('documents', { keyPath: 'id' });
      docStore.createIndex('by-category', 'category');

      db.createObjectStore('files', { keyPath: 'id' });
    },
  });
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const storeNames = [
    'bankAccounts', 'idsAndCards', 'fixedDeposits', 'mutualFunds',
    'retirementItems', 'properties', 'documents', 'files'
  ] as const;
  const tx = db.transaction(storeNames, 'readwrite');
  await Promise.all(storeNames.map(name => tx.objectStore(name).clear()));
  await tx.done;
}

export type { DadFinanceDB };
