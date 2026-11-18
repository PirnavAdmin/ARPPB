using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IMiddlemanProfileService
    {
        Task<MiddlemanProfileDto?> GetByUserIdAsync(long userId, CancellationToken cancellationToken);
        Task<MiddlemanProfileDto?> GetByIdAsync(long profileId, CancellationToken cancellationToken);
        Task<MiddlemanProfileDto?> UpdateAsync(long profileId, long userId, UpdateMiddlemanProfileRequest request, CancellationToken cancellationToken);
    }
}
