using CreditCardManager.Application.DTOs;
using CreditCardManager.Application.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace CreditCardManager.Api.Controllers;

[ApiController]
[Route("api/rules")]
public class CashbackRulesController : ControllerBase
{
    private readonly ICashbackRuleService _ruleService;
    private readonly IValidator<CreateCashbackRuleDto> _createValidator;
    private readonly IValidator<UpdateCashbackRuleDto> _updateValidator;

    public CashbackRulesController(
        ICashbackRuleService ruleService,
        IValidator<CreateCashbackRuleDto> createValidator,
        IValidator<UpdateCashbackRuleDto> updateValidator)
    {
        _ruleService = ruleService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? cardId, CancellationToken ct)
    {
        var list = await _ruleService.GetAllAsync(cardId, ct);
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken ct)
    {
        var rule = await _ruleService.GetByIdAsync(id, ct);
        if (rule == null) return NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy", Detail = $"Rule '{id}' không tồn tại." });
        return Ok(rule);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCashbackRuleDto dto, CancellationToken ct)
    {
        var val = await _createValidator.ValidateAsync(dto, ct);
        if (!val.IsValid)
        {
            return BadRequest(new ProblemDetails { Status = 400, Title = "Dữ liệu không hợp lệ", Detail = val.Errors.First().ErrorMessage });
        }

        var created = await _ruleService.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPost("batch")]
    public async Task<IActionResult> BatchCreate([FromBody] BatchCreateCashbackRulesDto dto, CancellationToken ct)
    {
        if (dto.MccCodes == null || !dto.MccCodes.Any())
        {
            return BadRequest(new ProblemDetails { Status = 400, Title = "Dữ liệu không hợp lệ", Detail = "Danh sách mã MCC không được để trống." });
        }

        var created = await _ruleService.BatchCreateAsync(dto, ct);
        return Ok(created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateCashbackRuleDto dto, CancellationToken ct)
    {
        var val = await _updateValidator.ValidateAsync(dto, ct);
        if (!val.IsValid)
        {
            return BadRequest(new ProblemDetails { Status = 400, Title = "Dữ liệu không hợp lệ", Detail = val.Errors.First().ErrorMessage });
        }

        var updated = await _ruleService.UpdateAsync(id, dto, ct);
        if (updated == null) return NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy", Detail = $"Rule '{id}' không tồn tại." });
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        var deleted = await _ruleService.DeleteAsync(id, ct);
        if (!deleted) return NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy", Detail = $"Rule '{id}' không tồn tại." });
        return Ok(new { message = "Xóa cashback rule thành công." });
    }
}
