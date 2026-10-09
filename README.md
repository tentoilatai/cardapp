# Credit Card Manager (Quản Lý Thẻ Tín Dụng & Tính Hoàn Tiền Cashback)

Hệ thống quản lý nhiều thẻ tín dụng và tự động tính toán hoàn tiền (Cashback) theo mã danh mục ngành hàng (MCC) với giao diện người dùng phong cách **Apple Liquid Glass (Kính lỏng)** mượt mà, hỗ trợ xác thực danh tính bảo mật cao, tự động đồng bộ và tối ưu hóa chi tiêu theo từng kỳ sao kê.

---

## 1. Công nghệ sử dụng (Tech Stack)

### Backend
- **Framework & Runtime**: .NET 10 (LTS), C# 14, ASP.NET Core Web API.
- **Database & ORM**: SQL Server, Entity Framework Core 10 (Code-First + Auto-migrations & Seeding).
- **Authentication & Security**: ASP.NET Core Identity với Cookie Authentication (`HttpOnly`, `SameSite=Strict`, 8h sliding expiration, lockout sau 5 lần đăng nhập sai, Rate Limiting 10 req/phút).
- **Validation**: FluentValidation cho toàn bộ DTOs và Models.
- **Logging & Diagnostics**: Serilog (Console & File log rolling).
- **OpenAPI / API Docs**: `Microsoft.AspNetCore.OpenApi` + `Scalar.AspNetCore` (truy cập tại `/scalar/v1`).
- **Data Export**: ClosedXML xuất báo cáo toàn diện nhiều sheet ra định dạng Excel (.xlsx).

### Frontend
- **Framework & Build tool**: React 19 + TypeScript + Vite.
- **Routing & Data Fetching**: React Router v7, TanStack Query v5 (React Query).
- **Styling & Design System**: Tailwind CSS v4, Vanilla CSS Custom Design Tokens (`tokens.css`), Apple Liquid Glass Specular Reflections, SVG Aurora Background.
- **Animation & Physics**: `motion` (Motion for React) với cấu hình lò xo (spring physics) mượt mà, View Transitions API.
- **Biểu đồ & Hiển thị**: Recharts với bảng màu Pastel Glass đồng bộ, CountUp tăng số tự nhiên.

### Testing
- **Backend Tests**: xUnit + FluentAssertions (bao phủ 100% thuật toán tính toán Cashback lũy kế, xác thực bảo mật và test tích hợp).
- **Frontend Tests**: Vitest (kiểm thử các hàm định dạng tiền tệ, ngày tháng, tỷ lệ %).

---

## 2. Cấu trúc thư mục

```text
creditcardmanager/
├── CreditCardManager.slnx                 # Solution file dạng .slnx mới
├── global.json                            # Ghim phiên bản .NET SDK 10.x
├── src/
│   ├── CreditCardManager.Domain/          # Entities, Value Objects, Domain Services (CashbackCalculator, BillingScheduleHelper)
│   ├── CreditCardManager.Application/     # DTOs, FluentValidation Validators, Service Interfaces
│   ├── CreditCardManager.Infrastructure/  # EF Core DbContext, Migrations, Identity, Services (ClosedXML, Cards, Transactions)
│   └── CreditCardManager.Api/             # Controllers, Middlewares, Program.cs, Scalar OpenAPI
├── tests/
│   └── CreditCardManager.Tests/           # 20 Unit & Integration Tests (xUnit + FluentAssertions)
├── web/                                   # Ứng dụng Frontend (React 19 + Vite + Tailwind + Glass UI)
│   ├── src/
│   │   ├── components/
│   │   │   ├── glass/                     # Bộ UI Component phong cách Kính lỏng (Card, Button, Dialog, Progress...)
│   │   │   └── layout/                    # Layout, GlassNav Dock, ProtectedRoute, Modal đổi mật khẩu
│   │   ├── pages/                         # Dashboard, Cards, Rules, MCC, Transactions, Month View, Tracker, Settings, Login
│   │   ├── lib/                           # API Client (chống CSRF), Formatters (VND, dd/MM/yyyy)
│   │   ├── styles/                        # Design tokens (tokens.css), Tailwind entry (index.css)
│   │   └── context/                       # AuthContext & Cookie Session Provider
└── README.md
```

---

## 3. Hướng dẫn cài đặt & Khởi chạy

### Bước 1: Chuẩn bị Cơ sở dữ liệu (SQL Server)
1. Đảm bảo SQL Server đang hoạt động trên máy cục bộ (`localhost`).
2. Tạo file cấu hình `src/CreditCardManager.Api/appsettings.Development.json` dựa trên file mẫu `appsettings.Development.example.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=CreditCardManager;User Id=sa;Password=YOUR_PASSWORD;TrustServerCertificate=True;"
  },
  "Seed": {
    "AdminPassword": "YOUR_INITIAL_ADMIN_PASSWORD"
  }
}
```
> **Lưu ý bảo mật:** File `appsettings.Development.json` đã được đưa vào `.gitignore` để không bao giờ lộ mật khẩu hoặc chuỗi kết nối vào mã nguồn.

### Bước 2: Chạy Backend API (.NET 10)
Từ thư mục gốc của dự án:
```bash
dotnet restore
dotnet build
dotnet run --project src/CreditCardManager.Api/CreditCardManager.Api.csproj
```
- Khi khởi chạy ở môi trường `Development`, hệ thống sẽ tự động thực thi Migration và nạp dữ liệu mẫu (Seeding) gồm: 84 mã MCC, 6 thẻ tín dụng, 27 quy tắc hoàn tiền, 30 giao dịch mẫu tháng 9-10/2026 và 1 tài khoản Admin `taitv`.
- API lắng nghe tại: `http://localhost:5045`
- Tài liệu API tương tác (Scalar): `http://localhost:5045/scalar/v1`

### Bước 3: Chạy Frontend (React 19 + Vite)
Mở một cửa sổ terminal mới:
```bash
cd web
npm install
npm run dev
```
- Ứng dụng Web mở tại: `http://localhost:5173`
- Mọi request `/api/*` sẽ được Vite proxy chuyển tiếp tự động sang backend `http://localhost:5045`.

---

## 4. Trải nghiệm Đăng nhập & Đổi mật khẩu lần đầu

1. Truy cập `http://localhost:5173/`, hệ thống sẽ tự động chuyển hướng về `/login`.
2. Đăng nhập với tài khoản quản trị mặc định:
   - **Tên đăng nhập:** `taitv`
   - **Mật khẩu:** *(Đọc từ mục `Seed:AdminPassword` trong cấu hình của bạn)*
3. **Cơ chế bắt buộc đổi mật khẩu:** Do cờ `MustChangePassword = true`, màn hình sẽ hiển thị hộp thoại kính yêu cầu đổi mật khẩu lần đầu. Mọi API khác đều bị chặn với mã lỗi `403 Forbidden` cho đến khi mật khẩu mới được cập nhật.
4. Nhập mật khẩu mới thỏa mãn chính sách bảo mật (tối thiểu 10 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt) để vào màn hình chính Dashboard.

---

## 5. Thuật toán Hoàn tiền (Cashback Engine) & Các giả định cốt lõi

Thuật toán tính toán nằm trong `CreditCardManager.Domain.Services.CashbackCalculator`, là mã C# thuần (Pure Domain Service), hoàn toàn độc lập với EF Core:

1. **Thứ tự xử lý:** Với mỗi cặp `(CardId, MonthKey)`, giao dịch được sắp xếp tuần tự theo `Date` tăng dần, sau đó theo `Id` tăng dần.
2. **Bộ đếm lũy kế độc lập theo tháng:** Duy trì bộ đếm lũy kế trong tháng gồm:
   - Số tiền chi tiêu đủ điều kiện đã sử dụng theo từng nhóm (`EligibleSpending`).
   - Tiền hoàn đã nhận của từng nhóm (`GroupCashback`).
   - Tiền hoàn đã nhận của toàn bộ thẻ (`CardCashback`).
   - Không có sự phụ thuộc hay ảnh hưởng hạn mức giữa các tháng khác nhau.
3. **Khớp quy tắc (Matching Rule):**
   - Nếu giao dịch có `OverrideRuleId` (và quy tắc thuộc đúng thẻ) -> ép áp dụng quy tắc đó.
   - Ngược lại, chọn quy tắc **đầu tiên** (theo `Id`) thỏa mãn: cùng `CardId`, cùng `MccCode`, nằm trong khoảng hiệu lực `StartDate` - `EndDate` (hoặc null), và số tiền giao dịch `>= MinTransaction` (hoặc null).
4. **Hạn mức chi tiêu đủ điều kiện (`MaxEligibleSpending`):**
   - Được tính theo **nhóm danh mục / tháng**.
   - `EligibleAmount = max(0, min(Amount, MaxEligibleSpending - EligibleSpendingĐãDùng))`.
5. **Tính tiền hoàn thực tế (`ActualCashback`):**
   - `TheoreticalCashback = round(EligibleAmount * Rate, 0)`.
   - `ActualCashback = max(0, min(TheoreticalCashback, GroupCap - GroupCashbackĐãNhận, CardCap - CardCashbackĐãNhận))`.
   - Làm tròn số nguyên chính xác đến 1 VNĐ. Kết quả không bao giờ âm và không bao giờ vượt mức Cap tối đa.
6. **Tính toàn vẹn dữ liệu khi chỉnh sửa (Atomic Recalculation):**
   - Khi thêm, sửa hoặc xóa giao dịch, hoặc thay đổi quy tắc hoàn tiền, toàn bộ các giao dịch thuộc các `(CardId, MonthKey)` bị ảnh hưởng sẽ được tính toán lại đồng bộ trong **một Transaction cơ sở dữ liệu duy nhất**.

---

## 6. Lịch Sao kê & Hạn mức Tín dụng

- **Ngày Sao Kê (`StatementDate`):** Ngày sao kê đầu tiên `>=` ngày giao dịch (nếu `StatementDay` lớn hơn số ngày trong tháng sẽ lấy ngày cuối cùng của tháng).
- **Hạn Thanh Toán (`PaymentDueDate`):** Ngày `PaymentDueDay` đầu tiên sau `StatementDate` (nếu `PaymentDueDay <= StatementDay` thì chuyển sang tháng tiếp theo).
- **Tỷ lệ sử dụng hạn mức (Utilization):**
  - `< 50%`: Bình thường (Xanh lá).
  - `50% - 70%`: Cảnh báo nhẹ (Vàng).
  - `70% - 90%`: Cảnh báo (Cam).
  - `> 90%`: Nguy hiểm (Đỏ).

---

## 7. Chạy Kiểm Thử (Tests)

### Backend (xUnit)
```bash
dotnet test
```
*Kết quả: 20/20 test cases vượt qua 100% (CashbackCalculator logic, Lockout 5 lần, Validation, Forbidden khi chưa đổi mật khẩu, End-to-end integration).*

### Frontend (Vitest)
```bash
cd web
npm test
```
*Kết quả: 6/6 test cases vượt qua 100% (bao gồm bài kiểm tra tự động quét 100% tiếng Việt `i18n-scan.test.ts` và kiểm tra định dạng tiền tệ/ngày tháng/tỷ lệ `formatters.test.ts`).*

### Build Kiểm tra Toàn diện
```bash
cd web
npm run build
```
*Kết quả: TypeScript type-check và Vite bundle thành công 100%.*

---

## 8. Giấy phép & Tác giả
- Phát triển hoàn chỉnh theo kiến trúc Clean Architecture, chuẩn .NET 10 & React 19.
