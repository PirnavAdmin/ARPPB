using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ILoginService _loginService;
    private readonly IOtpService _otpService;
    private readonly IForgotPasswordService _forgotPasswordService;

    public AuthController(
        ILoginService loginService,
        IOtpService otpService,
        IForgotPasswordService forgotPasswordService)
    {
        _loginService = loginService;
        _otpService = otpService;
        _forgotPasswordService = forgotPasswordService;
    }

    // 1. Login: email or mobile + password. No OTP required.
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _loginService.LoginAsync(request, cancellationToken);

        if (!result.Success)
        {
            if (result.Message.StartsWith(
                "Account temporarily locked",
                StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(StatusCodes.Status429TooManyRequests, result);
            }

            return Unauthorized(result);
        }

        return Ok(result);
    }

    // 2. Forgot password: generates the OTP. No separate generate-otp API.
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _forgotPasswordService.ForgotPasswordAsync(request, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // 3. Verify OTP: call this after forgot-password returns DevOtp in Development.
    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp(
        [FromBody] VerifyOtpRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _otpService.VerifyOtpAsync(request, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // 4. Reset password: OTP is not sent again; verification status is checked server-side.
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordRequestDto request,
        CancellationToken cancellationToken)
    {
        var result = await _forgotPasswordService.ResetPasswordAsync(request, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
