using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IFarmerMySalesService
    {
        Task<ApiResponse<FarmerMySalesSummaryDto>> GetMySalesSummaryAsync(long userId, CancellationToken cancellationToken = default);
        Task<ApiResponse<List<MySalesListItemDto>>> GetMySalesListAsync(long userId, MySalesFilterQueryDto filters, CancellationToken cancellationToken = default);
        Task<ApiResponse<MySalesListItemDto>> GetMySaleByIdAsync(long userId, long saleId, CancellationToken cancellationToken = default);
    }
}
