using CreditCardManager.Application.Interfaces;
using CreditCardManager.Infrastructure.Data;
using CreditCardManager.Infrastructure.Identity;
using CreditCardManager.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CreditCardManager.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        string connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(connectionString, b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

        // Identity Configuration
        services.AddIdentity<ApplicationUser, IdentityRole>(options =>
        {
            // Password policy: min 10 chars, uppercase, lowercase, digit, non-alphanumeric
            options.Password.RequiredLength = 10;
            options.Password.RequireUppercase = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireDigit = true;
            options.Password.RequireNonAlphanumeric = true;

            // Lockout policy: 5 failed attempts -> 15 minutes lockout
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.AllowedForNewUsers = true;

            options.User.RequireUniqueEmail = false;
        })
        .AddEntityFrameworkStores<ApplicationDbContext>()
        .AddDefaultTokenProviders();

        // Cookie Authentication Configuration
        services.ConfigureApplicationCookie(options =>
        {
            options.Cookie.Name = ".CreditCardManager.Auth";
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Strict;
            options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.SlidingExpiration = true;
            options.ExpireTimeSpan = TimeSpan.FromHours(8);

            // Return 401/403 for API requests instead of redirecting to login page
            options.Events = new CookieAuthenticationEvents
            {
                OnRedirectToLogin = ctx =>
                {
                    ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                },
                OnRedirectToAccessDenied = ctx =>
                {
                    ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return Task.CompletedTask;
                }
            };
        });

        // Register Application Services
        services.AddScoped<ICardService, CardService>();
        services.AddScoped<IMccService, MccService>();
        services.AddScoped<ICashbackRuleService, CashbackRuleService>();
        services.AddScoped<ITransactionService, TransactionService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IMonthViewService, MonthViewService>();
        services.AddScoped<ISettingsService, SettingsService>();
        services.AddScoped<IExcelExportService, ExcelExportService>();

        return services;
    }
}
