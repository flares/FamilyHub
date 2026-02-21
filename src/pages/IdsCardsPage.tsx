import { useState } from 'react';
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

const FIELDS: FieldConfig[] = [
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

export default function IdsCardsPage() {
  const { data, loading, add, update, remove } = useStore<'idsAndCards'>('idsAndCards');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<IdCard | null>(null);
  const [filter, setFilter] = useState('All');
  const [previewItem, setPreviewItem] = useState<IdCard | null>(null);

  const filtered = filter === 'All'
    ? data
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

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">IDs & Cards</h2>
        <span className="badge badge-navy">{data.length}</span>
      </div>

      <FilterChips options={FILTER_OPTIONS} selected={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
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
        (filtered as IdCard[]).map(item => (
          <DataCard
            key={item.id}
            title={item.label}
            subtitle={item.issuer || item.type}
            badges={[
              { label: item.type.replace('_', ' '), variant: 'navy' },
              ...(item.expiryDate ? [{ label: `Exp: ${formatDate(item.expiryDate)}`, variant: 'gold' as const }] : []),
            ]}
            onEdit={() => { setEditItem(item); setShowForm(true); }}
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

                {/* File section */}
                {item.fileId ? (
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="text-sm text-[var(--color-navy)] font-medium underline"
                  >
                    View attached document
                  </button>
                ) : (
                  <FileUploader
                    label="Attach scan/photo"
                    onUploaded={(fileId) => handleFileUploaded(item, fileId)}
                  />
                )}
              </div>
            }
          />
        ))
      )}

      <button className="fab" onClick={() => { setEditItem(null); setShowForm(true); }}>+</button>

      <FormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        title={editItem ? 'Edit ID / Card' : 'Add ID / Card'}
        fields={FIELDS}
        onSubmit={handleSubmit}
        initialData={(editItem as unknown as Record<string, unknown>) ?? undefined}
      />

      {previewItem?.fileId && (
        <FilePreview
          fileId={previewItem.fileId}
          fileName={previewItem.label}
          fileType="image/jpeg"
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  );
}
