import { createContext, useState, ReactNode } from 'react';

interface DemoContextType {
  isDemo: boolean;
  toggleDemo: () => void;
}

export const DemoContext = createContext<DemoContextType>({
  isDemo: false,
  toggleDemo: () => {},
});

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemo, setIsDemo] = useState(false);

  const toggleDemo = () => setIsDemo(prev => !prev);

  return (
    <DemoContext.Provider value={{ isDemo, toggleDemo }}>
      {children}
    </DemoContext.Provider>
  );
}
