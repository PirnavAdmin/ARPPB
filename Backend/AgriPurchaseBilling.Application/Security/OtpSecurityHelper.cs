using System.Security.Cryptography;

namespace AgriPurchaseBilling.Application.Security
{
    public static class OtpSecurityHelper
    {
        private const int SaltSize = 16;
        private const int KeySize = 32;
        private const int Iterations = 100000;
        private static readonly HashAlgorithmName Algorithm = HashAlgorithmName.SHA256;
        private const char SegmentDelimiter = ':';

        public static string Generate6DigitOtp()
        {
            return RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        }

        public static string HashOtp(string otp)
        {
            byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);
            byte[] hash = Rfc2898DeriveBytes.Pbkdf2(otp, salt, Iterations, Algorithm, KeySize);

            return string.Join(
                SegmentDelimiter,
                Convert.ToHexString(hash),
                Convert.ToHexString(salt),
                Iterations,
                Algorithm
            );
        }

        public static bool VerifyOtp(string otp, string storedHash)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(otp) || string.IsNullOrWhiteSpace(storedHash))
                {
                    return false;
                }

                string[] segments = storedHash.Split(SegmentDelimiter);
                if (segments.Length != 4)
                {
                    return false;
                }

                byte[] hash = Convert.FromHexString(segments[0]);
                byte[] salt = Convert.FromHexString(segments[1]);
                int iterations = int.Parse(segments[2]);

                if (iterations <= 0 || hash.Length == 0 || salt.Length == 0)
                {
                    return false;
                }

                var algorithm = new HashAlgorithmName(segments[3]);

                byte[] inputHash = Rfc2898DeriveBytes.Pbkdf2(
                    otp,
                    salt,
                    iterations,
                    algorithm,
                    hash.Length
                );

                return CryptographicOperations.FixedTimeEquals(hash, inputHash);
            }
            catch
            {
                return false;
            }
        }
    }
}
