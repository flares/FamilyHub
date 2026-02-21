import { createContext, useContext, useState } from 'react';

interface HideContextValue {
  isHidden: boolean;
  toggleHide: () => void;
}

export const HideContext = createContext<HideContextValue>({
  isHidden: false,
  toggleHide: () => {},
});

export function HideProvider({ children }: { children: React.ReactNode }) {
  const [isHidden, setIsHidden] = useState(false);
  const toggleHide = () => setIsHidden(h => !h);
  return (
    <HideContext.Provider value={{ isHidden, toggleHide }}>
      {children}
    </HideContext.Provider>
  );
}

export function useHide() {
  return useContext(HideContext);
}
