import React from 'react';
import { Sprout, CheckCircle2, ShieldCheck, Scale, FileSpreadsheet } from 'lucide-react';

/**
 * Enterprise Left Branding Panel for AgriConnect
 * Elegant, human-designed aesthetic with deep teal background and balanced typography.
 */
export const AuthBranding = ({ isCompact = false }) => {
  if (isCompact) {
    return (
      <div className="flex items-center space-x-3 py-1">
        <div className="w-10 h-10 rounded-xl bg-teal-800/90 border border-teal-500/40 flex items-center justify-center shadow-xs">
          <Sprout className="w-5 h-5 text-[#14B8A6]" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-white block leading-tight">
            AgriConnect
          </span>
          <span className="text-[11px] text-teal-200 block font-medium">
            Agricultural Purchase & Billing
          </span>
        </div>
      </div>
    );
  }

  const highlights = [
    {
      title: 'Farmer & Supplier Procurement',
      desc: 'Transparent digital contracts and daily market price synchronization.',
      icon: Sprout,
    },
    {
      title: 'Automated Weighment & Grading',
      desc: 'Precision gross, tare, and deduction calculation synced with weighbridge scales.',
      icon: Scale,
    },
    {
      title: 'Instant GST & APMC Billing',
      desc: 'Single-click compliant invoices and automated vendor payment records.',
      icon: FileSpreadsheet,
    },
  ];

  return (
    <div className="relative h-full flex flex-col justify-between p-8 lg:p-12 xl:p-14 bg-gradient-to-b from-[#0F766E] via-[#0d645e] to-[#094742] text-white overflow-hidden selection:bg-[#14B8A6] selection:text-white">
      {/* Subtle organic background grid & radial glow */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none bg-[radial-gradient(#14B8A6_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#14B8A6]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#CCFBF1]/15 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15 mb-6">
          <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
          <span className="text-[11px] font-semibold tracking-wide uppercase text-teal-100">
            Enterprise Agriculture Software
          </span>
        </div>

        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-lg shadow-black/10">
            <Sprout className="w-6 h-6 text-[#14B8A6]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white leading-none">
              AgriConnect
            </h1>
            <p className="text-xs text-teal-200/90 font-medium mt-1">
              Purchase & Billing Management
            </p>
          </div>
        </div>

        {/* Value Proposition */}
        <h2 className="text-2xl lg:text-3xl xl:text-[32px] font-bold leading-tight text-white mb-3 tracking-tight">
          Grow Your Business With Smarter Agriculture Management.
        </h2>
        <p className="text-teal-100/85 text-sm leading-relaxed max-w-lg font-normal">
          Designed specifically for agricultural commodity buyers, processing mills, and traders to eliminate paperwork and streamline farm-gate purchasing.
        </p>
      </div>

      {/* Middle Feature Highlights */}
      <div className="relative z-10 my-8 space-y-3.5">
        {highlights.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xs transition-colors duration-150"
            >
              <div className="p-2 rounded-lg bg-teal-400/20 text-[#14B8A6] border border-teal-300/30 flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  {item.title}
                </h3>
                <p className="text-xs text-teal-200/80 leading-normal mt-0.5">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Trust Markers */}
      <div className="relative z-10 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs text-teal-100/90">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-[#14B8A6]" />
          <span>GST & APMC Compliant</span>
        </div>
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#14B8A6]" />
          <span>Enterprise Secure Portal</span>
        </div>
      </div>
    </div>
  );
};

export default AuthBranding;

