using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IVendorProfileService
    {
        Task<VendorProfileDto?> GetMyProfileAsync(long userId, CancellationToken cancellationToken = default);
        Task<List<VendorProfileDto>> GetAllProfilesAsync(CancellationToken cancellationToken = default);
        Task<VendorProfileDto?> GetProfileByIdAsync(long id, CancellationToken cancellationToken = default);
        Task<VendorProfileDto?> UpdateMyProfileAsync(long userId, UpdateVendorProfileRequest request, CancellationToken cancellationToken = default);
        /// <summary>Returns null if not found. Throws UnauthorizedAccessException if the profile belongs to another vendor.</summary>
        Task<VendorProfileDto?> UpdateProfileByIdAsync(long userId, long id, UpdateVendorProfileRequest request, CancellationToken cancellationToken = default);
        Task<VendorBankDetailsDto?> GetBankDetailsAsync(long userId, bool reveal, CancellationToken cancellationToken = default);
        Task<VendorBankDetailsDto?> UpdateBankDetailsAsync(long userId, UpdateVendorBankDetailsRequest request, CancellationToken cancellationToken = default);
    }
}
