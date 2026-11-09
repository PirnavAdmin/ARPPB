using FluentValidation;
using AgriPurchaseBilling.Application.DTOs;
 
namespace AgriPurchaseBilling.Application.Validators;
 
public class RegisterRequestValidator : AbstractValidator<RegisterRequestDto>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full Name is required.")
            .MinimumLength(2).WithMessage("Full Name must be at least 2 characters.")
            .MaximumLength(100).WithMessage("Full Name cannot exceed 100 characters.");
 
        // Email is optional
        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Please enter a valid email address.")
            .MaximumLength(100).WithMessage("Email cannot exceed 100 characters.")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));
 
        RuleFor(x => x.Mobile)
            .NotEmpty().WithMessage("Mobile number is required.")
            .Matches(@"^[6-9]\d{9}$")
            .WithMessage("Mobile number must be a valid 10-digit Indian mobile number.");
 
        RuleFor(x => x.Role)
            .IsInEnum()
            .WithMessage("Invalid Role. Must be Farmer (1), Customer (2), Supplier (3), or Vendor (4).");
 
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters long.");
 
        RuleFor(x => x.ConfirmPassword)
            .NotEmpty().WithMessage("Confirm Password is required.")
            .Equal(x => x.Password).WithMessage("Password and Confirm Password do not match.");
    }
}