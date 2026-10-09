using CreditCardManager.Domain.Entities;
using CreditCardManager.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CreditCardManager.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Card> Cards => Set<Card>();
    public DbSet<Mcc> Mccs => Set<Mcc>();
    public DbSet<CashbackRule> CashbackRules => Set<CashbackRule>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<AppSettings> Settings => Set<AppSettings>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Card configuration
        builder.Entity<Card>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(50);
            entity.Property(e => e.Bank).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(150).IsRequired();
            entity.Property(e => e.CardType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Network).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Last4).HasMaxLength(4).IsRequired();
            entity.Property(e => e.CreditLimit).HasPrecision(18, 0);
            entity.Property(e => e.AnnualFee).HasPrecision(18, 0);
            entity.Property(e => e.FirstYearFee).HasPrecision(18, 0);
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Note).HasMaxLength(500);

            entity.HasMany(e => e.CashbackRules)
                .WithOne(e => e.Card)
                .HasForeignKey(e => e.CardId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Transactions)
                .WithOne(e => e.Card)
                .HasForeignKey(e => e.CardId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Mcc configuration
        builder.Entity<Mcc>(entity =>
        {
            entity.HasKey(e => e.Code);
            entity.Property(e => e.Code).HasMaxLength(10);
            entity.Property(e => e.Name).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Category).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Subcategory).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);

            entity.HasMany(e => e.CashbackRules)
                .WithOne(e => e.Mcc)
                .HasForeignKey(e => e.MccCode)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.Transactions)
                .WithOne(e => e.Mcc)
                .HasForeignKey(e => e.MccCode)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // CashbackRule configuration
        builder.Entity<CashbackRule>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(50);
            entity.Property(e => e.CardId).HasMaxLength(50).IsRequired();
            entity.Property(e => e.GroupName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.CategoryName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.MccCode).HasMaxLength(10).IsRequired();
            entity.Property(e => e.Rate).HasPrecision(9, 6);
            entity.Property(e => e.MaxCashbackPerGroupPerMonth).HasPrecision(18, 0);
            entity.Property(e => e.MaxCashbackPerCardPerMonth).HasPrecision(18, 0);
            entity.Property(e => e.MaxEligibleSpending).HasPrecision(18, 0);
            entity.Property(e => e.MinTransaction).HasPrecision(18, 0);
            entity.Property(e => e.Condition).HasMaxLength(500);
            entity.Property(e => e.Note).HasMaxLength(500);

            entity.HasIndex(e => new { e.CardId, e.MccCode });
        });

        // Transaction configuration
        builder.Entity<Transaction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(50);
            entity.Property(e => e.CardId).HasMaxLength(50).IsRequired();
            entity.Property(e => e.MccCode).HasMaxLength(10).IsRequired();
            entity.Property(e => e.Merchant).HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Amount).HasPrecision(18, 0);
            entity.Property(e => e.EligibleAmount).HasPrecision(18, 0);
            entity.Property(e => e.Rate).HasPrecision(9, 6);
            entity.Property(e => e.TheoreticalCashback).HasPrecision(18, 0);
            entity.Property(e => e.ActualCashback).HasPrecision(18, 0);
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
            entity.Property(e => e.PaymentStatus).HasMaxLength(50).IsRequired();
            entity.Property(e => e.CashbackStatus).HasMaxLength(50).IsRequired();
            entity.Property(e => e.GroupName).HasMaxLength(100);
            entity.Property(e => e.MatchedRuleId).HasMaxLength(50);
            entity.Property(e => e.OverrideRuleId).HasMaxLength(50);
            entity.Property(e => e.Note).HasMaxLength(500);

            // Foreign keys
            entity.HasOne(e => e.MatchedRule)
                .WithMany()
                .HasForeignKey(e => e.MatchedRuleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.OverrideRule)
                .WithMany()
                .HasForeignKey(e => e.OverrideRuleId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes required by Section 3
            entity.HasIndex(e => new { e.CardId, e.Date });
            entity.HasIndex(e => e.MccCode);
            entity.HasIndex(e => e.MonthKey);
        });

        // AppSettings configuration
        builder.Entity<AppSettings>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UtilizationMildThreshold).HasPrecision(5, 4);
            entity.Property(e => e.UtilizationWarningThreshold).HasPrecision(5, 4);
            entity.Property(e => e.UtilizationDangerThreshold).HasPrecision(5, 4);
            entity.Property(e => e.NearCapThreshold).HasPrecision(5, 4);
        });
    }
}
