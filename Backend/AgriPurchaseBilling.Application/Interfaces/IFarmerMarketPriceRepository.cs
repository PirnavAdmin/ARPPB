using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IFarmerMarketPriceRepository
    {
        Task<List<MarketPriceStateOptionDto>> GetStatesAsync(CancellationToken ct = default);
        Task<List<FarmerMarketPriceItemDto>> GetMarketPricesAsync(FarmerMarketPriceFilterDto filters, CancellationToken ct = default);
        Task<FarmerMarketPriceChartDto?> GetChartAsync(string idOrCode, CancellationToken ct = default);
    }
}
