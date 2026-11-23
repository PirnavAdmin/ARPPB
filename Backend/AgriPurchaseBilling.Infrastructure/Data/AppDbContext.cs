using Microsoft.EntityFrameworkCore;
using AgriPurchaseBilling.Domain.Entities;

namespace AgriPurchaseBilling.Infrastructure.Data
{

    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Farmer> Farmers => Set<Farmer>();
        public DbSet<Customer> Customers => Set<Customer>();
        public DbSet<CustomerProfileEntity> CustomerProfiles => Set<CustomerProfileEntity>();
        public DbSet<CustomerDeliveryAddressEntity> CustomerDeliveryAddresses => Set<CustomerDeliveryAddressEntity>();
        public DbSet<Middleman> Middleman => Set<Middleman>();
        public DbSet<Vendor> Vendors => Set<Vendor>();
        public DbSet<UserOtp> UserOtps => Set<UserOtp>();
        public DbSet<FarmerBankAccount> FarmerBankAccounts => Set<FarmerBankAccount>();
        public DbSet<FarmerMobileHistory> FarmerMobileHistories => Set<FarmerMobileHistory>();
        public DbSet<UserMobileHistory> UserMobileHistories => Set<UserMobileHistory>();
        public DbSet<MiddlemanProfile> MiddlemanProfiles => Set<MiddlemanProfile>();
        public DbSet<VendorProfile> VendorProfiles => Set<VendorProfile>();
        public DbSet<VendorBankAccount> VendorBankAccounts => Set<VendorBankAccount>();
        public DbSet<MiddlemanLedger> MiddlemanLedgers => Set<MiddlemanLedger>();
        public DbSet<MiddlemanInventory> MiddlemanInventories => Set<MiddlemanInventory>();
        public DbSet<MiddlemanFarmer> MiddlemanFarmers => Set<MiddlemanFarmer>();
        public DbSet<MiddlemanVendor> MiddlemanVendors => Set<MiddlemanVendor>();
        public DbSet<MiddlemanCustomer> MiddlemanCustomers => Set<MiddlemanCustomer>();
        public DbSet<MiddlemanVendorSale> MiddlemanVendorSales => Set<MiddlemanVendorSale>();
        public DbSet<MiddlemanConfirmation> MiddlemanConfirmations => Set<MiddlemanConfirmation>();
        public DbSet<MiddlemanPurchase> MiddlemanPurchases => Set<MiddlemanPurchase>();
        public DbSet<MiddlemanSale> MiddlemanSales => Set<MiddlemanSale>();
        public DbSet<MiddlemanNotification> MiddlemanNotifications => Set<MiddlemanNotification>();
        public DbSet<FarmerCrop> FarmerCrops => Set<FarmerCrop>();
        public DbSet<FarmerCropYieldLog> FarmerCropYieldLogs => Set<FarmerCropYieldLog>();
        public DbSet<FarmerSale> FarmerSales => Set<FarmerSale>();
        public DbSet<FarmerSellProduct> FarmerSellProducts => Set<FarmerSellProduct>();
        public DbSet<FarmerMySale> FarmerMySales => Set<FarmerMySale>();
        public DbSet<FarmerNotification> FarmerNotifications => Set<FarmerNotification>();
        public DbSet<DailyMandiMarketPrice> DailyMandiMarketPrices => Set<DailyMandiMarketPrice>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Users
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users");

                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id)
                    .HasColumnName("Id")
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.FullName)
                    .HasColumnName("FullName")
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Email)
                    .HasColumnName("Email")
                    .IsRequired(false)
                    .HasMaxLength(100);

                entity.HasIndex(e => e.Email)
                    .IsUnique();

                entity.Property(e => e.Mobile)
                    .HasColumnName("Mobile")
                    .IsRequired()
                    .HasMaxLength(10);

                entity.HasIndex(e => e.Mobile)
                    .IsUnique();

                entity.Property(e => e.PasswordHash)
                    .HasColumnName("PasswordHash")
                    .IsRequired()
                    .HasMaxLength(255);

                entity.Property(e => e.Role)
                    .HasColumnName("Role")
                    .IsRequired()
                    .HasMaxLength(20)
                    .HasConversion<string>();

                entity.Property(e => e.IsActive)
                    .HasColumnName("IsActive")
                    .HasDefaultValue(true);

                entity.Property(e => e.CreatedAt)
                    .HasColumnName("CreatedAt")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)");

                entity.Property(e => e.UpdatedAt)
                    .HasColumnName("UpdatedAt")
                    .HasDefaultValueSql(
                        "CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)");

                entity.Property(e => e.FailedLoginAttempts)
                    .HasColumnName("failed_login_attempts")
                    .HasDefaultValue(0);

                entity.Property(e => e.LockoutEnd)
                    .HasColumnName("lockout_end");
            });

            // Farmers
            modelBuilder.Entity<Farmer>(entity =>
            {
                entity.ToTable("Farmers");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id)
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.FarmerCode)
                    .IsRequired()
                    .HasMaxLength(30);

                entity.HasIndex(e => e.FarmerCode)
                    .IsUnique()
                    .HasDatabaseName("IX_Farmers_FarmerCode");

                entity.Property(e => e.UserId).IsRequired();

                entity.HasIndex(e => e.UserId)
                    .IsUnique()
                    .HasDatabaseName("IX_Farmers_UserId");

                entity.HasOne(e => e.User)
                    .WithOne(u => u.Farmer)
                    .HasForeignKey<Farmer>(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Farm Location & Landholding
                entity.Property(e => e.FarmName).HasMaxLength(150);
                entity.Property(e => e.TotalLandArea).HasMaxLength(100);
                entity.Property(e => e.SoilType).HasMaxLength(100);
                entity.Property(e => e.PrimaryCrops).HasMaxLength(255);
                entity.Property(e => e.Village).HasMaxLength(100);
                entity.Property(e => e.Mandal).HasMaxLength(100);
                entity.Property(e => e.District).HasMaxLength(100);
                entity.Property(e => e.State).HasMaxLength(100);
                entity.Property(e => e.PinCode).HasMaxLength(10);
                entity.Property(e => e.Address).HasMaxLength(500);
                entity.Property(e => e.Mobile).HasMaxLength(10);
                entity.Property(e => e.AlternateMobile).HasMaxLength(10);
                entity.HasOne(e => e.BankAccount)
                    .WithOne(b => b.Farmer)
                    .HasForeignKey<FarmerBankAccount>(b => b.FarmerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)");

                entity.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql(
                        "CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)");
            });


            // Customers
            modelBuilder.Entity<Customer>(entity =>
            {
                entity.ToTable("Customers");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id)
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.CustomerCode)
                    .IsRequired()
                    .HasMaxLength(30);

                entity.HasIndex(e => e.CustomerCode)
                    .IsUnique()
                    .HasDatabaseName("IX_Customers_CustomerCode");

                entity.Property(e => e.UserId).IsRequired();

                entity.HasIndex(e => e.UserId)
                    .IsUnique()
                    .HasDatabaseName("IX_Customers_UserId");

                entity.HasOne(e => e.User)
                    .WithOne(u => u.Customer)
                    .HasForeignKey<Customer>(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)");

                entity.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql(
                        "CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)");
            });

            // CustomerProfiles
            modelBuilder.Entity<CustomerProfileEntity>(entity =>
            {
                entity.ToTable("customer_profiles");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
                entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
                entity.HasIndex(e => e.UserId).IsUnique().HasDatabaseName("UQ_customer_profiles_user_id");
                entity.Property(e => e.AlternateMobile).HasColumnName("alternate_mobile").HasMaxLength(15);
                entity.Property(e => e.Address).HasColumnName("address").HasMaxLength(500).HasDefaultValue(string.Empty);
                entity.Property(e => e.District).HasColumnName("district").HasMaxLength(100).HasDefaultValue(string.Empty);
                entity.Property(e => e.State).HasColumnName("state").HasMaxLength(100).HasDefaultValue(string.Empty);
                entity.Property(e => e.PinCode).HasColumnName("pin_code").HasMaxLength(10).HasDefaultValue(string.Empty);
                entity.Property(e => e.ProfilePhoto).HasColumnName("profile_photo");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP(6)");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)");
            });


            // Middleman
            modelBuilder.Entity<Middleman>(entity =>
            {
                entity.ToTable("Middleman");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id)
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.MiddlemanPortalId)
                    .IsRequired()
                    .HasMaxLength(30);

                entity.HasIndex(e => e.MiddlemanPortalId)
                    .IsUnique()
                    .HasDatabaseName("IX_Middleman_MiddlemanPortalId");

                entity.Property(e => e.UserId).IsRequired();

                entity.HasIndex(e => e.UserId)
                    .IsUnique()
                    .HasDatabaseName("IX_Middleman_UserId");

                entity.HasOne(e => e.User)
                    .WithOne(u => u.Middleman)
                    .HasForeignKey<Middleman>(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)");

                entity.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql(
                        "CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)");
            });


            // MiddlemanProfile
            modelBuilder.Entity<MiddlemanProfile>(entity =>
            {
                entity.ToTable("MiddlemanProfiles");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id)
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.MiddlemanPortalId)
                    .IsRequired()
                    .HasMaxLength(30);

                entity.HasIndex(e => e.MiddlemanPortalId)
                    .IsUnique()
                    .HasDatabaseName("IX_MiddlemanProfiles_PortalId");

                entity.Property(e => e.UserId).IsRequired();

                entity.HasIndex(e => e.UserId)
                    .IsUnique()
                    .HasDatabaseName("IX_MiddlemanProfiles_UserId");

                entity.HasOne(e => e.User)
                    .WithOne(u => u.MiddlemanProfile)
                    .HasForeignKey<MiddlemanProfile>(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                // Contact details are mirrored here for the profile record and
                // synchronized with the central Users authentication record.
                entity.Property(e => e.OwnerName)
                    .IsRequired()
                    .HasMaxLength(100);
                entity.Property(e => e.Mobile)
                    .IsRequired()
                    .HasMaxLength(10);
                entity.Property(e => e.Email)
                    .IsRequired(false)
                    .HasMaxLength(100);

                entity.Property(e => e.BusinessLogoUrl).HasMaxLength(500);
                entity.Property(e => e.RegisteredBusinessName)
                    .HasMaxLength(150);

                entity.Property(e => e.RegistrationLicenseNo).HasMaxLength(100);
                entity.Property(e => e.Gstin).HasMaxLength(15);
                entity.Property(e => e.PremisesAddress).HasMaxLength(500);
                entity.Property(e => e.VillageArea).HasMaxLength(100);
                entity.Property(e => e.District).HasMaxLength(100);
                entity.Property(e => e.State).HasMaxLength(100);
                entity.Property(e => e.PinCode).HasMaxLength(6);
                entity.Property(e => e.AccountHolderName).HasMaxLength(150);
                entity.Property(e => e.BankName).HasMaxLength(100);
                entity.Property(e => e.AccountNumber).HasMaxLength(34);
                entity.Property(e => e.IfscCode).HasMaxLength(11);
                entity.Property(e => e.BranchName).HasMaxLength(100);

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)");

                entity.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql(
                        "CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)");
            });


            // Vendors
            modelBuilder.Entity<Vendor>(entity =>
            {
                entity.ToTable("Vendors");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id)
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.VendorCode)
                    .IsRequired()
                    .HasMaxLength(30);

                entity.HasIndex(e => e.VendorCode)
                    .IsUnique()
                    .HasDatabaseName("IX_Vendors_VendorCode");

                entity.Property(e => e.UserId).IsRequired();

                entity.HasIndex(e => e.UserId)
                    .IsUnique()
                    .HasDatabaseName("IX_Vendors_UserId");

                entity.HasOne(e => e.User)
                    .WithOne(u => u.Vendor)
                    .HasForeignKey<Vendor>(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)");

                entity.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql(
                        "CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)");
            });


            // Vendor profile tables are separate from the existing vendor identity table.
            modelBuilder.Entity<VendorProfile>(entity =>
            {
                entity.ToTable("vendor_profiles");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
                entity.Property(e => e.VendorId).HasColumnName("vendor_id");
                entity.Property(e => e.VendorCode).HasColumnName("vendor_code").IsRequired().HasMaxLength(30);
                entity.HasIndex(e => e.VendorCode).IsUnique().HasDatabaseName("UX_vendor_profiles_code");
                entity.HasIndex(e => e.VendorId).IsUnique().HasDatabaseName("UX_vendor_profiles_vendor_id");
                entity.Property(e => e.BusinessName).HasColumnName("business_name").IsRequired().HasMaxLength(200);
                entity.Property(e => e.OwnerName).HasColumnName("owner_name").IsRequired().HasMaxLength(100);
                entity.Property(e => e.Mobile).HasColumnName("mobile").IsRequired().HasMaxLength(10);
                entity.Property(e => e.Email).HasColumnName("email").IsRequired().HasMaxLength(150);
                entity.Property(e => e.Gstin).HasColumnName("gstin").IsRequired(false).HasMaxLength(15);
                entity.Property(e => e.BusinessRegNumber).HasColumnName("business_reg_number").IsRequired().HasMaxLength(50);
                entity.Property(e => e.BusinessType).HasColumnName("business_type").IsRequired().HasMaxLength(100);
                entity.Property(e => e.BusinessAddress).HasColumnName("business_address").IsRequired().HasMaxLength(500);
                entity.Property(e => e.District).HasColumnName("district").IsRequired().HasMaxLength(100);
                entity.Property(e => e.State).HasColumnName("state").IsRequired().HasMaxLength(100);
                entity.Property(e => e.PinCode).HasColumnName("pin_code").IsRequired().HasMaxLength(6);
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.Property(e => e.IsVerified).HasColumnName("is_verified").HasDefaultValue(false);
                entity.Property(e => e.OtpSecurityEnabled).HasColumnName("otp_security_enabled").HasDefaultValue(true);
                entity.Property(e => e.GstBillingEnabled).HasColumnName("gst_billing_enabled").HasDefaultValue(true);
                entity.Property(e => e.ComplianceUpdatedAt).HasColumnName("compliance_updated_at");
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP(6)");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)");
                entity.HasOne(e => e.Vendor)
                    .WithOne(v => v.Profile)
                    .HasForeignKey<VendorProfile>(e => e.VendorId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<VendorBankAccount>(entity =>
            {
                entity.ToTable("vendor_bank_accounts");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
                entity.Property(e => e.VendorProfileId).HasColumnName("vendor_profile_id").IsRequired();
                entity.HasIndex(e => e.VendorProfileId).HasDatabaseName("IX_vendor_bank_accounts_profile");
                entity.Property(e => e.AccountHolderName).HasColumnName("account_holder_name").IsRequired().HasMaxLength(200);
                entity.Property(e => e.BankName).HasColumnName("bank_name").IsRequired().HasMaxLength(150);
                entity.Property(e => e.BranchName).HasColumnName("branch_name").IsRequired().HasMaxLength(150);
                entity.Property(e => e.AccountNumber).HasColumnName("account_number").IsRequired().HasMaxLength(20);
                entity.Property(e => e.IfscCode).HasColumnName("ifsc_code").IsRequired().HasMaxLength(11);
                entity.Property(e => e.IsPrimary).HasColumnName("is_primary").HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP(6)");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)");
                entity.HasOne(e => e.VendorProfile)
                    .WithMany()
                    .HasForeignKey(e => e.VendorProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // OTP verification
            modelBuilder.Entity<UserOtp>(entity =>
            {
                entity.ToTable("otp_verifications");

                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.Email)
                    .HasColumnName("email")
                    .IsRequired(false)
                    .HasMaxLength(150);

                entity.Property(e => e.Mobile)
                    .HasColumnName("mobile")
                    .HasMaxLength(15);

                entity.Property(e => e.OtpHash)
                    .HasColumnName("otp_hash")
                    .IsRequired()
                    .HasMaxLength(255);

                entity.Property(e => e.Purpose)
                    .HasColumnName("purpose")
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.ExpiresAt)
                    .HasColumnName("expires_at")
                    .IsRequired();

                entity.Property(e => e.Attempts)
                    .HasColumnName("attempts")
                    .HasDefaultValue(0);

                entity.Property(e => e.VerifiedAt)
                    .HasColumnName("verified_at");

                entity.Property(e => e.CreatedAt)
                    .HasColumnName("created_at")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)");
            });

            // FarmerBankAccounts
            modelBuilder.Entity<FarmerBankAccount>(entity =>
            {
                entity.ToTable("FarmerBankAccounts");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.FarmerId).IsRequired();
                entity.HasIndex(e => e.FarmerId).IsUnique().HasDatabaseName("IX_FarmerBankAccounts_FarmerId");
                entity.Property(e => e.BankName).HasMaxLength(100);
                entity.Property(e => e.AccountHolderName).HasMaxLength(200);
                entity.Property(e => e.AccountNumber).HasMaxLength(50);
                entity.Property(e => e.IfscCode).HasMaxLength(20);
                entity.Property(e => e.BranchName).HasMaxLength(100);
                entity.Property(e => e.AccountType).HasMaxLength(50);
                entity.Property(e => e.UpiId).HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP(6)");
                entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)");
            });

            // FarmerMobileHistories
            modelBuilder.Entity<FarmerMobileHistory>(entity =>
            {
                entity.ToTable("FarmerMobileHistories");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.FarmerId).IsRequired();
                entity.Property(e => e.UserId).IsRequired();
                entity.Property(e => e.OldMobile).IsRequired().HasMaxLength(10);
                entity.Property(e => e.NewMobile).IsRequired().HasMaxLength(10);
                entity.Property(e => e.OldMobileStatus).IsRequired().HasMaxLength(20).HasDefaultValue("Inactive");
                entity.Property(e => e.NewMobileStatus).IsRequired().HasMaxLength(20).HasDefaultValue("Active");
                entity.Property(e => e.ChangedAt).HasDefaultValueSql("CURRENT_TIMESTAMP(6)");
                entity.HasOne(e => e.Farmer)
                    .WithMany()
                    .HasForeignKey(e => e.FarmerId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // CustomerDeliveryAddresses
            modelBuilder.Entity<CustomerDeliveryAddressEntity>(entity =>
            {
                entity.ToTable("customer_delivery_addresses");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
                entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
                entity.Property(e => e.AddressName).HasColumnName("address_name").HasMaxLength(150).IsRequired();
                entity.Property(e => e.ContactPerson).HasColumnName("contact_person").HasMaxLength(100).IsRequired();
                entity.Property(e => e.PhoneNumber).HasColumnName("phone_number").HasMaxLength(15).IsRequired();
                entity.Property(e => e.FullAddress).HasColumnName("full_address").HasMaxLength(500).IsRequired();
                entity.Property(e => e.District).HasColumnName("district").HasMaxLength(100).IsRequired();
                entity.Property(e => e.State).HasColumnName("state").HasMaxLength(100).IsRequired();
                entity.Property(e => e.PinCode).HasColumnName("pin_code").HasMaxLength(10).IsRequired();
                entity.Property(e => e.IsDefault).HasColumnName("is_default").HasDefaultValue(false);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP(6)");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)");
                entity.HasIndex(e => new { e.UserId, e.IsDefault }).HasDatabaseName("IX_customer_delivery_addresses_user_default");
            });

            // UserMobileHistories
            modelBuilder.Entity<UserMobileHistory>(entity =>
            {
                entity.ToTable("UserMobileHistories");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).ValueGeneratedOnAdd();
                entity.Property(e => e.UserId).IsRequired();
                entity.Property(e => e.OldMobile).IsRequired().HasMaxLength(10);
                entity.Property(e => e.NewMobile).IsRequired().HasMaxLength(10);
                entity.Property(e => e.OldMobileStatus).IsRequired().HasMaxLength(20).HasDefaultValue("Inactive");
                entity.Property(e => e.NewMobileStatus).IsRequired().HasMaxLength(20).HasDefaultValue("Active");
                entity.Property(e => e.ChangedAt).HasDefaultValueSql("CURRENT_TIMESTAMP(6)");
                entity.HasOne(e => e.User)
                    .WithMany(u => u.MobileHistories)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // FarmerCrops
            modelBuilder.Entity<FarmerCrop>(entity =>
            {
                entity.ToTable("farmer_crops");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
                entity.Property(e => e.CropCode).HasColumnName("crop_code").IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.CropCode).IsUnique().HasDatabaseName("uk_crop_code");
                entity.Property(e => e.FarmerId).HasColumnName("farmer_id").IsRequired();
                entity.HasIndex(e => e.FarmerId).HasDatabaseName("idx_farmer_id");
                entity.Property(e => e.CropName).HasColumnName("crop_name").IsRequired().HasMaxLength(100);
                entity.Property(e => e.CropCategory).HasColumnName("crop_category").IsRequired().HasMaxLength(60);
                entity.Property(e => e.CropVariety).HasColumnName("crop_variety").IsRequired().HasMaxLength(150);
                entity.Property(e => e.Season).HasColumnName("season").IsRequired().HasMaxLength(50);
                entity.Property(e => e.CultivationAreaAcres).HasColumnName("cultivation_area_acres").HasPrecision(8, 2);
                entity.Property(e => e.HarvestDate).HasColumnName("harvest_date");
                entity.Property(e => e.HarvestedQuantity).HasColumnName("harvested_quantity").HasPrecision(12, 2);
                entity.Property(e => e.AvailableQuantity).HasColumnName("available_quantity").HasPrecision(12, 2);
                entity.Property(e => e.SoldQuantity).HasColumnName("sold_quantity").HasPrecision(12, 2).HasDefaultValue(0.00m);
                entity.Property(e => e.Unit).HasColumnName("unit").HasMaxLength(20).HasDefaultValue("Quintals");
                entity.Property(e => e.ExpectedSellingPrice).HasColumnName("expected_selling_price").HasPrecision(12, 2);
                entity.Property(e => e.QualityGrade).HasColumnName("quality_grade").HasMaxLength(100);
                entity.Property(e => e.StorageLocation).HasColumnName("storage_location").IsRequired().HasMaxLength(255);
                entity.Property(e => e.CropDescription).HasColumnName("crop_description");
                entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("Ready to Sell");
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

                entity.HasOne(e => e.Farmer)
                    .WithMany()
                    .HasForeignKey(e => e.FarmerId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // FarmerCropYieldLogs
            modelBuilder.Entity<FarmerCropYieldLog>(entity =>
            {
                entity.ToTable("farmer_crop_yield_logs");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
                entity.Property(e => e.FarmerCropId).HasColumnName("farmer_crop_id").IsRequired();
                entity.HasIndex(e => e.FarmerCropId).HasDatabaseName("idx_yield_crop_id");
                entity.Property(e => e.AdditionalQuantity).HasColumnName("additional_quantity").HasPrecision(12, 2).IsRequired();
                entity.Property(e => e.PreviousAvailableQuantity).HasColumnName("previous_available_quantity").HasPrecision(12, 2).IsRequired();
                entity.Property(e => e.NewAvailableQuantity).HasColumnName("new_available_quantity").HasPrecision(12, 2).IsRequired();
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(e => e.FarmerCrop)
                    .WithMany()
                    .HasForeignKey(e => e.FarmerCropId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // FarmerSales
            modelBuilder.Entity<FarmerSale>(entity =>
            {
                entity.ToTable("farmer_sales");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
                entity.Property(e => e.SaleCode).HasColumnName("sale_code").IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.SaleCode).IsUnique().HasDatabaseName("uk_sale_code");
                entity.Property(e => e.FarmerId).HasColumnName("farmer_id").IsRequired();
                entity.HasIndex(e => e.FarmerId).HasDatabaseName("idx_sales_farmer_id");
                entity.Property(e => e.CropId).HasColumnName("crop_id").IsRequired();
                entity.HasIndex(e => e.CropId).HasDatabaseName("idx_sales_crop_id");
                entity.Property(e => e.BuyerCategory).HasColumnName("buyer_category").IsRequired().HasMaxLength(50);
                entity.Property(e => e.BuyerName).HasColumnName("buyer_name").IsRequired().HasMaxLength(150);
                entity.Property(e => e.BuyerMobile).HasColumnName("buyer_mobile").IsRequired().HasMaxLength(15);
                entity.HasIndex(e => e.BuyerMobile).HasDatabaseName("idx_sales_buyer_mobile");
                entity.Property(e => e.CropName).HasColumnName("crop_name").IsRequired().HasMaxLength(100);
                entity.Property(e => e.CropVariety).HasColumnName("crop_variety").IsRequired().HasMaxLength(150);
                entity.Property(e => e.QualityGrade).HasColumnName("quality_grade").HasMaxLength(100);
                entity.Property(e => e.SellingQuantity).HasColumnName("selling_quantity").HasPrecision(12, 2);
                entity.Property(e => e.Unit).HasColumnName("unit").HasMaxLength(30).HasDefaultValue("Quintals");
                entity.Property(e => e.PricePerUnit).HasColumnName("price_per_unit").HasPrecision(12, 2);
                entity.Property(e => e.TotalAmount).HasColumnName("total_amount").HasPrecision(14, 2);
                entity.Property(e => e.PickupLocation).HasColumnName("pickup_location").IsRequired().HasMaxLength(255);
                entity.Property(e => e.ExpectedPickupDate).HasColumnName("expected_pickup_date");
                entity.Property(e => e.Notes).HasColumnName("notes");
                entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("Pending OTP Confirmation");
                entity.HasIndex(e => e.Status).HasDatabaseName("idx_sales_status");
                entity.Property(e => e.OtpCode).HasColumnName("otp_code").HasMaxLength(10);
                entity.Property(e => e.OtpStatus).HasColumnName("otp_status").HasMaxLength(20).HasDefaultValue("Pending");
                entity.Property(e => e.OtpExpiresAt).HasColumnName("otp_expires_at");
                entity.Property(e => e.ConfirmedAt).HasColumnName("confirmed_at");
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

                entity.HasOne(e => e.Farmer)
                    .WithMany()
                    .HasForeignKey(e => e.FarmerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.FarmerCrop)
                    .WithMany()
                    .HasForeignKey(e => e.CropId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // FarmerSellProducts (Table: farmer_sell_products)
            modelBuilder.Entity<FarmerSellProduct>(entity =>
            {
                entity.ToTable("farmer_sell_products");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
                entity.Property(e => e.SaleCode).HasColumnName("sale_code").IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.SaleCode).IsUnique().HasDatabaseName("ux_farmer_sell_products_code");
                entity.Property(e => e.FarmerId).HasColumnName("farmer_id").IsRequired();
                entity.HasIndex(e => e.FarmerId).HasDatabaseName("ix_farmer_sell_products_farmer");
                entity.Property(e => e.CropId).HasColumnName("crop_id").IsRequired();
                entity.HasIndex(e => e.CropId).HasDatabaseName("ix_farmer_sell_products_crop");
                entity.Property(e => e.BuyerCategory).HasColumnName("buyer_category").IsRequired().HasMaxLength(50);
                entity.Property(e => e.BuyerName).HasColumnName("buyer_name").IsRequired().HasMaxLength(150);
                entity.Property(e => e.BuyerMobile).HasColumnName("buyer_mobile").IsRequired().HasMaxLength(20);
                entity.Property(e => e.CropName).HasColumnName("crop_name").IsRequired().HasMaxLength(100);
                entity.Property(e => e.CropVariety).HasColumnName("crop_variety").IsRequired().HasMaxLength(100);
                entity.Property(e => e.QualityGrade).HasColumnName("quality_grade").HasMaxLength(100);
                entity.Property(e => e.SellingQuantity).HasColumnName("selling_quantity").HasPrecision(12, 2);
                entity.Property(e => e.Unit).HasColumnName("unit").HasMaxLength(50).HasDefaultValue("Quintals");
                entity.Property(e => e.PricePerUnit).HasColumnName("price_per_unit").HasPrecision(12, 2);
                entity.Property(e => e.TotalAmount).HasColumnName("total_amount").HasPrecision(14, 2);
                entity.Property(e => e.PickupLocation).HasColumnName("pickup_location").IsRequired().HasMaxLength(255);
                entity.Property(e => e.ExpectedPickupDate).HasColumnName("expected_pickup_date");
                entity.Property(e => e.Notes).HasColumnName("notes");
                entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("Pending OTP Confirmation");
                entity.Property(e => e.OtpCode).HasColumnName("otp_code").HasMaxLength(10);
                entity.Property(e => e.OtpStatus).HasColumnName("otp_status").HasMaxLength(50).HasDefaultValue("Pending");
                entity.Property(e => e.OtpExpiresAt).HasColumnName("otp_expires_at");
                entity.Property(e => e.ConfirmedAt).HasColumnName("confirmed_at");
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

                entity.HasOne(e => e.Farmer)
                    .WithMany()
                    .HasForeignKey(e => e.FarmerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.FarmerCrop)
                    .WithMany()
                    .HasForeignKey(e => e.CropId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // FarmerMySales (Table: farmer_my_sales)
            modelBuilder.Entity<FarmerMySale>(entity =>
            {
                entity.ToTable("farmer_my_sales");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
                entity.Property(e => e.SellProductId).HasColumnName("sell_product_id");
                entity.Property(e => e.SaleCode).HasColumnName("sale_code").IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.SaleCode).IsUnique().HasDatabaseName("ux_farmer_my_sales_code");
                entity.Property(e => e.FarmerId).HasColumnName("farmer_id").IsRequired();
                entity.HasIndex(e => e.FarmerId).HasDatabaseName("ix_farmer_my_sales_farmer");
                entity.Property(e => e.CropId).HasColumnName("crop_id").IsRequired();
                entity.HasIndex(e => e.CropId).HasDatabaseName("ix_farmer_my_sales_crop");
                entity.Property(e => e.CropName).HasColumnName("crop_name").IsRequired().HasMaxLength(100);
                entity.Property(e => e.CropVariety).HasColumnName("crop_variety").IsRequired().HasMaxLength(100);
                entity.Property(e => e.QualityGrade).HasColumnName("quality_grade").HasMaxLength(100);
                entity.Property(e => e.BuyerCategory).HasColumnName("buyer_category").IsRequired().HasMaxLength(50);
                entity.Property(e => e.BuyerName).HasColumnName("buyer_name").IsRequired().HasMaxLength(150);
                entity.Property(e => e.BuyerMobile).HasColumnName("buyer_mobile").IsRequired().HasMaxLength(20);
                entity.Property(e => e.QuantityDispatched).HasColumnName("quantity_dispatched").HasPrecision(12, 2);
                entity.Property(e => e.Unit).HasColumnName("unit").HasMaxLength(50).HasDefaultValue("Quintals");
                entity.Property(e => e.SellingRate).HasColumnName("selling_rate").HasPrecision(12, 2);
                entity.Property(e => e.TotalRevenue).HasColumnName("total_revenue").HasPrecision(14, 2);
                entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("Confirmed");
                entity.Property(e => e.PaymentStatus).HasColumnName("payment_status").HasMaxLength(50).HasDefaultValue("Pending");
                entity.Property(e => e.DeliveryStatus).HasColumnName("delivery_status").HasMaxLength(50).HasDefaultValue("Scheduled");
                entity.Property(e => e.PickupLocation).HasColumnName("pickup_location").IsRequired().HasMaxLength(255);
                entity.Property(e => e.ExpectedPaymentDate).HasColumnName("expected_payment_date");
                entity.Property(e => e.ConfirmedAt).HasColumnName("confirmed_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.Notes).HasColumnName("notes");
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

                entity.HasOne(e => e.Farmer)
                    .WithMany()
                    .HasForeignKey(e => e.FarmerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.FarmerCrop)
                    .WithMany()
                    .HasForeignKey(e => e.CropId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // 17. Farmer Notifications
            modelBuilder.Entity<FarmerNotification>(entity =>
            {
                entity.ToTable("farmer_notifications");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.NotificationCode).HasColumnName("notification_code").HasMaxLength(50).IsRequired();
                entity.Property(e => e.FarmerId).HasColumnName("farmer_id").IsRequired();
                entity.Property(e => e.Title).HasColumnName("title").HasMaxLength(200).IsRequired();
                entity.Property(e => e.Detail).HasColumnName("detail").IsRequired();
                entity.Property(e => e.Category).HasColumnName("category").HasMaxLength(50).HasDefaultValue("general");
                entity.Property(e => e.Type).HasColumnName("type").HasMaxLength(50).HasDefaultValue("info");
                entity.Property(e => e.TargetPage).HasColumnName("target_page").HasMaxLength(50);
                entity.Property(e => e.TargetId).HasColumnName("target_id").HasMaxLength(100);
                entity.Property(e => e.IsRead).HasColumnName("is_read").HasDefaultValue(false);
                entity.Property(e => e.ReadAt).HasColumnName("read_at");
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
            });

            // 18. Daily Mandi Market Prices
            modelBuilder.Entity<DailyMandiMarketPrice>(entity =>
            {
                entity.ToTable("daily_mandi_market_prices");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.PriceCode).HasColumnName("price_code").HasMaxLength(50).IsRequired();
                entity.Property(e => e.Crop).HasColumnName("crop").HasMaxLength(100).IsRequired();
                entity.Property(e => e.Category).HasColumnName("category").HasMaxLength(50).HasDefaultValue("Cereal");
                entity.Property(e => e.Market).HasColumnName("market").HasMaxLength(150).IsRequired();
                entity.Property(e => e.State).HasColumnName("state").HasMaxLength(50).HasDefaultValue("AP");
                entity.Property(e => e.Location).HasColumnName("location").HasMaxLength(200);
                entity.Property(e => e.TodayPrice).HasColumnName("today_price").HasPrecision(12, 2);
                entity.Property(e => e.PrevPrice).HasColumnName("prev_price").HasPrecision(12, 2);
                entity.Property(e => e.DailyChange).HasColumnName("daily_change").HasMaxLength(20);
                entity.Property(e => e.Trend).HasColumnName("trend").HasMaxLength(20).HasDefaultValue("up");
                entity.Property(e => e.MinPrice).HasColumnName("min_price").HasPrecision(12, 2);
                entity.Property(e => e.MaxPrice).HasColumnName("max_price").HasPrecision(12, 2);
                entity.Property(e => e.AvgPrice).HasColumnName("avg_price").HasPrecision(12, 2);
                entity.Property(e => e.Unit).HasColumnName("unit").HasMaxLength(50).HasDefaultValue("qtl");
                entity.Property(e => e.PriceHistory).HasColumnName("price_history");
                entity.Property(e => e.UpdatedLabel).HasColumnName("updated_label").HasMaxLength(100);
                entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("CURRENT_TIMESTAMP");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
            });
        }
    }
}