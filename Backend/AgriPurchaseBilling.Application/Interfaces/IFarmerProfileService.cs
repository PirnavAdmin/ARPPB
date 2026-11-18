using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IFarmerProfileService
    {
        Task<ApiResponse<List<FarmerProfileResponseDto>>> GetAllProfilesAsync(
            CancellationToken cancellationToken = default);

        Task<ApiResponse<FarmerProfileResponseDto>> GetProfileAsync(
            long userId,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<FarmerProfileResponseDto>> UpdateProfileAsync(
            long userId,
            UpdateFarmerProfileRequestDto request,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<BankDetailsDto>> GetBankDetailsAsync(
            long userId,
            bool reveal = false,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<BankDetailsDto>> UpdateBankDetailsAsync(
            long userId,
            UpdateBankDetailsRequestDto request,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<string>> SendMobileChangeOtpAsync(
            long userId,
            string newMobile,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<string>> VerifyMobileChangeOtpAsync(
            long userId,
            string newMobile,
            string otp,
            CancellationToken cancellationToken = default);


        Task<ApiResponse<string>> ChangePasswordAsync(
            long userId,
            ChangeFarmerPasswordRequestDto request,
            CancellationToken cancellationToken = default);
    }
}
