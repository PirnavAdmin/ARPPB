using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs.VendorOperations;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities.VendorOperations;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriPurchaseBilling.Infrastructure.Services
{
    public class VendorInventoryProcessingService : IVendorInventoryProcessingService
    {
        private readonly VendorOperationsDbContext _context;

        public VendorInventoryProcessingService(VendorOperationsDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // 1. RAW MATERIAL INVENTORY
        // ==========================================

        public async Task<VendorRawMaterialOverviewDto> GetRawMaterialOverviewAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var stocks = await _context.RawMaterialStocks.AsNoTracking()
                .Where(s => s.VendorId == vendorId)
                .ToListAsync(cancellationToken);

            var totalStockQty = stocks.Sum(s => s.PurchasedQuantity);
            var availQty = stocks.Sum(s => s.AvailableQuantity);
            var processedQty = stocks.Sum(s => s.ProcessedQuantity);
            var valuation = stocks.Sum(s => s.AvailableQuantity * s.AverageCost);

            var lowStockItems = stocks
                .Where(s => s.AvailableQuantity <= s.MinThresholdQuantity || string.Equals(s.Status, "Low Stock", StringComparison.OrdinalIgnoreCase))
                .Select(s => new LowStockAlertDto
                {
                    StockId = s.StockCode,
                    CropName = s.CropName,
                    BatchNumber = s.BatchNumber,
                    QuantityLeft = s.AvailableQuantity,
                    Unit = s.Unit
                }).ToList();

            return new VendorRawMaterialOverviewDto
            {
                TotalStockQuantity = totalStockQty,
                StockUnit = "Qtl",
                TotalTraceableBatches = stocks.Count,
                AvailableQuantity = availQty,
                ValuationAmount = valuation,
                ProcessedQuantity = processedQty,
                LowStockItemsCount = lowStockItems.Count,
                LowStockAlerts = lowStockItems
            };
        }

        public async Task<List<VendorRawMaterialStockDto>> GetRawMaterialStocksAsync(
            long vendorId, string? search, string? crop, string? supplierType, string? grade, string? stockStatus, CancellationToken cancellationToken = default)
        {
            var query = _context.RawMaterialStocks.AsNoTracking()
                .Where(s => s.VendorId == vendorId)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(crop) && !crop.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(s => s.CropName.ToLower() == crop.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(supplierType) && !supplierType.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(s => s.SupplierCategory.ToLower() == supplierType.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(grade) && !grade.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(s => s.QualityGrade.ToLower().Contains(grade.ToLower()));
            }

            if (!string.IsNullOrWhiteSpace(stockStatus) && !stockStatus.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(s => s.Status.ToLower() == stockStatus.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(s =>
                    s.StockCode.ToLower().Contains(term) ||
                    s.CropName.ToLower().Contains(term) ||
                    s.CropVariety.ToLower().Contains(term) ||
                    s.BatchNumber.ToLower().Contains(term) ||
                    s.SupplierName.ToLower().Contains(term) ||
                    s.PurchaseId.ToLower().Contains(term));
            }

            var list = await query.OrderByDescending(s => s.PurchaseDate).ToListAsync(cancellationToken);

            return list.Select(s => new VendorRawMaterialStockDto
            {
                Id = s.Id,
                StockId = s.StockCode,
                CropName = s.CropName,
                CropVariety = s.CropVariety,
                SupplierName = s.SupplierName,
                SupplierCategory = s.SupplierCategory,
                PurchaseId = s.PurchaseId,
                BatchNumber = s.BatchNumber,
                PurchaseDate = s.PurchaseDate,
                PurchasedQuantity = s.PurchasedQuantity,
                ProcessedQuantity = s.ProcessedQuantity,
                AvailableQuantity = s.AvailableQuantity,
                Unit = s.Unit,
                AverageCost = s.AverageCost,
                QualityGrade = s.QualityGrade,
                Status = s.Status
            }).ToList();
        }

        public async Task<VendorRawMaterialStockDto?> GetRawMaterialStockByIdAsync(long vendorId, string stockCodeOrId, CancellationToken cancellationToken = default)
        {
            var query = _context.RawMaterialStocks.AsNoTracking()
                .Where(s => s.VendorId == vendorId)
                .AsQueryable();

            if (long.TryParse(stockCodeOrId, out var id))
            {
                query = query.Where(s => s.Id == id || s.StockCode == stockCodeOrId);
            }
            else
            {
                query = query.Where(s => s.StockCode == stockCodeOrId);
            }

            var s = await query.FirstOrDefaultAsync(cancellationToken);
            if (s == null) return null;

            return new VendorRawMaterialStockDto
            {
                Id = s.Id,
                StockId = s.StockCode,
                CropName = s.CropName,
                CropVariety = s.CropVariety,
                SupplierName = s.SupplierName,
                SupplierCategory = s.SupplierCategory,
                PurchaseId = s.PurchaseId,
                BatchNumber = s.BatchNumber,
                PurchaseDate = s.PurchaseDate,
                PurchasedQuantity = s.PurchasedQuantity,
                ProcessedQuantity = s.ProcessedQuantity,
                AvailableQuantity = s.AvailableQuantity,
                Unit = s.Unit,
                AverageCost = s.AverageCost,
                QualityGrade = s.QualityGrade,
                Status = s.Status
            };
        }

        public async Task<List<VendorStockMovementDto>> GetStockMovementsAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            return await _context.StockMovements.AsNoTracking()
                .Include(m => m.Stock)
                .Where(m => m.Stock != null && m.Stock.VendorId == vendorId)
                .OrderByDescending(m => m.MovementDate)
                .Select(m => new VendorStockMovementDto
                {
                    Id = m.Id,
                    MovementId = m.MovementCode,
                    MovementDate = m.MovementDate,
                    BatchNumber = m.BatchNumber,
                    CropName = m.CropName,
                    MovementType = m.MovementType,
                    ReferenceId = m.ReferenceId,
                    QuantityChange = m.QuantityChange,
                    Unit = m.Unit,
                    BalanceAfter = m.BalanceAfter,
                    Remarks = m.Remarks
                }).ToListAsync(cancellationToken);
        }

        public async Task<byte[]> ExportRawMaterialsCsvAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var stocks = await GetRawMaterialStocksAsync(vendorId, null, null, null, null, null, cancellationToken);
            var sb = new StringBuilder();
            sb.AppendLine("Stock ID,Crop Name,Variety,Supplier,Category,Purchase ID,Batch Number,Purchase Date,Purchased Qty,Processed Qty,Available Qty,Unit,Average Cost,Grade,Status");

            foreach (var s in stocks)
            {
                sb.AppendLine($"\"{s.StockId}\",\"{s.CropName}\",\"{s.CropVariety}\",\"{s.SupplierName}\",\"{s.SupplierCategory}\",\"{s.PurchaseId}\",\"{s.BatchNumber}\",\"{s.PurchaseDate:yyyy-MM-dd}\",{s.PurchasedQuantity},{s.ProcessedQuantity},{s.AvailableQuantity},\"{s.Unit}\",{s.AverageCost},\"{s.QualityGrade}\",\"{s.Status}\"");
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }

        // ==========================================
        // 2. PRODUCT PROCESSING MANAGEMENT
        // ==========================================

        public async Task<VendorProcessingOverviewDto> GetProcessingOverviewAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var batches = await _context.ProcessingBatches.AsNoTracking()
                .Where(b => b.VendorId == vendorId)
                .Include(b => b.Outputs)
                .ToListAsync(cancellationToken);

            var totalInput = batches.Sum(b => b.InputQuantity);
            var totalOutput = batches.SelectMany(b => b.Outputs).Sum(o => o.OutputQuantity);
            var totalWastage = batches.Sum(b => b.WastageQuantity);
            var totalExpenses = batches.Sum(b => b.ProcessingExpenses);

            return new VendorProcessingOverviewDto
            {
                TotalBatches = batches.Count,
                DraftProcessingCount = batches.Count(b => string.Equals(b.Status, "Draft", StringComparison.OrdinalIgnoreCase)),
                CompletedBatchesCount = batches.Count(b => string.Equals(b.Status, "Completed", StringComparison.OrdinalIgnoreCase)),
                TotalInputQuantity = totalInput,
                InputUnit = "Qtl",
                TotalOutputQuantity = totalOutput,
                TotalWastageQuantity = totalWastage,
                WastageUnit = "Qtl",
                TotalProcessingExpenses = totalExpenses
            };
        }

        public async Task<List<VendorProcessingBatchDto>> GetProcessingBatchesAsync(
            long vendorId, string? search, string? rawMaterial, string? status, CancellationToken cancellationToken = default)
        {
            var query = _context.ProcessingBatches.AsNoTracking()
                .Where(b => b.VendorId == vendorId)
                .Include(b => b.Outputs)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(rawMaterial) && !rawMaterial.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(b => b.RawMaterialName.ToLower() == rawMaterial.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(b => b.Status.ToLower() == status.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(b =>
                    b.ProcessingCode.ToLower().Contains(term) ||
                    b.BatchNumber.ToLower().Contains(term) ||
                    b.RawMaterialName.ToLower().Contains(term) ||
                    b.Outputs.Any(o => o.OutputProductName.ToLower().Contains(term)));
            }

            var list = await query.OrderByDescending(b => b.ProcessingDate).ToListAsync(cancellationToken);

            return list.Select(b =>
            {
                var outputsSummary = string.Join(", ", b.Outputs.Select(o => $"{o.OutputProductName} ({o.OutputQuantity} {o.Unit})"));
                return new VendorProcessingBatchDto
                {
                    Id = b.Id,
                    ProcessingId = b.ProcessingCode,
                    ProcessingDate = b.ProcessingDate,
                    RawMaterialAndBatch = $"{b.RawMaterialName} - {b.BatchNumber}",
                    RawMaterialName = b.RawMaterialName,
                    SourceStockId = b.SourceStockId,
                    InputQuantity = b.InputQuantity,
                    InputUnit = b.Unit,
                    FinishedOutputsSummary = outputsSummary,
                    WastageQuantity = b.WastageQuantity,
                    WastagePercentage = b.WastagePercentage,
                    ProcessingExpenses = b.ProcessingExpenses,
                    TotalBatchCost = b.TotalBatchCost,
                    UnitCost = b.UnitCost,
                    UnitCostLabel = b.UnitCostLabel,
                    Status = b.Status,
                    Notes = b.Notes,
                    Outputs = b.Outputs.Select(o => new VendorProcessingOutputDto
                    {
                        Id = o.Id,
                        OutputProductName = o.OutputProductName,
                        OutputQuantity = o.OutputQuantity,
                        Unit = o.Unit,
                        OutputType = o.OutputType
                    }).ToList()
                };
            }).ToList();
        }

        public async Task<VendorProcessingBatchDto?> GetProcessingBatchByIdAsync(long vendorId, string processingCodeOrId, CancellationToken cancellationToken = default)
        {
            var query = _context.ProcessingBatches.AsNoTracking()
                .Where(b => b.VendorId == vendorId)
                .Include(b => b.Outputs)
                .AsQueryable();

            if (long.TryParse(processingCodeOrId, out var id))
            {
                query = query.Where(b => b.Id == id || b.ProcessingCode == processingCodeOrId);
            }
            else
            {
                query = query.Where(b => b.ProcessingCode == processingCodeOrId);
            }

            var b = await query.FirstOrDefaultAsync(cancellationToken);
            if (b == null) return null;

            var outputsSummary = string.Join(", ", b.Outputs.Select(o => $"{o.OutputProductName} ({o.OutputQuantity} {o.Unit})"));

            return new VendorProcessingBatchDto
            {
                Id = b.Id,
                ProcessingId = b.ProcessingCode,
                ProcessingDate = b.ProcessingDate,
                RawMaterialAndBatch = $"{b.RawMaterialName} - {b.BatchNumber}",
                RawMaterialName = b.RawMaterialName,
                SourceStockId = b.SourceStockId,
                InputQuantity = b.InputQuantity,
                InputUnit = b.Unit,
                FinishedOutputsSummary = outputsSummary,
                WastageQuantity = b.WastageQuantity,
                WastagePercentage = b.WastagePercentage,
                ProcessingExpenses = b.ProcessingExpenses,
                TotalBatchCost = b.TotalBatchCost,
                UnitCost = b.UnitCost,
                UnitCostLabel = b.UnitCostLabel,
                Status = b.Status,
                Notes = b.Notes,
                Outputs = b.Outputs.Select(o => new VendorProcessingOutputDto
                {
                    Id = o.Id,
                    OutputProductName = o.OutputProductName,
                    OutputQuantity = o.OutputQuantity,
                    Unit = o.Unit,
                    OutputType = o.OutputType
                }).ToList()
            };
        }

        public async Task<VendorProcessingBatchDto> CreateProcessingBatchAsync(long vendorId, CreateProcessingBatchRequest request, CancellationToken cancellationToken = default)
        {
            var count = await _context.ProcessingBatches.CountAsync(b => b.VendorId == vendorId, cancellationToken);
            var processingCode = $"PROC-{(count + 1):D4}";
            var batchNumber = $"PRC-{request.RawMaterialName.Substring(0, Math.Min(3, request.RawMaterialName.Length)).ToUpper()}-2026-{(count + 1):D3}";

            // Find stock to deduct
            var stock = await _context.RawMaterialStocks
                .FirstOrDefaultAsync(s => s.VendorId == vendorId && (s.StockCode == request.SourceStockId || s.BatchNumber == request.SourceStockId), cancellationToken);

            decimal rawMaterialCost = 0;
            if (stock != null)
            {
                rawMaterialCost = request.InputQuantity * stock.AverageCost;
                stock.ProcessedQuantity += request.InputQuantity;
                stock.AvailableQuantity = Math.Max(0, stock.AvailableQuantity - request.InputQuantity);
                if (stock.AvailableQuantity <= stock.MinThresholdQuantity)
                {
                    stock.Status = stock.AvailableQuantity == 0 ? "Depleted" : "Low Stock";
                }
            }

            var totalOutputQty = request.Outputs.Sum(o => o.OutputQuantity);
            var wastageQty = Math.Max(0, request.InputQuantity - totalOutputQty);
            var wastagePct = request.InputQuantity > 0 ? (wastageQty / request.InputQuantity) * 100 : 0;
            var totalBatchCost = rawMaterialCost + request.ProcessingExpenses;
            var unitCost = totalOutputQty > 0 ? totalBatchCost / totalOutputQty : 0;

            var batch = new VendorProcessingBatch
            {
                VendorId = vendorId,
                ProcessingCode = processingCode,
                BatchNumber = batchNumber,
                RawMaterialName = request.RawMaterialName.Trim(),
                SourceStockId = request.SourceStockId.Trim(),
                InputQuantity = request.InputQuantity,
                Unit = request.Unit,
                WastageQuantity = wastageQty,
                WastagePercentage = Math.Round(wastagePct, 2),
                ProcessingExpenses = request.ProcessingExpenses,
                TotalBatchCost = totalBatchCost,
                UnitCost = Math.Round(unitCost, 2),
                UnitCostLabel = $"₹/{request.Unit}",
                Status = "Completed",
                ProcessingDate = DateTime.UtcNow,
                Notes = request.Notes?.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            foreach (var o in request.Outputs)
            {
                batch.Outputs.Add(new VendorProcessingOutput
                {
                    OutputProductName = o.OutputProductName.Trim(),
                    OutputQuantity = o.OutputQuantity,
                    Unit = o.Unit,
                    OutputType = o.OutputType
                });
            }

            _context.ProcessingBatches.Add(batch);

            // Log stock movement deduction
            if (stock != null)
            {
                var movCount = await _context.StockMovements.CountAsync(cancellationToken);
                _context.StockMovements.Add(new VendorStockMovement
                {
                    StockId = stock.Id,
                    MovementCode = $"MOV-{(movCount + 1):D4}",
                    MovementDate = DateTime.UtcNow,
                    BatchNumber = $"{stock.BatchNumber} / {stock.StockCode}",
                    CropName = stock.CropName,
                    MovementType = "Processing Issue",
                    ReferenceId = processingCode,
                    QuantityChange = -request.InputQuantity,
                    Unit = request.Unit,
                    BalanceAfter = stock.AvailableQuantity,
                    Remarks = $"Issued {request.InputQuantity} {request.Unit} to Processing Batch {processingCode} ({batchNumber})"
                });
            }

            await _context.SaveChangesAsync(cancellationToken);

            return (await GetProcessingBatchByIdAsync(vendorId, processingCode, cancellationToken))!;
        }

        public async Task<byte[]> ExportProcessingBatchesCsvAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var batches = await GetProcessingBatchesAsync(vendorId, null, null, null, cancellationToken);
            var sb = new StringBuilder();
            sb.AppendLine("Processing ID,Date,Raw Material & Batch,Input Quantity,Finished Outputs,Wastage Qty,Wastage %,Expenses,Total Cost,Unit Cost,Status");

            foreach (var b in batches)
            {
                sb.AppendLine($"\"{b.ProcessingId}\",\"{b.ProcessingDate:yyyy-MM-dd}\",\"{b.RawMaterialAndBatch}\",{b.InputQuantity} {b.InputUnit},\"{b.FinishedOutputsSummary}\",{b.WastageQuantity} {b.InputUnit},{b.WastagePercentage}%,{b.ProcessingExpenses},{b.TotalBatchCost},{b.UnitCost},\"{b.Status}\"");
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }

        // ==========================================
        // 3. FINISHED PRODUCTS INVENTORY
        // ==========================================

        public async Task<VendorFinishedProductsOverviewDto> GetFinishedProductsOverviewAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var products = await _context.FinishedProducts.AsNoTracking()
                .Where(p => p.VendorId == vendorId)
                .ToListAsync(cancellationToken);

            var batchesCount = await _context.ProcessingBatches.CountAsync(b => b.VendorId == vendorId, cancellationToken);
            var finishedStock = products.Sum(p => p.AvailableQuantity);
            var soldQty = products.Sum(p => p.SoldQuantity);
            var lowStockCount = products.Count(p => p.AvailableQuantity <= p.MinThresholdQuantity);

            return new VendorFinishedProductsOverviewDto
            {
                TotalProductTypes = products.Count,
                ActiveBatchesCount = batchesCount,
                TotalFinishedStock = finishedStock,
                TotalSoldQuantity = soldQty,
                LowStockProductsCount = lowStockCount
            };
        }

        public async Task<List<VendorFinishedProductDto>> GetFinishedProductsAsync(
            long vendorId, string? search, string? category, string? sourceRawMaterial, string? status, CancellationToken cancellationToken = default)
        {
            var query = _context.FinishedProducts.AsNoTracking()
                .Where(p => p.VendorId == vendorId)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Category.ToLower() == category.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(sourceRawMaterial) && !sourceRawMaterial.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.SourceRawMaterial.ToLower() == sourceRawMaterial.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Status.ToLower() == status.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(p =>
                    p.ProductCode.ToLower().Contains(term) ||
                    p.ProductName.ToLower().Contains(term) ||
                    p.BrandName.ToLower().Contains(term) ||
                    p.Category.ToLower().Contains(term));
            }

            var list = await query.OrderBy(p => p.ProductCode).ToListAsync(cancellationToken);

            return list.Select(p => new VendorFinishedProductDto
            {
                Id = p.Id,
                ProductId = p.ProductCode,
                ProductName = p.ProductName,
                Category = p.Category,
                SourceRawMaterial = p.SourceRawMaterial,
                BrandName = p.BrandName,
                Packaging = p.Packaging,
                AvailableQuantity = p.AvailableQuantity,
                SoldQuantity = p.SoldQuantity,
                Unit = p.Unit,
                MfgDate = p.MfgDate,
                ExpiryDate = p.ExpiryDate,
                ProductionCost = p.ProductionCost,
                SellingPrice = p.SellingPrice,
                ProfitMarginPercentage = p.ProfitMarginPercentage,
                Status = p.Status,
                IsLowStock = p.AvailableQuantity <= p.MinThresholdQuantity,
                ImageUrl = p.ImageUrl
            }).ToList();
        }

        public async Task<VendorFinishedProductDto?> GetFinishedProductByIdAsync(long vendorId, string productCodeOrId, CancellationToken cancellationToken = default)
        {
            var query = _context.FinishedProducts.AsNoTracking()
                .Where(p => p.VendorId == vendorId)
                .AsQueryable();

            if (long.TryParse(productCodeOrId, out var id))
            {
                query = query.Where(p => p.Id == id || p.ProductCode == productCodeOrId);
            }
            else
            {
                query = query.Where(p => p.ProductCode == productCodeOrId);
            }

            var p = await query.FirstOrDefaultAsync(cancellationToken);
            if (p == null) return null;

            return new VendorFinishedProductDto
            {
                Id = p.Id,
                ProductId = p.ProductCode,
                ProductName = p.ProductName,
                Category = p.Category,
                SourceRawMaterial = p.SourceRawMaterial,
                BrandName = p.BrandName,
                Packaging = p.Packaging,
                AvailableQuantity = p.AvailableQuantity,
                SoldQuantity = p.SoldQuantity,
                Unit = p.Unit,
                MfgDate = p.MfgDate,
                ExpiryDate = p.ExpiryDate,
                ProductionCost = p.ProductionCost,
                SellingPrice = p.SellingPrice,
                ProfitMarginPercentage = p.ProfitMarginPercentage,
                Status = p.Status,
                IsLowStock = p.AvailableQuantity <= p.MinThresholdQuantity,
                ImageUrl = p.ImageUrl
            };
        }

        public async Task<VendorFinishedProductDto> CreateFinishedProductAsync(long vendorId, CreateFinishedProductRequest request, CancellationToken cancellationToken = default)
        {
            var count = await _context.FinishedProducts.CountAsync(p => p.VendorId == vendorId, cancellationToken);
            var productCode = $"PROD-{(count + 1):D4}";

            var margin = request.SellingPrice > 0
                ? Math.Round(((request.SellingPrice - request.ProductionCost) / request.SellingPrice) * 100, 2)
                : 0;

            var product = new VendorFinishedProduct
            {
                VendorId = vendorId,
                ProductCode = productCode,
                ProductName = request.ProductName.Trim(),
                Category = request.Category.Trim(),
                SourceRawMaterial = request.SourceRawMaterial.Trim(),
                BrandName = request.BrandName.Trim(),
                Packaging = request.Packaging.Trim(),
                AvailableQuantity = request.InitialQuantity,
                SoldQuantity = 0,
                Unit = request.Unit,
                MfgDate = request.MfgDate,
                ExpiryDate = request.ExpiryDate,
                ProductionCost = request.ProductionCost,
                SellingPrice = request.SellingPrice,
                ProfitMarginPercentage = margin,
                MinThresholdQuantity = request.MinThresholdQuantity,
                Status = "Active",
                ImageUrl = request.ImageUrl,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            if (request.InitialQuantity > 0)
            {
                product.Movements.Add(new VendorFinishedProductMovement
                {
                    MovementCode = $"FMOV-{(count + 1):D4}",
                    MovementType = "Initial Stock Inward",
                    ReferenceId = "INIT-SETUP",
                    QuantityChange = request.InitialQuantity,
                    Unit = request.Unit,
                    BalanceAfter = request.InitialQuantity,
                    MovementDate = DateTime.UtcNow,
                    Remarks = "Initial SKU stock registration",
                    CreatedAt = DateTime.UtcNow
                });
            }

            _context.FinishedProducts.Add(product);
            await _context.SaveChangesAsync(cancellationToken);

            return (await GetFinishedProductByIdAsync(vendorId, productCode, cancellationToken))!;
        }

        public async Task<VendorFinishedProductDto?> UpdateFinishedProductAsync(long vendorId, string productCodeOrId, UpdateFinishedProductRequest request, CancellationToken cancellationToken = default)
        {
            var product = await FindFinishedProductEntityAsync(vendorId, productCodeOrId, cancellationToken);
            if (product == null) return null;

            var margin = request.SellingPrice > 0
                ? Math.Round(((request.SellingPrice - request.ProductionCost) / request.SellingPrice) * 100, 2)
                : 0;

            product.ProductName = request.ProductName.Trim();
            product.Category = request.Category.Trim();
            product.SourceRawMaterial = request.SourceRawMaterial.Trim();
            product.BrandName = request.BrandName.Trim();
            product.Packaging = request.Packaging.Trim();
            product.MfgDate = request.MfgDate;
            product.ExpiryDate = request.ExpiryDate;
            product.ProductionCost = request.ProductionCost;
            product.SellingPrice = request.SellingPrice;
            product.ProfitMarginPercentage = margin;
            product.MinThresholdQuantity = request.MinThresholdQuantity;
            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                product.Status = request.Status.Trim();
            }
            if (!string.IsNullOrWhiteSpace(request.ImageUrl))
            {
                product.ImageUrl = request.ImageUrl.Trim();
            }
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            return await GetFinishedProductByIdAsync(vendorId, product.ProductCode, cancellationToken);
        }

        public async Task<bool> AdjustFinishedProductStockAsync(long vendorId, string productCodeOrId, AdjustFinishedProductStockRequest request, CancellationToken cancellationToken = default)
        {
            var product = await FindFinishedProductEntityAsync(vendorId, productCodeOrId, cancellationToken);
            if (product == null) return false;

            product.AvailableQuantity += request.QuantityAdjustment;
            if (product.AvailableQuantity < 0) product.AvailableQuantity = 0;
            product.UpdatedAt = DateTime.UtcNow;

            var movCount = await _context.FinishedProductMovements.CountAsync(cancellationToken);
            _context.FinishedProductMovements.Add(new VendorFinishedProductMovement
            {
                FinishedProductId = product.Id,
                MovementCode = $"FMOV-{(movCount + 1):D4}",
                MovementType = request.QuantityAdjustment >= 0 ? "Stock Adjustment Inward" : "Stock Adjustment Deduction",
                ReferenceId = request.ReferenceId ?? "MANUAL-ADJ",
                QuantityChange = request.QuantityAdjustment,
                Unit = product.Unit,
                BalanceAfter = product.AvailableQuantity,
                MovementDate = DateTime.UtcNow,
                Remarks = request.Reason.Trim(),
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<List<VendorFinishedProductMovementDto>> GetFinishedProductMovementsAsync(long vendorId, string productCodeOrId, CancellationToken cancellationToken = default)
        {
            var product = await FindFinishedProductEntityAsync(vendorId, productCodeOrId, cancellationToken);
            if (product == null) return new List<VendorFinishedProductMovementDto>();

            return await _context.FinishedProductMovements.AsNoTracking()
                .Where(m => m.FinishedProductId == product.Id)
                .OrderByDescending(m => m.MovementDate)
                .Select(m => new VendorFinishedProductMovementDto
                {
                    Id = m.Id,
                    MovementCode = m.MovementCode,
                    MovementType = m.MovementType,
                    ReferenceId = m.ReferenceId,
                    QuantityChange = m.QuantityChange,
                    Unit = m.Unit,
                    BalanceAfter = m.BalanceAfter,
                    MovementDate = m.MovementDate,
                    Remarks = m.Remarks
                }).ToListAsync(cancellationToken);
        }

        public async Task<bool> ToggleFinishedProductStatusAsync(long vendorId, string productCodeOrId, CancellationToken cancellationToken = default)
        {
            var product = await FindFinishedProductEntityAsync(vendorId, productCodeOrId, cancellationToken);
            if (product == null) return false;

            product.Status = string.Equals(product.Status, "Active", StringComparison.OrdinalIgnoreCase) ? "Inactive" : "Active";
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<byte[]> ExportFinishedProductsCsvAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var products = await GetFinishedProductsAsync(vendorId, null, null, null, null, cancellationToken);
            var sb = new StringBuilder();
            sb.AppendLine("Product ID,Product Name,Category,Raw Material,Brand,Packaging,Available Qty,Sold Qty,Unit,Mfg Date,Expiry Date,Cost,Price,Margin,Status");

            foreach (var p in products)
            {
                sb.AppendLine($"\"{p.ProductId}\",\"{p.ProductName}\",\"{p.Category}\",\"{p.SourceRawMaterial}\",\"{p.BrandName}\",\"{p.Packaging}\",{p.AvailableQuantity},{p.SoldQuantity},\"{p.Unit}\",\"{p.MfgDate:yyyy-MM-dd}\",\"{p.ExpiryDate:yyyy-MM-dd}\",{p.ProductionCost},{p.SellingPrice},{p.ProfitMarginPercentage}%,\"{p.Status}\"");
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }

        private async Task<VendorFinishedProduct?> FindFinishedProductEntityAsync(long vendorId, string productCodeOrId, CancellationToken cancellationToken)
        {
            if (long.TryParse(productCodeOrId, out var id))
            {
                return await _context.FinishedProducts.FirstOrDefaultAsync(p => p.VendorId == vendorId && (p.Id == id || p.ProductCode == productCodeOrId), cancellationToken);
            }
            return await _context.FinishedProducts.FirstOrDefaultAsync(p => p.VendorId == vendorId && p.ProductCode == productCodeOrId, cancellationToken);
        }
    }
}
