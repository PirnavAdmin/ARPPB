using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IFarmerSellProductService
    {
        Task<ApiResponse<SellProductOptionsDto>> GetSellOptionsAsync(long userId, CancellationToken cancellationToken = default);
        Task<ApiResponse<SellOrderResponseDto>> CreateSellOrderAsync(long userId, CreateSellOrderRequestDto request, CancellationToken cancellationToken = default);
        Task<ApiResponse<SellOrderResponseDto>> VerifySellOtpAsync(long userId, long saleId, VerifySellOtpRequestDto request, CancellationToken cancellationToken = default);
        Task<ApiResponse<SellOrderResponseDto>> VerifySellOtpAsync(long userId, string idOrCode, VerifySellOtpRequestDto request, CancellationToken cancellationToken = default);
        Task<ApiResponse<SellOrderResponseDto>> ResendSellOtpAsync(long userId, long saleId, CancellationToken cancellationToken = default);
        Task<ApiResponse<SellOrderResponseDto>> ResendSellOtpAsync(long userId, string idOrCode, CancellationToken cancellationToken = default);
    }
}
