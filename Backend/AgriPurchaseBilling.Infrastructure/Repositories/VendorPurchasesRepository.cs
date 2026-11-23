using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs.VendorPortal;
using AgriPurchaseBilling.Application.Interfaces.VendorPortal;
using AgriPurchaseBilling.Infrastructure.Data;

namespace AgriPurchaseBilling.Infrastructure.Repositories
{
    public sealed class VendorPurchasesRepository : IVendorPurchasesRepository
    {
        private readonly VendorPortalDb _db;

        public VendorPurchasesRepository(VendorPortalDb db)
        {
            _db = db;
        }

        public async Task<VendorPurchasesSummaryDto> GetSummaryAsync(long vendorId, CancellationToken ct)
        {
            return await _db.ProcAsync(
                "sp_Vendor_GetPurchasesSummary",
                new (string, object?)[]
                {
                    ("p_vendor_id", vendorId),
                    ("p_from_date", null),
                    ("p_to_date", null)
                },
                async r =>
                {
                    var items = await RowMapper.ReadListAsync<VendorPurchasesSummaryDto>(r);
                    var summary = items.FirstOrDefault() ?? new VendorPurchasesSummaryDto();
                    summary.TotalPurchases = summary.FarmerPurchaseCount + summary.MiddlemanPurchaseCount;
                    return summary;
                },
                ct);
        }

        public async Task<PagedResult<VendorPurchaseItemDto>> GetPurchasesAsync(long vendorId, PurchasesQuery q, CancellationToken ct)
        {
            var page = Args.Page(q.Page);
            var size = Args.Size(q.PageSize);

            return await _db.ProcAsync(
                "sp_Vendor_GetPurchases",
                new (string, object?)[]
                {
                    ("p_vendor_id", vendorId),
                    ("p_supplier_category", Args.Clean(q.SupplierCategory)),
                    ("p_payment_status", Args.Clean(q.PaymentStatus)),
                    ("p_crop", Args.Clean(q.Crop)),
                    ("p_search", Args.Clean(q.Search)),
                    ("p_from_date", Args.Day(q.FromDate)),
                    ("p_to_date", Args.NextDay(q.ToDate)),
                    ("p_page_number", page),
                    ("p_page_size", size)
                },
                async r =>
                {
                    long total = 0;
                    if (await r.ReadAsync(ct))
                    {
                        total = Convert.ToInt64(r[0]);
                    }

                    var items = new List<VendorPurchaseItemDto>();
                    if (await r.NextResultAsync(ct))
                    {
                        items = await RowMapper.ReadListAsync<VendorPurchaseItemDto>(r);
                    }

                    return new PagedResult<VendorPurchaseItemDto>
                    {
                        Total = total,
                        Page = page,
                        PageSize = size,
                        Items = items
                    };
                },
                ct);
        }

        public async Task<VendorPurchaseItemDto?> GetPurchaseByIdAsync(long vendorId, long id, string supplierCategory, CancellationToken ct)
        {
            return await _db.ProcAsync(
                "sp_Vendor_GetPurchaseById",
                new (string, object?)[]
                {
                    ("p_vendor_id", vendorId),
                    ("p_purchase_id", id),
                    ("p_supplier_category", Args.Clean(supplierCategory) ?? "Farmer")
                },
                async r =>
                {
                    var items = await RowMapper.ReadListAsync<VendorPurchaseItemDto>(r);
                    return items.FirstOrDefault();
                },
                ct);
        }

        public async Task<VendorPurchaseItemDto> CreatePurchaseAsync(long vendorId, CreateVendorPurchaseRequest request, CancellationToken ct)
        {
            var isMiddleman = string.Equals(request.SupplierCategory, "Middleman", StringComparison.OrdinalIgnoreCase);
            var proc = isMiddleman ? "sp_Vendor_CreateMiddlemanPurchase" : "sp_Vendor_CreateFarmerPurchase";
            var idParam = isMiddleman ? "p_middleman_id" : "p_farmer_id";
            var prefix = isMiddleman ? "PUR-M-" : "PUR-F-";

            var purchaseCode = string.IsNullOrWhiteSpace(request.PurchaseCode)
                ? $"{prefix}{DateTime.UtcNow:yyyyMMddHHmmss}"
                : request.PurchaseCode.Trim();

            var billNumber = string.IsNullOrWhiteSpace(request.BillNumber)
                ? $"BILL-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}"
                : request.BillNumber.Trim();

            var total = request.TotalAmount > 0 ? request.TotalAmount : (request.Quantity * request.RatePerUnit);
            var due = request.DueAmount > 0 ? request.DueAmount : total;

            return await _db.ProcAsync(
                proc,
                new (string, object?)[]
                {
                    ("p_vendor_id", vendorId),
                    (idParam, request.SupplierId),
                    ("p_purchase_code", purchaseCode),
                    ("p_bill_number", billNumber),
                    ("p_crop_name", request.CropName.Trim()),
                    ("p_crop_variety", string.IsNullOrWhiteSpace(request.CropVariety) ? "Standard" : request.CropVariety.Trim()),
                    ("p_quantity", request.Quantity),
                    ("p_unit", string.IsNullOrWhiteSpace(request.Unit) ? "Quintal" : request.Unit.Trim()),
                    ("p_rate_per_unit", request.RatePerUnit),
                    ("p_total_amount", total),
                    ("p_due_amount", due),
                    ("p_payment_status", string.IsNullOrWhiteSpace(request.PaymentStatus) ? "Pending" : request.PaymentStatus.Trim()),
                    ("p_purchase_date", request.PurchaseDate ?? DateTime.UtcNow)
                },
                async r =>
                {
                    var items = await RowMapper.ReadListAsync<VendorPurchaseItemDto>(r);
                    var item = items.FirstOrDefault();
                    if (item == null)
                        throw new VendorPortalException(500, "Failed to create purchase record.");
                    return item;
                },
                ct);
        }

        public async Task<VendorPurchaseItemDto> UpdatePurchaseStatusAsync(
            long vendorId, long id, string supplierCategory, UpdateVendorPurchaseStatusRequest request, CancellationToken ct)
        {
            return await _db.ProcAsync(
                "sp_Vendor_UpdatePurchaseStatus",
                new (string, object?)[]
                {
                    ("p_vendor_id", vendorId),
                    ("p_purchase_id", id),
                    ("p_supplier_category", Args.Clean(supplierCategory) ?? "Farmer"),
                    ("p_payment_status", Args.Clean(request.PaymentStatus)),
                    ("p_due_amount", request.DueAmount)
                },
                async r =>
                {
                    var items = await RowMapper.ReadListAsync<VendorPurchaseItemDto>(r);
                    var item = items.FirstOrDefault();
                    if (item == null)
                        throw new VendorPortalException(404, "Purchase not found.");
                    return item;
                },
                ct);
        }

        public async Task<byte[]> ExportPurchasesCsvAsync(long vendorId, PurchasesQuery query, CancellationToken ct)
        {
            query.Page = 1;
            query.PageSize = 5000;
            var result = await GetPurchasesAsync(vendorId, query, ct);

            var sb = new StringBuilder();
            sb.AppendLine("Purchase Code,Supplier Category,Supplier Name,Mobile,Bill Number,Crop Name,Variety,Quantity,Unit,Rate Per Unit,Total Amount,Due Amount,Paid Amount,Payment Status,Purchase Date");

            foreach (var p in result.Items)
            {
                sb.AppendLine($"\"{p.PurchaseCode}\",\"{p.SupplierCategory}\",\"{p.SupplierName}\",\"{p.MobileNumber}\",\"{p.BillNumber}\",\"{p.CropName}\",\"{p.CropVariety}\",{p.Quantity},\"{p.Unit}\",{p.RatePerUnit},{p.TotalAmount},{p.DueAmount},{p.PaidAmount},\"{p.PaymentStatus}\",\"{p.PurchaseDate:yyyy-MM-dd}\"");
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }
    }
}
