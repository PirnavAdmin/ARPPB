using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AgriPurchaseBilling.Infrastructure.Services
{
    public class JwtTokenGenerator : IJwtTokenGenerator
    {
        private readonly IConfiguration _configuration;

        public JwtTokenGenerator(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public (string Token, DateTime ExpiresAt) GenerateToken(User user)
        {
            return GenerateToken(
                user.Id,
                user.FullName,
                user.Mobile,
                user.Email,
                user.Role.ToString());
        }

        public (string Token, DateTime ExpiresAt) GenerateToken(
            long userId,
            string fullName,
            string mobile,
            string? email,
            string role)
        {
            var secret = _configuration["JwtSettings:SecretKey"]
                ?? throw new InvalidOperationException(
                    "JWT secret is missing.");

            byte[] keyBytes = Convert.FromBase64String(secret);

            if (keyBytes.Length < 32)
            {
                throw new InvalidOperationException("JWT secret must contain at least 32 random bytes.");
            }

            var securityKey = new SymmetricSecurityKey(keyBytes);

            var credentials = new SigningCredentials(
                securityKey, SecurityAlgorithms.HmacSha256);

            var expiresAt = DateTime.UtcNow.AddMinutes(
                int.Parse(_configuration["JwtSettings:ExpiryMinutes"] ?? "60"));

            var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),

            new Claim(ClaimTypes.Name, fullName),

            new Claim(ClaimTypes.Role, role),

            new Claim("Mobile", mobile)
        };

            if (!string.IsNullOrWhiteSpace(email))
            {
                claims.Add(new Claim(ClaimTypes.Email, email));
            }

            var jwtToken = new JwtSecurityToken(
                issuer: _configuration["JwtSettings:Issuer"],
                audience: _configuration["JwtSettings:Audience"],
                claims: claims,
                expires: expiresAt,
                signingCredentials: credentials
            );

            string token = new JwtSecurityTokenHandler().WriteToken(jwtToken);

            return (token, expiresAt);
        }
    }
}
