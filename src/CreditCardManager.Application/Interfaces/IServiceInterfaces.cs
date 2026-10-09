using CreditCardManager.Application.DTOs;

namespace CreditCardManager.Application.Interfaces;

public interface ICardService
{
    Task<List<CardDto>> GetAllAsync(CancellationToken ct = default);
    Task<CardDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<CardDto> CreateAsync(CreateCardDto dto, CancellationToken ct = default);
    Task<CardDto?> UpdateAsync(string id, UpdateCardDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(string id, CancellationToken ct = default);
    Task<CardStatusDto?> GetCardStatusAsync(string id, DateOnly? referenceDate = null, CancellationToken ct = default);
    Task<List<CardStatusDto>> GetAllCardStatusesAsync(DateOnly? referenceDate = null, CancellationToken ct = default);
    Task<bool> MarkStatementPaidAsync(string id, DateOnly? referenceDate = null, CancellationToken ct = default);
}

public interface IMccService
{
    Task<List<MccDto>> GetAllAsync(string? search = null, string? category = null, CancellationToken ct = default);
    Task<MccDto?> GetByCodeAsync(string code, CancellationToken ct = default);
    Task<MccDto> CreateAsync(CreateMccDto dto, CancellationToken ct = default);
    Task<MccDto?> UpdateAsync(string code, UpdateMccDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(string code, CancellationToken ct = default);
}

public interface ICashbackRuleService
{
    Task<List<CashbackRuleDto>> GetAllAsync(string? cardId = null, CancellationToken ct = default);
    Task<CashbackRuleDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<CashbackRuleDto> CreateAsync(CreateCashbackRuleDto dto, CancellationToken ct = default);
    Task<List<CashbackRuleDto>> BatchCreateAsync(BatchCreateCashbackRulesDto dto, CancellationToken ct = default);
    Task<CashbackRuleDto?> UpdateAsync(string id, UpdateCashbackRuleDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(string id, CancellationToken ct = default);
}

public record PagedResult<T>(List<T> Items, int TotalCount, int Page, int PageSize);

public interface ITransactionService
{
    Task<PagedResult<TransactionDto>> GetTransactionsAsync(
        int? monthKey = null,
        string? cardId = null,
        string? mccCode = null,
        string? status = null,
        string? cashbackStatus = null,
        int page = 1,
        int pageSize = 50,
        CancellationToken ct = default);

    Task<TransactionDto?> GetByIdAsync(string id, CancellationToken ct = default);
    Task<TransactionDto> CreateAsync(CreateTransactionDto dto, CancellationToken ct = default);
    Task<TransactionDto?> UpdateAsync(string id, UpdateTransactionDto dto, CancellationToken ct = default);
    Task<bool> DeleteAsync(string id, CancellationToken ct = default);
    Task<TransactionPreviewResponse> PreviewAsync(TransactionPreviewRequest req, CancellationToken ct = default);
    Task<bool> MarkPaidAsync(string id, CancellationToken ct = default);
    Task RecalculateForCardAndMonthAsync(string cardId, int monthKey, CancellationToken ct = default);
}
