using CreditCardManager.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CreditCardManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExportController : ControllerBase
{
    private readonly IExcelExportService _exportService;

    public ExportController(IExcelExportService exportService)
    {
        _exportService = exportService;
    }

    [HttpGet("excel")]
    public async Task<IActionResult> ExportExcel([FromQuery] int? monthKey, [FromQuery] string? cardId, CancellationToken ct)
    {
        var bytes = await _exportService.ExportTransactionsExcelAsync(monthKey, cardId, ct);
        string filename = monthKey.HasValue ? $"CreditCardManager_{monthKey}.xlsx" : "CreditCardManager_All.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename);
    }
}
