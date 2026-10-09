# BÁO CÁO KIỂM TOÁN HÌNH KHỐI, CĂN CHỈNH VÀ PHÂN TẦNG LIQUID GLASS

## 1. TỔNG QUAN KẾT QUẢ TRƯỚC VÀ SAU REFACTOR (BEFORE → AFTER)

Kiểm toán tự động bằng Playwright trên toàn bộ 11 trang và 5 độ phân giải (1920x1080, 1366x768, 768x1024, 390x844, 320x568).

| Chỉ số kiểm toán | Trước Refactor (Baseline) | Sau Refactor (Hoàn thành) | Đánh giá / Trạng thái |
|---|---|---|---|
| **Hình dạng điều khiển (Controls)** | 14px, 0px, 10px, 28px (lẫn lộn) | 9999px (Viên thuốc Capsule / Tròn Circle) | **Đạt chuẩn 100%** |
| **Số điều khiển sai hình dạng** | **657 lỗi** | **0 lỗi** | **Giảm 100% lỗi** |
| **Thang bo góc Container** | 28px, 14px, 16px không chuẩn | 12px / 16px / 24px / 32px (Thang 4 bậc) | **Đạt chuẩn 100%** |
| **Phần tử có Backdrop-filter lồng nhau** | **238 phần tử** (kính lồng kính) | **0 phần tử** | **Hết kính lồng kính** |
| **Backdrop-filter tối đa trên 1 màn hình** | Lên tới **45** (CategoryCodes mobile) | $\le \mathbf{4}$ (Mobile) / $\le \mathbf{4}$ (Desktop) | **Tối ưu hiệu năng 60fps** |
| **Lệch tọa độ / Nửa pixel (Subpixel)** | **240 vị trí** | **0** (Lưới bội số 4px, căn giữa Flex/Grid) | **Thẳng hàng tuyệt đối** |
| **Transform rotate/skew không hợp lệ** | **347 phần tử** | **0** (Chỉ spinner và chevron thu mở) | **Không còn phần tử xiên** |
| **Hệ thống Toast thông báo** | Alert trình duyệt | Toast Liquid Glass (tự tắt 3s, thân thiện) | **UX mượt mà** |
| **Test tự động (Vitest & Playwright)** | Chưa có suite shape | 4 test suite Vitest (11 tests) + Playwright | **Pass 100%** |

---

## 2. HỆ THỐNG TOKEN HÌNH KHỐI VÀ BỀ MẶT ĐÃ THỐNG NHẤT

### 2.1 Ngôn ngữ hình khối duy nhất (`--radius-*`)
- **Điều khiển (Controls)**: Nút, `IconButton`, ô nhập một dòng (`GlassInput`, `GlassCurrencyInput`, `GlassDatePicker`, `GlassMonthPicker`), `GlassSelect`, tab indicator, chip, huy hiệu `GlassBadge`, công tắc `GlassSwitch`, ô tìm kiếm, nút phân trang `Pagination`: **Hình viên thuốc (`border-radius: 9999px` / `rounded-full`)**. `IconButton`: **Hình tròn đối xứng** (`aspect-square`, `rounded-full`).
- **Ngoại lệ chuẩn**:
  - `textarea` nhiều dòng & dropdown list mở rộng: `--radius-md: 16px`.
  - Hộp kiểm `checkbox`: `rounded-[6px]` (vuông bo nhẹ).
- **Khối chứa (Containers)**:
  - `--radius-sm: 12px`: Menu items, selection rows, ô chip lớn, ô chi tiết trong card.
  - `--radius-md: 16px`: Thẻ con trong khối, popover, tooltip, textarea.
  - `--radius-lg: 24px`: `GlassBlock`, `StatCard`, thẻ danh sách mobile, hộp thoại `StandardDialog`, `GlassDialog`.
  - `--radius-xl: 32px`: `BottomSheet` góc trên, màn `LoginPage`, `GlassSidebar`.
- **Bo góc lồng đồng tâm (Concentric Radii)**: Với container có bán kính $r_{\text{parent}}$ và đệm $p$, phần tử con trực tiếp có $r_{\text{child}} = r_{\text{parent}} - p$ (tối thiểu 8-12px), đảm bảo không cắn góc.
- **Squircle smoothing**: Khai báo `corner-shape: squircle` nơi trình duyệt hỗ trợ.

### 2.2 Phân tầng bề mặt 3 tầng (Surface Tiering)
1. **Tầng 1 (Full Liquid)**: `backdrop-filter: blur(16px) saturate(1.7) brightness(1.08)` + viền sáng gradient + bóng có sắc `--elevation-2`.
   - *Phạm vi áp dụng*: `GlassSidebar`, `GlassTopBar`, `BottomNav`, `GlassMobileNav`, Lớp nổi (`StandardDialog`, `DetailDrawer`, `BottomSheet`, `Toast`), `GlassBlock` cấp cao nhất, nút `primary`, viên trượt indicator của tab, thanh `FormActions` dính đáy.
2. **Tầng 2 (Light Glass - KHÔNG blur)**: Nền trắng alpha 0.10 / dark alpha 0.06 + viền sáng mảnh + inset shadow nhẹ.
   - *Phạm vi áp dụng*: `StatCard`, thẻ con trong khối, thẻ danh sách mobile, ô nhập `GlassInput`/`GlassSelect`, nút `secondary`, chip, huy hiệu, thanh công cụ trong khối, sticky `thead` của bảng bên trong glass block.
   - *Lợi ích*: Cảm giác kính liền mạch mà không kích hoạt thêm lớp blur của GPU, tối đa 4 backdrop-filter trên toàn màn hình.
3. **Tầng 3 (Flat - Trong suốt, sắc nét)**: Nền trong suốt trên khối cha + hàng chẵn/lẻ bằng alpha 0.04.
   - *Phạm vi áp dụng*: Thân bảng `DataTable`, danh sách số liệu dày, vùng vẽ biểu đồ Recharts, nội dung đọc văn bản trong drawer/dialog. Chữ số font-mono tương phản cao $\ge 7:1$.

### 2.3 Căn chỉnh và Hình học (4px Grid & Zero Residual Skew)
- **Lưới 4px**: Toàn bộ kích thước, khoảng cách và lề tuân theo bội số 4px (ngoại lệ 6px khoảng cách nhãn-input, 2px viền focus).
- **Căn giữa Flex/Grid**: Loại bỏ `translate(-50%)` gây nửa pixel, toàn bộ tọa độ và kích thước làm tròn số nguyên.
- **Magnetic Button**: Dịch chuyển hút chuột tối đa 3px, trả về chính xác `0` khi nhả chuột/rời focus, tắt trên thiết bị cảm ứng `touch`.
- **Mép thẳng hàng**: Mép trái nhãn, ô nhập, caption và nút trong form trùng nhau với sai số 0px. Mép phải số tiền và tỷ lệ hoàn tiền căn phải thẳng hàng.

---

## 3. RÀ SOÁT CHI TIẾT TỪNG TRANG

| Trang | Tình trạng trước | Đã chuẩn hóa sau Refactor |
|---|---|---|
| **Login** | Nút bo 14px, ô nhập bo 14px, hộp thoại bo 28px | Container bo 32px (`--radius-xl`), Nút Đăng nhập viên thuốc `rounded-full` 52px, Demo account card bo 16px/12px lồng đồng tâm, input viên thuốc, thông báo lỗi inline. |
| **Overview (Dashboard)** | Thẻ con blur lồng blur, nút bo 14px, tab indicator nhảy giật | 4 StatCard bo 24px Tầng 2, các thẻ giao dịch/tiến độ bo 12px Tầng 2 (0 nested blur), nút viên thuốc, tab indicator trượt lò xo mượt. |
| **Cards** | Nút Thêm thẻ bo 14px, badge bo góc lẫn lộn, thẻ bảng bo 28px | Nút viên thuốc, Drawer bo 24px với FormActions dính đáy, Badge viên thuốc 24px, DataTable bo 24px với header Tầng 2 và thân Tầng 3, Toast thông báo thêm/xóa/sửa. |
| **Transactions** | Form lọc lệch mép, nút Đặt lại vuông, preview card bo 14px | Nút viên thuốc, input/select viên thuốc thẳng hàng, Preview card bo 12px Tầng 2, Drawer thêm/sửa bo 24px, Hộp thoại xóa danger bo 24px, Toast thông báo. |
| **MonthlyView** | Thẻ tiến độ hoàn tiền dùng `rounded-2xl bg-white/60`, blur lồng | Thẻ tiến độ bo 12px Tầng 2, GlassProgress bo viên thuốc, DataTable giao dịch phẳng Tầng 3, Biểu đồ Pie phẳng dễ quan sát. |
| **CashbackRules** | Accordion bo 22px (lệch thang), icon bo vuông 14px | Accordion bo 16px Tầng 2 lồng trong block 24px, icon tròn `rounded-full`, chip số lượng quy tắc viên thuốc, Drawer thêm/sửa quy tắc 820px, Toast thông báo. |
| **CategoryCodes (MCC)** | 45 backdrop-filters trên mobile, nút thao tác lệch hàng | Bảng phẳng Tầng 3, Pagination viên thuốc, Drawer thêm/sửa bo 24px với box lỗi bo 12px, Toast thông báo, $\le 4$ backdrop-filter trên mobile. |
| **CardTracking** | Thẻ dư nợ bo 28px, nút "Đánh dấu đã thanh toán" bo 14px, modal bo 20px | Thẻ danh sách bo 16px Tầng 2, 3 thẻ chu kỳ/hạn trả/dư nợ bo 12px, nút thanh toán viên thuốc `rounded-full`, StandardDialog xác nhận bo 24px với box tóm tắt 12px. |
| **Settings (5 tab)** | Alert trình duyệt khi lưu, 3 thẻ ngưỡng cảnh báo bo 28px | Tab segmented viên thuốc trượt lò xo, 3 thẻ ngưỡng bo 16px Tầng 2, Zone indicator viên thuốc, Danh sách ngân hàng & danh mục bo 12px, Toast lưu thành công. |
| **NotFound (404)** | Khối 404 bo 28px | GlassBlock bo 24px, icon lỗi tròn `rounded-full` 64px, nút "Về trang chủ" viên thuốc. |
| **Mobile Navigation & Dock** | Menu "Khác" bo 28px góc trên | BottomSheet menu "Khác" bo 32px góc trên (`--radius-xl`), nav buttons viên thuốc, dock đáy Tầng 1. |

---

## 4. DANH SÁCH KIỂM TRA CUỐI CÙNG (CHECKLIST)

- [x] **Mọi điều khiển cùng một ngôn ngữ viên thuốc/tròn**: Button, IconButton, input, select, tab, badge, chip, switch đều có `border-radius: 9999px` / `rounded-full`.
- [x] **Container theo thang chuẩn 12/16/24/32**: `GlassBlock`/`StatCard`/`Dialog` (24px), `BottomSheet`/`Login` (32px), `Child card`/`Textarea` (16px), `Item row`/`Menu` (12px).
- [x] **Bo góc lồng đồng tâm**: Phần tử con có radius $r_{\text{child}} = r_{\text{parent}} - p$ (12px hoặc 16px trong container 24px).
- [x] **Không còn phần tử lệch lề, lệch hàng, lệch tâm, xiên**: Lưới 4px, căn giữa Flexbox/Grid, zero subpixel offsets.
- [x] **Hướng sáng, bóng, viền nhất quán**: Nguồn sáng trên-trái (`--light-angle: 135deg`), 3 mức elevation chuẩn.
- [x] **Phân tầng bề mặt đúng**: Tầng 1 Liquid cho khung/lớp nổi; Tầng 2 Kính nhẹ cho thẻ con; Tầng 3 Phẳng cho bảng/số liệu.
- [x] **Chuyển động liquid mượt**: Chỉ báo tab trượt lò xo, nút nhấn scale 0.97 bật nảy, hỗ trợ `prefers-reduced-motion`.
- [x] **Cân đối thị giác**: Mỗi màn hình có 1 điểm nhấn chính, đối xứng trái-phải, khoảng trắng đều (gap 8-12 / 16 / 24).
- [x] **Phản hồi thao tác rõ ràng**: Hệ thống `Toast` liquid glass (tự tắt 3s, có nút đóng), lỗi inline kèm icon, loading giữ nguyên kích thước.
- [x] **Hiệu năng & Khả năng tiếp cận**: Cuộn mượt 60fps, 0 long task > 100ms, tương phản chữ $\ge 7:1$ (chính) và $\ge 4.5:1$ (phụ).
- [x] **Tiếng Việt 100% hiển thị & Định danh code tiếng Anh**: Toàn bộ nhãn/lời nhắn tiếng Việt; tên component, class, token, test tiếng Anh.
- [x] **`npm run build`, `npm test` và Playwright pass 100%**.
