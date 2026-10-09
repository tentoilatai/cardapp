namespace CreditCardManager.Domain.Entities;

public class AppSettings
{
    public int Id { get; set; }
    public decimal UtilizationMildThreshold { get; set; } = 0.5m;
    public decimal UtilizationWarningThreshold { get; set; } = 0.7m;
    public decimal UtilizationDangerThreshold { get; set; } = 0.9m;
    public int DueSoonDays { get; set; } = 5;
    public decimal NearCapThreshold { get; set; } = 0.8m;
    
    // JSON or delimited lists
    public string BanksJson { get; set; } = "[\"VPBank\",\"VIB\",\"Techcombank\",\"UOB\",\"MB\",\"ACB\",\"Vietcombank\",\"BIDV\",\"Sacombank\",\"HSBC\"]";
    public string CategoriesJson { get; set; } = "[\"Dining\",\"Groceries\",\"Shopping\",\"Electronics\",\"Transport\",\"Fuel\",\"Travel\",\"Entertainment\",\"Fitness & Wellness\",\"Healthcare\",\"Utilities & Telecom\",\"Education\",\"Online Services\",\"Other\"]";
}
