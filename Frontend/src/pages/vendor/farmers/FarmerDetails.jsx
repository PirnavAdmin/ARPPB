import { MapPin, Phone, Mail, Landmark, Shield, Tractor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VendorStatusBadge from '../VendorStatusBadge';
import FarmerPurchaseHistory from './FarmerPurchaseHistory';
import { formatCurrency, formatNumber, maskIdentifier } from '../../../utils/formatCurrency';

export function FarmerDetails({ farmer, purchases = [], ledger = [], onEdit, onClose }) {
  const navigate = useNavigate();
  if (!farmer) return null;

  const farmerPurchases = purchases.filter(
    (p) => p.supplierCategory === 'Farmer' && p.supplierId === farmer.id
  );
  const confirmedPurchases = farmerPurchases.filter((p) => p.status === 'Confirmed');
  const farmerLedger = ledger.filter((l) => l.partyId === farmer.id);

  return (
    <div className="space-y-6">
      {/* Top Identity Banner */}
      <div className="p-4 rounded-xl bg-brand-light/40 border border-brand-secondary/30 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-md bg-brand-primary text-white font-mono text-xs font-bold">
              {farmer.id}
            </span>
            <h3 className="text-lg font-bold text-brand-text">{farmer.farmerName}</h3>
            <VendorStatusBadge status={farmer.status} size="xs" />
          </div>
          <p className="text-xs text-brand-muted mt-1">
            S/o {farmer.fatherName || '—'} • Registered on {farmer.createdAt}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(`/vendor/purchases/farmers?farmerId=${farmer.id}`);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
          >
            <Tractor className="w-3.5 h-3.5" />
            Purchase Raw Material
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(farmer)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-surface border border-brand-border text-brand-primary hover:bg-brand-light transition-colors cursor-pointer"
            >
              Edit Farmer
            </button>
          )}
        </div>
      </div>

      {/* Procurement & Ledger KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-brand-background border border-brand-border">
          <span className="text-[11px] font-semibold uppercase text-brand-muted">
            Completed Purchases
          </span>
          <p className="text-lg font-bold text-brand-primary mt-0.5">
            {confirmedPurchases.length} Orders ({formatNumber(farmer.totalQuantity)} Qtl)
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-brand-background border border-brand-border">
          <span className="text-[11px] font-semibold uppercase text-brand-muted">
            Total Purchase Value
          </span>
          <p className="text-lg font-bold text-brand-text mt-0.5">
            {formatCurrency(farmer.totalPurchaseValue)}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-brand-background border border-brand-border">
          <span className="text-[11px] font-semibold uppercase text-brand-muted">Amount Paid</span>
          <p className="text-lg font-bold text-brand-success mt-0.5">
            {formatCurrency(farmer.totalPaid)}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-brand-light/40 border border-brand-secondary/40">
          <span className="text-[11px] font-semibold uppercase text-brand-primary">
            Pending Payable
          </span>
          <p className="text-lg font-bold text-brand-warning mt-0.5">
            {formatCurrency(farmer.pendingPayables)}
          </p>
        </div>
      </div>

      {/* Contact, Location, Crops & Bank Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-2.5">
          <h4 className="font-bold text-brand-primary uppercase tracking-wider">
            Contact &amp; Location
          </h4>
          <div className="flex items-center gap-2 text-brand-text">
            <Phone className="w-3.5 h-3.5 text-brand-primary" />
            <span>+91 {farmer.mobileNumber}</span>
          </div>
          <div className="flex items-center gap-2 text-brand-text">
            <Mail className="w-3.5 h-3.5 text-brand-primary" />
            <span>{farmer.email || '—'}</span>
          </div>
          <div className="flex items-start gap-2 text-brand-text">
            <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
            <span>
              {farmer.address ? `${farmer.address}, ` : ''}
              {farmer.village}, {farmer.mandal ? `${farmer.mandal} Mandal, ` : ''}
              {farmer.district}, {farmer.state} - {farmer.pinCode || '—'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-brand-text">
            <Shield className="w-3.5 h-3.5 text-brand-primary" />
            <span>Aadhaar / ID: {maskIdentifier(farmer.aadhaarId, 4)}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-3">
          <div>
            <h4 className="font-bold text-brand-primary uppercase tracking-wider mb-2">
              Available Crops
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {(farmer.availableCrops || []).map((crop) => (
                <span
                  key={crop}
                  className="px-2.5 py-1 rounded-lg bg-brand-light text-brand-primary font-semibold"
                >
                  {crop}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-brand-border">
            <h4 className="font-bold text-brand-primary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5" />
              Bank Details &amp; Ledger Summary
            </h4>
            <p className="text-brand-text">
              Bank: <strong>{farmer.bankName || 'Not provided'}</strong> • A/C:{' '}
              <strong>{maskIdentifier(farmer.accountNumber, 4)}</strong> • IFSC:{' '}
              <strong>{farmer.ifscCode || '—'}</strong>
            </p>
            <p className="text-brand-muted mt-1">
              Total Ledger Entries: <strong>{farmerLedger.length}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Purchase History Table */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-primary mb-2">
          Linked Farmer Purchase History
        </h4>
        <FarmerPurchaseHistory farmer={farmer} purchases={purchases} />
      </div>
    </div>
  );
}

export default FarmerDetails;

