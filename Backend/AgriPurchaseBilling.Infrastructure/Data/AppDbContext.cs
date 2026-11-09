
using Microsoft.EntityFrameworkCore;
using AgriPurchaseBilling.Domain.Entities;

namespace AgriPurchaseBilling.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Farmer> Farmers => Set<Farmer>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Vendor> Vendors => Set<Vendor>();
    public DbSet<UserOtp> UserOtps => Set<UserOtp>();

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

        // Suppliers
        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.ToTable("Suppliers");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd();

            entity.Property(e => e.SupplierCode)
                .IsRequired()
                .HasMaxLength(30);

            entity.HasIndex(e => e.SupplierCode)
                .IsUnique()
                .HasDatabaseName("IX_Suppliers_SupplierCode");

            entity.Property(e => e.UserId).IsRequired();

            entity.HasIndex(e => e.UserId)
                .IsUnique()
                .HasDatabaseName("IX_Suppliers_UserId");

            entity.HasOne(e => e.User)
                .WithOne(u => u.Supplier)
                .HasForeignKey<Supplier>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

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
    }
}
