using System;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;

namespace AgriPurchaseBilling.Application.Services
{
    public class FarmerNotificationService : IFarmerNotificationService
    {
        private readonly IFarmerNotificationRepository _repository;

        public FarmerNotificationService(IFarmerNotificationRepository repository)
        {
            _repository = repository;
        }

        public async Task<ApiResponse<FarmerNotificationPagedResponseDto>> GetNotificationsAsync(long userId, FarmerNotificationQueryDto query, CancellationToken ct = default)
        {
            long farmerId = await ResolveFarmerIdAsync(userId, ct);
            if (farmerId <= 0)
            {
                return ApiResponse<FarmerNotificationPagedResponseDto>.Fail("Farmer profile not found for this user.");
            }

            var result = await _repository.GetNotificationsAsync(farmerId, query, ct);
            var stats = await _repository.GetStatsAsync(farmerId, ct);
            result.Stats = stats;

            return ApiResponse<FarmerNotificationPagedResponseDto>.Ok(result, "Farmer notifications retrieved successfully.");
        }

        public async Task<ApiResponse<FarmerNotificationStatsDto>> GetStatsAsync(long userId, CancellationToken ct = default)
        {
            long farmerId = await ResolveFarmerIdAsync(userId, ct);
            if (farmerId <= 0)
            {
                return ApiResponse<FarmerNotificationStatsDto>.Fail("Farmer profile not found for this user.");
            }

            var stats = await _repository.GetStatsAsync(farmerId, ct);
            return ApiResponse<FarmerNotificationStatsDto>.Ok(stats, "Notification stats retrieved successfully.");
        }

        public async Task<ApiResponse<bool>> MarkReadAsync(long userId, string idOrCode, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(idOrCode))
            {
                return ApiResponse<bool>.Fail("Notification ID or code is required.");
            }

            long farmerId = await ResolveFarmerIdAsync(userId, ct);
            if (farmerId <= 0)
            {
                return ApiResponse<bool>.Fail("Farmer profile not found for this user.");
            }

            bool success = await _repository.MarkReadAsync(farmerId, idOrCode, ct);
            return success
                ? ApiResponse<bool>.Ok(true, "Notification marked as read.")
                : ApiResponse<bool>.Fail("Notification not found or already read.");
        }

        public async Task<ApiResponse<int>> MarkAllReadAsync(long userId, CancellationToken ct = default)
        {
            long farmerId = await ResolveFarmerIdAsync(userId, ct);
            if (farmerId <= 0)
            {
                return ApiResponse<int>.Fail("Farmer profile not found for this user.");
            }

            int count = await _repository.MarkAllReadAsync(farmerId, ct);
            return ApiResponse<int>.Ok(count, $"Marked {count} notifications as read.");
        }

        public async Task<ApiResponse<bool>> DismissAsync(long userId, string idOrCode, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(idOrCode))
            {
                return ApiResponse<bool>.Fail("Notification ID or code is required.");
            }

            long farmerId = await ResolveFarmerIdAsync(userId, ct);
            if (farmerId <= 0)
            {
                return ApiResponse<bool>.Fail("Farmer profile not found for this user.");
            }

            bool success = await _repository.DismissAsync(farmerId, idOrCode, ct);
            return success
                ? ApiResponse<bool>.Ok(true, "Notification dismissed successfully.")
                : ApiResponse<bool>.Fail("Notification not found.");
        }

        public async Task<ApiResponse<FarmerNotificationDto>> CreateNotificationAsync(long userId, CreateFarmerNotificationRequestDto request, CancellationToken ct = default)
        {
            long farmerId = await ResolveFarmerIdAsync(userId, ct);
            if (farmerId <= 0)
            {
                return ApiResponse<FarmerNotificationDto>.Fail("Farmer profile not found for this user.");
            }

            var (id, code) = await _repository.CreateAsync(farmerId, request, ct);

            var createdDto = new FarmerNotificationDto
            {
                Id = id,
                NotificationCode = code,
                FarmerId = farmerId,
                Title = request.Title,
                Detail = request.Detail,
                Category = request.Category,
                Type = request.Type,
                TargetPage = request.TargetPage,
                TargetId = request.TargetId,
                Read = false,
                CreatedAt = DateTime.UtcNow
            };

            return ApiResponse<FarmerNotificationDto>.Ok(createdDto, "Notification created successfully.");
        }

        private Task<long> ResolveFarmerIdAsync(long userId, CancellationToken ct)
        {
            return _repository.GetFarmerIdByUserIdAsync(userId, ct);
        }
    }
}
