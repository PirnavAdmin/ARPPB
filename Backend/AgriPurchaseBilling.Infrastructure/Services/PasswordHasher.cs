using System.Security.Cryptography;
using AgriPurchaseBilling.Application.Interfaces;

namespace AgriPurchaseBilling.Infrastructure.Services;

public class PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const int Iterations = 100000;
    private static readonly HashAlgorithmName Algorithm =
        HashAlgorithmName.SHA256;

    private const char SegmentDelimiter = ':';

    public string HashPassword(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);

        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(
            password, salt, Iterations, Algorithm, KeySize);

        return string.Join(
            SegmentDelimiter,
            Convert.ToHexString(hash),
            Convert.ToHexString(salt),
            Iterations,
            Algorithm
        );
    }

    public bool VerifyPassword(string password, string hashedPassword)
    {
        try
        {
            if (string.IsNullOrEmpty(password) ||
                string.IsNullOrWhiteSpace(hashedPassword))
            {
                return false;
            }

            string[] segments = hashedPassword.Split(SegmentDelimiter);

            if (segments.Length != 4)
                return false;

            byte[] hash = Convert.FromHexString(segments[0]);
            byte[] salt = Convert.FromHexString(segments[1]);

            int iterations = int.Parse(segments[2]);

            if (iterations <= 0 || hash.Length == 0 || salt.Length == 0)
                return false;

            var algorithm = new HashAlgorithmName(segments[3]);

            byte[] inputHash = Rfc2898DeriveBytes.Pbkdf2(
                password,
                salt,
                iterations,
                algorithm,
                hash.Length);

            return CryptographicOperations.FixedTimeEquals(
                hash, inputHash);
        }
        catch (Exception)
        {
            return false;
        }
    }
}