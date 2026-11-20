using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Domain.Entities;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IFarmerMySalesRepository
    {
        Task<Farmer?> GetFarmerByUserIdAsync(long userId, CancellationToken cancellationToken = default);
        Task<FarmerMySalesSummaryDto> GetMySalesSummaryAsync(long farmerId, CancellationToken cancellationToken = default);
        Task<List<MySalesListItemDto>> GetMySalesListAsync(long farmerId, MySalesFilterQueryDto filters, CancellationToken cancellationToken = default);
        Task<FarmerSale?> GetMySaleByIdAsync(long saleId, long farmerId, CancellationToken cancellationToken = default);
    }
}
