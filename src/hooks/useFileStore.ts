import { useCallback } from 'react';
import { getDB } from '../db';
import type { StoredFile } from '../types';

export function useFileStore() {
  const saveFile = useCallback(async (file: File): Promise<string> => {
    const db = await getDB();
    const id = crypto.randomUUID();
    const storedFile: StoredFile = {
      id,
      blob: file,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    };
    await db.put('files', storedFile);
    return id;
  }, []);

  const getFile = useCallback(async (id: string): Promise<StoredFile | null> => {
    if (!id) return null;
    const db = await getDB();
    const file = await db.get('files', id);
    return file ?? null;
  }, []);

  const getFileUrl = useCallback(async (id: string): Promise<string | null> => {
    const file = await getFile(id);
    if (!file) return null;
    return URL.createObjectURL(file.blob);
  }, [getFile]);

  const deleteFile = useCallback(async (id: string): Promise<void> => {
    if (!id) return;
    const db = await getDB();
    await db.delete('files', id);
  }, []);

  const getAllFiles = useCallback(async (): Promise<StoredFile[]> => {
    const db = await getDB();
    return db.getAll('files');
  }, []);

  return { saveFile, getFile, getFileUrl, deleteFile, getAllFiles };
}
