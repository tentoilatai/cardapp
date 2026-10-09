namespace CreditCardManager.Application.DTOs;

public record MonthSummary(
    int MonthKey,
    string MonthLabel,
    decimal TotalSpending,
    decimal TotalTheoreticalCashback,
    decimal TotalActualCashback,
    int TransactionCount,
    decimal OverallCashbackRate
);

public record GroupCapProgress(
    string CardId,
    string CardName,
    string Bank,
    string GroupName,
    decimal ActualCashback,
    decimal? GroupCap,
    decimal? RemainingGroupCap,
    decimal ProgressPercentage,
    decimal EligibleSpending,
    decimal? MaxEligibleSpending
);

public record BreakdownItem(string Key, string Label, decimal Spending, decimal ActualCashback, int TransactionCount, decimal Percentage);

public record MonthViewDto(
    int MonthKey,
    string MonthLabel,
    MonthSummary Summary,
    List<GroupCapProgress> GroupCapProgressList,
    List<BreakdownItem> BreakdownByCard,
    List<BreakdownItem> BreakdownByBank,
    List<BreakdownItem> BreakdownByMcc,
    List<BreakdownItem> BreakdownByCategory,
    List<BreakdownItem> BreakdownByMerchant,
    List<TransactionDto> Transactions
);
