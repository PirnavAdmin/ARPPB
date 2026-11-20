using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;

namespace AgriPurchaseBilling.Application.Services
{
    public class CustomerMarketplaceService : ICustomerMarketplaceService
    {
        private const int DefaultPage = 1;
        private const int DefaultPageSize = 12;
        private const int MaxPageSize = 50;

        private static readonly HashSet<string> AllowedSortOptions = new(StringComparer.OrdinalIgnoreCase)
        {
            "popular",
            "price_asc",
            "price_desc",
            "recent",
            "newest"
        };

        private static readonly Dictionary<string, string> StockStatusNormalizationMap = new(StringComparer.OrdinalIgnoreCase)
        {
            ["all"] = "all",
            ["in_stock"] = "in_stock",
            ["instock"] = "in_stock",
            ["in stock"] = "in_stock",
            ["low_stock"] = "low_stock",
            ["lowstock"] = "low_stock",
            ["low stock"] = "low_stock",
            ["out_of_stock"] = "out_of_stock",
            ["outofstock"] = "out_of_stock",
            ["out of stock"] = "out_of_stock"
        };

        private readonly ICustomerMarketplaceRepository _repository;

        public CustomerMarketplaceService(ICustomerMarketplaceRepository repository)
        {
            _repository = repository;
        }

        public async Task<ApiResponse<List<CustomerMarketplaceCategoryDto>>> GetCategoriesAsync(
            CancellationToken cancellationToken = default)
        {
            var categories = await _repository.GetCategoriesAsync(cancellationToken);
            return ApiResponse<List<CustomerMarketplaceCategoryDto>>.Ok(
                categories,
                $"Retrieved {categories.Count} marketplace category(s) successfully.");
        }

        public async Task<ApiResponse<CustomerMarketplacePagedProductsDto>> GetProductsAsync(
            CustomerMarketplaceProductQueryDto query,
            CancellationToken cancellationToken = default)
        {
            query ??= new CustomerMarketplaceProductQueryDto();

            if (query.Page < 1)
            {
                return ApiResponse<CustomerMarketplacePagedProductsDto>.Fail("Page must be greater than or equal to 1.");
            }

            if (query.PageSize < 1 || query.PageSize > MaxPageSize)
            {
                return ApiResponse<CustomerMarketplacePagedProductsDto>.Fail($"PageSize must be between 1 and {MaxPageSize}.");
            }

            if (query.MinPrice.HasValue && query.MinPrice.Value < 0)
            {
                return ApiResponse<CustomerMarketplacePagedProductsDto>.Fail("MinPrice cannot be negative.");
            }

            if (query.MaxPrice.HasValue && query.MaxPrice.Value < 0)
            {
                return ApiResponse<CustomerMarketplacePagedProductsDto>.Fail("MaxPrice cannot be negative.");
            }

            if (query.MinPrice.HasValue && query.MaxPrice.HasValue && query.MinPrice.Value > query.MaxPrice.Value)
            {
                return ApiResponse<CustomerMarketplacePagedProductsDto>.Fail("MinPrice cannot be greater than MaxPrice.");
            }

            if (query.VendorId.HasValue && query.VendorId.Value <= 0)
            {
                return ApiResponse<CustomerMarketplacePagedProductsDto>.Fail("VendorId must be greater than 0.");
            }

            string? normalizedGrade = NormalizeFilterOrAll(query.Grade);
            if (normalizedGrade != null)
            {
                return ApiResponse<CustomerMarketplacePagedProductsDto>.Fail(
                    "Grade filtering is not yet supported because vendor_finished_products does not have a QualityGrade column.");
            }

            string? normalizedStockStatus = null;
            if (!string.IsNullOrWhiteSpace(query.StockStatus))
            {
                string rawStock = query.StockStatus.Trim();
                if (!StockStatusNormalizationMap.TryGetValue(rawStock, out normalizedStockStatus))
                {
                    return ApiResponse<CustomerMarketplacePagedProductsDto>.Fail(
                        "Invalid stockStatus value. Supported values are: all, in_stock, low_stock, out_of_stock.");
                }
            }

            string normalizedSort = string.IsNullOrWhiteSpace(query.SortBy)
                ? "recent"
                : query.SortBy.Trim().ToLowerInvariant();

            if (!AllowedSortOptions.Contains(normalizedSort))
            {
                return ApiResponse<CustomerMarketplacePagedProductsDto>.Fail(
                    "Invalid sortBy value. Supported values are: popular, price_asc, price_desc, recent, newest.");
            }

            if (normalizedSort == "newest")
            {
                normalizedSort = "recent";
            }

            var sanitizedQuery = new CustomerMarketplaceProductQueryDto
            {
                Category = NormalizeFilterOrAll(query.Category),
                Search = string.IsNullOrWhiteSpace(query.Search) ? null : query.Search.Trim(),
                Location = NormalizeFilterOrAll(query.Location),
                District = NormalizeFilterOrAll(query.District),
                State = NormalizeFilterOrAll(query.State),
                Grade = null,
                VendorId = query.VendorId,
                MinPrice = query.MinPrice,
                MaxPrice = query.MaxPrice,
                StockStatus = normalizedStockStatus,
                InStockOnly = query.InStockOnly,
                SortBy = normalizedSort,
                Page = query.Page > 0 ? query.Page : DefaultPage,
                PageSize = query.PageSize > 0 ? query.PageSize : DefaultPageSize
            };

            var result = await _repository.GetProductsAsync(sanitizedQuery, cancellationToken);
            return ApiResponse<CustomerMarketplacePagedProductsDto>.Ok(
                result,
                $"Retrieved {result.Items.Count} marketplace product(s) successfully.");
        }

        private static string? NormalizeFilterOrAll(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            string trimmed = value.Trim();
            return string.Equals(trimmed, "all", StringComparison.OrdinalIgnoreCase) ? null : trimmed;
        }

        public async Task<ApiResponse<CustomerMarketplaceProductDetailDto>> GetProductByIdAsync(
            long productId,
            CancellationToken cancellationToken = default)
        {
            if (productId <= 0)
            {
                return ApiResponse<CustomerMarketplaceProductDetailDto>.Fail("Invalid product ID.");
            }

            var product = await _repository.GetProductByIdAsync(productId, cancellationToken);
            if (product == null)
            {
                return ApiResponse<CustomerMarketplaceProductDetailDto>.Fail("Marketplace product not found.");
            }

            return ApiResponse<CustomerMarketplaceProductDetailDto>.Ok(
                product,
                "Marketplace product details retrieved successfully.");
        }
    }
}

