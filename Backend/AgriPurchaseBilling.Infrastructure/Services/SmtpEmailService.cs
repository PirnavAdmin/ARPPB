
using System.Net;
using System.Net.Mail;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace AgriPurchaseBilling.Infrastructure.Services;

public sealed class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public SmtpEmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendEmailAsync(
        string to,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken = default)
    {
        var settings = _configuration.GetSection("EmailSettings");

        var host = settings["Host"];
        var username = settings["Username"];
        var password = settings["Password"];
        var fromEmail = settings["FromEmail"];

        if (string.IsNullOrWhiteSpace(host) ||
            string.IsNullOrWhiteSpace(username) ||
            string.IsNullOrWhiteSpace(password) ||
            string.IsNullOrWhiteSpace(fromEmail) ||
            username.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase) ||
            password.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Email SMTP settings are not configured. Update EmailSettings.");
        }

        int port = int.TryParse(settings["Port"], out var parsedPort)
            ? parsedPort
            : 587;

        bool enableSsl =
            !bool.TryParse(settings["EnableSsl"], out var ssl) || ssl;

        using var message = new MailMessage
        {
            From = new MailAddress(
                fromEmail,
                settings["FromName"] ?? "ARPPB Support"),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };

        message.To.Add(new MailAddress(to));

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = enableSsl,
            Credentials = new NetworkCredential(username, password)
        };

        cancellationToken.ThrowIfCancellationRequested();

        await client.SendMailAsync(message, cancellationToken);
    }
}
