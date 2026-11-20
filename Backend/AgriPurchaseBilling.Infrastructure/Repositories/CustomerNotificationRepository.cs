using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriPurchaseBilling.Infrastructure.Repositories
{
    public class CustomerNotificationRepository : ICustomerNotificationRepository
    {
        private readonly AppDbContext _context;

        public CustomerNotificationRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<CustomerNotificationPagedDto> GetNotificationsAsync(
            long customerUserId,
            CustomerNotificationQueryDto query,
            CancellationToken cancellationToken = default)
        {
            IQueryable<CustomerNotification> filtered = BuildFilteredQuery(customerUserId, query);

            int totalCount = await filtered.CountAsync(cancellationToken);
            int totalPages = totalCount == 0
                ? 0
                : (int)Math.Ceiling(totalCount / (double)query.PageSize);

            if (totalCount == 0 || (query.Page - 1) * query.PageSize >= totalCount)
            {
                return new CustomerNotificationPagedDto
                {
                    Items = new List<CustomerNotificationDto>(),
                    Page = query.Page,
                    PageSize = query.PageSize,
                    TotalCount = totalCount,
                    TotalPages = totalPages,
                    HasNextPage = false,
                    HasPreviousPage = query.Page > 1 && totalCount > 0
                };
            }

            bool isAsc = string.Equals(query.SortOrder, "asc", StringComparison.OrdinalIgnoreCase);

            IQueryable<CustomerNotification> ordered = isAsc
                ? filtered.OrderBy(n => n.CreatedAt).ThenBy(n => n.Id)
                : filtered.OrderByDescending(n => n.CreatedAt).ThenByDescending(n => n.Id);

            var items = await ordered
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(n => new CustomerNotificationDto
                {
                    Id = n.Id,
                    Title = n.Title,
                    Message = n.Message,
                    Type = n.Type,
                    Priority = n.Priority,
                    OrderCode = string.IsNullOrWhiteSpace(n.OrderCode) ? null : n.OrderCode,
                    TransactionCode = string.IsNullOrWhiteSpace(n.TransactionCode) ? null : n.TransactionCode,
                    IsRead = n.IsRead,
                    ReadAt = n.ReadAt,
                    CreatedAt = n.CreatedAt
                })
                .ToListAsync(cancellationToken);

            return new CustomerNotificationPagedDto
            {
                Items = items,
                Page = query.Page,
                PageSize = query.PageSize,
                TotalCount = totalCount,
                TotalPages = totalPages,
                HasNextPage = query.Page < totalPages,
                HasPreviousPage = query.Page > 1
            };
        }

        public async Task<CustomerNotificationSummaryDto> GetSummaryAsync(
            long customerUserId,
            CancellationToken cancellationToken = default)
        {
            var summary = await BuildSummaryQuery(customerUserId)
                .FirstOrDefaultAsync(cancellationToken);

            return summary ?? new CustomerNotificationSummaryDto();
        }

        public async Task<CustomerNotificationDto?> MarkAsReadAsync(
            long customerUserId,
            long notificationId,
            DateTime readAtUtc,
            CancellationToken cancellationToken = default)
        {
            var entity = await _context.CustomerNotifications
                .FirstOrDefaultAsync(
                    n => n.Id == notificationId && n.CustomerUserId == customerUserId,
                    cancellationToken);

            if (entity == null)
            {
                return null;
            }

            if (!entity.IsRead)
            {
                entity.IsRead = true;
                entity.ReadAt = readAtUtc;
                await _context.SaveChangesAsync(cancellationToken);
            }

            return MapToDto(entity);
        }

        public async Task<int> MarkAllAsReadAsync(
            long customerUserId,
            DateTime readAtUtc,
            CancellationToken cancellationToken = default)
        {
            if (_context.Database.IsRelational())
            {
                return await _context.CustomerNotifications
                    .Where(n => n.CustomerUserId == customerUserId && !n.IsRead)
                    .ExecuteUpdateAsync(
                        setters => setters
                            .SetProperty(n => n.IsRead, true)
                            .SetProperty(n => n.ReadAt, readAtUtc),
                        cancellationToken);
            }

            var unread = await _context.CustomerNotifications
                .Where(n => n.CustomerUserId == customerUserId && !n.IsRead)
                .ToListAsync(cancellationToken);

            if (unread.Count == 0)
            {
                return 0;
            }

            foreach (var item in unread)
            {
                item.IsRead = true;
                item.ReadAt = readAtUtc;
            }

            await _context.SaveChangesAsync(cancellationToken);
            return unread.Count;
        }

        public async Task<bool> DeleteAsync(
            long customerUserId,
            long notificationId,
            CancellationToken cancellationToken = default)
        {
            var entity = await _context.CustomerNotifications
                .FirstOrDefaultAsync(
                    n => n.Id == notificationId && n.CustomerUserId == customerUserId,
                    cancellationToken);

            if (entity == null)
            {
                return false;
            }

            _context.CustomerNotifications.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public IQueryable<CustomerNotification> BuildFilteredQuery(
            long customerUserId,
            CustomerNotificationQueryDto query)
        {
            IQueryable<CustomerNotification> filtered = _context.CustomerNotifications
                .AsNoTracking()
                .Where(n => n.CustomerUserId == customerUserId);

            if (!string.IsNullOrWhiteSpace(query.Type))
            {
                string typeFilter = query.Type.Trim().ToLower();
                filtered = filtered.Where(n => n.Type.ToLower() == typeFilter);
            }

            if (!string.IsNullOrWhiteSpace(query.Priority))
            {
                string priorityFilter = query.Priority.Trim().ToLower();
                filtered = filtered.Where(n => n.Priority.ToLower() == priorityFilter);
            }

            if (query.IsRead.HasValue)
            {
                bool isRead = query.IsRead.Value;
                filtered = filtered.Where(n => n.IsRead == isRead);
            }

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                string term = query.Search.Trim().ToLower();
                filtered = filtered.Where(n =>
                    n.Title.ToLower().Contains(term) ||
                    n.Message.ToLower().Contains(term) ||
                    n.Type.ToLower().Contains(term) ||
                    (n.OrderCode != null && n.OrderCode.ToLower().Contains(term)) ||
                    (n.TransactionCode != null && n.TransactionCode.ToLower().Contains(term)));
            }

            return filtered;
        }

        public IQueryable<CustomerNotificationSummaryDto> BuildSummaryQuery(long customerUserId)
        {
            return _context.CustomerNotifications
                .AsNoTracking()
                .Where(n => n.CustomerUserId == customerUserId)
                .GroupBy(_ => 1)
                .Select(g => new CustomerNotificationSummaryDto
                {
                    TotalNotifications = g.Count(),
                    UnreadCount = g.Count(n => !n.IsRead),
                    ReadCount = g.Count(n => n.IsRead),
                    HighPriorityUnreadCount = g.Count(n => !n.IsRead && n.Priority.ToLower() == "high")
                });
        }

        private static CustomerNotificationDto MapToDto(CustomerNotification entity)
        {
            return new CustomerNotificationDto
            {
                Id = entity.Id,
                Title = entity.Title,
                Message = entity.Message,
                Type = entity.Type,
                Priority = entity.Priority,
                OrderCode = string.IsNullOrWhiteSpace(entity.OrderCode) ? null : entity.OrderCode,
                TransactionCode = string.IsNullOrWhiteSpace(entity.TransactionCode) ? null : entity.TransactionCode,
                IsRead = entity.IsRead,
                ReadAt = entity.ReadAt,
                CreatedAt = entity.CreatedAt
            };
        }
    }
}

