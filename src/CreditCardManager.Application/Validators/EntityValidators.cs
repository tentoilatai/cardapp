using CreditCardManager.Application.DTOs;
using FluentValidation;

namespace CreditCardManager.Application.Validators;

public class CreateCardValidator : AbstractValidator<CreateCardDto>
{
    public CreateCardValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Mã thẻ không được để trống.")
            .MaximumLength(50).WithMessage("Mã thẻ không vượt quá 50 ký tự.");

        RuleFor(x => x.Bank)
            .NotEmpty().WithMessage("Ngân hàng không được để trống.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên thẻ không được để trống.");

        RuleFor(x => x.Last4)
            .NotEmpty().WithMessage("4 số cuối không được để trống.")
            .Matches(@"^\d{4}$").WithMessage("4 số cuối phải gồm đúng 4 chữ số.");

        RuleFor(x => x.CreditLimit)
            .GreaterThanOrEqualTo(0).WithMessage("Hạn mức tín dụng phải lớn hơn hoặc bằng 0.");

        RuleFor(x => x.StatementDay)
            .InclusiveBetween(1, 31).WithMessage("Ngày sao kê phải từ 1 đến 31.");

        RuleFor(x => x.PaymentDueDay)
            .InclusiveBetween(1, 31).WithMessage("Ngày đến hạn thanh toán phải từ 1 đến 31.");
    }
}

public class UpdateCardValidator : AbstractValidator<UpdateCardDto>
{
    public UpdateCardValidator()
    {
        RuleFor(x => x.Bank)
            .NotEmpty().WithMessage("Ngân hàng không được để trống.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên thẻ không được để trống.");

        RuleFor(x => x.Last4)
            .NotEmpty().WithMessage("4 số cuối không được để trống.")
            .Matches(@"^\d{4}$").WithMessage("4 số cuối phải gồm đúng 4 chữ số.");

        RuleFor(x => x.CreditLimit)
            .GreaterThanOrEqualTo(0).WithMessage("Hạn mức tín dụng phải lớn hơn hoặc bằng 0.");

        RuleFor(x => x.StatementDay)
            .InclusiveBetween(1, 31).WithMessage("Ngày sao kê phải từ 1 đến 31.");

        RuleFor(x => x.PaymentDueDay)
            .InclusiveBetween(1, 31).WithMessage("Ngày đến hạn thanh toán phải từ 1 đến 31.");
    }
}

public class CreateMccValidator : AbstractValidator<CreateMccDto>
{
    public CreateMccValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã MCC không được để trống.")
            .Matches(@"^\d{4}$").WithMessage("Mã MCC phải gồm đúng 4 chữ số.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên MCC không được để trống.");

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("Danh mục MCC không được để trống.");
    }
}

public class UpdateMccValidator : AbstractValidator<UpdateMccDto>
{
    public UpdateMccValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên MCC không được để trống.");

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("Danh mục MCC không được để trống.");
    }
}

public class CreateCashbackRuleValidator : AbstractValidator<CreateCashbackRuleDto>
{
    public CreateCashbackRuleValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Mã Rule không được để trống.");

        RuleFor(x => x.CardId)
            .NotEmpty().WithMessage("Mã thẻ không được để trống.");

        RuleFor(x => x.GroupName)
            .NotEmpty().WithMessage("Tên nhóm cashback không được để trống.");

        RuleFor(x => x.CategoryName)
            .NotEmpty().WithMessage("Tên danh mục không được để trống.");

        RuleFor(x => x.MccCode)
            .NotEmpty().WithMessage("Mã MCC không được để trống.")
            .Matches(@"^\d{4}$").WithMessage("Mã MCC phải gồm đúng 4 chữ số.");

        RuleFor(x => x.Rate)
            .InclusiveBetween(0m, 1m).WithMessage("Tỷ lệ cashback phải từ 0% đến 100% (0.0 đến 1.0).");
    }
}

public class UpdateCashbackRuleValidator : AbstractValidator<UpdateCashbackRuleDto>
{
    public UpdateCashbackRuleValidator()
    {
        RuleFor(x => x.GroupName)
            .NotEmpty().WithMessage("Tên nhóm cashback không được để trống.");

        RuleFor(x => x.CategoryName)
            .NotEmpty().WithMessage("Tên danh mục không được để trống.");

        RuleFor(x => x.MccCode)
            .NotEmpty().WithMessage("Mã MCC không được để trống.")
            .Matches(@"^\d{4}$").WithMessage("Mã MCC phải gồm đúng 4 chữ số.");

        RuleFor(x => x.Rate)
            .InclusiveBetween(0m, 1m).WithMessage("Tỷ lệ cashback phải từ 0% đến 100% (0.0 đến 1.0).");
    }
}

public class CreateTransactionValidator : AbstractValidator<CreateTransactionDto>
{
    public CreateTransactionValidator()
    {
        RuleFor(x => x.CardId)
            .NotEmpty().WithMessage("Vui lòng chọn thẻ.");

        RuleFor(x => x.Merchant)
            .NotEmpty().WithMessage("Tên đơn vị chấp nhận thẻ không được để trống.");

        RuleFor(x => x.MccCode)
            .NotEmpty().WithMessage("Vui lòng chọn hoặc nhập mã MCC.")
            .Matches(@"^\d{4}$").WithMessage("Mã MCC phải gồm đúng 4 chữ số.");

        RuleFor(x => x.Amount)
            .GreaterThanOrEqualTo(0m).WithMessage("Số tiền giao dịch phải lớn hơn hoặc bằng 0.");
    }
}

public class UpdateTransactionValidator : AbstractValidator<UpdateTransactionDto>
{
    public UpdateTransactionValidator()
    {
        RuleFor(x => x.CardId)
            .NotEmpty().WithMessage("Vui lòng chọn thẻ.");

        RuleFor(x => x.Merchant)
            .NotEmpty().WithMessage("Tên đơn vị chấp nhận thẻ không được để trống.");

        RuleFor(x => x.MccCode)
            .NotEmpty().WithMessage("Vui lòng chọn hoặc nhập mã MCC.")
            .Matches(@"^\d{4}$").WithMessage("Mã MCC phải gồm đúng 4 chữ số.");

        RuleFor(x => x.Amount)
            .GreaterThanOrEqualTo(0m).WithMessage("Số tiền giao dịch phải lớn hơn hoặc bằng 0.");
    }
}
