using CreditCardManager.Domain.Entities;

namespace CreditCardManager.Domain.Services;

public record CashbackPreviewResult(
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

public static class CashbackCalculator
{
    /// <summary>
    /// Tính toán và cập nhật toàn bộ kết quả cashback cho danh sách giao dịch của một (Card, MonthKey).
    /// Xử lý theo thứ tự (Date, rồi Id).
    /// </summary>
    public static void CalculateMonthlyTransactions(
        IEnumerable<Transaction> transactions,
        IEnumerable<CashbackRule> rules,
        Card? card = null)
    {
        var ruleList = rules.OrderBy(r => r.Id, StringComparer.OrdinalIgnoreCase).ToList();
        var sortedTxList = transactions
            .OrderBy(t => t.Date)
            .ThenBy(t => t.Id, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var groupCumulativeCashback = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        var groupCumulativeEligible = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        decimal cardCumulativeCashback = 0m;

        foreach (var tx in sortedTxList)
        {
            ProcessSingleTransaction(
                tx,
                ruleList,
                groupCumulativeCashback,
                groupCumulativeEligible,
                ref cardCumulativeCashback,
                card);
        }
    }

    /// <summary>
    /// Xử lý 1 giao dịch trong chuỗi luồng lũy kế theo tháng.
    /// </summary>
    private static void ProcessSingleTransaction(
        Transaction tx,
        List<CashbackRule> rules,
        Dictionary<string, decimal> groupCumulativeCashback,
        Dictionary<string, decimal> groupCumulativeEligible,
        ref decimal cardCumulativeCashback,
        Card? card)
    {
        // 1. Trạng thái Cancelled -> cashback = 0, trạng thái Đã hủy, không đổi bộ đếm
        if (string.Equals(tx.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            tx.Rate = 0m;
            tx.EligibleAmount = 0m;
            tx.TheoreticalCashback = 0m;
            tx.ActualCashback = 0m;
            tx.MatchedRuleId = null;
            tx.GroupName = null;
            tx.CashbackStatus = "Đã hủy";

            if (card != null)
            {
                tx.StatementDate = BillingScheduleHelper.CalculateStatementDate(tx.Date, card.StatementDay);
                tx.PaymentDueDate = BillingScheduleHelper.CalculatePaymentDueDate(tx.StatementDate, card.StatementDay, card.PaymentDueDay);
            }
            return;
        }

        // 2. Chọn rule
        CashbackRule? matchedRule = null;
        if (!string.IsNullOrWhiteSpace(tx.OverrideRuleId))
        {
            matchedRule = rules.FirstOrDefault(r =>
                string.Equals(r.Id, tx.OverrideRuleId, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(r.CardId, tx.CardId, StringComparison.OrdinalIgnoreCase));
        }

        if (matchedRule == null)
        {
            matchedRule = rules.FirstOrDefault(r =>
                string.Equals(r.CardId, tx.CardId, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(r.MccCode, tx.MccCode, StringComparison.OrdinalIgnoreCase) &&
                (!r.StartDate.HasValue || r.StartDate.Value <= tx.Date) &&
                (!r.EndDate.HasValue || r.EndDate.Value >= tx.Date) &&
                (!r.MinTransaction.HasValue || tx.Amount >= r.MinTransaction.Value));
        }

        if (card != null)
        {
            tx.StatementDate = BillingScheduleHelper.CalculateStatementDate(tx.Date, card.StatementDay);
            tx.PaymentDueDate = BillingScheduleHelper.CalculatePaymentDueDate(tx.StatementDate, card.StatementDay, card.PaymentDueDay);
        }

        if (matchedRule == null)
        {
            tx.Rate = 0m;
            tx.EligibleAmount = 0m;
            tx.TheoreticalCashback = 0m;
            tx.ActualCashback = 0m;
            tx.MatchedRuleId = null;
            tx.GroupName = null;
            tx.CashbackStatus = "Không được hoàn";
            return;
        }

        string groupName = matchedRule.GroupName;
        tx.MatchedRuleId = matchedRule.Id;
        tx.GroupName = groupName;
        tx.Rate = matchedRule.Rate;

        // 3. Tính Eligible Amount
        decimal eligibleAmount = tx.Amount;
        if (matchedRule.MaxEligibleSpending.HasValue)
        {
            decimal usedEligible = groupCumulativeEligible.GetValueOrDefault(groupName, 0m);
            decimal remainingEligibleSpending = Math.Max(0m, matchedRule.MaxEligibleSpending.Value - usedEligible);
            eligibleAmount = Math.Max(0m, Math.Min(tx.Amount, remainingEligibleSpending));
        }
        tx.EligibleAmount = eligibleAmount;

        // Cập nhật chi tiêu eligible lũy kế của nhóm
        groupCumulativeEligible[groupName] = groupCumulativeEligible.GetValueOrDefault(groupName, 0m) + eligibleAmount;

        // 4. Theoretical Cashback = round(Eligible x Rate, 0)
        decimal theoretical = Math.Round(eligibleAmount * matchedRule.Rate, 0, MidpointRounding.AwayFromZero);
        tx.TheoreticalCashback = theoretical;

        // 5. Actual Cashback = max(0, min(Theoretical, GroupCap - usedGroup, CardCap - usedCard))
        decimal usedGroupCashback = groupCumulativeCashback.GetValueOrDefault(groupName, 0m);
        decimal usedCardCashback = cardCumulativeCashback;

        decimal remainingGroupCap = matchedRule.MaxCashbackPerGroupPerMonth.HasValue
            ? Math.Max(0m, matchedRule.MaxCashbackPerGroupPerMonth.Value - usedGroupCashback)
            : decimal.MaxValue;

        decimal remainingCardCap = matchedRule.MaxCashbackPerCardPerMonth.HasValue
            ? Math.Max(0m, matchedRule.MaxCashbackPerCardPerMonth.Value - usedCardCashback)
            : decimal.MaxValue;

        decimal actual = Math.Max(0m, Math.Min(theoretical, Math.Min(remainingGroupCap, remainingCardCap)));
        actual = Math.Round(actual, 0, MidpointRounding.AwayFromZero);
        tx.ActualCashback = actual;

        // Cập nhật bộ đếm cashback lũy kế
        groupCumulativeCashback[groupName] = usedGroupCashback + actual;
        cardCumulativeCashback = usedCardCashback + actual;

        // 6. Trạng thái hoàn tiền
        if (actual == 0m && (theoretical > 0m || eligibleAmount < tx.Amount))
        {
            tx.CashbackStatus = "Đã đạt cap";
        }
        else if (actual == 0m)
        {
            tx.CashbackStatus = "Không được hoàn";
        }
        else if (actual < theoretical || eligibleAmount < tx.Amount)
        {
            tx.CashbackStatus = "Hoàn một phần";
        }
        else
        {
            tx.CashbackStatus = "Được hoàn";
        }
    }

    /// <summary>
    /// Xem trước (preview) cashback của một giao dịch sắp tạo mà không làm thay đổi DB.
    /// Tính toán dựa trên danh sách các giao dịch đã có trong cùng (Card, MonthKey).
    /// </summary>
    public static CashbackPreviewResult Preview(
        string cardId,
        DateOnly date,
        string mccCode,
        decimal amount,
        string? overrideRuleId,
        IEnumerable<Transaction> existingMonthTransactions,
        IEnumerable<CashbackRule> rules)
    {
        var ruleList = rules.OrderBy(r => r.Id, StringComparer.OrdinalIgnoreCase).ToList();
        var relevantRules = ruleList.Where(r => string.Equals(r.CardId, cardId, StringComparison.OrdinalIgnoreCase)).ToList();

        // Tính lũy kế từ các giao dịch trước đó trong tháng (bỏ qua giao dịch Pending/Cancelled theo logic hoặc chỉ lấy giao dịch trước tx mới)
        var priorTxs = existingMonthTransactions
            .Where(t => string.Equals(t.CardId, cardId, StringComparison.OrdinalIgnoreCase) && !string.Equals(t.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
            .OrderBy(t => t.Date)
            .ThenBy(t => t.Id, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var groupCumulativeCashback = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        var groupCumulativeEligible = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        decimal cardCumulativeCashback = 0m;

        foreach (var t in priorTxs)
        {
            // Tìm rule áp dụng cho t
            CashbackRule? r = null;
            if (!string.IsNullOrWhiteSpace(t.OverrideRuleId))
            {
                r = relevantRules.FirstOrDefault(x => string.Equals(x.Id, t.OverrideRuleId, StringComparison.OrdinalIgnoreCase));
            }
            r ??= relevantRules.FirstOrDefault(x =>
                string.Equals(x.MccCode, t.MccCode, StringComparison.OrdinalIgnoreCase) &&
                (!x.StartDate.HasValue || x.StartDate.Value <= t.Date) &&
                (!x.EndDate.HasValue || x.EndDate.Value >= t.Date) &&
                (!x.MinTransaction.HasValue || t.Amount >= x.MinTransaction.Value));

            if (r != null)
            {
                string grp = r.GroupName;
                decimal el = t.Amount;
                if (r.MaxEligibleSpending.HasValue)
                {
                    decimal usedEl = groupCumulativeEligible.GetValueOrDefault(grp, 0m);
                    decimal remEl = Math.Max(0m, r.MaxEligibleSpending.Value - usedEl);
                    el = Math.Max(0m, Math.Min(t.Amount, remEl));
                }
                groupCumulativeEligible[grp] = groupCumulativeEligible.GetValueOrDefault(grp, 0m) + el;

                decimal theo = Math.Round(el * r.Rate, 0, MidpointRounding.AwayFromZero);
                decimal uGrp = groupCumulativeCashback.GetValueOrDefault(grp, 0m);
                decimal remG = r.MaxCashbackPerGroupPerMonth.HasValue ? Math.Max(0m, r.MaxCashbackPerGroupPerMonth.Value - uGrp) : decimal.MaxValue;
                decimal remC = r.MaxCashbackPerCardPerMonth.HasValue ? Math.Max(0m, r.MaxCashbackPerCardPerMonth.Value - cardCumulativeCashback) : decimal.MaxValue;

                decimal act = Math.Max(0m, Math.Min(theo, Math.Min(remG, remC)));
                act = Math.Round(act, 0, MidpointRounding.AwayFromZero);

                groupCumulativeCashback[grp] = uGrp + act;
                cardCumulativeCashback += act;
            }
        }

        // Khớp rule cho giao dịch preview
        CashbackRule? previewRule = null;
        if (!string.IsNullOrWhiteSpace(overrideRuleId))
        {
            previewRule = relevantRules.FirstOrDefault(r => string.Equals(r.Id, overrideRuleId, StringComparison.OrdinalIgnoreCase));
        }
        previewRule ??= relevantRules.FirstOrDefault(r =>
            string.Equals(r.MccCode, mccCode, StringComparison.OrdinalIgnoreCase) &&
            (!r.StartDate.HasValue || r.StartDate.Value <= date) &&
            (!r.EndDate.HasValue || r.EndDate.Value >= date) &&
            (!r.MinTransaction.HasValue || amount >= r.MinTransaction.Value));

        if (previewRule == null)
        {
            return new CashbackPreviewResult(
                MatchedRuleId: null,
                GroupName: null,
                Rate: 0m,
                EligibleAmount: 0m,
                TheoreticalCashback: 0m,
                ActualCashback: 0m,
                CashbackStatus: "Không được hoàn",
                RemainingGroupCap: null,
                RemainingCardCap: null,
                RemainingEligibleSpending: null
            );
        }

        string group = previewRule.GroupName;
        decimal eligible = amount;
        decimal? remEligibleSpending = null;

        if (previewRule.MaxEligibleSpending.HasValue)
        {
            decimal usedEligible = groupCumulativeEligible.GetValueOrDefault(group, 0m);
            remEligibleSpending = Math.Max(0m, previewRule.MaxEligibleSpending.Value - usedEligible);
            eligible = Math.Max(0m, Math.Min(amount, remEligibleSpending.Value));
        }

        decimal theoreticalCashback = Math.Round(eligible * previewRule.Rate, 0, MidpointRounding.AwayFromZero);

        decimal usedGroupCb = groupCumulativeCashback.GetValueOrDefault(group, 0m);
        decimal? remGroupCap = previewRule.MaxCashbackPerGroupPerMonth.HasValue
            ? Math.Max(0m, previewRule.MaxCashbackPerGroupPerMonth.Value - usedGroupCb)
            : null;

        decimal? remCardCap = previewRule.MaxCashbackPerCardPerMonth.HasValue
            ? Math.Max(0m, previewRule.MaxCashbackPerCardPerMonth.Value - cardCumulativeCashback)
            : null;

        decimal effectiveGroupCap = remGroupCap ?? decimal.MaxValue;
        decimal effectiveCardCap = remCardCap ?? decimal.MaxValue;

        decimal actualCashback = Math.Max(0m, Math.Min(theoreticalCashback, Math.Min(effectiveGroupCap, effectiveCardCap)));
        actualCashback = Math.Round(actualCashback, 0, MidpointRounding.AwayFromZero);

        decimal finalRemGroupCap = remGroupCap.HasValue ? Math.Max(0m, remGroupCap.Value - actualCashback) : 0m;
        decimal finalRemCardCap = remCardCap.HasValue ? Math.Max(0m, remCardCap.Value - actualCashback) : 0m;

        string status;
        if (actualCashback == 0m && (theoreticalCashback > 0m || eligible < amount))
        {
            status = "Đã đạt cap";
        }
        else if (actualCashback == 0m)
        {
            status = "Không được hoàn";
        }
        else if (actualCashback < theoreticalCashback || eligible < amount)
        {
            status = "Hoàn một phần";
        }
        else
        {
            status = "Được hoàn";
        }

        return new CashbackPreviewResult(
            MatchedRuleId: previewRule.Id,
            GroupName: group,
            Rate: previewRule.Rate,
            EligibleAmount: eligible,
            TheoreticalCashback: theoreticalCashback,
            ActualCashback: actualCashback,
            CashbackStatus: status,
            RemainingGroupCap: remGroupCap.HasValue ? finalRemGroupCap : null,
            RemainingCardCap: remCardCap.HasValue ? finalRemCardCap : null,
            RemainingEligibleSpending: remEligibleSpending.HasValue ? Math.Max(0m, remEligibleSpending.Value - eligible) : null
        );
    }
}
