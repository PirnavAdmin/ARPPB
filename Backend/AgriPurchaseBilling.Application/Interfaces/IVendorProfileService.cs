using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IVendorProfileService
    {
        /// <summary>The logged-in vendor's own profile (created on first use), with bank details masked and the logo.</summary>
        Task<VendorProfileDto?> GetMyProfileAsync(long userId, CancellationToken cancellationToken = default);
        Task<List<VendorProfileDto>> GetAllProfilesAsync(CancellationToken cancellationToken = default);

        /// <summary>Returns null if not found. Throws UnauthorizedAccessException if the profile belongs to another vendor.</summary>
        Task<VendorProfileDto?> GetProfileByIdAsync(long userId, long id, CancellationToken cancellationToken = default);

        /// <summary>Saves the logged-in vendor's own profile ("Save Business Profile").</summary>
        Task<VendorProfileDto?> UpdateMyProfileAsync(long userId, UpdateVendorProfileRequest request, CancellationToken cancellationToken = default);

        /// <summary>Returns null if not found. Throws UnauthorizedAccessException if the profile belongs to another vendor.</summary>
        Task<VendorProfileDto?> UpdateProfileByIdAsync(long userId, long id, UpdateVendorProfileRequest request, CancellationToken cancellationToken = default);

        Task<VendorBankDetailsDto?> GetBankDetailsAsync(long userId, bool reveal, CancellationToken cancellationToken = default);
        Task<VendorBankDetailsDto?> UpdateBankDetailsAsync(long userId, UpdateVendorBankDetailsRequest request, CancellationToken cancellationToken = default);

        /// <summary>Business types, districts and states for the form dropdowns.</summary>
        VendorProfileOptionsDto GetOptions();

        Task<VendorLogo?> GetLogoAsync(long userId, CancellationToken cancellationToken = default);

        /// <summary>Validates (PNG / JPG / WEBP, max 2 MB, real image header) and stores the logo. Null when there is no vendor profile.</summary>
        Task<VendorProfileDto?> SaveLogoAsync(long userId, byte[] data, string fileName, CancellationToken cancellationToken = default);

        /// <summary>Removes the logo. Returns false when there was none.</summary>
        Task<bool> DeleteLogoAsync(long userId, CancellationToken cancellationToken = default);
    }
}
