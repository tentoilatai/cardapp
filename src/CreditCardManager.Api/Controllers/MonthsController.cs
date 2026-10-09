using CreditCardManager.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CreditCardManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MonthsController : ControllerBase
{
    private readonly IMonthViewService _monthViewService;

    public MonthsController(IMonthViewService monthViewService)
    {
        _monthViewService = monthViewService;
    }

    [HttpGet("{monthKey:int}")]
    public async Task<IActionResult> GetMonthView(int monthKey, CancellationToken ct)
    {
        if (monthKey < 200001 || monthKey > 209912)
        {
            return BadRequest(new ProblemDetails { Status = 400, Title = "Tháng không hợp lệ", Detail = "Định dạng tháng phải là yyyymm (vd 202610)." });
        }

        var result = await _monthViewService.GetMonthViewAsync(monthKey, ct);
        return Ok(result);
    }
}
