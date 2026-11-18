namespace AgriPurchaseBilling.Domain.Entities
{
    public class FarmerBankAccount
    {
        public long Id { get; set; }
        public long FarmerId { get; set; }

        public string? BankName { get; set; }
        public string? AccountHolderName { get; set; }
        public string? AccountNumber { get; set; }
        public string? IfscCode { get; set; }
        public string? BranchName { get; set; }
        public string? AccountType { get; set; }
        public string? UpiId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public Farmer Farmer { get; set; } = null!;
    }
}
