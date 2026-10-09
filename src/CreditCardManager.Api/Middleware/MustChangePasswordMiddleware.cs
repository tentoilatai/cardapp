using System.Text.Json;
using CreditCardManager.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace CreditCardManager.Api.Middleware;

public class MustChangePasswordMiddleware
{
    private readonly RequestDelegate _next;

    public MustChangePasswordMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, UserManager<ApplicationUser> userManager)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";

            // Endpoints allowed during forced password change
            bool isAllowed = path.EndsWith("/api/auth/change-password") ||
                             path.EndsWith("/api/auth/logout") ||
                             path.EndsWith("/api/auth/me") ||
                             !path.StartsWith("/api");

            if (!isAllowed)
            {
                var user = await userManager.GetUserAsync(context.User);
                if (user != null && user.MustChangePassword)
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.ContentType = "application/problem+json";

                    var problem = new ProblemDetails
                    {
                        Status = StatusCodes.Status403Forbidden,
                        Title = "Yêu cầu đổi mật khẩu",
                        Detail = "Vui lòng đổi mật khẩu trước khi tiếp tục sử dụng hệ thống.",
                        Instance = context.Request.Path
                    };

                    await context.Response.WriteAsync(JsonSerializer.Serialize(problem));
                    return;
                }
            }
        }

        await _next(context);
    }
}
