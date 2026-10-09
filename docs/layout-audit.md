# Báo cáo Đánh giá và Quy hoạch Bố cục Giao diện (Layout Audit)

Tài liệu kiểm tra, so sánh và quy hoạch lại toàn bộ cấu trúc giao diện hệ thống Quản lý thẻ tín dụng theo yêu cầu đồng nhất bố cục, đối xứng, cố định vị trí ở mọi trang và tối ưu hóa 100% cho thiết bị di động / máy tính bảng.

---

## 1. Kết quả Kiểm toán Hiện trạng (Trước khi Tái cấu trúc)

### 1.1 Khảo sát trên các độ phân giải mục tiêu

| Thiết bị & Kích thước | Hiện trạng quan sát | Vấn đề phát hiện |
|:---|:---|:---|
| **Desktop Full HD (1920x1080)** | Toàn trang cuộn dọc không cần thiết trên một số trang; chiều cao các khối không đồng nhất; trang Cài đặt co cụm lệch lề trái; các nút hành động chính (Thêm thẻ, Thêm giao dịch) nằm lệch vị trí giữa các trang. | Thiếu cố định 4 vùng (Topbar, Toolbar, Content, Footer); không có khung ứng dụng không cuộn toàn trang (No Document Scroll). |
| **Desktop Laptop (1366x768)** | Các trang bảng bị kéo dài làm thanh cuộn của trình duyệt xuất hiện; chân trang và phân trang bị trôi xuống dưới khuất màn hình; người dùng phải cuộn chuột liên tục để tìm nút phân trang. | Tiêu đề bảng không dính cố định; phân trang không nằm ở Region D cố định đáy màn hình. |
| **Máy tính bảng (768x1024)** | Sidebar bên trái chiếm diện tích lớn làm bảng dữ liệu bị ép ngang; chữ bị cắt và một số nút bấm nhỏ dưới 44px; khoảng trống không được tối ưu theo lưới 2 cột. | Cần ẩn Sidebar, kích hoạt BottomNav và chuyển sang lưới 2x2 cho thẻ KPI; bảng dữ liệu chỉ giữ các cột ưu tiên. |
| **Điện thoại (390x844 & 360x740)** | Bảng dữ liệu tràn ngang hoặc co rúm khó đọc; ô nhập liệu nhỏ dưới 16px gây hiệu ứng phóng to (auto-zoom) khó chịu trên iOS; không có thanh điều hướng đáy (BottomNav) chuẩn cảm ứng; hộp thoại trượt lệch ra khỏi màn hình. | Bảng dữ liệu chưa chuyển sang dạng thẻ (Mobile Cards); thiếu BottomSheet cho bộ lọc; vùng chạm chưa đạt tiêu chuẩn 44x44px. |

---

## 2. Quy hoạch Khung Trang Chuẩn 4 Vùng Cố định (Desktop >= 1024px)

Trên màn hình máy tính (>= 1024px), toàn bộ ứng dụng chạy theo nguyên tắc **KHÔNG CUỘN TOÀN TRANG** (`height: 100dvh; overflow: hidden;`). Trình duyệt không bao giờ có thanh cuộn dọc. Mọi thao tác cuộn chỉ diễn ra bên trong bảng, danh sách hoặc ngăn kéo.

```
+-----------------------------------------------------------------------------------------------+
| SIDEBAR (240px) | VÙNG A: TOPBAR (Cao 64px cố định) - data-region="topbar"                    |
|                 | [Tiêu đề trang]            [‹ Tháng 10/2026 ›]           [Nút hành động]    |
|                 +-----------------------------------------------------------------------------+
| [Logo & Brand]  | VÙNG B: TOOLBAR (Cao 56px cố định) - data-region="toolbar"                  |
|                 | [Ô tìm kiếm]   [Bộ lọc 1]  [Bộ lọc 2]              [Nút phụ / Xuất tệp]     |
| [1. Tổng quan]  +-----------------------------------------------------------------------------+
| [2. Thẻ]        | VÙNG C: NỘI DUNG CHÍNH (1fr, min-h: 0, cuộn bên trong) - data-region="content"|
| [3. Giao dịch]  |                                                                             |
| [4. Xem tháng]  | Áp dụng 1 trong 4 mẫu bố cục chuẩn (Lưới 12 cột, khoảng cách 16px):        |
| [5. Quy tắc HT] | - MẪU 1: "single-table" (1 bảng toàn chiều rộng 12 cột)                     |
| [6. Mã MCC]     | - MẪU 2: "stats-two-blocks" (4 KPI 3 cột + 2 khối cân xứng 6 cột)           |
| [7. Theo dõi]   | - MẪU 3: "two-equal-blocks" (2 khối 6 cột: danh sách | chi tiết)            |
| [8. Cài đặt]    | - MẪU 4: "form" (1 khối 8 cột căn giữa)                                     |
|                 +-----------------------------------------------------------------------------+
| [User & Logout] | VÙNG D: FOOTER (Cao 48px cố định) - data-region="footer"                    |
|                 | [Hiển thị 1–20 trên 58 dòng]                       [Phân trang ‹ 1 2 3 ›]   |
+-----------------------------------------------------------------------------------------------+
```

---

## 3. Quy hoạch Biến thể Mobile & Tablet (< 1024px)

Trên thiết bị cảm ứng, ứng dụng chuyển sang chế độ thiết kế chuyên dụng:
1. **Khung cuộn tự nhiên**: Cho phép cuộn dọc toàn trang (`min-height: 100dvh`), cấm tuyệt đối cuộn ngang (`overflow-x: hidden`).
2. **Compact Topbar (56px)**: Dính trên cùng (`position: sticky`), tiêu đề bên trái, nút hành động nhanh dạng biểu tượng `+` bên phải (vùng chạm 44x44px).
3. **Bộ chọn tháng (44px)**: Đặt ở hàng riêng độc lập ngay dưới Topbar khi trang có hỗ trợ xem theo tháng.
4. **BottomNav (64px + safe-area-inset-bottom)**: 5 mục điều hướng cố định:
   - Tổng quan (Overview)
   - Thẻ (Cards)
   - Giao dịch (Transactions)
   - Xem theo tháng (Monthly View)
   - Khác (More) ➔ Mở **BottomSheet** chứa các chức năng còn lại: *Quy tắc hoàn tiền, Mã ngành MCC, Theo dõi thẻ, Cài đặt, Đổi mật khẩu, Thông tin người dùng & Đăng xuất*.
5. **Bảng thành Danh sách thẻ (DataTable.mobileCard)**:
   - Dưới 768px: Tự động render mỗi dòng bảng thành một thẻ kính Liquid Glass (dòng 1: Tiêu đề + Số tiền; dòng 2: Phụ đề + Huy hiệu trạng thái; dòng 3: Thông tin bổ sung).
   - Chạm vào thẻ để mở màn hình chi tiết toàn màn hình (DetailDrawer).
6. **Bộ lọc bằng BottomSheet**:
   - Trên mobile, thanh công cụ có nút "Bộ lọc" kèm badge đếm số lượng bộ lọc đang chọn. Nhấn vào sẽ trượt BottomSheet từ dưới lên để chọn nhanh và nhấn "Áp dụng".

---

## 4. Bảng ánh xạ Mẫu bố cục cho từng Trang

| Tên Trang | Đường dẫn Route | Mẫu Bố cục | Vùng A (Topbar) | Vùng B (Toolbar) | Vùng C (Content) | Vùng D (Footer) |
|:---|:---|:---:|:---|:---|:---|:---|
| **Overview (Tổng quan)** | `/` & `/overview` | `stats-two-blocks` | Tiêu đề + Placeholder | Dòng tóm tắt tháng | 4 thẻ KPI (hàng trên) + 2 khối tab biểu đồ/danh sách (hàng dưới) | Tổng hợp chỉ số |
| **Cards (Thẻ tín dụng)** | `/cards` | `single-table` | Tiêu đề + Nút "+ Thêm thẻ" | Ô tìm kiếm + Bộ lọc trạng thái | Bảng DataTable 6 cột (Mobile: Danh sách thẻ) | Phân trang 20 dòng |
| **Transactions (Giao dịch)** | `/transactions` | `single-table` | Tiêu đề + Chọn tháng + "+ Thêm giao dịch" | Tìm kiếm + Lọc thẻ + Lọc hoàn tiền + Nút bộ lọc | Bảng DataTable 7 cột (Mobile: Danh sách thẻ) | Phân trang 20 dòng |
| **Monthly View (Xem tháng)** | `/monthly-view` & `/months` | `stats-two-blocks` | Tiêu đề + Bộ chọn tháng | Tóm tắt giao dịch tháng | 4 thẻ KPI + Khối Giao dịch (trái) & Khối Tiến độ hoàn tiền (phải) | Tổng kết hoàn tiền |
| **Cashback Rules (Quy tắc hoàn tiền)** | `/cashback-rules` & `/rules` | `single-table` | Tiêu đề + Thống kê quy tắc | Tìm kiếm + Lọc theo thẻ | Bảng gom nhóm theo thẻ (Accordion) | Tổng số quy tắc |
| **Category Codes (Mã ngành MCC)** | `/category-codes` & `/mcc` | `single-table` | Tiêu đề + Thống kê MCC | Ô tìm kiếm rộng + Lọc danh mục | Bảng DataTable 4 cột mã MCC | Phân trang 20 dòng |
| **Card Tracking (Theo dõi thẻ)** | `/card-tracking` & `/tracker` | `two-equal-blocks` | Tiêu đề + Nút làm mới | Mô tả chu kỳ sao kê | Cột trái: Danh sách thẻ cuộn \| Cột phải: Chi tiết thẻ & Thanh toán | Trạng thái an toàn |
| **Settings (Cài đặt)** | `/settings` | `form` | Tiêu đề + Trạng thái hệ thống | Dãy tab ngang chuyển mục | Khối biểu mẫu 8 cột căn giữa (hoặc 2 cột cân đối) | Nút Lưu cố định |
| **Login (Đăng nhập)** | `/login` | Độc lập | Logo trung tâm | Ẩn | Thẻ kính 400px căn giữa màn hình | Ẩn |
| **NotFound (404)** | `*` | Độc lập | Tiêu đề 404 | Ẩn | EmptyState thông báo và nút quay về trang chủ | Ẩn |

---

## 5. Danh mục Biến Token CSS Chuẩn hóa

```css
:root {
  --topbar-height: 64px;
  --toolbar-height: 56px;
  --footer-height: 48px;
  --block-gap: 16px;
  --block-padding: 20px;
  --row-height: 48px;
  --sidebar-width: 240px;
  --bottom-nav-height: 64px;
  --touch-target: 44px;
  --mobile-topbar-height: 56px;
  --page-gutter: 24px;
}

@media (max-width: 1023px) {
  :root {
    --page-gutter: 16px;
    --block-gap: 12px;
    --block-padding: 16px;
  }
}
```
