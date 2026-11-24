using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;

namespace AgriPurchaseBilling.Application.Services
{
    public class FarmerMarketPriceService : IFarmerMarketPriceService
    {
        private readonly IFarmerMarketPriceRepository _repository;

        public FarmerMarketPriceService(IFarmerMarketPriceRepository repository)
        {
            _repository = repository;
        }

        public async Task<ApiResponse<List<MarketPriceStateOptionDto>>> GetStatesAsync(CancellationToken ct = default)
        {
            var states = await _repository.GetStatesAsync(ct);
            return ApiResponse<List<MarketPriceStateOptionDto>>.Ok(states, "State filter options retrieved successfully.");
        }

        public async Task<ApiResponse<List<FarmerMarketPriceItemDto>>> GetMarketPricesAsync(FarmerMarketPriceFilterDto filters, CancellationToken ct = default)
        {
            var list = await _repository.GetMarketPricesAsync(filters, ct);
            return ApiResponse<List<FarmerMarketPriceItemDto>>.Ok(list, "Daily market prices retrieved successfully.");
        }

        public async Task<ApiResponse<FarmerMarketPriceChartDto>> GetChartAsync(string idOrCode, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(idOrCode))
            {
                return ApiResponse<FarmerMarketPriceChartDto>.Fail("Commodity ID or code is required.");
            }

            var chart = await _repository.GetChartAsync(idOrCode, ct);
            if (chart == null)
            {
                return ApiResponse<FarmerMarketPriceChartDto>.Fail($"Market price trend for '{idOrCode}' not found.");
            }

            return ApiResponse<FarmerMarketPriceChartDto>.Ok(chart, "Commodity price movement trend retrieved successfully.");
        }
    }
}
