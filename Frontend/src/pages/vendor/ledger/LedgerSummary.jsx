import {
  ShoppingCart,
  TrendingUp,
  Factory,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Award,
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatCurrency';
import VendorStatCard from '../VendorStatCard';

export default function LedgerSummary({ summary }) {
  const {
    totalPurchases = 0,
    totalSales = 0,
    processingExpenses = 0,
    totalPayables = 0,
    totalReceivables = 0,
    amountReceived = 0,
    outstandingAmount = 0,
    estimatedProfit = 0,
  } = summary || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <VendorStatCard
        title="1. Total Purchases"
        value={formatCurrency(totalPurchases)}
        subtitle="Confirmed farmer & middleman procurement"
        icon={ShoppingCart}
      />
      <VendorStatCard
        title="2. Total Sales"
        value={formatCurrency(totalSales)}
        subtitle="Confirmed finished product invoices"
        icon={TrendingUp}
        highlight
      />
      <VendorStatCard
        title="3. Processing Expenses"
        value={formatCurrency(processingExpenses)}
        subtitle="Labour, machine, electricity & packaging"
        icon={Factory}
      />
      <VendorStatCard
        title="4. Total Payables"
        value={formatCurrency(totalPayables)}
        subtitle="Unsettled dues to Farmers & Middlemen"
        icon={ArrowUpRight}
      />
      <VendorStatCard
        title="5. Total Receivables"
        value={formatCurrency(totalReceivables)}
        subtitle="Gross customer billing + opening dues"
        icon={ArrowDownLeft}
      />
      <VendorStatCard
        title="6. Amount Received"
        value={formatCurrency(amountReceived)}
        subtitle="Realized collections from customers"
        icon={CheckCircle2}
      />
      <VendorStatCard
        title="7. Outstanding Amount"
        value={formatCurrency(outstandingAmount)}
        subtitle="Net pending customer receivables"
        icon={AlertCircle}
      />
      <VendorStatCard
        title="8. Estimated Profit"
        value={formatCurrency(estimatedProfit)}
        subtitle="Sales − Allocated Raw Mat − Processing Exp"
        icon={Award}
        highlight
      />
    </div>
  );
}

