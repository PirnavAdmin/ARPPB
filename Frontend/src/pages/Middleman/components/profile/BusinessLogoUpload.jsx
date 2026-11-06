import React, { useRef } from 'react';
import { Upload, X, Building } from 'lucide-react';

export const BusinessLogoUpload = ({
  logoUrl,
  onLogoChange,
  businessName = 'My Business',
  disabled = false,
}) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds 2MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      onLogoChange(event.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onLogoChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-[#CBD5E1] bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0 group">
        {logoUrl ? (
          <>
            <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Remove logo"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </>
        ) : (
          <Building className="w-8 h-8 text-[#94A3B8]" />
        )}
      </div>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          id="logo-upload"
        />

        <label
          htmlFor="logo-upload"
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#E2E8F0] bg-white text-[#1F2937] shadow-2xs transition-all ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer'
          }`}
        >
          <Upload className="w-3.5 h-3.5 text-[#0F766E]" />
          <span>Upload Business Logo</span>
        </label>
        <span className="text-[11px] text-[#64748B] block mt-1">PNG, JPG, SVG up to 2MB.</span>
      </div>
    </div>
  );
};

export default BusinessLogoUpload;
