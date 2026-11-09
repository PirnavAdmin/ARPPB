import React from 'react';
import bgImage from '../../../assets/R&L_BG_Image.png';

const CURRENT_YEAR = new Date().getFullYear();

/**
 * AuthLayout Component
 * Renders full-screen agricultural background with crisp floating authentication card.
 * Strict: No top navbar. Centered card with max-width 520px.
 */
export const AuthLayout = ({
  children,
  maxWidth = 'max-w-[520px]',
  cardClassName = '',
}) => {
  return (
    <div
      className="relative min-h-screen w-full flex flex-col justify-between items-center bg-cover bg-center bg-no-repeat selection:bg-[#CCFBF1] selection:text-[#0F766E]"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      {/* Subtle darkening overlay for optimal contrast and readability */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1.5px] pointer-events-none" />

      {/* Spacer to balance vertical centering */}
      <div className="w-full h-4 sm:h-8" />

      {/* Main Centered Content */}
      <main className="relative z-10 w-full px-4 py-6 flex items-center justify-center">
        <div
          className={`
            w-full ${maxWidth} bg-white/95 backdrop-blur-md rounded-[24px]
            shadow-2xl shadow-black/25 border border-white/60 p-6 sm:p-8
            transition-all duration-300 ${cardClassName}
          `}
        >
          {children}
        </div>
      </main>

      {/* Clean, unobtrusive footer */}
      <footer className="relative z-10 w-full py-4 px-4 text-center text-xs text-white/85 drop-shadow-sm">
        <p>
          &copy; {CURRENT_YEAR} AgriConnect &bull; Agricultural Purchase & Billing System. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default AuthLayout;
