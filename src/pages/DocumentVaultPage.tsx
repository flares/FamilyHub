import { useState, useRef } from 'react';
import { FileText, Image, Download, Trash2, Search } from 'lucide-react';
import { saveAs } from 'file-saver';
import { useStore } from '../hooks/useStore';
import { useFileStore } from '../hooks/useFileStore';
import FilterChips from '../components/FilterChips';
import FilePreview from '../components/FilePreview';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/dates';
import type { UploadedDocument, DocumentCategory } from '../types';

const CATEGORIES: string[] = ['All', 'bank', 'tax', 'insurance', 'property', 'retirement', 'medical', 'other'];
const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function DocumentVaultPage() {
  const { data, loading, add, remove } = useStore<'documents'>('documents');
  const { saveFile, getFile, deleteFile } = useFileStore();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<UploadedDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UploadedDocument | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<DocumentCategory>('other');
  const [notesInput, setNotesInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const docs = data as UploadedDocument[];

  const filtered = docs.filter(doc => {
    const matchFilter = filter === 'All' || doc.category === filter;
    const matchSearch = !search || doc.label.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadError('');

    if (!ACCEPTED.includes(file.type)) {
      setUploadError('Only PDF, JPG, PNG, WEBP allowed.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setUploadError('File too large (max 10MB).');
      return;
    }
    setPendingFile(file);
    setLabelInput(file.name.replace(/\.[^.]+$/, ''));
  };

  const handleSave = async () => {
    if (!pendingFile || !labelInput) return;
    setUploading(true);
    try {
      const fileId = await saveFile(pendingFile);
      await add({
        label: labelInput,
        category: categoryInput,
        fileId,
        fileName: pendingFile.name,
        fileType: pendingFile.type,
        fileSizeBytes: pendingFile.size,
        tags: [],
        notes: notesInput,
      } as Omit<UploadedDocument, 'id' | 'createdAt' | 'updatedAt'>);
      setPendingFile(null);
      setLabelInput('');
      setNotesInput('');
      setCategoryInput('other');
    } catch (err) {
      setUploadError('Upload failed. Please try again.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: UploadedDocument) => {
    await deleteFile(doc.fileId);
    await remove(doc.id);
  };

  const handleDownload = async (doc: UploadedDocument) => {
    const file = await getFile(doc.fileId);
    if (file) saveAs(file.blob, doc.fileName);
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Document Vault</h2>
        <span className="badge badge-navy">{docs.length}</span>
      </div>

      {/* Upload Zone */}
      {!pendingFile ? (
        <div>
          <div
            className="upload-zone"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl">📄</span>
              <span className="text-sm font-medium">Tap to upload a document</span>
              <span className="text-xs text-[var(--color-text-muted)]">PDF, JPG, PNG, WEBP · Max 10MB</span>
            </div>
          </div>
          {uploadError && <p className="text-xs text-[var(--color-danger)] mt-1">{uploadError}</p>}
        </div>
      ) : (
        <div className="card border-[var(--color-gold)]" style={{ borderColor: 'var(--color-gold)' }}>
          <p className="text-sm font-medium mb-3">📎 {pendingFile.name} ({formatFileSize(pendingFile.size)})</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] block mb-1">Label *</label>
              <input
                type="text"
                value={labelInput}
                onChange={e => setLabelInput(e.target.value)}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                placeholder="Document label"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] block mb-1">Category</label>
              <select
                value={categoryInput}
                onChange={e => setCategoryInput(e.target.value as DocumentCategory)}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
              >
                {CATEGORIES.slice(1).map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] block mb-1">Notes</label>
              <textarea
                value={notesInput}
                onChange={e => setNotesInput(e.target.value)}
                rows={2}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setPendingFile(null); setUploadError(''); }}
                className="flex-1 py-2 border border-[var(--color-border)] rounded-lg text-sm">
                Cancel
              </button>
              <button onClick={handleSave} disabled={!labelInput || uploading}
                className="flex-1 py-2 bg-[var(--color-navy)] text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {uploading && <LoadingSpinner size="sm" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search documents..."
          className="w-full border border-[var(--color-border)] rounded-lg pl-9 pr-3 py-2.5 text-sm"
        />
      </div>

      {/* Filter */}
      <FilterChips options={CATEGORIES} selected={filter} onChange={setFilter} />

      {/* Documents Grid */}
      {filtered.length === 0 ? (
        <EmptyState icon="📁" title="No documents" description="Upload your important documents to keep them safe." />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {filtered.map(doc => (
            <div key={doc.id} className="card p-3 cursor-pointer" onClick={() => setPreview(doc)}>
              <div className="flex items-center justify-center mb-2 text-3xl">
                {doc.fileType === 'application/pdf' ? <FileText className="w-8 h-8 text-[var(--color-danger)]" /> : <Image className="w-8 h-8 text-[var(--color-navy)]" />}
              </div>
              <p className="text-sm font-medium truncate">{doc.label}</p>
              <span className="badge badge-navy text-xs mt-1">{doc.category}</span>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{formatFileSize(doc.fileSizeBytes)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{formatDate(doc.createdAt)}</p>
              <div className="flex gap-1 mt-2" onClick={e => e.stopPropagation()}>
                <button onClick={() => handleDownload(doc)} className="p-1 rounded hover:bg-gray-100">
                  <Download className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                </button>
                <button onClick={() => setDeleteTarget(doc)} className="p-1 rounded hover:bg-[var(--color-danger-light)]">
                  <Trash2 className="w-3.5 h-3.5 text-[var(--color-danger)]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <FilePreview
          fileId={preview.fileId}
          fileName={preview.fileName}
          fileType={preview.fileType}
          onClose={() => setPreview(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Document"
        message={`Delete "${deleteTarget?.label}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={async () => { if (deleteTarget) await handleDelete(deleteTarget); }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
