using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Domain.Entities;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface ICustomerProfileRepository
    {
        Task<CustomerProfileDto?> GetProfileAsync(long customerId, CancellationToken cancellationToken = default);
        Task<CustomerProfileDto?> UpdateProfileAsync(long customerId, UpdateCustomerProfileDto dto, CancellationToken cancellationToken = default);
        Task<List<CustomerDeliveryAddressDto>> GetDeliveryAddressesAsync(long customerId, CancellationToken cancellationToken = default);
        Task<CustomerDeliveryAddressDto?> AddDeliveryAddressAsync(long customerId, CreateCustomerDeliveryAddressDto dto, CancellationToken cancellationToken = default);
        Task<CustomerDeliveryAddressDto?> UpdateDeliveryAddressAsync(long addressId, long customerId, UpdateCustomerDeliveryAddressDto dto, CancellationToken cancellationToken = default);
        Task<bool> DeleteDeliveryAddressAsync(long addressId, long customerId, CancellationToken cancellationToken = default);
        Task<CustomerDeliveryAddressDto?> SetDefaultDeliveryAddressAsync(long addressId, long customerId, CancellationToken cancellationToken = default);

        // Mobile Number Change OTP operations
        Task<string?> GetCurrentCustomerMobileAsync(long customerId, CancellationToken cancellationToken = default);
        Task<bool> IsMobileRegisteredToAnotherUserAsync(string mobile, long excludeCustomerId, CancellationToken cancellationToken = default);
        Task SaveMobileChangeOtpAsync(long customerId, string newMobile, string otpHashed, DateTime expiresAt, CancellationToken cancellationToken = default);
        Task<CustomerOtpVerificationEntity?> GetLatestMobileChangeOtpAsync(long customerId, string newMobile, CancellationToken cancellationToken = default);
        Task IncrementOtpAttemptsAsync(int otpId, CancellationToken cancellationToken = default);
        Task<CustomerProfileDto?> UpdateCustomerMobileAfterVerificationAsync(long customerId, string newMobile, int otpId, CancellationToken cancellationToken = default);
    }
}
