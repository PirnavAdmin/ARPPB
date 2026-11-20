using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;

namespace AgriPurchaseBilling.Application.Services
{
    public class FarmerOtpConfirmationService : IFarmerOtpConfirmationService
    {
        private readonly IFarmerOtpConfirmationRepository _otpRepo;
        private readonly IFarmerSellProductService _sellProductService;

        public FarmerOtpConfirmationService(
            IFarmerOtpConfirmationRepository otpRepo,
            IFarmerSellProductService sellProductService)
        {
            _otpRepo = otpRepo;
            _sellProductService = sellProductService;
        }

        public async Task<ApiResponse<FarmerOtpSummaryDto>> GetSummaryAsync(long userId, CancellationToken cancellationToken = default)
        {
            var farmer = await _otpRepo.GetFarmerByUserIdAsync(userId, cancellationToken);
            if (farmer == null)
            {
                return ApiResponse<FarmerOtpSummaryDto>.Fail("Farmer profile not found for this user.");
            }

            var summary = await _otpRepo.GetSummaryAsync(farmer.Id, cancellationToken);
            return ApiResponse<FarmerOtpSummaryDto>.Ok(summary, "OTP confirmations summary metrics retrieved successfully.");
        }

        public async Task<ApiResponse<List<FarmerOtpConfirmationItemDto>>> GetListAsync(long userId, FarmerOtpFilterQueryDto filters, CancellationToken cancellationToken = default)
        {
            var farmer = await _otpRepo.GetFarmerByUserIdAsync(userId, cancellationToken);
            if (farmer == null)
            {
                return ApiResponse<List<FarmerOtpConfirmationItemDto>>.Fail("Farmer profile not found for this user.");
            }

            var list = await _otpRepo.GetListAsync(farmer.Id, filters, cancellationToken);
            return ApiResponse<List<FarmerOtpConfirmationItemDto>>.Ok(list, "OTP confirmation authorizations retrieved successfully.");
        }

        public async Task<ApiResponse<FarmerOtpConfirmationItemDto>> GetDetailsAsync(long userId, long saleId, CancellationToken cancellationToken = default)
        {
            var farmer = await _otpRepo.GetFarmerByUserIdAsync(userId, cancellationToken);
            if (farmer == null)
            {
                return ApiResponse<FarmerOtpConfirmationItemDto>.Fail("Farmer profile not found for this user.");
            }

            var item = await _otpRepo.GetDetailsByIdAsync(saleId, farmer.Id, cancellationToken);
            if (item == null)
            {
                return ApiResponse<FarmerOtpConfirmationItemDto>.Fail("OTP confirmation record not found.");
            }

            return ApiResponse<FarmerOtpConfirmationItemDto>.Ok(item, "OTP confirmation details retrieved successfully.");
        }

        public async Task<ApiResponse<FarmerOtpConfirmationItemDto>> GetDetailsAsync(long userId, string idOrCode, CancellationToken cancellationToken = default)
        {
            var farmer = await _otpRepo.GetFarmerByUserIdAsync(userId, cancellationToken);
            if (farmer == null)
            {
                return ApiResponse<FarmerOtpConfirmationItemDto>.Fail("Farmer profile not found for this user.");
            }

            var saleId = await _otpRepo.ResolveSaleIdAsync(idOrCode, farmer.Id, cancellationToken);
            if (!saleId.HasValue || saleId.Value <= 0)
            {
                return ApiResponse<FarmerOtpConfirmationItemDto>.Fail($"OTP authorization record '{idOrCode}' was not found.");
            }

            return await GetDetailsAsync(userId, saleId.Value, cancellationToken);
        }

        public Task<ApiResponse<List<OptionItemDto>>> GetChannelsAsync(CancellationToken cancellationToken = default)
        {
            var channels = new List<OptionItemDto>
            {
                new OptionItemDto { Code = "All", Label = "All Buyer Channels" },
                new OptionItemDto { Code = "Vendor", Label = "Vendors Only" },
                new OptionItemDto { Code = "Middleman", Label = "Middlemen Only" },
                new OptionItemDto { Code = "Customer", Label = "Retail Customers" }
            };

            return Task.FromResult(ApiResponse<List<OptionItemDto>>.Ok(channels, "Buyer channels retrieved successfully."));
        }

        public async Task<ApiResponse<SellOrderResponseDto>> VerifyOtpAsync(long userId, long saleId, VerifySellOtpRequestDto request, CancellationToken cancellationToken = default)
        {
            return await _sellProductService.VerifySellOtpAsync(userId, saleId, request, cancellationToken);
        }

        public async Task<ApiResponse<SellOrderResponseDto>> VerifyOtpAsync(long userId, string idOrCode, VerifySellOtpRequestDto request, CancellationToken cancellationToken = default)
        {
            var farmer = await _otpRepo.GetFarmerByUserIdAsync(userId, cancellationToken);
            if (farmer == null)
            {
                return ApiResponse<SellOrderResponseDto>.Fail("Farmer profile not found for this user.");
            }

            var saleId = await _otpRepo.ResolveSaleIdAsync(idOrCode, farmer.Id, cancellationToken);
            if (!saleId.HasValue || saleId.Value <= 0)
            {
                return ApiResponse<SellOrderResponseDto>.Fail($"OTP authorization record '{idOrCode}' was not found.");
            }

            return await _sellProductService.VerifySellOtpAsync(userId, saleId.Value, request, cancellationToken);
        }

        public async Task<ApiResponse<SellOrderResponseDto>> ResendOtpAsync(long userId, long saleId, CancellationToken cancellationToken = default)
        {
            return await _sellProductService.ResendSellOtpAsync(userId, saleId, cancellationToken);
        }

        public async Task<ApiResponse<SellOrderResponseDto>> ResendOtpAsync(long userId, string idOrCode, CancellationToken cancellationToken = default)
        {
            var farmer = await _otpRepo.GetFarmerByUserIdAsync(userId, cancellationToken);
            if (farmer == null)
            {
                return ApiResponse<SellOrderResponseDto>.Fail("Farmer profile not found for this user.");
            }

            var saleId = await _otpRepo.ResolveSaleIdAsync(idOrCode, farmer.Id, cancellationToken);
            if (!saleId.HasValue || saleId.Value <= 0)
            {
                return ApiResponse<SellOrderResponseDto>.Fail($"OTP authorization record '{idOrCode}' was not found.");
            }

            return await _sellProductService.ResendSellOtpAsync(userId, saleId.Value, cancellationToken);
        }

        public async Task<ApiResponse<bool>> RejectAsync(long userId, long saleId, CancellationToken cancellationToken = default)
        {
            var farmer = await _otpRepo.GetFarmerByUserIdAsync(userId, cancellationToken);
            if (farmer == null)
            {
                return ApiResponse<bool>.Fail("Farmer profile not found for this user.");
            }

            bool success = await _otpRepo.RejectAsync(saleId, farmer.Id, "Declined by farmer", cancellationToken);
            if (!success)
            {
                return ApiResponse<bool>.Fail("Authorization record not found or could not be rejected.");
            }

            return ApiResponse<bool>.Ok(true, "Transaction authorization has been declined/rejected successfully.");
        }

        public async Task<ApiResponse<bool>> RejectAsync(long userId, string idOrCode, CancellationToken cancellationToken = default)
        {
            var farmer = await _otpRepo.GetFarmerByUserIdAsync(userId, cancellationToken);
            if (farmer == null)
            {
                return ApiResponse<bool>.Fail("Farmer profile not found for this user.");
            }

            var saleId = await _otpRepo.ResolveSaleIdAsync(idOrCode, farmer.Id, cancellationToken);
            if (!saleId.HasValue || saleId.Value <= 0)
            {
                return ApiResponse<bool>.Fail($"OTP authorization record '{idOrCode}' was not found.");
            }

            return await RejectAsync(userId, saleId.Value, cancellationToken);
        }
    }
}
