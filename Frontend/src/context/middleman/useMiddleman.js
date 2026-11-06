import { useContext } from 'react';
import { MiddlemanContext } from './context';

export const useMiddleman = () => {
  const context = useContext(MiddlemanContext);
  if (!context) {
    throw new Error('useMiddleman must be used within a MiddlemanProvider');
  }
  return context;
};

export default useMiddleman;
