using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Data.Common;

namespace AgriPurchaseBilling.Infrastructure.Repositories
{
    public class MiddlemanNotificationRepository(AppDbContext context) : IMiddlemanNotificationRepository
    {
        private async Task<DbConnection> OpenAsync(CancellationToken ct)
        {
            var connection = context.Database.GetDbConnection();
            if (connection.State != ConnectionState.Open)
                await connection.OpenAsync(ct);
            return connection;
        }

        private static void Add(DbCommand cmd, string name, object? value, DbType type = DbType.String)
        {
            var p = cmd.CreateParameter();
            p.ParameterName = name;
            p.DbType = type;
            p.Value = value ?? DBNull.Value;
            cmd.Parameters.Add(p);
        }

        private static void AddFilters(DbCommand cmd, long userId, MiddlemanNotificationQuery q)
        {
            Add(cmd, "@p_user_id", userId, DbType.Int64);
            Add(cmd, "@p_search", string.IsNullOrWhiteSpace(q.Search) ? null : q.Search.Trim());
            Add(cmd, "@p_category", q.Category is null or "" or "All Categories" ? null : q.Category);
            Add(cmd, "@p_priority", q.Priority is null or "" or "All Priorities" ? null : q.Priority);
            Add(cmd, "@p_status", q.Status == "All" ? null : q.Status);
            Add(cmd, "@p_time_range", q.TimeRange == "All" ? null : q.TimeRange);
        }

        public async Task<MiddlemanNotificationPageDto> GetPageAsync(long userId, MiddlemanNotificationQuery query, CancellationToken ct)
        {
            var items = new List<MiddlemanNotificationDto>();
            var connection = await OpenAsync(ct);
            await using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = "CALL sp_MiddlemanGetNotifications(@p_user_id,@p_search,@p_category,@p_priority,@p_status,@p_time_range,@p_offset,@p_page_size);";
                AddFilters(cmd, userId, query);
                Add(cmd, "@p_offset", (query.Page - 1) * query.PageSize, DbType.Int32);
                Add(cmd, "@p_page_size", query.PageSize, DbType.Int32);
                await using var reader = await cmd.ExecuteReaderAsync(ct);
                while (await reader.ReadAsync(ct)) items.Add(Map(reader));
            }

            int total;
            await using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = "CALL sp_MiddlemanCountNotifications(@p_user_id,@p_search,@p_category,@p_priority,@p_status,@p_time_range);";
                AddFilters(cmd, userId, query);
                var value = await cmd.ExecuteScalarAsync(ct);
                total = Convert.ToInt32(value);
            }
            return new MiddlemanNotificationPageDto { Items = items, TotalRecords = total, Page = query.Page, PageSize = query.PageSize };
        }

        public async Task<MiddlemanNotificationStatsDto> GetStatsAsync(long userId, CancellationToken ct)
        {
            var connection = await OpenAsync(ct);
            await using var cmd = connection.CreateCommand();
            cmd.CommandText = "CALL sp_MiddlemanGetNotificationStatus(@p_user_id);";
            Add(cmd, "@p_user_id", userId, DbType.Int64);
            await using var reader = await cmd.ExecuteReaderAsync(ct);
            if (!await reader.ReadAsync(ct)) return new MiddlemanNotificationStatsDto();
            return new MiddlemanNotificationStatsDto
            {
                Total = Convert.ToInt32(reader["total"]),
                Unread = Convert.ToInt32(reader["unread"]),
                HighPriorityUnread = Convert.ToInt32(reader["high_priority_unread"]),
                Read = Convert.ToInt32(reader["read_count"])
            };
        }

        public async Task<IReadOnlyList<MiddlemanNotificationDto>> GetLatestAsync(long userId, int take, CancellationToken ct)
        {
            var result = new List<MiddlemanNotificationDto>();
            var connection = await OpenAsync(ct);
            await using var cmd = connection.CreateCommand();
            cmd.CommandText = "CALL sp_MiddlemanGetLatestNotifications(@p_user_id,@p_take);";
            Add(cmd, "@p_user_id", userId, DbType.Int64);
            Add(cmd, "@p_take", take, DbType.Int32);
            await using var reader = await cmd.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct)) result.Add(Map(reader));
            return result;
        }

        public async Task<bool> MarkReadAsync(long userId, long notificationId, CancellationToken ct)
        {
            var connection = await OpenAsync(ct);
            await using var cmd = connection.CreateCommand();
            cmd.CommandText = "CALL sp_MiddlemanMarkNotificationRead(@p_user_id,@p_notification_id);";
            Add(cmd, "@p_user_id", userId, DbType.Int64);
            Add(cmd, "@p_notification_id", notificationId, DbType.Int64);
            var value = await cmd.ExecuteScalarAsync(ct);
            return Convert.ToInt32(value) > 0;
        }

        public async Task<int> MarkAllReadAsync(long userId, CancellationToken ct)
        {
            var connection = await OpenAsync(ct);
            await using var cmd = connection.CreateCommand();
            cmd.CommandText = "CALL sp_MiddlemanMarkAllNotificationsRead(@p_user_id);";
            Add(cmd, "@p_user_id", userId, DbType.Int64);
            var value = await cmd.ExecuteScalarAsync(ct);
            return Convert.ToInt32(value);
        }

        public async Task<bool> DeleteAsync(long userId, long notificationId, CancellationToken ct)
        {
            var connection = await OpenAsync(ct);
            await using var cmd = connection.CreateCommand();
            cmd.CommandText = "CALL sp_MiddlemanDeleteNotification(@p_user_id,@p_notification_id);";
            Add(cmd, "@p_user_id", userId, DbType.Int64);
            Add(cmd, "@p_notification_id", notificationId, DbType.Int64);
            var value = await cmd.ExecuteScalarAsync(ct);
            return Convert.ToInt32(value) > 0;
        }

        public async Task<long> CreateAsync(long userId, MiddlemanNotificationDto n, CancellationToken ct)
        {
            var connection = await OpenAsync(ct);
            await using var cmd = connection.CreateCommand();
            cmd.CommandText = "CALL sp_MiddlemanCreateNotification(@p_user_id,@p_title,@p_description,@p_category,@p_priority,@p_actor_name,@p_reference_number,@p_module_url);";
            Add(cmd, "@p_user_id", userId, DbType.Int64);
            Add(cmd, "@p_title", n.Title);
            Add(cmd, "@p_description", n.Description);
            Add(cmd, "@p_category", n.Category);
            Add(cmd, "@p_priority", n.Priority);
            Add(cmd, "@p_actor_name", n.ActorName);
            Add(cmd, "@p_reference_number", n.ReferenceNumber);
            Add(cmd, "@p_module_url", n.ModuleUrl);
            var value = await cmd.ExecuteScalarAsync(ct);
            return Convert.ToInt64(value);
        }

        private static MiddlemanNotificationDto Map(DbDataReader r) => new()
        {
            Id = Convert.ToInt64(r["id"]),
            Title = r["title"]?.ToString() ?? "",
            Description = r["description"]?.ToString() ?? "",
            Category = r["category"]?.ToString() ?? "",
            Priority = r["priority"]?.ToString() ?? "",
            ActorName = r["actor_name"] is DBNull ? null : r["actor_name"].ToString(),
            ReferenceNumber = r["reference_number"] is DBNull ? null : r["reference_number"].ToString(),
            ModuleUrl = r["module_url"] is DBNull ? null : r["module_url"].ToString(),
            IsRead = Convert.ToBoolean(r["is_read"]),
            CreatedAt = Convert.ToDateTime(r["created_at"])
        };
    }
}
