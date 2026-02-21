import { useContext } from 'react';
import { DemoContext } from '../context/DemoContext';

export function useDemoMode() {
  return useContext(DemoContext);
}
