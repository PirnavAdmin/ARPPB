
using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces;

public interface IForgotPasswordService
{
    // Send OTP to the registered email or mobile number.
    Task<ApiResponse<string>> ForgotPasswordAsync(
        ForgotPasswordRequestDto request,
        CancellationToken cancellationToken = default);

    // Verify OTP and reset password using email or mobile.
    Task<ApiResponse<bool>> ResetPasswordAsync(
        ResetPasswordRequestDto request,
        CancellationToken cancellationToken = default);
}
