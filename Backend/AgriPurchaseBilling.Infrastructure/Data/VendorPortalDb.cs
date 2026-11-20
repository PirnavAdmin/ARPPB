using System.Collections.Concurrent;
using System.Data;
using System.Data.Common;
using System.Globalization;
using System.Reflection;
using AgriPurchaseBilling.Application.Interfaces.VendorPortal;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

namespace AgriPurchaseBilling.Infrastructure.Data
{
    /// <summary>
    /// Thin ADO.NET gateway to the arppb MySQL database used by the vendor-portal modules.
    /// Stored procedures signal business errors with SQLSTATE 45000 and the text "httpStatus|message";
    /// those are translated to <see cref="VendorPortalException"/>.
    /// </summary>
    public sealed class VendorPortalDb
    {
        private readonly string _connectionString;

        public VendorPortalDb(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Database connection string is missing.");
        }

        public Task<T> ProcAsync<T>(
            string procedure,
            (string Name, object? Value)[] args,
            Func<DbDataReader, Task<T>> read,
            CancellationToken ct) =>
            RunAsync(procedure, CommandType.StoredProcedure, args, read, ct);

        public Task<T> QueryAsync<T>(
            string sql,
            (string Name, object? Value)[] args,
            Func<DbDataReader, Task<T>> read,
            CancellationToken ct) =>
            RunAsync(sql, CommandType.Text, args, read, ct);

        public async Task<int> ExecuteAsync(string sql, (string Name, object? Value)[] args, CancellationToken ct)
        {
            try
            {
                await using var connection = new MySqlConnection(_connectionString);
                await connection.OpenAsync(ct);
                await using var command = Build(connection, sql, CommandType.Text, args);
                return await command.ExecuteNonQueryAsync(ct);
            }
            catch (MySqlException ex) when (TryTranslate(ex, out var translated))
            {
                throw translated!;
            }
        }

        private async Task<T> RunAsync<T>(
            string text,
            CommandType type,
            (string Name, object? Value)[] args,
            Func<DbDataReader, Task<T>> read,
            CancellationToken ct)
        {
            try
            {
                await using var connection = new MySqlConnection(_connectionString);
                await connection.OpenAsync(ct);
                await using var command = Build(connection, text, type, args);
                await using var reader = await command.ExecuteReaderAsync(ct);
                return await read(reader);
            }
            catch (MySqlException ex) when (TryTranslate(ex, out var translated))
            {
                throw translated!;
            }
        }

        private static MySqlCommand Build(
            MySqlConnection connection,
            string text,
            CommandType type,
            (string Name, object? Value)[] args)
        {
            var command = new MySqlCommand(text, connection) { CommandType = type };
            foreach (var (name, value) in args)
            {
                command.Parameters.Add(new MySqlParameter(name, value ?? DBNull.Value));
            }
            return command;
        }

        private static bool TryTranslate(MySqlException ex, out VendorPortalException? translated)
        {
            translated = null;
            if (ex.SqlState != "45000") return false;

            var separator = ex.Message.IndexOf('|');
            if (separator > 0 && int.TryParse(ex.Message[..separator], out var status))
            {
                translated = new VendorPortalException(status, ex.Message[(separator + 1)..]);
            }
            else
            {
                translated = new VendorPortalException(400, ex.Message);
            }
            return true;
        }
    }

    /// <summary>Maps result-set rows (snake_case columns) onto DTO properties (PascalCase).</summary>
    public static class RowMapper
    {
        private static readonly ConcurrentDictionary<Type, Dictionary<string, PropertyInfo>> Cache = new();

        public static async Task<List<T>> ReadListAsync<T>(DbDataReader reader) where T : new()
        {
            var map = Cache.GetOrAdd(typeof(T), BuildMap);
            var targets = new PropertyInfo?[reader.FieldCount];
            for (var i = 0; i < reader.FieldCount; i++)
            {
                map.TryGetValue(Normalize(reader.GetName(i)), out targets[i]);
            }

            var rows = new List<T>();
            while (await reader.ReadAsync())
            {
                var item = new T();
                for (var i = 0; i < targets.Length; i++)
                {
                    var property = targets[i];
                    if (property is null || reader.IsDBNull(i)) continue;
                    property.SetValue(item, Convert(reader.GetValue(i), property.PropertyType));
                }
                rows.Add(item);
            }
            return rows;
        }

        public static async Task<T?> ReadFirstAsync<T>(DbDataReader reader) where T : class, new()
        {
            var rows = await ReadListAsync<T>(reader);
            return rows.Count > 0 ? rows[0] : null;
        }

        public static async Task<long> ReadScalarLongAsync(DbDataReader reader)
        {
            if (await reader.ReadAsync() && !reader.IsDBNull(0))
            {
                return System.Convert.ToInt64(reader.GetValue(0), CultureInfo.InvariantCulture);
            }
            return 0;
        }

        private static Dictionary<string, PropertyInfo> BuildMap(Type type) =>
            type.GetProperties(BindingFlags.Public | BindingFlags.Instance)
                .Where(p => p.CanWrite)
                .ToDictionary(p => Normalize(p.Name), p => p);

        private static string Normalize(string name) =>
            name.Replace("_", string.Empty).ToLowerInvariant();

        private static object? Convert(object value, Type target)
        {
            var type = Nullable.GetUnderlyingType(target) ?? target;

            if (type == typeof(bool))
                return value is bool b ? b : System.Convert.ToInt64(value, CultureInfo.InvariantCulture) != 0;

            if (type == typeof(DateTime))
            {
                var date = (DateTime)value;
                return date.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(date, DateTimeKind.Utc) : date;
            }

            if (type == typeof(string))
                return System.Convert.ToString(value, CultureInfo.InvariantCulture);

            return System.Convert.ChangeType(value, type, CultureInfo.InvariantCulture);
        }
    }
}
