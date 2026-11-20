using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IFarmerOtpConfirmationService
    {
        Task<ApiResponse<FarmerOtpSummaryDto>> GetSummaryAsync(long userId, CancellationToken cancellationToken = default);
        Task<ApiResponse<List<FarmerOtpConfirmationItemDto>>> GetListAsync(long userId, FarmerOtpFilterQueryDto filters, CancellationToken cancellationToken = default);
        Task<ApiResponse<FarmerOtpConfirmationItemDto>> GetDetailsAsync(long userId, long saleId, CancellationToken cancellationToken = default);
        Task<ApiResponse<FarmerOtpConfirmationItemDto>> GetDetailsAsync(long userId, string idOrCode, CancellationToken cancellationToken = default);
        Task<ApiResponse<List<OptionItemDto>>> GetChannelsAsync(CancellationToken cancellationToken = default);
        Task<ApiResponse<SellOrderResponseDto>> VerifyOtpAsync(long userId, long saleId, VerifySellOtpRequestDto request, CancellationToken cancellationToken = default);
        Task<ApiResponse<SellOrderResponseDto>> VerifyOtpAsync(long userId, string idOrCode, VerifySellOtpRequestDto request, CancellationToken cancellationToken = default);
        Task<ApiResponse<SellOrderResponseDto>> ResendOtpAsync(long userId, long saleId, CancellationToken cancellationToken = default);
        Task<ApiResponse<SellOrderResponseDto>> ResendOtpAsync(long userId, string idOrCode, CancellationToken cancellationToken = default);
        Task<ApiResponse<bool>> RejectAsync(long userId, long saleId, CancellationToken cancellationToken = default);
        Task<ApiResponse<bool>> RejectAsync(long userId, string idOrCode, CancellationToken cancellationToken = default);
    }
}
