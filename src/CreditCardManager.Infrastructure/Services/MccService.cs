using CreditCardManager.Application.DTOs;
using CreditCardManager.Application.Interfaces;
using CreditCardManager.Domain.Entities;
using CreditCardManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CreditCardManager.Infrastructure.Services;

public class MccService : IMccService
{
    private readonly ApplicationDbContext _context;

    public MccService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<MccDto>> GetAllAsync(string? search = null, string? category = null, CancellationToken ct = default)
    {
        var query = _context.Mccs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(m => m.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.Trim();
            query = query.Where(m => m.Code.Contains(s) || m.Name.Contains(s) || (m.Description != null && m.Description.Contains(s)));
        }

        return await query
            .OrderBy(m => m.Category)
            .ThenBy(m => m.Code)
            .Select(m => new MccDto(m.Code, m.Name, m.Category, m.Subcategory, m.Description))
            .ToListAsync(ct);
    }

    public async Task<MccDto?> GetByCodeAsync(string code, CancellationToken ct = default)
    {
        var m = await _context.Mccs.AsNoTracking().FirstOrDefaultAsync(x => x.Code == code, ct);
        if (m == null) return null;
        return new MccDto(m.Code, m.Name, m.Category, m.Subcategory, m.Description);
    }

    public async Task<MccDto> CreateAsync(CreateMccDto dto, CancellationToken ct = default)
    {
        string code = dto.Code.Trim().PadLeft(4, '0');
        if (await _context.Mccs.AnyAsync(m => m.Code == code, ct))
        {
            throw new InvalidOperationException($"Mã MCC '{code}' đã tồn tại.");
        }

        var mcc = new Mcc
        {
            Code = code,
            Name = dto.Name.Trim(),
            Category = dto.Category.Trim(),
            Subcategory = dto.Subcategory?.Trim(),
            Description = dto.Description?.Trim()
        };

        _context.Mccs.Add(mcc);
        await _context.SaveChangesAsync(ct);

        return new MccDto(mcc.Code, mcc.Name, mcc.Category, mcc.Subcategory, mcc.Description);
    }

    public async Task<MccDto?> UpdateAsync(string code, UpdateMccDto dto, CancellationToken ct = default)
    {
        var mcc = await _context.Mccs.FirstOrDefaultAsync(x => x.Code == code, ct);
        if (mcc == null) return null;

        mcc.Name = dto.Name.Trim();
        mcc.Category = dto.Category.Trim();
        mcc.Subcategory = dto.Subcategory?.Trim();
        mcc.Description = dto.Description?.Trim();

        await _context.SaveChangesAsync(ct);
        return new MccDto(mcc.Code, mcc.Name, mcc.Category, mcc.Subcategory, mcc.Description);
    }

    public async Task<bool> DeleteAsync(string code, CancellationToken ct = default)
    {
        var mcc = await _context.Mccs.Include(m => m.Transactions).Include(m => m.CashbackRules).FirstOrDefaultAsync(x => x.Code == code, ct);
        if (mcc == null) return false;

        if (mcc.Transactions.Any() || mcc.CashbackRules.Any())
        {
            throw new InvalidOperationException("Không thể xóa MCC đã gắn với giao dịch hoặc cashback rule.");
        }

        _context.Mccs.Remove(mcc);
        await _context.SaveChangesAsync(ct);
        return true;
    }
}
