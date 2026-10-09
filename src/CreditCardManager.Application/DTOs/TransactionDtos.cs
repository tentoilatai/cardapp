namespace CreditCardManager.Application.DTOs;

public record TransactionDto(
    string Id,
    DateOnly Date,
    int MonthKey,
    string CardId,
    string? CardName,
    string? Bank,
    string Merchant,
    string? Description,
    string MccCode,
    string? MccName,
    string? Category,
    decimal Amount,
    string Status,
    string PaymentStatus,
    string? OverrideRuleId,
    string? Note,
    string? MatchedRuleId,
    string? GroupName,
    decimal EligibleAmount,
    decimal Rate,
    decimal TheoreticalCashback,
    decimal ActualCashback,
    string CashbackStatus,
    DateOnly StatementDate,
    DateOnly PaymentDueDate
);

public record CreateTransactionDto(
    string? Id, // optional, auto-generated if null
    DateOnly Date,
    string CardId,
    string Merchant,
    string? Description,
    string MccCode,
    decimal Amount,
    string Status,
    string PaymentStatus,
    string? OverrideRuleId,
    string? Note
);

public record UpdateTransactionDto(
    DateOnly Date,
    string CardId,
    string Merchant,
    string? Description,
    string MccCode,
    decimal Amount,
    string Status,
    string PaymentStatus,
    string? OverrideRuleId,
    string? Note
);

public record TransactionPreviewRequest(
    string CardId,
    DateOnly Date,
    string MccCode,
    decimal Amount,
    string? OverrideRuleId
);

public record TransactionPreviewResponse(
    string? MatchedRuleId,
    string? GroupName,
    decimal Rate,
    decimal EligibleAmount,
    decimal TheoreticalCashback,
    decimal ActualCashback,
    string CashbackStatus,
    decimal? RemainingGroupCap,
    decimal? RemainingCardCap,
    decimal? RemainingEligibleSpending
);
