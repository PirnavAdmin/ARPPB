using AgriPurchaseBilling.Application.DTOs;
namespace AgriPurchaseBilling.Application.Interfaces;
public interface IRegistrationService
{
    Task<ApiResponse<RegistrationResponseDto>> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default);
}
