import { useState, useEffect, useRef } from 'react';
import { useDemoMode } from '../hooks/useDemoMode';
import { exportFullBackup, exportQuickBackup } from '../utils/backup';
import { restoreFromFile } from '../utils/restore';
import { clearAllData } from '../db';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/dates';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-4">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function ActionButton({
  onClick, label, sub, loading, disabled, variant = 'default',
}: {
  onClick: () => void; label: string; sub?: string;
  loading?: boolean; disabled?: boolean; variant?: 'default' | 'danger' | 'navy';
}) {
  const bg = variant === 'danger'
    ? 'bg-[var(--color-danger-light)] text-[var(--color-danger)] border border-[var(--color-danger)]'
    : variant === 'navy'
    ? 'bg-[var(--color-navy)] text-white'
    : 'bg-white border border-[var(--color-border)] text-[var(--color-text)]';

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full p-3 rounded-xl text-left flex items-center justify-between gap-3 disabled:opacity-50 ${bg}`}
    >
      <div>
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
      </div>
      {loading && <LoadingSpinner size="sm" />}
    </button>
  );
}

export default function SettingsPage() {
  const { isDemo, toggleDemo } = useDemoMode();
  const [fullBackupLoading, setFullBackupLoading] = useState(false);
  const [quickBackupLoading, setQuickBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [clearTyped, setClearTyped] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [storageUsed, setStorageUsed] = useState<string>('...');
  const restoreRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLastBackup(localStorage.getItem('lastBackupDate'));
    if (navigator.storage?.estimate) {
      navigator.storage.estimate().then(est => {
        const used = est.usage || 0;
        const mb = (used / (1024 * 1024)).toFixed(1);
        setStorageUsed(`${mb} MB`);
      });
    }
  }, []);

  const showMsg = (text: string, ok: boolean) => {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleFullBackup = async () => {
    setFullBackupLoading(true);
    try {
      await exportFullBackup();
      setLastBackup(new Date().toISOString());
      showMsg('Full backup downloaded!', true);
    } catch {
      showMsg('Backup failed. Please try again.', false);
    } finally {
      setFullBackupLoading(false);
    }
  };

  const handleQuickBackup = async () => {
    setQuickBackupLoading(true);
    try {
      await exportQuickBackup();
      setLastBackup(new Date().toISOString());
      showMsg('Data backup downloaded!', true);
    } catch {
      showMsg('Backup failed. Please try again.', false);
    } finally {
      setQuickBackupLoading(false);
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (!window.confirm('This will REPLACE all your current data. Are you sure?')) return;
    setRestoreLoading(true);
    try {
      const result = await restoreFromFile(file);
      showMsg(result.message, result.success);
    } catch {
      showMsg('Restore failed. Invalid file.', false);
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleClearData = async () => {
    if (clearTyped !== 'DELETE') return;
    setClearLoading(true);
    try {
      await clearAllData();
      showMsg('All data cleared successfully.', true);
      setShowClearConfirm(false);
      setClearTyped('');
    } catch {
      showMsg('Failed to clear data.', false);
    } finally {
      setClearLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className={`card text-sm font-medium ${message.ok ? 'text-[var(--color-positive)] bg-[var(--color-positive-light)]' : 'text-[var(--color-danger)] bg-[var(--color-danger-light)]'}`}>
          {message.text}
        </div>
      )}

      {/* Backup & Restore */}
      <Section title="💾 Backup & Restore">
        <div className="space-y-2">
          <ActionButton
            onClick={handleFullBackup}
            loading={fullBackupLoading}
            label="📦 Full Backup (ZIP)"
            sub="Data + all uploaded files"
            variant="navy"
          />
          <ActionButton
            onClick={handleQuickBackup}
            loading={quickBackupLoading}
            label="📄 Quick Backup (JSON)"
            sub="Data only, no files (~few KB)"
          />
          <div>
            <ActionButton
              onClick={() => restoreRef.current?.click()}
              loading={restoreLoading}
              label="📥 Restore from Backup"
              sub="Upload a .zip or .json file"
            />
            <p className="text-xs text-[var(--color-warning)] mt-1 px-1">
              ⚠️ This will REPLACE all current data. Make a backup first!
            </p>
          </div>
          <input ref={restoreRef} type="file" accept=".zip,.json" className="hidden" onChange={handleRestoreFile} />
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          Last backup: {lastBackup ? formatDate(lastBackup) : 'Never'}
        </p>
      </Section>

      {/* Demo Mode */}
      <Section title="🎭 Demo Mode">
        <p className="text-sm text-[var(--color-text-muted)]">
          Show the app with realistic fake data without revealing your real finances. Your real data stays untouched.
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{isDemo ? 'Demo Mode is ON' : 'Demo Mode is OFF'}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{isDemo ? 'Showing fake data' : 'Showing real data'}</p>
          </div>
          <button
            onClick={toggleDemo}
            className={`relative w-12 h-6 rounded-full transition-colors ${isDemo ? 'bg-[var(--color-gold)]' : 'bg-[var(--color-border)]'}`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isDemo ? 'translate-x-7' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </Section>

      {/* Danger Zone */}
      <Section title="⚠️ Danger Zone">
        <p className="text-sm text-[var(--color-text-muted)]">
          Permanently deletes ALL data including uploaded files. This cannot be undone. Make a backup first!
        </p>
        {!showClearConfirm ? (
          <ActionButton
            onClick={() => setShowClearConfirm(true)}
            label="🗑️ Clear All Data"
            sub="Permanently delete everything"
            variant="danger"
          />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-danger)] font-medium">
              Type DELETE to confirm:
            </p>
            <input
              type="text"
              value={clearTyped}
              onChange={e => setClearTyped(e.target.value)}
              placeholder="DELETE"
              className="w-full border border-[var(--color-danger)] rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button onClick={() => { setShowClearConfirm(false); setClearTyped(''); }}
                className="flex-1 py-2.5 border border-[var(--color-border)] rounded-xl text-sm">
                Cancel
              </button>
              <button
                onClick={handleClearData}
                disabled={clearTyped !== 'DELETE' || clearLoading}
                className="flex-1 py-2.5 bg-[var(--color-danger)] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {clearLoading && <LoadingSpinner size="sm" />}
                Delete All
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* About */}
      <Section title="ℹ️ About">
        <div className="space-y-2">
          <p className="text-sm font-medium">Dad's Finance Tracker v1.0</p>
          <p className="text-sm text-[var(--color-text-muted)]">All data stored locally on this device</p>
          <p className="text-sm text-[var(--color-text-muted)]">No data is sent to any server</p>
          <p className="text-sm text-[var(--color-text-muted)]">Storage used: {storageUsed}</p>
        </div>
      </Section>
    </div>
  );
}
