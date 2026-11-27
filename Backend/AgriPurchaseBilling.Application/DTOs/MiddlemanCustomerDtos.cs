using System;
using System.Collections.Generic;

namespace AgriPurchaseBilling.Application.DTOs
{
    public class MiddlemanCustomerDto
    {
        public long Id { get; set; }
        public long MiddlemanId { get; set; }
        public string CustomerId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = "Andhra Pradesh";
        public string? PinCode { get; set; }
        public int TotalPurchases { get; set; }
        public decimal TotalPurchaseValue { get; set; }
        public decimal OutstandingReceivables { get; set; }
        public string Status { get; set; } = "Active";
        public string? Notes { get; set; }

        public string Role { get; set; } = "Customer";
        public string UserType { get; set; } = "Customer";
        public DateTime RegistrationDate => CreatedAt;
        public string SourcePortal { get; set; } = "Portal";

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class MiddlemanCustomerPageDto
    {
        public List<MiddlemanCustomerDto> Items { get; set; } = new();
        public int TotalItems { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public class MiddlemanCustomerQueryDto
    {
        public string? Search { get; set; }
        public string? District { get; set; }
        public string? Status { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class RegisterCustomerRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string District { get; set; } = string.Empty;
        public string? State { get; set; } = "Andhra Pradesh";
        public string? PinCode { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateCustomerRequest
    {
        public string? Name { get; set; }
        public string? Mobile { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? District { get; set; }
        public string? State { get; set; }
        public string? PinCode { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
    }

    public class MiddlemanCustomerSaleDto
    {
        public long Id { get; set; }
        public long MiddlemanId { get; set; }
        public string SaleId { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string? Mobile { get; set; }
        public string CropName { get; set; } = string.Empty;
        public string Variety { get; set; } = "Standard";
        public string QualityGrade { get; set; } = "Grade A";
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "Quintal";
        public decimal Rate { get; set; }
        public decimal Subtotal { get; set; }
        public decimal DeliveryCharges { get; set; }
        public string? DeliveryAddress { get; set; }
        public decimal FinalAmount { get; set; }
        public DateTime SalesDate { get; set; }
        public DateTime? ExpectedPaymentDate { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public string Status { get; set; } = "Pending Confirmation";
        public string OtpStatus { get; set; } = "Pending";

        public decimal PaidAmount { get; set; }
        public decimal OutstandingAmount { get; set; }
        public string PaymentStatus { get; set; } = "Unpaid";
        public List<MiddlemanPaymentDto> PaymentHistory { get; set; } = new();

        public DateTime? ConfirmationDate { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class MiddlemanCustomerSalePageDto
    {
        public List<MiddlemanCustomerSaleDto> Items { get; set; } = new();
        public int TotalItems { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public class MiddlemanCustomerSaleQueryDto
    {
        public string? CustomerId { get; set; }
        public string? CropName { get; set; }
        public string? Status { get; set; }
        public string? Search { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class CreateMiddlemanCustomerSaleRequest
    {
        public string? CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public string? Mobile { get; set; }
        public string CropName { get; set; } = string.Empty;
        public string? Variety { get; set; } = "Standard";
        public string? QualityGrade { get; set; } = "Grade A";
        public decimal Quantity { get; set; }
        public string? Unit { get; set; } = "Quintal";
        public decimal Rate { get; set; }
        public decimal Subtotal { get; set; }
        public decimal DeliveryCharges { get; set; }
        public string? DeliveryAddress { get; set; }
        public decimal FinalAmount { get; set; }
        public DateTime? SalesDate { get; set; }
        public DateTime? ExpectedPaymentDate { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public bool IsDraft { get; set; } = false;
        public string? Notes { get; set; }
    }
}
