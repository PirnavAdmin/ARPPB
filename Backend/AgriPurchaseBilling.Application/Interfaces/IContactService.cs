using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IContactService
    {
        Task<ApiResponse<List<FarmerContactSummaryDto>>> SearchContactsAsync(string category, string? prefix, int limit, CancellationToken ct = default);

        Task<ApiResponse<FarmerContactDetailsDto>> GetContactDetailsAsync(long id, string category, CancellationToken ct = default);
    }
}
