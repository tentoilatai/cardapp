namespace CreditCardManager.Domain.Entities;

public class Transaction
{
    public string Id { get; set; } = string.Empty; // e.g. "TX0001"
    public DateOnly Date { get; set; }
    public int MonthKey { get; set; } // yyyymm e.g. 202610
    public string CardId { get; set; } = string.Empty;
    public string Merchant { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string MccCode { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = "Posted"; // Posted, Pending, Cancelled
    public string PaymentStatus { get; set; } = "Chưa thanh toán"; // Chưa thanh toán, Đã thanh toán
    public string? OverrideRuleId { get; set; }
    public string? Note { get; set; }

    // Calculated fields stored in DB
    public string? MatchedRuleId { get; set; }
    public string? GroupName { get; set; }
    public decimal EligibleAmount { get; set; }
    public decimal Rate { get; set; }
    public decimal TheoreticalCashback { get; set; }
    public decimal ActualCashback { get; set; }
    public string CashbackStatus { get; set; } = "Không được hoàn"; // Được hoàn, Hoàn một phần, Đã đạt cap, Không được hoàn, Đã hủy
    public DateOnly StatementDate { get; set; }
    public DateOnly PaymentDueDate { get; set; }

    public Card? Card { get; set; }
    public Mcc? Mcc { get; set; }
    public CashbackRule? MatchedRule { get; set; }
    public CashbackRule? OverrideRule { get; set; }
}
