using CreditCardManager.Application.DTOs;
using CreditCardManager.Application.Interfaces;
using CreditCardManager.Domain.Entities;
using CreditCardManager.Domain.Services;
using CreditCardManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CreditCardManager.Infrastructure.Services;

public class CashbackRuleService : ICashbackRuleService
{
    private readonly ApplicationDbContext _context;

    public CashbackRuleService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CashbackRuleDto>> GetAllAsync(string? cardId = null, CancellationToken ct = default)
    {
        var query = _context.CashbackRules
            .Include(r => r.Card)
            .Include(r => r.Mcc)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(cardId))
        {
            query = query.Where(r => r.CardId == cardId);
        }

        return await query
            .OrderBy(r => r.CardId)
            .ThenBy(r => r.GroupName)
            .ThenBy(r => r.Id)
            .Select(r => new CashbackRuleDto(
                r.Id,
                r.CardId,
                r.Card != null ? r.Card.Name : null,
                r.Card != null ? r.Card.Bank : null,
                r.GroupName,
                r.CategoryName,
                r.MccCode,
                r.Mcc != null ? r.Mcc.Name : null,
                r.Rate,
                r.MaxCashbackPerGroupPerMonth,
                r.MaxCashbackPerCardPerMonth,
                r.MaxEligibleSpending,
                r.MinTransaction,
                r.StartDate,
                r.EndDate,
                r.Condition,
                r.Note
            ))
            .ToListAsync(ct);
    }

    public async Task<CashbackRuleDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        var r = await _context.CashbackRules
            .Include(x => x.Card)
            .Include(x => x.Mcc)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct);

        if (r == null) return null;

        return new CashbackRuleDto(
            r.Id,
            r.CardId,
            r.Card != null ? r.Card.Name : null,
            r.Card != null ? r.Card.Bank : null,
            r.GroupName,
            r.CategoryName,
            r.MccCode,
            r.Mcc != null ? r.Mcc.Name : null,
            r.Rate,
            r.MaxCashbackPerGroupPerMonth,
            r.MaxCashbackPerCardPerMonth,
            r.MaxEligibleSpending,
            r.MinTransaction,
            r.StartDate,
            r.EndDate,
            r.Condition,
            r.Note
        );
    }

    public async Task<CashbackRuleDto> CreateAsync(CreateCashbackRuleDto dto, CancellationToken ct = default)
    {
        string ruleId = dto.Id.Trim().ToUpperInvariant();
        if (await _context.CashbackRules.AnyAsync(r => r.Id == ruleId, ct))
        {
            throw new InvalidOperationException($"Rule ID '{ruleId}' đã tồn tại.");
        }

        var rule = new CashbackRule
        {
            Id = ruleId,
            CardId = dto.CardId.Trim(),
            GroupName = dto.GroupName.Trim(),
            CategoryName = dto.CategoryName.Trim(),
            MccCode = dto.MccCode.Trim().PadLeft(4, '0'),
            Rate = dto.Rate,
            MaxCashbackPerGroupPerMonth = dto.MaxCashbackPerGroupPerMonth,
            MaxCashbackPerCardPerMonth = dto.MaxCashbackPerCardPerMonth,
            MaxEligibleSpending = dto.MaxEligibleSpending,
            MinTransaction = dto.MinTransaction,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Condition = dto.Condition?.Trim(),
            Note = dto.Note?.Trim()
        };

        _context.CashbackRules.Add(rule);
        await _context.SaveChangesAsync(ct);

        await RecalculateAllForCardAsync(rule.CardId, ct);

        return (await GetByIdAsync(rule.Id, ct))!;
    }

    public async Task<List<CashbackRuleDto>> BatchCreateAsync(BatchCreateCashbackRulesDto dto, CancellationToken ct = default)
    {
        var rulesToCreate = new List<CashbackRule>();
        int existingCount = await _context.CashbackRules.CountAsync(ct);

        foreach (var mccCode in dto.MccCodes.Distinct())
        {
            existingCount++;
            string ruleId = $"R{existingCount:D3}";
            while (await _context.CashbackRules.AnyAsync(r => r.Id == ruleId, ct))
            {
                existingCount++;
                ruleId = $"R{existingCount:D3}";
            }

            var rule = new CashbackRule
            {
                Id = ruleId,
                CardId = dto.CardId.Trim(),
                GroupName = dto.GroupName.Trim(),
                CategoryName = dto.CategoryName.Trim(),
                MccCode = mccCode.Trim().PadLeft(4, '0'),
                Rate = dto.Rate,
                MaxCashbackPerGroupPerMonth = dto.MaxCashbackPerGroupPerMonth,
                MaxCashbackPerCardPerMonth = dto.MaxCashbackPerCardPerMonth,
                MaxEligibleSpending = dto.MaxEligibleSpending,
                MinTransaction = dto.MinTransaction,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Condition = dto.Condition?.Trim(),
                Note = dto.Note?.Trim()
            };
            rulesToCreate.Add(rule);
            _context.CashbackRules.Add(rule);
        }

        await _context.SaveChangesAsync(ct);
        await RecalculateAllForCardAsync(dto.CardId, ct);

        var ids = rulesToCreate.Select(r => r.Id).ToList();
        return await _context.CashbackRules
            .Include(r => r.Card)
            .Include(r => r.Mcc)
            .AsNoTracking()
            .Where(r => ids.Contains(r.Id))
            .Select(r => new CashbackRuleDto(
                r.Id,
                r.CardId,
                r.Card != null ? r.Card.Name : null,
                r.Card != null ? r.Card.Bank : null,
                r.GroupName,
                r.CategoryName,
                r.MccCode,
                r.Mcc != null ? r.Mcc.Name : null,
                r.Rate,
                r.MaxCashbackPerGroupPerMonth,
                r.MaxCashbackPerCardPerMonth,
                r.MaxEligibleSpending,
                r.MinTransaction,
                r.StartDate,
                r.EndDate,
                r.Condition,
                r.Note
            ))
            .ToListAsync(ct);
    }

    public async Task<CashbackRuleDto?> UpdateAsync(string id, UpdateCashbackRuleDto dto, CancellationToken ct = default)
    {
        var rule = await _context.CashbackRules.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (rule == null) return null;

        rule.GroupName = dto.GroupName.Trim();
        rule.CategoryName = dto.CategoryName.Trim();
        rule.MccCode = dto.MccCode.Trim().PadLeft(4, '0');
        rule.Rate = dto.Rate;
        rule.MaxCashbackPerGroupPerMonth = dto.MaxCashbackPerGroupPerMonth;
        rule.MaxCashbackPerCardPerMonth = dto.MaxCashbackPerCardPerMonth;
        rule.MaxEligibleSpending = dto.MaxEligibleSpending;
        rule.MinTransaction = dto.MinTransaction;
        rule.StartDate = dto.StartDate;
        rule.EndDate = dto.EndDate;
        rule.Condition = dto.Condition?.Trim();
        rule.Note = dto.Note?.Trim();

        await _context.SaveChangesAsync(ct);
        await RecalculateAllForCardAsync(rule.CardId, ct);

        return await GetByIdAsync(id, ct);
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken ct = default)
    {
        var rule = await _context.CashbackRules.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (rule == null) return false;

        string cardId = rule.CardId;
        _context.CashbackRules.Remove(rule);
        await _context.SaveChangesAsync(ct);

        await RecalculateAllForCardAsync(cardId, ct);
        return true;
    }

    private async Task RecalculateAllForCardAsync(string cardId, CancellationToken ct)
    {
        var card = await _context.Cards.FirstOrDefaultAsync(c => c.Id == cardId, ct);
        var rules = await _context.CashbackRules.Where(r => r.CardId == cardId).ToListAsync(ct);
        var months = await _context.Transactions
            .Where(t => t.CardId == cardId)
            .Select(t => t.MonthKey)
            .Distinct()
            .ToListAsync(ct);

        foreach (var month in months)
        {
            var txs = await _context.Transactions
                .Where(t => t.CardId == cardId && t.MonthKey == month)
                .OrderBy(t => t.Date)
                .ThenBy(t => t.Id)
                .ToListAsync(ct);

            CashbackCalculator.CalculateMonthlyTransactions(txs, rules, card);
        }

        await _context.SaveChangesAsync(ct);
    }
}
