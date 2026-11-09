
using Microsoft.EntityFrameworkCore;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;
using AgriPurchaseBilling.Infrastructure.Data;

namespace AgriPurchaseBilling.Infrastructure.Repositories;

public class OtpRepository : IOtpRepository
{
    private readonly AppDbContext _context;

    public OtpRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task SaveOtpAsync(
        UserOtp otp,
        CancellationToken cancellationToken = default)
    {
        // Remove previous OTPs for the same email/mobile and purpose.
        var existingOtps = await _context.UserOtps
            .Where(x =>
                x.Purpose == otp.Purpose &&
                (
                    (otp.Email != null &&
                     x.Email != null &&
                     x.Email.ToLower() == otp.Email.ToLower())
                    ||
                    (otp.Mobile != null &&
                     x.Mobile != null &&
                     x.Mobile == otp.Mobile)
                ))
            .ToListAsync(cancellationToken);

        _context.UserOtps.RemoveRange(existingOtps);

        await _context.UserOtps.AddAsync(
            otp, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<UserOtp?> GetLatestOtpAsync(
        string destination,
        string purpose,
        CancellationToken cancellationToken = default)
    {
        destination = destination.Trim();

        return await _context.UserOtps
            .Where(x =>
                x.Purpose == purpose &&
                (
                    (x.Email != null &&
                     x.Email.ToLower() == destination.ToLower())
                    ||
                    (x.Mobile != null &&
                     x.Mobile == destination)
                ))
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task IncrementAttemptsAsync(
        int otpId,
        CancellationToken cancellationToken = default)
    {
        var otp = await _context.UserOtps
            .FirstOrDefaultAsync(
                x => x.Id == otpId,
                cancellationToken);

        if (otp == null)
            return;

        otp.Attempts++;

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> MarkVerifiedAsync(
        int otpId,
        CancellationToken cancellationToken = default)
    {
        var otp = await _context.UserOtps
            .FirstOrDefaultAsync(
                x => x.Id == otpId,
                cancellationToken);

        if (otp == null)
            return false;

        otp.VerifiedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task ConsumeOtpAsync(
        string destination,
        string purpose,
        CancellationToken cancellationToken = default)
    {
        destination = destination.Trim();

        var otps = await _context.UserOtps
            .Where(x =>
                x.Purpose == purpose &&
                (
                    (x.Email != null &&
                     x.Email.ToLower() == destination.ToLower())
                    ||
                    (x.Mobile != null &&
                     x.Mobile == destination)
                ))
            .ToListAsync(cancellationToken);

        _context.UserOtps.RemoveRange(otps);

        await _context.SaveChangesAsync(cancellationToken);
    }
}
