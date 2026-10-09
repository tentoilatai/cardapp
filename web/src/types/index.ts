export interface User {
  id?: string;
  username: string;
  fullName?: string;
  roles: string[];
  mustChangePassword: boolean;
}

export interface Card {
  id: string;
  bank: string;
  name: string;
  cardType: string;
  network: string;
  last4: string;
  creditLimit: number;
  statementDay: number;
  paymentDueDay: number;
  openDate: string;
  annualFee: number;
  firstYearFee: number;
  status: 'Active' | 'Inactive' | 'Closed' | string;
  note?: string;
}

export interface CardStatus {
  cardId: string;
  cardName: string;
  bank: string;
  creditLimit: number;
  usedCredit: number;
  availableCredit: number;
  utilization: number;
  utilizationLevel: string;
  latestStatementDate: string;
  paymentDueDate: string;
  daysRemaining: number;
  paymentStatus: string;
  unpaidStatementBalance: number;
  status: string;
}

export interface Mcc {
  code: string;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
}

export interface CashbackRule {
  id: string;
  cardId: string;
  cardName?: string;
  bank?: string;
  groupName: string;
  categoryName: string;
  mccCode: string;
  mccName?: string;
  rate: number;
  maxCashbackPerGroupPerMonth?: number | null;
  maxCashbackPerCardPerMonth?: number | null;
  maxEligibleSpending?: number | null;
  minTransaction?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  condition?: string | null;
  note?: string | null;
}

export interface Transaction {
  id: string;
  date: string;
  monthKey: number;
  cardId: string;
  cardName?: string;
  bank?: string;
  merchant: string;
  description?: string;
  mccCode: string;
  mccName?: string;
  category?: string;
  amount: number;
  status: 'Posted' | 'Pending' | 'Cancelled' | string;
  paymentStatus: 'Chưa thanh toán' | 'Đã thanh toán' | string;
  overrideRuleId?: string | null;
  note?: string;
  matchedRuleId?: string | null;
  groupName?: string | null;
  eligibleAmount: number;
  rate: number;
  theoreticalCashback: number;
  actualCashback: number;
  cashbackStatus: 'Được hoàn' | 'Hoàn một phần' | 'Đã đạt cap' | 'Không được hoàn' | 'Đã hủy' | string;
  statementDate: string;
  paymentDueDate: string;
}

export interface TransactionPreviewRequest {
  cardId: string;
  date: string;
  mccCode: string;
  amount: number;
  overrideRuleId?: string | null;
}

export interface TransactionPreviewResponse {
  matchedRuleId?: string | null;
  groupName?: string | null;
  rate: number;
  eligibleAmount: number;
  theoreticalCashback: number;
  actualCashback: number;
  cashbackStatus: string;
  remainingGroupCap?: number | null;
  remainingCardCap?: number | null;
  remainingEligibleSpending?: number | null;
}

export interface DashboardKpis {
  totalCards: number;
  totalCreditLimit: number;
  totalUsedCredit: number;
  totalAvailableCredit: number;
  averageUtilization: number;
  monthTotalSpending: number;
  monthTheoreticalCashback: number;
  monthActualCashback: number;
  monthRemainingCashback: number;
  topCashbackCard: string;
  topSpendingCard: string;
  cardsNearLimitCount: number;
  cardsNearCapCount: number;
  cardsNeedingPaymentAttentionCount: number;
}

export interface CardSpendingSummary {
  cardId: string;
  cardName: string;
  bank: string;
  spending: number;
}

export interface CardCashbackSummary {
  cardId: string;
  cardName: string;
  bank: string;
  actualCashback: number;
  cardCap?: number | null;
}

export interface CategorySpendingSummary {
  category: string;
  spending: number;
  percentage: number;
}

export interface MonthlyTrendPoint {
  monthKey: number;
  monthLabel: string;
  spending: number;
  theoreticalCashback: number;
  actualCashback: number;
}

export interface CardLimitUsage {
  cardId: string;
  cardName: string;
  bank: string;
  creditLimit: number;
  usedCredit: number;
  availableCredit: number;
  utilization: number;
  utilizationLevel: string;
}

export interface CardCapProgress {
  cardId: string;
  cardName: string;
  bank: string;
  actualCashback: number;
  cardCap?: number | null;
  progressPercentage: number;
}

export interface CardStatusSummary {
  cardId: string;
  cardName: string;
  bank: string;
  creditLimit: number;
  usedCredit: number;
  utilization: number;
  utilizationLevel: string;
  monthActualCashback: number;
  cardCap?: number | null;
  monthSpending: number;
  latestStatementDate: string;
  paymentDueDate: string;
  daysRemaining: number;
  paymentStatus: string;
  cardStatus: string;
}

export interface DashboardData {
  monthKey: number;
  kpis: DashboardKpis;
  spendingByCard: CardSpendingSummary[];
  cashbackByCard: CardCashbackSummary[];
  spendingByCategory: CategorySpendingSummary[];
  monthlyTrends: MonthlyTrendPoint[];
  limitUsageByCard: CardLimitUsage[];
  capProgressByCard: CardCapProgress[];
  cardStatuses: CardStatusSummary[];
}

export interface MonthSummary {
  monthKey: number;
  monthLabel: string;
  totalSpending: number;
  totalTheoreticalCashback: number;
  totalActualCashback: number;
  transactionCount: number;
  overallCashbackRate: number;
}

export interface GroupCapProgress {
  cardId: string;
  cardName: string;
  bank: string;
  groupName: string;
  actualCashback: number;
  groupCap?: number | null;
  remainingGroupCap?: number | null;
  progressPercentage: number;
  eligibleSpending: number;
  maxEligibleSpending?: number | null;
}

export interface BreakdownItem {
  key: string;
  label: string;
  spending: number;
  actualCashback: number;
  transactionCount: number;
  percentage: number;
}

export interface MonthViewData {
  monthKey: number;
  monthLabel: string;
  summary: MonthSummary;
  groupCapProgressList: GroupCapProgress[];
  breakdownByCard: BreakdownItem[];
  breakdownByBank: BreakdownItem[];
  breakdownByMcc: BreakdownItem[];
  breakdownByCategory: BreakdownItem[];
  breakdownByMerchant: BreakdownItem[];
  transactions: Transaction[];
}

export interface AppSettings {
  id: number;
  utilizationMildThreshold: number;
  utilizationWarningThreshold: number;
  utilizationDangerThreshold: number;
  dueSoonDays: number;
  nearCapThreshold: number;
  banks: string[];
  categories: string[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
