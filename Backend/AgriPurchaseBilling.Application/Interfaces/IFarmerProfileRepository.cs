using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Domain.Entities;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IFarmerProfileRepository
    {
        Task<List<FarmerProfileResponseDto>> GetAllProfilesAsync(
            CancellationToken cancellationToken = default);

        Task<FarmerProfileResponseDto?> GetProfileByUserIdAsync(
            long userId,
            CancellationToken cancellationToken = default);

        Task<FarmerProfileResponseDto?> GetProfileByFarmerIdAsync(
            long farmerId,
            CancellationToken cancellationToken = default);

        Task<Farmer?> GetFarmerByUserIdAsync(
            long userId,
            CancellationToken cancellationToken = default);

        Task<Farmer?> GetFarmerByIdAsync(
            long farmerId,
            CancellationToken cancellationToken = default);

        Task<User?> GetUserByIdAsync(
            long userId,
            CancellationToken cancellationToken = default);

        Task<FarmerBankAccount?> GetBankAccountByFarmerIdAsync(
            long farmerId,
            CancellationToken cancellationToken = default);

        Task<BankDetailsDto?> GetBankDetailsByUserIdAsync(
            long userId,
            bool reveal = false,
            CancellationToken cancellationToken = default);

        Task<bool> UpdateProfileAsync(
            long userId,
            UpdateFarmerProfileRequestDto request,
            CancellationToken cancellationToken = default);

        Task<bool> UpdateBankDetailsAsync(
            long farmerId,
            UpdateBankDetailsRequestDto request,
            CancellationToken cancellationToken = default);

        Task<bool> UpdateMobileWithHistoryAsync(
            long userId,
            string newMobile,
            CancellationToken cancellationToken = default);


        Task<bool> UpdatePasswordAsync(
            long userId,
            string newPasswordHash,
            CancellationToken cancellationToken = default);
    }
}
