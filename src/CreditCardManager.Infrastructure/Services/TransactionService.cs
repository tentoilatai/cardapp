using CreditCardManager.Application.DTOs;
using CreditCardManager.Application.Interfaces;
using CreditCardManager.Domain.Entities;
using CreditCardManager.Domain.Services;
using CreditCardManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CreditCardManager.Infrastructure.Services;

public class TransactionService : ITransactionService
{
    private readonly ApplicationDbContext _context;

    public TransactionService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<TransactionDto>> GetTransactionsAsync(
        int? monthKey = null,
        string? cardId = null,
        string? mccCode = null,
        string? status = null,
        string? cashbackStatus = null,
        int page = 1,
        int pageSize = 50,
        CancellationToken ct = default)
    {
        var query = _context.Transactions
            .Include(t => t.Card)
            .Include(t => t.Mcc)
            .AsNoTracking()
            .AsQueryable();

        if (monthKey.HasValue)
        {
            query = query.Where(t => t.MonthKey == monthKey.Value);
        }

        if (!string.IsNullOrWhiteSpace(cardId))
        {
            query = query.Where(t => t.CardId == cardId);
        }

        if (!string.IsNullOrWhiteSpace(mccCode))
        {
            query = query.Where(t => t.MccCode == mccCode);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(t => t.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(cashbackStatus))
        {
            query = query.Where(t => t.CashbackStatus == cashbackStatus);
        }

        int totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new TransactionDto(
                t.Id,
                t.Date,
                t.MonthKey,
                t.CardId,
                t.Card != null ? t.Card.Name : null,
                t.Card != null ? t.Card.Bank : null,
                t.Merchant,
                t.Description,
                t.MccCode,
                t.Mcc != null ? t.Mcc.Name : null,
                t.Mcc != null ? t.Mcc.Category : null,
                t.Amount,
                t.Status,
                t.PaymentStatus,
                t.OverrideRuleId,
                t.Note,
                t.MatchedRuleId,
                t.GroupName,
                t.EligibleAmount,
                t.Rate,
                t.TheoreticalCashback,
                t.ActualCashback,
                t.CashbackStatus,
                t.StatementDate,
                t.PaymentDueDate
            ))
            .ToListAsync(ct);

        return new PagedResult<TransactionDto>(items, totalCount, page, pageSize);
    }

    public async Task<TransactionDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        var t = await _context.Transactions
            .Include(x => x.Card)
            .Include(x => x.Mcc)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        if (t == null) return null;

        return new TransactionDto(
            t.Id,
            t.Date,
            t.MonthKey,
            t.CardId,
            t.Card != null ? t.Card.Name : null,
            t.Card != null ? t.Card.Bank : null,
            t.Merchant,
            t.Description,
            t.MccCode,
            t.Mcc != null ? t.Mcc.Name : null,
            t.Mcc != null ? t.Mcc.Category : null,
            t.Amount,
            t.Status,
            t.PaymentStatus,
            t.OverrideRuleId,
            t.Note,
            t.MatchedRuleId,
            t.GroupName,
            t.EligibleAmount,
            t.Rate,
            t.TheoreticalCashback,
            t.ActualCashback,
            t.CashbackStatus,
            t.StatementDate,
            t.PaymentDueDate
        );
    }

    public async Task<TransactionDto> CreateAsync(CreateTransactionDto dto, CancellationToken ct = default)
    {
        int monthKey = (dto.Date.Year * 100) + dto.Date.Month;
        string txId = !string.IsNullOrWhiteSpace(dto.Id) ? dto.Id.Trim().ToUpperInvariant() : string.Empty;

        if (string.IsNullOrEmpty(txId))
        {
            // Auto generate TX ID
            int count = await _context.Transactions.CountAsync(ct) + 1;
            txId = $"TX{count:D4}";
            while (await _context.Transactions.AnyAsync(t => t.Id == txId, ct))
            {
                count++;
                txId = $"TX{count:D4}";
            }
        }
        else if (await _context.Transactions.AnyAsync(t => t.Id == txId, ct))
        {
            throw new InvalidOperationException($"Giao dịch ID '{txId}' đã tồn tại.");
        }

        var tx = new Transaction
        {
            Id = txId,
            Date = dto.Date,
            MonthKey = monthKey,
            CardId = dto.CardId.Trim(),
            Merchant = dto.Merchant.Trim(),
            Description = dto.Description?.Trim(),
            MccCode = dto.MccCode.Trim().PadLeft(4, '0'),
            Amount = dto.Amount,
            Status = dto.Status,
            PaymentStatus = dto.PaymentStatus,
            OverrideRuleId = !string.IsNullOrWhiteSpace(dto.OverrideRuleId) ? dto.OverrideRuleId.Trim() : null,
            Note = dto.Note?.Trim()
        };

        _context.Transactions.Add(tx);
        await _context.SaveChangesAsync(ct);

        // Recalculate monthly transactions for this card and month
        await RecalculateForCardAndMonthAsync(tx.CardId, monthKey, ct);

        return (await GetByIdAsync(tx.Id, ct))!;
    }

    public async Task<TransactionDto?> UpdateAsync(string id, UpdateTransactionDto dto, CancellationToken ct = default)
    {
        var tx = await _context.Transactions.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (tx == null) return null;

        string oldCardId = tx.CardId;
        int oldMonthKey = tx.MonthKey;

        int newMonthKey = (dto.Date.Year * 100) + dto.Date.Month;

        tx.Date = dto.Date;
        tx.MonthKey = newMonthKey;
        tx.CardId = dto.CardId.Trim();
        tx.Merchant = dto.Merchant.Trim();
        tx.Description = dto.Description?.Trim();
        tx.MccCode = dto.MccCode.Trim().PadLeft(4, '0');
        tx.Amount = dto.Amount;
        tx.Status = dto.Status;
        tx.PaymentStatus = dto.PaymentStatus;
        tx.OverrideRuleId = !string.IsNullOrWhiteSpace(dto.OverrideRuleId) ? dto.OverrideRuleId.Trim() : null;
        tx.Note = dto.Note?.Trim();

        await _context.SaveChangesAsync(ct);

        // Recalculate affected card/months
        await RecalculateForCardAndMonthAsync(tx.CardId, newMonthKey, ct);
        if (oldCardId != tx.CardId || oldMonthKey != newMonthKey)
        {
            await RecalculateForCardAndMonthAsync(oldCardId, oldMonthKey, ct);
        }

        return await GetByIdAsync(id, ct);
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken ct = default)
    {
        var tx = await _context.Transactions.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (tx == null) return false;

        string cardId = tx.CardId;
        int monthKey = tx.MonthKey;

        _context.Transactions.Remove(tx);
        await _context.SaveChangesAsync(ct);

        await RecalculateForCardAndMonthAsync(cardId, monthKey, ct);
        return true;
    }

    public async Task<TransactionPreviewResponse> PreviewAsync(TransactionPreviewRequest req, CancellationToken ct = default)
    {
        int monthKey = (req.Date.Year * 100) + req.Date.Month;
        var existingTxs = await _context.Transactions
            .AsNoTracking()
            .Where(t => t.CardId == req.CardId && t.MonthKey == monthKey)
            .ToListAsync(ct);

        var rules = await _context.CashbackRules
            .AsNoTracking()
            .Where(r => r.CardId == req.CardId)
            .ToListAsync(ct);

        var preview = CashbackCalculator.Preview(
            req.CardId,
            req.Date,
            req.MccCode.Trim().PadLeft(4, '0'),
            req.Amount,
            req.OverrideRuleId,
            existingTxs,
            rules
        );

        return new TransactionPreviewResponse(
            preview.MatchedRuleId,
            preview.GroupName,
            preview.Rate,
            preview.EligibleAmount,
            preview.TheoreticalCashback,
            preview.ActualCashback,
            preview.CashbackStatus,
            preview.RemainingGroupCap,
            preview.RemainingCardCap,
            preview.RemainingEligibleSpending
        );
    }

    public async Task<bool> MarkPaidAsync(string id, CancellationToken ct = default)
    {
        var tx = await _context.Transactions.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (tx == null) return false;

        tx.PaymentStatus = tx.PaymentStatus == "Đã thanh toán" ? "Chưa thanh toán" : "Đã thanh toán";
        await _context.SaveChangesAsync(ct);
        return true;
    }

    public async Task RecalculateForCardAndMonthAsync(string cardId, int monthKey, CancellationToken ct = default)
    {
        var card = await _context.Cards.FirstOrDefaultAsync(c => c.Id == cardId, ct);
        var rules = await _context.CashbackRules.Where(r => r.CardId == cardId).ToListAsync(ct);
        var txs = await _context.Transactions
            .Where(t => t.CardId == cardId && t.MonthKey == monthKey)
            .OrderBy(t => t.Date)
            .ThenBy(t => t.Id)
            .ToListAsync(ct);

        if (txs.Any())
        {
            CashbackCalculator.CalculateMonthlyTransactions(txs, rules, card);
            await _context.SaveChangesAsync(ct);
        }
    }
}
