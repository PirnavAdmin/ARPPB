import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  LogOut,
  RotateCcw,
  CheckCheck,
  ChevronDown,
  Building,
} from 'lucide-react';
import { MiddlemanBreadcrumb } from './MiddlemanBreadcrumb';
import { useMiddleman } from '../../../../context/middleman';

export const MiddlemanHeader = ({ onOpenMobileMenu }) => {
  const navigate = useNavigate();
  const { profile, notifications, markAllNotificationsAsRead, resetToDemoData } = useMiddleman();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const recentNotifications = notifications.slice(0, 4);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    navigate('/login');
  };

  const handleReset = () => {
    if (window.confirm('Reset all demonstration data (purchases, sales, inventory, ledger) to defaults?')) {
      resetToDemoData();
      setIsProfileOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="p-1.5 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:text-[#1F2937] hover:bg-slate-50 md:hidden cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <MiddlemanBreadcrumb />
        </div>

        {/* Right Side: Notifications & Profile Dropdown */}
        <div className="flex items-center gap-3">
          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotifOpen((prev) => !prev)}
              className="relative p-2 rounded-xl text-[#64748B] hover:text-[#1F2937] hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC2626] ring-2 ring-white" />
              )}
            </button>

            {/* Notification Popover */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] py-3 z-50 animate-fadeIn">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1F2937]">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#CCFBF1] text-[#0F766E]">
                        {unreadCount} new
                      </span>
                    )}
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllNotificationsAsRead()}
                      className="text-[11px] font-semibold text-[#0F766E] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="divide-y divide-[#E2E8F0] max-h-72 overflow-y-auto">
                  {recentNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setIsNotifOpen(false);
                        if (n.actionUrl) navigate(n.actionUrl);
                      }}
                      className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                        !n.isRead ? 'bg-teal-50/25' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-[#1F2937]">{n.title}</span>
                        <span className="text-[10px] text-[#94A3B8] whitespace-nowrap">{n.timestamp.slice(11)}</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-1 leading-snug">{n.description}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 px-3 text-center border-t border-[#E2E8F0]">
                  <Link
                    to="/middleman/notifications"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-xs font-semibold text-[#0F766E] hover:underline"
                  >
                    View All Notifications &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-2.5 p-1.5 pr-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {profile.logo ? (
                  <img src={profile.logo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  profile.ownerName?.charAt(0) || 'M'
                )}
              </div>

              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-[#1F2937] truncate max-w-[150px]">
                  {profile.businessName}
                </span>
                <span className="text-[10px] text-[#64748B] truncate max-w-[150px]">
                  {profile.ownerName}
                </span>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] p-2 z-50 animate-fadeIn">
                <div className="p-3 border-b border-[#E2E8F0] mb-1">
                  <p className="text-xs font-bold text-[#1F2937] truncate">{profile.businessName}</p>
                  <p className="text-[11px] text-[#64748B] truncate">{profile.email}</p>
                  <p className="text-[10px] text-[#0F766E] font-medium mt-1">ID: {profile.middlemanId}</p>
                </div>

                <div className="space-y-0.5">
                  <Link
                    to="/middleman/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#1F2937] hover:bg-slate-100 transition-colors"
                  >
                    <Building className="w-4 h-4 text-[#64748B]" />
                    <span>Business Profile</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#D97706] hover:bg-amber-50 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset Demo Data</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default MiddlemanHeader;
