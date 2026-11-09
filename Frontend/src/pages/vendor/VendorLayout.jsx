import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import VendorSidebar from './VendorSidebar';
import VendorNavbar from './VendorNavbar';

export function VendorLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-background text-brand-text flex [&_svg]:!max-w-none [&_svg]:shrink-0 [&_.text-\[10px\]]:!text-[10px] [&_.text-\[11px\]]:!text-[11px] [&_.text-xs]:!text-xs [&_.text-sm]:!text-sm [&_.text-base]:!text-base [&_.text-lg]:!text-lg [&_.text-xl]:!text-xl [&_.sm\:text-sm]:sm:!text-sm [&_.font-normal]:!font-normal [&_.font-medium]:!font-medium [&_.font-semibold]:!font-semibold [&_.font-bold]:!font-bold [&_.font-extrabold]:!font-extrabold">
      <VendorSidebar
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

