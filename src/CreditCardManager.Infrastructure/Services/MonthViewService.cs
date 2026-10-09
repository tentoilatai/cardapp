using CreditCardManager.Application.DTOs;
using CreditCardManager.Application.Interfaces;
using CreditCardManager.Domain.Entities;
using CreditCardManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CreditCardManager.Infrastructure.Services;

public class MonthViewService : IMonthViewService
{
    private readonly ApplicationDbContext _context;

    public MonthViewService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<MonthViewDto> GetMonthViewAsync(int monthKey, CancellationToken ct = default)
    {
        int yr = monthKey / 100;
        int mo = monthKey % 100;
        string monthLabel = $"Tháng {mo:D2}/{yr}";

        var cards = await _context.Cards.AsNoTracking().ToDictionaryAsync(c => c.Id, StringComparer.OrdinalIgnoreCase, ct);
        var rules = await _context.CashbackRules.AsNoTracking().ToListAsync(ct);

        var txs = await _context.Transactions
            .Include(t => t.Card)
            .Include(t => t.Mcc)
            .AsNoTracking()
            .Where(t => t.MonthKey == monthKey)
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.Id)
            .ToListAsync(ct);

        var validTxs = txs.Where(t => t.Status != "Cancelled").ToList();

        decimal totalSpending = validTxs.Sum(t => t.Amount);
        decimal totalTheo = validTxs.Sum(t => t.TheoreticalCashback);
        decimal totalAct = validTxs.Sum(t => t.ActualCashback);
        decimal overallRate = totalSpending > 0 ? Math.Round(totalAct / totalSpending, 4) : 0m;

        var summary = new MonthSummary(
            MonthKey: monthKey,
            MonthLabel: monthLabel,
            TotalSpending: totalSpending,
            TotalTheoreticalCashback: totalTheo,
            TotalActualCashback: totalAct,
            TransactionCount: txs.Count,
            OverallCashbackRate: overallRate
        );

        // Group cap progress
        var groupProgressList = new List<GroupCapProgress>();
        var rulesByCardAndGroup = rules
            .GroupBy(r => new { r.CardId, r.GroupName })
            .ToList();

        foreach (var bg in rulesByCardAndGroup)
        {
            var card = cards.GetValueOrDefault(bg.Key.CardId);
            string cardName = card?.Name ?? bg.Key.CardId;
            string bank = card?.Bank ?? "";

            var firstRule = bg.First();
            decimal? groupCap = firstRule.MaxCashbackPerGroupPerMonth;
            decimal? maxEligible = firstRule.MaxEligibleSpending;

            // Find transactions matched to this group for this card
            var matchedGroupTxs = validTxs
                .Where(t => string.Equals(t.CardId, bg.Key.CardId, StringComparison.OrdinalIgnoreCase) &&
                            string.Equals(t.GroupName, bg.Key.GroupName, StringComparison.OrdinalIgnoreCase))
                .ToList();

            decimal groupActualCb = matchedGroupTxs.Sum(t => t.ActualCashback);
            decimal groupEligibleSpend = matchedGroupTxs.Sum(t => t.EligibleAmount);

            decimal? remCap = groupCap.HasValue ? Math.Max(0m, groupCap.Value - groupActualCb) : null;
            decimal progress = (groupCap.HasValue && groupCap.Value > 0)
                ? Math.Round(Math.Min(100m, (groupActualCb / groupCap.Value) * 100m), 2)
                : 0m;

            groupProgressList.Add(new GroupCapProgress(
                CardId: bg.Key.CardId,
                CardName: cardName,
                Bank: bank,
                GroupName: bg.Key.GroupName,
                ActualCashback: groupActualCb,
                GroupCap: groupCap,
                RemainingGroupCap: remCap,
                ProgressPercentage: progress,
                EligibleSpending: groupEligibleSpend,
                MaxEligibleSpending: maxEligible
            ));
        }

        // Breakdowns
        List<BreakdownItem> BuildBreakdown(IEnumerable<IGrouping<string, Transaction>> grouped)
        {
            return grouped
                .Select(g =>
                {
                    decimal spend = g.Sum(t => t.Amount);
                    decimal cb = g.Sum(t => t.ActualCashback);
                    int count = g.Count();
                    decimal pct = totalSpending > 0 ? Math.Round(spend / totalSpending * 100m, 2) : 0m;
                    return new BreakdownItem(g.Key, g.Key, spend, cb, count, pct);
                })
                .OrderByDescending(x => x.Spending)
                .ToList();
        }

        var breakdownByCard = BuildBreakdown(validTxs.GroupBy(t => t.Card != null ? $"{t.Card.Name} ({t.Card.Bank})" : t.CardId));
        var breakdownByBank = BuildBreakdown(validTxs.GroupBy(t => t.Card != null ? t.Card.Bank : "Khác"));
        var breakdownByMcc = BuildBreakdown(validTxs.GroupBy(t => t.Mcc != null ? $"{t.MccCode} - {t.Mcc.Name}" : t.MccCode));
        var breakdownByCategory = BuildBreakdown(validTxs.GroupBy(t => t.Mcc != null ? t.Mcc.Category : "Khác"));
        var breakdownByMerchant = BuildBreakdown(validTxs.GroupBy(t => t.Merchant));

        var txDtos = txs.Select(t => new TransactionDto(
            t.Id,
            t.Date,
            t.MonthKey,
            t.CardId,
            t.Card != null ? t.Card.Name : null,
            t.Card != null ? t.Card.Bank : null,
            t.Merchant,
            t.Description,
            t.MccCode,
            t.Mcc != null ? t.Mcc.Name : null,
            t.Mcc != null ? t.Mcc.Category : null,
            t.Amount,
            t.Status,
            t.PaymentStatus,
            t.OverrideRuleId,
            t.Note,
            t.MatchedRuleId,
            t.GroupName,
            t.EligibleAmount,
            t.Rate,
            t.TheoreticalCashback,
            t.ActualCashback,
            t.CashbackStatus,
            t.StatementDate,
            t.PaymentDueDate
        )).ToList();

        return new MonthViewDto(
            MonthKey: monthKey,
            MonthLabel: monthLabel,
            Summary: summary,
            GroupCapProgressList: groupProgressList,
            BreakdownByCard: breakdownByCard,
            BreakdownByBank: breakdownByBank,
            BreakdownByMcc: breakdownByMcc,
            BreakdownByCategory: breakdownByCategory,
            BreakdownByMerchant: breakdownByMerchant,
            Transactions: txDtos
        );
    }
}
