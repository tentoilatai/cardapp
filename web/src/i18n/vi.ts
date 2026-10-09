/**
 * Từ điển ngôn ngữ tiếng Việt tập trung cho toàn bộ ứng dụng Quản lý Thẻ tín dụng
 * Đảm bảo 100% giao diện, thông báo, nhãn, bảng biểu được dịch thống nhất theo quy ước.
 */

export const vi = {
  // Thương hiệu & Tiêu đề chung
  app: {
    name: 'Quản lý thẻ',
    fullName: 'Quản lý Thẻ tín dụng & Hoàn tiền',
    tagline: 'Theo dõi chi tiêu, tối ưu hạn mức và mức hoàn tiền theo mã ngành hàng (MCC)',
    version: 'Phiên bản 2.0 Kính lỏng',
    author: 'Phát triển bởi Đội ngũ Kỹ thuật',
  },

  // Từ khóa dùng chung
  common: {
    all: 'Tất cả',
    add: 'Thêm',
    addNew: 'Thêm mới',
    save: 'Lưu',
    saveChanges: 'Lưu thay đổi',
    cancel: 'Hủy',
    delete: 'Xóa',
    edit: 'Sửa',
    search: 'Tìm kiếm',
    filter: 'Bộ lọc',
    export: 'Xuất tệp',
    import: 'Nhập tệp',
    actions: 'Thao tác',
    viewDetails: 'Xem chi tiết',
    loading: 'Đang tải...',
    calculating: 'Đang tính toán...',
    refresh: 'Làm mới',
    close: 'Đóng',
    confirm: 'Xác nhận',
    confirmDelete: 'Xác nhận xóa',
    back: 'Quay lại',
    previousPage: 'Trang trước',
    nextPage: 'Trang sau',
    retry: 'Thử lại',
    status: 'Trạng thái',
    note: 'Ghi chú',
    notFound: 'Không tìm thấy trang',
  },

  // Điều hướng (Navigation)
  nav: {
    dashboard: 'Tổng quan',
    cards: 'Thẻ',
    transactions: 'Giao dịch',
    monthView: 'Xem theo tháng',
    rules: 'Quy tắc hoàn tiền',
    mcc: 'Mã ngành hàng',
    tracker: 'Theo dõi thẻ',
    settings: 'Cài đặt',
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
    userProfile: 'Tài khoản',
    collapseSidebar: 'Thu gọn thanh menu',
    expandSidebar: 'Mở rộng thanh menu',
    more: 'Khác',
    changePassword: 'Đổi mật khẩu',
  },

  // Màn hình Đăng nhập & Đổi mật khẩu
  login: {
    title: 'Đăng nhập',
    subtitle: 'Hệ thống Quản lý Thẻ tín dụng & Hoàn tiền',
    username: 'Tên đăng nhập',
    usernamePlaceholder: 'Nhập tên đăng nhập...',
    password: 'Mật khẩu',
    passwordPlaceholder: 'Nhập mật khẩu...',
    showPassword: 'Hiện mật khẩu',
    hidePassword: 'Ẩn mật khẩu',
    submit: 'Đăng nhập',
    submitting: 'Đang xử lý đăng nhập...',
    loginFailed: 'Tên đăng nhập hoặc mật khẩu không chính xác.',
    loginSuccess: 'Đăng nhập thành công!',
  },

  auth: {
    mustChangePasswordTitle: 'Yêu cầu đổi mật khẩu lần đầu',
    mustChangePasswordDesc: 'Để bảo vệ tài khoản, bạn cần thiết lập mật khẩu mới trước khi tiếp tục sử dụng hệ thống.',
    currentPassword: 'Mật khẩu hiện tại',
    currentPasswordPlaceholder: 'Nhập mật khẩu ban đầu...',
    newPassword: 'Mật khẩu mới',
    newPasswordPlaceholder: 'Tối thiểu 10 ký tự (chữ hoa, thường, số, ký tự đặc biệt)...',
    confirmPassword: 'Xác nhận mật khẩu mới',
    confirmPasswordPlaceholder: 'Nhập lại mật khẩu mới...',
    passwordHint: 'Mật khẩu mới yêu cầu tối thiểu 10 ký tự, có chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt.',
    passwordMismatch: 'Xác nhận mật khẩu mới không khớp.',
    changePasswordSuccess: 'Đổi mật khẩu thành công! Hệ thống đang chuyển về màn hình chính.',
    changePasswordSubmit: 'Cập nhật mật khẩu & Bắt đầu',
  },

  // Màn hình Tổng quan (Dashboard)
  dashboard: {
    title: 'Tổng quan',
    subtitle: 'Theo dõi chi tiêu, hạn mức tín dụng và tối ưu hoàn tiền',
    monthSelectorLabel: 'Chọn tháng xem dữ liệu',
    
    // 4 Thẻ KPI chính
    usedCredit: 'Dư nợ hiện tại',
    usedCreditDesc: 'Tổng tiền chi tiêu chưa thanh toán',
    availableCredit: 'Hạn mức còn lại',
    availableCreditDesc: 'Khả dụng trên toàn bộ thẻ',
    monthSpending: 'Chi tiêu trong tháng',
    monthSpendingDesc: 'Tổng phát sinh trong kỳ',
    actualCashback: 'Hoàn tiền thực nhận',
    actualCashbackDesc: 'Tiền hoàn lũy kế đã tối ưu mức tối đa',

    // Thẻ KPI mở rộng
    moreStatsTitle: 'Các chỉ số phân tích bổ sung',
    totalCards: 'Tổng số thẻ',
    totalCardsUnit: 'thẻ đang dùng',
    totalCreditLimit: 'Tổng hạn mức tín dụng',
    averageUtilization: 'Tỷ lệ sử dụng hạn mức',
    theoreticalCashback: 'Hoàn tiền dự kiến',
    remainingCashbackCap: 'Mức hoàn còn có thể nhận',
    topCashbackCard: 'Thẻ hoàn tiền cao nhất',
    topSpendingCard: 'Thẻ chi tiêu nhiều nhất',
    nearLimitAlert: 'Thẻ gần chạm hạn mức',
    nearCapAlert: 'Thẻ gần đạt mức tối đa',
    dueSoonAlert: 'Thẻ sắp đến hạn thanh toán',

    // Biểu đồ
    chartSpendingByCardTitle: 'Chi tiêu theo thẻ tín dụng',
    chartSpendingByCardDesc: 'Số tiền chi tiêu phát sinh trong tháng theo từng thẻ',
    chartCashbackTrendsTitle: 'Hoàn tiền theo tháng trong năm',
    chartCashbackTrendsDesc: 'So sánh mức chi tiêu và số tiền hoàn nhận được qua các tháng',
    spendingLegend: 'Chi tiêu',
    actualCashbackLegend: 'Hoàn tiền thực',
    theoreticalCashbackLegend: 'Hoàn tiền dự kiến',
    limitLegend: 'Hạn mức',

    // Khối hành động
    attentionTitle: 'Cần chú ý',
    attentionEmpty: 'Tất cả các thẻ đều ở trạng thái an toàn, không có cảnh báo nào.',
    capProgressTitle: 'Tiến độ hoàn tiền tháng này',
    capProgressDesc: 'Mức hoàn tiền thực nhận so với mức tối đa của từng thẻ',
    unlimitedCap: 'Không giới hạn mức hoàn',
    
    // Lưới thẻ tín dụng
    myCardsTitle: 'Thẻ của tôi',
    myCardsDesc: 'Bấm vào thẻ để xem chi tiết lịch sao kê, hạn mức và quy tắc áp dụng',
  },

  // Màn hình Quản lý Thẻ (Cards)
  cards: {
    title: 'Thẻ tín dụng',
    subtitle: 'Danh sách thẻ, hạn mức tín dụng và lịch sao kê',
    addCard: 'Thêm thẻ mới',
    editCard: 'Chỉnh sửa thông tin thẻ',
    cardDetails: 'Chi tiết thẻ tín dụng',
    searchPlaceholder: 'Tìm theo tên thẻ, ngân hàng, mã thẻ...',
    statusActive: 'Đang dùng',
    statusInactive: 'Tạm ngưng',
    statusClosed: 'Đã đóng',
    noCardsFound: 'Không tìm thấy thẻ nào',
    noCardsPrompt: 'Thử đổi từ khóa tìm kiếm hoặc nhấn Thêm thẻ mới.',
    viewDetails: 'Xem chi tiết',
    deleteCard: 'Xóa thẻ',
    
    // Cột bảng
    colCard: 'Thẻ tín dụng',
    colBank: 'Ngân hàng',
    colLimit: 'Hạn mức',
    colSchedule: 'Sao kê / Hạn thanh toán',
    colStatus: 'Trạng thái',

    // Fields
    cardId: 'Mã định danh thẻ (ID)',
    bank: 'Ngân hàng phát hành',
    cardName: 'Tên thẻ',
    last4: '4 số cuối',
    cardType: 'Loại thẻ',
    network: 'Mạng thẻ',
    status: 'Trạng thái',
    note: 'Ghi chú',

    confirmDeleteTitle: 'Xác nhận xóa thẻ tín dụng',
  },

  // Màn hình Giao dịch (Transactions)
  transactions: {
    title: 'Sổ giao dịch & Chi tiêu',
    subtitle: 'Ghi nhận giao dịch và tự động tính toán hoàn tiền',
    addTransaction: 'Ghi nhận giao dịch',
    editTransaction: 'Chỉnh sửa giao dịch',
    searchPlaceholder: 'Tìm theo nơi chi tiêu, mô tả, mã MCC...',
    noTransactions: 'Không tìm thấy giao dịch nào',
    paid: 'Đã thanh toán',
    unpaid: 'Chưa thanh toán',

    // Cột bảng
    colDate: 'Ngày',
    colCard: 'Thẻ',
    colMerchant: 'Nơi chi tiêu',
    colMcc: 'Mã ngành hàng (MCC)',
    colAmount: 'Số tiền',
    colCashback: 'Hoàn tiền',
    colStatus: 'Trạng thái hoàn',
    colPaymentStatus: 'Thanh toán',

    // Fields
    card: 'Thẻ thanh toán',
    date: 'Ngày phát sinh',
    merchant: 'Nơi chi tiêu',
    amount: 'Số tiền giao dịch',
    status: 'Trạng thái ghi nhận',
    paymentStatus: 'Trạng thái thanh toán',
    note: 'Ghi chú chi tiêu',

    // Preview
    previewTitle: 'Dự kiến hoàn tiền tức thời',
    previewCalculating: 'Đang tính toán...',
    ruleApplied: 'Quy tắc áp dụng',
    cashbackRate: 'Tỷ lệ hoàn',
    actualCashback: 'Hoàn tiền thực nhận',
    remainingCap: 'Mức hoàn còn lại trong tháng',
    cashbackStatus: 'Trạng thái hoàn tiền',

    confirmDeleteTitle: 'Xác nhận xóa giao dịch',
  },

  // Màn hình Quy tắc hoàn tiền (Rules)
  rules: {
    title: 'Quy tắc hoàn tiền',
    subtitle: 'Quản lý tỷ lệ hoàn, nhóm danh mục, mã ngành hàng và hạn mức theo thẻ',
    addRule: 'Thêm 1 quy tắc',
    addBatch: 'Thêm nhiều mã MCC vào nhóm',
    searchPlaceholder: 'Tìm theo mã MCC, tên nhóm, danh mục, thẻ...',
    noRules: 'Chưa có quy tắc hoàn tiền nào',
    rate: 'Tỷ lệ',
    groupCap: 'Mức tối đa nhóm',
    cardCap: 'Mức tối đa thẻ',
    inconsistentCapWarning: 'Cảnh báo: Các quy tắc trong nhóm này đang có mức tối đa khác nhau. Hệ thống sẽ áp dụng mức tối đa của quy tắc đầu tiên khớp.',

    // Fields
    card: 'Thẻ áp dụng',
    groupName: 'Tên nhóm quy tắc',
    mccCode: 'Mã ngành hàng (MCC)',
    category: 'Danh mục hiển thị',
    startDate: 'Ngày bắt đầu hiệu lực',
    endDate: 'Ngày kết thúc hiệu lực',
    note: 'Điều kiện bổ sung & Ghi chú',

    confirmDeleteTitle: 'Xác nhận xóa quy tắc',
  },

  // Màn hình Mã ngành hàng (MCC Master)
  mcc: {
    title: 'Mã ngành hàng (MCC)',
    subtitle: 'Danh mục mã nhận diện ngành hàng 4 chữ số tiêu chuẩn dùng để phân loại chi tiêu',
    addMcc: 'Thêm mã ngành hàng',
    editMcc: 'Chỉnh sửa mã ngành hàng',
    searchPlaceholder: 'Tìm kiếm mã MCC (4 số), tên ngành hàng, mô tả...',
    noMccFound: 'Không tìm thấy mã ngành hàng nào',

    // Cột bảng
    colCode: 'Mã MCC',
    colName: 'Tên ngành hàng',
    colCategory: 'Nhóm danh mục',
    colDescription: 'Mô tả chi tiết & Ví dụ',

    // Fields
    mccCode: 'Mã MCC (4 chữ số)',
    mccName: 'Tên ngành hàng',
    category: 'Nhóm danh mục',
    description: 'Mô tả chi tiết & Cửa hàng tiêu biểu',

    confirmDeleteTitle: 'Xác nhận xóa mã ngành hàng',
  },

  // Màn hình Xem theo tháng (Month View)
  month: {
    title: 'Tổng kết',
    subtitle: 'Báo cáo chi tiết về hiệu suất hoàn tiền, hạn mức nhóm và danh mục chi tiêu',
    totalSpending: 'Tổng chi tiêu tháng',
    actualCashback: 'Hoàn tiền thực nhận',
    effectiveRate: 'Tỷ lệ hoàn thực tế',
    transactionCount: 'Số lượng giao dịch',

    tabTransactions: 'Sổ giao dịch',
    tabCapProgress: 'Tiến độ mức hoàn',
    tabBreakdown: 'Phân tích đa chiều',

    breakdownCard: 'Theo Thẻ tín dụng',
    breakdownBank: 'Theo Ngân hàng',
    breakdownCategory: 'Theo Nhóm ngành',
    breakdownMcc: 'Theo Mã MCC',
    breakdownMerchant: 'Theo Cửa hàng / Nơi chi tiêu',
  },

  // Màn hình Theo dõi thẻ (Card Tracker)
  tracker: {
    title: 'Theo dõi thẻ',
    subtitle: 'Kiểm soát tỷ lệ sử dụng hạn mức và thời hạn thanh toán để duy trì điểm tín dụng tốt',
    refresh: 'Làm mới số liệu',
    markStatementPaid: 'Đánh dấu đã thanh toán',
    confirmPaidTitle: 'Xác nhận thanh toán sao kê',
    cardListTitle: 'Danh sách thẻ',
    cardDetailTitle: 'Chi tiết thẻ',
    backToList: 'Quay lại',
    selectCardPrompt: 'Chọn một thẻ từ danh sách bên trái để xem thông tin chi tiết.',
    noCardsFound: 'Chưa có thẻ nào trong hệ thống',
    noCardsPrompt: 'Thêm thẻ mới tại mục Quản lý Thẻ để bắt đầu theo dõi.',
  },

  // Màn hình Cài đặt (Settings)
  settings: {
    title: 'Cài đặt hệ thống',
    subtitle: 'Tùy chỉnh các ngưỡng cảnh báo, danh sách ngân hàng, danh mục và bảo mật tài khoản',
    tabThresholds: 'Ngưỡng cảnh báo',
    tabLists: 'Ngân hàng & Danh mục',
    tabBanks: 'Ngân hàng',
    tabCategories: 'Danh mục',
    tabAccount: 'Tài khoản',
    tabPassword: 'Đổi mật khẩu',
    tabExport: 'Xuất tệp dữ liệu',

    utilizationThresholds: 'Ngưỡng tỷ lệ sử dụng hạn mức',
    mild: 'Cảnh báo nhẹ (%)',
    warning: 'Cảnh báo (%)',
    danger: 'Nguy hiểm (%)',
    dueSoonDays: 'Số ngày cảnh báo sắp đến hạn thanh toán',
    nearCapThreshold: 'Ngưỡng cảnh báo gần đạt mức tối đa (%)',
    saveThresholds: 'Lưu cấu hình ngưỡng',
    saveSuccess: 'Đã lưu cấu hình cài đặt thành công!',

    bankList: 'Danh sách Ngân hàng',
    categoryList: 'Danh mục chi tiêu',
    addBank: 'Nhập tên ngân hàng mới...',
    addCategory: 'Nhập danh mục mới...',

    accountSecurity: 'Đổi mật khẩu tài khoản quản trị',
    currentPassword: 'Mật khẩu hiện tại',
    newPassword: 'Mật khẩu mới',
    confirmNewPassword: 'Xác nhận mật khẩu mới',
    updatePassword: 'Cập nhật mật khẩu mới',
    passwordChangedSuccess: 'Đổi mật khẩu thành công!',

    exportExcelTitle: 'Xuất toàn bộ dữ liệu ra tệp Excel',
    exportExcelDesc: 'Bao gồm đầy đủ các sheet: Danh sách Thẻ, Quy tắc hoàn tiền, Danh mục mã ngành hàng và Toàn bộ Sổ giao dịch chi tiết kèm kết quả tính hoàn tiền.',
    downloadExcel: 'Tải xuống tệp Excel (.xlsx)',
  },

  // Ánh xạ trạng thái hiển thị
  status: {
    card: {
      Active: 'Đang dùng',
      Inactive: 'Tạm ngưng',
      Closed: 'Đã đóng',
    },
    transaction: {
      Posted: 'Đã ghi nhận',
      Pending: 'Đang chờ',
      Cancelled: 'Đã hủy',
    },
    cashback: {
      'Được hoàn': 'Được hoàn',
      'Hoàn một phần': 'Hoàn một phần',
      'Đã đạt mức tối đa': 'Đã đạt mức tối đa',
      'Đã đạt cap': 'Đã đạt mức tối đa',
      'Không được hoàn': 'Không được hoàn',
      'Đã hủy': 'Đã hủy',
    },
    payment: {
      'Chưa thanh toán': 'Chưa thanh toán',
      'Đã thanh toán': 'Đã thanh toán',
    },
    utilization: {
      'Bình thường': 'Bình thường',
      'Cảnh báo nhẹ': 'Cảnh báo nhẹ',
      'Cảnh báo': 'Cảnh báo',
      'Nguy hiểm': 'Nguy hiểm',
    },
  },

  // Thông báo lỗi chuẩn tiếng Việt
  errors: {
    fieldRequired: 'Vui lòng điền thông tin trường này.',
    passwordMismatch: 'Xác nhận mật khẩu mới không khớp.',
    passwordLength: 'Mật khẩu mới phải có tối thiểu 10 ký tự.',
    passwordChangeFailed: 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.',
    networkError: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
  }
};

/**
 * Hàm ánh xạ trạng thái sang tiếng Việt an toàn
 */
export function mapCardStatus(status: string | undefined): string {
  if (!status) return vi.status.card.Active;
  return (vi.status.card as any)[status] || status;
}

export function mapTransactionStatus(status: string | undefined): string {
  if (!status) return vi.status.transaction.Posted;
  return (vi.status.transaction as any)[status] || status;
}

export function mapCashbackStatus(status: string | undefined): string {
  if (!status) return vi.status.cashback['Được hoàn'];
  return (vi.status.cashback as any)[status] || status;
}

export function mapPaymentStatus(status: string | undefined): string {
  if (!status) return vi.status.payment['Chưa thanh toán'];
  return (vi.status.payment as any)[status] || status;
}

export function mapUtilizationLevel(level: string | undefined): string {
  if (!level) return vi.status.utilization['Bình thường'];
  return (vi.status.utilization as any)[level] || level;
}
