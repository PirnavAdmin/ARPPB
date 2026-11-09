using Microsoft.AspNetCore.Mvc;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;

namespace AgriPurchaseBilling.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class RegistrationController : ControllerBase
{
    private readonly IRegistrationService _registrationService;
    private readonly IOtpService _otpService;

    public RegistrationController(IRegistrationService registrationService, IOtpService otpService)
    {
        _registrationService = registrationService;
        _otpService = otpService;
    }

    public sealed class RegistrationOtpRequest
    {
        public required string Mobile { get; set; }
    }

    public sealed class RegistrationOtpVerifyRequest
    {
        public required string Mobile { get; set; }
        public required string Otp { get; set; }
    }

    [HttpPost("send-mobile-otp")]
    public async Task<IActionResult> SendMobileOtp([FromBody] RegistrationOtpRequest request, CancellationToken cancellationToken)
    {
        var result = await _otpService.GenerateRegistrationOtpAsync(request.Mobile, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("verify-mobile-otp")]
    public async Task<IActionResult> VerifyMobileOtp([FromBody] RegistrationOtpVerifyRequest request, CancellationToken cancellationToken)
    {
        var result = await _otpService.VerifyRegistrationOtpAsync(request.Mobile, request.Otp, cancellationToken);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Register a new Farmer, Customer, Supplier, or Vendor.
    /// </summary>
    /// <param name="request">Registration payload including FullName, Email, 10-digit Mobile, Role, and Password.</param>
    /// <param name="cancellationToken">Cancellation Token</param>
    /// <returns>Created user details with generated entity code.</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<RegistrationResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<RegistrationResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<RegistrationResponseDto>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request, CancellationToken cancellationToken)
    {
        var result = await _registrationService.RegisterAsync(request, cancellationToken);
        if (!result.Success)
        {
            if (result.Message.Contains("already registered", StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(result);
            }
            return BadRequest(result);
        }

        return StatusCode(StatusCodes.Status201Created, result);
    }
}
