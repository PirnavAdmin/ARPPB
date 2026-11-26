using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Domain.Entities;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IFarmerSellProductRepository
    {
        Task<Farmer?> GetFarmerByUserIdAsync(long userId, CancellationToken cancellationToken = default);
        Task<FarmerCrop?> GetCropByIdAsync(long cropId, long farmerId, CancellationToken cancellationToken = default);
        Task<int> GetCountThisMonthAsync(string prefix, CancellationToken cancellationToken = default);
        Task<List<AvailableCropForSaleDto>> GetAvailableCropsForSaleAsync(long farmerId, CancellationToken cancellationToken = default);
        Task<FarmerSale> CreateSellOrderAsync(FarmerSale sale, CancellationToken cancellationToken = default);
        Task<FarmerSale> VerifySellOtpAndDeductStockAsync(long saleId, long farmerId, string otpCode, CancellationToken cancellationToken = default);
        Task<FarmerSale> ResendSellOtpAsync(long saleId, long farmerId, string newOtp, DateTime expiresAt, CancellationToken cancellationToken = default);
        Task<long?> ResolveSaleIdAsync(string idOrCode, long farmerId, CancellationToken cancellationToken = default);
    }
}
