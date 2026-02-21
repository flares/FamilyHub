import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileText, Image as ImageIcon, Download, Trash2, Search,
  Pencil, X, FolderInput, ChevronRight, ChevronDown, Share2, Check,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { useStore } from '../hooks/useStore';
import { useFileStore } from '../hooks/useFileStore';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/dates';
import type { UploadedDocument, DocumentCategory } from '../types';
import type { StoredFile } from '../types';

const DOC_SECTIONS_KEY = 'dad-finance-doc-sections';
const CATEGORIES: DocumentCategory[] = ['bank', 'tax', 'insurance', 'property', 'retirement', 'medical', 'other'];
const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function loadDocSections(): string[] {
  try {
    const s = localStorage.getItem(DOC_SECTIONS_KEY);
    return s ? JSON.parse(s) : ['General'];
  } catch { return ['General']; }
}

// Helper: get all file IDs/names/types from a doc (backward compat)
function docFileIds(doc: UploadedDocument): string[] {
  return doc.fileIds?.length ? doc.fileIds : doc.fileId ? [doc.fileId] : [];
}
function docFileNames(doc: UploadedDocument): string[] {
  return doc.fileNames?.length ? doc.fileNames : doc.fileName ? [doc.fileName] : [];
}
function docFileTypes(doc: UploadedDocument): string[] {
  return doc.fileTypes?.length ? doc.fileTypes : doc.fileType ? [doc.fileType] : [];
}

// ─── Full-screen viewer ───────────────────────────────────────────────────────
interface ViewerProps {
  doc: UploadedDocument;
  onClose: () => void;
  getFile: (id: string) => Promise<StoredFile | null>;
}

function DocViewer({ doc, onClose, getFile }: ViewerProps) {
  const ids = docFileIds(doc);
  const names = docFileNames(doc);
  const types = docFileTypes(doc);
  const [files, setFiles] = useState<{ url: string; blob: Blob; name: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const urls: string[] = [];
    Promise.all(ids.map(id => getFile(id))).then(results => {
      const loaded = results
        .map((f, i) => {
          if (!f) return null;
          const url = URL.createObjectURL(f.blob);
          urls.push(url);
          return { url, blob: f.blob, name: names[i] || doc.fileName, type: types[i] || doc.fileType };
        })
        .filter(Boolean) as { url: string; blob: Blob; name: string; type: string }[];
      setFiles(loaded);
      setLoading(false);
    });
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [doc.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShare = async () => {
    if (files.length === 0) return;
    setSharing(true);
    try {
      const shareFiles = files.map(f => new File([f.blob], f.name, { type: f.type }));
      if (navigator.share && navigator.canShare && navigator.canShare({ files: shareFiles })) {
        await navigator.share({ files: shareFiles, title: doc.label });
      } else {
        // Fallback: download all
        for (const f of files) saveAs(f.blob, f.name);
      }
    } catch {
      // share dismissed
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = () => {
    for (const f of files) saveAs(f.blob, f.name);
  };

  const isPdf = files[0]?.type === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={onClose}>
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-4 py-3 safe-top"
        style={{ background: 'rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="p-2 rounded-full bg-white/10">
          <X className="w-5 h-5 text-white" />
        </button>
        <p className="flex-1 text-white text-sm font-medium truncate">{doc.label}</p>
        <button onClick={handleShare} disabled={sharing || loading} className="p-2 rounded-full bg-white/10 disabled:opacity-40">
          <Share2 className="w-5 h-5 text-white" />
        </button>
        <button onClick={handleDownload} disabled={loading} className="p-2 rounded-full bg-white/10 disabled:opacity-40">
          <Download className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" onClick={e => e.stopPropagation()}>
        {loading && (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
          </div>
        )}
        {!loading && files.length === 0 && (
          <div className="flex items-center justify-center h-full text-white/50 text-sm">
            File not found.
          </div>
        )}
        {!loading && files.length > 0 && (
          isPdf ? (
            <div className="h-full flex flex-col items-center p-4 gap-4">
              <iframe
                src={files[0].url}
                className="w-full flex-1 rounded border-0"
                title={files[0].name}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4 px-2">
              {files.map((f, i) => (
                <img
                  key={i}
                  src={f.url}
                  alt={f.name}
                  className="max-w-full rounded-lg shadow-lg"
                  style={{ maxHeight: '85vh', objectFit: 'contain' }}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DocumentVaultPage() {
  const { data, loading, add, update, remove } = useStore<'documents'>('documents');
  const { saveFile, getFile, deleteFile } = useFileStore();

  const docs = data as UploadedDocument[];

  // Sections
  const [sections, setSections] = useState<string[]>(loadDocSections);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set()); // all closed by default
  const [showManageSections, setShowManageSections] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [renamingSection, setRenamingSection] = useState<string | null>(null);
  const [renameTo, setRenameTo] = useState('');

  // Inline doc rename
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [renameDocInput, setRenameDocInput] = useState('');

  // Upload
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [labelInput, setLabelInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<DocumentCategory>('other');
  const [sectionInput, setSectionInput] = useState(sections[0]);
  const [notesInput, setNotesInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Viewer / move / delete
  const [viewDoc, setViewDoc] = useState<UploadedDocument | null>(null);
  const [moveTarget, setMoveTarget] = useState<UploadedDocument | null>(null);
  const [moveTo, setMoveTo] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<UploadedDocument | null>(null);

  // Search
  const [search, setSearch] = useState('');

  // ── sections helpers ──────────────────────────────────────────────────────
  const saveSections = (next: string[]) => {
    setSections(next);
    localStorage.setItem(DOC_SECTIONS_KEY, JSON.stringify(next));
  };

  const toggleSection = (name: string) =>
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  const addSection = () => {
    const name = newSectionName.trim();
    if (!name || sections.includes(name)) return;
    saveSections([...sections, name]);
    setNewSectionName('');
  };

  const commitRenameSection = useCallback(async (oldName: string) => {
    const next = renameTo.trim();
    if (!next || next === oldName || sections.includes(next)) return;
    saveSections(sections.map(s => s === oldName ? next : s));
    const toUpdate = docs.filter(d => (d.section || sections[0]) === oldName);
    for (const doc of toUpdate) await update(doc.id, { section: next } as Partial<UploadedDocument>);
    setRenamingSection(null);
  }, [renameTo, sections, docs, update]); // eslint-disable-line react-hooks/exhaustive-deps

  const removeSection = (name: string) => {
    if (sections.length <= 1) return;
    saveSections(sections.filter(s => s !== name));
  };

  // ── upload helpers ────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = '';
    setUploadError('');

    for (const f of files) {
      if (!ACCEPTED.includes(f.type)) { setUploadError('Only PDF, JPG, PNG, WEBP allowed.'); return; }
      if (f.size > MAX_SIZE) { setUploadError('Each file must be under 10 MB.'); return; }
    }
    if (files.length > 1 && files.some(f => f.type === 'application/pdf')) {
      setUploadError('Multiple upload is for images only. PDFs must be uploaded one at a time.');
      return;
    }
    setPendingFiles(files);
    setLabelInput(files.length === 1 ? files[0].name.replace(/\.[^.]+$/, '') : '');
  };

  const handleSave = async () => {
    if (!pendingFiles.length || !labelInput) return;
    setUploading(true);
    try {
      const fileIds: string[] = [];
      const fileNames: string[] = [];
      const fileTypes: string[] = [];
      let totalSize = 0;
      for (const file of pendingFiles) {
        const id = await saveFile(file);
        fileIds.push(id);
        fileNames.push(file.name);
        fileTypes.push(file.type);
        totalSize += file.size;
      }
      await add({
        label: labelInput,
        category: categoryInput,
        fileId: fileIds[0],
        fileIds,
        fileName: fileNames[0],
        fileNames,
        fileType: fileTypes[0],
        fileTypes,
        fileSizeBytes: totalSize,
        tags: [],
        notes: notesInput,
        section: sectionInput,
      } as Omit<UploadedDocument, 'id' | 'createdAt' | 'updatedAt'>);
      setPendingFiles([]);
      setLabelInput('');
      setNotesInput('');
      setCategoryInput('other');
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: UploadedDocument) => {
    const ids = docFileIds(doc);
    for (const id of ids) await deleteFile(id);
    await remove(doc.id);
  };

  const handleMove = async () => {
    if (!moveTarget) return;
    await update(moveTarget.id, { section: moveTo } as Partial<UploadedDocument>);
    setMoveTarget(null);
  };

  const commitRenameDoc = async (doc: UploadedDocument) => {
    const name = renameDocInput.trim();
    if (name && name !== doc.label) await update(doc.id, { label: name } as Partial<UploadedDocument>);
    setRenamingDocId(null);
  };

  // ── filter ────────────────────────────────────────────────────────────────
  const matchSearch = (doc: UploadedDocument) =>
    !search || doc.label.toLowerCase().includes(search.toLowerCase());

  const docsForSection = (sectionName: string) =>
    docs.filter(d => (d.section || sections[0]) === sectionName && matchSearch(d));

  const ungrouped = docs.filter(d => (!d.section || !sections.includes(d.section)) && matchSearch(d));

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  const totalDocs = docs.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Document Vault</h2>
          <span className="badge badge-navy">{totalDocs}</span>
        </div>
        <button
          onClick={() => setShowManageSections(true)}
          className="text-xs font-medium px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-[var(--color-navy)]"
        >
          Manage Sections
        </button>
      </div>

      {/* Upload zone */}
      {!pendingFiles.length ? (
        <div>
          <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl">📄</span>
              <span className="text-sm font-medium">Tap to upload</span>
              <span className="text-xs text-[var(--color-text-muted)]">PDF · JPG · PNG · WEBP · Max 10 MB · Multiple images OK</span>
            </div>
          </div>
          {uploadError && <p className="text-xs text-[var(--color-danger)] mt-1">{uploadError}</p>}
        </div>
      ) : (
        <div className="card" style={{ borderColor: 'var(--color-gold)', borderWidth: 1 }}>
          <p className="text-sm font-medium mb-3">
            📎 {pendingFiles.length === 1
              ? `${pendingFiles[0].name} (${formatFileSize(pendingFiles[0].size)})`
              : `${pendingFiles.length} images selected (${formatFileSize(pendingFiles.reduce((s, f) => s + f.size, 0))} total)`}
          </p>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--color-text-muted)] block mb-1">Section</label>
                <select value={sectionInput} onChange={e => setSectionInput(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm">
                  {sections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--color-text-muted)] block mb-1">Category</label>
                <select value={categoryInput} onChange={e => setCategoryInput(e.target.value as DocumentCategory)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] block mb-1">Notes</label>
              <textarea value={notesInput} onChange={e => setNotesInput(e.target.value)} rows={2}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setPendingFiles([]); setUploadError(''); }}
                className="flex-1 py-2 border border-[var(--color-border)] rounded-lg text-sm">Cancel</button>
              <button onClick={handleSave} disabled={!labelInput || uploading}
                className="flex-1 py-2 bg-[var(--color-navy)] text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {uploading && <LoadingSpinner size="sm" />} Save
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search documents…"
          className="w-full border border-[var(--color-border)] rounded-lg pl-9 pr-3 py-2.5 text-sm" />
      </div>

      {/* Sections accordion */}
      {totalDocs === 0 ? (
        <EmptyState icon="📁" title="No documents" description="Upload your important documents to keep them safe." />
      ) : (
        <div className="space-y-2">
          {sections.map(sectionName => {
            const items = docsForSection(sectionName);
            const isOpen = openSections.has(sectionName);

            return (
              <div key={sectionName} className="card overflow-hidden p-0">
                {/* Section header */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                  onClick={() => toggleSection(sectionName)}
                >
                  {isOpen
                    ? <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />}
                  <span className="flex-1 text-sm font-semibold">{sectionName}</span>
                  <span className="badge badge-navy">{items.length}</span>
                </button>

                {/* Items list */}
                {isOpen && (
                  <div className="border-t border-[var(--color-border)]">
                    {items.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-[var(--color-text-muted)]">No documents in this section.</p>
                    ) : (
                      items.map((doc, idx) => {
                        const ids = docFileIds(doc);
                        const types = docFileTypes(doc);
                        const isPdf = types[0] === 'application/pdf';
                        const multiImage = ids.length > 1;
                        const isRenamingThis = renamingDocId === doc.id;

                        return (
                          <div
                            key={doc.id}
                            className={`flex items-center gap-3 px-4 py-3 ${idx > 0 ? 'border-t border-[var(--color-border)]' : ''} cursor-pointer hover:bg-gray-50 transition-colors`}
                            onClick={() => !isRenamingThis && setViewDoc(doc)}
                          >
                            {/* Icon */}
                            <div className="flex-shrink-0">
                              {isPdf
                                ? <FileText className="w-5 h-5 text-[var(--color-danger)]" />
                                : multiImage
                                  ? <span className="text-base">🖼</span>
                                  : <ImageIcon className="w-5 h-5 text-[var(--color-navy)]" />}
                            </div>

                            {/* Label — editable inline */}
                            <div className="flex-1 min-w-0" onClick={e => isRenamingThis && e.stopPropagation()}>
                              {isRenamingThis ? (
                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                  <input
                                    autoFocus
                                    value={renameDocInput}
                                    onChange={e => setRenameDocInput(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') commitRenameDoc(doc);
                                      if (e.key === 'Escape') setRenamingDocId(null);
                                    }}
                                    onBlur={() => commitRenameDoc(doc)}
                                    className="flex-1 border border-[var(--color-border)] rounded-lg px-2 py-1 text-sm"
                                  />
                                  <button onClick={() => commitRenameDoc(doc)} className="p-1 text-[var(--color-positive)]">
                                    <Check className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm font-medium truncate">{doc.label}</p>
                                  <p className="text-xs text-[var(--color-text-muted)]">
                                    {formatFileSize(doc.fileSizeBytes)}
                                    {multiImage ? ` · ${ids.length} images` : ''}
                                    {' · '}{formatDate(doc.createdAt)}
                                  </p>
                                </>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => { setRenamingDocId(doc.id); setRenameDocInput(doc.label); }}
                                className="p-1.5 rounded-lg hover:bg-gray-100"
                                title="Rename"
                              >
                                <Pencil className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                              </button>
                              <button
                                onClick={() => { setMoveTarget(doc); setMoveTo(doc.section || sections[0]); }}
                                className="p-1.5 rounded-lg hover:bg-gray-100"
                                title="Move to section"
                              >
                                <FolderInput className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(doc)}
                                className="p-1.5 rounded-lg hover:bg-[var(--color-danger-light)]"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-[var(--color-danger)]" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Ungrouped docs (legacy records with no section) */}
          {ungrouped.length > 0 && (
            <div className="card overflow-hidden p-0">
              <button
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                onClick={() => toggleSection('__ungrouped__')}
              >
                {openSections.has('__ungrouped__')
                  ? <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />}
                <span className="flex-1 text-sm font-semibold text-[var(--color-text-muted)]">Uncategorised</span>
                <span className="badge badge-navy">{ungrouped.length}</span>
              </button>
              {openSections.has('__ungrouped__') && (
                <div className="border-t border-[var(--color-border)]">
                  {ungrouped.map((doc, idx) => {
                    const ids = docFileIds(doc);
                    const types = docFileTypes(doc);
                    const isPdf = types[0] === 'application/pdf';
                    const multiImage = ids.length > 1;
                    const isRenamingThis = renamingDocId === doc.id;

                    return (
                      <div
                        key={doc.id}
                        className={`flex items-center gap-3 px-4 py-3 ${idx > 0 ? 'border-t border-[var(--color-border)]' : ''} cursor-pointer hover:bg-gray-50`}
                        onClick={() => !isRenamingThis && setViewDoc(doc)}
                      >
                        <div className="flex-shrink-0">
                          {isPdf
                            ? <FileText className="w-5 h-5 text-[var(--color-danger)]" />
                            : multiImage ? <span className="text-base">🖼</span>
                              : <ImageIcon className="w-5 h-5 text-[var(--color-navy)]" />}
                        </div>
                        <div className="flex-1 min-w-0" onClick={e => isRenamingThis && e.stopPropagation()}>
                          {isRenamingThis ? (
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <input autoFocus value={renameDocInput} onChange={e => setRenameDocInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') commitRenameDoc(doc); if (e.key === 'Escape') setRenamingDocId(null); }}
                                onBlur={() => commitRenameDoc(doc)}
                                className="flex-1 border border-[var(--color-border)] rounded-lg px-2 py-1 text-sm" />
                              <button onClick={() => commitRenameDoc(doc)} className="p-1 text-[var(--color-positive)]"><Check className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm font-medium truncate">{doc.label}</p>
                              <p className="text-xs text-[var(--color-text-muted)]">
                                {formatFileSize(doc.fileSizeBytes)}{multiImage ? ` · ${ids.length} images` : ''} · {formatDate(doc.createdAt)}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                          <button onClick={() => { setRenamingDocId(doc.id); setRenameDocInput(doc.label); }} className="p-1.5 rounded-lg hover:bg-gray-100"><Pencil className="w-3.5 h-3.5 text-[var(--color-text-muted)]" /></button>
                          <button onClick={() => { setMoveTarget(doc); setMoveTo(doc.section || sections[0]); }} className="p-1.5 rounded-lg hover:bg-gray-100"><FolderInput className="w-3.5 h-3.5 text-[var(--color-text-muted)]" /></button>
                          <button onClick={() => setDeleteTarget(doc)} className="p-1.5 rounded-lg hover:bg-[var(--color-danger-light)]"><Trash2 className="w-3.5 h-3.5 text-[var(--color-danger)]" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Full-screen viewer */}
      {viewDoc && (
        <DocViewer doc={viewDoc} onClose={() => setViewDoc(null)} getFile={getFile} />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Document"
        message={`Delete "${deleteTarget?.label}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={async () => { if (deleteTarget) await handleDelete(deleteTarget); }}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Move to section */}
      {moveTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setMoveTarget(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold">Move Document</h3>
            <p className="text-sm text-[var(--color-text-muted)] truncate">"{moveTarget.label}"</p>
            <select value={moveTo} onChange={e => setMoveTo(e.target.value)}
              className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm">
              {sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setMoveTarget(null)} className="flex-1 py-2 border border-[var(--color-border)] rounded-lg text-sm">Cancel</button>
              <button onClick={handleMove} className="flex-1 py-2 bg-[var(--color-navy)] text-white rounded-lg text-sm font-medium">Move</button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Sections bottom sheet */}
      {showManageSections && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowManageSections(false)}>
          <div className="bg-white w-full rounded-t-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Manage Sections</h3>
              <button onClick={() => setShowManageSections(false)}><X className="w-5 h-5 text-[var(--color-text-muted)]" /></button>
            </div>
            <div className="space-y-2">
              {sections.map(s => {
                const count = docs.filter(d => (d.section || sections[0]) === s).length;
                return (
                  <div key={s} className="flex items-center gap-2 py-1">
                    {renamingSection === s ? (
                      <>
                        <input autoFocus value={renameTo} onChange={e => setRenameTo(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && commitRenameSection(s)}
                          className="flex-1 border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm" />
                        <button onClick={() => commitRenameSection(s)}
                          className="text-xs font-medium px-3 py-1.5 bg-[var(--color-navy)] text-white rounded-lg">Save</button>
                        <button onClick={() => setRenamingSection(null)} className="text-xs px-2 py-1.5 text-[var(--color-text-muted)]">Cancel</button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium">{s}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">{count} doc{count !== 1 ? 's' : ''}</span>
                        <button onClick={() => { setRenamingSection(s); setRenameTo(s); }} className="p-1.5 rounded-lg hover:bg-gray-100">
                          <Pencil className="w-4 h-4 text-[var(--color-text-muted)]" />
                        </button>
                        {sections.length > 1 && (
                          <button onClick={() => removeSection(s)} className="p-1.5 rounded-lg hover:bg-[var(--color-danger-light)]">
                            <X className="w-4 h-4 text-[var(--color-danger)]" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="border-t border-[var(--color-border)] pt-3">
              <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">Add new section</p>
              <div className="flex gap-2">
                <input value={newSectionName} onChange={e => setNewSectionName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSection()}
                  placeholder="e.g. Property1 Docs, Tax Returns"
                  className="flex-1 border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
                <button onClick={addSection} disabled={!newSectionName.trim()}
                  className="px-4 py-2 bg-[var(--color-navy)] text-white rounded-lg text-sm font-medium disabled:opacity-40">Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
