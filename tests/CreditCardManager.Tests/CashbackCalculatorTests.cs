using CreditCardManager.Domain.Entities;
using CreditCardManager.Domain.Services;
using FluentAssertions;
using Xunit;

namespace CreditCardManager.Tests;

public class CashbackCalculatorTests
{
    private static CashbackRule CreateRule(
        string id = "R001",
        string cardId = "CARD1",
        string groupName = "Group 1",
        string mccCode = "5812",
        decimal rate = 0.15m,
        decimal? maxGroupCap = null,
        decimal? maxCardCap = null,
        decimal? maxEligibleSpending = null,
        decimal? minTransaction = null,
        DateOnly? startDate = null,
        DateOnly? endDate = null)
    {
        return new CashbackRule
        {
            Id = id,
            CardId = cardId,
            GroupName = groupName,
            CategoryName = "Dining",
            MccCode = mccCode,
            Rate = rate,
            MaxCashbackPerGroupPerMonth = maxGroupCap,
            MaxCashbackPerCardPerMonth = maxCardCap,
            MaxEligibleSpending = maxEligibleSpending,
            MinTransaction = minTransaction,
            StartDate = startDate,
            EndDate = endDate
        };
    }

    private static Transaction CreateTx(
        string id = "TX1",
        string cardId = "CARD1",
        string mccCode = "5812",
        decimal amount = 1_000_000m,
        DateOnly? date = null,
        string status = "Posted",
        string? overrideRuleId = null)
    {
        return new Transaction
        {
            Id = id,
            CardId = cardId,
            MccCode = mccCode,
            Amount = amount,
            Date = date ?? new DateOnly(2026, 10, 1),
            MonthKey = 202610,
            Merchant = "Test Merchant",
            Status = status,
            OverrideRuleId = overrideRuleId,
            PaymentStatus = "Chưa thanh toán"
        };
    }

    [Fact]
    public void T1_Spend_1M_Rate_15Percent_NoCap_Returns_150K()
    {
        // Arrange
        var rules = new[] { CreateRule(rate: 0.15m, maxGroupCap: null, maxCardCap: null) };
        var txs = new[] { CreateTx(amount: 1_000_000m) };

        // Act
        CashbackCalculator.CalculateMonthlyTransactions(txs, rules);

        // Assert
        txs[0].TheoreticalCashback.Should().Be(150_000m);
        txs[0].ActualCashback.Should().Be(150_000m);
        txs[0].CashbackStatus.Should().Be("Được hoàn");
    }

    [Fact]
    public void T2_Spend_10M_Rate_15Percent_GroupCap_500K_Returns_500K()
    {
        // Arrange
        var rules = new[] { CreateRule(rate: 0.15m, maxGroupCap: 500_000m, maxCardCap: null) };
        var txs = new[] { CreateTx(amount: 10_000_000m) };

        // Act
        CashbackCalculator.CalculateMonthlyTransactions(txs, rules);

        // Assert
        txs[0].TheoreticalCashback.Should().Be(1_500_000m);
        txs[0].ActualCashback.Should().Be(500_000m);
        txs[0].CashbackStatus.Should().Be("Hoàn một phần");
    }

    [Fact]
    public void T3_GroupAlreadyReceived_450K_NewTheoretical_100K_GroupCap_500K_Returns_50K()
    {
        // Arrange
        var rules = new[] { CreateRule(rate: 0.15m, maxGroupCap: 500_000m, maxCardCap: 1_000_000m) };
        var tx1 = CreateTx(id: "TX1", amount: 3_000_000m, date: new DateOnly(2026, 10, 1)); // 3M x 15% = 450K
        var tx2 = CreateTx(id: "TX2", amount: 666_667m, date: new DateOnly(2026, 10, 2)); // 666,667 x 15% = 100,000

        // Act
        CashbackCalculator.CalculateMonthlyTransactions(new[] { tx1, tx2 }, rules);

        // Assert
        tx1.ActualCashback.Should().Be(450_000m);
        tx2.TheoreticalCashback.Should().Be(100_000m);
        tx2.ActualCashback.Should().Be(50_000m); // Remaining group cap = 50K
        tx2.CashbackStatus.Should().Be("Hoàn một phần");
    }

    [Fact]
    public void T4_CardAlreadyReceived_950K_CardCap_1M_NewTheoretical_100K_GroupHasCap_Returns_50K()
    {
        // Arrange
        // Group 1 gave 950K (Group 1 cap is 2M), Card Cap is 1M.
        var ruleG1 = CreateRule(id: "R1", groupName: "Group 1", mccCode: "5812", rate: 0.10m, maxGroupCap: 2_000_000m, maxCardCap: 1_000_000m);
        var ruleG2 = CreateRule(id: "R2", groupName: "Group 2", mccCode: "5411", rate: 0.10m, maxGroupCap: 2_000_000m, maxCardCap: 1_000_000m);
        var rules = new[] { ruleG1, ruleG2 };

        var tx1 = CreateTx(id: "TX1", mccCode: "5812", amount: 9_500_000m, date: new DateOnly(2026, 10, 1)); // 950K
        var tx2 = CreateTx(id: "TX2", mccCode: "5411", amount: 1_000_000m, date: new DateOnly(2026, 10, 2)); // Theoretical 100K, but Card cap rem is 50K

        // Act
        CashbackCalculator.CalculateMonthlyTransactions(new[] { tx1, tx2 }, rules);

        // Assert
        tx1.ActualCashback.Should().Be(950_000m);
        tx2.TheoreticalCashback.Should().Be(100_000m);
        tx2.ActualCashback.Should().Be(50_000m);
        tx2.CashbackStatus.Should().Be("Hoàn một phần");
    }

    [Fact]
    public void T5_WhenCardReachesCap_SubsequentTransactionsReturnZero_StatusReachedCap()
    {
        // Arrange
        var rules = new[] { CreateRule(rate: 0.10m, maxGroupCap: 1_000_000m, maxCardCap: 500_000m) };
        var tx1 = CreateTx(id: "TX1", amount: 5_000_000m, date: new DateOnly(2026, 10, 1)); // 500K -> reaches card cap
        var tx2 = CreateTx(id: "TX2", amount: 1_000_000m, date: new DateOnly(2026, 10, 2)); // 0 -> Reached cap

        // Act
        CashbackCalculator.CalculateMonthlyTransactions(new[] { tx1, tx2 }, rules);

        // Assert
        tx1.ActualCashback.Should().Be(500_000m);
        tx2.TheoreticalCashback.Should().Be(100_000m);
        tx2.ActualCashback.Should().Be(0m);
        tx2.CashbackStatus.Should().Be("Đã đạt cap");
    }

    [Fact]
    public void T6_MccNotMatchingAnyRule_ReturnsZero_StatusNotEligible()
    {
        // Arrange
        var rules = new[] { CreateRule(mccCode: "5812") };
        var tx = CreateTx(mccCode: "9999", amount: 1_000_000m);

        // Act
        CashbackCalculator.CalculateMonthlyTransactions(new[] { tx }, rules);

        // Assert
        tx.TheoreticalCashback.Should().Be(0m);
        tx.ActualCashback.Should().Be(0m);
        tx.CashbackStatus.Should().Be("Không được hoàn");
    }

    [Fact]
    public void T7_CardWithNoRules_ReturnsZero()
    {
        // Arrange
        var rules = Array.Empty<CashbackRule>();
        var tx = CreateTx(amount: 1_000_000m);

        // Act
        CashbackCalculator.CalculateMonthlyTransactions(new[] { tx }, rules);

        // Assert
        tx.TheoreticalCashback.Should().Be(0m);
        tx.ActualCashback.Should().Be(0m);
        tx.CashbackStatus.Should().Be("Không được hoàn");
    }

    [Fact]
    public void T8_AddingNewTransaction_RecalculatesMonthlyTotalAccurately()
    {
        // Arrange
        var rules = new[] { CreateRule(rate: 0.10m, maxGroupCap: 500_000m, maxCardCap: 1_000_000m) };
        var tx1 = CreateTx(id: "TX1", amount: 2_000_000m, date: new DateOnly(2026, 10, 1)); // 200K
        var tx2 = CreateTx(id: "TX2", amount: 2_000_000m, date: new DateOnly(2026, 10, 2)); // 200K

        // Act 1
        CashbackCalculator.CalculateMonthlyTransactions(new[] { tx1, tx2 }, rules);
        tx1.ActualCashback.Should().Be(200_000m);
        tx2.ActualCashback.Should().Be(200_000m);

        // Act 2: Add tx3 between or after
        var tx3 = CreateTx(id: "TX3", amount: 2_000_000m, date: new DateOnly(2026, 10, 3)); // Remaining group cap = 100K
        CashbackCalculator.CalculateMonthlyTransactions(new[] { tx1, tx2, tx3 }, rules);

        // Assert
        tx1.ActualCashback.Should().Be(200_000m);
        tx2.ActualCashback.Should().Be(200_000m);
        tx3.ActualCashback.Should().Be(100_000m);
        tx3.CashbackStatus.Should().Be("Hoàn một phần");
    }

    [Fact]
    public void MaxEligibleSpending_LimitsSpendingBasisPerGroupPerMonth()
    {
        // Arrange: Max eligible spending 5,000,000, rate 8%
        var rule = CreateRule(rate: 0.08m, maxEligibleSpending: 5_000_000m, maxGroupCap: 1_000_000m);
        var tx1 = CreateTx(id: "TX1", amount: 6_000_000m, date: new DateOnly(2026, 10, 1)); // Only 5M eligible -> 400K cashback
        var tx2 = CreateTx(id: "TX2", amount: 2_000_000m, date: new DateOnly(2026, 10, 2)); // 0 eligible left -> 0 cashback

        // Act
        CashbackCalculator.CalculateMonthlyTransactions(new[] { tx1, tx2 }, new[] { rule });

        // Assert
        tx1.EligibleAmount.Should().Be(5_000_000m);
        tx1.TheoreticalCashback.Should().Be(400_000m);
        tx1.ActualCashback.Should().Be(400_000m);
        tx1.CashbackStatus.Should().Be("Hoàn một phần"); // because Eligible < Amount

        tx2.EligibleAmount.Should().Be(0m);
        tx2.TheoreticalCashback.Should().Be(0m);
        tx2.ActualCashback.Should().Be(0m);
        tx2.CashbackStatus.Should().Be("Đã đạt cap"); // because Eligible < Amount
    }

    [Fact]
    public void MinTransaction_BelowThreshold_IsNotEligible()
    {
        // Arrange
        var rule = CreateRule(rate: 0.05m, minTransaction: 100_000m);
        var txBelow = CreateTx(id: "TX1", amount: 50_000m);
        var txAbove = CreateTx(id: "TX2", amount: 150_000m);

        // Act
        CashbackCalculator.CalculateMonthlyTransactions(new[] { txBelow, txAbove }, new[] { rule });

        // Assert
        txBelow.ActualCashback.Should().Be(0m);
        txBelow.CashbackStatus.Should().Be("Không được hoàn");

        txAbove.ActualCashback.Should().Be(7_500m);
        txAbove.CashbackStatus.Should().Be("Được hoàn");
    }

    [Fact]
    public void ExpiredRule_OutsideDateRange_IsNotMatched()
    {
        // Arrange: Valid in September 2026 only
        var rule = CreateRule(
            startDate: new DateOnly(2026, 9, 1),
            endDate: new DateOnly(2026, 9, 30));
        var txOct = CreateTx(date: new DateOnly(2026, 10, 1));

        // Act
        CashbackCalculator.CalculateMonthlyTransactions(new[] { txOct }, new[] { rule });

        // Assert
        txOct.ActualCashback.Should().Be(0m);
        txOct.CashbackStatus.Should().Be("Không được hoàn");
    }

    [Fact]
    public void SameMcc_MultipleRules_DefaultTakesFirst_OverrideRuleIdTakesSecond()
    {
        // Arrange: MCC 5814 in R001 (Group 1, 15%) and R002 (Group 3, 5%)
        var r1 = CreateRule(id: "R001", groupName: "Group 1", mccCode: "5814", rate: 0.15m);
        var r2 = CreateRule(id: "R002", groupName: "Group 3", mccCode: "5814", rate: 0.05m);
        var rules = new[] { r1, r2 };

        var txDefault = CreateTx(id: "TX1", mccCode: "5814", amount: 1_000_000m, date: new DateOnly(2026, 10, 1));
        var txOverride = CreateTx(id: "TX2", mccCode: "5814", amount: 1_000_000m, date: new DateOnly(2026, 10, 2), overrideRuleId: "R002");

        // Act
        CashbackCalculator.CalculateMonthlyTransactions(new[] { txDefault, txOverride }, rules);

        // Assert
        txDefault.MatchedRuleId.Should().Be("R001");
        txDefault.Rate.Should().Be(0.15m);
        txDefault.ActualCashback.Should().Be(150_000m);

        txOverride.MatchedRuleId.Should().Be("R002");
        txOverride.Rate.Should().Be(0.05m);
        txOverride.ActualCashback.Should().Be(50_000m);
    }

    [Fact]
    public void CancelledTransaction_HasZeroCashback_DoesNotAffectCapOfLaterTransactions()
    {
        // Arrange: Group cap 500K
        var rule = CreateRule(rate: 0.10m, maxGroupCap: 500_000m);
        var txCancelled = CreateTx(id: "TX1", amount: 5_000_000m, date: new DateOnly(2026, 10, 1), status: "Cancelled");
        var txNormal = CreateTx(id: "TX2", amount: 5_000_000m, date: new DateOnly(2026, 10, 2), status: "Posted");

        // Act
        CashbackCalculator.CalculateMonthlyTransactions(new[] { txCancelled, txNormal }, new[] { rule });

        // Assert
        txCancelled.ActualCashback.Should().Be(0m);
        txCancelled.CashbackStatus.Should().Be("Đã hủy");

        txNormal.ActualCashback.Should().Be(500_000m);
        txNormal.CashbackStatus.Should().Be("Được hoàn");
    }

    [Fact]
    public void MonthIsolation_SeptemberDoesNotAffectOctober()
    {
        // Arrange
        var rule = CreateRule(rate: 0.15m, maxGroupCap: 500_000m, maxCardCap: 1_000_000m);
        var txSep = CreateTx(id: "TX1", amount: 4_000_000m, date: new DateOnly(2026, 9, 5)); // 600K -> 500K
        var txOct = CreateTx(id: "TX2", amount: 4_000_000m, date: new DateOnly(2026, 10, 1)); // fresh month -> 500K

        // Act
        CashbackCalculator.CalculateMonthlyTransactions(new[] { txSep }, new[] { rule });
        CashbackCalculator.CalculateMonthlyTransactions(new[] { txOct }, new[] { rule });

        // Assert
        txSep.ActualCashback.Should().Be(500_000m);
        txOct.ActualCashback.Should().Be(500_000m);
    }

    [Fact]
    public void Preview_ReturnsAccurateInstantPreview()
    {
        // Arrange: Group cap 500K, existing tx received 300K
        var rule = CreateRule(rate: 0.10m, maxGroupCap: 500_000m, maxCardCap: 1_000_000m);
        var existingTx = CreateTx(id: "TX1", amount: 3_000_000m, date: new DateOnly(2026, 10, 1)); // 300K received

        // Act: preview a new 3M tx (theoretical 300K, but remaining cap is 200K)
        var preview = CashbackCalculator.Preview(
            cardId: "CARD1",
            date: new DateOnly(2026, 10, 2),
            mccCode: "5812",
            amount: 3_000_000m,
            overrideRuleId: null,
            existingMonthTransactions: new[] { existingTx },
            rules: new[] { rule }
        );

        // Assert
        preview.MatchedRuleId.Should().Be("R001");
        preview.TheoreticalCashback.Should().Be(300_000m);
        preview.ActualCashback.Should().Be(200_000m);
        preview.CashbackStatus.Should().Be("Hoàn một phần");
        preview.RemainingGroupCap.Should().Be(0m);
        preview.RemainingCardCap.Should().Be(500_000m);
    }

    [Fact]
    public void BillingSchedule_CalculatesCorrectDates()
    {
        // Statement day 25, Due day 15 (next month)
        var txDate1 = new DateOnly(2026, 9, 3);
        var stmtDate1 = BillingScheduleHelper.CalculateStatementDate(txDate1, 25);
        var dueDate1 = BillingScheduleHelper.CalculatePaymentDueDate(stmtDate1, 25, 15);

        stmtDate1.Should().Be(new DateOnly(2026, 9, 25));
        dueDate1.Should().Be(new DateOnly(2026, 10, 15));

        // Statement day 5, Due day 25 (same month as statement)
        var txDate2 = new DateOnly(2026, 9, 12);
        var stmtDate2 = BillingScheduleHelper.CalculateStatementDate(txDate2, 5);
        var dueDate2 = BillingScheduleHelper.CalculatePaymentDueDate(stmtDate2, 5, 25);

        stmtDate2.Should().Be(new DateOnly(2026, 10, 5));
        dueDate2.Should().Be(new DateOnly(2026, 10, 25));
    }
}
