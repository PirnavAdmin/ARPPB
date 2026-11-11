
using System.Text.Json.Serialization;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Application.Services;
using AgriPurchaseBilling.Application.Validators;

using AgriPurchaseBilling.Infrastructure.Data;
using AgriPurchaseBilling.Infrastructure.Repositories;
using AgriPurchaseBilling.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. DATABASE CONNECTION
var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Database connection string is missing.");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString)));

// 2. REPOSITORY REGISTRATIONS
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IOtpRepository, OtpRepository>();

// 3. SERVICE REGISTRATIONS
builder.Services.AddScoped<IRegistrationService, RegistrationService>();
builder.Services.AddScoped<ILoginService, LoginService>();
builder.Services.AddScoped<IOtpService, OtpService>();
builder.Services.AddScoped<IForgotPasswordService, ForgotPasswordService>();
builder.Services.AddScoped<IEmailService, SmtpEmailService>();

// 4. FLUENT VALIDATION
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<RegisterRequestValidator>();

// 5. CONTROLLERS AND JSON
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter());
    });

// 6. AUTHORIZATION
builder.Services.AddAuthorization();

// 7. SWAGGER SERVICES
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Agri Raw Product Purchase & Billing (ARPPB) API",
        Version = "v1",
        Description = "Registration, login, OTP and password recovery APIs."
    });
});

// 8. BUILD APPLICATION
var app = builder.Build();

// 9. SWAGGER MIDDLEWARE
app.UseSwagger();

app.UseSwaggerUI(options =>
{
    options.RoutePrefix = "swagger";
    options.SwaggerEndpoint(
        "/swagger/v1/swagger.json",
        "ARPPB API v1");
});

// 10. APPLICATION MIDDLEWARE
// HTTPS redirection is omitted while testing on HTTP port 5034.
app.UseAuthorization();

// 11. MAP CONTROLLERS
app.MapControllers();

// 12. RUN
app.Run();
