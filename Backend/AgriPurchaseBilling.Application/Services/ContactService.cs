using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;

namespace AgriPurchaseBilling.Application.Services
{
    public class ContactService : IContactService
    {
        private static readonly HashSet<string> ValidCategories = new(StringComparer.OrdinalIgnoreCase)
        {
            "Middleman",
            "Vendor",
            "Customer"
        };

        private readonly IContactRepository _contactRepository;

        public ContactService(IContactRepository contactRepository)
        {
            _contactRepository = contactRepository;
        }

        public async Task<ApiResponse<List<FarmerContactSummaryDto>>> SearchContactsAsync(
            string category,
            string? prefix,
            int limit,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(category) || !ValidCategories.Contains(category.Trim()))
            {
                return ApiResponse<List<FarmerContactSummaryDto>>.Fail("Invalid category. Must be 'Middleman', 'Vendor', or 'Customer'.");
            }

            int clampedLimit = limit switch
            {
                <= 0 => 10,
                > 10 => 10,
                _ => limit
            };

            string? trimmedPrefix = prefix?.Trim();

            var contacts = await _contactRepository.SearchContactsAsync(
                category.Trim(),
                trimmedPrefix,
                clampedLimit,
                ct);

            return ApiResponse<List<FarmerContactSummaryDto>>.Ok(contacts, "Contacts retrieved successfully.");
        }

        public async Task<ApiResponse<FarmerContactDetailsDto>> GetContactDetailsAsync(
            long id,
            string category,
            CancellationToken ct = default)
        {
            if (id <= 0)
            {
                return ApiResponse<FarmerContactDetailsDto>.Fail("Invalid contact ID.");
            }

            if (string.IsNullOrWhiteSpace(category) || !ValidCategories.Contains(category.Trim()))
            {
                return ApiResponse<FarmerContactDetailsDto>.Fail("Invalid category. Must be 'Middleman', 'Vendor', or 'Customer'.");
            }

            var contact = await _contactRepository.GetContactDetailsAsync(id, category.Trim(), ct);
            if (contact == null)
            {
                return ApiResponse<FarmerContactDetailsDto>.Fail("Contact not found.");
            }

            return ApiResponse<FarmerContactDetailsDto>.Ok(contact, "Contact details retrieved successfully.");
        }
    }
}
