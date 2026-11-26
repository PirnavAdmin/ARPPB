using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface ICustomerOtpService
    {
        Task<ApiResponse<CustomerConfirmationPagedDto>> GetConfirmationsAsync(
            long customerUserId,
            CustomerConfirmationQueryDto query,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<CustomerConfirmationDetailDto>> GetConfirmationByIdAsync(
            long customerUserId,
            string idOrCode,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<CustomerConfirmationDetailDto>> VerifyOtpAsync(
            long customerUserId,
            string idOrCode,
            CustomerVerifyOtpRequestDto request,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<CustomerConfirmationDetailDto>> ResendOtpAsync(
            long customerUserId,
            string idOrCode,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<CustomerConfirmationDetailDto>> RejectOtpAsync(
            long customerUserId,
            string idOrCode,
            CustomerRejectOtpRequestDto request,
            CancellationToken cancellationToken = default);
    }
}

