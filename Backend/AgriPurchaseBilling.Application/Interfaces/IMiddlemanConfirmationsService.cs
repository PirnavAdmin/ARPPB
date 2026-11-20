using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IMiddlemanConfirmationsService
    {
        Task<MiddlemanOtpSummaryDto> GetSummaryAsync(long middlemanId);
        Task<MiddlemanOtpPageDto> GetConfirmationsAsync(long middlemanId, MiddlemanOtpQueryDto query);
        Task<MiddlemanConfirmationDto?> GetConfirmationByIdAsync(long middlemanId, string id);
        Task<MiddlemanConfirmationDto> VerifyOtpAsync(long middlemanId, string id, string enteredOtp);
        Task<MiddlemanConfirmationDto> ResendOtpAsync(long middlemanId, string id);
        Task<MiddlemanConfirmationDto> RejectOtpAsync(long middlemanId, string id, string reason);
    }
}
