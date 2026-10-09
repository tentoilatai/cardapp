namespace CreditCardManager.Domain.Entities;

public class CashbackRule
{
    public string Id { get; set; } = string.Empty; // e.g. "R001"
    public string CardId { get; set; } = string.Empty;
    public string GroupName { get; set; } = string.Empty; // e.g. "Group 1", "Dining"
    public string CategoryName { get; set; } = string.Empty;
    public string MccCode { get; set; } = string.Empty;
    public decimal Rate { get; set; } // e.g. 0.150000 = 15%
    public decimal? MaxCashbackPerGroupPerMonth { get; set; } // Group cap / month
    public decimal? MaxCashbackPerCardPerMonth { get; set; } // Card cap / month
    public decimal? MaxEligibleSpending { get; set; } // Max eligible spending per group/month
    public decimal? MinTransaction { get; set; } // Minimum amount per transaction
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Condition { get; set; }
    public string? Note { get; set; }

    public Card? Card { get; set; }
    public Mcc? Mcc { get; set; }
}
