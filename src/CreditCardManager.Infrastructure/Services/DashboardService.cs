using CreditCardManager.Application.DTOs;
using CreditCardManager.Application.Interfaces;
using CreditCardManager.Domain.Entities;
using CreditCardManager.Domain.Services;
using CreditCardManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CreditCardManager.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;
    private readonly TimeProvider _timeProvider;

    public DashboardService(ApplicationDbContext context, TimeProvider timeProvider)
    {
        _context = context;
        _timeProvider = timeProvider;
    }

    public async Task<DashboardDto> GetDashboardAsync(int? monthKey = null, DateOnly? referenceDate = null, CancellationToken ct = default)
    {
        var now = _timeProvider.GetLocalNow();
        var today = referenceDate ?? DateOnly.FromDateTime(now.DateTime);
        int currentMonthKey = monthKey ?? ((today.Year * 100) + today.Month);

        var settings = await _context.Settings.AsNoTracking().FirstOrDefaultAsync(ct) ?? new AppSettings();
        var cards = await _context.Cards.AsNoTracking().OrderBy(c => c.Bank).ThenBy(c => c.Name).ToListAsync(ct);
        var rules = await _context.CashbackRules.AsNoTracking().ToListAsync(ct);

        // All active unpaid transactions across all time
        var allUnpaidTxs = await _context.Transactions
            .AsNoTracking()
            .Where(t => t.Status != "Cancelled" && t.PaymentStatus != "Đã thanh toán")
            .ToListAsync(ct);

        // Transactions for the selected month
        var monthTxs = await _context.Transactions
            .Include(t => t.Card)
            .Include(t => t.Mcc)
            .AsNoTracking()
            .Where(t => t.MonthKey == currentMonthKey)
            .ToListAsync(ct);

        var validMonthTxs = monthTxs.Where(t => t.Status != "Cancelled").ToList();

        // 1. Basic card limits & usage
        decimal totalCreditLimit = cards.Sum(c => c.CreditLimit);
        decimal totalUsedCredit = allUnpaidTxs.Sum(t => t.Amount);
        decimal totalAvailableCredit = Math.Max(0m, totalCreditLimit - totalUsedCredit);
        decimal avgUtilization = totalCreditLimit > 0 ? Math.Round(totalUsedCredit / totalCreditLimit, 4) : 0m;

        // 2. Month cashback & spending
        decimal monthTotalSpending = validMonthTxs.Sum(t => t.Amount);
        decimal monthTheoreticalCashback = validMonthTxs.Sum(t => t.TheoreticalCashback);
        decimal monthActualCashback = validMonthTxs.Sum(t => t.ActualCashback);

        // Group by card for month
        var cardSpendingMap = validMonthTxs
            .GroupBy(t => t.CardId)
            .ToDictionary(g => g.Key, g => new { Spending = g.Sum(t => t.Amount), ActualCashback = g.Sum(t => t.ActualCashback) });

        // Calculate card caps map (take max MaxCashbackPerCardPerMonth from rules for each card)
        var cardCapsMap = rules
            .GroupBy(r => r.CardId)
            .ToDictionary(
                g => g.Key,
                g => g.Select(r => r.MaxCashbackPerCardPerMonth).FirstOrDefault(c => c.HasValue)
            );

        decimal monthRemainingCashback = 0m;
        foreach (var card in cards)
        {
            if (cardCapsMap.TryGetValue(card.Id, out var cap) && cap.HasValue)
            {
                decimal received = cardSpendingMap.TryGetValue(card.Id, out var stat) ? stat.ActualCashback : 0m;
                monthRemainingCashback += Math.Max(0m, cap.Value - received);
            }
        }

        // Top cards
        var topCashbackCardEntry = cardSpendingMap.OrderByDescending(x => x.Value.ActualCashback).FirstOrDefault();
        string topCashbackCard = "Chưa có";
        if (topCashbackCardEntry.Key != null)
        {
            var c = cards.FirstOrDefault(x => x.Id == topCashbackCardEntry.Key);
            topCashbackCard = c != null ? $"{c.Name} ({topCashbackCardEntry.Value.ActualCashback:N0} ₫)" : $"{topCashbackCardEntry.Key}";
        }

        var topSpendingCardEntry = cardSpendingMap.OrderByDescending(x => x.Value.Spending).FirstOrDefault();
        string topSpendingCard = "Chưa có";
        if (topSpendingCardEntry.Key != null)
        {
            var c = cards.FirstOrDefault(x => x.Id == topSpendingCardEntry.Key);
            topSpendingCard = c != null ? $"{c.Name} ({topSpendingCardEntry.Value.Spending:N0} ₫)" : $"{topSpendingCardEntry.Key}";
        }

        // Card status summaries
        int cardsNearLimitCount = 0;
        int cardsNearCapCount = 0;
        int cardsNeedingPaymentAttentionCount = 0;

        var cardStatuses = new List<CardStatusSummary>();
        var limitUsageByCard = new List<CardLimitUsage>();
        var capProgressByCard = new List<CardCapProgress>();

        foreach (var card in cards)
        {
            var cardUnpaid = allUnpaidTxs.Where(t => t.CardId == card.Id).ToList();
            decimal cardUsed = cardUnpaid.Sum(t => t.Amount);
            decimal cardUtil = card.CreditLimit > 0 ? Math.Round(cardUsed / card.CreditLimit, 4) : 0m;
            string cardUtilLevel = BillingScheduleHelper.GetUtilizationLevel(
                cardUtil,
                settings.UtilizationMildThreshold,
                settings.UtilizationWarningThreshold,
                settings.UtilizationDangerThreshold
            );

            if (cardUtil >= settings.UtilizationWarningThreshold)
            {
                cardsNearLimitCount++;
            }

            var latestStmtDate = BillingScheduleHelper.CalculateStatementDate(today, card.StatementDay);
            var paymentDueDate = BillingScheduleHelper.CalculatePaymentDueDate(latestStmtDate, card.StatementDay, card.PaymentDueDay);
            decimal unpaidStmtBalance = cardUnpaid.Where(t => t.StatementDate <= latestStmtDate).Sum(t => t.Amount);
            string paymentStatus = BillingScheduleHelper.GetPaymentStatus(unpaidStmtBalance, paymentDueDate, today, settings.DueSoonDays);
            int daysRemaining = paymentDueDate.DayNumber - today.DayNumber;

            if (paymentStatus is "Quá hạn" or "Đến hạn" or "Sắp đến hạn")
            {
                cardsNeedingPaymentAttentionCount++;
            }

            decimal cardMonthSpend = cardSpendingMap.TryGetValue(card.Id, out var st) ? st.Spending : 0m;
            decimal cardMonthCb = cardSpendingMap.TryGetValue(card.Id, out var st2) ? st2.ActualCashback : 0m;
            decimal? cardCap = cardCapsMap.GetValueOrDefault(card.Id);

            decimal progress = 0m;
            if (cardCap.HasValue && cardCap.Value > 0)
            {
                progress = Math.Round(Math.Min(1m, cardMonthCb / cardCap.Value), 4);
                if (progress >= settings.NearCapThreshold)
                {
                    cardsNearCapCount++;
                }
            }

            cardStatuses.Add(new CardStatusSummary(
                card.Id,
                card.Name,
                card.Bank,
                card.CreditLimit,
                cardUsed,
                cardUtil,
                cardUtilLevel,
                cardMonthCb,
                cardCap,
                cardMonthSpend,
                latestStmtDate,
                paymentDueDate,
                daysRemaining,
                paymentStatus,
                card.Status
            ));

            limitUsageByCard.Add(new CardLimitUsage(
                card.Id,
                card.Name,
                card.Bank,
                card.CreditLimit,
                cardUsed,
                Math.Max(0m, card.CreditLimit - cardUsed),
                cardUtil,
                cardUtilLevel
            ));

            capProgressByCard.Add(new CardCapProgress(
                card.Id,
                card.Name,
                card.Bank,
                cardMonthCb,
                cardCap,
                progress * 100m
            ));
        }

        // Charts data
        var spendingByCard = cards
            .Select(c => new CardSpendingSummary(
                c.Id,
                c.Name,
                c.Bank,
                cardSpendingMap.TryGetValue(c.Id, out var s) ? s.Spending : 0m
            ))
            .Where(x => x.Spending > 0)
            .OrderByDescending(x => x.Spending)
            .ToList();

        var cashbackByCard = cards
            .Select(c => new CardCashbackSummary(
                c.Id,
                c.Name,
                c.Bank,
                cardSpendingMap.TryGetValue(c.Id, out var s) ? s.ActualCashback : 0m,
                cardCapsMap.GetValueOrDefault(c.Id)
            ))
            .Where(x => x.ActualCashback > 0 || (x.CardCap.HasValue && x.CardCap > 0))
            .OrderByDescending(x => x.ActualCashback)
            .ToList();

        var spendingByCategory = validMonthTxs
            .GroupBy(t => !string.IsNullOrEmpty(t.Mcc?.Category) ? t.Mcc.Category : "Khác")
            .Select(g => new CategorySpendingSummary(
                g.Key,
                g.Sum(t => t.Amount),
                monthTotalSpending > 0 ? Math.Round(g.Sum(t => t.Amount) / monthTotalSpending * 100m, 2) : 0m
            ))
            .OrderByDescending(x => x.Spending)
            .ToList();

        // 12 Months trend
        var monthlyTrends = new List<MonthlyTrendPoint>();
        var distinctMonths = await _context.Transactions
            .AsNoTracking()
            .Where(t => t.Status != "Cancelled")
            .GroupBy(t => t.MonthKey)
            .Select(g => new
            {
                MonthKey = g.Key,
                Spending = g.Sum(t => t.Amount),
                TheoreticalCashback = g.Sum(t => t.TheoreticalCashback),
                ActualCashback = g.Sum(t => t.ActualCashback)
            })
            .OrderBy(g => g.MonthKey)
            .ToListAsync(ct);

        // Ensure we show at least recent 12 months
        foreach (var m in distinctMonths)
        {
            int yr = m.MonthKey / 100;
            int mo = m.MonthKey % 100;
            string label = $"T{mo}/{yr}";
            monthlyTrends.Add(new MonthlyTrendPoint(m.MonthKey, label, m.Spending, m.TheoreticalCashback, m.ActualCashback));
        }

        var kpis = new DashboardKpis(
            TotalCards: cards.Count,
            TotalCreditLimit: totalCreditLimit,
            TotalUsedCredit: totalUsedCredit,
            TotalAvailableCredit: totalAvailableCredit,
            AverageUtilization: avgUtilization,
            MonthTotalSpending: monthTotalSpending,
            MonthTheoreticalCashback: monthTheoreticalCashback,
            MonthActualCashback: monthActualCashback,
            MonthRemainingCashback: monthRemainingCashback,
            TopCashbackCard: topCashbackCard,
            TopSpendingCard: topSpendingCard,
            CardsNearLimitCount: cardsNearLimitCount,
            CardsNearCapCount: cardsNearCapCount,
            CardsNeedingPaymentAttentionCount: cardsNeedingPaymentAttentionCount
        );

        return new DashboardDto(
            MonthKey: currentMonthKey,
            Kpis: kpis,
            SpendingByCard: spendingByCard,
            CashbackByCard: cashbackByCard,
            SpendingByCategory: spendingByCategory,
            MonthlyTrends: monthlyTrends,
            LimitUsageByCard: limitUsageByCard,
            CapProgressByCard: capProgressByCard,
            CardStatuses: cardStatuses
        );
    }
}
