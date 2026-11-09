import React from 'react';
import { X } from 'lucide-react';
import { MiddlemanSidebar } from './MiddlemanSidebar';

export const MiddlemanMobileNavigation = ({
  isOpen = false,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:hidden animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative flex flex-col w-72 max-w-[85vw] bg-[#0F766E] h-full shadow-2xl z-10">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-3 p-1.5 rounded-lg text-[#CCFBF1] hover:text-white hover:bg-white/10 cursor-pointer z-20 transition-colors"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>

        <MiddlemanSidebar isCollapsed={false} onItemClick={onClose} className="border-none w-full" />
      </div>
    </div>
  );
};

export default MiddlemanMobileNavigation;

