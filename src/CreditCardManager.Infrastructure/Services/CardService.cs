using CreditCardManager.Application.DTOs;
using CreditCardManager.Application.Interfaces;
using CreditCardManager.Domain.Entities;
using CreditCardManager.Domain.Services;
using CreditCardManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CreditCardManager.Infrastructure.Services;

public class CardService : ICardService
{
    private readonly ApplicationDbContext _context;
    private readonly TimeProvider _timeProvider;

    public CardService(ApplicationDbContext context, TimeProvider timeProvider)
    {
        _context = context;
        _timeProvider = timeProvider;
    }

    public async Task<List<CardDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await _context.Cards
            .AsNoTracking()
            .OrderBy(c => c.Bank)
            .ThenBy(c => c.Name)
            .Select(c => new CardDto(
                c.Id,
                c.Bank,
                c.Name,
                c.CardType,
                c.Network,
                c.Last4,
                c.CreditLimit,
                c.StatementDay,
                c.PaymentDueDay,
                c.OpenDate,
                c.AnnualFee,
                c.FirstYearFee,
                c.Status,
                c.Note
            ))
            .ToListAsync(ct);
    }

    public async Task<CardDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        var c = await _context.Cards.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c == null) return null;

        return new CardDto(
            c.Id,
            c.Bank,
            c.Name,
            c.CardType,
            c.Network,
            c.Last4,
            c.CreditLimit,
            c.StatementDay,
            c.PaymentDueDay,
            c.OpenDate,
            c.AnnualFee,
            c.FirstYearFee,
            c.Status,
            c.Note
        );
    }

    public async Task<CardDto> CreateAsync(CreateCardDto dto, CancellationToken ct = default)
    {
        var card = new Card
        {
            Id = dto.Id.Trim().ToUpperInvariant(),
            Bank = dto.Bank.Trim(),
            Name = dto.Name.Trim(),
            CardType = dto.CardType.Trim(),
            Network = dto.Network.Trim(),
            Last4 = dto.Last4.Trim(),
            CreditLimit = dto.CreditLimit,
            StatementDay = dto.StatementDay,
            PaymentDueDay = dto.PaymentDueDay,
            OpenDate = dto.OpenDate,
            AnnualFee = dto.AnnualFee,
            FirstYearFee = dto.FirstYearFee,
            Status = dto.Status,
            Note = dto.Note
        };

        _context.Cards.Add(card);
        await _context.SaveChangesAsync(ct);

        return (await GetByIdAsync(card.Id, ct))!;
    }

    public async Task<CardDto?> UpdateAsync(string id, UpdateCardDto dto, CancellationToken ct = default)
    {
        var card = await _context.Cards.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (card == null) return null;

        bool statementOrDueDayChanged = card.StatementDay != dto.StatementDay || card.PaymentDueDay != dto.PaymentDueDay;

        card.Bank = dto.Bank.Trim();
        card.Name = dto.Name.Trim();
        card.CardType = dto.CardType.Trim();
        card.Network = dto.Network.Trim();
        card.Last4 = dto.Last4.Trim();
        card.CreditLimit = dto.CreditLimit;
        card.StatementDay = dto.StatementDay;
        card.PaymentDueDay = dto.PaymentDueDay;
        card.OpenDate = dto.OpenDate;
        card.AnnualFee = dto.AnnualFee;
        card.FirstYearFee = dto.FirstYearFee;
        card.Status = dto.Status;
        card.Note = dto.Note;

        if (statementOrDueDayChanged)
        {
            // Recalculate statement dates for transactions
            var txs = await _context.Transactions.Where(t => t.CardId == id).ToListAsync(ct);
            foreach (var tx in txs)
            {
                tx.StatementDate = BillingScheduleHelper.CalculateStatementDate(tx.Date, card.StatementDay);
                tx.PaymentDueDate = BillingScheduleHelper.CalculatePaymentDueDate(tx.StatementDate, card.StatementDay, card.PaymentDueDay);
            }
        }

        await _context.SaveChangesAsync(ct);
        return await GetByIdAsync(id, ct);
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken ct = default)
    {
        var card = await _context.Cards.Include(c => c.Transactions).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (card == null) return false;

        if (card.Transactions.Any())
        {
            throw new InvalidOperationException("Không thể xóa thẻ đang có giao dịch. Hãy xóa các giao dịch liên quan trước hoặc chuyển trạng thái thẻ sang Closed.");
        }

        _context.Cards.Remove(card);
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task<CardStatusDto?> GetCardStatusAsync(string id, DateOnly? referenceDate = null, CancellationToken ct = default)
    {
        var card = await _context.Cards.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (card == null) return null;

        var settings = await _context.Settings.AsNoTracking().FirstOrDefaultAsync(ct) ?? new AppSettings();
        var today = referenceDate ?? DateOnly.FromDateTime(_timeProvider.GetLocalNow().DateTime);

        // Used credit = total transactions non-cancelled and PaymentStatus != "Đã thanh toán"
        var activeUnpaidTxs = await _context.Transactions
            .AsNoTracking()
            .Where(t => t.CardId == id && t.Status != "Cancelled" && t.PaymentStatus != "Đã thanh toán")
            .ToListAsync(ct);

        decimal usedCredit = activeUnpaidTxs.Sum(t => t.Amount);
        decimal availableCredit = Math.Max(0m, card.CreditLimit - usedCredit);
        decimal utilization = card.CreditLimit > 0 ? Math.Round(usedCredit / card.CreditLimit, 4) : 0m;
        string utilLevel = BillingScheduleHelper.GetUtilizationLevel(
            utilization,
            settings.UtilizationMildThreshold,
            settings.UtilizationWarningThreshold,
            settings.UtilizationDangerThreshold
        );

        // Find latest statement date and due date relative to today
        var latestStmtDate = BillingScheduleHelper.CalculateStatementDate(today, card.StatementDay);
        var paymentDueDate = BillingScheduleHelper.CalculatePaymentDueDate(latestStmtDate, card.StatementDay, card.PaymentDueDay);

        // Unpaid statement balance: transactions with StatementDate <= latestStmtDate and unpaid
        decimal unpaidStmtBalance = activeUnpaidTxs
            .Where(t => t.StatementDate <= latestStmtDate)
            .Sum(t => t.Amount);

        string paymentStatus = BillingScheduleHelper.GetPaymentStatus(unpaidStmtBalance, paymentDueDate, today, settings.DueSoonDays);
        int daysRemaining = paymentDueDate.DayNumber - today.DayNumber;

        return new CardStatusDto(
            card.Id,
            card.Name,
            card.Bank,
            card.CreditLimit,
            usedCredit,
            availableCredit,
            utilization,
            utilLevel,
            latestStmtDate,
            paymentDueDate,
            daysRemaining,
            paymentStatus,
            unpaidStmtBalance,
            card.Status
        );
    }

    public async Task<List<CardStatusDto>> GetAllCardStatusesAsync(DateOnly? referenceDate = null, CancellationToken ct = default)
    {
        var cards = await _context.Cards.AsNoTracking().OrderBy(c => c.Bank).ThenBy(c => c.Name).ToListAsync(ct);
        var settings = await _context.Settings.AsNoTracking().FirstOrDefaultAsync(ct) ?? new AppSettings();
        var today = referenceDate ?? DateOnly.FromDateTime(_timeProvider.GetLocalNow().DateTime);

        var allUnpaidTxs = await _context.Transactions
            .AsNoTracking()
            .Where(t => t.Status != "Cancelled" && t.PaymentStatus != "Đã thanh toán")
            .ToListAsync(ct);

        var result = new List<CardStatusDto>();
        foreach (var card in cards)
        {
            var cardTxs = allUnpaidTxs.Where(t => t.CardId == card.Id).ToList();
            decimal usedCredit = cardTxs.Sum(t => t.Amount);
            decimal availableCredit = Math.Max(0m, card.CreditLimit - usedCredit);
            decimal utilization = card.CreditLimit > 0 ? Math.Round(usedCredit / card.CreditLimit, 4) : 0m;
            string utilLevel = BillingScheduleHelper.GetUtilizationLevel(
                utilization,
                settings.UtilizationMildThreshold,
                settings.UtilizationWarningThreshold,
                settings.UtilizationDangerThreshold
            );

            var latestStmtDate = BillingScheduleHelper.CalculateStatementDate(today, card.StatementDay);
            var paymentDueDate = BillingScheduleHelper.CalculatePaymentDueDate(latestStmtDate, card.StatementDay, card.PaymentDueDay);
            decimal unpaidStmtBalance = cardTxs.Where(t => t.StatementDate <= latestStmtDate).Sum(t => t.Amount);
            string paymentStatus = BillingScheduleHelper.GetPaymentStatus(unpaidStmtBalance, paymentDueDate, today, settings.DueSoonDays);
            int daysRemaining = paymentDueDate.DayNumber - today.DayNumber;

            result.Add(new CardStatusDto(
                card.Id,
                card.Name,
                card.Bank,
                card.CreditLimit,
                usedCredit,
                availableCredit,
                utilization,
                utilLevel,
                latestStmtDate,
                paymentDueDate,
                daysRemaining,
                paymentStatus,
                unpaidStmtBalance,
                card.Status
            ));
        }

        return result;
    }

    public async Task<bool> MarkStatementPaidAsync(string id, DateOnly? referenceDate = null, CancellationToken ct = default)
    {
        var card = await _context.Cards.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (card == null) return false;

        var today = referenceDate ?? DateOnly.FromDateTime(_timeProvider.GetLocalNow().DateTime);
        var latestStmtDate = BillingScheduleHelper.CalculateStatementDate(today, card.StatementDay);

        var txsToMark = await _context.Transactions
            .Where(t => t.CardId == id && t.Status != "Cancelled" && t.PaymentStatus != "Đã thanh toán" && t.StatementDate <= latestStmtDate)
            .ToListAsync(ct);

        foreach (var tx in txsToMark)
        {
            tx.PaymentStatus = "Đã thanh toán";
        }

        await _context.SaveChangesAsync(ct);
        return true;
    }
}
