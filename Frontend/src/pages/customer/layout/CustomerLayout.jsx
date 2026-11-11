import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import CustomerSidebar from './CustomerSidebar';
import CustomerNavbar from './CustomerNavbar';

export function CustomerLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex">
      <CustomerSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <CustomerNavbar
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onToggleDesktopSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>

        <footer className="px-6 py-3 border-t border-[#E2E8F0] bg-white text-xs text-[#64748B] flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            AgriConnect ERP &bull; Customer Portal
          </span>
          <span>
            Raw Agricultural Sourcing &bull; Traceable OTP Verification
          </span>
        </footer>
      </div>
    </div>
  );
}

export default CustomerLayout;

