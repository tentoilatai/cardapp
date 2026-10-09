using Microsoft.AspNetCore.Identity;

namespace CreditCardManager.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public bool MustChangePassword { get; set; } = false;
}
