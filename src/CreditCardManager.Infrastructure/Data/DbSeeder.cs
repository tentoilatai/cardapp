using System.Text.Json;
using CreditCardManager.Domain.Entities;
using CreditCardManager.Domain.Services;
using CreditCardManager.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CreditCardManager.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration,
        ILogger logger)
    {
        // 1. Migrate DB
        await context.Database.MigrateAsync();

        // 2. Seed Admin Role and User
        const string adminRole = "Admin";
        if (!await roleManager.RoleExistsAsync(adminRole))
        {
            await roleManager.CreateAsync(new IdentityRole(adminRole));
        }

        const string adminUsername = "taitv";
        var existingUser = await userManager.FindByNameAsync(adminUsername);
        if (existingUser == null)
        {
            string adminPassword = configuration["Seed:AdminPassword"] ?? "Tai@28012004";
            var user = new ApplicationUser
            {
                UserName = adminUsername,
                Email = "taitv@creditcardmanager.local",
                EmailConfirmed = true,
                MustChangePassword = true
            };

            var result = await userManager.CreateAsync(user, adminPassword);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user, adminRole);
                logger.LogInformation("Admin user {Username} seeded successfully.", adminUsername);
            }
            else
            {
                logger.LogError("Failed to seed admin user: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }

        // 3. Seed Default AppSettings
        if (!await context.Settings.AnyAsync())
        {
            context.Settings.Add(new AppSettings());
            await context.SaveChangesAsync();
            logger.LogInformation("Default AppSettings seeded.");
        }

        // 4. Seed Domain Sample Data if Cards are empty
        if (!await context.Cards.AnyAsync())
        {
            string seedFilePath = Path.Combine(AppContext.BaseDirectory, "seed_data.json");
            if (!File.Exists(seedFilePath))
            {
                // Try workspace relative path
                seedFilePath = Path.Combine(Directory.GetCurrentDirectory(), "seed_data.json");
            }
            if (!File.Exists(seedFilePath))
            {
                seedFilePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "seed_data.json");
            }

            if (File.Exists(seedFilePath))
            {
                logger.LogInformation("Reading seed data from {Path}...", seedFilePath);
                string json = await File.ReadAllTextAsync(seedFilePath);
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                // Seed MCCs
                if (root.TryGetProperty("mccs", out var mccsElem))
                {
                    var mccs = new List<Mcc>();
                    foreach (var elem in mccsElem.EnumerateArray())
                    {
                        mccs.Add(new Mcc
                        {
                            Code = elem.GetProperty("code").GetString()!,
                            Name = elem.GetProperty("name").GetString() ?? "",
                            Category = elem.GetProperty("category").GetString() ?? "",
                            Subcategory = elem.GetProperty("subcategory").GetString(),
                            Description = elem.GetProperty("description").GetString()
                        });
                    }
                    await context.Mccs.AddRangeAsync(mccs);
                    await context.SaveChangesAsync();
                    logger.LogInformation("Seeded {Count} MCCs.", mccs.Count);
                }

                // Seed Cards
                var cardsList = new List<Card>();
                if (root.TryGetProperty("cards", out var cardsElem))
                {
                    foreach (var elem in cardsElem.EnumerateArray())
                    {
                        var card = new Card
                        {
                            Id = elem.GetProperty("id").GetString()!,
                            Bank = elem.GetProperty("bank").GetString() ?? "",
                            Name = elem.GetProperty("name").GetString() ?? "",
                            CardType = elem.GetProperty("cardType").GetString() ?? "Credit",
                            Network = elem.GetProperty("network").GetString() ?? "Visa",
                            Last4 = elem.GetProperty("last4").GetString() ?? "",
                            CreditLimit = elem.GetProperty("creditLimit").GetDecimal(),
                            StatementDay = elem.GetProperty("statementDay").GetInt32(),
                            PaymentDueDay = elem.GetProperty("paymentDueDay").GetInt32(),
                            OpenDate = DateOnly.Parse(elem.GetProperty("openDate").GetString()!),
                            AnnualFee = elem.GetProperty("annualFee").GetDecimal(),
                            FirstYearFee = elem.GetProperty("firstYearFee").GetDecimal(),
                            Status = elem.GetProperty("status").GetString() ?? "Active",
                            Note = elem.GetProperty("note").GetString()
                        };
                        cardsList.Add(card);
                    }
                    await context.Cards.AddRangeAsync(cardsList);
                    await context.SaveChangesAsync();
                    logger.LogInformation("Seeded {Count} Cards.", cardsList.Count);
                }

                // Seed Cashback Rules
                var rulesList = new List<CashbackRule>();
                if (root.TryGetProperty("rules", out var rulesElem))
                {
                    foreach (var elem in rulesElem.EnumerateArray())
                    {
                        var rule = new CashbackRule
                        {
                            Id = elem.GetProperty("id").GetString()!,
                            CardId = elem.GetProperty("cardId").GetString()!,
                            GroupName = elem.GetProperty("groupName").GetString() ?? "",
                            CategoryName = elem.GetProperty("categoryName").GetString() ?? "",
                            MccCode = elem.GetProperty("mccCode").GetString()!,
                            Rate = elem.GetProperty("rate").GetDecimal(),
                            MaxCashbackPerGroupPerMonth = elem.TryGetProperty("maxCashbackPerGroupPerMonth", out var mg) && mg.ValueKind == JsonValueKind.Number ? mg.GetDecimal() : null,
                            MaxCashbackPerCardPerMonth = elem.TryGetProperty("maxCashbackPerCardPerMonth", out var mc) && mc.ValueKind == JsonValueKind.Number ? mc.GetDecimal() : null,
                            MaxEligibleSpending = elem.TryGetProperty("maxEligibleSpending", out var me) && me.ValueKind == JsonValueKind.Number ? me.GetDecimal() : null,
                            MinTransaction = elem.TryGetProperty("minTransaction", out var mt) && mt.ValueKind == JsonValueKind.Number ? mt.GetDecimal() : null,
                            StartDate = elem.TryGetProperty("startDate", out var sd) && sd.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(sd.GetString()) ? DateOnly.Parse(sd.GetString()!) : null,
                            EndDate = elem.TryGetProperty("endDate", out var ed) && ed.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(ed.GetString()) ? DateOnly.Parse(ed.GetString()!) : null,
                            Condition = elem.GetProperty("condition").GetString(),
                            Note = elem.GetProperty("note").GetString()
                        };
                        rulesList.Add(rule);
                    }
                    await context.CashbackRules.AddRangeAsync(rulesList);
                    await context.SaveChangesAsync();
                    logger.LogInformation("Seeded {Count} Cashback Rules.", rulesList.Count);
                }

                // Seed Transactions
                var txsList = new List<Transaction>();
                if (root.TryGetProperty("transactions", out var txsElem))
                {
                    var cardDict = cardsList.ToDictionary(c => c.Id, StringComparer.OrdinalIgnoreCase);

                    foreach (var elem in txsElem.EnumerateArray())
                    {
                        var date = DateOnly.Parse(elem.GetProperty("date").GetString()!);
                        int monthKey = (date.Year * 100) + date.Month;
                        string cardId = elem.GetProperty("cardId").GetString()!;
                        string? overrideRuleId = elem.TryGetProperty("overrideRuleId", out var orId) && orId.ValueKind == JsonValueKind.String ? orId.GetString() : null;

                        var tx = new Transaction
                        {
                            Id = elem.GetProperty("id").GetString()!,
                            Date = date,
                            MonthKey = monthKey,
                            CardId = cardId,
                            Merchant = elem.GetProperty("merchant").GetString() ?? "",
                            Description = elem.GetProperty("description").GetString(),
                            MccCode = elem.GetProperty("mccCode").GetString()!,
                            Amount = elem.GetProperty("amount").GetDecimal(),
                            Status = elem.GetProperty("status").GetString() ?? "Posted",
                            PaymentStatus = elem.GetProperty("paymentStatus").GetString() ?? "Chưa thanh toán",
                            OverrideRuleId = overrideRuleId,
                            Note = elem.GetProperty("note").GetString()
                        };
                        txsList.Add(tx);
                    }

                    // Recalculate all transactions grouped by (CardId, MonthKey)
                    var groupedTxs = txsList.GroupBy(t => new { t.CardId, t.MonthKey });
                    foreach (var group in groupedTxs)
                    {
                        var card = cardDict.GetValueOrDefault(group.Key.CardId);
                        var cardRules = rulesList.Where(r => string.Equals(r.CardId, group.Key.CardId, StringComparison.OrdinalIgnoreCase)).ToList();
                        CashbackCalculator.CalculateMonthlyTransactions(group, cardRules, card);
                    }

                    await context.Transactions.AddRangeAsync(txsList);
                    await context.SaveChangesAsync();
                    logger.LogInformation("Seeded {Count} Transactions with full cashback calculations.", txsList.Count);
                }
            }
        }
    }
}
