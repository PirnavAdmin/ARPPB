using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IMiddlemanCustomerService
    {
        Task<MiddlemanCustomerPageDto> GetCustomersAsync(long middlemanId, MiddlemanCustomerQueryDto query);
        Task<MiddlemanCustomerDto?> GetCustomerByIdAsync(long middlemanId, string customerId);
        Task<MiddlemanCustomerDto> RegisterCustomerAsync(long middlemanId, RegisterCustomerRequest request);
        Task<MiddlemanCustomerDto?> UpdateCustomerAsync(long middlemanId, string customerId, UpdateCustomerRequest request);

        Task<MiddlemanCustomerSalePageDto> GetCustomerSalesAsync(long middlemanId, MiddlemanCustomerSaleQueryDto query);
        Task<MiddlemanCustomerSaleDto?> GetCustomerSaleByIdAsync(long middlemanId, string saleId);
        Task<MiddlemanCustomerSaleDto> CreateCustomerSaleAsync(long middlemanId, CreateMiddlemanCustomerSaleRequest request);
    }
}
