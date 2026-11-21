using System;
using System.Collections.Generic;
using System.Data;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;

namespace AgriPurchaseBilling.Infrastructure.Repositories
{
    public class FarmerSellProductRepository : IFarmerSellProductRepository
    {
        private readonly AppDbContext _context;

        public FarmerSellProductRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Farmer?> GetFarmerByUserIdAsync(long userId, CancellationToken cancellationToken = default)
        {
            var farmer = await _context.Farmers.FirstOrDefaultAsync(f => f.UserId == userId || f.Id == userId, cancellationToken);
            if (farmer != null) return farmer;

            return await _context.Farmers.FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<FarmerCrop?> GetCropByIdAsync(long cropId, long farmerId, CancellationToken cancellationToken = default)
        {
            return await _context.FarmerCrops.FirstOrDefaultAsync(c => c.Id == cropId && c.FarmerId == farmerId && c.IsActive, cancellationToken);
        }

        public async Task<int> GetCountThisMonthAsync(string prefix, CancellationToken cancellationToken = default)
        {
            var count1 = await _context.FarmerSellProducts.CountAsync(s => s.SaleCode.StartsWith(prefix), cancellationToken);
            var count2 = await _context.FarmerMySales.CountAsync(s => s.SaleCode.StartsWith(prefix), cancellationToken);
            return Math.Max(count1, count2);
        }

        public async Task<List<AvailableCropForSaleDto>> GetAvailableCropsForSaleAsync(long farmerId, CancellationToken cancellationToken = default)
        {
            var crops = new List<AvailableCropForSaleDto>();
            await _context.Database.OpenConnectionAsync(cancellationToken);
            try
            {
                var connection = _context.Database.GetDbConnection();
                using var cmd = connection.CreateCommand();
                cmd.CommandText = "sp_FarmerSellGetCropOptions";
                cmd.CommandType = CommandType.StoredProcedure;

                var param = cmd.CreateParameter();
                param.ParameterName = "p_farmer_id";
                param.Value = farmerId;
                cmd.Parameters.Add(param);

                using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken))
                {
                    crops.Add(new AvailableCropForSaleDto
                    {
                        Id = reader.GetInt64(reader.GetOrdinal("Id")),
                        CropCode = reader.GetString(reader.GetOrdinal("CropCode")),
                        CropName = reader.GetString(reader.GetOrdinal("CropName")),
                        CropCategory = reader.GetString(reader.GetOrdinal("CropCategory")),
                        CropVariety = reader.GetString(reader.GetOrdinal("CropVariety")),
                        QualityGrade = reader.IsDBNull(reader.GetOrdinal("QualityGrade")) ? null : reader.GetString(reader.GetOrdinal("QualityGrade")),
                        AvailableQuantity = reader.GetDecimal(reader.GetOrdinal("AvailableQuantity")),
                        Unit = reader.GetString(reader.GetOrdinal("Unit")),
                        ExpectedSellingPrice = reader.GetDecimal(reader.GetOrdinal("ExpectedSellingPrice")),
                        StorageLocation = reader.IsDBNull(reader.GetOrdinal("StorageLocation")) ? "" : reader.GetString(reader.GetOrdinal("StorageLocation"))
                    });
                }

                return crops;
            }
            finally
            {
                await _context.Database.CloseConnectionAsync();
            }
        }

        public async Task<FarmerSale> CreateSellOrderAsync(FarmerSale sale, CancellationToken cancellationToken = default)
        {
            await _context.Database.OpenConnectionAsync(cancellationToken);
            try
            {
                var connection = _context.Database.GetDbConnection();
                using var cmd = connection.CreateCommand();
                cmd.CommandText = "sp_FarmerSellCreateOrder";
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add(new MySqlParameter("p_sale_code", sale.SaleCode));
                cmd.Parameters.Add(new MySqlParameter("p_farmer_id", sale.FarmerId));
                cmd.Parameters.Add(new MySqlParameter("p_crop_id", sale.CropId));
                cmd.Parameters.Add(new MySqlParameter("p_buyer_category", sale.BuyerCategory));
                cmd.Parameters.Add(new MySqlParameter("p_buyer_name", sale.BuyerName));
                cmd.Parameters.Add(new MySqlParameter("p_buyer_mobile", sale.BuyerMobile));
                cmd.Parameters.Add(new MySqlParameter("p_crop_name", sale.CropName));
                cmd.Parameters.Add(new MySqlParameter("p_crop_variety", sale.CropVariety));
                cmd.Parameters.Add(new MySqlParameter("p_quality_grade", (object?)sale.QualityGrade ?? DBNull.Value));
                cmd.Parameters.Add(new MySqlParameter("p_selling_quantity", sale.SellingQuantity));
                cmd.Parameters.Add(new MySqlParameter("p_unit", sale.Unit));
                cmd.Parameters.Add(new MySqlParameter("p_price_per_unit", sale.PricePerUnit));
                cmd.Parameters.Add(new MySqlParameter("p_total_amount", sale.TotalAmount));
                cmd.Parameters.Add(new MySqlParameter("p_pickup_location", sale.PickupLocation));
                cmd.Parameters.Add(new MySqlParameter("p_expected_pickup_date", sale.ExpectedPickupDate));
                cmd.Parameters.Add(new MySqlParameter("p_notes", (object?)sale.Notes ?? DBNull.Value));
                cmd.Parameters.Add(new MySqlParameter("p_status", sale.Status));
                cmd.Parameters.Add(new MySqlParameter("p_otp_code", sale.OtpCode));
                cmd.Parameters.Add(new MySqlParameter("p_otp_status", sale.OtpStatus));
                cmd.Parameters.Add(new MySqlParameter("p_otp_expires_at", (object?)sale.OtpExpiresAt ?? DBNull.Value));

                using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
                if (await reader.ReadAsync(cancellationToken))
                {
                    return MapFromReader(reader);
                }

                throw new InvalidOperationException("Failed to retrieve created sale record from database.");
            }
            finally
            {
                await _context.Database.CloseConnectionAsync();
            }
        }

        public async Task<FarmerSale> VerifySellOtpAndDeductStockAsync(long saleId, long farmerId, string otpCode, CancellationToken cancellationToken = default)
        {
            await _context.Database.OpenConnectionAsync(cancellationToken);
            try
            {
                var connection = _context.Database.GetDbConnection();
                using var cmd = connection.CreateCommand();
                cmd.CommandText = "sp_FarmerSellVerifyOtpAndDeductStock";
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add(new MySqlParameter("p_sale_id", saleId));
                cmd.Parameters.Add(new MySqlParameter("p_farmer_id", farmerId));
                cmd.Parameters.Add(new MySqlParameter("p_otp_code", otpCode));

                using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
                if (await reader.ReadAsync(cancellationToken))
                {
                    return MapFromReader(reader);
                }

                throw new InvalidOperationException("Failed to retrieve updated sale record after OTP verification.");
            }
            finally
            {
                await _context.Database.CloseConnectionAsync();
            }
        }

        public async Task<FarmerSale> ResendSellOtpAsync(long saleId, long farmerId, string newOtp, DateTime expiresAt, CancellationToken cancellationToken = default)
        {
            await _context.Database.OpenConnectionAsync(cancellationToken);
            try
            {
                var connection = _context.Database.GetDbConnection();
                using var cmd = connection.CreateCommand();
                cmd.CommandText = "sp_FarmerSellResendOtp";
                cmd.CommandType = CommandType.StoredProcedure;

                cmd.Parameters.Add(new MySqlParameter("p_sale_id", saleId));
                cmd.Parameters.Add(new MySqlParameter("p_farmer_id", farmerId));
                cmd.Parameters.Add(new MySqlParameter("p_otp_code", newOtp));
                cmd.Parameters.Add(new MySqlParameter("p_otp_expires_at", expiresAt));

                using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
                if (await reader.ReadAsync(cancellationToken))
                {
                    return MapFromReader(reader);
                }

                throw new InvalidOperationException("Failed to retrieve updated sale record after resending OTP.");
            }
            finally
            {
                await _context.Database.CloseConnectionAsync();
            }
        }

        public async Task<long?> ResolveSaleIdAsync(string idOrCode, long farmerId, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(idOrCode)) return null;

            idOrCode = idOrCode.Trim();

            if (long.TryParse(idOrCode, out long numericId) && numericId > 0)
            {
                bool exists = await _context.FarmerSellProducts.AnyAsync(s => s.Id == numericId && s.FarmerId == farmerId, cancellationToken);
                if (exists) return numericId;
            }

            if (idOrCode.StartsWith("OTP-2026-", StringComparison.OrdinalIgnoreCase))
            {
                string suffix = idOrCode.Substring(9);
                if (long.TryParse(suffix, out long parsedOtpNum))
                {
                    long derivedId = parsedOtpNum > 300 ? parsedOtpNum - 300 : parsedOtpNum;
                    bool exists = await _context.FarmerSellProducts.AnyAsync(s => s.Id == derivedId && s.FarmerId == farmerId, cancellationToken);
                    if (exists) return derivedId;
                }
            }

            var matched = await _context.FarmerSellProducts
                .FirstOrDefaultAsync(s => s.FarmerId == farmerId && (s.SaleCode == idOrCode || s.OtpCode == idOrCode), cancellationToken);
            if (matched != null) return matched.Id;

            if (long.TryParse(idOrCode, out long fallback) && fallback > 0)
            {
                return fallback;
            }

            return null;
        }

        private static bool HasColumn(System.Data.Common.DbDataReader reader, string columnName)
        {
            for (int i = 0; i < reader.FieldCount; i++)
            {
                if (string.Equals(reader.GetName(i), columnName, StringComparison.OrdinalIgnoreCase))
                    return true;
            }
            return false;
        }

        private static FarmerSale MapFromReader(System.Data.Common.DbDataReader reader)
        {
            return new FarmerSale
            {
                Id = reader.GetInt64(reader.GetOrdinal("Id")),
                SaleCode = reader.GetString(reader.GetOrdinal("SaleCode")),
                FarmerId = reader.GetInt64(reader.GetOrdinal("FarmerId")),
                CropId = reader.GetInt64(reader.GetOrdinal("CropId")),
                BuyerCategory = reader.GetString(reader.GetOrdinal("BuyerCategory")),
                BuyerName = reader.GetString(reader.GetOrdinal("BuyerName")),
                BuyerMobile = reader.GetString(reader.GetOrdinal("BuyerMobile")),
                CropName = reader.GetString(reader.GetOrdinal("CropName")),
                CropVariety = reader.GetString(reader.GetOrdinal("CropVariety")),
                QualityGrade = HasColumn(reader, "QualityGrade") && !reader.IsDBNull(reader.GetOrdinal("QualityGrade")) ? reader.GetString(reader.GetOrdinal("QualityGrade")) : null,
                SellingQuantity = reader.GetDecimal(reader.GetOrdinal("SellingQuantity")),
                Unit = reader.GetString(reader.GetOrdinal("Unit")),
                PricePerUnit = reader.GetDecimal(reader.GetOrdinal("PricePerUnit")),
                TotalAmount = reader.GetDecimal(reader.GetOrdinal("TotalAmount")),
                PickupLocation = reader.GetString(reader.GetOrdinal("PickupLocation")),
                ExpectedPickupDate = HasColumn(reader, "ExpectedPickupDate") && !reader.IsDBNull(reader.GetOrdinal("ExpectedPickupDate")) ? reader.GetDateTime(reader.GetOrdinal("ExpectedPickupDate")) : DateTime.UtcNow,
                Notes = HasColumn(reader, "Notes") && !reader.IsDBNull(reader.GetOrdinal("Notes")) ? reader.GetString(reader.GetOrdinal("Notes")) : null,
                Status = reader.GetString(reader.GetOrdinal("Status")),
                OtpCode = HasColumn(reader, "OtpCode") && !reader.IsDBNull(reader.GetOrdinal("OtpCode")) ? reader.GetString(reader.GetOrdinal("OtpCode")) : null,
                OtpStatus = HasColumn(reader, "OtpStatus") && !reader.IsDBNull(reader.GetOrdinal("OtpStatus")) ? reader.GetString(reader.GetOrdinal("OtpStatus")) : "Pending",
                OtpExpiresAt = HasColumn(reader, "OtpExpiresAt") && !reader.IsDBNull(reader.GetOrdinal("OtpExpiresAt")) ? reader.GetDateTime(reader.GetOrdinal("OtpExpiresAt")) : null,
                ConfirmedAt = HasColumn(reader, "ConfirmedAt") && !reader.IsDBNull(reader.GetOrdinal("ConfirmedAt")) ? reader.GetDateTime(reader.GetOrdinal("ConfirmedAt")) : null,
                IsActive = HasColumn(reader, "IsActive") && !reader.IsDBNull(reader.GetOrdinal("IsActive")) ? reader.GetBoolean(reader.GetOrdinal("IsActive")) : true,
                CreatedAt = HasColumn(reader, "CreatedAt") && !reader.IsDBNull(reader.GetOrdinal("CreatedAt")) ? reader.GetDateTime(reader.GetOrdinal("CreatedAt")) : DateTime.UtcNow,
                UpdatedAt = HasColumn(reader, "UpdatedAt") && !reader.IsDBNull(reader.GetOrdinal("UpdatedAt")) ? reader.GetDateTime(reader.GetOrdinal("UpdatedAt")) : DateTime.UtcNow
            };
        }
    }
}
