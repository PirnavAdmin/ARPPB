using System.Net.Mail;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;

namespace AgriPurchaseBilling.Application.Services
{
    public sealed class VendorProfileService : IVendorProfileService
    {
        public const long MaxLogoBytes = 2 * 1024 * 1024;

        public static readonly string[] BusinessTypes =
        {
            "Agri Procurement, Milling & Wholesale Distribution",
            "Raw Commodity Processing & Oil Extraction Mill",
            "APMC Licensed Commission & Bulk Trading House",
            "FPO / Agro-Processing Cooperative Enterprise"
        };

        public static readonly string[] Districts =
        {
            "Kurnool", "Nandyal", "Anantapur", "Guntur", "Prakasam", "Kadapa", "Palnadu", "Bapatla", "Krishna", "NTR",
            "West Godavari", "East Godavari", "Nellore", "Chittoor", "Tirupati", "Visakhapatnam", "Vizianagaram", "Srikakulam"
        };

        public static readonly string[] States =
        {
            "Andhra Pradesh", "Telangana", "Karnataka", "Tamil Nadu", "Maharashtra", "Odisha", "Chhattisgarh"
        };

        private readonly IVendorProfileRepository _repository;
        private readonly IVendorProfileExtrasRepository _extras;

        public VendorProfileService(IVendorProfileRepository repository, IVendorProfileExtrasRepository extras)
        {
            _repository = repository;
            _extras = extras;
        }

        // ------------------------------------------------------------------
        // Profile
        // ------------------------------------------------------------------
        public async Task<VendorProfileDto?> GetMyProfileAsync(
            long userId,
            CancellationToken cancellationToken = default)
        {
            var profile = await _repository.GetOrCreateProfileByUserIdAsync(userId, cancellationToken);
            return profile == null ? null : await BuildAsync(userId, profile, cancellationToken);
        }

        public async Task<List<VendorProfileDto>> GetAllProfilesAsync(
            CancellationToken cancellationToken = default)
        {
            var profiles = await _repository.GetAllProfilesAsync(cancellationToken);
            var banks = (await _repository.GetAllPrimaryBanksAsync(cancellationToken))
                .GroupBy(x => x.VendorProfileId)
                .ToDictionary(g => g.Key, g => g.First());

            return profiles
                .Select(p => MapProfile(p, banks.GetValueOrDefault(p.Id)))
                .ToList();
        }

        public async Task<VendorProfileDto?> GetProfileByIdAsync(
            long userId,
            long id,
            CancellationToken cancellationToken = default)
        {
            var profile = await _repository.GetProfileByIdAsync(id, cancellationToken);
            if (profile == null)
            {
                return null;
            }

            if (profile.Vendor?.UserId != userId)
            {
                throw new UnauthorizedAccessException("You can only view your own vendor profile.");
            }

            return await BuildAsync(userId, profile, cancellationToken);
        }

        public async Task<VendorProfileDto?> UpdateMyProfileAsync(
            long userId,
            UpdateVendorProfileRequest request,
            CancellationToken cancellationToken = default)
        {
            var profile = await _repository.GetOrCreateProfileByUserIdAsync(userId, cancellationToken);
            return profile == null ? null : await ApplyUpdateAsync(userId, profile, request, cancellationToken);
        }

        public async Task<VendorProfileDto?> UpdateProfileByIdAsync(
            long userId,
            long id,
            UpdateVendorProfileRequest request,
            CancellationToken cancellationToken = default)
        {
            var existing = await _repository.GetProfileByIdAsync(id, cancellationToken);
            if (existing == null)
            {
                return null;
            }

            if (existing.Vendor?.UserId != userId)
            {
                throw new UnauthorizedAccessException(
                    "You can only update your own vendor profile.");
            }

            return await ApplyUpdateAsync(userId, existing, request, cancellationToken);
        }

        private async Task<VendorProfileDto?> ApplyUpdateAsync(
            long userId,
            VendorProfile existing,
            UpdateVendorProfileRequest request,
            CancellationToken cancellationToken)
        {
            ValidateProfile(request, existing);

            // Validate the logo first so nothing is saved when it is rejected.
            VendorLogo? logo = null;
            if (!string.IsNullOrWhiteSpace(request.LogoUrl) && TryParseDataUrl(request.LogoUrl, out var bytes, out var declared))
            {
                logo = ValidateLogo(bytes, declared, "logo");
            }

            var updated = await _repository.UpdateProfileAsync(existing.Id, request, cancellationToken);
            if (updated == null)
            {
                return null;
            }

            if (logo != null)
            {
                await _extras.SaveLogoAsync(userId, logo, cancellationToken);
            }

            return await BuildAsync(userId, updated, cancellationToken);
        }

        private static void ValidateProfile(UpdateVendorProfileRequest request, VendorProfile current)
        {
            var type = request.BusinessType?.Trim() ?? string.Empty;
            if (type.Length > 0 &&
                !BusinessTypes.Contains(type, StringComparer.OrdinalIgnoreCase) &&
                !string.Equals(type, current.BusinessType, StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Select a valid business type.");
            }

            var email = request.Email?.Trim();
            if (!string.IsNullOrEmpty(email))
            {
                try
                {
                    var parsed = new MailAddress(email);
                    if (!string.Equals(parsed.Address, email, StringComparison.OrdinalIgnoreCase)) throw new FormatException();
                }
                catch (FormatException)
                {
                    throw new ArgumentException("Enter a valid email address.");
                }
            }
        }

        // ------------------------------------------------------------------
        // Options and logo
        // ------------------------------------------------------------------
        public VendorProfileOptionsDto GetOptions() => new()
        {
            BusinessTypes = BusinessTypes.ToList(),
            Districts = Districts.ToList(),
            States = States.ToList(),
            DefaultState = "Andhra Pradesh",
            MaxLogoBytes = MaxLogoBytes,
            AllowedLogoTypes = new List<string> { "image/png", "image/jpeg", "image/webp" }
        };

        public Task<VendorLogo?> GetLogoAsync(long userId, CancellationToken cancellationToken = default) =>
            _extras.GetLogoAsync(userId, cancellationToken);

        public async Task<VendorProfileDto?> SaveLogoAsync(
            long userId,
            byte[] data,
            string fileName,
            CancellationToken cancellationToken = default)
        {
            var logo = ValidateLogo(data, null, fileName);

            var profile = await _repository.GetOrCreateProfileByUserIdAsync(userId, cancellationToken);
            if (profile == null || !await _extras.SaveLogoAsync(userId, logo, cancellationToken))
            {
                return null;
            }

            return await BuildAsync(userId, profile, cancellationToken);
        }

        public Task<bool> DeleteLogoAsync(long userId, CancellationToken cancellationToken = default) =>
            _extras.DeleteLogoAsync(userId, cancellationToken);

        /// <summary>PNG / JPG / WEBP only, max 2 MB, and the bytes must really be that image type.</summary>
        private static VendorLogo ValidateLogo(byte[] data, string? declaredType, string fileName)
        {
            if (data.Length == 0)
            {
                throw new ArgumentException("The logo file is empty.");
            }

            if (data.Length > MaxLogoBytes)
            {
                throw new ArgumentException("The logo must be 2 MB or smaller.");
            }

            string? detected = null;
            if (data.Length > 12)
            {
                if (data[0] == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47) detected = "image/png";
                else if (data[0] == 0xFF && data[1] == 0xD8 && data[2] == 0xFF) detected = "image/jpeg";
                else if (data[0] == 'R' && data[1] == 'I' && data[2] == 'F' && data[3] == 'F' &&
                         data[8] == 'W' && data[9] == 'E' && data[10] == 'B' && data[11] == 'P') detected = "image/webp";
            }

            if (detected == null)
            {
                throw new ArgumentException("Upload a PNG, JPG or WEBP image.");
            }

            var safeName = Path.GetFileName(fileName ?? string.Empty);
            if (string.IsNullOrWhiteSpace(safeName)) safeName = "logo";
            return new VendorLogo(data, detected, safeName.Length > 255 ? safeName[..255] : safeName);
        }

        private static bool TryParseDataUrl(string value, out byte[] data, out string? contentType)
        {
            data = Array.Empty<byte>();
            contentType = null;

            // Only data URLs carry a new logo; http(s) / blob URLs (the current logo) are left alone.
            if (!value.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase)) return false;

            var comma = value.IndexOf(',');
            if (comma < 0 || !value[..comma].Contains(";base64", StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("The logo must be a base64 image.");
            }

            contentType = value[5..value.IndexOf(';')];
            try
            {
                data = Convert.FromBase64String(value[(comma + 1)..]);
            }
            catch (FormatException)
            {
                throw new ArgumentException("The logo is not valid base64 data.");
            }
            return true;
        }

        // ------------------------------------------------------------------
        // Bank details
        // ------------------------------------------------------------------
        public async Task<VendorBankDetailsDto?> GetBankDetailsAsync(
            long userId,
            bool reveal,
            CancellationToken cancellationToken = default)
        {
            var profile = await _repository.GetOrCreateProfileByUserIdAsync(userId, cancellationToken);
            if (profile == null)
            {
                return null;
            }

            var bank = await _repository.GetPrimaryBankAsync(profile.Id, cancellationToken);
            return bank == null ? new VendorBankDetailsDto() : MapBank(bank, reveal);
        }

        public async Task<VendorBankDetailsDto?> UpdateBankDetailsAsync(
            long userId,
            UpdateVendorBankDetailsRequest request,
            CancellationToken cancellationToken = default)
        {
            if (!request.ConfirmUpdate)
            {
                throw new ArgumentException("Updating bank details requires explicit confirmation.");
            }

            var profile = await _repository.GetOrCreateProfileByUserIdAsync(userId, cancellationToken);
            if (profile == null)
            {
                return null;
            }

            await _repository.UpsertBankAsync(profile.Id, request, cancellationToken);
            var bank = await _repository.GetPrimaryBankAsync(profile.Id, cancellationToken);
            if (bank == null)
            {
                return null;
            }

            // Security trail: the vendor sees "Bank details updated" on the Notifications screen.
            if (profile.VendorId is long vendorId)
            {
                await _extras.NotifyAsync(
                    vendorId,
                    "Settlement Bank Details Updated",
                    $"Primary settlement account changed to {bank.BankName} ({MapBank(bank, reveal: false).AccountNumber}).",
                    "High",
                    profile.VendorCode,
                    cancellationToken);
            }

            return MapBank(bank, reveal: false);
        }

        // ------------------------------------------------------------------
        // Mapping
        // ------------------------------------------------------------------
        private async Task<VendorProfileDto> BuildAsync(long userId, VendorProfile profile, CancellationToken ct)
        {
            var bank = await _repository.GetPrimaryBankAsync(profile.Id, ct);
            var dto = MapProfile(profile, bank);

            var logo = await _extras.GetLogoAsync(userId, ct);
            if (logo != null)
            {
                dto.HasLogo = true;
                dto.LogoUrl = $"data:{logo.ContentType};base64,{Convert.ToBase64String(logo.Data)}";
            }
            return dto;
        }

        private static VendorProfileDto MapProfile(VendorProfile profile, VendorBankAccount? bank)
        {
            var features = new List<string>();
            if (profile.OtpSecurityEnabled) features.Add("OTP Security");
            if (profile.GstBillingEnabled) features.Add("GST Billing");

            return new VendorProfileDto
            {
                Id = profile.Id,
                VendorCode = profile.VendorCode,
                BusinessName = profile.BusinessName,
                Initials = Initials(profile.BusinessName),
                Status = profile.IsActive ? "Active" : "Inactive",
                IsVerified = profile.IsVerified,
                VerificationLabel = profile.IsVerified ? "Verified Enterprise Vendor" : "Verification Pending",
                BusinessDescription = profile.BusinessType,
                Location = FormatLocation(profile.District, profile.State, profile.PinCode),
                Gstin = profile.Gstin ?? string.Empty,
                ApmcLicenseNumber = profile.ApmcLicenseNumber ?? string.Empty,
                UpdatedAt = profile.UpdatedAt,
                Compliance = new VendorComplianceDto
                {
                    OtpSecurityEnabled = profile.OtpSecurityEnabled,
                    GstBillingEnabled = profile.GstBillingEnabled,
                    Summary = features.Count == 0 ? "No compliance features enabled" : $"{string.Join(" & ", features)} Enabled",
                    LastUpdated = profile.ComplianceUpdatedAt
                },
                Business = MapBusiness(profile),
                BankDetails = bank == null ? null : MapBank(bank, reveal: false)
            };
        }

        private static VendorBusinessProfileDto MapBusiness(VendorProfile profile) => new()
        {
            VendorId = profile.VendorCode,
            BusinessName = profile.BusinessName,
            OwnerName = profile.OwnerName,
            Mobile = profile.Mobile,
            Email = profile.Email,
            Gstin = profile.Gstin ?? string.Empty,
            ApmcLicenseNumber = profile.ApmcLicenseNumber ?? string.Empty,
            BusinessRegistrationNumber = profile.BusinessRegNumber,
            BusinessType = profile.BusinessType,
            BusinessAddress = profile.BusinessAddress,
            District = profile.District,
            State = profile.State,
            PinCode = profile.PinCode,
            LastUpdatedAt = profile.ComplianceUpdatedAt
        };

        private static VendorBankDetailsDto MapBank(VendorBankAccount account, bool reveal)
        {
            string accountNumber = account.AccountNumber;
            if (!reveal && accountNumber.Length > 4)
            {
                accountNumber = new string('X', accountNumber.Length - 4) + accountNumber[^4..];
            }

            return new VendorBankDetailsDto
            {
                AccountHolderName = account.AccountHolderName,
                BankName = account.BankName,
                BranchName = account.BranchName,
                AccountNumber = accountNumber,
                IsMasked = !reveal,
                IfscCode = account.IfscCode,
                LastUpdatedAt = account.UpdatedAt
            };
        }

        private static string FormatLocation(string district, string state, string pinCode)
        {
            var area = string.Join(", ", new[] { district, state }
                .Where(x => !string.IsNullOrWhiteSpace(x)));
            return string.IsNullOrWhiteSpace(pinCode) ? area : $"{area} - {pinCode}";
        }

        private static string Initials(string? name)
        {
            var parts = (name ?? string.Empty).Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 0) return string.Empty;
            return parts.Length == 1
                ? parts[0][..Math.Min(2, parts[0].Length)].ToUpperInvariant()
                : $"{char.ToUpperInvariant(parts[0][0])}{char.ToUpperInvariant(parts[1][0])}";
        }
    }
}
