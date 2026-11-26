using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Application.Services;
using AgriPurchaseBilling.Application.Validators;
using AgriPurchaseBilling.Infrastructure.Configuration;
using AgriPurchaseBilling.Infrastructure.Data;
using AgriPurchaseBilling.Infrastructure.Repositories;
using AgriPurchaseBilling.Infrastructure.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using System.Text.Json.Serialization;
using System.Security.Cryptography;

var builder = WebApplication.CreateBuilder(args);


// AUTOMATIC JWT SECRET GENERATION

var configuredJwtSecret =
    builder.Configuration["JwtSettings:SecretKey"];

string jwtSecret;

if (!string.IsNullOrWhiteSpace(configuredJwtSecret) &&
    !configuredJwtSecret.StartsWith(
        "REPLACE_WITH_",
        StringComparison.OrdinalIgnoreCase))
{
    // Use an existing configured secret.
    jwtSecret = configuredJwtSecret;
}
else if (builder.Environment.IsDevelopment())
{
    // Automatically generate and save a secret for development.
    jwtSecret = GetOrCreateJwtSecret();

    // Make the generated secret available to the entire application.
    builder.Configuration["JwtSettings:SecretKey"] = jwtSecret;

    Console.WriteLine(
        "ARPPB: JWT secret loaded successfully.");
}
else
{
    throw new InvalidOperationException(
        "Configure a secure JWT secret for production.");
}


// DATABASE CONNECTION
var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Database connection string is missing.");
}

var serverVersion = new MariaDbServerVersion(
    new Version(11, 8, 9));

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        connectionString,
        serverVersion,
        mySqlOptions => mySqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorNumbersToAdd: null)));
builder.Services.AddCustomerProfileModule();
builder.Services.AddFarmerCropsModule();
builder.Services.AddVendorOperationsModule(connectionString);
builder.Services.AddVendorPortalModule();
builder.Services.AddScoped<AgriPurchaseBilling.Api.Controllers.VendorPortal.VendorPortalExceptionFilter>();
builder.Services.AddFarmerSalesModule();
builder.Services.AddFarmerNotificationsModule();
builder.Services.AddFarmerMarketPricesModule();

// REPOSITORY REGISTRATIONS
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IOtpRepository, OtpRepository>();
builder.Services.AddScoped<IFarmerProfileRepository, FarmerProfileRepository>();
builder.Services.AddScoped<IVendorProfileRepository, VendorProfileRepository>();
builder.Services.AddScoped<ICustomerMarketplaceRepository, CustomerMarketplaceRepository>();
builder.Services.AddScoped<ICustomerPurchaseHistoryRepository, CustomerPurchaseHistoryRepository>();
builder.Services.AddScoped<ICustomerNotificationRepository, CustomerNotificationRepository>();
builder.Services.AddScoped<ICustomerCartRepository, CustomerCartRepository>();
builder.Services.AddScoped<ICustomerDashboardRepository, CustomerDashboardRepository>();
builder.Services.AddScoped<ICustomerOrderRepository, CustomerOrderRepository>();
builder.Services.AddScoped<ICustomerOtpRepository, CustomerOtpRepository>();
builder.Services.AddScoped<IMiddlemanNotificationRepository, MiddlemanNotificationRepository>();

// SERVICE REGISTRATIONS
builder.Services.AddScoped<IRegistrationService, RegistrationService>();
builder.Services.AddScoped<ILoginService, LoginService>();
builder.Services.AddScoped<IRefreshTokenService, RefreshTokenService>();
builder.Services.AddScoped<IOtpService>(serviceProvider =>
    new OtpService(
        serviceProvider.GetRequiredService<IOtpRepository>(),
        serviceProvider.GetRequiredService<IPasswordHasher>(),
        serviceProvider.GetRequiredService<IUserRepository>(),
        serviceProvider.GetRequiredService<IEmailService>(),
        builder.Environment.IsDevelopment()));
builder.Services.AddScoped<IForgotPasswordService, ForgotPasswordService>();
builder.Services.AddScoped<IEmailService, SmtpEmailService>();
builder.Services.AddScoped<IFarmerProfileService, FarmerProfileService>();
builder.Services.AddScoped<IMiddlemanProfileService, MiddlemanProfileService>();
builder.Services.AddScoped<IVendorProfileService, VendorProfileService>();
builder.Services.AddScoped<IVendorMobileChangeService, VendorMobileChangeService>();
builder.Services.AddScoped<ICustomerMarketplaceService, CustomerMarketplaceService>();
builder.Services.AddScoped<ICustomerPurchaseHistoryService, CustomerPurchaseHistoryService>();
builder.Services.AddScoped<ICustomerNotificationService, CustomerNotificationService>();
builder.Services.AddScoped<ICustomerCartService, CustomerCartService>();
builder.Services.AddScoped<ICustomerDashboardService, CustomerDashboardService>();
builder.Services.AddScoped<ICustomerOrderService, CustomerOrderService>();
builder.Services.AddScoped<ICustomerOtpService, CustomerOtpService>();
builder.Services.AddScoped<IMiddlemanNotificationService, MiddlemanNotificationService>();
builder.Services.AddScoped<IMiddlemanLedgerService, MiddlemanLedgerService>();
builder.Services.AddScoped<IMiddlemanDashboardService, MiddlemanDashboardService>();
builder.Services.AddScoped<IMiddlemanInventoryService, MiddlemanInventoryService>();
builder.Services.AddScoped<IMiddlemanFarmerService, MiddlemanFarmerService>();
builder.Services.AddScoped<IMiddlemanPurchaseService, MiddlemanPurchaseService>();
builder.Services.AddScoped<IMiddlemanVendorService, MiddlemanVendorService>();
builder.Services.AddScoped<IMiddlemanCustomerService, MiddlemanCustomerService>();
builder.Services.AddScoped<IMiddlemanConfirmationsService, MiddlemanConfirmationsService>();

// JWT registration
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

// FLUENT VALIDATION
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();

// CONTROLLERS AND JSON
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter());
    });

// JWT AUTHENTICATION

byte[] jwtKeyBytes =
    Convert.FromBase64String(jwtSecret);

if (jwtKeyBytes.Length < 32)
{
    throw new InvalidOperationException(
        "JWT key must contain at least 32 random bytes.");
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme =
        JwtBearerDefaults.AuthenticationScheme;

    options.DefaultChallengeScheme =
        JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters =
        new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer =
                builder.Configuration["JwtSettings:Issuer"],

            ValidAudience =
                builder.Configuration["JwtSettings:Audience"],

            IssuerSigningKey =
                new SymmetricSecurityKey(jwtKeyBytes),

            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.Name,

            ClockSkew = TimeSpan.FromSeconds(30)
        };
});

builder.Services.AddAuthorization();


// SWAGGER SERVICES
builder.Services.AddEndpointsApiExplorer();


builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Agri Raw Product Purchase & Billing (ARPPB) API",
        Version = "v1",
        Description = "Registration, login, OTP and password recovery APIs."
    });

    // JWT Bearer Authentication
    options.AddSecurityDefinition("Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Enter your JWT access token."
        });

    // Apply JWT Authentication globally in Swagger
    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });

    // Clean and unified Middleman module endpoints in Swagger UI
    options.DocumentFilter<AgriPurchaseBilling.Api.Filters.MiddlemanCanonicalSwaggerFilter>();
});


// BUILD APPLICATION
var app = builder.Build();

// Honor ngrok / reverse-proxy headers so Swagger works on both local and public URLs
app.UseForwardedHeaders(new Microsoft.AspNetCore.Builder.ForwardedHeadersOptions
{
    ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor
                     | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
                     | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedHost
});
// SWAGGER MIDDLEWARE
app.UseSwagger();

app.UseSwaggerUI(options =>
{
    options.RoutePrefix = "swagger";
    // Relative path (no leading slash) works under both localhost and ngrok
    options.SwaggerEndpoint(
        "v1/swagger.json",
        "ARPPB API v1");
});

// APPLICATION MIDDLEWARE
// HTTPS redirection is omitted while testing on HTTP port 5034.
app.UseAuthentication();
app.UseAuthorization();

// MAP CONTROLLERS
app.MapControllers();

// REDIRECT ROOT TO SWAGGER UI (Supports GET and HEAD for tunnel/health probes)
app.MapMethods("/", new[] { "GET", "HEAD" }, () => Results.Redirect("/swagger")).ExcludeFromDescription();

// ENSURE FARMER SALES TABLES EXIST
await app.EnsureFarmerSalesTablesAsync();

// RUN
app.Run();


static string GetOrCreateJwtSecret()
{
    string folderPath = Path.Combine(
        Environment.GetFolderPath(
            Environment.SpecialFolder.LocalApplicationData),
        "ARPPB");

    string filePath = Path.Combine(
        folderPath,
        "jwt-signing-key.txt");

    Directory.CreateDirectory(folderPath);

    // Reuse existing key.
    if (File.Exists(filePath))
    {
        string existingKey = File.ReadAllText(filePath).Trim();

        byte[] existingBytes =
            Convert.FromBase64String(existingKey);

        if (existingBytes.Length < 32)
        {
            throw new InvalidOperationException(
                "Existing JWT key is invalid.");
        }

        return existingKey;
    }

    // Generate a new 32-byte random key.
    byte[] keyBytes = new byte[32];

    using (var rng = RandomNumberGenerator.Create())
    {
        rng.GetBytes(keyBytes);
    }

    string generatedKey =
        Convert.ToBase64String(keyBytes);

    // Create the file only if it does not already exist.
    try
    {
        using (var stream = new FileStream(
            filePath,
            FileMode.CreateNew,
            FileAccess.Write,
            FileShare.None))
        using (var writer = new StreamWriter(stream))
        {
            writer.Write(generatedKey);
        }

        Console.WriteLine(
            "ARPPB: New JWT secret generated and saved.");
    }
    catch (IOException) when (File.Exists(filePath))
    {
        // Another application instance may have created it.
        generatedKey = File.ReadAllText(filePath).Trim();

        if (Convert.FromBase64String(generatedKey).Length < 32)
        {
            throw new InvalidOperationException(
                "Existing JWT key is invalid.");
        }
    }

    return generatedKey;
}
