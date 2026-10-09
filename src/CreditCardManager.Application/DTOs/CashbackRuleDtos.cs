namespace CreditCardManager.Application.DTOs;

public record CashbackRuleDto(
    string Id,
    string CardId,
    string? CardName,
    string? Bank,
    string GroupName,
    string CategoryName,
    string MccCode,
    string? MccName,
    decimal Rate,
    decimal? MaxCashbackPerGroupPerMonth,
    decimal? MaxCashbackPerCardPerMonth,
    decimal? MaxEligibleSpending,
    decimal? MinTransaction,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? Condition,
    string? Note
);

public record CreateCashbackRuleDto(
    string Id,
    string CardId,
    string GroupName,
    string CategoryName,
    string MccCode,
    decimal Rate,
    decimal? MaxCashbackPerGroupPerMonth,
    decimal? MaxCashbackPerCardPerMonth,
    decimal? MaxEligibleSpending,
    decimal? MinTransaction,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? Condition,
    string? Note
);

public record UpdateCashbackRuleDto(
    string GroupName,
    string CategoryName,
    string MccCode,
    decimal Rate,
    decimal? MaxCashbackPerGroupPerMonth,
    decimal? MaxCashbackPerCardPerMonth,
    decimal? MaxEligibleSpending,
    decimal? MinTransaction,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? Condition,
    string? Note
);

public record BatchCreateCashbackRulesDto(
    string CardId,
    string GroupName,
    string CategoryName,
    List<string> MccCodes,
    decimal Rate,
    decimal? MaxCashbackPerGroupPerMonth,
    decimal? MaxCashbackPerCardPerMonth,
    decimal? MaxEligibleSpending,
    decimal? MinTransaction,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? Condition,
    string? Note
);
