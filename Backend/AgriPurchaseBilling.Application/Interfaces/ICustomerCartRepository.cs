using AgriPurchaseBilling.Domain.Entities;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface ICustomerCartRepository
    {
        Task<List<CustomerCartItem>> GetCartItemsAsync(long customerUserId, CancellationToken cancellationToken = default);
        Task<CustomerCartItem?> GetCartItemByIdAsync(long customerUserId, long cartItemId, CancellationToken cancellationToken = default);
        Task<CustomerCartItem?> GetCartItemByProductAsync(long customerUserId, long productId, CancellationToken cancellationToken = default);
        Task<VendorFinishedProduct?> GetProductByIdAsync(long productId, CancellationToken cancellationToken = default);
        Task<CustomerCartItem> AddItemAsync(CustomerCartItem cartItem, CancellationToken cancellationToken = default);
        Task UpdateItemAsync(CustomerCartItem cartItem, CancellationToken cancellationToken = default);
        Task DeleteItemAsync(CustomerCartItem cartItem, CancellationToken cancellationToken = default);
        Task<int> ClearCartAsync(long customerUserId, CancellationToken cancellationToken = default);

        // Checkout & delivery address lookups
        Task<CustomerDeliveryAddressEntity?> GetDeliveryAddressByIdAsync(long addressId, long customerUserId, CancellationToken cancellationToken = default);
        Task<CustomerDeliveryAddressEntity?> GetDefaultDeliveryAddressAsync(long customerUserId, CancellationToken cancellationToken = default);
        Task<CustomerProfileEntity?> GetCustomerProfileAsync(long customerUserId, CancellationToken cancellationToken = default);
        Task<User?> GetUserByIdAsync(long customerUserId, CancellationToken cancellationToken = default);
        Task<List<VendorFinishedProduct>> GetProductsByIdsAsync(IEnumerable<long> productIds, CancellationToken cancellationToken = default);
        Task<string> GetNextOrderCodeAsync(int offset = 0, CancellationToken cancellationToken = default);
        Task<string> GetNextSaleCodeAsync(int offset = 0, CancellationToken cancellationToken = default);
        Task<string> GetNextConfirmationCodeAsync(int offset = 0, CancellationToken cancellationToken = default);
        Task<Dictionary<long, string>> GetVendorNamesAsync(IEnumerable<long> vendorIds, CancellationToken cancellationToken = default);

        // Atomic checkout transaction execution
        Task<List<VpSale>> ExecuteCheckoutTransactionAsync(
            long customerUserId,
            List<VpSale> orders,
            List<VpOtpConfirmation> confirmations,
            List<CustomerNotification> notifications,
            Dictionary<long, decimal> stockDeltas,
            CancellationToken cancellationToken = default);
    }
}

