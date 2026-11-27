using System;
using System.Collections.Generic;

namespace AgriPurchaseBilling.Application.DTOs
{
    public class MiddlemanFarmerDto
    {
        public long Id { get; set; }
        public long MiddlemanId { get; set; }

        public string FarmerId { get; set; } = string.Empty;
        public string FarmerCode => FarmerId;

        public string Name { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string? Email { get; set; }

        public string Village { get; set; } = string.Empty;
        public string? Mandal { get; set; }
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = "Andhra Pradesh";
        public string? PinCode { get; set; }
        public string? CompleteAddress { get; set; }

        public List<string> Crops { get; set; } = new();
        public List<string> AvailableCrops => Crops;

        public string? Notes { get; set; }

        public int TotalPurchases { get; set; }
        public decimal TotalQuantityPurchased { get; set; }
        public decimal TotalPurchaseValue { get; set; }
        public decimal TotalPaid { get; set; }
        public decimal OutstandingPayables { get; set; }
        public int UnpaidCount { get; set; }
        public int PartiallyPaidCount { get; set; }
        public int PaidCount { get; set; }
        public int PendingConfirmations { get; set; }

        public string Status { get; set; } = "Active";

        public string Role { get; set; } = "Farmer";
        public string UserType { get; set; } = "Farmer";
        public DateTime RegistrationDate => CreatedAt;
        public string SourcePortal { get; set; } = "Portal";

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class MiddlemanFarmerQueryDto
    {
        public string? Search { get; set; }
        public string? Crop { get; set; } = "ALL";
        public string? District { get; set; } = "ALL";
        public string? Status { get; set; } = "ALL";
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 8;
    }

    public class MiddlemanFarmerPageDto
    {
        public List<MiddlemanFarmerDto> Items { get; set; } = new();
        public int TotalItems { get; set; }
        public int ActiveSupplying { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalItems / PageSize) : 0;
    }

    public class RegisterFarmerRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string Village { get; set; } = string.Empty;
        public string? Mandal { get; set; }
        public string District { get; set; } = string.Empty;
        public string? State { get; set; } = "Andhra Pradesh";
        public string? PinCode { get; set; }
        public string? CompleteAddress { get; set; }

        private List<string>? _crops;
        public List<string>? Crops { get => _crops; set => _crops = value; }
        public List<string>? AvailableCrops { get => _crops; set => _crops = value; }

        public string? Notes { get; set; }
    }

    public class UpdateFarmerRequest
    {
        public string? Name { get; set; }
        public string? Mobile { get; set; }
        public string? Email { get; set; }
        public string? Village { get; set; }
        public string? Mandal { get; set; }
        public string? District { get; set; }
        public string? State { get; set; }
        public string? PinCode { get; set; }
        public string? CompleteAddress { get; set; }

        private List<string>? _crops;
        public List<string>? Crops { get => _crops; set => _crops = value; }
        public List<string>? AvailableCrops { get => _crops; set => _crops = value; }

        public string? Notes { get; set; }
        public string? Status { get; set; }
    }

    public class MiddlemanFarmerHistoryDto
    {
        public string FarmerId { get; set; } = string.Empty;
        public string FarmerName { get; set; } = string.Empty;
        public List<MiddlemanPurchaseDto> Purchases { get; set; } = new();
        public List<MiddlemanLedgerDto> LedgerEntries { get; set; } = new();
    }
}
