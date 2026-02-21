import { useState, useRef } from 'react';
import { FileText, Image, Download, Trash2, Search, Pencil, X, FolderInput } from 'lucide-react';
import { saveAs } from 'file-saver';
import { useStore } from '../hooks/useStore';
import { useFileStore } from '../hooks/useFileStore';
import FilePreview from '../components/FilePreview';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/dates';
import type { UploadedDocument, DocumentCategory } from '../types';

const DOC_SECTIONS_KEY = 'dad-finance-doc-sections';
const CATEGORIES: DocumentCategory[] = ['bank', 'tax', 'insurance', 'property', 'retirement', 'medical', 'other'];
const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function loadSections(): string[] {
  try {
    const stored = localStorage.getItem(DOC_SECTIONS_KEY);
    return stored ? JSON.parse(stored) : ['General'];
  } catch {
    return ['General'];
  }
}

export default function DocumentVaultPage() {
  const { data, loading, add, update, remove } = useStore<'documents'>('documents');
  const { saveFile, getFile, deleteFile } = useFileStore();

  // Sections
  const [sections, setSections] = useState<string[]>(loadSections);
  const [activeSection, setActiveSection] = useState<string>('All');
  const [showManageSections, setShowManageSections] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [renamingSection, setRenamingSection] = useState<string | null>(null);
  const [renameTo, setRenameTo] = useState('');

  // Move
  const [moveTarget, setMoveTarget] = useState<UploadedDocument | null>(null);
  const [moveTo, setMoveTo] = useState('');

  // Upload
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<UploadedDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UploadedDocument | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<DocumentCategory>('other');
  const [sectionInput, setSectionInput] = useState(sections[0]);
  const [notesInput, setNotesInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const docs = data as UploadedDocument[];

  const saveSections = (next: string[]) => {
    setSections(next);
    localStorage.setItem(DOC_SECTIONS_KEY, JSON.stringify(next));
  };

  const addSection = () => {
    const name = newSectionName.trim();
    if (!name || sections.includes(name)) return;
    saveSections([...sections, name]);
    setNewSectionName('');
  };

  const commitRename = async (oldName: string) => {
    const next = renameTo.trim();
    if (!next || next === oldName || sections.includes(next)) return;
    saveSections(sections.map(s => s === oldName ? next : s));
    // Update all docs with this section
    const toUpdate = docs.filter(d => (d.section || sections[0]) === oldName);
    for (const doc of toUpdate) {
      await update(doc.id, { section: next } as Partial<UploadedDocument>);
    }
    if (activeSection === oldName) setActiveSection(next);
    setRenamingSection(null);
  };

  const removeSection = (name: string) => {
    if (sections.length <= 1) return;
    saveSections(sections.filter(s => s !== name));
    if (activeSection === name) setActiveSection('All');
  };

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
    setSectionInput(activeSection !== 'All' ? activeSection : sections[0]);
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
        section: sectionInput,
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

  const handleMove = async () => {
    if (!moveTarget) return;
    await update(moveTarget.id, { section: moveTo } as Partial<UploadedDocument>);
    setMoveTarget(null);
  };

  const filtered = docs.filter(doc => {
    const docSection = doc.section || sections[0];
    const matchSection = activeSection === 'All' || docSection === activeSection;
    const matchSearch = !search || doc.label.toLowerCase().includes(search.toLowerCase());
    return matchSection && matchSearch;
  });

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Document Vault</h2>
          <span className="badge badge-navy">{docs.length}</span>
        </div>
        <button
          onClick={() => setShowManageSections(true)}
          className="text-xs font-medium px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-[var(--color-navy)]"
        >
          Manage Sections
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['All', ...sections].map(s => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeSection === s
                ? 'bg-[var(--color-navy)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Upload Zone */}
      {!pendingFile ? (
        <div>
          <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl">📄</span>
              <span className="text-sm font-medium">Tap to upload a document</span>
              <span className="text-xs text-[var(--color-text-muted)]">PDF, JPG, PNG, WEBP · Max 10MB</span>
            </div>
          </div>
          {uploadError && <p className="text-xs text-[var(--color-danger)] mt-1">{uploadError}</p>}
        </div>
      ) : (
        <div className="card" style={{ borderColor: 'var(--color-gold)', borderWidth: 1 }}>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--color-text-muted)] block mb-1">Section</label>
                <select
                  value={sectionInput}
                  onChange={e => setSectionInput(e.target.value)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                >
                  {sections.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--color-text-muted)] block mb-1">Category</label>
                <select
                  value={categoryInput}
                  onChange={e => setCategoryInput(e.target.value as DocumentCategory)}
                  className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
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
              <button
                onClick={() => { setPendingFile(null); setUploadError(''); }}
                className="flex-1 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!labelInput || uploading}
                className="flex-1 py-2 bg-[var(--color-navy)] text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
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

      {/* Documents grid */}
      {filtered.length === 0 ? (
        <EmptyState icon="📁" title="No documents" description="Upload your important documents to keep them safe." />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {filtered.map(doc => (
            <div key={doc.id} className="card p-3 cursor-pointer" onClick={() => setPreview(doc)}>
              <div className="flex items-center justify-center mb-2 text-3xl">
                {doc.fileType === 'application/pdf'
                  ? <FileText className="w-8 h-8 text-[var(--color-danger)]" />
                  : <Image className="w-8 h-8 text-[var(--color-navy)]" />}
              </div>
              <p className="text-sm font-medium truncate">{doc.label}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="badge badge-navy text-xs">{doc.category}</span>
                {doc.section && doc.section !== sections[0] && (
                  <span className="badge badge-gold text-xs">{doc.section}</span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{formatFileSize(doc.fileSizeBytes)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{formatDate(doc.createdAt)}</p>
              <div className="flex gap-1 mt-2" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => handleDownload(doc)}
                  className="p-1 rounded hover:bg-gray-100"
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                </button>
                <button
                  onClick={() => { setMoveTarget(doc); setMoveTo(doc.section || sections[0]); }}
                  className="p-1 rounded hover:bg-gray-100"
                  title="Move to section"
                >
                  <FolderInput className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                </button>
                <button
                  onClick={() => setDeleteTarget(doc)}
                  className="p-1 rounded hover:bg-[var(--color-danger-light)]"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5 text-[var(--color-danger)]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File preview */}
      {preview && (
        <FilePreview
          fileId={preview.fileId}
          fileName={preview.fileName}
          fileType={preview.fileType}
          onClose={() => setPreview(null)}
        />
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

      {/* Move to section modal */}
      {moveTarget && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setMoveTarget(null)}
        >
          <div
            className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold">Move Document</h3>
            <p className="text-sm text-[var(--color-text-muted)] truncate">"{moveTarget.label}"</p>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] block mb-1">Move to section</label>
              <select
                value={moveTo}
                onChange={e => setMoveTo(e.target.value)}
                className="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
              >
                {sections.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMoveTarget(null)}
                className="flex-1 py-2 border border-[var(--color-border)] rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleMove}
                className="flex-1 py-2 bg-[var(--color-navy)] text-white rounded-lg text-sm font-medium"
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Sections bottom sheet */}
      {showManageSections && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowManageSections(false)}
        >
          <div
            className="bg-white w-full rounded-t-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Manage Sections</h3>
              <button onClick={() => setShowManageSections(false)}>
                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
              </button>
            </div>

            <div className="space-y-2">
              {sections.map(s => {
                const count = docs.filter(d => (d.section || sections[0]) === s).length;
                return (
                  <div key={s} className="flex items-center gap-2 py-1">
                    {renamingSection === s ? (
                      <>
                        <input
                          autoFocus
                          value={renameTo}
                          onChange={e => setRenameTo(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && commitRename(s)}
                          className="flex-1 border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm"
                        />
                        <button
                          onClick={() => commitRename(s)}
                          className="text-xs font-medium px-3 py-1.5 bg-[var(--color-navy)] text-white rounded-lg"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setRenamingSection(null)}
                          className="text-xs px-2 py-1.5 text-[var(--color-text-muted)]"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium">{s}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">{count} doc{count !== 1 ? 's' : ''}</span>
                        <button
                          onClick={() => { setRenamingSection(s); setRenameTo(s); }}
                          className="p-1.5 rounded-lg hover:bg-gray-100"
                        >
                          <Pencil className="w-4 h-4 text-[var(--color-text-muted)]" />
                        </button>
                        {sections.length > 1 && (
                          <button
                            onClick={() => removeSection(s)}
                            className="p-1.5 rounded-lg hover:bg-[var(--color-danger-light)]"
                          >
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
                <input
                  value={newSectionName}
                  onChange={e => setNewSectionName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSection()}
                  placeholder="e.g. Property1 Docs, Tax Returns"
                  className="flex-1 border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
                />
                <button
                  onClick={addSection}
                  disabled={!newSectionName.trim()}
                  className="px-4 py-2 bg-[var(--color-navy)] text-white rounded-lg text-sm font-medium disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
