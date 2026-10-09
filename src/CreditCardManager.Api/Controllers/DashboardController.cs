using CreditCardManager.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CreditCardManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet]
    public async Task<IActionResult> GetDashboard([FromQuery] int? month, [FromQuery] string? refDate, CancellationToken ct)
    {
        DateOnly? referenceDate = null;
        if (!string.IsNullOrWhiteSpace(refDate) && DateOnly.TryParse(refDate, out var parsedDate))
        {
            referenceDate = parsedDate;
        }

        var dashboard = await _dashboardService.GetDashboardAsync(month, referenceDate, ct);
        return Ok(dashboard);
    }
}
