import { useState } from 'react';
import { Pencil, X, ChevronRight, ChevronDown } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import DataCard from '../components/DataCard';
import FormModal from '../components/FormModal';
import EmptyState from '../components/EmptyState';
import FilterChips from '../components/FilterChips';
import FileUploader from '../components/FileUploader';
import FilePreview from '../components/FilePreview';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/dates';
import type { IdCard, FieldConfig } from '../types';

const SECTIONS_KEY = 'dad-finance-id-sections';

const BASE_FIELDS: FieldConfig[] = [
  { name: 'type', label: 'Type', type: 'select', required: true,
    options: [
      { value: 'aadhaar', label: 'Aadhaar' },
      { value: 'pan', label: 'PAN Card' },
      { value: 'passport', label: 'Passport' },
      { value: 'voter_id', label: 'Voter ID' },
      { value: 'driving_license', label: 'Driving License' },
      { value: 'credit_card', label: 'Credit Card' },
      { value: 'debit_card', label: 'Debit Card' },
      { value: 'health_insurance', label: 'Health Insurance' },
      { value: 'other', label: 'Other' },
    ]},
  { name: 'label', label: 'Label', type: 'text', required: true, placeholder: 'e.g. SBI Debit Card' },
  { name: 'cardNumber', label: 'Card/ID Number', type: 'text', required: true },
  { name: 'issuer', label: 'Issuer', type: 'text', placeholder: 'e.g. SBI, UIDAI' },
  { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
  { name: 'linkedBank', label: 'Linked Bank', type: 'text' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

const TYPE_GROUPS: Record<string, string[]> = {
  IDs: ['aadhaar', 'pan', 'passport', 'voter_id', 'driving_license'],
  'Bank Cards': ['credit_card', 'debit_card'],
  Insurance: ['health_insurance'],
  Other: ['other'],
};

const FILTER_OPTIONS = ['All', 'IDs', 'Bank Cards', 'Insurance', 'Other'];

function loadSections(): string[] {
  try {
    const stored = localStorage.getItem(SECTIONS_KEY);
    return stored ? JSON.parse(stored) : ['General'];
  } catch {
    return ['General'];
  }
}

export default function IdsCardsPage() {
  const { data, loading, add, update, remove } = useStore<'idsAndCards'>('idsAndCards');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<IdCard | null>(null);
  const [filter, setFilter] = useState('All');
  const [previewItem, setPreviewItem] = useState<IdCard | null>(null);

  const [sections, setSections] = useState<string[]>(loadSections);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set()); // all collapsed by default
  const [showManageSections, setShowManageSections] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [renamingSection, setRenamingSection] = useState<string | null>(null);
  const [renameTo, setRenameTo] = useState('');

  const toggleSection = (name: string) =>
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  const saveSections = (next: string[]) => {
    setSections(next);
    localStorage.setItem(SECTIONS_KEY, JSON.stringify(next));
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
    const updated = sections.map(s => s === oldName ? next : s);
    saveSections(updated);
    // Update all cards that had this person value
    const toUpdate = (data as IdCard[]).filter(
      item => (item.person || sections[0]) === oldName
    );
    for (const item of toUpdate) {
      await update(item.id, { person: next } as Partial<IdCard>);
    }
    setRenamingSection(null);
  };

  const removeSection = (name: string) => {
    if (sections.length <= 1) return; // keep at least one
    const next = sections.filter(s => s !== name);
    saveSections(next);
  };

  // Dynamic fields with person picker injected after label
  const fields: FieldConfig[] = [
    ...BASE_FIELDS,
    {
      name: 'person',
      label: 'Person / Section',
      type: 'select',
      options: sections.map(s => ({ value: s, label: s })),
      defaultValue: sections[0],
    },
  ];

  const typeFiltered = filter === 'All'
    ? (data as IdCard[])
    : (data as IdCard[]).filter(item => TYPE_GROUPS[filter]?.includes(item.type));

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (editItem) {
      await update(editItem.id, formData as Partial<IdCard>);
    } else {
      await add({ ...formData, fileId: '' } as Omit<IdCard, 'id' | 'createdAt' | 'updatedAt'>);
    }
    setEditItem(null);
  };

  const handleFileUploaded = async (item: IdCard, fileId: string) => {
    await update(item.id, { fileId });
  };

  const openEdit = (item: IdCard) => {
    setEditItem(item);
    setShowForm(true);
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  const ungrouped = typeFiltered.filter(
    item => !item.person || !sections.includes(item.person)
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">IDs & Cards</h2>
          <span className="badge badge-navy">{data.length}</span>
        </div>
        <button
          onClick={() => setShowManageSections(true)}
          className="text-xs font-medium px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-[var(--color-navy)]"
        >
          Manage Sections
        </button>
      </div>

      <FilterChips options={FILTER_OPTIONS} selected={filter} onChange={setFilter} />

      {typeFiltered.length === 0 ? (
        <EmptyState
          icon="🪪"
          title="No IDs or cards"
          description="Store your Aadhaar, PAN, passport, cards and more."
          action={
            <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-[var(--color-navy)] text-white rounded-xl text-sm font-medium">
              Add ID / Card
            </button>
          }
        />
      ) : (
        <>
          {/* Accordion sections */}
          {[
            ...sections.map(section => ({
              key: section,
              label: section,
              items: typeFiltered.filter(item => (item.person || sections[0]) === section),
            })),
            ...(ungrouped.length > 0
              ? [{ key: '__ungrouped__', label: 'Uncategorised', items: ungrouped }]
              : []),
          ].map(({ key, label, items }) => {
            if (items.length === 0) return null;
            const isOpen = openSections.has(key);
            return (
              <div key={key} className="card overflow-hidden p-0">
                {/* Accordion header */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                  onClick={() => toggleSection(key)}
                >
                  {isOpen
                    ? <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />}
                  <span className="flex-1 text-sm font-semibold">{label}</span>
                  <span className="badge badge-navy">{items.length}</span>
                </button>

                {/* Items (DataCards) inside accordion */}
                {isOpen && (
                  <div className="border-t border-[var(--color-border)] divide-y divide-[var(--color-border)] px-3 pb-3 pt-2 space-y-2">
                    {items.map(item => (
                      <div key={item.id} className="pt-2 first:pt-0">
                        <DataCard
                          title={item.label}
                          subtitle={item.issuer || item.type}
                          badges={[
                            { label: item.type.replace('_', ' '), variant: 'navy' },
                            ...(item.expiryDate ? [{ label: `Exp: ${formatDate(item.expiryDate)}`, variant: 'gold' as const }] : []),
                          ]}
                          onEdit={() => openEdit(item)}
                          onDelete={() => remove(item.id)}
                          expandedContent={
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-[var(--color-text-muted)]">Full Number</span>
                                <span className="font-mono">{item.cardNumber}</span>
                              </div>
                              {item.expiryDate && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-[var(--color-text-muted)]">Expiry</span>
                                  <span>{formatDate(item.expiryDate)}</span>
                                </div>
                              )}
                              {item.linkedBank && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-[var(--color-text-muted)]">Linked Bank</span>
                                  <span>{item.linkedBank}</span>
                                </div>
                              )}
                              {item.notes && <p className="text-sm text-[var(--color-text-muted)]">{item.notes}</p>}
                              {item.fileId ? (
                                <button onClick={() => setPreviewItem(item)} className="text-sm text-[var(--color-navy)] font-medium underline">
                                  View attached document
                                </button>
                              ) : (
                                <FileUploader label="Attach scan/photo" onUploaded={(fileId) => handleFileUploaded(item, fileId)} />
                              )}
                            </div>
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      <button className="fab" onClick={() => { setEditItem(null); setShowForm(true); }}>+</button>

      {/* Add / Edit form */}
      <FormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        title={editItem ? 'Edit ID / Card' : 'Add ID / Card'}
        fields={fields}
        onSubmit={handleSubmit}
        initialData={
          editItem
            ? { ...(editItem as unknown as Record<string, unknown>), person: editItem.person || sections[0] }
            : { person: sections[0] }
        }
      />

      {/* File preview */}
      {previewItem?.fileId && (
        <FilePreview
          fileId={previewItem.fileId}
          fileName={previewItem.label}
          fileType="image/jpeg"
          onClose={() => setPreviewItem(null)}
        />
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
              {sections.map(s => (
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
              ))}
            </div>

            <div className="border-t border-[var(--color-border)] pt-3">
              <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">Add new section</p>
              <div className="flex gap-2">
                <input
                  value={newSectionName}
                  onChange={e => setNewSectionName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSection()}
                  placeholder="e.g. Amma, Nanna, Shared"
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
