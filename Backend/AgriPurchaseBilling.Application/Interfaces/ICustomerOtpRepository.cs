using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Domain.Entities;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface ICustomerOtpRepository
    {
        Task<CustomerConfirmationPagedDto> GetConfirmationsAsync(
            long customerUserId,
            CustomerConfirmationQueryDto query,
            CancellationToken cancellationToken = default);

        Task<CustomerConfirmationDetailDto?> GetConfirmationByIdAsync(
            long customerUserId,
            string idOrCode,
            CancellationToken cancellationToken = default);

        Task<VpOtpConfirmation?> GetConfirmationEntityByIdAsync(
            long customerUserId,
            string idOrCode,
            CancellationToken cancellationToken = default);

        Task<VpSale?> GetSaleByIdAsync(
            long saleId,
            CancellationToken cancellationToken = default);

        Task UpdateConfirmationAsync(
            VpOtpConfirmation confirmation,
            CancellationToken cancellationToken = default);

        Task UpdateSaleAsync(
            VpSale sale,
            CancellationToken cancellationToken = default);

        Task AddNotificationAsync(
            CustomerNotification notification,
            CancellationToken cancellationToken = default);
    }
}

