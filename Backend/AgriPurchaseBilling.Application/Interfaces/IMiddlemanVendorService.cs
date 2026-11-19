using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IMiddlemanVendorService
    {
        Task<MiddlemanVendorPageDto> GetVendorsAsync(long middlemanId, MiddlemanVendorQueryDto query);
        Task<MiddlemanVendorDto?> GetVendorByIdAsync(long middlemanId, string vendorId);
        Task<MiddlemanVendorDto> RegisterVendorAsync(long middlemanId, RegisterVendorRequest request);
        Task<MiddlemanVendorDto?> UpdateVendorAsync(long middlemanId, string vendorId, UpdateVendorRequest request);

        Task<MiddlemanVendorSalePageDto> GetVendorSalesAsync(long middlemanId, MiddlemanVendorSaleQueryDto query);
        Task<MiddlemanVendorSaleDto?> GetVendorSaleByIdAsync(long middlemanId, string saleId);
        Task<MiddlemanVendorSaleDto> CreateVendorSaleAsync(long middlemanId, CreateMiddlemanVendorSaleRequest request);
    }
}
