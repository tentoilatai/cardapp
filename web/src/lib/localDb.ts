import type {
  Card,
  Mcc,
  CashbackRule,
  Transaction,
  TransactionPreviewRequest,
  TransactionPreviewResponse,
  DashboardData,
  MonthViewData,
  AppSettings,
  User
} from '../types';
import seedDataRaw from '../data/seedData.json';

const STORAGE_KEYS = {
  CARDS: 'mycard_cards_v1',
  MCCS: 'mycard_mccs_v1',
  RULES: 'mycard_rules_v1',
  TRANSACTIONS: 'mycard_transactions_v1',
  SETTINGS: 'mycard_settings_v1',
  USER: 'mycard_user_v1',
  USERS: 'mycard_users_v1',
  LOCAL_MODE: 'mycard_local_mode_v1',
  INITIALIZED: 'mycard_initialized_v1'
};

export interface StoredUser {
  id: string;
  username: string;
  password?: string;
  fullName?: string;
  roles: string[];
  mustChangePassword?: boolean;
  createdAt: string;
}

// Billing and schedule helpers
export function calculateStatementDate(transactionDateStr: string, statementDay: number): string {
  const d = new Date(transactionDateStr);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed
  const day = d.getDate();

  const clampStatementDay = Math.min(Math.max(statementDay, 1), 31);
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const actualDayThisMonth = Math.min(clampStatementDay, daysInCurrentMonth);

  if (day <= actualDayThisMonth) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(actualDayThisMonth).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

  // Next month
  const nextMonthDate = new Date(year, month + 1, 1);
  const nextYear = nextMonthDate.getFullYear();
  const nextMonth = nextMonthDate.getMonth();
  const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
  const actualDayNextMonth = Math.min(clampStatementDay, daysInNextMonth);
  const mm = String(nextMonth + 1).padStart(2, '0');
  const dd = String(actualDayNextMonth).padStart(2, '0');
  return `${nextYear}-${mm}-${dd}`;
}

export function calculatePaymentDueDate(statementDateStr: string, statementDay: number, paymentDueDay: number): string {
  const d = new Date(statementDateStr);
  const year = d.getFullYear();
  const month = d.getMonth();

  const clampDueDay = Math.min(Math.max(paymentDueDay, 1), 31);
  const clampStatementDay = Math.min(Math.max(statementDay, 1), 31);

  if (clampDueDay > clampStatementDay) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const actualDueDay = Math.min(clampDueDay, daysInMonth);
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(actualDueDay).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  } else {
    const nextMonthDate = new Date(year, month + 1, 1);
    const nextYear = nextMonthDate.getFullYear();
    const nextMonth = nextMonthDate.getMonth();
    const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
    const actualDueDay = Math.min(clampDueDay, daysInNextMonth);
    const mm = String(nextMonth + 1).padStart(2, '0');
    const dd = String(actualDueDay).padStart(2, '0');
    return `${nextYear}-${mm}-${dd}`;
  }
}

export function getPaymentStatus(unpaidBalance: number, paymentDueDateStr: string, refDateStr: string, dueSoonDays = 5): string {
  if (unpaidBalance <= 0) return 'Đã thanh toán';

  const due = new Date(paymentDueDateStr).getTime();
  const ref = new Date(refDateStr).getTime();
  const diffDays = Math.ceil((due - ref) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Quá hạn';
  if (diffDays === 0) return 'Đến hạn';
  if (diffDays <= dueSoonDays) return 'Sắp đến hạn';
  return 'Chưa đến hạn';
}

export function getUtilizationLevel(utilization: number, mild = 0.5, warning = 0.7, danger = 0.9): string {
  if (utilization > danger) return 'Nguy hiểm';
  if (utilization >= warning) return 'Cảnh báo';
  if (utilization >= mild) return 'Cảnh báo nhẹ';
  return 'Bình thường';
}

export function getMonthKey(dateStr: string): number {
  const d = new Date(dateStr);
  return d.getFullYear() * 100 + (d.getMonth() + 1);
}

// Local Database Store
class LocalDatabase {
  private memoryFallback: Record<string, string> = {};

  private getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // ignore
    }
    return this.memoryFallback[key] || null;
  }

  private setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // ignore
    }
    this.memoryFallback[key] = value;
  }

  public isLocalModeEnabled(): boolean {
    const val = this.getItem(STORAGE_KEYS.LOCAL_MODE);
    if (val === null) return true; // Default to local offline enabled
    return val === 'true';
  }

  public setLocalMode(enabled: boolean): void {
    this.setItem(STORAGE_KEYS.LOCAL_MODE, String(enabled));
  }

  private getActiveUsername(): string {
    const user = this.getUser();
    return (user?.username || 'taitv').trim().toLowerCase();
  }

  private getUserKey(baseKey: string, specificUsername?: string): string {
    const u = (specificUsername || this.getActiveUsername()).toLowerCase();
    return `mycard_u_${u}_${baseKey}`;
  }

  public init() {
    const initialized = this.getItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized) {
      this.resetToSeedData();
    }
  }

  public resetToSeedData() {
    const seed = seedDataRaw as any;
    
    // Seed default user 'taitv'
    const taitvKey = (k: string) => `mycard_u_taitv_${k}`;
    this.setItem(taitvKey('cards'), JSON.stringify(seed.cards || []));
    this.setItem(taitvKey('rules'), JSON.stringify(seed.cashbackRules || []));
    this.setItem(taitvKey('transactions'), JSON.stringify(seed.transactions || []));
    this.setItem(taitvKey('settings'), JSON.stringify(seed.settings || {
      id: 1,
      utilizationMildThreshold: 0.5,
      utilizationWarningThreshold: 0.7,
      utilizationDangerThreshold: 0.9,
      dueSoonDays: 5,
      nearCapThreshold: 0.8,
      banks: ['Techcombank', 'OCB', 'ACB', 'UOB', 'VIB', 'Shinhan Bank', 'HSBC', 'VPBank', 'TPBank', 'Sacombank', 'Vietcombank', 'MB Bank', 'BIDV', 'VietinBank', 'Cake by VPBank', 'Timo by BVBank'],
      categories: ['Groceries', 'Dining', 'Online', 'Transport', 'Fuel', 'Utilities', 'Travel', 'Health', 'Education', 'Shopping', 'Entertainment', 'Insurance', 'Other']
    }));

    // Seed shared MCC catalog
    this.setItem(STORAGE_KEYS.MCCS, JSON.stringify(seed.mccs || []));

    // Active user session
    this.setItem(STORAGE_KEYS.USER, JSON.stringify({
      id: 'user-default',
      username: 'taitv',
      fullName: 'Tài TV',
      roles: ['Admin'],
      mustChangePassword: false
    }));

    // Registered users list
    this.setItem(STORAGE_KEYS.USERS, JSON.stringify([
      {
        id: 'user-default',
        username: 'taitv',
        password: '123',
        fullName: 'Tài TV',
        roles: ['Admin'],
        mustChangePassword: false,
        createdAt: new Date().toISOString()
      }
    ]));
    this.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  // Raw entity access - 100% ISOLATED PER USER
  public getCards(): Card[] {
    this.init();
    const key = this.getUserKey('cards');
    const data = this.getItem(key);
    if (data !== null) {
      try {
        return JSON.parse(data);
      } catch {
        return [];
      }
    }

    // Backward compatibility for taitv legacy keys
    if (this.getActiveUsername() === 'taitv') {
      const legacyData = this.getItem(STORAGE_KEYS.CARDS);
      if (legacyData) {
        try {
          const cards = JSON.parse(legacyData);
          this.setCards(cards);
          return cards;
        } catch {
          // ignore
        }
      }
      const seed = seedDataRaw as any;
      const seedCards = seed.cards || [];
      this.setCards(seedCards);
      return seedCards;
    }

    return [];
  }

  public setCards(cards: Card[]): void {
    const key = this.getUserKey('cards');
    this.setItem(key, JSON.stringify(cards));
  }

  public getMccs(): Mcc[] {
    this.init();
    try {
      const stored = this.getItem(STORAGE_KEYS.MCCS);
      if (stored) return JSON.parse(stored);
      const seed = seedDataRaw as any;
      return seed.mccs || [];
    } catch {
      return [];
    }
  }

  public setMccs(mccs: Mcc[]): void {
    this.setItem(STORAGE_KEYS.MCCS, JSON.stringify(mccs));
  }

  public getRules(): CashbackRule[] {
    this.init();
    const key = this.getUserKey('rules');
    const data = this.getItem(key);
    if (data !== null) {
      try {
        return JSON.parse(data);
      } catch {
        return [];
      }
    }

    // Backward compatibility for taitv legacy keys
    if (this.getActiveUsername() === 'taitv') {
      const legacyData = this.getItem(STORAGE_KEYS.RULES);
      if (legacyData) {
        try {
          const rules = JSON.parse(legacyData);
          this.setRules(rules);
          return rules;
        } catch {
          // ignore
        }
      }
      const seed = seedDataRaw as any;
      const seedRules = seed.cashbackRules || [];
      this.setRules(seedRules);
      return seedRules;
    }

    return [];
  }

  public setRules(rules: CashbackRule[]): void {
    const key = this.getUserKey('rules');
    this.setItem(key, JSON.stringify(rules));
  }

  public getTransactions(): Transaction[] {
    this.init();
    const key = this.getUserKey('transactions');
    const data = this.getItem(key);
    if (data !== null) {
      try {
        return JSON.parse(data);
      } catch {
        return [];
      }
    }

    // Backward compatibility for taitv legacy keys
    if (this.getActiveUsername() === 'taitv') {
      const legacyData = this.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (legacyData) {
        try {
          const txs = JSON.parse(legacyData);
          this.setTransactions(txs);
          return txs;
        } catch {
          // ignore
        }
      }
      const seed = seedDataRaw as any;
      const seedTxs = seed.transactions || [];
      this.setTransactions(seedTxs);
      return seedTxs;
    }

    return [];
  }

  public setTransactions(txs: Transaction[]): void {
    const key = this.getUserKey('transactions');
    this.setItem(key, JSON.stringify(txs));
  }

  public getSettings(): AppSettings {
    this.init();
    const key = this.getUserKey('settings');
    const data = this.getItem(key);
    if (data !== null) {
      try {
        return JSON.parse(data);
      } catch {
        // fallback
      }
    }

    const defaultSettings: AppSettings = {
      id: 1,
      utilizationMildThreshold: 0.5,
      utilizationWarningThreshold: 0.7,
      utilizationDangerThreshold: 0.9,
      dueSoonDays: 5,
      nearCapThreshold: 0.8,
      banks: ['Techcombank', 'OCB', 'ACB', 'UOB', 'VIB', 'Shinhan Bank', 'HSBC', 'VPBank', 'TPBank', 'Sacombank', 'Vietcombank', 'MB Bank', 'BIDV', 'VietinBank', 'Cake by VPBank', 'Timo by BVBank'],
      categories: ['Groceries', 'Dining', 'Online', 'Transport', 'Fuel', 'Utilities', 'Travel', 'Health', 'Education', 'Shopping', 'Entertainment', 'Insurance', 'Other']
    };

    // Initialize for active user
    this.setSettings(defaultSettings);
    return defaultSettings;
  }

  public setSettings(s: AppSettings): void {
    const key = this.getUserKey('settings');
    this.setItem(key, JSON.stringify(s));
  }

  public getUser(): User | null {
    try {
      const raw = this.getItem(STORAGE_KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public setUser(u: User | null): void {
    this.setItem(STORAGE_KEYS.USER, JSON.stringify(u));
  }

  public getUsers(): StoredUser[] {
    this.init();
    try {
      const list = JSON.parse(this.getItem(STORAGE_KEYS.USERS) || '[]');
      if (!Array.isArray(list) || list.length === 0) {
        const defaultUser: StoredUser = {
          id: 'user-default',
          username: 'taitv',
          password: '123',
          fullName: 'Tài TV',
          roles: ['Admin'],
          mustChangePassword: false,
          createdAt: new Date().toISOString()
        };
        this.setUsers([defaultUser]);
        return [defaultUser];
      }
      return list;
    } catch {
      return [];
    }
  }

  public setUsers(users: StoredUser[]): void {
    this.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  public findUserByUsername(username: string): StoredUser | null {
    if (!username) return null;
    const users = this.getUsers();
    const cleanName = username.trim().toLowerCase();
    return users.find((u) => u.username.toLowerCase() === cleanName) || null;
  }

  public registerUser(data: { username: string; password?: string; fullName?: string }): User {
    const users = this.getUsers();
    const cleanUsername = data.username.trim();
    const existing = users.find((u) => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (existing) {
      throw new Error('Tên đăng nhập đã tồn tại, vui lòng chọn tên khác.');
    }

    const newUserRecord: StoredUser = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      password: data.password || '123456',
      fullName: data.fullName?.trim() || cleanUsername,
      roles: ['User'],
      mustChangePassword: false,
      createdAt: new Date().toISOString()
    };

    users.push(newUserRecord);
    this.setUsers(users);

    const activeUser: User = {
      id: newUserRecord.id,
      username: newUserRecord.username,
      fullName: newUserRecord.fullName,
      roles: newUserRecord.roles,
      mustChangePassword: false
    };

    // Set active user session
    this.setUser(activeUser);

    // Initialize isolated empty datasets for this user
    this.setItem(this.getUserKey('cards', cleanUsername), JSON.stringify([]));
    this.setItem(this.getUserKey('rules', cleanUsername), JSON.stringify([]));
    this.setItem(this.getUserKey('transactions', cleanUsername), JSON.stringify([]));
    this.setItem(this.getUserKey('settings', cleanUsername), JSON.stringify({
      id: 1,
      utilizationMildThreshold: 0.5,
      utilizationWarningThreshold: 0.7,
      utilizationDangerThreshold: 0.9,
      dueSoonDays: 5,
      nearCapThreshold: 0.8,
      banks: ['Techcombank', 'OCB', 'ACB', 'UOB', 'VIB', 'Shinhan Bank', 'HSBC', 'VPBank', 'TPBank', 'Sacombank', 'Vietcombank', 'MB Bank', 'BIDV', 'VietinBank', 'Cake by VPBank', 'Timo by BVBank'],
      categories: ['Groceries', 'Dining', 'Online', 'Transport', 'Fuel', 'Utilities', 'Travel', 'Health', 'Education', 'Shopping', 'Entertainment', 'Insurance', 'Other']
    }));

    return activeUser;
  }

  public verifyCredentials(username: string, password?: string): User | null {
    const cleanUsername = username.trim();
    const user = this.findUserByUsername(cleanUsername);
    if (!user) {
      // If user doesn't exist yet, register them with their own isolated data
      return this.registerUser({
        username: cleanUsername,
        password: password || '123456',
        fullName: cleanUsername
      });
    }

    // If password matches or user has no password set
    if (!user.password || user.password === password) {
      const activeUser: User = {
        id: user.id,
        username: user.username,
        fullName: user.fullName || user.username,
        roles: user.roles,
        mustChangePassword: !!user.mustChangePassword
      };
      this.setUser(activeUser);
      return activeUser;
    }

    // Wrong password
    return null;
  }

  public updateUserPassword(username: string, currentPassword?: string, newPassword?: string): boolean {
    if (!newPassword) throw new Error('Vui lòng nhập mật khẩu mới');
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (idx === -1) {
      throw new Error('Không tìm thấy tài khoản người dùng');
    }

    const targetUser = users[idx];
    if (targetUser.password && currentPassword && targetUser.password !== currentPassword) {
      throw new Error('Mật khẩu hiện tại không chính xác');
    }

    targetUser.password = newPassword;
    targetUser.mustChangePassword = false;
    users[idx] = targetUser;
    this.setUsers(users);

    const currentUser = this.getUser();
    if (currentUser && currentUser.username.toLowerCase() === username.trim().toLowerCase()) {
      currentUser.mustChangePassword = false;
      this.setUser(currentUser);
    }
    return true;
  }

  // Recalculate all transactions for a card in a given month
  public recalculateMonthTransactions(cardId: string, monthKey: number): void {
    const allTxs = this.getTransactions();
    const card = this.getCards().find((c) => c.id === cardId);
    const rules = this.getRules().filter((r) => r.cardId === cardId);

    const monthTxs = allTxs
      .filter((t) => t.cardId === cardId && t.monthKey === monthKey)
      .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

    const groupCumulativeCashback: Record<string, number> = {};
    const groupCumulativeEligible: Record<string, number> = {};
    let cardCumulativeCashback = 0;

    for (const tx of monthTxs) {
      if (tx.status === 'Cancelled') {
        tx.rate = 0;
        tx.eligibleAmount = 0;
        tx.theoreticalCashback = 0;
        tx.actualCashback = 0;
        tx.matchedRuleId = null;
        tx.groupName = null;
        tx.cashbackStatus = 'Đã hủy';
        if (card) {
          tx.statementDate = calculateStatementDate(tx.date, card.statementDay);
          tx.paymentDueDate = calculatePaymentDueDate(tx.statementDate, card.statementDay, card.paymentDueDay);
        }
        continue;
      }

      // Match rule
      let matchedRule: CashbackRule | undefined;
      if (tx.overrideRuleId) {
        matchedRule = rules.find((r) => r.id === tx.overrideRuleId);
      }
      if (!matchedRule) {
        matchedRule = rules.find(
          (r) =>
            r.mccCode === tx.mccCode &&
            (!r.startDate || r.startDate <= tx.date) &&
            (!r.endDate || r.endDate >= tx.date) &&
            (!r.minTransaction || tx.amount >= r.minTransaction)
        );
      }

      if (card) {
        tx.statementDate = calculateStatementDate(tx.date, card.statementDay);
        tx.paymentDueDate = calculatePaymentDueDate(tx.statementDate, card.statementDay, card.paymentDueDay);
      }

      if (!matchedRule) {
        tx.matchedRuleId = null;
        tx.groupName = null;
        tx.rate = 0;
        tx.eligibleAmount = 0;
        tx.theoreticalCashback = 0;
        tx.actualCashback = 0;
        tx.cashbackStatus = 'Không được hoàn';
        continue;
      }

      tx.matchedRuleId = matchedRule.id;
      tx.groupName = matchedRule.groupName;
      tx.rate = matchedRule.rate;

      const groupName = matchedRule.groupName || 'Default';
      const curGroupCashback = groupCumulativeCashback[groupName] || 0;
      const curGroupEligible = groupCumulativeEligible[groupName] || 0;

      // Group max eligible spending cap
      let eligibleSpend = tx.amount;
      if (matchedRule.maxEligibleSpending !== null && matchedRule.maxEligibleSpending !== undefined) {
        const remainingEligible = Math.max(0, matchedRule.maxEligibleSpending - curGroupEligible);
        eligibleSpend = Math.min(tx.amount, remainingEligible);
      }
      tx.eligibleAmount = eligibleSpend;

      const theoretical = eligibleSpend * matchedRule.rate;
      tx.theoreticalCashback = theoretical;

      // Group cashback cap
      let groupCapRemaining = Infinity;
      if (matchedRule.maxCashbackPerGroupPerMonth !== null && matchedRule.maxCashbackPerGroupPerMonth !== undefined) {
        groupCapRemaining = Math.max(0, matchedRule.maxCashbackPerGroupPerMonth - curGroupCashback);
      }

      // Card cashback cap
      let cardCapRemaining = Infinity;
      if (matchedRule.maxCashbackPerCardPerMonth !== null && matchedRule.maxCashbackPerCardPerMonth !== undefined) {
        cardCapRemaining = Math.max(0, matchedRule.maxCashbackPerCardPerMonth - cardCumulativeCashback);
      }

      const actual = Math.min(theoretical, groupCapRemaining, cardCapRemaining);
      tx.actualCashback = actual;

      if (actual >= theoretical && theoretical > 0) {
        tx.cashbackStatus = 'Được hoàn';
      } else if (actual > 0) {
        tx.cashbackStatus = 'Hoàn một phần';
      } else if (theoretical > 0) {
        tx.cashbackStatus = 'Đã đạt cap';
      } else {
        tx.cashbackStatus = 'Không được hoàn';
      }

      groupCumulativeCashback[groupName] = curGroupCashback + actual;
      groupCumulativeEligible[groupName] = curGroupEligible + eligibleSpend;
      cardCumulativeCashback += actual;
    }

    // Save back
    const txMap = new Map(monthTxs.map((t) => [t.id, t]));
    const updatedAll = allTxs.map((t) => txMap.get(t.id) || t);
    this.setTransactions(updatedAll);
  }

  // Preview cashback calculation
  public previewCashback(req: TransactionPreviewRequest): TransactionPreviewResponse {
    const rules = this.getRules().filter((r) => r.cardId === req.cardId);
    const monthKey = getMonthKey(req.date);

    let matchedRule: CashbackRule | undefined;
    if (req.overrideRuleId) {
      matchedRule = rules.find((r) => r.id === req.overrideRuleId);
    }
    if (!matchedRule) {
      matchedRule = rules.find(
        (r) =>
          r.mccCode === req.mccCode &&
          (!r.startDate || r.startDate <= req.date) &&
          (!r.endDate || r.endDate >= req.date) &&
          (!r.minTransaction || req.amount >= r.minTransaction)
      );
    }

    if (!matchedRule) {
      return {
        matchedRuleId: null,
        groupName: null,
        rate: 0,
        eligibleAmount: 0,
        theoreticalCashback: 0,
        actualCashback: 0,
        cashbackStatus: 'Không được hoàn',
        remainingGroupCap: null,
        remainingCardCap: null,
        remainingEligibleSpending: null
      };
    }

    // Tally current month cashback
    const monthTxs = this.getTransactions().filter(
      (t) => t.cardId === req.cardId && t.monthKey === monthKey && t.status !== 'Cancelled'
    );

    const groupName = matchedRule.groupName || 'Default';
    const groupTxs = monthTxs.filter((t) => (t.groupName || '') === groupName);
    const currentGroupCashback = groupTxs.reduce((sum, t) => sum + (t.actualCashback || 0), 0);
    const currentGroupEligible = groupTxs.reduce((sum, t) => sum + (t.eligibleAmount || 0), 0);
    const currentCardCashback = monthTxs.reduce((sum, t) => sum + (t.actualCashback || 0), 0);

    let eligibleSpend = req.amount;
    let remainingEligibleSpending: number | null = null;
    if (matchedRule.maxEligibleSpending !== null && matchedRule.maxEligibleSpending !== undefined) {
      remainingEligibleSpending = Math.max(0, matchedRule.maxEligibleSpending - currentGroupEligible);
      eligibleSpend = Math.min(req.amount, remainingEligibleSpending);
    }

    const theoretical = eligibleSpend * matchedRule.rate;
    let remainingGroupCap: number | null = null;
    let groupCapLimit = Infinity;
    if (matchedRule.maxCashbackPerGroupPerMonth !== null && matchedRule.maxCashbackPerGroupPerMonth !== undefined) {
      remainingGroupCap = Math.max(0, matchedRule.maxCashbackPerGroupPerMonth - currentGroupCashback);
      groupCapLimit = remainingGroupCap;
    }

    let remainingCardCap: number | null = null;
    let cardCapLimit = Infinity;
    if (matchedRule.maxCashbackPerCardPerMonth !== null && matchedRule.maxCashbackPerCardPerMonth !== undefined) {
      remainingCardCap = Math.max(0, matchedRule.maxCashbackPerCardPerMonth - currentCardCashback);
      cardCapLimit = remainingCardCap;
    }

    const actual = Math.min(theoretical, groupCapLimit, cardCapLimit);
    let cashbackStatus = 'Không được hoàn';
    if (actual >= theoretical && theoretical > 0) {
      cashbackStatus = 'Được hoàn';
    } else if (actual > 0) {
      cashbackStatus = 'Hoàn một phần';
    } else if (theoretical > 0) {
      cashbackStatus = 'Đã đạt cap';
    }

    return {
      matchedRuleId: matchedRule.id,
      groupName: matchedRule.groupName,
      rate: matchedRule.rate,
      eligibleAmount: eligibleSpend,
      theoreticalCashback: theoretical,
      actualCashback: actual,
      cashbackStatus,
      remainingGroupCap,
      remainingCardCap,
      remainingEligibleSpending
    };
  }

  // Dashboard Aggregation
  public getDashboardData(monthKey?: number): DashboardData {
    const now = new Date();
    const curMonthKey = monthKey || now.getFullYear() * 100 + (now.getMonth() + 1);
    const todayStr = now.toISOString().split('T')[0];

    const cards = this.getCards();
    const allTxs = this.getTransactions();
    const settings = this.getSettings();
    const rules = this.getRules();

    const monthTxs = allTxs.filter((t) => t.monthKey === curMonthKey && t.status !== 'Cancelled');
    const totalCreditLimit = cards.reduce((sum, c) => sum + (c.creditLimit || 0), 0);

    // Compute used credit per card (total unpaid or current active cycle transactions)
    const cardUsageMap: Record<string, { used: number; monthSpend: number; monthCashback: number }> = {};
    for (const c of cards) {
      cardUsageMap[c.id] = { used: 0, monthSpend: 0, monthCashback: 0 };
    }

    for (const tx of allTxs) {
      if (tx.status !== 'Cancelled') {
        if (!cardUsageMap[tx.cardId]) {
          cardUsageMap[tx.cardId] = { used: 0, monthSpend: 0, monthCashback: 0 };
        }
        if (tx.paymentStatus !== 'Đã thanh toán') {
          cardUsageMap[tx.cardId].used += tx.amount;
        }
        if (tx.monthKey === curMonthKey) {
          cardUsageMap[tx.cardId].monthSpend += tx.amount;
          cardUsageMap[tx.cardId].monthCashback += tx.actualCashback || 0;
        }
      }
    }

    const totalUsedCredit = Object.values(cardUsageMap).reduce((sum, v) => sum + v.used, 0);
    const totalAvailableCredit = Math.max(0, totalCreditLimit - totalUsedCredit);
    const averageUtilization = totalCreditLimit > 0 ? totalUsedCredit / totalCreditLimit : 0;

    const monthTotalSpending = monthTxs.reduce((sum, t) => sum + t.amount, 0);
    const monthTheoreticalCashback = monthTxs.reduce((sum, t) => sum + (t.theoreticalCashback || 0), 0);
    const monthActualCashback = monthTxs.reduce((sum, t) => sum + (t.actualCashback || 0), 0);
    const monthRemainingCashback = Math.max(0, monthTheoreticalCashback - monthActualCashback);

    // Spending by card
    const spendingByCard = cards.map((c) => ({
      cardId: c.id,
      cardName: c.name,
      bank: c.bank,
      spending: cardUsageMap[c.id]?.monthSpend || 0
    })).sort((a, b) => b.spending - a.spending);

    // Cashback by card
    const cashbackByCard = cards.map((c) => {
      const cardRule = rules.find((r) => r.cardId === c.id && r.maxCashbackPerCardPerMonth);
      return {
        cardId: c.id,
        cardName: c.name,
        bank: c.bank,
        actualCashback: cardUsageMap[c.id]?.monthCashback || 0,
        cardCap: cardRule ? cardRule.maxCashbackPerCardPerMonth : null
      };
    }).sort((a, b) => b.actualCashback - a.actualCashback);

    // Spending by category
    const mccs = this.getMccs();
    const mccMap = new Map(mccs.map((m) => [m.code, m]));
    const categorySpendMap: Record<string, number> = {};

    for (const tx of monthTxs) {
      const mcc = mccMap.get(tx.mccCode);
      const cat = tx.category || mcc?.category || 'Khác';
      categorySpendMap[cat] = (categorySpendMap[cat] || 0) + tx.amount;
    }

    const spendingByCategory = Object.entries(categorySpendMap).map(([category, spending]) => ({
      category,
      spending,
      percentage: monthTotalSpending > 0 ? (spending / monthTotalSpending) * 100 : 0
    })).sort((a, b) => b.spending - a.spending);

    // Limit usage by card
    let cardsNearLimitCount = 0;
    const limitUsageByCard = cards.map((c) => {
      const used = cardUsageMap[c.id]?.used || 0;
      const util = c.creditLimit > 0 ? used / c.creditLimit : 0;
      if (util >= settings.utilizationWarningThreshold) {
        cardsNearLimitCount++;
      }
      return {
        cardId: c.id,
        cardName: c.name,
        bank: c.bank,
        creditLimit: c.creditLimit,
        usedCredit: used,
        availableCredit: Math.max(0, c.creditLimit - used),
        utilization: util,
        utilizationLevel: getUtilizationLevel(
          util,
          settings.utilizationMildThreshold,
          settings.utilizationWarningThreshold,
          settings.utilizationDangerThreshold
        )
      };
    });

    // Cap progress by card
    let cardsNearCapCount = 0;
    const capProgressByCard = cards.map((c) => {
      const actualCashback = cardUsageMap[c.id]?.monthCashback || 0;
      const cardRule = rules.find((r) => r.cardId === c.id && r.maxCashbackPerCardPerMonth);
      const cardCap = cardRule?.maxCashbackPerCardPerMonth || null;
      const pct = cardCap && cardCap > 0 ? Math.min(100, (actualCashback / cardCap) * 100) : 0;
      if (cardCap && actualCashback / cardCap >= settings.nearCapThreshold) {
        cardsNearCapCount++;
      }
      return {
        cardId: c.id,
        cardName: c.name,
        bank: c.bank,
        actualCashback,
        cardCap,
        progressPercentage: pct
      };
    });

    // Card status summaries
    let cardsNeedingPaymentAttentionCount = 0;
    const cardStatuses = cards.map((c) => {
      const used = cardUsageMap[c.id]?.used || 0;
      const util = c.creditLimit > 0 ? used / c.creditLimit : 0;
      const stDate = calculateStatementDate(todayStr, c.statementDay);
      const dueDate = calculatePaymentDueDate(stDate, c.statementDay, c.paymentDueDay);
      const payStatus = getPaymentStatus(used, dueDate, todayStr, settings.dueSoonDays);
      const diffDays = Math.ceil((new Date(dueDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));

      if (payStatus === 'Quá hạn' || payStatus === 'Đến hạn' || payStatus === 'Sắp đến hạn') {
        cardsNeedingPaymentAttentionCount++;
      }

      const cardRule = rules.find((r) => r.cardId === c.id && r.maxCashbackPerCardPerMonth);

      return {
        cardId: c.id,
        cardName: c.name,
        bank: c.bank,
        creditLimit: c.creditLimit,
        usedCredit: used,
        utilization: util,
        utilizationLevel: getUtilizationLevel(
          util,
          settings.utilizationMildThreshold,
          settings.utilizationWarningThreshold,
          settings.utilizationDangerThreshold
        ),
        monthActualCashback: cardUsageMap[c.id]?.monthCashback || 0,
        cardCap: cardRule?.maxCashbackPerCardPerMonth || null,
        monthSpending: cardUsageMap[c.id]?.monthSpend || 0,
        latestStatementDate: stDate,
        paymentDueDate: dueDate,
        daysRemaining: diffDays,
        paymentStatus: payStatus,
        cardStatus: c.status
      };
    });

    // Monthly Trends (past 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mKey = d.getFullYear() * 100 + (d.getMonth() + 1);
      const mLabel = `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
      const tList = allTxs.filter((t) => t.monthKey === mKey && t.status !== 'Cancelled');
      const sp = tList.reduce((sum, t) => sum + t.amount, 0);
      const theo = tList.reduce((sum, t) => sum + (t.theoreticalCashback || 0), 0);
      const act = tList.reduce((sum, t) => sum + (t.actualCashback || 0), 0);
      monthlyTrends.push({
        monthKey: mKey,
        monthLabel: mLabel,
        spending: sp,
        theoreticalCashback: theo,
        actualCashback: act
      });
    }

    return {
      monthKey: curMonthKey,
      kpis: {
        totalCards: cards.length,
        totalCreditLimit,
        totalUsedCredit,
        totalAvailableCredit,
        averageUtilization,
        monthTotalSpending,
        monthTheoreticalCashback,
        monthActualCashback,
        monthRemainingCashback,
        topCashbackCard: cashbackByCard[0]?.cardName || 'Chưa có',
        topSpendingCard: spendingByCard[0]?.cardName || 'Chưa có',
        cardsNearLimitCount,
        cardsNearCapCount,
        cardsNeedingPaymentAttentionCount
      },
      spendingByCard,
      cashbackByCard,
      spendingByCategory,
      monthlyTrends,
      limitUsageByCard,
      capProgressByCard,
      cardStatuses
    };
  }

  // Month View Aggregation
  public getMonthViewData(monthKey?: number): MonthViewData {
    const now = new Date();
    const curMonthKey = monthKey || now.getFullYear() * 100 + (now.getMonth() + 1);
    const mYear = Math.floor(curMonthKey / 100);
    const mMonth = curMonthKey % 100;
    const monthLabel = `Tháng ${mMonth}/${mYear}`;

    const cards = this.getCards();
    const rules = this.getRules();
    const mccs = this.getMccs();
    const mccMap = new Map(mccs.map((m) => [m.code, m]));
    const cardMap = new Map(cards.map((c) => [c.id, c]));

    const monthTxs = this.getTransactions().filter(
      (t) => t.monthKey === curMonthKey && t.status !== 'Cancelled'
    );

    const totalSpending = monthTxs.reduce((sum, t) => sum + t.amount, 0);
    const totalTheoreticalCashback = monthTxs.reduce((sum, t) => sum + (t.theoreticalCashback || 0), 0);
    const totalActualCashback = monthTxs.reduce((sum, t) => sum + (t.actualCashback || 0), 0);
    const transactionCount = monthTxs.length;
    const overallCashbackRate = totalSpending > 0 ? totalActualCashback / totalSpending : 0;

    // Group cap progress list
    const groupCapMap: Record<string, { cardId: string; groupName: string; actual: number; eligible: number }> = {};
    for (const tx of monthTxs) {
      if (tx.groupName) {
        const key = `${tx.cardId}___${tx.groupName}`;
        if (!groupCapMap[key]) {
          groupCapMap[key] = { cardId: tx.cardId, groupName: tx.groupName, actual: 0, eligible: 0 };
        }
        groupCapMap[key].actual += tx.actualCashback || 0;
        groupCapMap[key].eligible += tx.eligibleAmount || 0;
      }
    }

    const groupCapProgressList = Object.values(groupCapMap).map((g) => {
      const card = cardMap.get(g.cardId);
      const rule = rules.find((r) => r.cardId === g.cardId && r.groupName === g.groupName);
      const groupCap = rule?.maxCashbackPerGroupPerMonth || null;
      const maxEligibleSpending = rule?.maxEligibleSpending || null;
      const pct = groupCap && groupCap > 0 ? Math.min(100, (g.actual / groupCap) * 100) : 0;

      return {
        cardId: g.cardId,
        cardName: card?.name || g.cardId,
        bank: card?.bank || '',
        groupName: g.groupName,
        actualCashback: g.actual,
        groupCap,
        remainingGroupCap: groupCap ? Math.max(0, groupCap - g.actual) : null,
        progressPercentage: pct,
        eligibleSpending: g.eligible,
        maxEligibleSpending
      };
    });

    const createBreakdown = (groupByFn: (tx: Transaction) => { key: string; label: string }) => {
      const map: Record<string, { label: string; spending: number; actualCashback: number; count: number }> = {};
      for (const tx of monthTxs) {
        const { key, label } = groupByFn(tx);
        if (!map[key]) map[key] = { label, spending: 0, actualCashback: 0, count: 0 };
        map[key].spending += tx.amount;
        map[key].actualCashback += tx.actualCashback || 0;
        map[key].count++;
      }
      return Object.entries(map).map(([key, data]) => ({
        key,
        label: data.label,
        spending: data.spending,
        actualCashback: data.actualCashback,
        transactionCount: data.count,
        percentage: totalSpending > 0 ? (data.spending / totalSpending) * 100 : 0
      })).sort((a, b) => b.spending - a.spending);
    };

    return {
      monthKey: curMonthKey,
      monthLabel,
      summary: {
        monthKey: curMonthKey,
        monthLabel,
        totalSpending,
        totalTheoreticalCashback,
        totalActualCashback,
        transactionCount,
        overallCashbackRate
      },
      groupCapProgressList,
      breakdownByCard: createBreakdown((tx) => ({
        key: tx.cardId,
        label: cardMap.get(tx.cardId)?.name || tx.cardId
      })),
      breakdownByBank: createBreakdown((tx) => ({
        key: cardMap.get(tx.cardId)?.bank || 'Khác',
        label: cardMap.get(tx.cardId)?.bank || 'Khác'
      })),
      breakdownByMcc: createBreakdown((tx) => ({
        key: tx.mccCode,
        label: `${tx.mccCode} - ${mccMap.get(tx.mccCode)?.name || tx.mccName || 'Khác'}`
      })),
      breakdownByCategory: createBreakdown((tx) => {
        const mcc = mccMap.get(tx.mccCode);
        const cat = tx.category || mcc?.category || 'Khác';
        return { key: cat, label: cat };
      }),
      breakdownByMerchant: createBreakdown((tx) => ({
        key: tx.merchant,
        label: tx.merchant
      })),
      transactions: monthTxs
    };
  }

  // Backup & Restore
  public exportAllData(): string {
    return JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        cards: this.getCards(),
        mccs: this.getMccs(),
        cashbackRules: this.getRules(),
        transactions: this.getTransactions(),
        settings: this.getSettings()
      },
      null,
      2
    );
  }

  public importAllData(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.cards)) this.setCards(data.cards);
      if (Array.isArray(data.mccs)) this.setMccs(data.mccs);
      if (Array.isArray(data.cashbackRules)) this.setRules(data.cashbackRules);
      if (Array.isArray(data.transactions)) this.setTransactions(data.transactions);
      if (data.settings && typeof data.settings === 'object') this.setSettings(data.settings);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }
}

export const localDb = new LocalDatabase();
