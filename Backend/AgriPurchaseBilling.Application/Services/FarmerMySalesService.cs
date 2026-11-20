using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;

namespace AgriPurchaseBilling.Application.Services
{
    public class FarmerMySalesService : IFarmerMySalesService
    {
        private readonly IFarmerMySalesRepository _mySalesRepository;

        public FarmerMySalesService(IFarmerMySalesRepository mySalesRepository)
        {
            _mySalesRepository = mySalesRepository;
        }

        public async Task<ApiResponse<FarmerMySalesSummaryDto>> GetMySalesSummaryAsync(long userId, CancellationToken cancellationToken = default)
        {
            var farmer = await _mySalesRepository.GetFarmerByUserIdAsync(userId, cancellationToken);
            if (farmer == null)
            {
                return ApiResponse<FarmerMySalesSummaryDto>.Fail("Farmer profile not found for this user.");
            }

            var summary = await _mySalesRepository.GetMySalesSummaryAsync(farmer.Id, cancellationToken);
            return ApiResponse<FarmerMySalesSummaryDto>.Ok(summary, "My Sales summary metrics retrieved successfully.");
        }

        public async Task<ApiResponse<List<MySalesListItemDto>>> GetMySalesListAsync(long userId, MySalesFilterQueryDto filters, CancellationToken cancellationToken = default)
        {
            var farmer = await _mySalesRepository.GetFarmerByUserIdAsync(userId, cancellationToken);
            if (farmer == null)
            {
                return ApiResponse<List<MySalesListItemDto>>.Fail("Farmer profile not found for this user.");
            }

            var list = await _mySalesRepository.GetMySalesListAsync(farmer.Id, filters, cancellationToken);
            return ApiResponse<List<MySalesListItemDto>>.Ok(list, "My Sales transactions retrieved successfully.");
        }

        public async Task<ApiResponse<MySalesListItemDto>> GetMySaleByIdAsync(long userId, long saleId, CancellationToken cancellationToken = default)
        {
            var farmer = await _mySalesRepository.GetFarmerByUserIdAsync(userId, cancellationToken);
            if (farmer == null)
            {
                return ApiResponse<MySalesListItemDto>.Fail("Farmer profile not found for this user.");
            }

            var sale = await _mySalesRepository.GetMySaleByIdAsync(saleId, farmer.Id, cancellationToken);
            if (sale == null)
            {
                return ApiResponse<MySalesListItemDto>.Fail("Sale order not found.");
            }

            var dto = new MySalesListItemDto
            {
                Id = sale.Id,
                TransactionId = sale.SaleCode,
                Date = sale.CreatedAt,
                BuyerName = sale.BuyerName,
                BuyerMobile = sale.BuyerMobile,
                BuyerCategory = sale.BuyerCategory,
                CropId = sale.CropId,
                CropName = sale.CropName,
                CropVariety = sale.CropVariety,
                QualityGrade = sale.QualityGrade,
                Quantity = sale.SellingQuantity,
                Unit = sale.Unit,
                Rate = sale.PricePerUnit,
                TotalAmount = sale.TotalAmount,
                ConfirmationStatus = sale.Status,
                OtpStatus = sale.OtpStatus ?? "Pending",
                ExpectedPaymentDate = sale.ExpectedPickupDate,
                PickupLocation = sale.PickupLocation,
                Notes = sale.Notes,
                ConfirmedAt = sale.ConfirmedAt
            };

            return ApiResponse<MySalesListItemDto>.Ok(dto, "Sale details retrieved successfully.");
        }
    }
}
