using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IContactRepository
    {
        /// <summary>
        /// Searches contacts across registered platform actors (Middleman, Vendor, Customer) using EF Core LINQ.
        /// </summary>
        Task<List<FarmerContactSummaryDto>> SearchContactsAsync(string category, string? prefix, int limit, CancellationToken ct = default);

        /// <summary>
        /// Retrieves complete contact information for the specified actor by ID and category.
        /// </summary>
        Task<FarmerContactDetailsDto?> GetContactDetailsAsync(long id, string category, CancellationToken ct = default);
    }
}
