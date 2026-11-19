using System;
using System.Collections.Generic;

namespace AgriPurchaseBilling.Domain.Entities.VendorOperations
{
    public class VendorFarmer
    {
        public long Id { get; set; }
        public long VendorId { get; set; } = 1;
        public string FarmerCode { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? FatherOrSpouseName { get; set; }
        public string MobileNumber { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string Village { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string? PinCode { get; set; }
        public decimal LandAcres { get; set; }
        public string RegisteredCrops { get; set; } = string.Empty;
        public string? BankAccountNumber { get; set; }
        public string? IfscCode { get; set; }
        public string? BankName { get; set; }
        public string? AadhaarNumber { get; set; }
        public string Status { get; set; } = "Active";
        public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<VendorFarmerPurchase> Purchases { get; set; } = new List<VendorFarmerPurchase>();
        public ICollection<VendorFarmerPayment> Payments { get; set; } = new List<VendorFarmerPayment>();
        public ICollection<VendorFarmerOtpLog> OtpLogs { get; set; } = new List<VendorFarmerOtpLog>();
    }

    public class VendorFarmerPurchase
    {
        public long Id { get; set; }
        public long FarmerId { get; set; }
        public string PurchaseCode { get; set; } = string.Empty;
        public string BillNumber { get; set; } = string.Empty;
        public string CropName { get; set; } = string.Empty;
        public string CropVariety { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "Quintal";
        public decimal RatePerUnit { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DueAmount { get; set; }
        public string PaymentStatus { get; set; } = "Pending";
        public DateTime PurchaseDate { get; set; }

        public VendorFarmer? Farmer { get; set; }
    }

    public class VendorFarmerPayment
    {
        public long Id { get; set; }
        public long FarmerId { get; set; }
        public string PaymentCode { get; set; } = string.Empty;
        public string VoucherNumber { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "Bank Transfer";
        public DateTime PaymentDate { get; set; }
        public string? ReferenceNumber { get; set; }
        public string Status { get; set; } = "Completed";
        public string? Notes { get; set; }

        public VendorFarmer? Farmer { get; set; }
    }

    public class VendorFarmerOtpLog
    {
        public long Id { get; set; }
        public long FarmerId { get; set; }
        public string OtpCode { get; set; } = string.Empty;
        public string Purpose { get; set; } = string.Empty;
        public string ActionDetails { get; set; } = string.Empty;
        public string Status { get; set; } = "Verified";
        public DateTime? VerifiedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public VendorFarmer? Farmer { get; set; }
    }

    public class VendorMiddleman
    {
        public long Id { get; set; }
        public long VendorId { get; set; } = 1;
        public string MiddlemanCode { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string MobileNumber { get; set; } = string.Empty;
        public string BusinessName { get; set; } = string.Empty;
        public string Gstin { get; set; } = string.Empty;
        public string Pan { get; set; } = string.Empty;
        public string MarketYardLocation { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string? PinCode { get; set; }
        public decimal OpeningBalance { get; set; }
        public string Status { get; set; } = "Active";
        public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<VendorMiddlemanPurchase> Purchases { get; set; } = new List<VendorMiddlemanPurchase>();
        public ICollection<VendorMiddlemanPayment> Payments { get; set; } = new List<VendorMiddlemanPayment>();
        public ICollection<VendorMiddlemanOtpLog> OtpLogs { get; set; } = new List<VendorMiddlemanOtpLog>();
    }

    public class VendorMiddlemanPurchase
    {
        public long Id { get; set; }
        public long MiddlemanId { get; set; }
        public string PurchaseCode { get; set; } = string.Empty;
        public string BillNumber { get; set; } = string.Empty;
        public string CropName { get; set; } = string.Empty;
        public string CropVariety { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "Quintal";
        public decimal RatePerUnit { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DueAmount { get; set; }
        public string PaymentStatus { get; set; } = "Pending";
        public DateTime PurchaseDate { get; set; }

        public VendorMiddleman? Middleman { get; set; }
    }

    public class VendorMiddlemanPayment
    {
        public long Id { get; set; }
        public long MiddlemanId { get; set; }
        public string PaymentCode { get; set; } = string.Empty;
        public string VoucherNumber { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "RTGS/NEFT";
        public DateTime PaymentDate { get; set; }
        public string? ReferenceNumber { get; set; }
        public string Status { get; set; } = "Completed";
        public string? Notes { get; set; }

        public VendorMiddleman? Middleman { get; set; }
    }

    public class VendorMiddlemanOtpLog
    {
        public long Id { get; set; }
        public long MiddlemanId { get; set; }
        public string OtpCode { get; set; } = string.Empty;
        public string Purpose { get; set; } = string.Empty;
        public string ActionDetails { get; set; } = string.Empty;
        public string Status { get; set; } = "Verified";
        public DateTime? VerifiedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public VendorMiddleman? Middleman { get; set; }
    }

    public class VendorCustomer
    {
        public long Id { get; set; }
        public long VendorId { get; set; } = 1;
        public string CustomerCode { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string BusinessName { get; set; } = string.Empty;
        public string CustomerType { get; set; } = "Wholesaler";
        public string MobileNumber { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string Address { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string? PinCode { get; set; }
        public string? Gstin { get; set; }
        public decimal CreditLimit { get; set; }
        public string Status { get; set; } = "Active";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<VendorCustomerOrder> Orders { get; set; } = new List<VendorCustomerOrder>();
    }

    public class VendorCustomerOrder
    {
        public long Id { get; set; }
        public long CustomerId { get; set; }
        public string OrderCode { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "Quintal";
        public decimal TotalAmount { get; set; }
        public decimal DueAmount { get; set; }
        public string OrderStatus { get; set; } = "Completed";
        public DateTime OrderDate { get; set; }

        public VendorCustomer? Customer { get; set; }
    }
}
