using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriPurchaseBilling.Infrastructure.Repositories
{
    public class FarmerProfileRepository : IFarmerProfileRepository
    {
        private readonly AppDbContext _context;

        public FarmerProfileRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<FarmerProfileResponseDto>> GetAllProfilesAsync(
            CancellationToken cancellationToken = default)
        {
            var farmers = await _context.Farmers
                .AsNoTracking()
                .Include(f => f.User)
                .Include(f => f.BankAccount)
                .ToListAsync(cancellationToken);

            return farmers.Select(MapToResponseDto).ToList();
        }

        public async Task<FarmerProfileResponseDto?> GetProfileByUserIdAsync(
            long userId,
            CancellationToken cancellationToken = default)
        {
            var farmer = await _context.Farmers
                .AsNoTracking()
                .Include(f => f.User)
                .Include(f => f.BankAccount)
                .FirstOrDefaultAsync(f => f.UserId == userId, cancellationToken);

            return farmer != null ? MapToResponseDto(farmer) : null;
        }

        public async Task<FarmerProfileResponseDto?> GetProfileByFarmerIdAsync(
            long farmerId,
            CancellationToken cancellationToken = default)
        {
            var farmer = await _context.Farmers
                .AsNoTracking()
                .Include(f => f.User)
                .Include(f => f.BankAccount)
                .FirstOrDefaultAsync(f => f.Id == farmerId, cancellationToken);

            return farmer != null ? MapToResponseDto(farmer) : null;
        }

        public async Task<Farmer?> GetFarmerByUserIdAsync(
            long userId,
            CancellationToken cancellationToken = default)
        {
            return await _context.Farmers
                .Include(f => f.User)
                .Include(f => f.BankAccount)
                .FirstOrDefaultAsync(f => f.UserId == userId, cancellationToken);
        }

        public async Task<Farmer?> GetFarmerByIdAsync(
            long farmerId,
            CancellationToken cancellationToken = default)
        {
            return await _context.Farmers
                .Include(f => f.User)
                .Include(f => f.BankAccount)
                .FirstOrDefaultAsync(f => f.Id == farmerId, cancellationToken);
        }

        public async Task<User?> GetUserByIdAsync(
            long userId,
            CancellationToken cancellationToken = default)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        }

        public async Task<FarmerBankAccount?> GetBankAccountByFarmerIdAsync(
            long farmerId,
            CancellationToken cancellationToken = default)
        {
            return await _context.FarmerBankAccounts
                .FirstOrDefaultAsync(b => b.FarmerId == farmerId, cancellationToken);
        }

        public async Task<BankDetailsDto?> GetBankDetailsByUserIdAsync(
            long userId,
            bool reveal = false,
            CancellationToken cancellationToken = default)
        {
            var farmer = await _context.Farmers
                .AsNoTracking()
                .Include(f => f.BankAccount)
                .FirstOrDefaultAsync(f => f.UserId == userId, cancellationToken);

            if (farmer == null) return null;

            if (farmer.BankAccount == null)
            {
                return new BankDetailsDto
                {
                    IsComplete = false,
                    AccountType = "Savings"
                };
            }

            string accNo = farmer.BankAccount.AccountNumber ?? string.Empty;
            string displayAccNo = reveal ? accNo : MaskAccountNumber(accNo);

            bool isComplete = !string.IsNullOrWhiteSpace(farmer.BankAccount.BankName) &&
                              !string.IsNullOrWhiteSpace(farmer.BankAccount.AccountNumber) &&
                              !string.IsNullOrWhiteSpace(farmer.BankAccount.IfscCode) &&
                              !string.IsNullOrWhiteSpace(farmer.BankAccount.AccountHolderName);

            return new BankDetailsDto
            {
                BankName = farmer.BankAccount.BankName,
                AccountHolderName = farmer.BankAccount.AccountHolderName,
                AccountNumber = displayAccNo,
                IfscCode = farmer.BankAccount.IfscCode,
                BranchName = farmer.BankAccount.BranchName,
                AccountType = farmer.BankAccount.AccountType ?? "Savings",
                UpiId = farmer.BankAccount.UpiId,
                IsComplete = isComplete
            };
        }

        public async Task<bool> UpdateProfileAsync(
            long userId,
            UpdateFarmerProfileRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var farmer = await _context.Farmers
                .Include(f => f.User)
                .FirstOrDefaultAsync(f => f.UserId == userId, cancellationToken);

            if (farmer == null) return false;

            // Update User FullName if provided
            if (!string.IsNullOrWhiteSpace(request.FullName))
            {
                farmer.User.FullName = request.FullName.Trim();
                farmer.User.UpdatedAt = DateTime.UtcNow;
            }

            // Update Farmer optional details if specified in request, preserving existing values otherwise
            if (request.AlternateMobile != null)
            {
                farmer.AlternateMobile = string.IsNullOrWhiteSpace(request.AlternateMobile) ? null : request.AlternateMobile.Trim();
            }

            if (request.FarmName != null)
            {
                farmer.FarmName = string.IsNullOrWhiteSpace(request.FarmName) ? null : request.FarmName.Trim();
            }

            if (request.TotalLandArea != null)
            {
                farmer.TotalLandArea = string.IsNullOrWhiteSpace(request.TotalLandArea) ? null : request.TotalLandArea.Trim();
            }

            if (request.SoilType != null)
            {
                farmer.SoilType = string.IsNullOrWhiteSpace(request.SoilType) ? null : request.SoilType.Trim();
            }

            if (request.PrimaryCrops != null)
            {
                farmer.PrimaryCrops = string.IsNullOrWhiteSpace(request.PrimaryCrops) ? null : request.PrimaryCrops.Trim();
            }

            if (request.Village != null)
            {
                farmer.Village = string.IsNullOrWhiteSpace(request.Village) ? null : request.Village.Trim();
            }

            if (request.Mandal != null)
            {
                farmer.Mandal = string.IsNullOrWhiteSpace(request.Mandal) ? null : request.Mandal.Trim();
            }

            if (request.District != null)
            {
                farmer.District = string.IsNullOrWhiteSpace(request.District) ? null : request.District.Trim();
            }

            if (request.State != null)
            {
                farmer.State = string.IsNullOrWhiteSpace(request.State) ? null : request.State.Trim();
            }

            if (request.PinCode != null)
            {
                farmer.PinCode = string.IsNullOrWhiteSpace(request.PinCode) ? null : request.PinCode.Trim();
            }

            if (request.Address != null)
            {
                farmer.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
            }

            farmer.Mobile = farmer.User.Mobile;
            farmer.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> UpdateBankDetailsAsync(
            long farmerId,
            UpdateBankDetailsRequestDto request,
            CancellationToken cancellationToken = default)
        {
            var bankAccount = await _context.FarmerBankAccounts
                .FirstOrDefaultAsync(b => b.FarmerId == farmerId, cancellationToken);

            if (bankAccount == null)
            {
                bankAccount = new FarmerBankAccount
                {
                    FarmerId = farmerId,
                    BankName = request.BankName?.Trim(),
                    AccountHolderName = request.AccountHolderName?.Trim(),
                    AccountNumber = request.AccountNumber?.Trim(),
                    IfscCode = request.IfscCode?.Trim().ToUpperInvariant(),
                    BranchName = request.BranchName?.Trim(),
                    AccountType = request.AccountType?.Trim() ?? "Savings",
                    UpiId = request.UpiId?.Trim(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _context.FarmerBankAccounts.AddAsync(bankAccount, cancellationToken);
            }
            else
            {
                bankAccount.BankName = request.BankName?.Trim();
                bankAccount.AccountHolderName = request.AccountHolderName?.Trim();
                bankAccount.AccountNumber = request.AccountNumber?.Trim();
                bankAccount.IfscCode = request.IfscCode?.Trim().ToUpperInvariant();
                bankAccount.BranchName = request.BranchName?.Trim();
                bankAccount.AccountType = request.AccountType?.Trim() ?? bankAccount.AccountType ?? "Savings";
                bankAccount.UpiId = request.UpiId?.Trim();
                bankAccount.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> UpdateMobileWithHistoryAsync(
            long userId,
            string newMobile,
            CancellationToken cancellationToken = default)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user == null) return false;

            string oldMobile = user.Mobile;

            // Record history
            var history = new UserMobileHistory
            {
                UserId = userId,
                OldMobile = oldMobile,
                NewMobile = newMobile,
                OldMobileStatus = "Inactive",
                NewMobileStatus = "Active",
                ChangedAt = DateTime.UtcNow
            };
            await _context.UserMobileHistories.AddAsync(history, cancellationToken);

            // Update active mobile in Users
            user.Mobile = newMobile;
            user.UpdatedAt = DateTime.UtcNow;

            // Sync active mobile in Farmers
            var farmer = await _context.Farmers.FirstOrDefaultAsync(f => f.UserId == userId, cancellationToken);
            if (farmer != null)
            {
                farmer.Mobile = newMobile;
                farmer.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }


        public async Task<bool> UpdatePasswordAsync(
            long userId,
            string newPasswordHash,
            CancellationToken cancellationToken = default)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user == null) return false;

            user.PasswordHash = newPasswordHash;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        private static FarmerProfileResponseDto MapToResponseDto(Farmer f)
        {
            BankDetailsDto bankDetailsDto;
            if (f.BankAccount == null)
            {
                bankDetailsDto = new BankDetailsDto
                {
                    IsComplete = false,
                    AccountType = "Savings"
                };
            }
            else
            {
                string bankName = f.BankAccount.BankName ?? string.Empty;
                string accountHolderName = f.BankAccount.AccountHolderName ?? string.Empty;
                string accountNumber = f.BankAccount.AccountNumber ?? string.Empty;
                string ifscCode = f.BankAccount.IfscCode ?? string.Empty;
                string branchName = f.BankAccount.BranchName ?? string.Empty;
                string accountType = f.BankAccount.AccountType ?? "Savings";
                string? upiId = f.BankAccount.UpiId;

                bool isComplete = !string.IsNullOrWhiteSpace(bankName) &&
                                  !string.IsNullOrWhiteSpace(accountNumber) &&
                                  !string.IsNullOrWhiteSpace(ifscCode) &&
                                  !string.IsNullOrWhiteSpace(accountHolderName);

                bankDetailsDto = new BankDetailsDto
                {
                    BankName = bankName,
                    AccountHolderName = accountHolderName,
                    AccountNumber = MaskAccountNumber(accountNumber),
                    IfscCode = ifscCode,
                    BranchName = branchName,
                    AccountType = accountType,
                    UpiId = upiId,
                    IsComplete = isComplete
                };
            }

            return new FarmerProfileResponseDto
            {
                UserId = f.UserId,
                FarmerId = f.Id,
                FarmerCode = f.FarmerCode,
                FullName = f.User?.FullName ?? string.Empty,
                Mobile = f.User?.Mobile ?? f.Mobile ?? string.Empty,
                AlternateMobile = f.AlternateMobile,
                Email = f.User?.Email,
                IsActive = f.User?.IsActive ?? true,
                FarmLocation = new FarmLocationDto
                {
                    FarmName = f.FarmName,
                    TotalLandArea = f.TotalLandArea,
                    SoilType = f.SoilType,
                    PrimaryCrops = f.PrimaryCrops,
                    Village = f.Village,
                    Mandal = f.Mandal,
                    District = f.District,
                    State = f.State,
                    PinCode = f.PinCode,
                    Address = f.Address
                },
                BankDetails = bankDetailsDto
            };
        }

        private static string MaskAccountNumber(string? accNo)
        {
            if (string.IsNullOrWhiteSpace(accNo)) return string.Empty;
            accNo = accNo.Trim();
            if (accNo.Length <= 4) return accNo;
            return new string('X', accNo.Length - 4) + accNo[^4..];
        }
    }
}
