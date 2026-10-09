namespace CreditCardManager.Domain.Services;

public static class BillingScheduleHelper
{
    /// <summary>
    /// StatementDate = ngày sao kê đầu tiên >= ngày giao dịch.
    /// Nếu StatementDay lớn hơn số ngày trong tháng thì lấy ngày cuối tháng.
    /// </summary>
    public static DateOnly CalculateStatementDate(DateOnly transactionDate, int statementDay)
    {
        statementDay = Math.Clamp(statementDay, 1, 31);
        
        // Check statement date in current month
        int daysInMonth = DateTime.DaysInMonth(transactionDate.Year, transactionDate.Month);
        int actualDayThisMonth = Math.Min(statementDay, daysInMonth);
        DateOnly statementDateThisMonth = new(transactionDate.Year, transactionDate.Month, actualDayThisMonth);

        if (transactionDate <= statementDateThisMonth)
        {
            return statementDateThisMonth;
        }

        // Otherwise statement is next month
        DateOnly nextMonth = transactionDate.AddMonths(1);
        int daysInNextMonth = DateTime.DaysInMonth(nextMonth.Year, nextMonth.Month);
        int actualDayNextMonth = Math.Min(statementDay, daysInNextMonth);
        return new DateOnly(nextMonth.Year, nextMonth.Month, actualDayNextMonth);
    }

    /// <summary>
    /// PaymentDueDate = ngày PaymentDueDay đầu tiên sau StatementDate.
    /// Nếu PaymentDueDay <= StatementDay thì rơi vào tháng sau của StatementDate.
    /// Nếu PaymentDueDay lớn hơn số ngày của tháng đến hạn thì lấy ngày cuối tháng.
    /// </summary>
    public static DateOnly CalculatePaymentDueDate(DateOnly statementDate, int statementDay, int paymentDueDay)
    {
        paymentDueDay = Math.Clamp(paymentDueDay, 1, 31);
        statementDay = Math.Clamp(statementDay, 1, 31);

        if (paymentDueDay > statementDay)
        {
            // Same month as statementDate
            int daysInMonth = DateTime.DaysInMonth(statementDate.Year, statementDate.Month);
            int actualDueDay = Math.Min(paymentDueDay, daysInMonth);
            return new DateOnly(statementDate.Year, statementDate.Month, actualDueDay);
        }
        else
        {
            // Following month after statementDate
            DateOnly nextMonth = statementDate.AddMonths(1);
            int daysInNextMonth = DateTime.DaysInMonth(nextMonth.Year, nextMonth.Month);
            int actualDueDay = Math.Min(paymentDueDay, daysInNextMonth);
            return new DateOnly(nextMonth.Year, nextMonth.Month, actualDueDay);
        }
    }

    /// <summary>
    /// Trạng thái thanh toán của sao kê:
    /// "Đã thanh toán" (dư nợ sao kê = 0), "Quá hạn" (số ngày còn < 0),
    /// "Đến hạn" (= 0), "Sắp đến hạn" (<= dueSoonDays), "Chưa đến hạn".
    /// </summary>
    public static string GetPaymentStatus(decimal unpaidStatementBalance, DateOnly paymentDueDate, DateOnly referenceDate, int dueSoonDays = 5)
    {
        if (unpaidStatementBalance <= 0)
        {
            return "Đã thanh toán";
        }

        int daysRemaining = paymentDueDate.DayNumber - referenceDate.DayNumber;

        if (daysRemaining < 0)
        {
            return "Quá hạn";
        }
        if (daysRemaining == 0)
        {
            return "Đến hạn";
        }
        if (daysRemaining <= dueSoonDays)
        {
            return "Sắp đến hạn";
        }

        return "Chưa đến hạn";
    }

    /// <summary>
    /// Mức utilization:
    /// < mild: Bình thường
    /// mild <= x < warning: Cảnh báo nhẹ
    /// warning <= x <= danger: Cảnh báo
    /// > danger: Nguy hiểm
    /// </summary>
    public static string GetUtilizationLevel(decimal utilization, decimal mild = 0.5m, decimal warning = 0.7m, decimal danger = 0.9m)
    {
        if (utilization > danger)
        {
            return "Nguy hiểm";
        }
        if (utilization >= warning)
        {
            return "Cảnh báo";
        }
        if (utilization >= mild)
        {
            return "Cảnh báo nhẹ";
        }
        return "Bình thường";
    }
}
