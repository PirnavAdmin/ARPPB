using System;
using System.Collections.Generic;
using System.Linq;
using AgriPurchaseBilling.Application.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Produces("application/json")]
public class FarmerController : ControllerBase
{
    // In-memory data store for Farmer module operations
    private static FarmerProfileDto _profile = new()
    {
        FarmerId = "AG-FARM-5021",
        FarmerName = "Venkata Reddy",
        MobileNumber = "9876543210",
        Email = "venkata.reddy@agriconnect.in",
        FarmName = "Reddy Agro Farms & Greenfields",
        Village = "Tadepalli",
        Mandal = "Mangalagiri",
        District = "Guntur",
        State = "Andhra Pradesh",
        PinCode = "522501",
        CompleteAddress = "D.No: 4-128, Main Road, Tadepalli, Mangalagiri Mandal, Guntur District, AP - 522501",
        TotalLandArea = "18.5 Acres (Alluvial & Black Cotton Soil)",
        PrimaryCrops = "Paddy, Groundnut, Turmeric, Chilli",
        SoilHealthCard = "Valid (N: Normal, P: High, K: Adequate, pH: 7.2)",
        IrrigationType = "Borewell & Canal Drip System",
        Membership = "Verified Platinum Farmer",
        Rating = "4.9 / 5.0 (142 Successful Trades)",
        BankDetails = new BankDetailsDto
        {
            BankName = "State Bank of India",
            AccountNumber = "••••••••4821",
            FullAccountNumber = "3829104821039",
            IfscCode = "SBIN0001245",
            Branch = "Mangalagiri Main Branch",
            AccountType = "Agricultural Savings Account (KCC Linked)"
        }
    };

    private static readonly List<CropDto> _crops = new()
    {
        new CropDto
        {
            Id = "CROP-001",
            Name = "Paddy",
            Category = "Cereal",
            Variety = "BPT 5204 (Samba Mahsuri)",
            Season = "Kharif",
            CultivationArea = 6.5m,
            HarvestDate = "2026-01-10",
            AvailableQuantity = 420,
            HarvestedQuantity = 600,
            SoldQuantity = 180,
            ReservedQuantity = 0,
            Unit = "qtl",
            ExpectedSellingPrice = 2250,
            QualityGrade = "Grade A",
            Village = "Tadepalli",
            District = "Guntur",
            State = "Andhra Pradesh",
            Description = "Fine grain, excellent milling recovery, moisture content 13%, freshly dried.",
            Status = "Ready to Sell",
            Color = "#237A45"
        },
        new CropDto
        {
            Id = "CROP-002",
            Name = "Turmeric",
            Category = "Spices",
            Variety = "Salem High Curcumin",
            Season = "Annual",
            CultivationArea = 3.0m,
            HarvestDate = "2025-12-18",
            AvailableQuantity = 185,
            HarvestedQuantity = 240,
            SoldQuantity = 40,
            ReservedQuantity = 15,
            Unit = "qtl",
            ExpectedSellingPrice = 8400,
            QualityGrade = "Grade A",
            Village = "Tadepalli",
            District = "Guntur",
            State = "Andhra Pradesh",
            Description = "Deep golden yellow fingers, curcumin content > 4.2%, well-polished.",
            Status = "High Demand",
            Color = "#D97706"
        },
        new CropDto
        {
            Id = "CROP-003",
            Name = "Groundnut",
            Category = "Oilseed",
            Variety = "K-6 (Kadiri 6)",
            Season = "Rabi",
            CultivationArea = 4.0m,
            HarvestDate = "2026-01-22",
            AvailableQuantity = 260,
            HarvestedQuantity = 350,
            SoldQuantity = 70,
            ReservedQuantity = 20,
            Unit = "qtl",
            ExpectedSellingPrice = 6100,
            QualityGrade = "Grade A",
            Village = "Mangalagiri",
            District = "Guntur",
            State = "Andhra Pradesh",
            Description = "High oil yield (48%), bold two-seeded pods, properly sun-dried.",
            Status = "Ready to Sell",
            Color = "#B45309"
        }
    };

    private static readonly List<MarketPriceDto> _marketPrices = new()
    {
        new MarketPriceDto
        {
            Id = "MP-001",
            Commodity = "Paddy (Common)",
            Variety = "BPT 5204",
            Market = "Tenali AMC",
            District = "Guntur",
            State = "Andhra Pradesh",
            ModalPrice = 2280,
            MinPrice = 2150,
            MaxPrice = 2360,
            Unit = "₹/qtl",
            PriceDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            ChangePercent = 2.4m,
            Trend = "up"
        },
        new MarketPriceDto
        {
            Id = "MP-002",
            Commodity = "Turmeric",
            Variety = "Finger (Salem)",
            Market = "Duggirala Mandi",
            District = "Guntur",
            State = "Andhra Pradesh",
            ModalPrice = 8650,
            MinPrice = 8200,
            MaxPrice = 9100,
            Unit = "₹/qtl",
            PriceDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            ChangePercent = 4.8m,
            Trend = "up"
        },
        new MarketPriceDto
        {
            Id = "MP-003",
            Commodity = "Groundnut Pods",
            Variety = "Kadiri-6",
            Market = "Guntur Yard",
            District = "Guntur",
            State = "Andhra Pradesh",
            ModalPrice = 6150,
            MinPrice = 5800,
            MaxPrice = 6350,
            Unit = "₹/qtl",
            PriceDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            ChangePercent = -0.8m,
            Trend = "down"
        }
    };

    private static readonly List<SaleTransactionDto> _sales = new()
    {
        new SaleTransactionDto
        {
            Id = "TXN-2026-0891",
            Date = DateTime.UtcNow.AddDays(-2).ToString("yyyy-MM-dd"),
            CropId = "CROP-001",
            CropName = "Paddy",
            BuyerName = "Sri Rayalaseema Agro Traders",
            BuyerCategory = "Vendor",
            BuyerMobile = "9440112233",
            Quantity = 180,
            Unit = "qtl",
            Rate = 2250,
            TotalAmount = 405000,
            TransactionStatus = "Confirmed",
            OtpStatus = "Verified",
            ExpectedPaymentDate = DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-dd"),
            PaymentStatus = "Payment Expected",
            PickupLocation = "Reddy Agro Farms, Tadepalli",
            Notes = "Direct mill procurement batch 1",
            QualityGrade = "Grade A"
        }
    };

    private static readonly List<PurchaseRecordDto> _purchases = new()
    {
        new PurchaseRecordDto
        {
            Id = "PUR-AGRI-2026-012",
            Date = DateTime.UtcNow.AddDays(-14).ToString("yyyy-MM-dd"),
            ItemName = "Certified BPT 5204 Foundation Seeds",
            Category = "Seeds",
            SupplierName = "AP State Seeds Development Corp",
            SupplierCategory = "Government Agency",
            Quantity = 8,
            Unit = "Bags (30kg)",
            Rate = 1850,
            TotalAmount = 14800,
            PaymentStatus = "Paid",
            InvoiceNumber = "INV-APSEED-8821",
            Notes = "Rabi certified seed procurement"
        }
    };

    private static readonly List<OtpRequestDto> _otpRequests = new()
    {
        new OtpRequestDto
        {
            Id = "OTP-2026-891",
            TransactionId = "TXN-2026-0891",
            BuyerName = "Sri Rayalaseema Agro Traders",
            BuyerCategory = "Vendor",
            BuyerMobile = "9440112233",
            Crop = "Paddy",
            CropId = "CROP-001",
            Quantity = 180,
            Unit = "qtl",
            Rate = 2250,
            TotalAmount = 405000,
            RequestDate = "10:30 AM",
            OtpStatus = "Confirmed",
            OtpCode = "849201",
            ExpiresAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            ExpiresInMinutes = 0,
            AttemptsLeft = 0,
            Direction = "buyer_to_farmer"
        }
    };

    private static readonly List<NotificationDto> _notifications = new()
    {
        new NotificationDto
        {
            Id = "NOTIF-001",
            Title = "Mandi Price Surge Alert",
            Detail = "Turmeric prices gained +4.8% today at Duggirala Mandi. Current modal rate: ₹8,650/qtl.",
            Time = "2 hours ago",
            Timestamp = DateTime.UtcNow.AddHours(-2).ToString("o"),
            Type = "success",
            Category = "prices",
            Read = false,
            TargetPage = "prices"
        }
    };

    // 1. GET DASHBOARD SUMMARY
    [HttpGet("dashboard")]
    public IActionResult GetDashboard()
    {
        var dashboard = new FarmerDashboardDto
        {
            Profile = _profile,
            TotalCrops = _crops.Count,
            TotalHarvested = _crops.Sum(c => c.HarvestedQuantity),
            TotalAvailableStock = _crops.Sum(c => c.AvailableQuantity),
            ActiveSalesCount = _sales.Count(s => s.TransactionStatus == "Pending Confirmation"),
            TotalRevenue = _sales.Where(s => s.TransactionStatus == "Confirmed").Sum(s => s.TotalAmount),
            PendingOtpCount = _otpRequests.Count(o => o.OtpStatus == "Pending"),
            UnreadNotificationsCount = _notifications.Count(n => !n.Read),
            RecentSales = _sales.Take(5).ToList(),
            RecentCrops = _crops.Take(4).ToList(),
            MarketAlerts = _marketPrices.Take(3).ToList()
        };

        return Ok(new ApiResponse<FarmerDashboardDto>
        {
            Success = true,
            Message = "Farmer dashboard metrics retrieved successfully.",
            Data = dashboard
        });
    }

    // 2. PROFILE ENDPOINTS
    [HttpGet("profile")]
    public IActionResult GetProfile()
    {
        return Ok(new ApiResponse<FarmerProfileDto>
        {
            Success = true,
            Message = "Farmer profile retrieved successfully.",
            Data = _profile
        });
    }

    [HttpPut("profile")]
    public IActionResult UpdateProfile([FromBody] FarmerProfileDto request)
    {
        _profile = request;
        return Ok(new ApiResponse<FarmerProfileDto>
        {
            Success = true,
            Message = "Farmer profile updated successfully.",
            Data = _profile
        });
    }

    // 3. CROPS ENDPOINTS
    [HttpGet("crops")]
    public IActionResult GetCrops()
    {
        return Ok(new ApiResponse<List<CropDto>>
        {
            Success = true,
            Message = "Crops retrieved successfully.",
            Data = _crops
        });
    }

    [HttpPost("crops")]
    public IActionResult AddCrop([FromBody] CropDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Id))
        {
            request.Id = $"CROP-{DateTime.UtcNow:fff}{_crops.Count + 1}";
        }
        _crops.Insert(0, request);

        return StatusCode(StatusCodes.Status201Created, new ApiResponse<CropDto>
        {
            Success = true,
            Message = $"Crop {request.Name} added successfully.",
            Data = request
        });
    }

    [HttpPut("crops/{id}")]
    public IActionResult UpdateCrop(string id, [FromBody] CropDto request)
    {
        var index = _crops.FindIndex(c => c.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
        if (index == -1)
        {
            return NotFound(new ApiResponse<CropDto> { Success = false, Message = "Crop not found." });
        }
        request.Id = id;
        _crops[index] = request;

        return Ok(new ApiResponse<CropDto>
        {
            Success = true,
            Message = "Crop updated successfully.",
            Data = request
        });
    }

    [HttpDelete("crops/{id}")]
    public IActionResult DeleteCrop(string id)
    {
        var crop = _crops.FirstOrDefault(c => c.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
        if (crop == null)
        {
            return NotFound(new ApiResponse<bool> { Success = false, Message = "Crop not found." });
        }
        _crops.Remove(crop);

        return Ok(new ApiResponse<bool>
        {
            Success = true,
            Message = $"Crop {crop.Name} removed successfully.",
            Data = true
        });
    }

    [HttpPost("crops/{id}/harvest")]
    public IActionResult AddHarvest(string id, [FromBody] HarvestStockRequestDto request)
    {
        var crop = _crops.FirstOrDefault(c => c.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
        if (crop == null)
        {
            return NotFound(new ApiResponse<CropDto> { Success = false, Message = "Crop not found." });
        }

        crop.HarvestedQuantity += request.Quantity;
        crop.AvailableQuantity += request.Quantity;

        return Ok(new ApiResponse<CropDto>
        {
            Success = true,
            Message = $"Harvest stock of {request.Quantity} {request.Unit} added to {crop.Name}.",
            Data = crop
        });
    }

    // 4. STOCK OVERVIEW
    [HttpGet("stock")]
    public IActionResult GetStock()
    {
        var stockList = _crops.Select((c, i) => new StockRecordDto
        {
            Id = $"STK-{c.Id.Replace("CROP-", "")}",
            CropId = c.Id,
            CropName = c.Name,
            Variety = c.Variety,
            OpeningStock = c.HarvestedQuantity,
            HarvestedQuantity = c.HarvestedQuantity,
            SoldQuantity = c.SoldQuantity,
            ReservedQuantity = c.ReservedQuantity,
            AvailableQuantity = c.AvailableQuantity,
            Unit = c.Unit,
            LastUpdated = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            Status = c.AvailableQuantity < 50 ? "Low Stock" : "Normal",
            StorageLocation = $"Reddy Farm Warehouse Bay-{(i % 3) + 1}"
        }).ToList();

        return Ok(new ApiResponse<List<StockRecordDto>>
        {
            Success = true,
            Message = "Stock records retrieved successfully.",
            Data = stockList
        });
    }

    // 5. MARKET PRICES
    [HttpGet("market-prices")]
    public IActionResult GetMarketPrices()
    {
        return Ok(new ApiResponse<List<MarketPriceDto>>
        {
            Success = true,
            Message = "Market prices retrieved successfully.",
            Data = _marketPrices
        });
    }

    // 6. SALES ENDPOINTS
    [HttpGet("sales")]
    public IActionResult GetSales()
    {
        return Ok(new ApiResponse<List<SaleTransactionDto>>
        {
            Success = true,
            Message = "Sales transactions retrieved successfully.",
            Data = _sales
        });
    }

    [HttpPost("sales")]
    public IActionResult CreateSale([FromBody] SaleTransactionDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Id))
        {
            request.Id = $"TXN-{DateTime.UtcNow:yyyy}-{DateTime.UtcNow:ffffff}".Substring(0, 13);
        }
        if (string.IsNullOrWhiteSpace(request.Date))
        {
            request.Date = DateTime.UtcNow.ToString("yyyy-MM-dd");
        }
        request.TransactionStatus = "Pending Confirmation";
        request.OtpStatus = "Pending";

        _sales.Insert(0, request);

        // Deduct from available quantity and add to reserved
        var crop = _crops.FirstOrDefault(c => c.Id.Equals(request.CropId, StringComparison.OrdinalIgnoreCase) ||
                                              c.Name.Equals(request.CropName, StringComparison.OrdinalIgnoreCase));
        if (crop != null)
        {
            crop.ReservedQuantity += request.Quantity;
            crop.AvailableQuantity = Math.Max(0, crop.AvailableQuantity - request.Quantity);
        }

        return StatusCode(StatusCodes.Status201Created, new ApiResponse<SaleTransactionDto>
        {
            Success = true,
            Message = $"Sale {request.Id} created. Stock reserved pending OTP confirmation.",
            Data = request
        });
    }

    // 7. INPUT PURCHASES
    [HttpGet("purchases")]
    public IActionResult GetPurchases()
    {
        return Ok(new ApiResponse<List<PurchaseRecordDto>>
        {
            Success = true,
            Message = "Input purchases retrieved successfully.",
            Data = _purchases
        });
    }

    [HttpPost("purchases")]
    public IActionResult AddPurchase([FromBody] PurchaseRecordDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Id))
        {
            request.Id = $"PUR-AGRI-{DateTime.UtcNow:yyyy}-{DateTime.UtcNow:fff}";
        }
        if (string.IsNullOrWhiteSpace(request.Date))
        {
            request.Date = DateTime.UtcNow.ToString("yyyy-MM-dd");
        }
        _purchases.Insert(0, request);

        return StatusCode(StatusCodes.Status201Created, new ApiResponse<PurchaseRecordDto>
        {
            Success = true,
            Message = $"Purchase {request.Id} recorded successfully.",
            Data = request
        });
    }

    // 8. OTP REQUESTS & CONFIRMATIONS
    [HttpGet("otp-requests")]
    public IActionResult GetOtpRequests()
    {
        return Ok(new ApiResponse<List<OtpRequestDto>>
        {
            Success = true,
            Message = "OTP confirmation requests retrieved successfully.",
            Data = _otpRequests
        });
    }

    [HttpPost("otp-requests/{id}/verify")]
    public IActionResult VerifyOtp(string id, [FromBody] VerifyOtpRequestDto request)
    {
        var otp = _otpRequests.FirstOrDefault(o => o.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
        if (otp == null)
        {
            return NotFound(new ApiResponse<bool> { Success = false, Message = "OTP request not found." });
        }

        if (otp.OtpCode != request.OtpCode)
        {
            otp.AttemptsLeft = Math.Max(0, otp.AttemptsLeft - 1);
            if (otp.AttemptsLeft == 0)
            {
                otp.OtpStatus = "Expired";
            }
            return BadRequest(new ApiResponse<bool>
            {
                Success = false,
                Message = $"Invalid OTP code. {otp.AttemptsLeft} attempts remaining."
            });
        }

        otp.OtpStatus = "Confirmed";
        otp.AttemptsLeft = 0;

        // Confirm corresponding transaction
        var sale = _sales.FirstOrDefault(s => s.Id.Equals(otp.TransactionId, StringComparison.OrdinalIgnoreCase));
        if (sale != null)
        {
            sale.TransactionStatus = "Confirmed";
            sale.OtpStatus = "Verified";
        }

        return Ok(new ApiResponse<bool>
        {
            Success = true,
            Message = "OTP verified successfully. Transaction confirmed.",
            Data = true
        });
    }

    [HttpPost("otp-requests/{id}/reject")]
    public IActionResult RejectOtp(string id, [FromBody] RejectOtpRequestDto request)
    {
        var otp = _otpRequests.FirstOrDefault(o => o.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
        if (otp == null)
        {
            return NotFound(new ApiResponse<bool> { Success = false, Message = "OTP request not found." });
        }

        otp.OtpStatus = "Rejected";

        var sale = _sales.FirstOrDefault(s => s.Id.Equals(otp.TransactionId, StringComparison.OrdinalIgnoreCase));
        if (sale != null)
        {
            sale.TransactionStatus = "Rejected";
            sale.OtpStatus = "Rejected";
        }

        return Ok(new ApiResponse<bool>
        {
            Success = true,
            Message = $"OTP request rejected. Reason: {request.Reason}",
            Data = true
        });
    }

    [HttpPost("otp-requests/{id}/resend")]
    public IActionResult ResendOtp(string id)
    {
        var otp = _otpRequests.FirstOrDefault(o => o.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
        if (otp == null)
        {
            return NotFound(new ApiResponse<string> { Success = false, Message = "OTP request not found." });
        }

        var newOtp = new Random().Next(100000, 999999).ToString();
        otp.OtpCode = newOtp;
        otp.AttemptsLeft = 3;
        otp.OtpStatus = "Pending";
        otp.ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(10).ToUnixTimeMilliseconds();

        return Ok(new ApiResponse<string>
        {
            Success = true,
            Message = "New OTP generated and sent.",
            Data = newOtp
        });
    }

    // 9. NOTIFICATIONS
    [HttpGet("notifications")]
    public IActionResult GetNotifications()
    {
        return Ok(new ApiResponse<List<NotificationDto>>
        {
            Success = true,
            Message = "Notifications retrieved successfully.",
            Data = _notifications
        });
    }

    [HttpPut("notifications/{id}/read")]
    public IActionResult MarkNotificationAsRead(string id)
    {
        var notif = _notifications.FirstOrDefault(n => n.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
        if (notif != null)
        {
            notif.Read = true;
        }

        return Ok(new ApiResponse<bool>
        {
            Success = true,
            Message = "Notification marked as read.",
            Data = true
        });
    }

    [HttpPut("notifications/read-all")]
    public IActionResult MarkAllNotificationsAsRead()
    {
        foreach (var notif in _notifications)
        {
            notif.Read = true;
        }

        return Ok(new ApiResponse<bool>
        {
            Success = true,
            Message = "All notifications marked as read.",
            Data = true
        });
    }
}
