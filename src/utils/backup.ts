import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getDB } from '../db';
import { format } from 'date-fns';
import { generateSalt, deriveKey, encryptBytes, toBase64 } from './crypto';

const LS_KEYS = ['dad-finance-id-sections', 'dad-finance-doc-sections'];

function collectLocalStorageSections(): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  for (const key of LS_KEYS) result[key] = localStorage.getItem(key);
  return result;
}

function dateStamp(): string {
  return format(new Date(), 'yyyyMMdd');
}

export async function exportFullBackup(password?: string): Promise<void> {
  const db = await getDB();

  const [bankAccounts, idsAndCards, fixedDeposits, mutualFunds, retirementItems, properties, documents, files] =
    await Promise.all([
      db.getAll('bankAccounts'),
      db.getAll('idsAndCards'),
      db.getAll('fixedDeposits'),
      db.getAll('mutualFunds'),
      db.getAll('retirementItems'),
      db.getAll('properties'),
      db.getAll('documents'),
      db.getAll('files'),
    ]);

  const fileManifest = files.map(f => ({
    id: f.id,
    fileName: f.fileName,
    fileType: f.fileType,
    fileSize: f.fileSize,
  }));

  const dataObj = {
    version: 1,
    exportedAt: new Date().toISOString(),
    bankAccounts,
    idsAndCards,
    fixedDeposits,
    mutualFunds,
    retirementItems,
    properties,
    documents,
    fileManifest,
    localStorageKeys: collectLocalStorageSections(),
  };

  const zip = new JSZip();

  if (password) {
    const salt = generateSalt();
    const key = await deriveKey(password, salt);

    // Store unencrypted meta
    zip.file('meta.json', JSON.stringify({ version: 1, encrypted: true, salt: toBase64(salt) }));

    // Encrypt data.json
    const dataBytes = new TextEncoder().encode(JSON.stringify(dataObj, null, 2));
    const encData = await encryptBytes(key, dataBytes);
    zip.file('data.enc', encData);

    // Encrypt each file
    const filesFolder = zip.folder('files')!;
    for (const f of files) {
      const ext = f.fileName.split('.').pop() || 'bin';
      const arrBuf = await f.blob.arrayBuffer();
      const encFile = await encryptBytes(key, arrBuf);
      filesFolder.file(`${f.id}.${ext}.enc`, encFile);
    }
  } else {
    const dataJson = JSON.stringify(dataObj, null, 2);
    zip.file('meta.json', JSON.stringify({ version: 1, encrypted: false }));
    zip.file('data.json', dataJson);

    const filesFolder = zip.folder('files')!;
    for (const f of files) {
      const ext = f.fileName.split('.').pop() || 'bin';
      filesFolder.file(`${f.id}.${ext}`, f.blob);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `dadfin_v1_${dateStamp()}.zip`);
  localStorage.setItem('lastBackupDate', new Date().toISOString());
}

export async function exportQuickBackup(): Promise<void> {
  const db = await getDB();

  const [bankAccounts, idsAndCards, fixedDeposits, mutualFunds, retirementItems, properties, documents] =
    await Promise.all([
      db.getAll('bankAccounts'),
      db.getAll('idsAndCards'),
      db.getAll('fixedDeposits'),
      db.getAll('mutualFunds'),
      db.getAll('retirementItems'),
      db.getAll('properties'),
      db.getAll('documents'),
    ]);

  const data = JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    bankAccounts,
    idsAndCards,
    fixedDeposits,
    mutualFunds,
    retirementItems,
    properties,
    documents,
    fileManifest: [],
    localStorageKeys: collectLocalStorageSections(),
  }, null, 2);

  saveAs(new Blob([data], { type: 'application/json' }), `dadfin_v1_${dateStamp()}.json`);
  localStorage.setItem('lastBackupDate', new Date().toISOString());
}
