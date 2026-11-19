using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriPurchaseBilling.Infrastructure.Repositories
{
    public class FarmerCropRepository : IFarmerCropRepository
    {
        private readonly AppDbContext _context;

        public FarmerCropRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Farmer?> GetFarmerByUserIdAsync(long userId, CancellationToken cancellationToken = default)
        {
            return await _context.Farmers
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.UserId == userId, cancellationToken);
        }

        public async Task<List<FarmerCrop>> GetCropsByFarmerIdAsync(
            long farmerId,
            string? category = null,
            string? season = null,
            string? search = null,
            CancellationToken cancellationToken = default)
        {
            var query = _context.Set<FarmerCrop>()
                .AsNoTracking()
                .Where(c => c.FarmerId == farmerId && c.IsActive);

            if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase) && !category.Equals("All Categories", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(c => c.CropCategory.ToLower() == category.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(season) && !season.Equals("All", StringComparison.OrdinalIgnoreCase) && !season.Equals("All Seasons", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(c => c.Season.ToLower() == season.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                string s = search.Trim().ToLower();
                query = query.Where(c => c.CropName.ToLower().Contains(s) || c.CropVariety.ToLower().Contains(s) || c.CropCode.ToLower().Contains(s));
            }

            return await query
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync(cancellationToken);
        }

        public async Task<FarmerCrop?> GetCropByIdAsync(
            long cropId,
            long farmerId,
            CancellationToken cancellationToken = default)
        {
            return await _context.Set<FarmerCrop>()
                .FirstOrDefaultAsync(c => c.Id == cropId && c.FarmerId == farmerId && c.IsActive, cancellationToken);
        }

        public async Task<FarmerCrop> AddCropAsync(
            FarmerCrop crop,
            CancellationToken cancellationToken = default)
        {
            await _context.Set<FarmerCrop>().AddAsync(crop, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return crop;
        }

        public async Task<bool> UpdateCropAsync(
            FarmerCrop crop,
            CancellationToken cancellationToken = default)
        {
            crop.UpdatedAt = DateTime.UtcNow;
            _context.Set<FarmerCrop>().Update(crop);
            return await _context.SaveChangesAsync(cancellationToken) > 0;
        }

        public async Task<bool> AddYieldStockAsync(
            long cropId,
            long farmerId,
            decimal additionalQuantity,
            CancellationToken cancellationToken = default)
        {
            var crop = await GetCropByIdAsync(cropId, farmerId, cancellationToken);
            if (crop == null) return false;

            decimal previousAvailable = crop.AvailableQuantity;
            decimal newAvailable = previousAvailable + additionalQuantity;

            crop.HarvestedQuantity += additionalQuantity;
            crop.AvailableQuantity = newAvailable;

            // Recalculate status if it was sold out or low stock
            if (crop.AvailableQuantity > 50)
            {
                crop.Status = "Ready to Sell";
            }

            crop.UpdatedAt = DateTime.UtcNow;

            var yieldLog = new FarmerCropYieldLog
            {
                FarmerCropId = crop.Id,
                AdditionalQuantity = additionalQuantity,
                PreviousAvailableQuantity = previousAvailable,
                NewAvailableQuantity = newAvailable,
                CreatedAt = DateTime.UtcNow
            };

            await _context.FarmerCropYieldLogs.AddAsync(yieldLog, cancellationToken);

            return await _context.SaveChangesAsync(cancellationToken) > 0;
        }

        public async Task<bool> SoftDeleteCropAsync(
            long cropId,
            long farmerId,
            CancellationToken cancellationToken = default)
        {
            var crop = await GetCropByIdAsync(cropId, farmerId, cancellationToken);
            if (crop == null) return false;

            crop.IsActive = false;
            crop.UpdatedAt = DateTime.UtcNow;
            return await _context.SaveChangesAsync(cancellationToken) > 0;
        }

        public async Task<string> GenerateNextCropCodeAsync(
            CancellationToken cancellationToken = default)
        {
            var count = await _context.Set<FarmerCrop>()
                .CountAsync(cancellationToken);

            return $"CROP-{(count + 1):D3}";
        }
    }
}
