import { useContext } from 'react';
import { HideContext } from '../context/HideContext';
import { formatCurrency, formatCurrencyShort } from '../utils/currency';

const MASKED = '₹ ••••';

export function useCurrency() {
  const { isHidden } = useContext(HideContext);

  return {
    formatCurrency: (amount: number) => isHidden ? MASKED : formatCurrency(amount),
    formatCurrencyShort: (amount: number) => isHidden ? MASKED : formatCurrencyShort(amount),
    isHidden,
  };
}
