using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Domain.Entities;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IVendorProfileRepository
    {
        Task<VendorProfile?> GetOrCreateProfileByUserIdAsync(long userId, CancellationToken cancellationToken = default);
        Task<List<VendorProfile>> GetAllProfilesAsync(CancellationToken cancellationToken = default);
        Task<VendorProfile?> GetProfileByIdAsync(long id, CancellationToken cancellationToken = default);
        Task<VendorProfile?> UpdateProfileAsync(long id, UpdateVendorProfileRequest request, CancellationToken cancellationToken = default);
        Task<List<VendorBankAccount>> GetAllPrimaryBanksAsync(CancellationToken cancellationToken = default);
        Task<VendorBankAccount?> GetPrimaryBankAsync(long vendorProfileId, CancellationToken cancellationToken = default);
        Task<bool> UpsertBankAsync(long vendorProfileId, UpdateVendorBankDetailsRequest request, CancellationToken cancellationToken = default);
        Task<bool> IsMobileInUseAsync(long userId, string mobile, CancellationToken cancellationToken = default);
        Task<bool> HasRecentMobileChangeOtpAsync(long userId, DateTime sinceUtc, CancellationToken cancellationToken = default);
        Task<bool> UpdateMobileWithHistoryAsync(long userId, string mobile, CancellationToken cancellationToken = default);
    }
}
