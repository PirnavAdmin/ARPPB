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
    public class VendorInventoryProcessingService : IVendorInventoryProcessingService
    {
        private readonly VendorOperationsDbContext _context;

        public VendorInventoryProcessingService(VendorOperationsDbContext context)
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
        // 1. RAW MATERIAL INVENTORY
        // ==========================================

        public async Task<VendorRawMaterialOverviewDto> GetRawMaterialOverviewAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var dto = new VendorRawMaterialOverviewDto { StockUnit = "Qtl" };
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_Vendor_GetRawMaterialOverview(@p_vendor_id);";
            AddParam(cmd, "@p_vendor_id", vendorId);

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                dto.TotalStockQuantity = SafeDecimal(reader["TotalStockQuantity"]);
                dto.StockUnit = SafeString(reader["StockUnit"]);
                dto.TotalTraceableBatches = SafeInt(reader["TotalTraceableBatches"]);
                dto.AvailableQuantity = SafeDecimal(reader["AvailableQuantity"]);
                dto.ValuationAmount = SafeDecimal(reader["ValuationAmount"]);
                dto.ProcessedQuantity = SafeDecimal(reader["ProcessedQuantity"]);
                dto.LowStockItemsCount = SafeInt(reader["LowStockItemsCount"]);
            }

            if (await reader.NextResultAsync(cancellationToken))
            {
                while (await reader.ReadAsync(cancellationToken))
                {
                    dto.LowStockAlerts.Add(new LowStockAlertDto
                    {
                        StockId = SafeString(reader["StockId"]),
                        CropName = SafeString(reader["CropName"]),
                        BatchNumber = SafeString(reader["BatchNumber"]),
                        QuantityLeft = SafeDecimal(reader["QuantityLeft"]),
                        Unit = SafeString(reader["Unit"])
                    });
                }
            }

            return dto;
        }

        public async Task<List<VendorRawMaterialStockDto>> GetRawMaterialStocksAsync(
            long vendorId, string? search, string? crop, string? supplierType, string? grade, string? stockStatus, CancellationToken cancellationToken = default)
        {
            var list = new List<VendorRawMaterialStockDto>();
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_Vendor_GetRawMaterialStocks(@p_vendor_id, @p_search, @p_crop, @p_supplier_type, @p_grade, @p_status);";
            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_search", Clean(search));
            AddParam(cmd, "@p_crop", Clean(crop));
            AddParam(cmd, "@p_supplier_type", Clean(supplierType));
            AddParam(cmd, "@p_grade", Clean(grade));
            AddParam(cmd, "@p_status", Clean(stockStatus));

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                list.Add(MapRawMaterialStock(reader));
            }

            return list;
        }

        public async Task<VendorRawMaterialStockDto?> GetRawMaterialStockByIdAsync(long vendorId, string stockCodeOrId, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_Vendor_GetRawMaterialStockById(@p_vendor_id, @p_stock_id_or_code);";
            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_stock_id_or_code", stockCodeOrId.Trim());

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return MapRawMaterialStock(reader);
            }
            return null;
        }

        public async Task<VendorRawMaterialStockDto> CreateRawMaterialStockAsync(long vendorId, CreateRawMaterialStockRequest request, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(request.CropName))
                throw new ArgumentException("Crop name is required.");

            if (request.PurchasedQuantity <= 0)
                throw new ArgumentException("Purchased quantity must be greater than zero.");

            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_Vendor_CreateRawMaterialStock(@p_vendor_id, @p_crop_name, @p_crop_variety, @p_supplier_name, @p_supplier_category, @p_purchase_id, @p_batch_number, @p_purchase_date, @p_purchased_quantity, @p_unit, @p_average_cost, @p_quality_grade, @p_min_threshold);";

            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_crop_name", request.CropName.Trim());
            AddParam(cmd, "@p_crop_variety", Clean(request.CropVariety) ?? "Standard");
            AddParam(cmd, "@p_supplier_name", Clean(request.SupplierName) ?? "Direct Procurement");
            AddParam(cmd, "@p_supplier_category", Clean(request.SupplierCategory) ?? "Farmer");
            AddParam(cmd, "@p_purchase_id", Clean(request.PurchaseId));
            AddParam(cmd, "@p_batch_number", Clean(request.BatchNumber));
            AddParam(cmd, "@p_purchase_date", request.PurchaseDate ?? DateTime.UtcNow);
            AddParam(cmd, "@p_purchased_quantity", request.PurchasedQuantity);
            AddParam(cmd, "@p_unit", Clean(request.Unit) ?? "Quintal");
            AddParam(cmd, "@p_average_cost", request.AverageCost);
            AddParam(cmd, "@p_quality_grade", Clean(request.QualityGrade) ?? "Grade A (Standard FAQ)");
            AddParam(cmd, "@p_min_threshold", request.MinThresholdQuantity ?? 15m);

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return MapRawMaterialStock(reader);
            }

            throw new InvalidOperationException("Failed to create raw material stock.");
        }

        public async Task<List<VendorStockMovementDto>> GetStockMovementsAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var list = new List<VendorStockMovementDto>();
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_Vendor_GetStockMovements(@p_vendor_id);";
            AddParam(cmd, "@p_vendor_id", vendorId);

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                list.Add(new VendorStockMovementDto
                {
                    Id = SafeLong(reader["Id"]),
                    MovementId = SafeString(reader["MovementId"]),
                    MovementDate = SafeDateTime(reader["MovementDate"]),
                    BatchNumber = SafeString(reader["BatchNumber"]),
                    CropName = SafeString(reader["CropName"]),
                    MovementType = SafeString(reader["MovementType"]),
                    ReferenceId = SafeString(reader["ReferenceId"]),
                    QuantityChange = SafeDecimal(reader["QuantityChange"]),
                    Unit = SafeString(reader["Unit"]),
                    BalanceAfter = SafeDecimal(reader["BalanceAfter"]),
                    Remarks = SafeString(reader["Remarks"])
                });
            }
            return list;
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

        private static VendorRawMaterialStockDto MapRawMaterialStock(DbDataReader reader) => new()
        {
            Id = SafeLong(reader["Id"]),
            StockId = SafeString(reader["StockId"]),
            CropName = SafeString(reader["CropName"]),
            CropVariety = SafeString(reader["CropVariety"]),
            SupplierName = SafeString(reader["SupplierName"]),
            SupplierCategory = SafeString(reader["SupplierCategory"]),
            PurchaseId = SafeString(reader["PurchaseId"]),
            BatchNumber = SafeString(reader["BatchNumber"]),
            PurchaseDate = SafeDateTime(reader["PurchaseDate"]),
            PurchasedQuantity = SafeDecimal(reader["PurchasedQuantity"]),
            ProcessedQuantity = SafeDecimal(reader["ProcessedQuantity"]),
            AvailableQuantity = SafeDecimal(reader["AvailableQuantity"]),
            Unit = SafeString(reader["Unit"]),
            AverageCost = SafeDecimal(reader["AverageCost"]),
            QualityGrade = SafeString(reader["QualityGrade"]),
            Status = SafeString(reader["Status"])
        };

        // ==========================================
        // 2. PRODUCT PROCESSING MANAGEMENT
        // ==========================================

        public async Task<VendorProcessingOverviewDto> GetProcessingOverviewAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_Vendor_GetProcessingOverview(@p_vendor_id);";
            AddParam(cmd, "@p_vendor_id", vendorId);

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return new VendorProcessingOverviewDto
                {
                    TotalBatches = SafeInt(reader["TotalBatches"]),
                    DraftProcessingCount = SafeInt(reader["DraftProcessingCount"]),
                    CompletedBatchesCount = SafeInt(reader["CompletedBatchesCount"]),
                    TotalInputQuantity = SafeDecimal(reader["TotalInputQuantity"]),
                    InputUnit = SafeString(reader["InputUnit"]),
                    TotalOutputQuantity = SafeDecimal(reader["TotalOutputQuantity"]),
                    TotalWastageQuantity = SafeDecimal(reader["TotalWastageQuantity"]),
                    WastageUnit = SafeString(reader["WastageUnit"]),
                    TotalProcessingExpenses = SafeDecimal(reader["TotalProcessingExpenses"])
                };
            }

            return new VendorProcessingOverviewDto { InputUnit = "Qtl", WastageUnit = "Qtl" };
        }

        public async Task<List<VendorProcessingBatchDto>> GetProcessingBatchesAsync(
            long vendorId, string? search, string? rawMaterial, string? status, CancellationToken cancellationToken = default)
        {
            var batches = new List<VendorProcessingBatchDto>();
            var outputsByBatch = new Dictionary<long, List<VendorProcessingOutputDto>>();

            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = "CALL sp_Vendor_GetProcessingBatches(@p_vendor_id, @p_search, @p_raw_material, @p_status);";
                AddParam(cmd, "@p_vendor_id", vendorId);
                AddParam(cmd, "@p_search", Clean(search));
                AddParam(cmd, "@p_raw_material", Clean(rawMaterial));
                AddParam(cmd, "@p_status", Clean(status));

                await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken))
                {
                    batches.Add(MapProcessingBatchHeader(reader));
                }

                if (await reader.NextResultAsync(cancellationToken))
                {
                    while (await reader.ReadAsync(cancellationToken))
                    {
                        var batchId = SafeLong(reader["ProcessingBatchId"]);
                        if (!outputsByBatch.TryGetValue(batchId, out var outList))
                        {
                            outList = new List<VendorProcessingOutputDto>();
                            outputsByBatch[batchId] = outList;
                        }
                        outList.Add(MapProcessingOutput(reader));
                    }
                }
            }

            foreach (var b in batches)
            {
                if (outputsByBatch.TryGetValue(b.Id, out var outs))
                {
                    b.Outputs = outs;
                    b.FinishedOutputsSummary = string.Join(", ", outs.Select(o => $"{o.OutputProductName} ({o.OutputQuantity} {o.Unit})"));
                }
            }

            return batches;
        }

        public async Task<VendorProcessingBatchDto?> GetProcessingBatchByIdAsync(long vendorId, string processingCodeOrId, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_Vendor_GetProcessingBatchById(@p_vendor_id, @p_processing_id_or_code);";
            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_processing_id_or_code", processingCodeOrId.Trim());

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
                return null;

            var batch = MapProcessingBatchHeader(reader);
            var outputs = new List<VendorProcessingOutputDto>();

            if (await reader.NextResultAsync(cancellationToken))
            {
                while (await reader.ReadAsync(cancellationToken))
                {
                    outputs.Add(MapProcessingOutput(reader));
                }
            }

            batch.Outputs = outputs;
            batch.FinishedOutputsSummary = string.Join(", ", outputs.Select(o => $"{o.OutputProductName} ({o.OutputQuantity} {o.Unit})"));
            return batch;
        }

        public async Task<VendorProcessingBatchDto> CreateProcessingBatchAsync(long vendorId, CreateProcessingBatchRequest request, CancellationToken cancellationToken = default)
        {
            var totalOutputQty = request.Outputs.Sum(o => o.OutputQuantity);
            long newBatchId = 0;
            string processingCode = string.Empty;

            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = "CALL sp_Vendor_CreateProcessingBatch(@p_vendor_id, @p_raw_material_name, @p_source_stock_id, @p_input_quantity, @p_unit, @p_total_output_quantity, @p_processing_expenses, @p_notes);";
                AddParam(cmd, "@p_vendor_id", vendorId);
                AddParam(cmd, "@p_raw_material_name", request.RawMaterialName.Trim());
                AddParam(cmd, "@p_source_stock_id", request.SourceStockId.Trim());
                AddParam(cmd, "@p_input_quantity", request.InputQuantity);
                AddParam(cmd, "@p_unit", request.Unit);
                AddParam(cmd, "@p_total_output_quantity", totalOutputQty);
                AddParam(cmd, "@p_processing_expenses", request.ProcessingExpenses);
                AddParam(cmd, "@p_notes", Clean(request.Notes));

                await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
                if (await reader.ReadAsync(cancellationToken))
                {
                    newBatchId = SafeLong(reader["BatchId"]);
                    processingCode = SafeString(reader["ProcessingCode"]);
                }
            }

            foreach (var o in request.Outputs)
            {
                await using var outCmd = conn.CreateCommand();
                outCmd.CommandText = "CALL sp_Vendor_AddProcessingOutput(@p_processing_batch_id, @p_output_product_name, @p_output_quantity, @p_unit, @p_output_type);";
                AddParam(outCmd, "@p_processing_batch_id", newBatchId);
                AddParam(outCmd, "@p_output_product_name", o.OutputProductName.Trim());
                AddParam(outCmd, "@p_output_quantity", o.OutputQuantity);
                AddParam(outCmd, "@p_unit", o.Unit);
                AddParam(outCmd, "@p_output_type", o.OutputType);
                await outCmd.ExecuteNonQueryAsync(cancellationToken);
            }

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

        private static VendorProcessingBatchDto MapProcessingBatchHeader(DbDataReader reader)
        {
            var rawMaterialName = SafeString(reader["RawMaterialName"]);
            var batchNumber = SafeString(reader["BatchNumber"]);
            return new VendorProcessingBatchDto
            {
                Id = SafeLong(reader["Id"]),
                ProcessingId = SafeString(reader["ProcessingId"]),
                ProcessingDate = SafeDateTime(reader["ProcessingDate"]),
                RawMaterialAndBatch = $"{rawMaterialName} - {batchNumber}",
                RawMaterialName = rawMaterialName,
                SourceStockId = SafeString(reader["SourceStockId"]),
                InputQuantity = SafeDecimal(reader["InputQuantity"]),
                InputUnit = SafeString(reader["InputUnit"]),
                WastageQuantity = SafeDecimal(reader["WastageQuantity"]),
                WastagePercentage = SafeDecimal(reader["WastagePercentage"]),
                ProcessingExpenses = SafeDecimal(reader["ProcessingExpenses"]),
                TotalBatchCost = SafeDecimal(reader["TotalBatchCost"]),
                UnitCost = SafeDecimal(reader["UnitCost"]),
                UnitCostLabel = SafeString(reader["UnitCostLabel"]),
                Status = SafeString(reader["Status"]),
                Notes = SafeNullableString(reader["Notes"])
            };
        }

        private static VendorProcessingOutputDto MapProcessingOutput(DbDataReader reader) => new()
        {
            Id = SafeLong(reader["Id"]),
            OutputProductName = SafeString(reader["OutputProductName"]),
            OutputQuantity = SafeDecimal(reader["OutputQuantity"]),
            Unit = SafeString(reader["Unit"]),
            OutputType = SafeString(reader["OutputType"])
        };

        // ==========================================
        // 3. FINISHED PRODUCTS INVENTORY
        // ==========================================

        public async Task<VendorFinishedProductsOverviewDto> GetFinishedProductsOverviewAsync(long vendorId, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_Vendor_GetFinishedProductsOverview(@p_vendor_id);";
            AddParam(cmd, "@p_vendor_id", vendorId);

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return new VendorFinishedProductsOverviewDto
                {
                    TotalProductTypes = SafeInt(reader["TotalProductTypes"]),
                    ActiveBatchesCount = SafeInt(reader["ActiveBatchesCount"]),
                    TotalFinishedStock = SafeDecimal(reader["TotalFinishedStock"]),
                    TotalSoldQuantity = SafeDecimal(reader["TotalSoldQuantity"]),
                    LowStockProductsCount = SafeInt(reader["LowStockProductsCount"])
                };
            }

            return new VendorFinishedProductsOverviewDto();
        }

        public async Task<List<VendorFinishedProductDto>> GetFinishedProductsAsync(
            long vendorId, string? search, string? category, string? sourceRawMaterial, string? status, CancellationToken cancellationToken = default)
        {
            var list = new List<VendorFinishedProductDto>();
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_Vendor_GetFinishedProducts(@p_vendor_id, @p_search, @p_category, @p_source_raw_material, @p_status);";
            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_search", Clean(search));
            AddParam(cmd, "@p_category", Clean(category));
            AddParam(cmd, "@p_source_raw_material", Clean(sourceRawMaterial));
            AddParam(cmd, "@p_status", Clean(status));

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                list.Add(MapFinishedProduct(reader));
            }
            return list;
        }

        public async Task<VendorFinishedProductDto?> GetFinishedProductByIdAsync(long vendorId, string productCodeOrId, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_Vendor_GetFinishedProductById(@p_vendor_id, @p_product_id_or_code);";
            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_product_id_or_code", productCodeOrId.Trim());

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return MapFinishedProduct(reader);
            }
            return null;
        }

        public async Task<VendorFinishedProductDto> CreateFinishedProductAsync(long vendorId, CreateFinishedProductRequest request, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_Vendor_CreateFinishedProduct(@p_vendor_id, @p_product_name, @p_category, @p_source_raw_material, @p_brand_name, @p_packaging, @p_initial_quantity, @p_unit, @p_mfg_date, @p_expiry_date, @p_production_cost, @p_selling_price, @p_min_threshold_quantity, @p_image_url);";

            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_product_name", request.ProductName.Trim());
            AddParam(cmd, "@p_category", request.Category.Trim());
            AddParam(cmd, "@p_source_raw_material", request.SourceRawMaterial.Trim());
            AddParam(cmd, "@p_brand_name", request.BrandName.Trim());
            AddParam(cmd, "@p_packaging", request.Packaging.Trim());
            AddParam(cmd, "@p_initial_quantity", request.InitialQuantity);
            AddParam(cmd, "@p_unit", request.Unit);
            AddParam(cmd, "@p_mfg_date", request.MfgDate);
            AddParam(cmd, "@p_expiry_date", request.ExpiryDate);
            AddParam(cmd, "@p_production_cost", request.ProductionCost);
            AddParam(cmd, "@p_selling_price", request.SellingPrice);
            AddParam(cmd, "@p_min_threshold_quantity", request.MinThresholdQuantity);
            AddParam(cmd, "@p_image_url", Clean(request.ImageUrl));

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return MapFinishedProduct(reader);
            }

            throw new InvalidOperationException("Failed to create finished product.");
        }

        public async Task<VendorFinishedProductDto?> UpdateFinishedProductAsync(long vendorId, string productCodeOrId, UpdateFinishedProductRequest request, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_Vendor_UpdateFinishedProduct(@p_vendor_id, @p_product_id_or_code, @p_product_name, @p_category, @p_source_raw_material, @p_brand_name, @p_packaging, @p_mfg_date, @p_expiry_date, @p_production_cost, @p_selling_price, @p_min_threshold_quantity, @p_status, @p_image_url);";

            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_product_id_or_code", productCodeOrId.Trim());
            AddParam(cmd, "@p_product_name", request.ProductName.Trim());
            AddParam(cmd, "@p_category", request.Category.Trim());
            AddParam(cmd, "@p_source_raw_material", request.SourceRawMaterial.Trim());
            AddParam(cmd, "@p_brand_name", request.BrandName.Trim());
            AddParam(cmd, "@p_packaging", request.Packaging.Trim());
            AddParam(cmd, "@p_mfg_date", request.MfgDate);
            AddParam(cmd, "@p_expiry_date", request.ExpiryDate);
            AddParam(cmd, "@p_production_cost", request.ProductionCost);
            AddParam(cmd, "@p_selling_price", request.SellingPrice);
            AddParam(cmd, "@p_min_threshold_quantity", request.MinThresholdQuantity);
            AddParam(cmd, "@p_status", Clean(request.Status));
            AddParam(cmd, "@p_image_url", Clean(request.ImageUrl));

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return MapFinishedProduct(reader);
            }
            return null;
        }

        public async Task<bool> AdjustFinishedProductStockAsync(long vendorId, string productCodeOrId, AdjustFinishedProductStockRequest request, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_Vendor_AdjustFinishedProductStock(@p_vendor_id, @p_product_id_or_code, @p_quantity_adjustment, @p_reference_id, @p_reason);";

            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_product_id_or_code", productCodeOrId.Trim());
            AddParam(cmd, "@p_quantity_adjustment", request.QuantityAdjustment);
            AddParam(cmd, "@p_reference_id", Clean(request.ReferenceId));
            AddParam(cmd, "@p_reason", request.Reason.Trim());

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return SafeBool(reader["Adjusted"]);
            }
            return false;
        }

        public async Task<List<VendorFinishedProductMovementDto>> GetFinishedProductMovementsAsync(long vendorId, string productCodeOrId, CancellationToken cancellationToken = default)
        {
            var list = new List<VendorFinishedProductMovementDto>();
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_Vendor_GetFinishedProductMovements(@p_vendor_id, @p_product_id_or_code);";

            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_product_id_or_code", productCodeOrId.Trim());

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                list.Add(new VendorFinishedProductMovementDto
                {
                    Id = SafeLong(reader["Id"]),
                    MovementCode = SafeString(reader["MovementCode"]),
                    MovementType = SafeString(reader["MovementType"]),
                    ReferenceId = SafeString(reader["ReferenceId"]),
                    QuantityChange = SafeDecimal(reader["QuantityChange"]),
                    Unit = SafeString(reader["Unit"]),
                    BalanceAfter = SafeDecimal(reader["BalanceAfter"]),
                    MovementDate = SafeDateTime(reader["MovementDate"]),
                    Remarks = SafeString(reader["Remarks"])
                });
            }
            return list;
        }

        public async Task<bool> ToggleFinishedProductStatusAsync(long vendorId, string productCodeOrId, CancellationToken cancellationToken = default)
        {
            var conn = await GetOpenConnectionAsync(cancellationToken);
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = "CALL sp_Vendor_ToggleFinishedProductStatus(@p_vendor_id, @p_product_id_or_code);";

            AddParam(cmd, "@p_vendor_id", vendorId);
            AddParam(cmd, "@p_product_id_or_code", productCodeOrId.Trim());

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return SafeBool(reader["Toggled"]);
            }
            return false;
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

        private static VendorFinishedProductDto MapFinishedProduct(DbDataReader reader) => new()
        {
            Id = SafeLong(reader["Id"]),
            ProductId = SafeString(reader["ProductId"]),
            ProductName = SafeString(reader["ProductName"]),
            Category = SafeString(reader["Category"]),
            SourceRawMaterial = SafeString(reader["SourceRawMaterial"]),
            BrandName = SafeString(reader["BrandName"]),
            Packaging = SafeString(reader["Packaging"]),
            AvailableQuantity = SafeDecimal(reader["AvailableQuantity"]),
            SoldQuantity = SafeDecimal(reader["SoldQuantity"]),
            Unit = SafeString(reader["Unit"]),
            MfgDate = SafeDateTime(reader["MfgDate"]),
            ExpiryDate = SafeDateTime(reader["ExpiryDate"]),
            ProductionCost = SafeDecimal(reader["ProductionCost"]),
            SellingPrice = SafeDecimal(reader["SellingPrice"]),
            ProfitMarginPercentage = SafeDecimal(reader["ProfitMarginPercentage"]),
            Status = SafeString(reader["Status"]),
            IsLowStock = SafeBool(reader["IsLowStock"]),
            ImageUrl = SafeNullableString(reader["ImageUrl"])
        };

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
        private static bool SafeBool(object? val) => val != null && !(val is DBNull) && (val is bool b ? b : Convert.ToInt32(val, CultureInfo.InvariantCulture) != 0);
    }
}
