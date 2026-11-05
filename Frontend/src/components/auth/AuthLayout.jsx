import React from 'react';
import { AuthBranding } from './AuthBranding';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sprout } from 'lucide-react';

/**
 * Shared Enterprise Authentication Layout
 * Supports:
 * 1. Full-screen agricultural background with clean centered floating card (no top navbar)
 * 2. Split-screen layout fallback for standard pages
 */
export const AuthLayout = ({
  children,
  title,
  subtitle,
  backTo = null,
  backLabel = 'Back',
  containerWidth = 'max-w-md',
  backgroundImage = null,
}) => {
  // FULL-SCREEN HERO BACKGROUND VARIANT (Clean, no top navbar)
  if (backgroundImage) {
    return (
      <div
        className="min-h-screen w-full relative flex flex-col justify-between items-center bg-cover bg-center bg-no-repeat selection:bg-[#CCFBF1] selection:text-[#0F766E]"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        {/* Subtle natural dark overlay to maintain vibrant scenery while enhancing form contrast */}
        <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[0.5px] pointer-events-none" />

        {/* Centered Floating Authentication Card */}
        <main className="relative z-10 w-full flex-1 flex flex-col justify-center items-center px-4 py-8 sm:py-12">
          <div className={`w-full ${containerWidth} transition-all duration-200`}>
            {/* Optional Back Button */}
            {backTo && (
              <div className="mb-3">
                <Link
                  to={backTo}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white bg-black/20 hover:bg-black/35 backdrop-blur-sm transition-colors py-1 px-2.5 rounded-lg border border-white/20"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{backLabel}</span>
                </Link>
              </div>
            )}

            {/* Floating Glass/White Card */}
            <div className="bg-white/95 sm:bg-white backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl border border-white/60 p-6 sm:p-8 md:p-9 transition-shadow duration-200">
              {/* Card Header */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Sprout className="w-6 h-6 text-[#0F766E]" />
                </div>
                {title && (
                  <h2 className="text-2xl font-bold text-[#172B29] tracking-tight">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="mt-1 text-xs sm:text-sm text-[#64748B] leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Form Content */}
              {children}
            </div>
          </div>
        </main>

        {/* Subtle Footer */}
        <footer className="relative z-10 w-full text-center py-4 text-xs text-white/90 drop-shadow-sm">
          <p>© 2026 AgriConnect. Enterprise Agricultural Billing Software.</p>
        </footer>
      </div>
    );
  }

  // STANDARD SPLIT-SCREEN LAYOUT
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F5FAF8] text-[#172B29] selection:bg-[#CCFBF1] selection:text-[#0F766E]">
      {/* Left Column: Branding (Sticky full-height on desktop, compact on mobile) */}
      <aside className="w-full lg:w-5/12 xl:w-9/24 lg:min-h-screen relative flex-shrink-0 flex flex-col justify-between">
        {/* Mobile top branding */}
        <div className="block lg:hidden bg-gradient-to-r from-[#0F766E] to-[#0c5c56] px-5 py-3.5 shadow-xs">
          <AuthBranding isCompact={true} />
        </div>

        {/* Desktop full panel */}
        <div className="hidden lg:block h-full sticky top-0">
          <AuthBranding isCompact={false} />
        </div>
      </aside>

      {/* Right Column: Centered Authentication Surface */}
      <main className="w-full lg:w-7/12 xl:w-15/24 min-h-screen flex flex-col justify-between p-4 sm:p-6 md:p-10 lg:p-12 overflow-y-auto">
        <div className="w-full mx-auto my-auto flex flex-col justify-center items-center">
          <div className={`w-full ${containerWidth} transition-all duration-200`}>
            {/* Optional Back Navigation */}
            {backTo && (
              <div className="mb-4">
                <Link
                  to={backTo}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F766E] transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-teal-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{backLabel}</span>
                </Link>
              </div>
            )}

            {/* Auth Card Surface */}
            <div className="bg-white rounded-2xl shadow-xs hover:shadow-sm border border-[#E2E8F0] p-6 sm:p-8 md:p-10 transition-shadow duration-200">
              {/* Header inside card */}
              {(title || subtitle) && (
                <div className="mb-6">
                  {title && (
                    <h2 className="text-2xl font-bold text-[#172B29] tracking-tight">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="mt-1.5 text-xs sm:text-sm text-[#64748B] leading-relaxed">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}

              {/* Form Content */}
              {children}
            </div>
          </div>
        </div>

        {/* Simple Footer */}
        <footer className="w-full text-center py-4 text-xs text-[#64748B] mt-6 border-t border-[#E2E8F0]/70">
          <p>© 2026 AgriConnect. Enterprise Agricultural Billing Software.</p>
        </footer>
      </main>
    </div>
  );
};

export default AuthLayout;
