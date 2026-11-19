using System;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs.VendorOperations;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IVendorDashboardService
    {
        Task<VendorDashboardDto> GetDashboardAsync(long vendorId, DateTime? fromDate, DateTime? toDate, bool includeSandboxOtps, CancellationToken cancellationToken = default);
        Task<VendorDashboardTransactionPageDto> GetTransactionsAsync(long vendorId, VendorDashboardTransactionQueryDto query, CancellationToken cancellationToken = default);
        Task<System.Collections.Generic.List<VendorDashboardSearchResultDto>> SearchAsync(long vendorId, string search, int take = 20, CancellationToken cancellationToken = default);
        Task<System.Collections.Generic.List<VendorDashboardOtpConfirmationDto>> GetPendingOtpConfirmationsAsync(long vendorId, DateTime? fromDate, DateTime? toDate, bool includeSandboxOtps, CancellationToken cancellationToken = default);
        Task<VendorDashboardOtpVerificationDto?> VerifyOtpAsync(long vendorId, string partnerType, long confirmationId, string otp, CancellationToken cancellationToken = default);
    }
}
