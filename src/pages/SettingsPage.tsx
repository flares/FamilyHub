import { useState, useEffect, useRef, useContext } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useDemoMode } from '../hooks/useDemoMode';
import { LockContext } from '../context/LockContext';
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

function PassphraseSection() {
  const { isPassphraseSet, setPassphrase, removePassphrase, lock } = useContext(LockContext);
  const [mode, setMode] = useState<'idle' | 'set' | 'change' | 'remove'>('idle');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [working, setWorking] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const reset = () => { setMode('idle'); setCurrent(''); setNext(''); setConfirm(''); setMsg(null); };

  const showMsg = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleSave = async () => {
    if (next !== confirm) { showMsg('Passphrases do not match.', false); return; }
    if (next.length < 4) { showMsg('Passphrase must be at least 4 characters.', false); return; }
    setWorking(true);
    const ok = await setPassphrase(next, isPassphraseSet ? current : undefined);
    setWorking(false);
    if (ok) { showMsg('Passphrase saved!', true); reset(); }
    else showMsg('Current passphrase incorrect.', false);
  };

  const handleRemove = async () => {
    setWorking(true);
    const ok = await removePassphrase(current);
    setWorking(false);
    if (ok) { showMsg('Passphrase removed.', true); reset(); }
    else showMsg('Incorrect passphrase.', false);
  };

  const EyeBtn = () => (
    <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2">
      {showPwd ? <EyeOff className="w-4 h-4 text-[var(--color-text-muted)]" /> : <Eye className="w-4 h-4 text-[var(--color-text-muted)]" />}
    </button>
  );

  const PwdInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
    <div className="relative">
      <input
        type={showPwd ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-[var(--color-border)] rounded-xl px-3 py-2.5 pr-10 text-sm"
      />
      <EyeBtn />
    </div>
  );

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">🔒 App Lock</h2>
        {isPassphraseSet && (
          <button
            onClick={lock}
            className="text-xs font-medium px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-[var(--color-navy)]"
          >
            Lock Now
          </button>
        )}
      </div>

      <p className="text-sm text-[var(--color-text-muted)]">
        {isPassphraseSet
          ? 'App is protected. Enter passphrase each time you open it.'
          : 'Set a passphrase to lock the app on startup.'}
      </p>

      {msg && (
        <p className={`text-xs font-medium ${msg.ok ? 'text-[var(--color-positive)]' : 'text-[var(--color-danger)]'}`}>
          {msg.text}
        </p>
      )}

      {mode === 'idle' && (
        <div className="flex flex-wrap gap-2">
          {!isPassphraseSet ? (
            <button onClick={() => setMode('set')} className="px-4 py-2 bg-[var(--color-navy)] text-white rounded-xl text-sm font-medium">
              Set Passphrase
            </button>
          ) : (
            <>
              <button onClick={() => setMode('change')} className="px-4 py-2 bg-[var(--color-navy)] text-white rounded-xl text-sm font-medium">
                Change Passphrase
              </button>
              <button onClick={() => setMode('remove')} className="px-4 py-2 border border-[var(--color-danger)] text-[var(--color-danger)] rounded-xl text-sm font-medium">
                Remove
              </button>
            </>
          )}
        </div>
      )}

      {mode === 'set' && (
        <div className="space-y-3">
          <PwdInput value={next} onChange={setNext} placeholder="New passphrase" />
          <PwdInput value={confirm} onChange={setConfirm} placeholder="Confirm passphrase" />
          <div className="flex gap-2">
            <button onClick={reset} className="flex-1 py-2 border border-[var(--color-border)] rounded-xl text-sm">Cancel</button>
            <button onClick={handleSave} disabled={!next || !confirm || working}
              className="flex-1 py-2 bg-[var(--color-navy)] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40">
              {working && <LoadingSpinner size="sm" />} Save
            </button>
          </div>
        </div>
      )}

      {mode === 'change' && (
        <div className="space-y-3">
          <PwdInput value={current} onChange={setCurrent} placeholder="Current passphrase" />
          <PwdInput value={next} onChange={setNext} placeholder="New passphrase" />
          <PwdInput value={confirm} onChange={setConfirm} placeholder="Confirm new passphrase" />
          <div className="flex gap-2">
            <button onClick={reset} className="flex-1 py-2 border border-[var(--color-border)] rounded-xl text-sm">Cancel</button>
            <button onClick={handleSave} disabled={!current || !next || !confirm || working}
              className="flex-1 py-2 bg-[var(--color-navy)] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40">
              {working && <LoadingSpinner size="sm" />} Save
            </button>
          </div>
        </div>
      )}

      {mode === 'remove' && (
        <div className="space-y-3">
          <PwdInput value={current} onChange={setCurrent} placeholder="Current passphrase" />
          <div className="flex gap-2">
            <button onClick={reset} className="flex-1 py-2 border border-[var(--color-border)] rounded-xl text-sm">Cancel</button>
            <button onClick={handleRemove} disabled={!current || working}
              className="flex-1 py-2 bg-[var(--color-danger)] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40">
              {working && <LoadingSpinner size="sm" />} Remove Lock
            </button>
          </div>
        </div>
      )}
    </div>
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

      {/* App Lock */}
      <PassphraseSection />

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
