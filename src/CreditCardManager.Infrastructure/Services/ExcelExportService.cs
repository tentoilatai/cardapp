using ClosedXML.Excel;
using CreditCardManager.Application.Interfaces;
using CreditCardManager.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CreditCardManager.Infrastructure.Services;

public class ExcelExportService : IExcelExportService
{
    private readonly ApplicationDbContext _context;

    public ExcelExportService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<byte[]> ExportTransactionsExcelAsync(int? monthKey = null, string? cardId = null, CancellationToken ct = default)
    {
        using var workbook = new XLWorkbook();

        // 1. Transactions Sheet
        var txSheet = workbook.Worksheets.Add("Giao dịch");
        var txQuery = _context.Transactions
            .Include(t => t.Card)
            .Include(t => t.Mcc)
            .AsNoTracking()
            .AsQueryable();

        if (monthKey.HasValue)
        {
            txQuery = txQuery.Where(t => t.MonthKey == monthKey.Value);
        }
        if (!string.IsNullOrWhiteSpace(cardId))
        {
            txQuery = txQuery.Where(t => t.CardId == cardId);
        }

        var txs = await txQuery
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.Id)
            .ToListAsync(ct);

        // Header
        string[] headers = [
            "Mã GD", "Ngày GD", "Tháng", "Mã thẻ", "Ngân hàng", "Tên thẻ",
            "Đơn vị chấp nhận", "Mô tả", "MCC", "Tên MCC", "Danh mục",
            "Số tiền", "Chi tiêu Eligible", "Tỷ lệ hoàn", "Cashback lý thuyết",
            "Cashback thực nhận", "Nhóm Cashback", "Trạng thái hoàn",
            "Trạng thái GD", "Trạng thái TT", "Ngày sao kê", "Hạn thanh toán", "Ghi chú"
        ];

        for (int i = 0; i < headers.Length; i++)
        {
            var cell = txSheet.Cell(1, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#E27AA1");
            cell.Style.Font.FontColor = XLColor.White;
        }

        int row = 2;
        foreach (var t in txs)
        {
            txSheet.Cell(row, 1).Value = t.Id;
            txSheet.Cell(row, 2).Value = t.Date.ToString("dd/MM/yyyy");
            txSheet.Cell(row, 3).Value = t.MonthKey;
            txSheet.Cell(row, 4).Value = t.CardId;
            txSheet.Cell(row, 5).Value = t.Card?.Bank ?? "";
            txSheet.Cell(row, 6).Value = t.Card?.Name ?? "";
            txSheet.Cell(row, 7).Value = t.Merchant;
            txSheet.Cell(row, 8).Value = t.Description ?? "";
            txSheet.Cell(row, 9).Value = t.MccCode;
            txSheet.Cell(row, 10).Value = t.Mcc?.Name ?? "";
            txSheet.Cell(row, 11).Value = t.Mcc?.Category ?? "";
            txSheet.Cell(row, 12).Value = t.Amount;
            txSheet.Cell(row, 13).Value = t.EligibleAmount;
            txSheet.Cell(row, 14).Value = t.Rate;
            txSheet.Cell(row, 15).Value = t.TheoreticalCashback;
            txSheet.Cell(row, 16).Value = t.ActualCashback;
            txSheet.Cell(row, 17).Value = t.GroupName ?? "";
            txSheet.Cell(row, 18).Value = t.CashbackStatus;
            txSheet.Cell(row, 19).Value = t.Status;
            txSheet.Cell(row, 20).Value = t.PaymentStatus;
            txSheet.Cell(row, 21).Value = t.StatementDate.ToString("dd/MM/yyyy");
            txSheet.Cell(row, 22).Value = t.PaymentDueDate.ToString("dd/MM/yyyy");
            txSheet.Cell(row, 23).Value = t.Note ?? "";
            row++;
        }

        txSheet.Columns().AdjustToContents();

        // 2. Cards Sheet
        var cardSheet = workbook.Worksheets.Add("Thẻ tín dụng");
        var cards = await _context.Cards.AsNoTracking().OrderBy(c => c.Bank).ToListAsync(ct);
        string[] cardHeaders = [
            "Mã thẻ", "Ngân hàng", "Tên thẻ", "Loại thẻ", "Network",
            "4 số cuối", "Hạn mức", "Ngày sao kê", "Hạn thanh toán",
            "Ngày mở", "Phí thường niên", "Trạng thái", "Ghi chú"
        ];

        for (int i = 0; i < cardHeaders.Length; i++)
        {
            var cell = cardSheet.Cell(1, i + 1);
            cell.Value = cardHeaders[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#4A3540");
            cell.Style.Font.FontColor = XLColor.White;
        }

        int cRow = 2;
        foreach (var c in cards)
        {
            cardSheet.Cell(cRow, 1).Value = c.Id;
            cardSheet.Cell(cRow, 2).Value = c.Bank;
            cardSheet.Cell(cRow, 3).Value = c.Name;
            cardSheet.Cell(cRow, 4).Value = c.CardType;
            cardSheet.Cell(cRow, 5).Value = c.Network;
            cardSheet.Cell(cRow, 6).Value = c.Last4;
            cardSheet.Cell(cRow, 7).Value = c.CreditLimit;
            cardSheet.Cell(cRow, 8).Value = c.StatementDay;
            cardSheet.Cell(cRow, 9).Value = c.PaymentDueDay;
            cardSheet.Cell(cRow, 10).Value = c.OpenDate.ToString("dd/MM/yyyy");
            cardSheet.Cell(cRow, 11).Value = c.AnnualFee;
            cardSheet.Cell(cRow, 12).Value = c.Status;
            cardSheet.Cell(cRow, 13).Value = c.Note ?? "";
            cRow++;
        }

        cardSheet.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }
}
