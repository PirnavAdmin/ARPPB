import { useFarmer } from '../context/FarmerContext';
import SalesForm from '../components/SalesForm';

function SellProducts() {
  const { navigateTo } = useFarmer();

  return (
    <div>
      <div className="farmer-page-header">
        <div className="farmer-header-titles">
          <h2>Sell Farm Products</h2>
          <p>
            Initiate verified sales to Middlemen, Vendors, and Direct Consumers with OTP stock protection
          </p>
        </div>

        <div className="farmer-header-actions">
          <button
            type="button"
            className="farmer-btn farmer-btn-outline"
            onClick={() => navigateTo('sales')}
          >
            📋 View My Sales
          </button>
          <button
            type="button"
            className="farmer-btn farmer-btn-outline"
            onClick={() => navigateTo('stock')}
          >
            📦 Check Available Stock
          </button>
        </div>
      </div>

      <SalesForm onSaleCreated={() => {}} />
    </div>
  );
}

export default SellProducts;
