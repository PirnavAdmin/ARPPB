import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({ message = 'Loading data...', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-[#64748B] ${className}`}>
      <Loader2 className="w-8 h-8 text-[#0F766E] animate-spin mb-3" />
      <p className="text-xs font-medium">{message}</p>
    </div>
  );
};

export default LoadingState;

