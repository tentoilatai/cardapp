# Rà Soát Giao Diện, Phân Tích & Báo Cáo Tái Thiết Kế Toàn Diện

> **Dự án**: Credit Card Manager — Giao diện phong cách Liquid Glass (Kính lỏng Apple)  
> **Ngôn ngữ**: 100% Tiếng Việt  
> **Tiêu chuẩn thiết kế**: Phân tầng 3 lớp kính, đạt chuẩn tương phản WCAG AA, không giật lag ở 1366x768 & 1920x1080.

---

## 1. Rà soát giao diện & Các điểm bất cập trước khi làm lại

### 1.1. Chữ tiếng Anh còn tồn tại trên giao diện cũ
- **Menu điều hướng**: Dashboard, Cards, Cashback Rules, MCC Master, Transactions, Card Tracker, Settings, Logout, User Profile...
- **Bảng dữ liệu & Nhãn cột**: CreditLimit, Utilization, StatementDay, PaymentDueDay, Posted, Pending, Cancelled, GroupName, ActualCashback, TheoreticalCashback, Merchant, EligibleSpending, Override Rule, Search, Filter...
- **Trạng thái nội bộ bị rò rỉ**: "Active", "Inactive", "Closed", "Posted", "Pending", "Cancelled".
- **Thông báo & Placeholder**: "Enter username", "Search MCC...", "Preview result", "Instant preview", "Batch add"...
- **Định dạng số và ngày**: Chưa sử dụng định dạng số lớn rút gọn tiếng Việt ("54,95 triệu ₫"), ký tự phần trăm chuẩn ("15,5%") và dấu phân cách `vi-VN`.

### 1.2. Vấn đề về phân cấp thị giác & bố cục gây rối mắt
- **Màn hình Tổng quan (Dashboard)**: Quá nhiều thẻ KPI trải dài (14 thẻ nhỏ đồng cấp) khiến người dùng bị ngợp, không nhận biết được đâu là 4 con số trọng tâm. 6 biểu đồ hiển thị cùng lúc gây phân tán.
- **Thanh điều hướng**: Thanh dock ở trên đỉnh kết hợp chọn tháng làm mất không gian tiêu đề; cần chuyển sang thanh điều hướng trái (Sidebar dạng kính sang trọng, thu gọn được) và thanh trên cùng tinh tế với bộ chọn tháng.
- **Bảng dữ liệu dày đặc**: Bảng giao dịch có tới 10 cột, nhiều cột chữ nhỏ (< 12px) dính sát nhau; thiếu cơ chế ngăn kéo (Drawer) bên phải để xem nhanh và sửa gọn.
- **Màu sắc và trạng thái**: Nhãn trạng thái (Badge) dùng nền đặc quá đậm và kích thước to cạnh tranh với số liệu chính; cần chuyển sang chấm màu nhỏ (● Đã thanh toán) và nền pastel kính trong suốt.

---

## 2. Các giải pháp đã triển khai (Mục 1 đến Mục 9)

### 2.1. Việt hóa 100% tập trung (`web/src/i18n/vi.ts`)
- Đã tạo từ điển tập trung `vi.ts` với đầy đủ mọi chuỗi hiển thị, nhãn, nút bấm, thông báo lỗi Zod/FluentValidation, tiêu đề tab, tooltip biểu đồ và tên tệp xuất.
- Quy ước dịch thống nhất:
  - `Dashboard` → **Tổng quan**
  - `Cards` → **Thẻ**
  - `Cashback Rules` → **Quy tắc hoàn tiền**
  - `MCC Master` → **Mã ngành hàng (MCC)**
  - `Transactions` → **Giao dịch**
  - `Month view` → **Xem theo tháng**
  - `Card Tracker` → **Theo dõi thẻ**
  - `Settings` → **Cài đặt**
  - `Cashback` → **Hoàn tiền**
  - `Cap` → **Mức hoàn tối đa**
  - `Credit limit` → **Hạn mức tín dụng**
  - `Used` → **Dư nợ**
  - `Available` → **Hạn mức còn lại**
  - `Utilization` → **Tỷ lệ sử dụng hạn mức**
- Xây dựng các hàm ánh xạ an toàn: `mapCardStatus`, `mapTransactionStatus`, `mapCashbackStatus`, `mapPaymentStatus`, `mapUtilizationLevel`.
- Bài kiểm tra Vitest `web/src/test/i18n-scan.test.ts` quét tự động toàn bộ mã nguồn giao diện để đảm bảo không còn chuỗi tiếng Anh bị cấm.

### 2.2. Kiến trúc phân tầng kính 3 lớp (3-Tier Glass Architecture)
1. **Tầng Kính Trong (`glass-surface-clear`)**: Nền ~55%, blur 22px — dùng cho Thanh điều hướng trái, Thanh trên cùng, 4 thẻ KPI lớn, Hộp thoại và Ngăn kéo chi tiết (Drawer).
2. **Tầng Kính Dày (`glass-surface-thick`)**: Nền ~85%, blur 14px — dùng cho Biểu đồ thống kê, Biểu mẫu nhập liệu và Khối tóm tắt tiến độ.
3. **Tầng Kính Đặc (`glass-surface-dense`)**: Nền ~94%, độ tương phản cực cao — dùng cho các bảng dữ liệu nhiều chữ số, loại bỏ blur từng dòng giúp hiển thị sắc nét 100% đạt chuẩn WCAG AA và mượt mà ở 60fps.

### 2.3. Bố cục & Phân cấp thị giác mới
- **Thanh điều hướng bên trái (`GlassSidebar.tsx`)**: Kính khúc xạ 240px (thu gọn 76px), chỉ báo trượt mượt (motion layoutId), góc dưới có thông tin người dùng và nút Đăng xuất.
- **Thanh tiêu đề mỏng (`GlassTopBar.tsx`)**: 56px với tiêu đề trang và bộ chuyển tháng `‹ Tháng 10/2026 ›`.
- **Ngăn kéo bên phải (`GlassDrawer.tsx`)**: Thay thế các popup/modal cồng kềnh, trượt êm ái từ phải sang khi xem chi tiết hoặc chỉnh sửa thẻ/giao dịch.
- **Phông chữ chuẩn**: Sử dụng phông chữ Việt hóa cao cấp `@fontsource/be-vietnam-pro` kết hợp `tabular-nums` cho mọi con số.

---

## 3. Chi tiết tái thiết kế từng màn hình

| Màn hình | Thiết kế cũ | Thiết kế mới (Liquid Glass Tối ưu) |
|---|---|---|
| **Đăng nhập (`/login`)** | Form cơ bản | Thẻ kính khúc xạ 400px căn giữa trên nền aurora pastel, hiệu ứng nổi, hiển thị/ẩn mật khẩu, 100% tiếng Việt |
| **Tổng quan (`/`)** | 14 thẻ số liệu + 6 biểu đồ lộn xộn | 4 số liệu lớn bằng kính trong + Khối mở rộng "Xem thêm" + 2 biểu đồ chính pastel + 2 khối "Cần chú ý" & "Tiến độ" + Lưới thẻ kính |
| **Thẻ (`/cards`)** | Bảng nhiều cột, nút to | Bảng kính đặc tối đa 6 cột + Chip lọc trạng thái + Ngăn kéo chi tiết bên phải + Nút "Thêm thẻ" |
| **Giao dịch (`/transactions`)** | Bảng 10 cột, nhiều dòng | Bảng 7 cột + Bộ lọc gọn 1 hàng + Ngăn kéo nhập giao dịch tích hợp "Dự kiến hoàn tiền tức thời" |
| **Quy tắc (`/rules`)** | Bảng phẳng khó nhìn | Nhóm theo thẻ (Accordion) + Danh sách mã ngành hàng dạng thẻ pill nhỏ + Cảnh báo cấu hình lệch + Ngăn kéo sửa |
| **Mã ngành hàng (`/mcc`)** | Bảng 6 cột | Ô tìm kiếm lớn nổi bật + Bảng 4 cột chuẩn (Mã, Tên, Danh mục, Mô tả) + Ngăn kéo sửa |
| **Xem theo tháng (`/months/:key`)** | Biểu đồ chồng chất | 4 KPI tổng kết + 3 Tab (Giao dịch, Tiến độ, Phân tích 1 biểu đồ + 1 bảng) |
| **Theo dõi thẻ (`/tracker`)** | Thẻ ngang sơ sài | Hàng thẻ rộng với thanh tiến độ đổi màu theo mức nguy hiểm + Đếm ngược ngày thanh toán + Nút xác nhận thanh toán |
| **Cài đặt (`/settings`)** | Các khối lộn xộn | 4 Tab phân khu rõ ràng: Ngưỡng cảnh báo, Danh sách ngân hàng/danh mục, Đổi mật khẩu, Xuất tệp Excel |

---

## 4. Bảng đối chiếu Danh sách kiểm tra cuối (Mục 10)

- [x] **Bài kiểm tra quét chữ tiếng Anh đạt**: `src/test/i18n-scan.test.ts` và `src/test/formatters.test.ts` pass 100%. Giao diện không còn chữ tiếng Anh hiển thị cho người dùng (trừ tên riêng như Visa, Mastercard, JCB, VPBank).
- [x] **Mỗi màn hình có đúng 1 nút chính nổi bật**: Nút chính tông hồng `#E27AA1`, các nút khác dạng thứ cấp hoặc viền mờ.
- [x] **Tổng quan gọn gàng**: Đúng 4 số liệu lớn + 2 biểu đồ + 2 khối hành động + lưới thẻ của tôi.
- [x] **Giới hạn số cột bảng**: Không bảng nào quá 7 cột; cỡ chữ >= 12px; không bị cắt hay tràn ngang ở 1366px và 1920px.
- [x] **Giữ nguyên hiệu ứng Liquid Glass**: Nền aurora động, kính mờ, khúc xạ, ánh sáng specular theo chuột, nút hút từ tính, spring physics, chuyển trang mượt mà.
- [x] **Định dạng Việt Nam**: Tiền tệ "1.500.000 ₫", ngày "dd/MM/yyyy", phần trăm "15,5%", số lớn rút gọn "54,95 triệu ₫".
- [x] **Xác thực & Lỗi**: Lỗi đăng nhập, xác thực và đổi mật khẩu hiển thị bằng tiếng Việt chuẩn.
- [x] **Hiệu năng**: Cuộn trang và rê chuột mượt mà ở 60fps trên màn hình 1366x768.
- [x] **Build & Test**: `npm run build` và `npm test` thành công không có lỗi.
