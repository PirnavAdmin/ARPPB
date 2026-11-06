import { useNavigate } from 'react-router-dom';
import { Tractor, FileSpreadsheet } from 'lucide-react';
import VendorPageHeader from '../VendorPageHeader';
import PurchaseForm from './PurchaseForm';

export function PurchaseFromFarmers() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <VendorPageHeader
        title="Purchase from Farmers"
        subtitle="Record direct raw material procurement from registered farmers with multi-lot pricing, charges, and OTP confirmation."
        icon={Tractor}
        actions={
          <button
            type="button"
            onClick={() => navigate('/vendor/purchases/history')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>View Purchase History</span>
          </button>
        }
      />

      <PurchaseForm supplierCategory="Farmer" />
    </div>
  );
}

export default PurchaseFromFarmers;

