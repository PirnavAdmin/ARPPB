namespace AgriPurchaseBilling.Application.Interfaces
{
    /// <summary>A business rule conflict on the vendor profile (duplicate GSTIN / email): reported as HTTP 409.</summary>
    public sealed class VendorProfileConflictException : Exception
    {
        public VendorProfileConflictException(string message) : base(message) { }
    }

    /// <summary>The business logo stored on the vendor profile.</summary>
    public sealed record VendorLogo(byte[] Data, string ContentType, string FileName);

    /// <summary>My Profile features that run through stored procedures: the business logo and the profile notifications.</summary>
    public interface IVendorProfileExtrasRepository
    {
        /// <summary>The logo of the vendor that belongs to this user (sp_vp_profile_logo_get), or null.</summary>
        Task<VendorLogo?> GetLogoAsync(long userId, CancellationToken ct);

        /// <summary>Stores the logo (sp_vp_profile_logo_save). False when the user has no vendor profile yet.</summary>
        Task<bool> SaveLogoAsync(long userId, VendorLogo logo, CancellationToken ct);

        /// <summary>Removes the logo (sp_vp_profile_logo_delete). False when there was none.</summary>
        Task<bool> DeleteLogoAsync(long userId, CancellationToken ct);

        /// <summary>Raises a notification for the vendor (sp_vp_profile_notify), e.g. "Bank details updated".</summary>
        Task NotifyAsync(long vendorId, string title, string description, string priority, string? reference, CancellationToken ct);
    }
}
