import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import DataCard from '../components/DataCard';
import FormModal from '../components/FormModal';
import EmptyState from '../components/EmptyState';
import FileUploader from '../components/FileUploader';
import FilePreview from '../components/FilePreview';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCurrency } from '../hooks/useCurrency';
import { formatDate } from '../utils/dates';
import type { Property, FieldConfig } from '../types';

const FIELDS: FieldConfig[] = [
  { name: 'type', label: 'Type', type: 'select', required: true,
    options: [
      { value: 'house', label: 'House / Flat' },
      { value: 'land', label: 'Land / Plot' },
      { value: 'commercial', label: 'Commercial' },
      { value: 'other', label: 'Other' },
    ]},
  { name: 'label', label: 'Label', type: 'text', required: true, placeholder: 'e.g. Bangalore Flat' },
  { name: 'address', label: 'Full Address', type: 'textarea', required: true },
  { name: 'estimatedValue', label: 'Estimated Current Value (₹)', type: 'number', required: true },
  { name: 'purchaseValue', label: 'Purchase Value (₹)', type: 'number' },
  { name: 'purchaseDate', label: 'Purchase Date', type: 'date' },
  { name: 'areaSqft', label: 'Area (sq ft)', type: 'number' },
  { name: 'ownershipType', label: 'Ownership', type: 'select',
    options: [
      { value: 'sole', label: 'Sole Owner' },
      { value: 'joint', label: 'Joint Owner' },
    ]},
  { name: 'coOwner', label: 'Co-Owner Name', type: 'text' },
  { name: 'registrationNumber', label: 'Registration Number', type: 'text' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

const TYPE_ICON: Record<string, string> = {
  house: '🏠', land: '🌾', commercial: '🏢', other: '🏗️',
};

export default function IlliquidAssetsPage() {
  const { data, loading, add, update, remove } = useStore<'properties'>('properties');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Property | null>(null);
  const [previewFile, setPreviewFile] = useState<{ fileId: string; name: string } | null>(null);

  const { formatCurrency } = useCurrency();
  const properties = data as Property[];
  const total = properties.reduce((s, p) => s + p.estimatedValue, 0);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (editItem) {
      await update(editItem.id, formData as Partial<Property>);
    } else {
      await add({ ...formData, fileIds: [] } as unknown as Omit<Property, 'id' | 'createdAt' | 'updatedAt'>);
    }
    setEditItem(null);
  };

  const handleFileUploaded = async (prop: Property, fileId: string) => {
    await update(prop.id, { fileIds: [...(prop.fileIds || []), fileId] });
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%)' }}>
        <p className="text-white/70 text-sm mb-1">Total Illiquid Assets</p>
        <p className="currency-large" style={{ color: 'var(--color-gold)' }}>{formatCurrency(total)}</p>
      </div>

      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold">Properties</h2>
        <span className="badge badge-navy">{properties.length}</span>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          icon="🏠"
          title="No properties yet"
          description="Track your houses, land and commercial properties."
          action={
            <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-[var(--color-navy)] text-white rounded-xl text-sm font-medium">
              Add Property
            </button>
          }
        />
      ) : (
        properties.map(prop => {
          const appreciation = prop.purchaseValue > 0
            ? ((prop.estimatedValue - prop.purchaseValue) / prop.purchaseValue * 100).toFixed(1)
            : null;
          return (
            <DataCard
              key={prop.id}
              icon={TYPE_ICON[prop.type]}
              title={prop.label}
              subtitle={prop.address}
              badges={[
                { label: prop.type, variant: 'navy' },
                { label: prop.ownershipType === 'joint' ? 'Joint' : 'Sole Owner', variant: 'gold' },
              ]}
              rightContent={
                <div className="text-right">
                  <p className="currency font-semibold text-sm">{formatCurrency(prop.estimatedValue)}</p>
                  {appreciation && (
                    <p className="text-xs text-[var(--color-positive)]">+{appreciation}%</p>
                  )}
                </div>
              }
              onEdit={() => { setEditItem(prop); setShowForm(true); }}
              onDelete={() => remove(prop.id)}
              expandedContent={
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">Address</span>
                    <span className="text-right max-w-xs">{prop.address}</span>
                  </div>
                  {prop.purchaseValue > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-muted)]">Purchase Value</span>
                      <span className="currency">{formatCurrency(prop.purchaseValue)}</span>
                    </div>
                  )}
                  {prop.purchaseDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-muted)]">Purchase Date</span>
                      <span>{formatDate(prop.purchaseDate)}</span>
                    </div>
                  )}
                  {prop.areaSqft > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-muted)]">Area</span>
                      <span>{prop.areaSqft.toLocaleString()} sq ft</span>
                    </div>
                  )}
                  {prop.coOwner && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-muted)]">Co-Owner</span>
                      <span>{prop.coOwner}</span>
                    </div>
                  )}
                  {prop.registrationNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-muted)]">Reg. Number</span>
                      <span className="font-mono text-xs">{prop.registrationNumber}</span>
                    </div>
                  )}
                  {prop.notes && <p className="text-sm text-[var(--color-text-muted)] pt-1">{prop.notes}</p>}

                  {/* Documents */}
                  {prop.fileIds && prop.fileIds.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1">Attached Documents</p>
                      <div className="flex flex-wrap gap-2">
                        {prop.fileIds.map((fid, i) => (
                          <button
                            key={fid}
                            onClick={() => setPreviewFile({ fileId: fid, name: `Document ${i + 1}` })}
                            className="text-xs px-2 py-1 rounded bg-[var(--color-border-light)] text-[var(--color-navy)] font-medium"
                          >
                            Doc {i + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <FileUploader
                    label="Attach document"
                    onUploaded={(fileId) => handleFileUploaded(prop, fileId)}
                  />
                </div>
              }
            />
          );
        })
      )}

      <button className="fab" onClick={() => { setEditItem(null); setShowForm(true); }}>+</button>

      <FormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        title={editItem ? 'Edit Property' : 'Add Property'}
        fields={FIELDS}
        onSubmit={handleSubmit}
        initialData={(editItem as unknown as Record<string, unknown>) ?? undefined}
      />

      {previewFile && (
        <FilePreview
          fileId={previewFile.fileId}
          fileName={previewFile.name}
          fileType="application/pdf"
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
