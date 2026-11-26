using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Infrastructure.Data;

namespace AgriPurchaseBilling.Infrastructure.Repositories
{
    /// <summary>Business logo and profile notifications of the vendor profile, via stored procedures.</summary>
    public sealed class VendorProfileExtrasRepository : IVendorProfileExtrasRepository
    {
        private readonly VendorPortalDb _db;
        public VendorProfileExtrasRepository(VendorPortalDb db) => _db = db;

        public Task<VendorLogo?> GetLogoAsync(long userId, CancellationToken ct) =>
            _db.ProcAsync(
                "sp_vp_profile_logo_get",
                new (string, object?)[] { ("p_user", userId) },
                async r =>
                {
                    if (!await r.ReadAsync() || r.IsDBNull(2)) return null;
                    var contentType = r.IsDBNull(0) ? "image/png" : r.GetString(0);
                    var fileName = r.IsDBNull(1) ? "logo" : r.GetString(1);
                    return (VendorLogo?)new VendorLogo((byte[])r.GetValue(2), contentType, fileName);
                },
                ct);

        public async Task<bool> SaveLogoAsync(long userId, VendorLogo logo, CancellationToken ct) =>
            await _db.ProcAsync(
                "sp_vp_profile_logo_save",
                new (string, object?)[]
                {
                    ("p_user", userId),
                    ("p_type", logo.ContentType),
                    ("p_name", logo.FileName),
                    ("p_data", logo.Data)
                },
                RowMapper.ReadScalarLongAsync,
                ct) > 0;

        public async Task<bool> DeleteLogoAsync(long userId, CancellationToken ct) =>
            await _db.ProcAsync(
                "sp_vp_profile_logo_delete",
                new (string, object?)[] { ("p_user", userId) },
                RowMapper.ReadScalarLongAsync,
                ct) > 0;

        public Task NotifyAsync(long vendorId, string title, string description, string priority, string? reference, CancellationToken ct) =>
            _db.ProcAsync(
                "sp_vp_profile_notify",
                new (string, object?)[]
                {
                    ("p_vendor", vendorId),
                    ("p_title", title),
                    ("p_desc", description),
                    ("p_priority", priority),
                    ("p_ref", reference)
                },
                r => Task.FromResult(true),
                ct);
    }
}
