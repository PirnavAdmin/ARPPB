import { useContext } from 'react';
import { CustomerContext } from './context';

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) {
    throw new Error('useCustomer must be used within CustomerProvider');
  }
  return ctx;
}

export default useCustomer;
