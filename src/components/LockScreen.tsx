import { useState, useContext } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { LockContext } from '../context/LockContext';

export default function LockScreen() {
  const { unlock } = useContext(LockContext);
  const [passphrase, setPassphrase] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleUnlock = async () => {
    if (!passphrase || loading) return;
    setLoading(true);
    const ok = await unlock(passphrase);
    setLoading(false);
    if (!ok) {
      setAttempts(a => a + 1);
      setError(`Incorrect passphrase.${attempts >= 2 ? ' Check caps lock.' : ''}`);
      setPassphrase('');
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #0d1a2d 0%, #1B2A4A 60%, #0d1a2d 100%)' }}
    >
      <div className="w-full max-w-xs space-y-8">
        {/* Logo area */}
        <div className="text-center space-y-3">
          <div className="text-5xl">🔒</div>
          <div>
            <h1 className="text-xl font-bold text-white">Family Hub</h1>
            <p className="text-white/50 text-sm mt-1">Enter your passphrase to continue</p>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={passphrase}
              onChange={e => { setPassphrase(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              placeholder="Passphrase"
              autoFocus
              autoComplete="current-password"
              className="w-full rounded-xl px-4 py-3.5 pr-11 text-sm text-white placeholder:text-white/30"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
            />
            <button
              onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
              tabIndex={-1}
            >
              {show
                ? <EyeOff className="w-4 h-4 text-white/40" />
                : <Eye className="w-4 h-4 text-white/40" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-400 px-1">{error}</p>
          )}

          <button
            onClick={handleUnlock}
            disabled={!passphrase || loading}
            className="w-full py-3.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
            style={{ background: '#C8956C', color: '#1B2A4A' }}
          >
            {loading ? 'Unlocking…' : 'Unlock'}
          </button>
        </div>
      </div>
    </div>
  );
}
