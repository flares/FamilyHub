import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getDB } from '../db';
import { format } from 'date-fns';

export async function exportFullBackup(): Promise<void> {
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

  const dataJson = JSON.stringify({
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
  }, null, 2);

  const zip = new JSZip();
  zip.file('data.json', dataJson);

  const filesFolder = zip.folder('files')!;
  for (const f of files) {
    const ext = f.fileName.split('.').pop() || 'bin';
    filesFolder.file(`${f.id}.${ext}`, f.blob);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  saveAs(blob, `dad-finance-backup-${dateStr}.zip`);
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
  }, null, 2);

  const dateStr = format(new Date(), 'yyyy-MM-dd');
  saveAs(new Blob([data], { type: 'application/json' }), `dad-finance-data-${dateStr}.json`);
  localStorage.setItem('lastBackupDate', new Date().toISOString());
}
