import { useRef } from 'react';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export function VendorFileUpload({
  label = 'Upload Image',
  value = '',
  onChange,
  accept = 'image/png,image/jpeg,image/webp',
  maxSizeMB = 2,
  helperText = 'PNG, JPG or WEBP up to 2MB',
}) {
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`File size exceeds ${maxSizeMB}MB limit.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange(String(reader.result || ''));
      toast.success(`${file.name} uploaded.`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-xs font-semibold text-brand-text">{label}</span>}
      <div className="flex items-center gap-4 p-3 rounded-xl border border-dashed border-brand-border bg-brand-background/60">
        {value ? (
          <div className="w-16 h-16 rounded-lg overflow-hidden border border-brand-border bg-brand-surface shrink-0">
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-lg bg-brand-light flex items-center justify-center text-brand-primary shrink-0">
            <ImageIcon className="w-7 h-7" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-brand-text truncate">
            {value ? 'Custom image uploaded' : 'No file selected'}
          </p>
          <p className="text-[11px] text-brand-muted mt-0.5">{helperText}</p>
          <div className="flex items-center gap-2 mt-2">
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              {value ? 'Replace' : 'Upload'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-error-light text-brand-error hover:bg-brand-error hover:text-white transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorFileUpload;

