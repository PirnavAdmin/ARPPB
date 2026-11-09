
using AgriPurchaseBilling.Domain.Enums;

namespace AgriPurchaseBilling.Application.DTOs;

// REGISTRATION REQUEST
public class RegisterRequestDto
{
    public required string FullName { get; set; }

    // Email is optional
    public string? Email { get; set; }

    // Mobile number is mandatory
    public required string Mobile { get; set; }

    public required UserRole Role { get; set; }

    public required string Password { get; set; }

    public required string ConfirmPassword { get; set; }
}

// REGISTRATION RESPONSE
public class RegistrationResponseDto
{
    public long UserId { get; set; }

    public required string FullName { get; set; }

    public string? Email { get; set; }

    public required string Mobile { get; set; }

    public required string Role { get; set; }

    public required string EntityCode { get; set; }

    public DateTime CreatedAt { get; set; }
}

// COMMON API RESPONSE
public class ApiResponse<T>
{
    public bool Success { get; set; }

    public string Message { get; set; } = string.Empty;

    public T? Data { get; set; }

    public List<string>? Errors { get; set; }

    // Development/testing only. Never populated in Production.
    public string? DevOtp { get; set; }

    public static ApiResponse<T> Ok(
        T data,
        string message = "Success") =>
        new()
        {
            Success = true,
            Message = message,
            Data = data
        };

    public static ApiResponse<T> Fail(
        string message,
        List<string>? errors = null) =>
        new()
        {
            Success = false,
            Message = message,
            Errors = errors
        };
}

// LOGIN REQUEST
// User can enter mobile number OR email address.
public class LoginRequestDto
{
    public required string Identifier { get; set; }

    public required string Password { get; set; }
}

// LOGIN RESPONSE
// AccessToken and ExpiresAt removed.
public class LoginResponseDto
{
    public long UserId { get; set; }

    public required string FullName { get; set; }

    public string? Email { get; set; }

    public required string Mobile { get; set; }

    public required string Role { get; set; }
}
