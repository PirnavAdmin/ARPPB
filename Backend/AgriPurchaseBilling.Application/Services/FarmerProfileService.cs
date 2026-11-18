using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;
using System.Security.Cryptography;
using System.Text.RegularExpressions;

namespace AgriPurchaseBilling.Application.Services
{
    public class FarmerProfileService : IFarmerProfileService
    {
        private readonly IFarmerProfileRepository _repository;
        private readonly IOtpService _otpService;
        private readonly IOtpRepository _otpRepository;
        private readonly IUserRepository _userRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IEmailService _emailService;
        private readonly bool _isDevelopment;

        public FarmerProfileService(
            IFarmerProfileRepository repository,
            IOtpService otpService,
            IOtpRepository otpRepository,
            IUserRepository userRepository,
            IPasswordHasher passwordHasher,
            IEmailService emailService)
        {
            _repository = repository;
            _otpService = otpService;
            _otpRepository = otpRepository;
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _emailService = emailService;
            _isDevelopment = string.Equals(
                Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                "Development",
                StringComparison.OrdinalIgnoreCase);
        }

        public async Task<ApiResponse<List<FarmerProfileResponseDto>>> GetAllProfilesAsync(
            CancellationToken cancellationToken = default)
        {
            try
            {
                var profiles = await _repository.GetAllProfilesAsync(cancellationToken);
                return ApiResponse<List<FarmerProfileResponseDto>>.Ok(
                    profiles,
                    $"Retrieved {profiles.Count} farmer profile(s) successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse<List<FarmerProfileResponseDto>>.Fail(
                    $"Error retrieving farmer profiles: {ex.Message}");
            }
        }

        public async Task<ApiResponse<FarmerProfileResponseDto>> GetProfileAsync(
            long userId,
            CancellationToken cancellationToken = default)
        {
            if (userId <= 0)
            {
                return ApiResponse<FarmerProfileResponseDto>.Fail("Invalid User ID.");
            }

            try
            {
                var profile = await _repository.GetProfileByUserIdAsync(userId, cancellationToken);
                if (profile == null)
                {
                    return ApiResponse<FarmerProfileResponseDto>.Fail("Farmer profile not found.");
                }

                return ApiResponse<FarmerProfileResponseDto>.Ok(
                    profile,
                    "Farmer profile retrieved successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse<FarmerProfileResponseDto>.Fail(
                    $"Error retrieving farmer profile: {ex.Message}");
            }
        }

        public async Task<ApiResponse<FarmerProfileResponseDto>> UpdateProfileAsync(
            long userId,
            UpdateFarmerProfileRequestDto request,
            CancellationToken cancellationToken = default)
        {
            if (userId <= 0)
            {
                return ApiResponse<FarmerProfileResponseDto>.Fail("Invalid User ID.");
            }

            if (string.IsNullOrWhiteSpace(request.FullName))
            {
                return ApiResponse<FarmerProfileResponseDto>.Fail("Full Name is required.");
            }

            if (!string.IsNullOrWhiteSpace(request.PinCode) &&
                !Regex.IsMatch(request.PinCode.Trim(), @"^[1-9][0-9]{5}$"))
            {
                return ApiResponse<FarmerProfileResponseDto>.Fail("PIN Code must be a valid 6-digit postal code.");
            }

            if (!string.IsNullOrWhiteSpace(request.AlternateMobile) &&
                !Regex.IsMatch(request.AlternateMobile.Trim(), @"^[6-9]\d{9}$"))
            {
                return ApiResponse<FarmerProfileResponseDto>.Fail("Alternate mobile must be a valid 10-digit Indian mobile number.");
            }

            if (!string.IsNullOrWhiteSpace(request.TotalLandArea))
            {
                string area = request.TotalLandArea.Trim();
                if (!Regex.IsMatch(area, @"^[0-9]+(\.[0-9]{1,2})?(\s*(Acres|acres|Acre|acre))?$"))
                {
                    return ApiResponse<FarmerProfileResponseDto>.Fail("Total land area must be a valid numeric quantity (e.g. '5' or '18.5 Acres').");
                }
            }

            try
            {
                bool updated = await _repository.UpdateProfileAsync(userId, request, cancellationToken);
                if (!updated)
                {
                    return ApiResponse<FarmerProfileResponseDto>.Fail("Farmer profile not found or could not be updated.");
                }

                var updatedProfile = await _repository.GetProfileByUserIdAsync(userId, cancellationToken);
                return ApiResponse<FarmerProfileResponseDto>.Ok(
                    updatedProfile!,
                    "Farmer profile details updated successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse<FarmerProfileResponseDto>.Fail(
                    $"Error updating farmer profile: {ex.Message}");
            }
        }

        public async Task<ApiResponse<BankDetailsDto>> GetBankDetailsAsync(
            long userId,
            bool reveal = false,
            CancellationToken cancellationToken = default)
        {
            if (userId <= 0)
            {
                return ApiResponse<BankDetailsDto>.Fail("Invalid User ID.");
            }

            try
            {
                var bankDetails = await _repository.GetBankDetailsByUserIdAsync(userId, reveal, cancellationToken);
                if (bankDetails == null)
                {
                    return ApiResponse<BankDetailsDto>.Fail("Farmer profile not found.");
                }

                return ApiResponse<BankDetailsDto>.Ok(
                    bankDetails,
                    "Bank details retrieved successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse<BankDetailsDto>.Fail(
                    $"Error retrieving bank details: {ex.Message}");
            }
        }

        public async Task<ApiResponse<BankDetailsDto>> UpdateBankDetailsAsync(
            long userId,
            UpdateBankDetailsRequestDto request,
            CancellationToken cancellationToken = default)
        {
            if (userId <= 0)
            {
                return ApiResponse<BankDetailsDto>.Fail("Invalid User ID.");
            }

            var farmer = await _repository.GetFarmerByUserIdAsync(userId, cancellationToken);
            if (farmer == null)
            {
                return ApiResponse<BankDetailsDto>.Fail("Farmer profile not found.");
            }

            if (string.IsNullOrWhiteSpace(request.BankName))
            {
                return ApiResponse<BankDetailsDto>.Fail("Bank Name is required.");
            }

            if (string.IsNullOrWhiteSpace(request.AccountHolderName))
            {
                return ApiResponse<BankDetailsDto>.Fail("Account Holder Name is required.");
            }

            if (string.IsNullOrWhiteSpace(request.AccountNumber) ||
                !Regex.IsMatch(request.AccountNumber.Trim(), @"^\d{9,18}$"))
            {
                return ApiResponse<BankDetailsDto>.Fail("Account Number must be between 9 and 18 digits.");
            }

            if (string.IsNullOrWhiteSpace(request.IfscCode))
            {
                return ApiResponse<BankDetailsDto>.Fail("IFSC Code is required.");
            }

            string ifsc = request.IfscCode.Trim().ToUpperInvariant();
            if (!Regex.IsMatch(ifsc, @"^[A-Z]{4}0[A-Z0-9]{6}$"))
            {
                return ApiResponse<BankDetailsDto>.Fail("Invalid IFSC code format (e.g. SBIN0001234).");
            }

            if (!string.IsNullOrWhiteSpace(request.UpiId))
            {
                string upi = request.UpiId.Trim();
                if (!Regex.IsMatch(upi, @"^[\w\.\-]+@[\w\-]+$"))
                {
                    return ApiResponse<BankDetailsDto>.Fail("Invalid UPI ID format (e.g. username@upi).");
                }
            }

            try
            {
                bool updated = await _repository.UpdateBankDetailsAsync(farmer.Id, request, cancellationToken);
                if (!updated)
                {
                    return ApiResponse<BankDetailsDto>.Fail("Failed to update bank details.");
                }

                var bankDto = await _repository.GetBankDetailsByUserIdAsync(userId, reveal: false, cancellationToken);
                return ApiResponse<BankDetailsDto>.Ok(bankDto!, "Bank details updated successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse<BankDetailsDto>.Fail($"Error updating bank details: {ex.Message}");
            }
        }

        public async Task<ApiResponse<string>> SendMobileChangeOtpAsync(
            long userId,
            string newMobile,
            CancellationToken cancellationToken = default)
        {
            if (userId <= 0)
            {
                return ApiResponse<string>.Fail("Invalid User ID.");
            }

            if (string.IsNullOrWhiteSpace(newMobile) || !Regex.IsMatch(newMobile.Trim(), @"^[6-9]\d{9}$"))
            {
                return ApiResponse<string>.Fail("Please enter a valid 10-digit mobile number.");
            }

            newMobile = newMobile.Trim();

            var currentUser = await _repository.GetUserByIdAsync(userId, cancellationToken);
            if (currentUser == null)
            {
                return ApiResponse<string>.Fail("User not found.");
            }

            if (string.Equals(currentUser.Mobile, newMobile, StringComparison.Ordinal))
            {
                return ApiResponse<string>.Fail("The new mobile number must be different from your current mobile number.");
            }

            bool alreadyInUse = await _userRepository.ExistsByMobileAsync(newMobile, cancellationToken);
            if (alreadyInUse)
            {
                return ApiResponse<string>.Fail("This mobile number is already registered to another account.");
            }

            return await _otpService.GenerateMobileChangeOtpAsync(userId, newMobile, cancellationToken);
        }

        public async Task<ApiResponse<string>> VerifyMobileChangeOtpAsync(
            long userId,
            string newMobile,
            string otp,
            CancellationToken cancellationToken = default)
        {
            if (userId <= 0)
            {
                return ApiResponse<string>.Fail("Invalid User ID.");
            }

            if (string.IsNullOrWhiteSpace(newMobile) || !Regex.IsMatch(newMobile.Trim(), @"^[6-9]\d{9}$"))
            {
                return ApiResponse<string>.Fail("Invalid mobile number.");
            }

            if (string.IsNullOrWhiteSpace(otp) || !Regex.IsMatch(otp.Trim(), @"^[0-9]{6}$"))
            {
                return ApiResponse<string>.Fail("OTP must be a 6-digit number.");
            }

            newMobile = newMobile.Trim();
            otp = otp.Trim();

            var verifyResult = await _otpService.VerifyMobileChangeOtpAsync(
                userId, newMobile, otp, cancellationToken);
            if (!verifyResult.Success)
            {
                return ApiResponse<string>.Fail(verifyResult.Message);
            }

            bool updated = await _repository.UpdateMobileWithHistoryAsync(
                userId, newMobile, cancellationToken);
            if (!updated)
            {
                return ApiResponse<string>.Fail("Failed to update mobile number.");
            }

            await _otpService.ConsumeMobileChangeOtpAsync(
                userId, newMobile, cancellationToken);

            return ApiResponse<string>.Ok(
                newMobile,
                "Mobile number updated successfully. Please use your new mobile number for future logins.");
        }


        public async Task<ApiResponse<string>> ChangePasswordAsync(
            long userId,
            ChangeFarmerPasswordRequestDto request,
            CancellationToken cancellationToken = default)
        {
            if (userId <= 0)
            {
                return ApiResponse<string>.Fail("Invalid User ID.");
            }

            if (string.IsNullOrWhiteSpace(request.CurrentPassword))
            {
                return ApiResponse<string>.Fail("Current password is required.");
            }

            if (string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return ApiResponse<string>.Fail("New password is required.");
            }

            if (request.NewPassword.Length < 6)
            {
                return ApiResponse<string>.Fail("New password must be at least 6 characters.");
            }

            if (request.NewPassword != request.ConfirmNewPassword)
            {
                return ApiResponse<string>.Fail("New password and confirm password do not match.");
            }

            if (request.NewPassword == request.CurrentPassword)
            {
                return ApiResponse<string>.Fail("New password cannot be the same as the current password.");
            }

            var user = await _repository.GetUserByIdAsync(userId, cancellationToken);
            if (user == null)
            {
                return ApiResponse<string>.Fail("User not found.");
            }

            bool isCurrentValid = _passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash);
            if (!isCurrentValid)
            {
                return ApiResponse<string>.Fail("Current password is incorrect.");
            }

            string newHash = _passwordHasher.HashPassword(request.NewPassword);
            bool updated = await _repository.UpdatePasswordAsync(userId, newHash, cancellationToken);
            if (!updated)
            {
                return ApiResponse<string>.Fail("Failed to update password.");
            }

            return ApiResponse<string>.Ok(string.Empty, "Password changed successfully.");
        }
    }
}
