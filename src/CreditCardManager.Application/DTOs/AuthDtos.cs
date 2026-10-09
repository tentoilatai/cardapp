namespace CreditCardManager.Application.DTOs;

public record LoginRequest(string Username, string Password);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword, string ConfirmPassword);

public record UserDto(string Username, IList<string> Roles, bool MustChangePassword);
