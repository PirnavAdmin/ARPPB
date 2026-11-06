import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import VendorSidebar from './VendorSidebar';
import VendorNavbar from './VendorNavbar';

export function VendorLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-background text-brand-text flex">
      <VendorSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-68'
        }`}
      >
        <VendorNavbar
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onToggleDesktopSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>

        <footer className="px-6 py-3 border-t border-brand-border bg-brand-surface text-xs text-brand-muted flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Agri Raw Product Purchase & Billing Management ERP • Vendor Portal v2.4
          </span>
          <span>
            Kurnool Integrated Hub • Traceable Procurement, Milling & Billing System
          </span>
        </footer>
      </div>
    </div>
  );
}

export default VendorLayout;

