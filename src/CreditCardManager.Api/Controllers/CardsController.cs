using CreditCardManager.Application.DTOs;
using CreditCardManager.Application.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace CreditCardManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CardsController : ControllerBase
{
    private readonly ICardService _cardService;
    private readonly IValidator<CreateCardDto> _createValidator;
    private readonly IValidator<UpdateCardDto> _updateValidator;

    public CardsController(
        ICardService cardService,
        IValidator<CreateCardDto> createValidator,
        IValidator<UpdateCardDto> updateValidator)
    {
        _cardService = cardService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var cards = await _cardService.GetAllAsync(ct);
        return Ok(cards);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken ct)
    {
        var card = await _cardService.GetByIdAsync(id, ct);
        if (card == null) return NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy", Detail = $"Thẻ '{id}' không tồn tại." });
        return Ok(card);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCardDto dto, CancellationToken ct)
    {
        var val = await _createValidator.ValidateAsync(dto, ct);
        if (!val.IsValid)
        {
            return BadRequest(new ProblemDetails { Status = 400, Title = "Dữ liệu không hợp lệ", Detail = val.Errors.First().ErrorMessage });
        }

        var created = await _cardService.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateCardDto dto, CancellationToken ct)
    {
        var val = await _updateValidator.ValidateAsync(dto, ct);
        if (!val.IsValid)
        {
            return BadRequest(new ProblemDetails { Status = 400, Title = "Dữ liệu không hợp lệ", Detail = val.Errors.First().ErrorMessage });
        }

        var updated = await _cardService.UpdateAsync(id, dto, ct);
        if (updated == null) return NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy", Detail = $"Thẻ '{id}' không tồn tại." });
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        var deleted = await _cardService.DeleteAsync(id, ct);
        if (!deleted) return NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy", Detail = $"Thẻ '{id}' không tồn tại." });
        return Ok(new { message = "Xóa thẻ thành công." });
    }

    [HttpGet("{id}/status")]
    public async Task<IActionResult> GetStatus(string id, [FromQuery] string? refDate, CancellationToken ct)
    {
        DateOnly? referenceDate = null;
        if (!string.IsNullOrWhiteSpace(refDate) && DateOnly.TryParse(refDate, out var parsedDate))
        {
            referenceDate = parsedDate;
        }

        var status = await _cardService.GetCardStatusAsync(id, referenceDate, ct);
        if (status == null) return NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy", Detail = $"Thẻ '{id}' không tồn tại." });
        return Ok(status);
    }

    [HttpGet("statuses")]
    public async Task<IActionResult> GetAllStatuses([FromQuery] string? refDate, CancellationToken ct)
    {
        DateOnly? referenceDate = null;
        if (!string.IsNullOrWhiteSpace(refDate) && DateOnly.TryParse(refDate, out var parsedDate))
        {
            referenceDate = parsedDate;
        }

        var statuses = await _cardService.GetAllCardStatusesAsync(referenceDate, ct);
        return Ok(statuses);
    }

    [HttpPost("{id}/mark-statement-paid")]
    public async Task<IActionResult> MarkStatementPaid(string id, [FromQuery] string? refDate, CancellationToken ct)
    {
        DateOnly? referenceDate = null;
        if (!string.IsNullOrWhiteSpace(refDate) && DateOnly.TryParse(refDate, out var parsedDate))
        {
            referenceDate = parsedDate;
        }

        var res = await _cardService.MarkStatementPaidAsync(id, referenceDate, ct);
        if (!res) return NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy", Detail = $"Thẻ '{id}' không tồn tại." });
        return Ok(new { message = "Đã đánh dấu thanh toán sao kê thành công." });
    }
}
