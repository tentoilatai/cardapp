namespace CreditCardManager.Application.DTOs;

public record DashboardKpis(
    int TotalCards,
    decimal TotalCreditLimit,
    decimal TotalUsedCredit,
    decimal TotalAvailableCredit,
    decimal AverageUtilization,
    decimal MonthTotalSpending,
    decimal MonthTheoreticalCashback,
    decimal MonthActualCashback,
    decimal MonthRemainingCashback,
    string TopCashbackCard,
    string TopSpendingCard,
    int CardsNearLimitCount,
    int CardsNearCapCount,
    int CardsNeedingPaymentAttentionCount
);

public record CardSpendingSummary(string CardId, string CardName, string Bank, decimal Spending);

public record CardCashbackSummary(string CardId, string CardName, string Bank, decimal ActualCashback, decimal? CardCap);

public record CategorySpendingSummary(string Category, decimal Spending, decimal Percentage);

public record MonthlyTrendPoint(int MonthKey, string MonthLabel, decimal Spending, decimal TheoreticalCashback, decimal ActualCashback);

public record CardLimitUsage(string CardId, string CardName, string Bank, decimal CreditLimit, decimal UsedCredit, decimal AvailableCredit, decimal Utilization, string UtilizationLevel);

public record CardCapProgress(string CardId, string CardName, string Bank, decimal ActualCashback, decimal? CardCap, decimal ProgressPercentage);

public record CardStatusSummary(
    string CardId,
    string CardName,
    string Bank,
    decimal CreditLimit,
    decimal UsedCredit,
    decimal Utilization,
    string UtilizationLevel,
    decimal MonthActualCashback,
    decimal? CardCap,
    decimal MonthSpending,
    DateOnly LatestStatementDate,
    DateOnly PaymentDueDate,
    int DaysRemaining,
    string PaymentStatus,
    string CardStatus
);

public record DashboardDto(
    int MonthKey,
    DashboardKpis Kpis,
    List<CardSpendingSummary> SpendingByCard,
    List<CardCashbackSummary> CashbackByCard,
    List<CategorySpendingSummary> SpendingByCategory,
    List<MonthlyTrendPoint> MonthlyTrends,
    List<CardLimitUsage> LimitUsageByCard,
    List<CardCapProgress> CapProgressByCard,
    List<CardStatusSummary> CardStatuses
);
