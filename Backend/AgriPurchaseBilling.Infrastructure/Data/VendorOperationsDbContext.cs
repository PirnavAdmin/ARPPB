using AgriPurchaseBilling.Domain.Entities.VendorOperations;
using Microsoft.EntityFrameworkCore;

namespace AgriPurchaseBilling.Infrastructure.Data
{
    public class VendorOperationsDbContext : DbContext
    {
        public VendorOperationsDbContext(DbContextOptions<VendorOperationsDbContext> options)
            : base(options)
        {
        }

        public DbSet<VendorFarmer> Farmers => Set<VendorFarmer>();
        public DbSet<VendorFarmerPurchase> FarmerPurchases => Set<VendorFarmerPurchase>();
        public DbSet<VendorFarmerPayment> FarmerPayments => Set<VendorFarmerPayment>();
        public DbSet<VendorFarmerOtpLog> FarmerOtpLogs => Set<VendorFarmerOtpLog>();

        public DbSet<VendorMiddleman> Middlemen => Set<VendorMiddleman>();
        public DbSet<VendorMiddlemanPurchase> MiddlemanPurchases => Set<VendorMiddlemanPurchase>();
        public DbSet<VendorMiddlemanPayment> MiddlemanPayments => Set<VendorMiddlemanPayment>();
        public DbSet<VendorMiddlemanOtpLog> MiddlemanOtpLogs => Set<VendorMiddlemanOtpLog>();

        public DbSet<VendorCustomer> Customers => Set<VendorCustomer>();
        public DbSet<VendorCustomerOrder> CustomerOrders => Set<VendorCustomerOrder>();

        public DbSet<VendorRawMaterialStock> RawMaterialStocks => Set<VendorRawMaterialStock>();
        public DbSet<VendorStockMovement> StockMovements => Set<VendorStockMovement>();

        public DbSet<VendorProcessingBatch> ProcessingBatches => Set<VendorProcessingBatch>();
        public DbSet<VendorProcessingOutput> ProcessingOutputs => Set<VendorProcessingOutput>();

        public DbSet<VendorFinishedProduct> FinishedProducts => Set<VendorFinishedProduct>();
        public DbSet<VendorFinishedProductMovement> FinishedProductMovements => Set<VendorFinishedProductMovement>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Farmers
            modelBuilder.Entity<VendorFarmer>(entity =>
            {
                entity.ToTable("vendor_farmers");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.VendorId, e.FarmerCode }).IsUnique();
                entity.Property(e => e.LandAcres).HasPrecision(10, 2);

                entity.HasMany(e => e.Purchases)
                    .WithOne(p => p.Farmer)
                    .HasForeignKey(p => p.FarmerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.Payments)
                    .WithOne(p => p.Farmer)
                    .HasForeignKey(p => p.FarmerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.OtpLogs)
                    .WithOne(p => p.Farmer)
                    .HasForeignKey(p => p.FarmerId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<VendorFarmerPurchase>(entity =>
            {
                entity.ToTable("vendor_farmer_purchases");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Quantity).HasPrecision(12, 2);
                entity.Property(e => e.RatePerUnit).HasPrecision(12, 2);
                entity.Property(e => e.TotalAmount).HasPrecision(14, 2);
                entity.Property(e => e.DueAmount).HasPrecision(14, 2);
            });

            modelBuilder.Entity<VendorFarmerPayment>(entity =>
            {
                entity.ToTable("vendor_farmer_payments");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Amount).HasPrecision(14, 2);
            });

            modelBuilder.Entity<VendorFarmerOtpLog>(entity =>
            {
                entity.ToTable("vendor_farmer_otp_logs");
                entity.HasKey(e => e.Id);
            });

            // Middlemen
            modelBuilder.Entity<VendorMiddleman>(entity =>
            {
                entity.ToTable("vendor_middlemen");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.VendorId, e.MiddlemanCode }).IsUnique();
                entity.Property(e => e.OpeningBalance).HasPrecision(14, 2);

                entity.HasMany(e => e.Purchases)
                    .WithOne(p => p.Middleman)
                    .HasForeignKey(p => p.MiddlemanId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.Payments)
                    .WithOne(p => p.Middleman)
                    .HasForeignKey(p => p.MiddlemanId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.OtpLogs)
                    .WithOne(p => p.Middleman)
                    .HasForeignKey(p => p.MiddlemanId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<VendorMiddlemanPurchase>(entity =>
            {
                entity.ToTable("vendor_middleman_purchases");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Quantity).HasPrecision(12, 2);
                entity.Property(e => e.RatePerUnit).HasPrecision(12, 2);
                entity.Property(e => e.TotalAmount).HasPrecision(14, 2);
                entity.Property(e => e.DueAmount).HasPrecision(14, 2);
            });

            modelBuilder.Entity<VendorMiddlemanPayment>(entity =>
            {
                entity.ToTable("vendor_middleman_payments");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Amount).HasPrecision(14, 2);
            });

            modelBuilder.Entity<VendorMiddlemanOtpLog>(entity =>
            {
                entity.ToTable("vendor_middleman_otp_logs");
                entity.HasKey(e => e.Id);
            });

            // Customers
            modelBuilder.Entity<VendorCustomer>(entity =>
            {
                entity.ToTable("vendor_customers");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.VendorId, e.CustomerCode }).IsUnique();
                entity.Property(e => e.CreditLimit).HasPrecision(14, 2);

                entity.HasMany(e => e.Orders)
                    .WithOne(p => p.Customer)
                    .HasForeignKey(p => p.CustomerId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<VendorCustomerOrder>(entity =>
            {
                entity.ToTable("vendor_customer_orders");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Quantity).HasPrecision(12, 2);
                entity.Property(e => e.TotalAmount).HasPrecision(14, 2);
                entity.Property(e => e.DueAmount).HasPrecision(14, 2);
            });

            // Raw Material Stock
            modelBuilder.Entity<VendorRawMaterialStock>(entity =>
            {
                entity.ToTable("vendor_raw_material_stocks");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.VendorId, e.StockCode }).IsUnique();
                entity.Property(e => e.PurchasedQuantity).HasPrecision(12, 2);
                entity.Property(e => e.ProcessedQuantity).HasPrecision(12, 2);
                entity.Property(e => e.AvailableQuantity).HasPrecision(12, 2);
                entity.Property(e => e.AverageCost).HasPrecision(14, 2);
                entity.Property(e => e.MinThresholdQuantity).HasPrecision(12, 2);

                entity.HasMany(e => e.Movements)
                    .WithOne(p => p.Stock)
                    .HasForeignKey(p => p.StockId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<VendorStockMovement>(entity =>
            {
                entity.ToTable("vendor_stock_movements");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.QuantityChange).HasPrecision(12, 2);
                entity.Property(e => e.BalanceAfter).HasPrecision(12, 2);
            });

            // Processing Batches
            modelBuilder.Entity<VendorProcessingBatch>(entity =>
            {
                entity.ToTable("vendor_processing_batches");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.VendorId, e.ProcessingCode }).IsUnique();
                entity.Property(e => e.InputQuantity).HasPrecision(12, 2);
                entity.Property(e => e.WastageQuantity).HasPrecision(12, 2);
                entity.Property(e => e.WastagePercentage).HasPrecision(6, 2);
                entity.Property(e => e.ProcessingExpenses).HasPrecision(14, 2);
                entity.Property(e => e.TotalBatchCost).HasPrecision(14, 2);
                entity.Property(e => e.UnitCost).HasPrecision(14, 2);

                entity.HasMany(e => e.Outputs)
                    .WithOne(p => p.ProcessingBatch)
                    .HasForeignKey(p => p.ProcessingBatchId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<VendorProcessingOutput>(entity =>
            {
                entity.ToTable("vendor_processing_outputs");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.OutputQuantity).HasPrecision(12, 2);
            });

            // Finished Products
            modelBuilder.Entity<VendorFinishedProduct>(entity =>
            {
                entity.ToTable("vendor_finished_products");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.VendorId, e.ProductCode }).IsUnique();
                entity.Property(e => e.AvailableQuantity).HasPrecision(12, 2);
                entity.Property(e => e.SoldQuantity).HasPrecision(12, 2);
                entity.Property(e => e.ProductionCost).HasPrecision(14, 2);
                entity.Property(e => e.SellingPrice).HasPrecision(14, 2);
                entity.Property(e => e.ProfitMarginPercentage).HasPrecision(6, 2);
                entity.Property(e => e.MinThresholdQuantity).HasPrecision(12, 2);

                entity.HasMany(e => e.Movements)
                    .WithOne(p => p.FinishedProduct)
                    .HasForeignKey(p => p.FinishedProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<VendorFinishedProductMovement>(entity =>
            {
                entity.ToTable("vendor_finished_product_movements");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.QuantityChange).HasPrecision(12, 2);
                entity.Property(e => e.BalanceAfter).HasPrecision(12, 2);
            });
        }
    }
}
