namespace CreditCardManager.Application.DTOs;

public record CardDto(
    string Id,
    string Bank,
    string Name,
    string CardType,
    string Network,
    string Last4,
    decimal CreditLimit,
    int StatementDay,
    int PaymentDueDay,
    DateOnly OpenDate,
    decimal AnnualFee,
    decimal FirstYearFee,
    string Status,
    string? Note
);

public record CreateCardDto(
    string Id,
    string Bank,
    string Name,
    string CardType,
    string Network,
    string Last4,
    decimal CreditLimit,
    int StatementDay,
    int PaymentDueDay,
    DateOnly OpenDate,
    decimal AnnualFee,
    decimal FirstYearFee,
    string Status,
    string? Note
);

public record UpdateCardDto(
    string Bank,
    string Name,
    string CardType,
    string Network,
    string Last4,
    decimal CreditLimit,
    int StatementDay,
    int PaymentDueDay,
    DateOnly OpenDate,
    decimal AnnualFee,
    decimal FirstYearFee,
    string Status,
    string? Note
);

public record CardStatusDto(
    string CardId,
    string CardName,
    string Bank,
    decimal CreditLimit,
    decimal UsedCredit,
    decimal AvailableCredit,
    decimal Utilization,
    string UtilizationLevel,
    DateOnly LatestStatementDate,
    DateOnly PaymentDueDate,
    int DaysRemaining,
    string PaymentStatus,
    decimal UnpaidStatementBalance,
    string Status
);
