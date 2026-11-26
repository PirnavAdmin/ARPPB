using System;
using System.ComponentModel.DataAnnotations;

namespace AgriPurchaseBilling.Application.DTOs
{
    /// <summary>
    /// Lightweight summary DTO for autocomplete search dropdown in Sell Farm Products form
    /// </summary>
    public class FarmerContactSummaryDto
    {
        public long Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string MobileNumber { get; set; } = string.Empty;
        public string BusinessName { get; set; } = string.Empty;
    }

    /// <summary>
    /// Detailed contact DTO returned when querying a specific contact by ID and category
    /// </summary>
    public class FarmerContactDetailsDto
    {
        public long Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string MobileNumber { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? BusinessName { get; set; }
        public string? Village { get; set; }
        public string? Address { get; set; }
    }

    /// <summary>
    /// Query filter parameters for searching contacts
    /// </summary>
    public class ContactSearchQueryDto
    {
        [Required(ErrorMessage = "Category is required.")]
        [RegularExpression("^(Middleman|Vendor|Customer)$", ErrorMessage = "Category must be 'Middleman', 'Vendor', or 'Customer'.")]
        public string Category { get; set; } = string.Empty;

        public string? Prefix { get; set; }

        [Range(1, 10, ErrorMessage = "Limit must be between 1 and 10.")]
        public int Limit { get; set; } = 10;
    }
}
