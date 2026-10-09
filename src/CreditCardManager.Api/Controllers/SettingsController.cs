using CreditCardManager.Application.DTOs;
using CreditCardManager.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CreditCardManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly ISettingsService _settingsService;

    public SettingsController(ISettingsService settingsService)
    {
        _settingsService = settingsService;
    }

    [HttpGet]
    public async Task<IActionResult> GetSettings(CancellationToken ct)
    {
        var settings = await _settingsService.GetSettingsAsync(ct);
        return Ok(settings);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateAppSettingsDto dto, CancellationToken ct)
    {
        var updated = await _settingsService.UpdateSettingsAsync(dto, ct);
        return Ok(updated);
    }
}

