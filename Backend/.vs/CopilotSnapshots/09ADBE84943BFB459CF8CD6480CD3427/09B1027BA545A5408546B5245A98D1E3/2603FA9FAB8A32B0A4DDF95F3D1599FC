using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IVendorMobileChangeService
    {
        Task<VendorMobileChangeOtpDto?> RequestAsync(long userId, string newMobile, CancellationToken cancellationToken = default);
        Task<VendorMobileChangeResultDto?> VerifyAsync(long userId, string newMobile, string otp, CancellationToken cancellationToken = default);
    }
}
