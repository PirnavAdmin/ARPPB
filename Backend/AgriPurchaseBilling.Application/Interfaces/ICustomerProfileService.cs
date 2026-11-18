using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface ICustomerProfileService
    {
        Task<CustomerProfileDto?> GetProfileAsync(long customerId, CancellationToken cancellationToken = default);
        Task<CustomerProfileDto?> UpdateProfileAsync(long customerId, UpdateCustomerProfileDto dto, CancellationToken cancellationToken = default);
        Task<List<CustomerDeliveryAddressDto>> GetDeliveryAddressesAsync(long customerId, CancellationToken cancellationToken = default);
        Task<CustomerDeliveryAddressDto?> AddDeliveryAddressAsync(long customerId, CreateCustomerDeliveryAddressDto dto, CancellationToken cancellationToken = default);
        Task<CustomerDeliveryAddressDto?> UpdateDeliveryAddressAsync(long addressId, long customerId, UpdateCustomerDeliveryAddressDto dto, CancellationToken cancellationToken = default);
        Task<bool> DeleteDeliveryAddressAsync(long addressId, long customerId, CancellationToken cancellationToken = default);
        Task<CustomerDeliveryAddressDto?> SetDefaultDeliveryAddressAsync(long addressId, long customerId, CancellationToken cancellationToken = default);

        // Mobile Number Change OTP operations
        Task<MobileChangeOtpResponseDto> SendMobileChangeOtpAsync(long customerId, SendMobileChangeOtpDto dto, CancellationToken cancellationToken = default);
        Task<CustomerProfileDto> VerifyMobileChangeOtpAsync(long customerId, VerifyMobileChangeOtpDto dto, CancellationToken cancellationToken = default);
    }
}
