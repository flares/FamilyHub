import { useState } from 'react';
import { Copy, Check, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import DataCard from '../components/DataCard';
import FormModal from '../components/FormModal';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import type { BankAccount, FieldConfig } from '../types';

const FIELDS: FieldConfig[] = [
  { name: 'bankName', label: 'Bank Name', type: 'text', required: true, placeholder: 'e.g. State Bank of India' },
  { name: 'accountNumber', label: 'Account Number', type: 'text', required: true },
  { name: 'accountType', label: 'Account Type', type: 'select', required: true,
    options: [
      { value: 'savings', label: 'Savings' },
      { value: 'current', label: 'Current' },
      { value: 'salary', label: 'Salary' },
      { value: 'pension', label: 'Pension' },
    ]},
  { name: 'branch', label: 'Branch', type: 'text', placeholder: 'e.g. MG Road, Bangalore' },
  { name: 'ifscCode', label: 'IFSC Code', type: 'text', placeholder: 'e.g. SBIN0001234' },
  { name: 'loginUsername', label: 'Net Banking Username', type: 'text' },
  { name: 'loginPassword', label: 'Net Banking Password', type: 'password' },
  { name: 'netBankingUrl', label: 'Net Banking URL', type: 'url', placeholder: 'https://...' },
  { name: 'nomineeName', label: 'Nominee', type: 'text' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];

function maskAccount(num: string) {
  if (num.length <= 4) return num;
  return 'XXXX ' + num.slice(-4);
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1 rounded hover:bg-gray-100 text-[var(--color-text-muted)]">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function PasswordField({ value }: { value: string }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm">{show ? value : '••••••••'}</span>
      <button onClick={() => setShow(s => !s)} className="p-1 rounded hover:bg-gray-100 text-[var(--color-text-muted)]">
        {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
      <button onClick={copy} className="p-1 rounded hover:bg-gray-100 text-[var(--color-text-muted)]">
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function DetailRow({ label, value, copyable, password, url }: {
  label: string; value: string;
  copyable?: boolean; password?: boolean; url?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-[var(--color-border-light)] last:border-0">
      <span className="text-xs text-[var(--color-text-muted)] w-32 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-1 flex-1 min-w-0 justify-end">
        {password ? (
          <PasswordField value={value} />
        ) : (
          <>
            <span className="text-sm text-right break-all">{value}</span>
            {copyable && <CopyButton value={value} />}
            {url && (
              <a href={value} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-gray-100 rounded">
                <ExternalLink className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function BankAccountsPage() {
  const { data, loading, add, update, remove } = useStore<'bankAccounts'>('bankAccounts');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<BankAccount | null>(null);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (editItem) {
      await update(editItem.id, formData as Partial<BankAccount>);
    } else {
      await add(formData as Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>);
    }
    setEditItem(null);
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">Bank Accounts</h2>
        <span className="badge badge-navy">{data.length}</span>
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon="🏦"
          title="No bank accounts yet"
          description="Store your bank login details securely on your device."
          action={
            <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-[var(--color-navy)] text-white rounded-xl text-sm font-medium">
              Add Bank Account
            </button>
          }
        />
      ) : (
        data.map(account => {
          const acc = account as BankAccount;
          return (
            <DataCard
              key={acc.id}
              title={acc.bankName}
              subtitle={acc.accountType.charAt(0).toUpperCase() + acc.accountType.slice(1)}
              badges={[{ label: maskAccount(acc.accountNumber), variant: 'navy' }]}
              onEdit={() => { setEditItem(acc); setShowForm(true); }}
              onDelete={() => remove(acc.id)}
              expandedContent={
                <div>
                  <DetailRow label="Account Number" value={acc.accountNumber} copyable />
                  <DetailRow label="Branch" value={acc.branch} />
                  <DetailRow label="IFSC Code" value={acc.ifscCode} copyable />
                  <DetailRow label="Username" value={acc.loginUsername} copyable />
                  <DetailRow label="Password" value={acc.loginPassword} password />
                  <DetailRow label="Net Banking" value={acc.netBankingUrl} url />
                  <DetailRow label="Nominee" value={acc.nomineeName} />
                  {acc.notes && <p className="text-sm text-[var(--color-text-muted)] mt-2">{acc.notes}</p>}
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
        title={editItem ? 'Edit Bank Account' : 'Add Bank Account'}
        fields={FIELDS}
        onSubmit={handleSubmit}
        initialData={(editItem as unknown as Record<string, unknown>) ?? undefined}
      />
    </div>
  );
}
