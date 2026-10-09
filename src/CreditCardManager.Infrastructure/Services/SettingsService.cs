using System.Text.Json;
using CreditCardManager.Application.DTOs;
using CreditCardManager.Application.Interfaces;
using CreditCardManager.Domain.Entities;
using CreditCardManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CreditCardManager.Infrastructure.Services;

public class SettingsService : ISettingsService
{
    private readonly ApplicationDbContext _context;

    public SettingsService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AppSettingsDto> GetSettingsAsync(CancellationToken ct = default)
    {
        var settings = await _context.Settings.FirstOrDefaultAsync(ct);
        if (settings == null)
        {
            settings = new AppSettings();
            _context.Settings.Add(settings);
            await _context.SaveChangesAsync(ct);
        }

        var banks = JsonSerializer.Deserialize<List<string>>(settings.BanksJson) ?? new List<string>();
        var categories = JsonSerializer.Deserialize<List<string>>(settings.CategoriesJson) ?? new List<string>();

        return new AppSettingsDto(
            settings.Id,
            settings.UtilizationMildThreshold,
            settings.UtilizationWarningThreshold,
            settings.UtilizationDangerThreshold,
            settings.DueSoonDays,
            settings.NearCapThreshold,
            banks,
            categories
        );
    }

    public async Task<AppSettingsDto> UpdateSettingsAsync(UpdateAppSettingsDto dto, CancellationToken ct = default)
    {
        var settings = await _context.Settings.FirstOrDefaultAsync(ct);
        if (settings == null)
        {
            settings = new AppSettings();
            _context.Settings.Add(settings);
        }

        settings.UtilizationMildThreshold = dto.UtilizationMildThreshold;
        settings.UtilizationWarningThreshold = dto.UtilizationWarningThreshold;
        settings.UtilizationDangerThreshold = dto.UtilizationDangerThreshold;
        settings.DueSoonDays = dto.DueSoonDays;
        settings.NearCapThreshold = dto.NearCapThreshold;
        settings.BanksJson = JsonSerializer.Serialize(dto.Banks);
        settings.CategoriesJson = JsonSerializer.Serialize(dto.Categories);

        await _context.SaveChangesAsync(ct);

        return await GetSettingsAsync(ct);
    }
}
