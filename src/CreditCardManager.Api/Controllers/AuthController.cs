using CreditCardManager.Application.DTOs;
using CreditCardManager.Infrastructure.Identity;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CreditCardManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IValidator<LoginRequest> _loginValidator;
    private readonly IValidator<ChangePasswordRequest> _changePasswordValidator;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        SignInManager<ApplicationUser> signInManager,
        UserManager<ApplicationUser> userManager,
        IValidator<LoginRequest> loginValidator,
        IValidator<ChangePasswordRequest> changePasswordValidator,
        ILogger<AuthController> logger)
    {
        _signInManager = signInManager;
        _userManager = userManager;
        _loginValidator = loginValidator;
        _changePasswordValidator = changePasswordValidator;
        _logger = logger;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("LoginPolicy")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var valResult = await _loginValidator.ValidateAsync(req);
        if (!valResult.IsValid)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Dữ liệu không hợp lệ",
                Detail = valResult.Errors.First().ErrorMessage
            });
        }

        var user = await _userManager.FindByNameAsync(req.Username);
        if (user == null)
        {
            return Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Đăng nhập thất bại",
                Detail = "Tên đăng nhập hoặc mật khẩu không chính xác."
            });
        }

        var result = await _signInManager.PasswordSignInAsync(user, req.Password, isPersistent: true, lockoutOnFailure: true);

        if (result.IsLockedOut)
        {
            _logger.LogWarning("Tài khoản {Username} bị khóa do nhập sai mật khẩu quá 5 lần.", req.Username);
            return StatusCode(StatusCodes.Status423Locked, new ProblemDetails
            {
                Status = StatusCodes.Status423Locked,
                Title = "Tài khoản bị khóa",
                Detail = "Tài khoản đã bị tạm khóa 15 phút do nhập sai mật khẩu 5 lần."
            });
        }

        if (!result.Succeeded)
        {
            return Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Đăng nhập thất bại",
                Detail = "Tên đăng nhập hoặc mật khẩu không chính xác."
            });
        }

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new UserDto(user.UserName!, roles, user.MustChangePassword));
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok(new { message = "Đăng xuất thành công." });
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Chưa đăng nhập",
                Detail = "Phiên đăng nhập đã hết hạn."
            });
        }

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new UserDto(user.UserName!, roles, user.MustChangePassword));
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        var valResult = await _changePasswordValidator.ValidateAsync(req);
        if (!valResult.IsValid)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Dữ liệu mật khẩu không hợp lệ",
                Detail = valResult.Errors.First().ErrorMessage
            });
        }

        var user = await _userManager.GetUserAsync(User);
        if (user == null)
        {
            return Unauthorized();
        }

        var result = await _userManager.ChangePasswordAsync(user, req.CurrentPassword, req.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Đổi mật khẩu thất bại",
                Detail = result.Errors.First().Description
            });
        }

        if (user.MustChangePassword)
        {
            user.MustChangePassword = false;
            await _userManager.UpdateAsync(user);
        }

        // Refresh sign-in cookie with new security stamp
        await _signInManager.RefreshSignInAsync(user);

        return Ok(new { message = "Đổi mật khẩu thành công." });
    }
}
