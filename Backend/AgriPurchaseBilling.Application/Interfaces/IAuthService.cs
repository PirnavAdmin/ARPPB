
using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces;

public interface IAuthService
{
    // LOGIN
    Task<ApiResponse<LoginResponseDto>> LoginAsync(
        LoginRequestDto request,
        CancellationToken cancellationToken = default);

    // FORGOT PASSWORD
    Task<ApiResponse<string>> ForgotPasswordAsync(
        ForgotPasswordRequestDto request,
        CancellationToken cancellationToken = default);

    // RESET PASSWORD
    Task<ApiResponse<bool>> ResetPasswordAsync(
        ResetPasswordRequestDto request,
        CancellationToken cancellationToken = default);
}
