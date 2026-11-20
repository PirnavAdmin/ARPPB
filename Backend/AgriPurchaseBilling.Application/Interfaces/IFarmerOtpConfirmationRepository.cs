using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Domain.Entities;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IFarmerOtpConfirmationRepository
    {
        Task<Farmer?> GetFarmerByUserIdAsync(long userId, CancellationToken cancellationToken = default);
        Task<FarmerOtpSummaryDto> GetSummaryAsync(long farmerId, CancellationToken cancellationToken = default);
        Task<List<FarmerOtpConfirmationItemDto>> GetListAsync(long farmerId, FarmerOtpFilterQueryDto filters, CancellationToken cancellationToken = default);
        Task<FarmerOtpConfirmationItemDto?> GetDetailsByIdAsync(long saleId, long farmerId, CancellationToken cancellationToken = default);
        Task<bool> RejectAsync(long saleId, long farmerId, string? reason, CancellationToken cancellationToken = default);
        Task<long?> ResolveSaleIdAsync(string idOrCode, long farmerId, CancellationToken cancellationToken = default);
    }
}
