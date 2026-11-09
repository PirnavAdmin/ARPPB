
using AgriPurchaseBilling.Domain.Entities;

namespace AgriPurchaseBilling.Application.Interfaces;

public interface IOtpRepository
{
    // Save a new OTP and replace the previous OTP
    // for the same email/mobile and purpose.
    Task SaveOtpAsync(
        UserOtp otp,
        CancellationToken cancellationToken = default);

    // Get the latest OTP using email or mobile number.
    Task<UserOtp?> GetLatestOtpAsync(
        string destination,
        string purpose,
        CancellationToken cancellationToken = default);

    // Increment incorrect OTP attempts.
    Task IncrementAttemptsAsync(
        int otpId,
        CancellationToken cancellationToken = default);

    // Mark OTP as verified.
    Task<bool> MarkVerifiedAsync(
        int otpId,
        CancellationToken cancellationToken = default);

    // Delete OTP after successful password reset.
    Task ConsumeOtpAsync(
        string destination,
        string purpose,
        CancellationToken cancellationToken = default);
}
