import { Download, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV } from '../../utils/exportUtils';

export function VendorExportMenu({
  data = [],
  columns = [],
  filename = 'vendor_export.csv',
  onExportCSV = null,
  onPrint = null,
  label = 'Export CSV',
}) {
  const handleExport = () => {
    if (typeof onExportCSV === 'function') {
      onExportCSV();
      return;
    }
    if (!data || data.length === 0) {
      toast.warning('No matching records available to export.');
      return;
    }
    const ok = exportToCSV(data, columns, filename);
    if (ok) {
      toast.success(`Exported ${data.length} record(s) to ${filename}`);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleExport}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{label}</span>
      </button>
      {onPrint && (
        <button
          type="button"
          onClick={onPrint}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-brand-surface border border-brand-border text-brand-text hover:bg-brand-light hover:text-brand-primary transition-colors cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print</span>
        </button>
      )}
    </div>
  );
}

export default VendorExportMenu;
