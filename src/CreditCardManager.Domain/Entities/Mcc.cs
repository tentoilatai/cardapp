namespace CreditCardManager.Domain.Entities;

public class Mcc
{
    public string Code { get; set; } = string.Empty; // 4 digits, PK
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Subcategory { get; set; }
    public string? Description { get; set; }

    public ICollection<CashbackRule> CashbackRules { get; set; } = new List<CashbackRule>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
