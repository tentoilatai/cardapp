using CreditCardManager.Application.DTOs;

namespace CreditCardManager.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardDto> GetDashboardAsync(int? monthKey = null, DateOnly? referenceDate = null, CancellationToken ct = default);
}

public interface IMonthViewService
{
    Task<MonthViewDto> GetMonthViewAsync(int monthKey, CancellationToken ct = default);
}

public interface ISettingsService
{
    Task<AppSettingsDto> GetSettingsAsync(CancellationToken ct = default);
    Task<AppSettingsDto> UpdateSettingsAsync(UpdateAppSettingsDto dto, CancellationToken ct = default);
}

public interface IExcelExportService
{
    Task<byte[]> ExportTransactionsExcelAsync(int? monthKey = null, string? cardId = null, CancellationToken ct = default);
}
