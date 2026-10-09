namespace CreditCardManager.Application.DTOs;

public record AppSettingsDto(
    int Id,
    decimal UtilizationMildThreshold,
    decimal UtilizationWarningThreshold,
    decimal UtilizationDangerThreshold,
    int DueSoonDays,
    decimal NearCapThreshold,
    List<string> Banks,
    List<string> Categories
);

public record UpdateAppSettingsDto(
    decimal UtilizationMildThreshold,
    decimal UtilizationWarningThreshold,
    decimal UtilizationDangerThreshold,
    int DueSoonDays,
    decimal NearCapThreshold,
    List<string> Banks,
    List<string> Categories
);
