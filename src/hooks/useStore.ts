import { useState, useEffect, useCallback, useContext } from 'react';
import { getDB } from '../db';
import { DemoContext } from '../context/DemoContext';
import {
  getFakeBankAccounts,
  getFakeFixedDeposits,
  getFakeMutualFunds,
  getFakeRetirementItems,
  getFakeProperties,
  getFakeIdsAndCards,
  getFakeDocuments,
} from '../utils/fakeData';
import type { StoreName } from '../types';

type StoreMap = {
  bankAccounts: import('../types').BankAccount;
  idsAndCards: import('../types').IdCard;
  fixedDeposits: import('../types').FixedDeposit;
  mutualFunds: import('../types').MutualFund;
  retirementItems: import('../types').RetirementItem;
  properties: import('../types').Property;
  documents: import('../types').UploadedDocument;
  files: import('../types').StoredFile;
};

function getFakeDataForStore(storeName: StoreName): unknown[] {
  switch (storeName) {
    case 'bankAccounts': return getFakeBankAccounts();
    case 'idsAndCards': return getFakeIdsAndCards();
    case 'fixedDeposits': return getFakeFixedDeposits();
    case 'mutualFunds': return getFakeMutualFunds();
    case 'retirementItems': return getFakeRetirementItems();
    case 'properties': return getFakeProperties();
    case 'documents': return getFakeDocuments();
    default: return [];
  }
}

export function useStore<S extends StoreName>(storeName: S) {
  type T = StoreMap[S];
  const { isDemo } = useContext(DemoContext);
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (isDemo) {
      const fakeData = getFakeDataForStore(storeName) as T[];
      setData(fakeData.sort((a, b) => {
        const ae = a as { createdAt: string };
        const be = b as { createdAt: string };
        return new Date(be.createdAt).getTime() - new Date(ae.createdAt).getTime();
      }));
      setLoading(false);
      return;
    }

    try {
      const db = await getDB();
      const all = await db.getAll(storeName as Exclude<StoreName, 'files'>) as T[];
      const sorted = [...all].sort((a, b) => {
        const ae = a as { createdAt?: string };
        const be = b as { createdAt?: string };
        if (!ae.createdAt || !be.createdAt) return 0;
        return new Date(be.createdAt).getTime() - new Date(ae.createdAt).getTime();
      });
      setData(sorted);
    } catch (err) {
      console.error(`Error loading ${storeName}:`, err);
    } finally {
      setLoading(false);
    }
  }, [storeName, isDemo]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  const add = useCallback(async (item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (isDemo) return;
    const db = await getDB();
    const now = new Date().toISOString();
    const newItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    } as T;
    await db.put(storeName as Exclude<StoreName, 'files'>, newItem as never);
    await refresh();
  }, [storeName, isDemo, refresh]);

  const update = useCallback(async (id: string, partial: Partial<T>) => {
    if (isDemo) return;
    const db = await getDB();
    const existing = await db.get(storeName as Exclude<StoreName, 'files'>, id);
    if (!existing) return;
    const updated = {
      ...existing,
      ...partial,
      updatedAt: new Date().toISOString(),
    } as T;
    await db.put(storeName as Exclude<StoreName, 'files'>, updated as never);
    await refresh();
  }, [storeName, isDemo, refresh]);

  const remove = useCallback(async (id: string) => {
    if (isDemo) return;
    const db = await getDB();
    await db.delete(storeName as Exclude<StoreName, 'files'>, id);
    await refresh();
  }, [storeName, isDemo, refresh]);

  return { data, loading, add, update, remove, refresh };
}
