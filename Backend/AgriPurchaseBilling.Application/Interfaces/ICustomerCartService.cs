using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface ICustomerCartService
    {
        Task<ApiResponse<CustomerCartDto>> GetCartAsync(long customerUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<CustomerCartDto>> AddToCartAsync(long customerUserId, AddToCartRequestDto request, CancellationToken cancellationToken = default);
        Task<ApiResponse<CustomerCartDto>> UpdateQuantityAsync(long customerUserId, long cartItemId, UpdateCartItemRequestDto request, CancellationToken cancellationToken = default);
        Task<ApiResponse<CustomerCartDto>> RemoveItemAsync(long customerUserId, long cartItemId, CancellationToken cancellationToken = default);
        Task<ApiResponse<CustomerCartDto>> ClearCartAsync(long customerUserId, CancellationToken cancellationToken = default);
        Task<ApiResponse<CustomerCheckoutResultDto>> CheckoutAsync(long customerUserId, CustomerCheckoutRequestDto request, CancellationToken cancellationToken = default);
    }
}

