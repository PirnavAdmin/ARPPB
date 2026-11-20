using System.Collections.Generic;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IMiddlemanLedgerService
    {
        Task<MiddlemanLedgerSummaryDto> GetSummaryAsync(long userId);
        Task<List<MiddlemanLedgerDto>> GetAllAsync(long userId);
        Task<MiddlemanLedgerDto?> GetByIdAsync(long id, long userId);
        Task<MiddlemanLedgerDto> CreateAsync(CreateLedgerEntryRequest request, long userId);
        Task<MiddlemanLedgerDto?> UpdateAsync(long id, UpdateLedgerEntryRequest request, long userId);
        Task<MiddlemanLedgerDto?> SettleAsync(long id, SettleLedgerRequest? request, long userId);
    }
}
