import { createContext, useState, useCallback, ReactNode } from 'react';

const HASH_KEY = 'dad-finance-passphrase-hash';
const SESSION_KEY = 'dad-finance-unlocked';

async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

interface LockContextType {
  isLocked: boolean;
  isPassphraseSet: boolean;
  unlock: (passphrase: string) => Promise<boolean>;
  lock: () => void;
  setPassphrase: (newPassphrase: string, current?: string) => Promise<boolean>;
  removePassphrase: (current: string) => Promise<boolean>;
}

export const LockContext = createContext<LockContextType>({
  isLocked: false,
  isPassphraseSet: false,
  unlock: async () => false,
  lock: () => {},
  setPassphrase: async () => false,
  removePassphrase: async () => false,
});

export function LockProvider({ children }: { children: ReactNode }) {
  const [isPassphraseSet, setIsPassphraseSet] = useState(
    () => !!localStorage.getItem(HASH_KEY)
  );
  const [isLocked, setIsLocked] = useState(() => {
    const hasHash = !!localStorage.getItem(HASH_KEY);
    const unlocked = sessionStorage.getItem(SESSION_KEY) === 'true';
    return hasHash && !unlocked;
  });

  const unlock = useCallback(async (passphrase: string): Promise<boolean> => {
    const hash = await sha256(passphrase);
    const stored = localStorage.getItem(HASH_KEY);
    if (hash === stored) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setIsLocked(false);
      return true;
    }
    return false;
  }, []);

  const lock = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsLocked(true);
  }, []);

  const setPassphrase = useCallback(
    async (newPassphrase: string, current?: string): Promise<boolean> => {
      if (isPassphraseSet && current !== undefined) {
        const currentHash = await sha256(current);
        const stored = localStorage.getItem(HASH_KEY);
        if (currentHash !== stored) return false;
      }
      const hash = await sha256(newPassphrase);
      localStorage.setItem(HASH_KEY, hash);
      setIsPassphraseSet(true);
      return true;
    },
    [isPassphraseSet]
  );

  const removePassphrase = useCallback(async (current: string): Promise<boolean> => {
    const hash = await sha256(current);
    const stored = localStorage.getItem(HASH_KEY);
    if (hash !== stored) return false;
    localStorage.removeItem(HASH_KEY);
    setIsPassphraseSet(false);
    return true;
  }, []);

  return (
    <LockContext.Provider
      value={{ isLocked, isPassphraseSet, unlock, lock, setPassphrase, removePassphrase }}
    >
      {children}
    </LockContext.Provider>
  );
}
