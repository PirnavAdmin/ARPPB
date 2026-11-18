using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;

namespace AgriPurchaseBilling.Application.Services
{
    public sealed class VendorProfileService : IVendorProfileService
    {
        private readonly IVendorProfileRepository _repository;

        public VendorProfileService(IVendorProfileRepository repository)
        {
            _repository = repository;
        }

        public async Task<VendorProfileDto?> GetMyProfileAsync(
            long userId,
            CancellationToken cancellationToken = default)
        {
            var profile = await _repository.GetOrCreateProfileByUserIdAsync(userId, cancellationToken);
            if (profile == null)
            {
                return null;
            }

            var bank = await _repository.GetPrimaryBankAsync(profile.Id, cancellationToken);
            return MapProfile(profile, bank);
        }

        public async Task<VendorProfileDto?> UpdateProfileAsync(
            long userId,
            UpdateVendorProfileRequest request,
            CancellationToken cancellationToken = default)
        {
            var profile = await _repository.UpdateProfileAsync(userId, request, cancellationToken);
            if (profile == null)
            {
                return null;
            }

            var bank = await _repository.GetPrimaryBankAsync(profile.Id, cancellationToken);
            return MapProfile(profile, bank);
        }

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
                throw new ArgumentException(
                    "Updating bank details requires explicit confirmation.",
                    nameof(request.ConfirmUpdate));
            }

            var profile = await _repository.GetOrCreateProfileByUserIdAsync(userId, cancellationToken);
            if (profile == null)
            {
                return null;
            }

            await _repository.UpsertBankAsync(profile.Id, request, cancellationToken);
            var bank = await _repository.GetPrimaryBankAsync(profile.Id, cancellationToken);
            return bank == null ? null : MapBank(bank, reveal: false);
        }

        private static VendorProfileDto MapProfile(VendorProfile profile, VendorBankAccount? bank)
        {
            var features = new List<string>();
            if (profile.OtpSecurityEnabled) features.Add("OTP Security");
            if (profile.GstBillingEnabled) features.Add("GST Billing");

            return new VendorProfileDto
            {
                VendorCode = profile.VendorCode,
                BusinessName = profile.BusinessName,
                Initials = Initials(profile.BusinessName),
                Status = profile.IsActive ? "Active" : "Inactive",
                IsVerified = profile.IsVerified,
                VerificationLabel = profile.IsVerified ? "Verified Enterprise Vendor" : "Verification Pending",
                BusinessDescription = profile.BusinessType,
                Location = FormatLocation(profile.District, profile.State, profile.PinCode),
                Gstin = profile.Gstin ?? string.Empty,
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
            BusinessRegistrationNumber = profile.BusinessRegNumber,
            BusinessType = profile.BusinessType,
            BusinessAddress = profile.BusinessAddress,
            District = profile.District,
            State = profile.State,
            PinCode = profile.PinCode
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
                IfscCode = account.IfscCode
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
