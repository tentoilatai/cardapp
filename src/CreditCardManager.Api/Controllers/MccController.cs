using CreditCardManager.Application.DTOs;
using CreditCardManager.Application.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace CreditCardManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MccController : ControllerBase
{
    private readonly IMccService _mccService;
    private readonly IValidator<CreateMccDto> _createValidator;
    private readonly IValidator<UpdateMccDto> _updateValidator;

    public MccController(
        IMccService mccService,
        IValidator<CreateMccDto> createValidator,
        IValidator<UpdateMccDto> updateValidator)
    {
        _mccService = mccService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? category, CancellationToken ct)
    {
        var list = await _mccService.GetAllAsync(search, category, ct);
        return Ok(list);
    }

    [HttpGet("{code}")]
    public async Task<IActionResult> GetByCode(string code, CancellationToken ct)
    {
        var mcc = await _mccService.GetByCodeAsync(code, ct);
        if (mcc == null) return NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy", Detail = $"Mã MCC '{code}' không tồn tại." });
        return Ok(mcc);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMccDto dto, CancellationToken ct)
    {
        var val = await _createValidator.ValidateAsync(dto, ct);
        if (!val.IsValid)
        {
            return BadRequest(new ProblemDetails { Status = 400, Title = "Dữ liệu không hợp lệ", Detail = val.Errors.First().ErrorMessage });
        }

        var created = await _mccService.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetByCode), new { code = created.Code }, created);
    }

    [HttpPut("{code}")]
    public async Task<IActionResult> Update(string code, [FromBody] UpdateMccDto dto, CancellationToken ct)
    {
        var val = await _updateValidator.ValidateAsync(dto, ct);
        if (!val.IsValid)
        {
            return BadRequest(new ProblemDetails { Status = 400, Title = "Dữ liệu không hợp lệ", Detail = val.Errors.First().ErrorMessage });
        }

        var updated = await _mccService.UpdateAsync(code, dto, ct);
        if (updated == null) return NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy", Detail = $"Mã MCC '{code}' không tồn tại." });
        return Ok(updated);
    }

    [HttpDelete("{code}")]
    public async Task<IActionResult> Delete(string code, CancellationToken ct)
    {
        var deleted = await _mccService.DeleteAsync(code, ct);
        if (!deleted) return NotFound(new ProblemDetails { Status = 404, Title = "Không tìm thấy", Detail = $"Mã MCC '{code}' không tồn tại." });
        return Ok(new { message = "Xóa MCC thành công." });
    }
}
