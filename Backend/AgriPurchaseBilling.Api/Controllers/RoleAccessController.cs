using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers
{

    [ApiController]
    [Route("api/v1/role-access")]
    public class RoleAccessController : ControllerBase
    {
        // ==========================================
        // FARMER ACCESS
        // ==========================================

        [HttpGet("farmer")]
        [Authorize(Roles = "Farmer")]
        public IActionResult FarmerAccess()
        {
            return Ok(new
            {
                Success = true,
                Message = "Farmer access granted.",

                UserId = User.FindFirst(
                    ClaimTypes.NameIdentifier)?.Value,

                UserName = User.FindFirst(
                    ClaimTypes.Name)?.Value,

                Role = User.FindFirst(
                    ClaimTypes.Role)?.Value
            });
        }

        // ==========================================
        // CUSTOMER ACCESS
        // ==========================================

        [HttpGet("customer")]
        [Authorize(Roles = "Customer")]
        public IActionResult CustomerAccess()
        {
            return Ok(new
            {
                Success = true,
                Message = "Customer access granted.",

                UserId = User.FindFirst(
                    ClaimTypes.NameIdentifier)?.Value,

                UserName = User.FindFirst(
                    ClaimTypes.Name)?.Value,

                Role = User.FindFirst(
                    ClaimTypes.Role)?.Value
            });
        }

        // ==========================================
        // MIDDLEMAN ACCESS
        // ==========================================

        [HttpGet("middleman")]
        [Authorize(Roles = "Middleman")]
        public IActionResult MiddlemanAccess()
        {
            return Ok(new
            {
                Success = true,
                Message = "Middleman access granted.",

                UserId = User.FindFirst(
                    ClaimTypes.NameIdentifier)?.Value,

                UserName = User.FindFirst(
                    ClaimTypes.Name)?.Value,

                Role = User.FindFirst(
                    ClaimTypes.Role)?.Value
            });
        }

        // ==========================================
        // VENDOR ACCESS
        // ==========================================

        [HttpGet("vendor")]
        [Authorize(Roles = "Vendor")]
        public IActionResult VendorAccess()
        {
            return Ok(new
            {
                Success = true,
                Message = "Vendor access granted.",

                UserId = User.FindFirst(
                    ClaimTypes.NameIdentifier)?.Value,

                UserName = User.FindFirst(
                    ClaimTypes.Name)?.Value,

                Role = User.FindFirst(
                    ClaimTypes.Role)?.Value
            });
        }

        // ==========================================
        // COMMON ACCESS FOR ALL AUTHENTICATED USERS
        // ==========================================

        [HttpGet("profile")]
        [Authorize]
        public IActionResult GetMyProfile()
        {
            return Ok(new
            {
                Success = true,
                Message = "Authenticated user access granted.",

                UserId = User.FindFirst(
                    ClaimTypes.NameIdentifier)?.Value,

                UserName = User.FindFirst(
                    ClaimTypes.Name)?.Value,

                Mobile = User.FindFirst("Mobile")?.Value,

                Email = User.FindFirst(
                    ClaimTypes.Email)?.Value,

                Role = User.FindFirst(
                    ClaimTypes.Role)?.Value
            });
        }

        // ==========================================
        // COMMON ACCESS FOR SELECTED ROLES
        // ==========================================

        [HttpGet("business-access")]
        [Authorize(Roles = "Farmer,Customer,Middleman,Vendor")]
        public IActionResult BusinessAccess()
        {
            return Ok(new
            {
                Success = true,
                Message = "Business access granted.",

                UserId = User.FindFirst(
                    ClaimTypes.NameIdentifier)?.Value,

                Role = User.FindFirst(
                    ClaimTypes.Role)?.Value
            });
        }
    }
}