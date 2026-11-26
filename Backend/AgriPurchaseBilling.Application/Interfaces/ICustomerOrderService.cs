using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    /// <summary>
    /// Service interface providing Customer My Orders operations and validations.
    /// </summary>
    public interface ICustomerOrderService
    {
        Task<ApiResponse<CustomerOrderPagedDto>> GetOrdersAsync(
            long customerUserId,
            CustomerOrderQueryDto query,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<CustomerOrderDetailDto>> GetOrderByIdAsync(
            long customerUserId,
            string orderIdentifier,
            CancellationToken cancellationToken = default);
    }
}

