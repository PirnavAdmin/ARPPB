using System.Data;
using System.Data.Common;
using System.Globalization;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriPurchaseBilling.Infrastructure.Repositories
{
    public sealed class VendorProfileRepository : IVendorProfileRepository
    {
        private readonly AppDbContext _context;

        public VendorProfileRepository(AppDbContext context)
        {
            _context = context;
        }

        private async Task<DbConnection> GetOpenConnectionAsync(CancellationToken cancellationToken)
        {
            var conn = _context.Database.GetDbConnection();
            if (conn.State != ConnectionState.Open)
            {
                await conn.OpenAsync(cancellationToken);
            }
            return conn;
        }

        public async Task<VendorProfile?> GetOrCreateProfileByUserIdAsync(
            long userId,
            CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorProfile_GetOrCreateByUserId(@p_user_id);";
            AddParam(cmd, "@p_user_id", userId);

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return MapVendorProfile(reader);
            }
            return null;
        }

        public async Task<List<VendorProfile>> GetAllProfilesAsync(
            CancellationToken cancellationToken = default)
        {
            var results = new List<VendorProfile>();
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorProfile_GetAll();";

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                results.Add(MapVendorProfile(reader));
            }
            return results;
        }

        public async Task<VendorProfile?> GetProfileByIdAsync(
            long id,
            CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorProfile_GetById(@p_id);";
            AddParam(cmd, "@p_id", id);

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return MapVendorProfile(reader);
            }
            return null;
        }

        public async Task<VendorProfile?> UpdateProfileAsync(
            long id,
            UpdateVendorProfileRequest request,
            CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorProfile_Update(@p_id, @p_business_name, @p_gstin, @p_business_reg_number, @p_apmc_license_number, @p_business_type, @p_business_address, @p_district, @p_state, @p_pin_code);";

            AddParam(cmd, "@p_id", id);
            AddParam(cmd, "@p_business_name", request.BusinessName.Trim());
            AddParam(cmd, "@p_gstin", request.Gstin.Trim().ToUpperInvariant());
            AddParam(cmd, "@p_business_reg_number", request.BusinessRegistrationNumber.Trim());
            AddParam(cmd, "@p_apmc_license_number", string.IsNullOrWhiteSpace(request.ApmcLicenseNumber) ? null : request.ApmcLicenseNumber.Trim());
            AddParam(cmd, "@p_business_type", request.BusinessType.Trim());
            AddParam(cmd, "@p_business_address", request.BusinessAddress.Trim());
            AddParam(cmd, "@p_district", request.District.Trim());
            AddParam(cmd, "@p_state", request.State.Trim());
            AddParam(cmd, "@p_pin_code", request.PinCode.Trim());

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return MapVendorProfile(reader);
            }
            return null;
        }

        public async Task<List<VendorBankAccount>> GetAllPrimaryBanksAsync(
            CancellationToken cancellationToken = default)
        {
            var results = new List<VendorBankAccount>();
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorProfile_GetAllPrimaryBanks();";

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                results.Add(MapBankAccount(reader));
            }
            return results;
        }

        public async Task<VendorBankAccount?> GetPrimaryBankAsync(
            long vendorProfileId,
            CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorProfile_GetPrimaryBank(@p_vendor_profile_id);";
            AddParam(cmd, "@p_vendor_profile_id", vendorProfileId);

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return MapBankAccount(reader);
            }
            return null;
        }

        public async Task<bool> UpsertBankAsync(
            long vendorProfileId,
            UpdateVendorBankDetailsRequest request,
            CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorProfile_UpsertBank(@p_vendor_profile_id, @p_account_holder_name, @p_bank_name, @p_branch_name, @p_account_number, @p_ifsc_code);";

            AddParam(cmd, "@p_vendor_profile_id", vendorProfileId);
            AddParam(cmd, "@p_account_holder_name", request.AccountHolderName.Trim());
            AddParam(cmd, "@p_bank_name", request.BankName.Trim());
            AddParam(cmd, "@p_branch_name", request.BranchName.Trim());
            AddParam(cmd, "@p_account_number", request.AccountNumber.Trim());
            AddParam(cmd, "@p_ifsc_code", request.IfscCode.Trim().ToUpperInvariant());

            await cmd.ExecuteNonQueryAsync(cancellationToken);
            return true;
        }

        public async Task<bool> IsMobileInUseAsync(
            long userId,
            string mobile,
            CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorProfile_IsMobileInUse(@p_user_id, @p_mobile);";
            AddParam(cmd, "@p_user_id", userId);
            AddParam(cmd, "@p_mobile", mobile);

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return SafeBool(reader["IsInUse"]);
            }
            return false;
        }

        public async Task<bool> HasRecentMobileChangeOtpAsync(
            long userId,
            DateTime sinceUtc,
            CancellationToken cancellationToken = default)
        {
            string purpose = $"VendorMobileChange:{userId}";
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorProfile_HasRecentMobileOtp(@p_purpose, @p_since_utc);";
            AddParam(cmd, "@p_purpose", purpose);
            AddParam(cmd, "@p_since_utc", sinceUtc);

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return SafeBool(reader["HasRecent"]);
            }
            return false;
        }

        public async Task<bool> UpdateMobileWithHistoryAsync(
            long userId,
            string mobile,
            CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorProfile_UpdateMobileWithHistory(@p_user_id, @p_new_mobile);";
            AddParam(cmd, "@p_user_id", userId);
            AddParam(cmd, "@p_new_mobile", mobile);

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return SafeBool(reader["Updated"]);
            }
            return false;
        }

        private static VendorProfile MapVendorProfile(DbDataReader reader)
        {
            var vendorId = SafeNullableLong(reader["VendorId"]);
            var vendorCode = SafeString(reader["VendorCode"]);
            var vendorUserId = SafeNullableLong(reader["VendorUserId"]);

            return new VendorProfile
            {
                Id = SafeLong(reader["Id"]),
                VendorId = vendorId,
                VendorCode = vendorCode,
                BusinessName = SafeString(reader["BusinessName"]),
                OwnerName = SafeString(reader["OwnerName"]),
                Mobile = SafeString(reader["Mobile"]),
                Email = SafeString(reader["Email"]),
                Gstin = SafeNullableString(reader["Gstin"]),
                BusinessRegNumber = SafeString(reader["BusinessRegNumber"]),
                ApmcLicenseNumber = SafeNullableString(reader["ApmcLicenseNumber"]),
                BusinessType = SafeString(reader["BusinessType"]),
                BusinessAddress = SafeString(reader["BusinessAddress"]),
                District = SafeString(reader["District"]),
                State = SafeString(reader["State"]),
                PinCode = SafeString(reader["PinCode"]),
                IsActive = SafeBool(reader["IsActive"]),
                IsVerified = SafeBool(reader["IsVerified"]),
                OtpSecurityEnabled = SafeBool(reader["OtpSecurityEnabled"]),
                GstBillingEnabled = SafeBool(reader["GstBillingEnabled"]),
                ComplianceUpdatedAt = SafeNullableDateTime(reader["ComplianceUpdatedAt"]),
                CreatedAt = SafeDateTime(reader["CreatedAt"]),
                UpdatedAt = SafeDateTime(reader["UpdatedAt"]),
                Vendor = vendorId.HasValue && vendorUserId.HasValue
                    ? new Vendor
                    {
                        Id = vendorId.Value,
                        UserId = vendorUserId.Value,
                        VendorCode = vendorCode
                    }
                    : null
            };
        }

        private static VendorBankAccount MapBankAccount(DbDataReader reader)
        {
            return new VendorBankAccount
            {
                Id = SafeLong(reader["Id"]),
                VendorProfileId = SafeLong(reader["VendorProfileId"]),
                AccountHolderName = SafeString(reader["AccountHolderName"]),
                BankName = SafeString(reader["BankName"]),
                BranchName = SafeString(reader["BranchName"]),
                AccountNumber = SafeString(reader["AccountNumber"]),
                IfscCode = SafeString(reader["IfscCode"]),
                IsPrimary = SafeBool(reader["IsPrimary"]),
                CreatedAt = SafeDateTime(reader["CreatedAt"]),
                UpdatedAt = SafeDateTime(reader["UpdatedAt"])
            };
        }

        private static void AddParam(DbCommand cmd, string name, object? value)
        {
            var p = cmd.CreateParameter();
            p.ParameterName = name;
            p.Value = value ?? DBNull.Value;
            cmd.Parameters.Add(p);
        }

        private static string SafeString(object? val) => val == null || val is DBNull ? string.Empty : val.ToString() ?? string.Empty;
        private static string? SafeNullableString(object? val) => val == null || val is DBNull ? null : val.ToString();
        private static long SafeLong(object? val) => val == null || val is DBNull ? 0L : Convert.ToInt64(val, CultureInfo.InvariantCulture);
        private static long? SafeNullableLong(object? val) => val == null || val is DBNull ? null : Convert.ToInt64(val, CultureInfo.InvariantCulture);
        private static bool SafeBool(object? val) => val != null && !(val is DBNull) && (val is bool b ? b : Convert.ToInt32(val, CultureInfo.InvariantCulture) != 0);
        private static DateTime SafeDateTime(object? val) => val == null || val is DBNull ? DateTime.UtcNow : Convert.ToDateTime(val, CultureInfo.InvariantCulture);
        private static DateTime? SafeNullableDateTime(object? val) => val == null || val is DBNull ? null : Convert.ToDateTime(val, CultureInfo.InvariantCulture);
    }
}
