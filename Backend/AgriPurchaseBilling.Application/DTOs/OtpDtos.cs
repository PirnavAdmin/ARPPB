namespace AgriPurchaseBilling.Application.DTOs;

// FORGOT PASSWORD REQUEST
public class ForgotPasswordRequestDto
{
    public string? Email { get; set; }

    public string? Mobile { get; set; }
}

// GENERATE OTP REQUEST
public class GenerateOtpRequestDto
{
    public string? Email { get; set; }

    public string? Mobile { get; set; }
}

// VERIFY OTP REQUEST
public class VerifyOtpRequestDto
{
    public string? Email { get; set; }

    public string? Mobile { get; set; }

    public required string Otp { get; set; }
}

// RESET PASSWORD REQUEST
public class ResetPasswordRequestDto
{
    public string? Email { get; set; }

    public string? Mobile { get; set; }

    public required string NewPassword { get; set; }

    public required string ConfirmPassword { get; set; }
}