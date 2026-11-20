using System;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;

namespace AgriPurchaseBilling.Application.Services
{
    public class FarmerSellProductService : IFarmerSellProductService
    {
        private readonly IFarmerSellProductRepository _sellRepository;

        public FarmerSellProductService(IFarmerSellProductRepository sellRepository)
        {
            _sellRepository = sellRepository;
        }

        public async Task<ApiResponse<SellProductOptionsDto>> GetSellOptionsAsync(long userId, CancellationToken cancellationToken = default)
        {
            var farmer = await _sellRepository.GetFarmerByUserIdAsync(userId, cancellationToken);
            if (farmer == null)
            {
                return ApiResponse<SellProductOptionsDto>.Fail("Farmer profile not found for this user.");
            }

            var crops = await _sellRepository.GetAvailableCropsForSaleAsync(farmer.Id, cancellationToken);

            var options = new SellProductOptionsDto
            {
                BuyerCategories = new()
                {
                    new OptionItemDto { Code = "Middleman", Label = "Middleman / Commission Agent" },
                    new OptionItemDto { Code = "Vendor", Label = "Vendor / Wholesale Trader" },
                    new OptionItemDto { Code = "Customer", Label = "Direct Retail Customer" }
                },
                AvailableCrops = crops
            };

            return ApiResponse<SellProductOptionsDto>.Ok(options, "Sell product options retrieved successfully.");
        }

        public async Task<ApiResponse<SellOrderResponseDto>> CreateSellOrderAsync(long userId, CreateSellOrderRequestDto request, CancellationToken cancellationToken = default)
        {
            var farmer = await _sellRepository.GetFarmerByUserIdAsync(userId, cancellationToken);
            if (farmer == null)
            {
                return ApiResponse<SellOrderResponseDto>.Fail("Farmer profile not found for this user.");
            }

            var crop = await _sellRepository.GetCropByIdAsync(request.CropId, farmer.Id, cancellationToken);
            if (crop == null)
            {
                return ApiResponse<SellOrderResponseDto>.Fail("Selected crop not found in your inventory.");
            }

            if (crop.AvailableQuantity < request.SellingQuantity)
            {
                return ApiResponse<SellOrderResponseDto>.Fail($"Selling quantity ({request.SellingQuantity} {crop.Unit}) exceeds available stock ({crop.AvailableQuantity} {crop.Unit}).");
            }

            // Generate Transaction ID: TXN-YYYY-XXXX (e.g., TXN-2026-0001)
            string prefix = $"TXN-{DateTime.UtcNow:yyyy}-";
            int countThisYear = await _sellRepository.GetCountThisMonthAsync(prefix, cancellationToken);
            string saleCode = $"{prefix}{(countThisYear + 1):D4}";

            // 6-digit cryptographically secure OTP
            string otp = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
            DateTime expiresAt = DateTime.UtcNow.AddMinutes(10);
            decimal totalAmount = request.SellingQuantity * request.PricePerUnit;

            var newSale = new FarmerSale
            {
                SaleCode = saleCode,
                FarmerId = farmer.Id,
                CropId = crop.Id,
                BuyerCategory = request.BuyerCategory,
                BuyerName = request.BuyerName.Trim(),
                BuyerMobile = request.BuyerMobile.Trim(),
                CropName = crop.CropName,
                CropVariety = crop.CropVariety,
                QualityGrade = !string.IsNullOrWhiteSpace(request.QualityGrade) ? request.QualityGrade.Trim() : crop.QualityGrade,
                SellingQuantity = request.SellingQuantity,
                Unit = !string.IsNullOrWhiteSpace(request.Unit) ? request.Unit.Trim() : crop.Unit,
                PricePerUnit = request.PricePerUnit,
                TotalAmount = totalAmount,
                PickupLocation = request.PickupLocation.Trim(),
                ExpectedPickupDate = request.ExpectedPickupDate,
                Notes = request.Notes?.Trim(),
                Status = "Pending OTP Confirmation",
                OtpCode = otp,
                OtpStatus = "Pending",
                OtpExpiresAt = expiresAt,
                IsActive = true
            };

            var createdSale = await _sellRepository.CreateSellOrderAsync(newSale, cancellationToken);

            var responseDto = MapToResponse(createdSale);
            var apiResp = ApiResponse<SellOrderResponseDto>.Ok(responseDto, "Sale order created successfully. Verification OTP generated.");
            apiResp.DevOtp = otp;

            return apiResp;
        }

        public async Task<ApiResponse<SellOrderResponseDto>> VerifySellOtpAsync(long userId, long saleId, VerifySellOtpRequestDto request, CancellationToken cancellationToken = default)
        {
            var farmer = await _sellRepository.GetFarmerByUserIdAsync(userId, cancellationToken);
            if (farmer == null)
            {
                return ApiResponse<SellOrderResponseDto>.Fail("Farmer profile not found for this user.");
            }

            var otpToVerify = request?.Otp?.Trim();
            if (string.IsNullOrWhiteSpace(otpToVerify) || otpToVerify.Equals("string", StringComparison.OrdinalIgnoreCase))
            {
                return ApiResponse<SellOrderResponseDto>.Fail("Please enter a valid 6-digit OTP code.");
            }

            try
            {
                var updatedSale = await _sellRepository.VerifySellOtpAndDeductStockAsync(saleId, farmer.Id, otpToVerify, cancellationToken);
                return ApiResponse<SellOrderResponseDto>.Ok(MapToResponse(updatedSale), "OTP verified successfully. Sale confirmed and crop stock deducted.");
            }
            catch (Exception ex)
            {
                return ApiResponse<SellOrderResponseDto>.Fail(ex.Message);
            }
        }

        public async Task<ApiResponse<SellOrderResponseDto>> VerifySellOtpAsync(long userId, string idOrCode, VerifySellOtpRequestDto request, CancellationToken cancellationToken = default)
        {
            var farmer = await _sellRepository.GetFarmerByUserIdAsync(userId, cancellationToken);
            if (farmer == null)
            {
                return ApiResponse<SellOrderResponseDto>.Fail("Farmer profile not found for this user.");
            }

            var saleId = await _sellRepository.ResolveSaleIdAsync(idOrCode, farmer.Id, cancellationToken);
            if (!saleId.HasValue || saleId.Value <= 0)
            {
                return ApiResponse<SellOrderResponseDto>.Fail($"Sale order or transaction '{idOrCode}' was not found.");
            }

            return await VerifySellOtpAsync(userId, saleId.Value, request, cancellationToken);
        }

        public async Task<ApiResponse<SellOrderResponseDto>> ResendSellOtpAsync(long userId, long saleId, CancellationToken cancellationToken = default)
        {
            var farmer = await _sellRepository.GetFarmerByUserIdAsync(userId, cancellationToken);
            if (farmer == null)
            {
                return ApiResponse<SellOrderResponseDto>.Fail("Farmer profile not found for this user.");
            }

            string newOtp = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
            DateTime expiresAt = DateTime.UtcNow.AddMinutes(10);

            try
            {
                var updatedSale = await _sellRepository.ResendSellOtpAsync(saleId, farmer.Id, newOtp, expiresAt, cancellationToken);
                var response = ApiResponse<SellOrderResponseDto>.Ok(MapToResponse(updatedSale), "New verification OTP has been generated successfully.");
                response.DevOtp = newOtp;
                return response;
            }
            catch (Exception ex)
            {
                return ApiResponse<SellOrderResponseDto>.Fail(ex.Message);
            }
        }

        public async Task<ApiResponse<SellOrderResponseDto>> ResendSellOtpAsync(long userId, string idOrCode, CancellationToken cancellationToken = default)
        {
            var farmer = await _sellRepository.GetFarmerByUserIdAsync(userId, cancellationToken);
            if (farmer == null)
            {
                return ApiResponse<SellOrderResponseDto>.Fail("Farmer profile not found for this user.");
            }

            var saleId = await _sellRepository.ResolveSaleIdAsync(idOrCode, farmer.Id, cancellationToken);
            if (!saleId.HasValue || saleId.Value <= 0)
            {
                return ApiResponse<SellOrderResponseDto>.Fail($"Sale order or transaction '{idOrCode}' was not found.");
            }

            return await ResendSellOtpAsync(userId, saleId.Value, cancellationToken);
        }

        private static SellOrderResponseDto MapToResponse(FarmerSale sale)
        {
            return new SellOrderResponseDto
            {
                Id = sale.Id,
                SaleCode = sale.SaleCode,
                FarmerId = sale.FarmerId,
                CropId = sale.CropId,
                BuyerCategory = sale.BuyerCategory,
                BuyerName = sale.BuyerName,
                BuyerMobile = sale.BuyerMobile,
                CropName = sale.CropName,
                CropVariety = sale.CropVariety,
                QualityGrade = sale.QualityGrade,
                SellingQuantity = sale.SellingQuantity,
                Unit = sale.Unit,
                PricePerUnit = sale.PricePerUnit,
                TotalAmount = sale.TotalAmount,
                PickupLocation = sale.PickupLocation,
                ExpectedPickupDate = sale.ExpectedPickupDate,
                Notes = sale.Notes,
                Status = sale.Status,
                OtpStatus = sale.OtpStatus,
                OtpCode = sale.OtpCode,
                DevOtp = sale.OtpCode,
                ConfirmedAt = sale.ConfirmedAt,
                CreatedAt = sale.CreatedAt
            };
        }
    }
}
