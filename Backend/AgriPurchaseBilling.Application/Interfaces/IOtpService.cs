using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces;

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
}
