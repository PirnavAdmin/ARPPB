using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs.VendorOperations;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriPurchaseBilling.Infrastructure.Services
{
    public class VendorPartnersService : IVendorPartnersService
    {
        private readonly VendorOperationsDbContext _context;

        public VendorPartnersService(VendorOperationsDbContext context)
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

        // ==========================================
        // FARMERS DIRECTORY & PROFILE
        // ==========================================

        public async Task<VendorFarmersOverviewDto> GetFarmersOverviewAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_GetFarmersOverview(@p_vendor_id);";
            AddParam(cmd, "@p_vendor_id", vendorId);

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return new VendorFarmersOverviewDto
                {
                    TotalFarmers = SafeInt(reader["TotalFarmers"]),
                    ActiveFarmers = SafeInt(reader["ActiveFarmers"]),
                    InactiveFarmers = SafeInt(reader["InactiveFarmers"]),
                    TotalPurchases = SafeInt(reader["TotalPurchases"]),
                    TotalQuantityProcured = SafeDecimal(reader["TotalQuantityProcured"]),
                    QuantityUnit = SafeString(reader["QuantityUnit"]),
                    TotalPurchaseAmount = SafeDecimal(reader["TotalPurchaseAmount"]),
                    TotalPayablesDue = SafeDecimal(reader["TotalPayablesDue"])
                };
            }

            return new VendorFarmersOverviewDto { QuantityUnit = "Qtl" };
        }

        public async Task<List<VendorFarmerSummaryDto>> GetFarmersAsync(
            long vendorId, string? search, string? district, string? state, string? crop, string? status, CancellationToken cancellationToken = default)
        {
            var list = new List<VendorFarmerSummaryDto>();
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_GetFarmers(@p_vendor_id, @p_search, @p_district, @p_state, @p_crop, @p_status);";
            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_search", Clean(search));
            AddParam(cmd, "@p_district", Clean(district));
            AddParam(cmd, "@p_state", Clean(state));
            AddParam(cmd, "@p_crop", Clean(crop));
            AddParam(cmd, "@p_status", Clean(status));

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                list.Add(new VendorFarmerSummaryDto
                {
                    Id = SafeLong(reader["Id"]),
                    FarmerCode = SafeString(reader["FarmerCode"]),
                    FarmerName = SafeString(reader["FarmerName"]),
                    FatherOrSpouseName = SafeNullableString(reader["FatherOrSpouseName"]),
                    RegisteredCrops = SafeString(reader["RegisteredCrops"]),
                    MobileNumber = SafeString(reader["MobileNumber"]),
                    Village = SafeString(reader["Village"]),
                    District = SafeString(reader["District"]),
                    State = SafeString(reader["State"]),
                    TotalPurchases = SafeInt(reader["TotalPurchases"]),
                    TotalPurchaseQuantity = SafeDecimal(reader["TotalPurchaseQuantity"]),
                    QuantityUnit = SafeString(reader["QuantityUnit"]),
                    TotalPurchaseAmount = SafeDecimal(reader["TotalPurchaseAmount"]),
                    DueAmount = SafeDecimal(reader["DueAmount"]),
                    Status = SafeString(reader["Status"])
                });
            }

            return list;
        }

        public async Task<VendorFarmerDetailDto?> GetFarmerByIdAsync(long vendorId, string farmerCodeOrId, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_GetFarmerById(@p_vendor_id, @p_farmer_id_or_code);";
            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_farmer_id_or_code", farmerCodeOrId.Trim());

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            return await ReadFarmerDetailFromResultSetsAsync(reader, cancellationToken);
        }

        public async Task<VendorFarmerDetailDto> CreateFarmerAsync(long vendorId, CreateVendorFarmerRequest request, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_CreateFarmer(@p_vendor_id, @p_full_name, @p_father_or_spouse_name, @p_mobile_number, @p_email, @p_village, @p_district, @p_state, @p_pin_code, @p_land_acres, @p_registered_crops, @p_bank_account_number, @p_ifsc_code, @p_bank_name, @p_aadhaar_number, @p_account_holder_name, @p_branch_name, @p_mandal, @p_address);";

            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_full_name", request.FullName.Trim());
            AddParam(cmd, "@p_father_or_spouse_name", Clean(request.FatherOrSpouseName));
            AddParam(cmd, "@p_mobile_number", request.MobileNumber.Trim());
            AddParam(cmd, "@p_email", Clean(request.Email));
            AddParam(cmd, "@p_village", request.Village.Trim());
            AddParam(cmd, "@p_district", request.District.Trim());
            AddParam(cmd, "@p_state", request.State.Trim());
            AddParam(cmd, "@p_pin_code", Clean(request.PinCode));
            AddParam(cmd, "@p_land_acres", request.LandAcres);
            AddParam(cmd, "@p_registered_crops", request.RegisteredCrops.Trim());
            AddParam(cmd, "@p_bank_account_number", Clean(request.BankAccountNumber));
            AddParam(cmd, "@p_ifsc_code", Clean(request.IfscCode));
            AddParam(cmd, "@p_bank_name", Clean(request.BankName));
            AddParam(cmd, "@p_aadhaar_number", Clean(request.AadhaarNumber));
            AddParam(cmd, "@p_account_holder_name", Clean(request.AccountHolderName));
            AddParam(cmd, "@p_branch_name", Clean(request.BranchName));
            AddParam(cmd, "@p_mandal", Clean(request.Mandal));
            AddParam(cmd, "@p_address", Clean(request.Address));

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            return (await ReadFarmerDetailFromResultSetsAsync(reader, cancellationToken))!;
        }

        public async Task<VendorFarmerDetailDto?> UpdateFarmerAsync(long vendorId, string farmerCodeOrId, UpdateVendorFarmerRequest request, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_UpdateFarmer(@p_vendor_id, @p_farmer_id_or_code, @p_full_name, @p_father_or_spouse_name, @p_mobile_number, @p_email, @p_village, @p_district, @p_state, @p_pin_code, @p_land_acres, @p_registered_crops, @p_bank_account_number, @p_ifsc_code, @p_bank_name, @p_aadhaar_number, @p_status, @p_account_holder_name, @p_branch_name, @p_mandal, @p_address);";

            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_farmer_id_or_code", farmerCodeOrId.Trim());
            AddParam(cmd, "@p_full_name", request.FullName.Trim());
            AddParam(cmd, "@p_father_or_spouse_name", Clean(request.FatherOrSpouseName));
            AddParam(cmd, "@p_mobile_number", request.MobileNumber.Trim());
            AddParam(cmd, "@p_email", Clean(request.Email));
            AddParam(cmd, "@p_village", request.Village.Trim());
            AddParam(cmd, "@p_district", request.District.Trim());
            AddParam(cmd, "@p_state", request.State.Trim());
            AddParam(cmd, "@p_pin_code", Clean(request.PinCode));
            AddParam(cmd, "@p_land_acres", request.LandAcres);
            AddParam(cmd, "@p_registered_crops", request.RegisteredCrops.Trim());
            AddParam(cmd, "@p_bank_account_number", Clean(request.BankAccountNumber));
            AddParam(cmd, "@p_ifsc_code", Clean(request.IfscCode));
            AddParam(cmd, "@p_bank_name", Clean(request.BankName));
            AddParam(cmd, "@p_aadhaar_number", Clean(request.AadhaarNumber));
            AddParam(cmd, "@p_status", Clean(request.Status));
            AddParam(cmd, "@p_account_holder_name", Clean(request.AccountHolderName));
            AddParam(cmd, "@p_branch_name", Clean(request.BranchName));
            AddParam(cmd, "@p_mandal", Clean(request.Mandal));
            AddParam(cmd, "@p_address", Clean(request.Address));

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            return await ReadFarmerDetailFromResultSetsAsync(reader, cancellationToken);
        }

        public async Task<bool> ToggleFarmerStatusAsync(long vendorId, string farmerCodeOrId, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_ToggleFarmerStatus(@p_vendor_id, @p_farmer_id_or_code);";
            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_farmer_id_or_code", farmerCodeOrId.Trim());

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return SafeBool(reader["Toggled"]);
            }
            return false;
        }

        public async Task<List<VendorFarmerTransactionDto>> GetFarmerTransactionsAsync(long vendorId, string farmerCodeOrId, CancellationToken cancellationToken = default)
        {
            var list = new List<VendorFarmerTransactionDto>();
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_GetFarmerTransactions(@p_vendor_id, @p_farmer_id_or_code);";
            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_farmer_id_or_code", farmerCodeOrId.Trim());

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                list.Add(MapFarmerTransaction(reader));
            }
            return list;
        }

        public async Task<List<VendorFarmerPaymentDto>> GetFarmerPaymentsAsync(long vendorId, string farmerCodeOrId, CancellationToken cancellationToken = default)
        {
            var list = new List<VendorFarmerPaymentDto>();
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_GetFarmerPayments(@p_vendor_id, @p_farmer_id_or_code);";
            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_farmer_id_or_code", farmerCodeOrId.Trim());

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                list.Add(MapFarmerPayment(reader));
            }
            return list;
        }

        public async Task<List<VendorFarmerOtpLogDto>> GetFarmerOtpLogsAsync(long vendorId, string farmerCodeOrId, CancellationToken cancellationToken = default)
        {
            var list = new List<VendorFarmerOtpLogDto>();
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_GetFarmerOtpLogs(@p_vendor_id, @p_farmer_id_or_code);";
            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_farmer_id_or_code", farmerCodeOrId.Trim());

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                list.Add(MapFarmerOtpLog(reader));
            }
            return list;
        }

        public async Task<byte[]> ExportFarmersCsvAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var farmers = await GetFarmersAsync(vendorId, null, null, null, null, null, cancellationToken);
            var sb = new StringBuilder();
            sb.AppendLine("Farmer ID,Farmer Name,Father/Spouse,Mobile,Village,District,State,Registered Crops,Total Purchases,Total Quantity,Total Amount,Due Amount,Status");

            foreach (var f in farmers)
            {
                sb.AppendLine($"\"{f.FarmerCode}\",\"{f.FarmerName}\",\"{f.FatherOrSpouseName}\",\"{f.MobileNumber}\",\"{f.Village}\",\"{f.District}\",\"{f.State}\",\"{f.RegisteredCrops}\",{f.TotalPurchases},{f.TotalPurchaseQuantity} {f.QuantityUnit},{f.TotalPurchaseAmount},{f.DueAmount},\"{f.Status}\"");
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }

        private static async Task<VendorFarmerDetailDto?> ReadFarmerDetailFromResultSetsAsync(DbDataReader reader, CancellationToken cancellationToken)
        {
            if (!await reader.ReadAsync(cancellationToken))
                return null;

            var detail = new VendorFarmerDetailDto
            {
                Id = SafeLong(reader["Id"]),
                FarmerCode = SafeString(reader["FarmerCode"]),
                FullName = SafeString(reader["FullName"]),
                FatherOrSpouseName = SafeNullableString(reader["FatherOrSpouseName"]),
                MobileNumber = SafeString(reader["MobileNumber"]),
                Email = SafeNullableString(reader["Email"]),
                Village = SafeString(reader["Village"]),
                Mandal = SafeNullableString(reader["Mandal"]),
                District = SafeString(reader["District"]),
                State = SafeString(reader["State"]),
                Address = SafeNullableString(reader["Address"]),
                PinCode = SafeNullableString(reader["PinCode"]),
                LandAcres = SafeDecimal(reader["LandAcres"]),
                RegisteredCrops = SafeString(reader["RegisteredCrops"]),
                BankAccountNumber = SafeNullableString(reader["BankAccountNumber"]),
                IfscCode = SafeNullableString(reader["IfscCode"]),
                BankName = SafeNullableString(reader["BankName"]),
                AccountHolderName = SafeNullableString(reader["AccountHolderName"]),
                BranchName = SafeNullableString(reader["BranchName"]),
                AadhaarNumber = SafeNullableString(reader["AadhaarNumber"]),
                Status = SafeString(reader["Status"]),
                RegisteredAt = SafeDateTime(reader["RegisteredAt"])
            };

            var purchases = new List<VendorFarmerTransactionDto>();
            if (await reader.NextResultAsync(cancellationToken))
            {
                while (await reader.ReadAsync(cancellationToken))
                {
                    purchases.Add(MapFarmerTransaction(reader));
                }
            }

            var payments = new List<VendorFarmerPaymentDto>();
            if (await reader.NextResultAsync(cancellationToken))
            {
                while (await reader.ReadAsync(cancellationToken))
                {
                    payments.Add(MapFarmerPayment(reader));
                }
            }

            var otpLogs = new List<VendorFarmerOtpLogDto>();
            if (await reader.NextResultAsync(cancellationToken))
            {
                while (await reader.ReadAsync(cancellationToken))
                {
                    otpLogs.Add(MapFarmerOtpLog(reader));
                }
            }

            detail.AssociatedPurchasesCount = purchases.Count;
            detail.AssociatedPurchasesQuantity = purchases.Sum(p => p.Quantity);
            detail.ConfirmedPurchasesCount = purchases.Count(p => !string.Equals(p.PaymentStatus, "Draft", StringComparison.OrdinalIgnoreCase));
            detail.PendingPurchasesCount = purchases.Count(p => string.Equals(p.PaymentStatus, "Draft", StringComparison.OrdinalIgnoreCase));
            detail.TotalPurchaseAmount = purchases.Sum(p => p.TotalAmount);
            detail.CompletedPayments = payments.Where(p => string.Equals(p.Status, "Completed", StringComparison.OrdinalIgnoreCase)).Sum(p => p.Amount);
            detail.PendingPayments = purchases.Sum(p => p.DueAmount);
            detail.Transactions = purchases;
            detail.Payments = payments;
            detail.OtpLogs = otpLogs;

            return detail;
        }

        private static VendorFarmerTransactionDto MapFarmerTransaction(DbDataReader reader) => new()
        {
            Id = SafeLong(reader["Id"]),
            PurchaseCode = SafeString(reader["PurchaseCode"]),
            BillNumber = SafeString(reader["BillNumber"]),
            CropName = SafeString(reader["CropName"]),
            CropVariety = SafeString(reader["CropVariety"]),
            Quantity = SafeDecimal(reader["Quantity"]),
            Unit = SafeString(reader["Unit"]),
            RatePerUnit = SafeDecimal(reader["RatePerUnit"]),
            TotalAmount = SafeDecimal(reader["TotalAmount"]),
            DueAmount = SafeDecimal(reader["DueAmount"]),
            PaymentStatus = SafeString(reader["PaymentStatus"]),
            PurchaseDate = SafeDateTime(reader["PurchaseDate"])
        };

        private static VendorFarmerPaymentDto MapFarmerPayment(DbDataReader reader) => new()
        {
            Id = SafeLong(reader["Id"]),
            PaymentCode = SafeString(reader["PaymentCode"]),
            VoucherNumber = SafeString(reader["VoucherNumber"]),
            Amount = SafeDecimal(reader["Amount"]),
            PaymentMethod = SafeString(reader["PaymentMethod"]),
            PaymentDate = SafeDateTime(reader["PaymentDate"]),
            ReferenceNumber = SafeNullableString(reader["ReferenceNumber"]),
            Status = SafeString(reader["Status"]),
            Notes = SafeNullableString(reader["Notes"])
        };

        private static VendorFarmerOtpLogDto MapFarmerOtpLog(DbDataReader reader) => new()
        {
            Id = SafeLong(reader["Id"]),
            OtpCode = SafeString(reader["OtpCode"]),
            Purpose = SafeString(reader["Purpose"]),
            ActionDetails = SafeString(reader["ActionDetails"]),
            Status = SafeString(reader["Status"]),
            VerifiedAt = SafeNullableDateTime(reader["VerifiedAt"]),
            CreatedAt = SafeDateTime(reader["CreatedAt"])
        };

        // ==========================================
        // MIDDLEMEN DIRECTORY & PROFILE
        // ==========================================

        public async Task<VendorMiddlemenOverviewDto> GetMiddlemenOverviewAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_GetMiddlemenOverview(@p_vendor_id);";
            AddParam(cmd, "@p_vendor_id", vendorId);

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return new VendorMiddlemenOverviewDto
                {
                    TotalMiddlemen = SafeInt(reader["TotalMiddlemen"]),
                    ActiveMiddlemen = SafeInt(reader["ActiveMiddlemen"]),
                    InactiveMiddlemen = SafeInt(reader["InactiveMiddlemen"]),
                    TotalTransactions = SafeInt(reader["TotalTransactions"]),
                    TotalQuantityProcured = SafeDecimal(reader["TotalQuantityProcured"]),
                    QuantityUnit = SafeString(reader["QuantityUnit"]),
                    TotalTransactionAmount = SafeDecimal(reader["TotalTransactionAmount"]),
                    TotalPayablesDue = SafeDecimal(reader["TotalPayablesDue"])
                };
            }

            return new VendorMiddlemenOverviewDto { QuantityUnit = "Qtl" };
        }

        public async Task<List<VendorMiddlemanSummaryDto>> GetMiddlemenAsync(
            long vendorId, string? search, string? district, string? state, string? status, CancellationToken cancellationToken = default)
        {
            var list = new List<VendorMiddlemanSummaryDto>();
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_GetMiddlemen(@p_vendor_id, @p_search, @p_district, @p_state, @p_status);";
            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_search", Clean(search));
            AddParam(cmd, "@p_district", Clean(district));
            AddParam(cmd, "@p_state", Clean(state));
            AddParam(cmd, "@p_status", Clean(status));

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                list.Add(new VendorMiddlemanSummaryDto
                {
                    Id = SafeLong(reader["Id"]),
                    MiddlemanCode = SafeString(reader["MiddlemanCode"]),
                    MiddlemanName = SafeString(reader["MiddlemanName"]),
                    Email = SafeNullableString(reader["Email"]),
                    MobileNumber = SafeString(reader["MobileNumber"]),
                    BusinessName = SafeString(reader["BusinessName"]),
                    Gstin = SafeString(reader["Gstin"]),
                    MarketYardLocation = SafeString(reader["MarketYardLocation"]),
                    District = SafeString(reader["District"]),
                    State = SafeString(reader["State"]),
                    TotalTransactions = SafeInt(reader["TotalTransactions"]),
                    TotalTransactionQuantity = SafeDecimal(reader["TotalTransactionQuantity"]),
                    QuantityUnit = SafeString(reader["QuantityUnit"]),
                    TotalTransactionAmount = SafeDecimal(reader["TotalTransactionAmount"]),
                    DueAmount = SafeDecimal(reader["DueAmount"]),
                    Status = SafeString(reader["Status"])
                });
            }

            return list;
        }

        public async Task<VendorMiddlemanDetailDto?> GetMiddlemanByIdAsync(long vendorId, string middlemanCodeOrId, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_GetMiddlemanById(@p_vendor_id, @p_middleman_id_or_code);";
            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_middleman_id_or_code", middlemanCodeOrId.Trim());

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            return await ReadMiddlemanDetailFromResultSetsAsync(reader, cancellationToken);
        }

        public async Task<VendorMiddlemanDetailDto> CreateMiddlemanAsync(long vendorId, CreateVendorMiddlemanRequest request, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_CreateMiddleman(@p_vendor_id, @p_full_name, @p_email, @p_mobile_number, @p_business_name, @p_gstin, @p_pan, @p_market_yard_location, @p_district, @p_state, @p_pin_code, @p_opening_balance, @p_bank_account_number, @p_account_holder_name, @p_bank_name, @p_ifsc_code, @p_branch_name);";

            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_full_name", request.FullName.Trim());
            AddParam(cmd, "@p_email", Clean(request.Email));
            AddParam(cmd, "@p_mobile_number", request.MobileNumber.Trim());
            AddParam(cmd, "@p_business_name", request.BusinessName.Trim());
            AddParam(cmd, "@p_gstin", (request.Gstin ?? string.Empty).Trim().ToUpperInvariant());
            AddParam(cmd, "@p_pan", (request.Pan ?? string.Empty).Trim().ToUpperInvariant());
            AddParam(cmd, "@p_market_yard_location", request.MarketYardLocation.Trim());
            AddParam(cmd, "@p_district", request.District.Trim());
            AddParam(cmd, "@p_state", request.State.Trim());
            AddParam(cmd, "@p_pin_code", Clean(request.PinCode));
            AddParam(cmd, "@p_opening_balance", request.OpeningBalance);
            AddParam(cmd, "@p_bank_account_number", Clean(request.BankAccountNumber));
            AddParam(cmd, "@p_account_holder_name", Clean(request.AccountHolderName));
            AddParam(cmd, "@p_bank_name", Clean(request.BankName));
            AddParam(cmd, "@p_ifsc_code", Clean(request.IfscCode));
            AddParam(cmd, "@p_branch_name", Clean(request.BranchName));

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            return (await ReadMiddlemanDetailFromResultSetsAsync(reader, cancellationToken))!;
        }

        public async Task<VendorMiddlemanDetailDto?> UpdateMiddlemanAsync(long vendorId, string middlemanCodeOrId, UpdateVendorMiddlemanRequest request, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_UpdateMiddleman(@p_vendor_id, @p_middleman_id_or_code, @p_full_name, @p_email, @p_mobile_number, @p_business_name, @p_gstin, @p_pan, @p_market_yard_location, @p_district, @p_state, @p_pin_code, @p_opening_balance, @p_status, @p_bank_account_number, @p_account_holder_name, @p_bank_name, @p_ifsc_code, @p_branch_name);";

            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_middleman_id_or_code", middlemanCodeOrId.Trim());
            AddParam(cmd, "@p_full_name", request.FullName.Trim());
            AddParam(cmd, "@p_email", Clean(request.Email));
            AddParam(cmd, "@p_mobile_number", request.MobileNumber.Trim());
            AddParam(cmd, "@p_business_name", request.BusinessName.Trim());
            AddParam(cmd, "@p_gstin", (request.Gstin ?? string.Empty).Trim().ToUpperInvariant());
            AddParam(cmd, "@p_pan", (request.Pan ?? string.Empty).Trim().ToUpperInvariant());
            AddParam(cmd, "@p_market_yard_location", request.MarketYardLocation.Trim());
            AddParam(cmd, "@p_district", request.District.Trim());
            AddParam(cmd, "@p_state", request.State.Trim());
            AddParam(cmd, "@p_pin_code", Clean(request.PinCode));
            AddParam(cmd, "@p_opening_balance", request.OpeningBalance);
            AddParam(cmd, "@p_status", Clean(request.Status));
            AddParam(cmd, "@p_bank_account_number", Clean(request.BankAccountNumber));
            AddParam(cmd, "@p_account_holder_name", Clean(request.AccountHolderName));
            AddParam(cmd, "@p_bank_name", Clean(request.BankName));
            AddParam(cmd, "@p_ifsc_code", Clean(request.IfscCode));
            AddParam(cmd, "@p_branch_name", Clean(request.BranchName));

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            return await ReadMiddlemanDetailFromResultSetsAsync(reader, cancellationToken);
        }

        public async Task<bool> ToggleMiddlemanStatusAsync(long vendorId, string middlemanCodeOrId, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_ToggleMiddlemanStatus(@p_vendor_id, @p_middleman_id_or_code);";
            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_middleman_id_or_code", middlemanCodeOrId.Trim());

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return SafeBool(reader["Toggled"]);
            }
            return false;
        }

        public async Task<List<VendorMiddlemanTransactionDto>> GetMiddlemanTransactionsAsync(long vendorId, string middlemanCodeOrId, CancellationToken cancellationToken = default)
        {
            var list = new List<VendorMiddlemanTransactionDto>();
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_GetMiddlemanTransactions(@p_vendor_id, @p_middleman_id_or_code);";
            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_middleman_id_or_code", middlemanCodeOrId.Trim());

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                list.Add(MapMiddlemanTransaction(reader));
            }
            return list;
        }

        public async Task<List<VendorMiddlemanPaymentDto>> GetMiddlemanPaymentsAsync(long vendorId, string middlemanCodeOrId, CancellationToken cancellationToken = default)
        {
            var list = new List<VendorMiddlemanPaymentDto>();
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_GetMiddlemanPayments(@p_vendor_id, @p_middleman_id_or_code);";
            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_middleman_id_or_code", middlemanCodeOrId.Trim());

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                list.Add(MapMiddlemanPayment(reader));
            }
            return list;
        }

        public async Task<List<VendorMiddlemanOtpLogDto>> GetMiddlemanOtpLogsAsync(long vendorId, string middlemanCodeOrId, CancellationToken cancellationToken = default)
        {
            var list = new List<VendorMiddlemanOtpLogDto>();
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_GetMiddlemanOtpLogs(@p_vendor_id, @p_middleman_id_or_code);";
            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_middleman_id_or_code", middlemanCodeOrId.Trim());

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                list.Add(MapMiddlemanOtpLog(reader));
            }
            return list;
        }

        public async Task<byte[]> ExportMiddlemenCsvAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var middlemen = await GetMiddlemenAsync(vendorId, null, null, null, null, cancellationToken);
            var sb = new StringBuilder();
            sb.AppendLine("Middleman ID,Name,Business Name,GSTIN,Mobile,Location,District,State,Total Transactions,Quantity,Total Amount,Due Amount,Status");

            foreach (var m in middlemen)
            {
                sb.AppendLine($"\"{m.MiddlemanCode}\",\"{m.MiddlemanName}\",\"{m.BusinessName}\",\"{m.Gstin}\",\"{m.MobileNumber}\",\"{m.MarketYardLocation}\",\"{m.District}\",\"{m.State}\",{m.TotalTransactions},{m.TotalTransactionQuantity} {m.QuantityUnit},{m.TotalTransactionAmount},{m.DueAmount},\"{m.Status}\"");
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }

        private static async Task<VendorMiddlemanDetailDto?> ReadMiddlemanDetailFromResultSetsAsync(DbDataReader reader, CancellationToken cancellationToken)
        {
            if (!await reader.ReadAsync(cancellationToken))
                return null;

            var detail = new VendorMiddlemanDetailDto
            {
                Id = SafeLong(reader["Id"]),
                MiddlemanCode = SafeString(reader["MiddlemanCode"]),
                FullName = SafeString(reader["FullName"]),
                Email = SafeNullableString(reader["Email"]),
                MobileNumber = SafeString(reader["MobileNumber"]),
                BusinessName = SafeString(reader["BusinessName"]),
                Gstin = SafeString(reader["Gstin"]),
                Pan = SafeString(reader["Pan"]),
                MarketYardLocation = SafeString(reader["MarketYardLocation"]),
                District = SafeString(reader["District"]),
                State = SafeString(reader["State"]),
                PinCode = SafeNullableString(reader["PinCode"]),
                OpeningBalance = SafeDecimal(reader["OpeningBalance"]),
                BankAccountNumber = SafeNullableString(reader["BankAccountNumber"]),
                AccountHolderName = SafeNullableString(reader["AccountHolderName"]),
                BankName = SafeNullableString(reader["BankName"]),
                IfscCode = SafeNullableString(reader["IfscCode"]),
                BranchName = SafeNullableString(reader["BranchName"]),
                Status = SafeString(reader["Status"]),
                RegisteredAt = SafeDateTime(reader["RegisteredAt"])
            };

            var purchases = new List<VendorMiddlemanTransactionDto>();
            if (await reader.NextResultAsync(cancellationToken))
            {
                while (await reader.ReadAsync(cancellationToken))
                {
                    purchases.Add(MapMiddlemanTransaction(reader));
                }
            }

            var payments = new List<VendorMiddlemanPaymentDto>();
            if (await reader.NextResultAsync(cancellationToken))
            {
                while (await reader.ReadAsync(cancellationToken))
                {
                    payments.Add(MapMiddlemanPayment(reader));
                }
            }

            var otpLogs = new List<VendorMiddlemanOtpLogDto>();
            if (await reader.NextResultAsync(cancellationToken))
            {
                while (await reader.ReadAsync(cancellationToken))
                {
                    otpLogs.Add(MapMiddlemanOtpLog(reader));
                }
            }

            detail.TotalTransactionsCount = purchases.Count;
            detail.TotalTransactionsQuantity = purchases.Sum(p => p.Quantity);
            detail.TotalTransactionAmount = purchases.Sum(p => p.TotalAmount);
            detail.PaymentsSettled = payments.Where(p => string.Equals(p.Status, "Completed", StringComparison.OrdinalIgnoreCase)).Sum(p => p.Amount);
            detail.OutstandingPayables = purchases.Sum(p => p.DueAmount);
            detail.Transactions = purchases;
            detail.Payments = payments;
            detail.OtpLogs = otpLogs;

            return detail;
        }

        private static VendorMiddlemanTransactionDto MapMiddlemanTransaction(DbDataReader reader) => new()
        {
            Id = SafeLong(reader["Id"]),
            PurchaseCode = SafeString(reader["PurchaseCode"]),
            BillNumber = SafeString(reader["BillNumber"]),
            CropName = SafeString(reader["CropName"]),
            CropVariety = SafeString(reader["CropVariety"]),
            Quantity = SafeDecimal(reader["Quantity"]),
            Unit = SafeString(reader["Unit"]),
            RatePerUnit = SafeDecimal(reader["RatePerUnit"]),
            TotalAmount = SafeDecimal(reader["TotalAmount"]),
            DueAmount = SafeDecimal(reader["DueAmount"]),
            PaymentStatus = SafeString(reader["PaymentStatus"]),
            PurchaseDate = SafeDateTime(reader["PurchaseDate"])
        };

        private static VendorMiddlemanPaymentDto MapMiddlemanPayment(DbDataReader reader) => new()
        {
            Id = SafeLong(reader["Id"]),
            PaymentCode = SafeString(reader["PaymentCode"]),
            VoucherNumber = SafeString(reader["VoucherNumber"]),
            Amount = SafeDecimal(reader["Amount"]),
            PaymentMethod = SafeString(reader["PaymentMethod"]),
            PaymentDate = SafeDateTime(reader["PaymentDate"]),
            ReferenceNumber = SafeNullableString(reader["ReferenceNumber"]),
            Status = SafeString(reader["Status"]),
            Notes = SafeNullableString(reader["Notes"])
        };

        private static VendorMiddlemanOtpLogDto MapMiddlemanOtpLog(DbDataReader reader) => new()
        {
            Id = SafeLong(reader["Id"]),
            OtpCode = SafeString(reader["OtpCode"]),
            Purpose = SafeString(reader["Purpose"]),
            ActionDetails = SafeString(reader["ActionDetails"]),
            Status = SafeString(reader["Status"]),
            VerifiedAt = SafeNullableDateTime(reader["VerifiedAt"]),
            CreatedAt = SafeDateTime(reader["CreatedAt"])
        };

        // ==========================================
        // CUSTOMERS DIRECTORY
        // ==========================================

        public async Task<VendorCustomersOverviewDto> GetCustomersOverviewAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_GetCustomersOverview(@p_vendor_id);";
            AddParam(cmd, "@p_vendor_id", vendorId);

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return new VendorCustomersOverviewDto
                {
                    TotalCustomers = SafeInt(reader["TotalCustomers"]),
                    ActiveCustomers = SafeInt(reader["ActiveCustomers"]),
                    InactiveCustomers = SafeInt(reader["InactiveCustomers"]),
                    TotalOrders = SafeInt(reader["TotalOrders"]),
                    TotalSalesAmount = SafeDecimal(reader["TotalSalesAmount"]),
                    TotalReceivablesDue = SafeDecimal(reader["TotalReceivablesDue"])
                };
            }

            return new VendorCustomersOverviewDto();
        }

        public async Task<List<VendorCustomerSummaryDto>> GetCustomersAsync(
            long vendorId, string? search, string? district, string? state, string? status, CancellationToken cancellationToken = default)
        {
            var list = new List<VendorCustomerSummaryDto>();
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_GetCustomers(@p_vendor_id, @p_search, @p_district, @p_state, @p_status);";
            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_search", Clean(search));
            AddParam(cmd, "@p_district", Clean(district));
            AddParam(cmd, "@p_state", Clean(state));
            AddParam(cmd, "@p_status", Clean(status));

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                list.Add(new VendorCustomerSummaryDto
                {
                    Id = SafeLong(reader["Id"]),
                    CustomerCode = SafeString(reader["CustomerCode"]),
                    CustomerName = SafeString(reader["CustomerName"]),
                    BusinessName = SafeString(reader["BusinessName"]),
                    CustomerType = SafeString(reader["CustomerType"]),
                    MobileNumber = SafeString(reader["MobileNumber"]),
                    Email = SafeNullableString(reader["Email"]),
                    Address = SafeString(reader["Address"]),
                    District = SafeString(reader["District"]),
                    State = SafeString(reader["State"]),
                    TotalOrders = SafeInt(reader["TotalOrders"]),
                    TotalPurchaseQuantity = SafeDecimal(reader["TotalPurchaseQuantity"]),
                    QuantityUnit = SafeString(reader["QuantityUnit"]),
                    TotalSalesAmount = SafeDecimal(reader["TotalSalesAmount"]),
                    ReceivableAmount = SafeDecimal(reader["ReceivableAmount"]),
                    Status = SafeString(reader["Status"])
                });
            }

            return list;
        }

        public async Task<VendorCustomerDetailDto?> GetCustomerByIdAsync(long vendorId, string customerCodeOrId, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_GetCustomerById(@p_vendor_id, @p_customer_id_or_code);";
            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_customer_id_or_code", customerCodeOrId.Trim());

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            return await ReadCustomerDetailFromResultSetsAsync(reader, cancellationToken);
        }

        public async Task<VendorCustomerDetailDto> CreateCustomerAsync(long vendorId, CreateVendorCustomerRequest request, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_CreateCustomer(@p_vendor_id, @p_customer_name, @p_business_name, @p_customer_type, @p_mobile_number, @p_email, @p_address, @p_district, @p_state, @p_pin_code, @p_gstin, @p_credit_limit, @p_pan, @p_opening_balance, @p_bank_account_number, @p_account_holder_name, @p_bank_name, @p_ifsc_code, @p_branch_name);";

            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_customer_name", request.CustomerName.Trim());
            AddParam(cmd, "@p_business_name", request.BusinessName.Trim());
            AddParam(cmd, "@p_customer_type", request.CustomerType.Trim());
            AddParam(cmd, "@p_mobile_number", request.MobileNumber.Trim());
            AddParam(cmd, "@p_email", Clean(request.Email));
            AddParam(cmd, "@p_address", request.Address.Trim());
            AddParam(cmd, "@p_district", request.District.Trim());
            AddParam(cmd, "@p_state", request.State.Trim());
            AddParam(cmd, "@p_pin_code", Clean(request.PinCode));
            AddParam(cmd, "@p_gstin", Clean(request.Gstin)?.ToUpperInvariant());
            AddParam(cmd, "@p_credit_limit", request.CreditLimit);
            AddParam(cmd, "@p_pan", Clean(request.Pan)?.ToUpperInvariant());
            AddParam(cmd, "@p_opening_balance", request.OpeningBalance);
            AddParam(cmd, "@p_bank_account_number", Clean(request.BankAccountNumber));
            AddParam(cmd, "@p_account_holder_name", Clean(request.AccountHolderName));
            AddParam(cmd, "@p_bank_name", Clean(request.BankName));
            AddParam(cmd, "@p_ifsc_code", Clean(request.IfscCode));
            AddParam(cmd, "@p_branch_name", Clean(request.BranchName));

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            return (await ReadCustomerDetailFromResultSetsAsync(reader, cancellationToken))!;
        }

        public async Task<VendorCustomerDetailDto?> UpdateCustomerAsync(long vendorId, string customerCodeOrId, UpdateVendorCustomerRequest request, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_UpdateCustomer(@p_vendor_id, @p_customer_id_or_code, @p_customer_name, @p_business_name, @p_customer_type, @p_mobile_number, @p_email, @p_address, @p_district, @p_state, @p_pin_code, @p_gstin, @p_credit_limit, @p_status, @p_pan, @p_opening_balance, @p_bank_account_number, @p_account_holder_name, @p_bank_name, @p_ifsc_code, @p_branch_name);";

            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_customer_id_or_code", customerCodeOrId.Trim());
            AddParam(cmd, "@p_customer_name", request.CustomerName.Trim());
            AddParam(cmd, "@p_business_name", request.BusinessName.Trim());
            AddParam(cmd, "@p_customer_type", request.CustomerType.Trim());
            AddParam(cmd, "@p_mobile_number", request.MobileNumber.Trim());
            AddParam(cmd, "@p_email", Clean(request.Email));
            AddParam(cmd, "@p_address", request.Address.Trim());
            AddParam(cmd, "@p_district", request.District.Trim());
            AddParam(cmd, "@p_state", request.State.Trim());
            AddParam(cmd, "@p_pin_code", Clean(request.PinCode));
            AddParam(cmd, "@p_gstin", Clean(request.Gstin)?.ToUpperInvariant());
            AddParam(cmd, "@p_credit_limit", request.CreditLimit);
            AddParam(cmd, "@p_status", Clean(request.Status));
            AddParam(cmd, "@p_pan", Clean(request.Pan)?.ToUpperInvariant());
            AddParam(cmd, "@p_opening_balance", request.OpeningBalance);
            AddParam(cmd, "@p_bank_account_number", Clean(request.BankAccountNumber));
            AddParam(cmd, "@p_account_holder_name", Clean(request.AccountHolderName));
            AddParam(cmd, "@p_bank_name", Clean(request.BankName));
            AddParam(cmd, "@p_ifsc_code", Clean(request.IfscCode));
            AddParam(cmd, "@p_branch_name", Clean(request.BranchName));

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            return await ReadCustomerDetailFromResultSetsAsync(reader, cancellationToken);
        }

        public async Task<bool> ToggleCustomerStatusAsync(long vendorId, string customerCodeOrId, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_VendorPartners_ToggleCustomerStatus(@p_vendor_id, @p_customer_id_or_code);";
            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_customer_id_or_code", customerCodeOrId.Trim());

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return SafeBool(reader["Toggled"]);
            }
            return false;
        }

        public async Task<byte[]> ExportCustomersCsvAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var customers = await GetCustomersAsync(vendorId, null, null, null, null, cancellationToken);
            var sb = new StringBuilder();
            sb.AppendLine("Customer ID,Customer Name,Business Name,Type,Mobile,Address,District,State,Total Orders,Total Quantity,Total Sales Amount,Receivables Due,Status");

            foreach (var c in customers)
            {
                sb.AppendLine($"\"{c.CustomerCode}\",\"{c.CustomerName}\",\"{c.BusinessName}\",\"{c.CustomerType}\",\"{c.MobileNumber}\",\"{c.Address}\",\"{c.District}\",\"{c.State}\",{c.TotalOrders},{c.TotalPurchaseQuantity} {c.QuantityUnit},{c.TotalSalesAmount},{c.ReceivableAmount},\"{c.Status}\"");
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }

        private static async Task<VendorCustomerDetailDto?> ReadCustomerDetailFromResultSetsAsync(DbDataReader reader, CancellationToken cancellationToken)
        {
            if (!await reader.ReadAsync(cancellationToken))
                return null;

            var detail = new VendorCustomerDetailDto
            {
                Id = SafeLong(reader["Id"]),
                CustomerCode = SafeString(reader["CustomerCode"]),
                CustomerName = SafeString(reader["CustomerName"]),
                BusinessName = SafeString(reader["BusinessName"]),
                CustomerType = SafeString(reader["CustomerType"]),
                MobileNumber = SafeString(reader["MobileNumber"]),
                Email = SafeNullableString(reader["Email"]),
                Address = SafeString(reader["Address"]),
                District = SafeString(reader["District"]),
                State = SafeString(reader["State"]),
                PinCode = SafeNullableString(reader["PinCode"]),
                Gstin = SafeNullableString(reader["Gstin"]),
                Pan = SafeNullableString(reader["Pan"]),
                CreditLimit = SafeDecimal(reader["CreditLimit"]),
                OpeningBalance = SafeDecimal(reader["OpeningBalance"]),
                BankAccountNumber = SafeNullableString(reader["BankAccountNumber"]),
                AccountHolderName = SafeNullableString(reader["AccountHolderName"]),
                BankName = SafeNullableString(reader["BankName"]),
                IfscCode = SafeNullableString(reader["IfscCode"]),
                BranchName = SafeNullableString(reader["BranchName"]),
                Status = SafeString(reader["Status"])
            };

            var orders = new List<VendorCustomerOrderDto>();
            if (await reader.NextResultAsync(cancellationToken))
            {
                while (await reader.ReadAsync(cancellationToken))
                {
                    orders.Add(new VendorCustomerOrderDto
                    {
                        Id = SafeLong(reader["Id"]),
                        OrderCode = SafeString(reader["OrderCode"]),
                        ProductName = SafeString(reader["ProductName"]),
                        Quantity = SafeDecimal(reader["Quantity"]),
                        Unit = SafeString(reader["Unit"]),
                        TotalAmount = SafeDecimal(reader["TotalAmount"]),
                        DueAmount = SafeDecimal(reader["DueAmount"]),
                        OrderStatus = SafeString(reader["OrderStatus"]),
                        OrderDate = SafeDateTime(reader["OrderDate"])
                    });
                }
            }

            detail.TotalOrders = orders.Count;
            detail.TotalPurchaseQuantity = orders.Sum(o => o.Quantity);
            detail.QuantityUnit = orders.FirstOrDefault()?.Unit ?? "Quintal";
            detail.TotalSalesAmount = orders.Sum(o => o.TotalAmount);
            detail.ReceivableAmount = orders.Sum(o => o.DueAmount);
            detail.Orders = orders;

            return detail;
        }

        private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private static void AddParam(DbCommand cmd, string name, object? value)
        {
            var p = cmd.CreateParameter();
            p.ParameterName = name;
            p.Value = value ?? DBNull.Value;
            cmd.Parameters.Add(p);
        }

        private static string SafeString(object? val) => val == null || val is DBNull ? string.Empty : val.ToString() ?? string.Empty;
        private static string? SafeNullableString(object? val) => val == null || val is DBNull ? null : val.ToString();
        private static decimal SafeDecimal(object? val) => val == null || val is DBNull ? 0m : Convert.ToDecimal(val, CultureInfo.InvariantCulture);
        private static int SafeInt(object? val) => val == null || val is DBNull ? 0 : Convert.ToInt32(val, CultureInfo.InvariantCulture);
        private static long SafeLong(object? val) => val == null || val is DBNull ? 0L : Convert.ToInt64(val, CultureInfo.InvariantCulture);
        private static DateTime SafeDateTime(object? val) => val == null || val is DBNull ? DateTime.MinValue : Convert.ToDateTime(val, CultureInfo.InvariantCulture);
        private static DateTime? SafeNullableDateTime(object? val) => val == null || val is DBNull ? null : Convert.ToDateTime(val, CultureInfo.InvariantCulture);
        private static bool SafeBool(object? val) => val != null && !(val is DBNull) && (val is bool b ? b : Convert.ToInt32(val, CultureInfo.InvariantCulture) != 0);
    }
}
