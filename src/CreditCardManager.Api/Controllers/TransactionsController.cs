using CreditCardManager.Application.DTOs;
using CreditCardManager.Application.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace CreditCardManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _txService;
    private readonly IValidator<CreateTransactionDto> _createValidator;
    private readonly IValidator<UpdateTransactionDto> _updateValidator;

    public TransactionsController(
        ITransactionService txService,
        IValidator<CreateTransactionDto> createValidator,
        IValidator<UpdateTransactionDto> updateValidator)
    {
        _txService = txService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    [HttpGet]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] int? monthKey,
        [FromQuery] string? cardId,
        [FromQuery] string? mccCode,
        [FromQuery] string? status,
        [FromQuery] string? cashbackStatus,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var result = await _txService.GetTransactionsAsync(monthKey, cardId, mccCode, status, cashbackStatus, page, pageSize, ct);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken ct)
    {
        var tx = await _txService.GetByIdAsync(id, ct);
        if (tx == null) return NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy", Detail = $"Giao dịch '{id}' không tồn tại." });
        return Ok(tx);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTransactionDto dto, CancellationToken ct)
    {
        var val = await _createValidator.ValidateAsync(dto, ct);
        if (!val.IsValid)
        {
            return BadRequest(new ProblemDetails { Status = 400, Title = "Dữ liệu không hợp lệ", Detail = val.Errors.First().ErrorMessage });
        }

        var created = await _txService.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateTransactionDto dto, CancellationToken ct)
    {
        var val = await _updateValidator.ValidateAsync(dto, ct);
        if (!val.IsValid)
        {
            return BadRequest(new ProblemDetails { Status = 400, Title = "Dữ liệu không hợp lệ", Detail = val.Errors.First().ErrorMessage });
        }

        var updated = await _txService.UpdateAsync(id, dto, ct);
        if (updated == null) return NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy", Detail = $"Giao dịch '{id}' không tồn tại." });
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        var deleted = await _txService.DeleteAsync(id, ct);
        if (!deleted) return NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy", Detail = $"Giao dịch '{id}' không tồn tại." });
        return Ok(new { message = "Xóa giao dịch thành công." });
    }

    [HttpPost("preview")]
    public async Task<IActionResult> Preview([FromBody] TransactionPreviewRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.CardId) || string.IsNullOrWhiteSpace(req.MccCode))
        {
            return BadRequest(new ProblemDetails { Status = 400, Title = "Dữ liệu không hợp lệ", Detail = "Vui lòng chọn Thẻ và mã MCC." });
        }

        var result = await _txService.PreviewAsync(req, ct);
        return Ok(result);
    }

    [HttpPost("{id}/mark-paid")]
    public async Task<IActionResult> MarkPaid(string id, CancellationToken ct)
    {
        var res = await _txService.MarkPaidAsync(id, ct);
        if (!res) return NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy", Detail = $"Giao dịch '{id}' không tồn tại." });
        return Ok(new { message = "Cập nhật trạng thái thanh toán thành công." });
    }
}
