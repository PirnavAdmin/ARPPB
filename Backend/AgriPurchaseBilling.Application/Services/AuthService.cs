
using System.Text.RegularExpressions;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;

namespace AgriPurchaseBilling.Application.Services;

public class RegistrationService : IRegistrationService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IOtpService _otpService;

    public RegistrationService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IOtpService otpService)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _otpService = otpService;
    }

    public async Task<ApiResponse<RegistrationResponseDto>> RegisterAsync(
        RegisterRequestDto request,
        CancellationToken cancellationToken = default)
    {
        // 1. Validate mandatory fields
        if (string.IsNullOrWhiteSpace(request.FullName) ||
            string.IsNullOrWhiteSpace(request.Mobile) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return ApiResponse<RegistrationResponseDto>.Fail(
                "Full name, mobile number and password are required.");
        }

        // 2. Validate mobile number
        string mobile = request.Mobile.Trim();

        if (!Regex.IsMatch(mobile, @"^[0-9]{10}$"))
        {
            return ApiResponse<RegistrationResponseDto>.Fail(
                "Enter a valid 10-digit mobile number.");
        }

        // 3. Validate optional email
        string? email = string.IsNullOrWhiteSpace(request.Email)
            ? null
            : request.Email.Trim().ToLowerInvariant();

        if (email != null &&
            !Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
        {
            return ApiResponse<RegistrationResponseDto>.Fail(
                "Enter a valid email address.");
        }

        // Registration is allowed only after mobile OTP verification.
        if (!await _otpService.IsRegistrationOtpVerifiedAsync(mobile, cancellationToken))
        {
            return ApiResponse<RegistrationResponseDto>.Fail(
                "Verify the mobile OTP before registering.");
        }

        // 4. Check duplicate mobile
        if (await _userRepository.ExistsByMobileAsync(
            mobile, cancellationToken))
        {
            return ApiResponse<RegistrationResponseDto>.Fail(
                $"Mobile number '{mobile}' is already registered.");
        }

        // 5. Check duplicate email only when provided
        if (email != null &&
            await _userRepository.ExistsByEmailAsync(
                email, cancellationToken))
        {
            return ApiResponse<RegistrationResponseDto>.Fail(
                $"Email address '{email}' is already registered.");
        }

        // 6. Check password confirmation
        if (request.Password != request.ConfirmPassword)
        {
            return ApiResponse<RegistrationResponseDto>.Fail(
                "Password and Confirm Password do not match.");
        }

        // 7. Hash password
        string hashedPassword =
            _passwordHasher.HashPassword(request.Password);

        // 8. Create user entity
        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            Mobile = mobile,
            PasswordHash = hashedPassword,
            Role = request.Role,
            IsActive = true
        };

        // 9. Save user
        //  Save user and create role-specific profile in the database.
        var (createdUser, entityCode) =
            await _userRepository.CreateUserWithProfileAsync(
                user, request.Role, cancellationToken);

        // Consume the verified registration OTP after successful account creation.
        await _otpService.ConsumeRegistrationOtpAsync(mobile, cancellationToken);

        // 10. Prepare response
        var responseData = new RegistrationResponseDto
        {
            UserId = createdUser.Id,
            FullName = createdUser.FullName,
            Email = createdUser.Email,
            Mobile = createdUser.Mobile,
            Role = createdUser.Role.ToString(),
            EntityCode = entityCode,
            CreatedAt = createdUser.CreatedAt
        };

        return ApiResponse<RegistrationResponseDto>.Ok(
            responseData,
            $"{request.Role} registered successfully with code {entityCode}.");
    }
}
