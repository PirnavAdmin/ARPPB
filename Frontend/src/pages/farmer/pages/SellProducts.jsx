import { useFarmer } from '../context/FarmerContext';
import SalesForm from '../components/SalesForm';

function SellProducts() {
  const { navigateTo, pageParam } = useFarmer();

  return (
    <div>
      <div className="farmer-page-header">
        <div className="farmer-header-titles">
          <h2>Sell Farm Products {pageParam ? `• ${pageParam}` : ''}</h2>
          <p>
            {pageParam
              ? `Initiating verified agricultural sales order to ${pageParam} parties with OTP stock protection`
              : 'Initiate verified sales to Middlemen, Vendors, and Direct Consumers with OTP stock protection'}
          </p>
        </div>

        <div className="farmer-header-actions">
          <button
            type="button"
            className="farmer-btn farmer-btn-outline cursor-pointer"
            onClick={() => navigateTo('sales')}
          >
            📋 View My Sales
          </button>
          <button
            type="button"
            className="farmer-btn farmer-btn-outline cursor-pointer"
            onClick={() => navigateTo('crops')}
          >
            📦 Check Available Stock
          </button>
        </div>
      </div>

      <SalesForm initialCategory={pageParam} onSaleCreated={() => {}} />
    </div>
  );
}

export default SellProducts;
