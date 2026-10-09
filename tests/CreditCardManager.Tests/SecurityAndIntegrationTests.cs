using CreditCardManager.Application.DTOs;
using CreditCardManager.Application.Interfaces;
using CreditCardManager.Application.Validators;
using CreditCardManager.Domain.Entities;
using CreditCardManager.Infrastructure.Data;
using CreditCardManager.Infrastructure.Identity;
using CreditCardManager.Infrastructure.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Time.Testing;
using Xunit;

namespace CreditCardManager.Tests;

public class SecurityAndIntegrationTests
{
    private static (ApplicationDbContext context, IServiceProvider sp) CreateTestServices()
    {
        var services = new ServiceCollection();
        string dbName = Guid.NewGuid().ToString();

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase(dbName));

        services.AddIdentity<ApplicationUser, IdentityRole>(options =>
        {
            options.Password.RequiredLength = 10;
            options.Password.RequireUppercase = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireDigit = true;
            options.Password.RequireNonAlphanumeric = true;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.AllowedForNewUsers = true;
        })
        .AddEntityFrameworkStores<ApplicationDbContext>()
        .AddDefaultTokenProviders();

        var fakeTime = new FakeTimeProvider(new DateTimeOffset(2026, 10, 7, 8, 0, 0, TimeSpan.FromHours(7)));
        services.AddSingleton<TimeProvider>(fakeTime);

        services.AddLogging();
        services.AddScoped<ICardService, CardService>();
        services.AddScoped<IMccService, MccService>();
        services.AddScoped<ICashbackRuleService, CashbackRuleService>();
        services.AddScoped<ITransactionService, TransactionService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IMonthViewService, MonthViewService>();
        services.AddScoped<ISettingsService, SettingsService>();
        services.AddScoped<IExcelExportService, ExcelExportService>();

        var sp = services.BuildServiceProvider();
        var context = sp.GetRequiredService<ApplicationDbContext>();
        context.Database.EnsureCreatedAsync().Wait();

        return (context, sp);
    }

    [Fact]
    public void ChangePassword_Validator_Enforces_Strong_Password_Policy()
    {
        var validator = new ChangePasswordRequestValidator();

        // Weak: too short
        var weakShort = new ChangePasswordRequest("OldPass@123", "Short1!", "Short1!");
        validator.Validate(weakShort).IsValid.Should().BeFalse();

        // Weak: no uppercase
        var weakNoUpper = new ChangePasswordRequest("OldPass@123", "lowercase123!", "lowercase123!");
        validator.Validate(weakNoUpper).IsValid.Should().BeFalse();

        // Weak: no digit
        var weakNoDigit = new ChangePasswordRequest("OldPass@123", "NoDigitHere!@", "NoDigitHere!@");
        validator.Validate(weakNoDigit).IsValid.Should().BeFalse();

        // Weak: no special character
        var weakNoSpecial = new ChangePasswordRequest("OldPass@123", "NoSpecialChar123", "NoSpecialChar123");
        validator.Validate(weakNoSpecial).IsValid.Should().BeFalse();

        // Strong & valid
        var strong = new ChangePasswordRequest("OldPass@123", "NewStrong@2026Password", "NewStrong@2026Password");
        validator.Validate(strong).IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Identity_User_Lockout_After_5_Failed_Attempts()
    {
        var (context, sp) = CreateTestServices();
        var userManager = sp.GetRequiredService<UserManager<ApplicationUser>>();

        var user = new ApplicationUser
        {
            UserName = "lockout_test",
            Email = "lockout@test.com",
            LockoutEnabled = true
        };
        var createResult = await userManager.CreateAsync(user, "StrongPass@2026!");
        createResult.Succeeded.Should().BeTrue();

        // Simulate 5 failed access attempts
        for (int i = 0; i < 5; i++)
        {
            await userManager.AccessFailedAsync(user);
        }

        bool isLockedOut = await userManager.IsLockedOutAsync(user);
        isLockedOut.Should().BeTrue();
    }

    [Fact]
    public async Task MustChangePassword_Workflow_Works_Correctly()
    {
        var (context, sp) = CreateTestServices();
        var userManager = sp.GetRequiredService<UserManager<ApplicationUser>>();

        var user = new ApplicationUser
        {
            UserName = "first_login_user",
            Email = "first@test.com",
            MustChangePassword = true
        };
        await userManager.CreateAsync(user, "Initial@2026Pass");

        user.MustChangePassword.Should().BeTrue();

        // Change password
        var changeResult = await userManager.ChangePasswordAsync(user, "Initial@2026Pass", "BrandNew@2026Secure!");
        changeResult.Succeeded.Should().BeTrue();

        user.MustChangePassword = false;
        await userManager.UpdateAsync(user);

        var updatedUser = await userManager.FindByNameAsync("first_login_user");
        updatedUser!.MustChangePassword.Should().BeFalse();
    }

    [Fact]
    public async Task EndToEnd_IntegrationFlow_Transaction_Recalculation_Dashboard_And_MonthView()
    {
        var (context, sp) = CreateTestServices();
        var cardService = sp.GetRequiredService<ICardService>();
        var mccService = sp.GetRequiredService<IMccService>();
        var ruleService = sp.GetRequiredService<ICashbackRuleService>();
        var txService = sp.GetRequiredService<ITransactionService>();
        var dashService = sp.GetRequiredService<IDashboardService>();
        var monthService = sp.GetRequiredService<IMonthViewService>();

        // 1. Create Card
        var cardDto = await cardService.CreateAsync(new CreateCardDto(
            Id: "VPB-TEST",
            Bank: "VPBank",
            Name: "JCB Z Card",
            CardType: "Credit",
            Network: "JCB",
            Last4: "8888",
            CreditLimit: 50_000_000m,
            StatementDay: 25,
            PaymentDueDay: 15,
            OpenDate: new DateOnly(2026, 1, 1),
            AnnualFee: 499_000m,
            FirstYearFee: 0m,
            Status: "Active",
            Note: "Integration test card"
        ));
        cardDto.Id.Should().Be("VPB-TEST");

        // 2. Create MCCs
        await mccService.CreateAsync(new CreateMccDto("5812", "Eating Places", "Dining", null, null));
        await mccService.CreateAsync(new CreateMccDto("7997", "Fitness Clubs", "Fitness & Wellness", null, null));

        // 3. Create Cashback Rules
        // Rule 1: Group 1 (Dining, 15%, Group Cap 500K, Card Cap 1M)
        await ruleService.CreateAsync(new CreateCashbackRuleDto(
            Id: "R001",
            CardId: "VPB-TEST",
            GroupName: "Group 1",
            CategoryName: "Dining",
            MccCode: "5812",
            Rate: 0.15m,
            MaxCashbackPerGroupPerMonth: 500_000m,
            MaxCashbackPerCardPerMonth: 1_000_000m,
            MaxEligibleSpending: null,
            MinTransaction: null,
            StartDate: new DateOnly(2026, 1, 1),
            EndDate: new DateOnly(2026, 12, 31),
            Condition: "Ăn uống",
            Note: null
        ));

        // Rule 2: Group 2 (Fitness, 15%, Group Cap 500K, Card Cap 1M)
        await ruleService.CreateAsync(new CreateCashbackRuleDto(
            Id: "R002",
            CardId: "VPB-TEST",
            GroupName: "Group 2",
            CategoryName: "Fitness & Wellness",
            MccCode: "7997",
            Rate: 0.15m,
            MaxCashbackPerGroupPerMonth: 500_000m,
            MaxCashbackPerCardPerMonth: 1_000_000m,
            MaxEligibleSpending: null,
            MinTransaction: null,
            StartDate: new DateOnly(2026, 1, 1),
            EndDate: new DateOnly(2026, 12, 31),
            Condition: "Tập luyện",
            Note: null
        ));

        // 4. Create Transaction 1: 10M at 7997 (Theoretical 1.5M, but Group Cap is 500K)
        var tx1 = await txService.CreateAsync(new CreateTransactionDto(
            Id: "TX0001",
            Date: new DateOnly(2026, 10, 1),
            CardId: "VPB-TEST",
            Merchant: "California Fitness",
            Description: "Gym package",
            MccCode: "7997",
            Amount: 10_000_000m,
            Status: "Posted",
            PaymentStatus: "Chưa thanh toán",
            OverrideRuleId: null,
            Note: null
        ));

        tx1.TheoreticalCashback.Should().Be(1_500_000m);
        tx1.ActualCashback.Should().Be(500_000m);
        tx1.CashbackStatus.Should().Be("Hoàn một phần");

        // 5. Create Transaction 2: 4M at 5812 in Group 1 (Theoretical 600K, Group cap 500K, Card cap remaining 500K -> Actual 500K)
        var tx2 = await txService.CreateAsync(new CreateTransactionDto(
            Id: "TX0002",
            Date: new DateOnly(2026, 10, 2),
            CardId: "VPB-TEST",
            Merchant: "Sen Tay Ho",
            Description: "Buffet",
            MccCode: "5812",
            Amount: 4_000_000m,
            Status: "Posted",
            PaymentStatus: "Chưa thanh toán",
            OverrideRuleId: null,
            Note: null
        ));

        tx2.TheoreticalCashback.Should().Be(600_000m);
        tx2.ActualCashback.Should().Be(500_000m); // Card reached total 1M cap!
        tx2.CashbackStatus.Should().Be("Hoàn một phần");

        // 6. Create Transaction 3: 1M at 5812 in Group 1 (Card has reached 1M cap -> Actual 0, "Đã đạt cap")
        var tx3 = await txService.CreateAsync(new CreateTransactionDto(
            Id: "TX0003",
            Date: new DateOnly(2026, 10, 3),
            CardId: "VPB-TEST",
            Merchant: "Pizza 4Ps",
            Description: "Lunch",
            MccCode: "5812",
            Amount: 1_000_000m,
            Status: "Posted",
            PaymentStatus: "Chưa thanh toán",
            OverrideRuleId: null,
            Note: null
        ));

        tx3.TheoreticalCashback.Should().Be(150_000m);
        tx3.ActualCashback.Should().Be(0m);
        tx3.CashbackStatus.Should().Be("Đã đạt cap");

        // 7. Verify Dashboard KPIs and Charts for 202610
        var dashboard = await dashService.GetDashboardAsync(202610, new DateOnly(2026, 10, 7));
        dashboard.Kpis.TotalCards.Should().Be(1);
        dashboard.Kpis.MonthTotalSpending.Should().Be(15_000_000m);
        dashboard.Kpis.MonthActualCashback.Should().Be(1_000_000m);
        dashboard.Kpis.CardsNearCapCount.Should().Be(1); // 100% cap reached >= 80%

        // 8. Verify Month View for 202610
        var monthView = await monthService.GetMonthViewAsync(202610);
        monthView.Summary.TotalSpending.Should().Be(15_000_000m);
        monthView.Summary.TotalActualCashback.Should().Be(1_000_000m);
        monthView.Summary.TransactionCount.Should().Be(3);
        monthView.GroupCapProgressList.Should().HaveCount(2);

        // 9. Mark statement paid and verify card status
        await cardService.MarkStatementPaidAsync("VPB-TEST", new DateOnly(2026, 10, 25));
        var cardStatus = await cardService.GetCardStatusAsync("VPB-TEST", new DateOnly(2026, 10, 25));
        cardStatus!.UsedCredit.Should().Be(0m);
        cardStatus.PaymentStatus.Should().Be("Đã thanh toán");
    }
}
