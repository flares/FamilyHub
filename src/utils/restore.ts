import JSZip from 'jszip';
import { getDB, clearAllData } from '../db';
import { deriveKey, decryptBytes, fromBase64 } from './crypto';

interface BackupData {
  version: number;
  exportedAt: string;
  bankAccounts: unknown[];
  idsAndCards: unknown[];
  fixedDeposits: unknown[];
  mutualFunds: unknown[];
  retirementItems: unknown[];
  properties: unknown[];
  documents: unknown[];
  fileManifest: { id: string; fileName: string; fileType: string; fileSize: number }[];
  localStorageKeys?: Record<string, string | null>;
}

interface MetaJson {
  version: number;
  encrypted: boolean;
  salt?: string;
}

export type RestoreResult =
  | { success: true; message: string }
  | { success: false; message: string; needsPassword?: boolean };

function restoreLocalStorage(data: BackupData) {
  if (!data.localStorageKeys) return;
  for (const [key, value] of Object.entries(data.localStorageKeys)) {
    if (value !== null && value !== undefined) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  }
}

async function writeDataToStores(data: BackupData): Promise<void> {
  const db = await getDB();

  const storeEntries: [string, unknown[]][] = [
    ['bankAccounts', data.bankAccounts || []],
    ['idsAndCards', data.idsAndCards || []],
    ['fixedDeposits', data.fixedDeposits || []],
    ['mutualFunds', data.mutualFunds || []],
    ['retirementItems', data.retirementItems || []],
    ['properties', data.properties || []],
    ['documents', data.documents || []],
  ];

  for (const [storeName, items] of storeEntries) {
    const store = storeName as 'bankAccounts' | 'idsAndCards' | 'fixedDeposits' | 'mutualFunds' | 'retirementItems' | 'properties' | 'documents';
    for (const item of items) {
      await db.put(store, item as never);
    }
  }
}

function countRecords(data: BackupData): number {
  return [
    data.bankAccounts?.length || 0,
    data.idsAndCards?.length || 0,
    data.fixedDeposits?.length || 0,
    data.mutualFunds?.length || 0,
    data.retirementItems?.length || 0,
    data.properties?.length || 0,
    data.documents?.length || 0,
  ].reduce((a, b) => a + b, 0);
}

export async function restoreFromJson(file: File): Promise<RestoreResult> {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as BackupData;

    if (!data.version || !data.exportedAt) {
      return { success: false, message: 'Invalid backup file format.' };
    }

    await clearAllData();
    await writeDataToStores(data);
    restoreLocalStorage(data);

    return { success: true, message: `Restored ${countRecords(data)} records successfully.` };
  } catch (err) {
    return { success: false, message: `Failed to restore: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

export async function restoreFromZip(file: File, password?: string): Promise<RestoreResult> {
  try {
    const zip = await JSZip.loadAsync(file);

    // Read meta.json if present
    const metaFile = zip.file('meta.json');
    let meta: MetaJson = { version: 1, encrypted: false };
    if (metaFile) {
      meta = JSON.parse(await metaFile.async('text')) as MetaJson;
    }

    if (meta.encrypted) {
      if (!password) {
        return { success: false, message: 'This backup is encrypted. Please enter the backup password.', needsPassword: true };
      }

      const salt = fromBase64(meta.salt!);
      const key = await deriveKey(password, salt);

      const encDataFile = zip.file('data.enc');
      if (!encDataFile) {
        return { success: false, message: 'Invalid encrypted backup: data.enc not found.' };
      }

      let dataText: string;
      try {
        const encBytes = await encDataFile.async('uint8array');
        const decrypted = await decryptBytes(key, encBytes);
        dataText = new TextDecoder().decode(decrypted);
      } catch {
        return { success: false, message: 'Incorrect password or corrupted backup.' };
      }

      const data = JSON.parse(dataText) as BackupData;
      if (!data.version || !data.exportedAt) {
        return { success: false, message: 'Invalid backup file format.' };
      }

      await clearAllData();
      await writeDataToStores(data);
      restoreLocalStorage(data);

      const db = await getDB();
      let filesRestored = 0;
      for (const manifest of (data.fileManifest || [])) {
        const ext = manifest.fileName.split('.').pop() || 'bin';
        const fileEntry = zip.file(`files/${manifest.id}.${ext}.enc`);
        if (fileEntry) {
          try {
            const encBytes = await fileEntry.async('uint8array');
            const decBuf = await decryptBytes(key, encBytes);
            const blob = new Blob([decBuf], { type: manifest.fileType });
            await db.put('files', { id: manifest.id, blob, fileName: manifest.fileName, fileType: manifest.fileType, fileSize: manifest.fileSize });
            filesRestored++;
          } catch { /* skip corrupted file */ }
        }
      }

      return { success: true, message: `Restored ${countRecords(data)} records and ${filesRestored} files successfully.` };
    }

    // Unencrypted ZIP
    const dataFile = zip.file('data.json');
    if (!dataFile) {
      return { success: false, message: 'Invalid backup: data.json not found in ZIP.' };
    }

    const text = await dataFile.async('text');
    const data = JSON.parse(text) as BackupData;

    if (!data.version || !data.exportedAt) {
      return { success: false, message: 'Invalid backup file format.' };
    }

    await clearAllData();
    await writeDataToStores(data);
    restoreLocalStorage(data);

    const db = await getDB();
    let filesRestored = 0;

    for (const manifest of (data.fileManifest || [])) {
      const ext = manifest.fileName.split('.').pop() || 'bin';
      const fileEntry = zip.file(`files/${manifest.id}.${ext}`);
      if (fileEntry) {
        const blob = await fileEntry.async('blob');
        await db.put('files', { id: manifest.id, blob, fileName: manifest.fileName, fileType: manifest.fileType, fileSize: manifest.fileSize });
        filesRestored++;
      }
    }

    return { success: true, message: `Restored ${countRecords(data)} records and ${filesRestored} files successfully.` };
  } catch (err) {
    return { success: false, message: `Failed to restore: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

export async function restoreFromFile(file: File, password?: string): Promise<RestoreResult> {
  if (file.name.endsWith('.zip') || file.type === 'application/zip') {
    return restoreFromZip(file, password);
  } else if (file.name.endsWith('.json') || file.type === 'application/json') {
    return restoreFromJson(file);
  } else {
    return { success: false, message: 'Please select a .zip or .json backup file.' };
  }
}
