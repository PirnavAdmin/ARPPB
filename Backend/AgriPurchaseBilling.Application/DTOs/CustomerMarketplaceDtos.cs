using System.Text.Json.Serialization;

namespace AgriPurchaseBilling.Application.DTOs
{
    public class CustomerMarketplaceCategoryDto
    {
        public string Category { get; set; } = string.Empty;
        public int ProductCount { get; set; }
    }

    public class CustomerMarketplaceProductQueryDto
    {
        public string? Category { get; set; }
        public string? Search { get; set; }
        public string? Location { get; set; }
        public string? District { get; set; }
        public string? State { get; set; }
        public string? Grade { get; set; }
        /// <summary>
        /// Filters products by Vendors.Id only (does not match Users.Id).
        /// </summary>
        public long? VendorId { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }

        /// <summary>
        /// Supported values: all, in_stock (qty &gt; 20), low_stock (0 &lt; qty &lt;= 20), out_of_stock (qty &lt;= 0).
        /// Also accepts UI labels: "All", "In Stock", "Low Stock", "Out of Stock".
        /// When omitted, falls back to InStockOnly (qty &gt; 0) for backward compatibility.
        /// </summary>
        public string? StockStatus { get; set; }

        public bool InStockOnly { get; set; } = true;

        /// <summary>
        /// Supported values: popular, price_asc, price_desc, recent, newest (alias for recent).
        /// </summary>
        public string? SortBy { get; set; } = "newest";

        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 12;
    }

    public class CustomerMarketplaceProductDto
    {
        [JsonPropertyName("id")]
        public long ProductId { get; set; }

        [JsonIgnore]
        public long Id { get => ProductId; set => ProductId = value; }

        [JsonPropertyName("batchCode")]
        public string ProductCode { get; set; } = string.Empty;

        [JsonIgnore]
        public string BatchCode { get => ProductCode; set => ProductCode = value; }

        [JsonPropertyName("name")]
        public string ProductName { get; set; } = string.Empty;

        [JsonIgnore]
        public string Name { get => ProductName; set => ProductName = value; }

        public string Category { get; set; } = string.Empty;
        public decimal AvailableQuantity { get; set; }
        public string Unit { get; set; } = string.Empty;

        [JsonPropertyName("price")]
        public decimal SellingPrice { get; set; }

        [JsonIgnore]
        public decimal Price { get => SellingPrice; set => SellingPrice = value; }

        public string StockStatus { get; set; } = string.Empty;

        [JsonPropertyName("image")]
        public string? ImageUrl { get; set; }

        [JsonIgnore]
        public string? Image { get => ImageUrl; set => ImageUrl = value; }

        public long VendorId { get; set; }

        [JsonPropertyName("sellerName")]
        public string VendorBusinessName { get; set; } = string.Empty;

        [JsonIgnore]
        public string SellerName { get => VendorBusinessName; set => VendorBusinessName = value; }

        public string? District { get; set; }
        public string? State { get; set; }

        [JsonPropertyName("location")]
        public string? Location => District;

        public DateTime CreatedAt { get; set; }
    }

    public class CustomerMarketplaceProductDetailDto : CustomerMarketplaceProductDto
    {
        public string Status { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; }
    }

    public class CustomerMarketplacePagedProductsDto
    {
        public List<CustomerMarketplaceProductDto> Items { get; set; } = new();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }
}

