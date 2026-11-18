using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IOtpService
    {
        Task<ApiResponse<string>> GenerateOtpAsync(GenerateOtpRequestDto request, CancellationToken cancellationToken = default);
        Task<ApiResponse<string>> VerifyOtpAsync(VerifyOtpRequestDto request, CancellationToken cancellationToken = default);
        Task<bool> IsPasswordResetOtpVerifiedAsync(string destination, CancellationToken cancellationToken = default);
        Task<ApiResponse<string>> GenerateRegistrationOtpAsync(string mobile, CancellationToken cancellationToken = default);
        Task<ApiResponse<string>> VerifyRegistrationOtpAsync(string mobile, string otp, CancellationToken cancellationToken = default);
        Task<bool> IsRegistrationOtpVerifiedAsync(string mobile, CancellationToken cancellationToken = default);
        Task ConsumeRegistrationOtpAsync(string mobile, CancellationToken cancellationToken = default);
        Task ConsumeVerifiedOtpAsync(string destination, CancellationToken cancellationToken = default);

        // Farmer Profile Mobile-number Change OTP flow.
        Task<ApiResponse<string>> GenerateMobileChangeOtpAsync(long userId, string newMobile, CancellationToken cancellationToken = default);
        Task<ApiResponse<string>> VerifyMobileChangeOtpAsync(long userId, string newMobile, string otp, CancellationToken cancellationToken = default);
        Task ConsumeMobileChangeOtpAsync(long userId, string newMobile, CancellationToken cancellationToken = default);

        // Middleman Profile Mobile-number Change OTP flow.
        Task<ApiResponse<string>> GenerateMiddlemanMobileChangeOtpAsync(long userId, string newMobile, CancellationToken cancellationToken = default);
        Task<ApiResponse<string>> VerifyMiddlemanMobileChangeOtpAsync(long userId, string newMobile, string otp, CancellationToken cancellationToken = default);
        Task<bool> IsMiddlemanMobileChangeOtpVerifiedAsync(long userId, string newMobile, CancellationToken cancellationToken = default);
        Task ConsumeMiddlemanMobileChangeOtpAsync(long userId, string newMobile, CancellationToken cancellationToken = default);

        // Vendor Profile Mobile-number Change OTP flow.
        Task<ApiResponse<string>> GenerateVendorMobileChangeOtpAsync(long userId, string newMobile, CancellationToken cancellationToken = default);
        Task<ApiResponse<string>> VerifyVendorMobileChangeOtpAsync(long userId, string newMobile, string otp, CancellationToken cancellationToken = default);
        Task<bool> IsVendorMobileChangeOtpVerifiedAsync(long userId, string newMobile, CancellationToken cancellationToken = default);
        Task ConsumeVendorMobileChangeOtpAsync(long userId, string newMobile, CancellationToken cancellationToken = default);
    }
}