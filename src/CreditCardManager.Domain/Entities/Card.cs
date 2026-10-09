namespace CreditCardManager.Domain.Entities;

public class Card
{
    public string Id { get; set; } = string.Empty; // e.g. "VPB-JCBZ"
    public string Bank { get; set; } = string.Empty; // e.g. "VPBank"
    public string Name { get; set; } = string.Empty; // e.g. "JCB Z Card"
    public string CardType { get; set; } = "Credit"; // Credit, Platinum, Signature, etc.
    public string Network { get; set; } = "Visa"; // Visa, Mastercard, JCB, etc.
    public string Last4 { get; set; } = string.Empty; // Only 4 digits
    public decimal CreditLimit { get; set; }
    public int StatementDay { get; set; } = 1; // 1-31
    public int PaymentDueDay { get; set; } = 1; // 1-31
    public DateOnly OpenDate { get; set; }
    public decimal AnnualFee { get; set; }
    public decimal FirstYearFee { get; set; }
    public string Status { get; set; } = "Active"; // Active, Inactive, Closed
    public string? Note { get; set; }

    public ICollection<CashbackRule> CashbackRules { get; set; } = new List<CashbackRule>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
