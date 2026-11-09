import { Outlet } from 'react-router-dom';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-brand-background text-brand-text antialiased">
      <Outlet />
    </div>
  );
}

