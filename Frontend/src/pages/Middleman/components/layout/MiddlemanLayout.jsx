import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { MiddlemanSidebar } from './MiddlemanSidebar';
import { MiddlemanHeader } from './MiddlemanHeader';
import { MiddlemanMobileNavigation } from './MiddlemanMobileNavigation';

export const MiddlemanLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7FAF9] text-[#1F2937] flex selection:bg-[#CCFBF1] selection:text-[#0F766E]">
      {/* Desktop Fixed Sidebar */}
      <MiddlemanSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        className="hidden md:flex shadow-xs"
      />

      {/* Mobile Drawer Navigation */}
      <MiddlemanMobileNavigation
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Global Middleman Header */}
        <MiddlemanHeader onOpenMobileMenu={() => setIsMobileNavOpen(true)} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MiddlemanLayout;

