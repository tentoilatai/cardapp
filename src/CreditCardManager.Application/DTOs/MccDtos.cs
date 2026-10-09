namespace CreditCardManager.Application.DTOs;

public record MccDto(
    string Code,
    string Name,
    string Category,
    string? Subcategory,
    string? Description
);

public record CreateMccDto(
    string Code,
    string Name,
    string Category,
    string? Subcategory,
    string? Description
);

public record UpdateMccDto(
    string Name,
    string Category,
    string? Subcategory,
    string? Description
);
