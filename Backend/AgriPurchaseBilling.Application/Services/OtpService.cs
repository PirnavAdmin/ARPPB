using System.Security.Cryptography;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;

namespace AgriPurchaseBilling.Application.Services;

public sealed class OtpService : IOtpService
{
    private const int OtpExpiryMinutes = 5;
    private const int MaxAttempts = 5;
    private const string PasswordResetPurpose = "PasswordReset";
    private const string RegistrationPurpose = "Registration";

    private readonly IOtpRepository _otpRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUserRepository _userRepository;
    private readonly bool _isDevelopment;

    public OtpService(IOtpRepository otpRepository, IPasswordHasher passwordHasher,
        IUserRepository userRepository)
    {
        _otpRepository = otpRepository;
        _passwordHasher = passwordHasher;
        _userRepository = userRepository;
        _isDevelopment = string.Equals(
            Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
            "Development", StringComparison.OrdinalIgnoreCase);
    }

    public async Task<ApiResponse<string>> GenerateRegistrationOtpAsync(
        string mobile, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(mobile) || !System.Text.RegularExpressions.Regex.IsMatch(mobile.Trim(), @"^[0-9]{10}$"))
            return ApiResponse<string>.Fail("Enter a valid 10-digit mobile number.");
        mobile = mobile.Trim();
        if (await _userRepository.ExistsByMobileAsync(mobile, cancellationToken))
            return ApiResponse<string>.Fail("This mobile number is already registered.");
        return await GenerateForDestinationAsync(null, mobile, RegistrationPurpose, cancellationToken);
    }

    public Task<ApiResponse<string>> VerifyRegistrationOtpAsync(
        string mobile, string otp, CancellationToken cancellationToken = default) =>
        VerifyForDestinationAsync(mobile, otp, RegistrationPurpose, cancellationToken);

    public async Task<bool> IsRegistrationOtpVerifiedAsync(
        string mobile, CancellationToken cancellationToken = default)
    {
        var record = await _otpRepository.GetLatestOtpAsync(mobile.Trim(), RegistrationPurpose, cancellationToken);
        return record != null && record.VerifiedAt != null &&
               record.ExpiresAt > DateTime.UtcNow && record.Attempts < MaxAttempts;
    }

    public async Task ConsumeRegistrationOtpAsync(
        string mobile, CancellationToken cancellationToken = default)
    {
        if (!await IsRegistrationOtpVerifiedAsync(mobile, cancellationToken))
            throw new InvalidOperationException("A verified registration OTP is required.");
        await _otpRepository.ConsumeOtpAsync(mobile.Trim(), RegistrationPurpose, cancellationToken);
    }

    public async Task<ApiResponse<string>> GenerateOtpAsync(
        GenerateOtpRequestDto request, CancellationToken cancellationToken = default)
    {
        bool hasEmail = !string.IsNullOrWhiteSpace(request.Email);
        bool hasMobile = !string.IsNullOrWhiteSpace(request.Mobile);
        if (hasEmail == hasMobile)
            return ApiResponse<string>.Fail("Provide either an email address or a mobile number.");

        string destination = hasEmail ? request.Email!.Trim().ToLowerInvariant() : request.Mobile!.Trim();
        var user = hasEmail
            ? await _userRepository.GetByEmailAsync(destination, cancellationToken)
            : await _userRepository.GetByMobileAsync(destination, cancellationToken);
        if (user == null || !user.IsActive)
            return ApiResponse<string>.Ok("If the account exists, an OTP will be generated.", "OTP request processed.");

        return await GenerateForDestinationAsync(
            hasEmail ? destination : null, hasMobile ? destination : null,
            PasswordResetPurpose, cancellationToken);
    }

    public Task<ApiResponse<string>> VerifyOtpAsync(
        VerifyOtpRequestDto request, CancellationToken cancellationToken = default)
    {
        bool hasEmail = !string.IsNullOrWhiteSpace(request.Email);
        bool hasMobile = !string.IsNullOrWhiteSpace(request.Mobile);
        if (hasEmail == hasMobile)
            return Task.FromResult(ApiResponse<string>.Fail("Provide either email or mobile number."));
        string destination = hasEmail ? request.Email!.Trim().ToLowerInvariant() : request.Mobile!.Trim();
        return VerifyForDestinationAsync(destination, request.Otp, PasswordResetPurpose, cancellationToken);
    }

    public async Task<bool> IsPasswordResetOtpVerifiedAsync(string destination, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(destination)) return false;
        var record = await _otpRepository.GetLatestOtpAsync(destination.Trim(), PasswordResetPurpose, cancellationToken);
        return record != null && record.VerifiedAt != null &&
               record.ExpiresAt > DateTime.UtcNow && record.Attempts < MaxAttempts;
    }

    public async Task ConsumeVerifiedOtpAsync(string destination, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(destination)) throw new ArgumentException("Email or mobile is required.", nameof(destination));
        destination = destination.Trim();
        var record = await _otpRepository.GetLatestOtpAsync(destination, PasswordResetPurpose, cancellationToken);
        if (record == null || record.VerifiedAt == null || record.ExpiresAt <= DateTime.UtcNow)
            throw new InvalidOperationException("A valid verified OTP is required before it can be consumed.");
        await _otpRepository.ConsumeOtpAsync(destination, PasswordResetPurpose, cancellationToken);
    }

    private async Task<ApiResponse<string>> GenerateForDestinationAsync(
        string? email, string? mobile, string purpose, CancellationToken cancellationToken)
    {
        string otp = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        var record = new UserOtp
        {
            Email = email, Mobile = mobile,
            OtpHash = _passwordHasher.HashPassword(otp), Purpose = purpose,
            ExpiresAt = DateTime.UtcNow.AddMinutes(OtpExpiryMinutes),
            Attempts = 0, VerifiedAt = null, CreatedAt = DateTime.UtcNow
        };
        string destination = email ?? mobile!;
        await _otpRepository.SaveOtpAsync(record, cancellationToken);
        var response = ApiResponse<string>.Ok(
            "OTP generated successfully. It expires in 5 minutes.", "OTP generated successfully.");
        if (_isDevelopment) response.DevOtp = $"DEV-{otp}";
        return response;
    }

    private async Task<ApiResponse<string>> VerifyForDestinationAsync(
        string destination, string otp, string purpose, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(destination) || string.IsNullOrWhiteSpace(otp))
            return ApiResponse<string>.Fail("Destination and OTP are required.");
        destination = destination.Trim(); otp = otp.Trim();
        if (otp.Length != 6 || !otp.All(char.IsDigit))
            return ApiResponse<string>.Fail("Enter a valid six-digit OTP.");
        var record = await _otpRepository.GetLatestOtpAsync(destination, purpose, cancellationToken);
        if (record == null) return ApiResponse<string>.Fail("OTP not found. Please generate a new OTP.");
        if (record.ExpiresAt <= DateTime.UtcNow || record.Attempts >= MaxAttempts)
        {
            await _otpRepository.ConsumeOtpAsync(destination, purpose, cancellationToken);
            return ApiResponse<string>.Fail(record.ExpiresAt <= DateTime.UtcNow ? "OTP has expired." : "Maximum OTP attempts exceeded.");
        }
        if (record.VerifiedAt != null)
        {
            return _passwordHasher.VerifyPassword(otp, record.OtpHash)
                ? ApiResponse<string>.Ok("OTP verified successfully.")
                : ApiResponse<string>.Fail("Invalid OTP.");
        }
        if (!_passwordHasher.VerifyPassword(otp, record.OtpHash))
        {
            await _otpRepository.IncrementAttemptsAsync(record.Id, cancellationToken);
            return ApiResponse<string>.Fail(record.Attempts + 1 >= MaxAttempts ? "Invalid OTP. Maximum attempts reached." : "Invalid OTP.");
        }
        if (!await _otpRepository.MarkVerifiedAsync(record.Id, cancellationToken))
            return ApiResponse<string>.Fail("OTP verification failed. Please try again.");
        return ApiResponse<string>.Ok("OTP verified successfully.");
    }
}
