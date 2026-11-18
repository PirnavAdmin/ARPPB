using System.Security.Cryptography;
using System.Text;
using AgriPurchaseBilling.Application.Interfaces.VendorPortal;

namespace AgriPurchaseBilling.Application.Security
{
    /// <summary>
    /// The vp_* stored procedures verify an OTP against "salt:lowercase-hex(SHA256(salt + otp))".
    /// </summary>
    public sealed class VendorOtpGenerator : IVendorOtpGenerator
    {
        public int ExpiryMinutes => 10;

        public (string Otp, string Hash) Generate()
        {
            var otp = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
            var salt = Convert.ToHexString(RandomBytes(8)).ToLowerInvariant();
            var digest = SHA256.HashData(Encoding.UTF8.GetBytes(salt + otp));
            return (otp, $"{salt}:{Convert.ToHexString(digest).ToLowerInvariant()}");
        }

        private static byte[] RandomBytes(int count)
        {
            var bytes = new byte[count];
            RandomNumberGenerator.Fill(bytes);
            return bytes;
        }
    }
}
