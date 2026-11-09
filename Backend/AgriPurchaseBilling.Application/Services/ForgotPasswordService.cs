
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;

namespace AgriPurchaseBilling.Application.Services;

public sealed class ForgotPasswordService : IForgotPasswordService
{
    private readonly IOtpService _otpService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUserRepository _userRepository;

    public ForgotPasswordService(
        IOtpService otpService,
        IPasswordHasher passwordHasher,
        IUserRepository userRepository)
    {
        _otpService = otpService;
        _passwordHasher = passwordHasher;
        _userRepository = userRepository;
    }

    // FORGOT PASSWORD
    public async Task<ApiResponse<string>> ForgotPasswordAsync(
        ForgotPasswordRequestDto request,
        CancellationToken cancellationToken = default)
    {
        bool hasEmail = !string.IsNullOrWhiteSpace(request.Email);
        bool hasMobile = !string.IsNullOrWhiteSpace(request.Mobile);

        if (hasEmail == hasMobile)
        {
            return ApiResponse<string>.Fail(
                "Provide either email address or mobile number.");
        }

        string destination = hasEmail
            ? request.Email!.Trim().ToLowerInvariant()
            : request.Mobile!.Trim();

        var user = hasEmail
            ? await _userRepository.GetByEmailAsync(
                destination, cancellationToken)
            : await _userRepository.GetByMobileAsync(
                destination, cancellationToken);

        if (user == null || !user.IsActive)
        {
            return ApiResponse<string>.Ok(
                "If the account exists, an OTP will be sent.",
                "Password recovery request processed.");
        }

        // Generate OTP using the registered destination.
        return await _otpService.GenerateOtpAsync(
            new GenerateOtpRequestDto
            {
                Email = hasEmail ? destination : null,
                Mobile = hasMobile ? destination : null
            },
            cancellationToken);
    }

    // RESET PASSWORD
    public async Task<ApiResponse<bool>> ResetPasswordAsync(
        ResetPasswordRequestDto request,
        CancellationToken cancellationToken = default)
    {
        bool hasEmail = !string.IsNullOrWhiteSpace(request.Email);
        bool hasMobile = !string.IsNullOrWhiteSpace(request.Mobile);

        if (hasEmail == hasMobile ||
            string.IsNullOrWhiteSpace(request.NewPassword) ||
            string.IsNullOrWhiteSpace(request.ConfirmPassword))
        {
            return ApiResponse<bool>.Fail(
                "Provide either email or mobile, new password and confirm password.");
        }

        if (request.NewPassword.Length < 8)
        {
            return ApiResponse<bool>.Fail(
                "Password must contain at least 8 characters.");
        }

        if (request.NewPassword != request.ConfirmPassword)
        {
            return ApiResponse<bool>.Fail(
                "New password and confirm password do not match.");
        }

        string destination = hasEmail
            ? request.Email!.Trim().ToLowerInvariant()
            : request.Mobile!.Trim();

        var user = hasEmail
            ? await _userRepository.GetByEmailAsync(
                destination, cancellationToken)
            : await _userRepository.GetByMobileAsync(
                destination, cancellationToken);

        if (user == null || !user.IsActive)
        {
            return ApiResponse<bool>.Fail(
                "Unable to reset password.");
        }

        // Reset is permitted only after the separate verify-otp API has
        // successfully marked this OTP as verified.
        var verified = await _otpService.IsPasswordResetOtpVerifiedAsync(
            destination, cancellationToken);

        if (!verified)
        {
            return ApiResponse<bool>.Fail(
                "Verify the OTP successfully before resetting your password.");
        }

        string passwordHash = _passwordHasher.HashPassword(
            request.NewPassword);

        bool updated = await _userRepository.UpdatePasswordAsync(
            user.Id,
            passwordHash,
            cancellationToken);

        if (!updated)
        {
            return ApiResponse<bool>.Fail(
                "Password could not be updated.");
        }

        // Consume the verified OTP.
        await _otpService.ConsumeVerifiedOtpAsync(
            destination,
            cancellationToken);

        return ApiResponse<bool>.Ok(
            true,
            "Password reset successfully.");
    }
}
