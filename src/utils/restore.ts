import JSZip from 'jszip';
import { getDB, clearAllData } from '../db';

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

export async function restoreFromJson(file: File): Promise<{ success: boolean; message: string }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as BackupData;

    if (!data.version || !data.exportedAt) {
      return { success: false, message: 'Invalid backup file format.' };
    }

    await clearAllData();
    await writeDataToStores(data);

    const counts = [
      data.bankAccounts?.length || 0,
      data.idsAndCards?.length || 0,
      data.fixedDeposits?.length || 0,
      data.mutualFunds?.length || 0,
      data.retirementItems?.length || 0,
      data.properties?.length || 0,
      data.documents?.length || 0,
    ].reduce((a, b) => a + b, 0);

    return { success: true, message: `Restored ${counts} records successfully.` };
  } catch (err) {
    return { success: false, message: `Failed to restore: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

export async function restoreFromZip(file: File): Promise<{ success: boolean; message: string }> {
  try {
    const zip = await JSZip.loadAsync(file);
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

    const db = await getDB();
    let filesRestored = 0;

    for (const manifest of (data.fileManifest || [])) {
      const ext = manifest.fileName.split('.').pop() || 'bin';
      const fileEntry = zip.file(`files/${manifest.id}.${ext}`);
      if (fileEntry) {
        const blob = await fileEntry.async('blob');
        await db.put('files', {
          id: manifest.id,
          blob,
          fileName: manifest.fileName,
          fileType: manifest.fileType,
          fileSize: manifest.fileSize,
        });
        filesRestored++;
      }
    }

    const counts = [
      data.bankAccounts?.length || 0,
      data.idsAndCards?.length || 0,
      data.fixedDeposits?.length || 0,
      data.mutualFunds?.length || 0,
      data.retirementItems?.length || 0,
      data.properties?.length || 0,
      data.documents?.length || 0,
    ].reduce((a, b) => a + b, 0);

    return {
      success: true,
      message: `Restored ${counts} records and ${filesRestored} files successfully.`,
    };
  } catch (err) {
    return { success: false, message: `Failed to restore: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

export async function restoreFromFile(file: File): Promise<{ success: boolean; message: string }> {
  if (file.name.endsWith('.zip') || file.type === 'application/zip') {
    return restoreFromZip(file);
  } else if (file.name.endsWith('.json') || file.type === 'application/json') {
    return restoreFromJson(file);
  } else {
    return { success: false, message: 'Please select a .zip or .json backup file.' };
  }
}
