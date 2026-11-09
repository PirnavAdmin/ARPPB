
using System.Text.RegularExpressions;

using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;

using Microsoft.Extensions.Logging;

namespace AgriPurchaseBilling.Application.Services;

public class LoginService : ILoginService
{
    private const int MaximumFailedAttempts = 5;
    private static readonly TimeSpan LockoutDuration =
        TimeSpan.FromMinutes(15);

    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _emailService;
    private readonly ILogger<LoginService> _logger;

    public LoginService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IEmailService emailService,
        ILogger<LoginService> logger)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<ApiResponse<LoginResponseDto>> LoginAsync(
        LoginRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Identifier) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return ApiResponse<LoginResponseDto>.Fail(
                "Mobile number/email and password are required.");
        }

        string identifier = request.Identifier.Trim();

        bool isEmail = Regex.IsMatch(
            identifier,
            @"^[^@\s]+@[^@\s]+\.[^@\s]+$");

        bool isMobile = Regex.IsMatch(
            identifier,
            @"^[0-9]{10}$");

        if (!isEmail && !isMobile)
        {
            return ApiResponse<LoginResponseDto>.Fail(
                "Enter a valid 10-digit mobile number or email address.");
        }

        var user = isEmail
            ? await _userRepository.GetByEmailAsync(
                identifier.ToLowerInvariant(), cancellationToken)
            : await _userRepository.GetByMobileAsync(
                identifier, cancellationToken);

        if (user == null || !user.IsActive)
        {
            return ApiResponse<LoginResponseDto>.Fail(
                "Invalid login credentials.");
        }

        DateTime now = DateTime.UtcNow;

        // Check whether the account is currently locked.
        if (user.LockoutEnd.HasValue &&
            user.LockoutEnd.Value > now)
        {
            int remainingMinutes = Math.Max(
                1,
                (int)Math.Ceiling(
                    (user.LockoutEnd.Value - now).TotalMinutes));

            return ApiResponse<LoginResponseDto>.Fail(
                $"Account temporarily locked after {MaximumFailedAttempts} incorrect attempts. Try again in {remainingMinutes} minute(s).");
        }

        // Clear an expired lockout.
        if (user.LockoutEnd.HasValue &&
            user.LockoutEnd.Value <= now)
        {
            await _userRepository.UpdateLoginSecurityAsync(
                user.Id, 0, null, cancellationToken);

            user.FailedLoginAttempts = 0;
            user.LockoutEnd = null;
        }

        // Verify password.
        if (!_passwordHasher.VerifyPassword(
            request.Password, user.PasswordHash))
        {
            int failedAttempts = user.FailedLoginAttempts + 1;

            DateTime? lockoutEnd =
                failedAttempts >= MaximumFailedAttempts
                    ? now.Add(LockoutDuration)
                    : null;

            await _userRepository.UpdateLoginSecurityAsync(
                user.Id,
                failedAttempts,
                lockoutEnd,
                cancellationToken);

            if (lockoutEnd.HasValue)
            {
                return ApiResponse<LoginResponseDto>.Fail(
                    $"Account temporarily locked after {MaximumFailedAttempts} incorrect attempts. Please wait 15 minutes before trying again.");
            }

            int attemptsRemaining =
                MaximumFailedAttempts - failedAttempts;

            return ApiResponse<LoginResponseDto>.Fail(
                $"Invalid login credentials. {attemptsRemaining} attempt(s) remaining before a 15-minute lockout.");
        }

        // Successful login: reset failed attempts.
        await _userRepository.UpdateLoginSecurityAsync(
            user.Id, 0, null, cancellationToken);

        // Create login response WITHOUT access token.
        var response = new LoginResponseDto
        {
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Mobile = user.Mobile,
            Role = user.Role.ToString()
        };

        // Send login notification only if email is available.
        if (!string.IsNullOrWhiteSpace(user.Email))
        {
            try
            {
                await _emailService.SendEmailAsync(
                    user.Email,
                    "ARPPB Login Notification",
                    $"""
                    <html>
                    <body>
                        <h3>Hello {System.Net.WebUtility.HtmlEncode(user.FullName)},</h3>
                        <p>Your ARPPB account was signed in successfully.</p>
                        <p>Login time: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</p>
                        <p>If this wasn't you, please reset your password and contact support.</p>
                        <p>Regards,<br/>ARPPB Team</p>
                    </body>
                    </html>
                    """,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Login notification email failed for UserId: {UserId}",
                    user.Id);
            }
        }

        return ApiResponse<LoginResponseDto>.Ok(
            response,
            "Login successful.");
    }
}
