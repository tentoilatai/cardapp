import { localDb, getMonthKey } from './localDb';
import type { Card, Mcc, CashbackRule, Transaction, PagedResult } from '../types';

export async function handleLocalRequest<T>(url: string, method: string, body?: any): Promise<T | null> {
  const parsedUrl = new URL(url, 'http://localhost');
  const path = parsedUrl.pathname;
  const params = parsedUrl.searchParams;

  // 1. Auth routes
  if (path === '/api/auth/me') {
    const user = localDb.getUser();
    if (!user) throw new Error('Unauthorized');
    return user as unknown as T;
  }
  if (path === '/api/auth/login') {
    const user = { username: body?.username || 'taitv', roles: ['Admin'], mustChangePassword: false };
    localDb.setUser(user);
    return user as unknown as T;
  }
  if (path === '/api/auth/logout') {
    localDb.setUser(null);
    return {} as T;
  }
  if (path === '/api/auth/change-password') {
    const user = localDb.getUser();
    if (user) {
      user.mustChangePassword = false;
      localDb.setUser(user);
    }
    return {} as T;
  }

  // 2. Cards routes
  if (path === '/api/cards' || path === '/api/cards/') {
    if (method === 'GET') {
      return localDb.getCards() as unknown as T;
    }
    if (method === 'POST') {
      const cards = localDb.getCards();
      const newCard: Card = {
        ...body,
        id: body.id || `CARD-${Date.now()}`
      };
      cards.push(newCard);
      localDb.setCards(cards);
      return newCard as unknown as T;
    }
  }
  const cardMatch = path.match(/^\/api\/cards\/([^/]+)$/);
  if (cardMatch) {
    const id = decodeURIComponent(cardMatch[1]);
    const cards = localDb.getCards();
    const index = cards.findIndex((c) => c.id.toLowerCase() === id.toLowerCase());

    if (method === 'GET') {
      if (index === -1) throw new Error('Card not found');
      return cards[index] as unknown as T;
    }
    if (method === 'PUT') {
      if (index === -1) throw new Error('Card not found');
      cards[index] = { ...cards[index], ...body, id: cards[index].id };
      localDb.setCards(cards);
      return cards[index] as unknown as T;
    }
    if (method === 'DELETE') {
      if (index !== -1) {
        cards.splice(index, 1);
        localDb.setCards(cards);
      }
      return {} as T;
    }
  }

  // 3. MCC routes
  if (path === '/api/mcc' || path === '/api/mcc/') {
    if (method === 'GET') {
      return localDb.getMccs() as unknown as T;
    }
    if (method === 'POST') {
      const mccs = localDb.getMccs();
      const newMcc: Mcc = { ...body };
      mccs.push(newMcc);
      localDb.setMccs(mccs);
      return newMcc as unknown as T;
    }
  }
  const mccMatch = path.match(/^\/api\/mcc\/([^/]+)$/);
  if (mccMatch) {
    const code = decodeURIComponent(mccMatch[1]);
    const mccs = localDb.getMccs();
    const index = mccs.findIndex((m) => m.code === code);

    if (method === 'GET') {
      if (index === -1) throw new Error('MCC not found');
      return mccs[index] as unknown as T;
    }
    if (method === 'PUT') {
      if (index === -1) throw new Error('MCC not found');
      mccs[index] = { ...mccs[index], ...body, code: mccs[index].code };
      localDb.setMccs(mccs);
      return mccs[index] as unknown as T;
    }
    if (method === 'DELETE') {
      if (index !== -1) {
        mccs.splice(index, 1);
        localDb.setMccs(mccs);
      }
      return {} as T;
    }
  }

  // 4. Cashback Rules routes
  if (path === '/api/cashback-rules' || path === '/api/cashback-rules/') {
    if (method === 'GET') {
      return localDb.getRules() as unknown as T;
    }
    if (method === 'POST') {
      const rules = localDb.getRules();
      const newRule: CashbackRule = {
        ...body,
        id: body.id || `RULE-${Date.now()}`
      };
      rules.push(newRule);
      localDb.setRules(rules);
      return newRule as unknown as T;
    }
  }
  const ruleMatch = path.match(/^\/api\/cashback-rules\/([^/]+)$/);
  if (ruleMatch) {
    const id = decodeURIComponent(ruleMatch[1]);
    const rules = localDb.getRules();
    const index = rules.findIndex((r) => r.id === id);

    if (method === 'GET') {
      if (index === -1) throw new Error('Rule not found');
      return rules[index] as unknown as T;
    }
    if (method === 'PUT') {
      if (index === -1) throw new Error('Rule not found');
      rules[index] = { ...rules[index], ...body, id: rules[index].id };
      localDb.setRules(rules);
      return rules[index] as unknown as T;
    }
    if (method === 'DELETE') {
      if (index !== -1) {
        rules.splice(index, 1);
        localDb.setRules(rules);
      }
      return {} as T;
    }
  }

  // 5. Transactions routes
  if (path === '/api/transactions/preview-cashback') {
    return localDb.previewCashback(body) as unknown as T;
  }
  if (path === '/api/transactions' || path === '/api/transactions/') {
    if (method === 'GET') {
      const monthKeyParam = params.get('monthKey');
      const cardIdParam = params.get('cardId');
      const mccCodeParam = params.get('mccCode');
      const statusParam = params.get('status');
      const cashbackStatusParam = params.get('cashbackStatus');
      const page = parseInt(params.get('page') || '1', 10);
      const pageSize = parseInt(params.get('pageSize') || '50', 10);

      let txs = localDb.getTransactions();
      const cards = localDb.getCards();
      const mccs = localDb.getMccs();
      const cardMap = new Map(cards.map((c) => [c.id, c]));
      const mccMap = new Map(mccs.map((m) => [m.code, m]));

      // Attach cardName, bank, mccName, category
      txs = txs.map((t) => ({
        ...t,
        cardName: cardMap.get(t.cardId)?.name,
        bank: cardMap.get(t.cardId)?.bank,
        mccName: mccMap.get(t.mccCode)?.name,
        category: t.category || mccMap.get(t.mccCode)?.category
      }));

      if (monthKeyParam) {
        const mk = parseInt(monthKeyParam, 10);
        txs = txs.filter((t) => t.monthKey === mk);
      }
      if (cardIdParam) {
        txs = txs.filter((t) => t.cardId === cardIdParam);
      }
      if (mccCodeParam) {
        txs = txs.filter((t) => t.mccCode === mccCodeParam);
      }
      if (statusParam) {
        txs = txs.filter((t) => t.status === statusParam);
      }
      if (cashbackStatusParam) {
        txs = txs.filter((t) => t.cashbackStatus === cashbackStatusParam);
      }

      // Sort by date desc, id desc
      txs.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

      const totalCount = txs.length;
      const start = (page - 1) * pageSize;
      const items = txs.slice(start, start + pageSize);

      const pagedResult: PagedResult<Transaction> = {
        items,
        totalCount,
        page,
        pageSize
      };
      return pagedResult as unknown as T;
    }

    if (method === 'POST') {
      const txs = localDb.getTransactions();
      const monthKey = getMonthKey(body.date);
      const newTx: Transaction = {
        ...body,
        id: body.id || `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        monthKey,
        status: body.status || 'Posted',
        paymentStatus: body.paymentStatus || 'Chưa thanh toán'
      };
      txs.push(newTx);
      localDb.setTransactions(txs);
      localDb.recalculateMonthTransactions(newTx.cardId, monthKey);

      const updated = localDb.getTransactions().find((t) => t.id === newTx.id);
      return (updated || newTx) as unknown as T;
    }
  }

  const txMatch = path.match(/^\/api\/transactions\/([^/]+)$/);
  if (txMatch) {
    const id = decodeURIComponent(txMatch[1]);
    const txs = localDb.getTransactions();
    const index = txs.findIndex((t) => t.id === id);

    if (method === 'GET') {
      if (index === -1) throw new Error('Transaction not found');
      return txs[index] as unknown as T;
    }
    if (method === 'PUT') {
      if (index === -1) throw new Error('Transaction not found');
      const oldMonthKey = txs[index].monthKey;
      const oldCardId = txs[index].cardId;
      const monthKey = getMonthKey(body.date || txs[index].date);

      txs[index] = { ...txs[index], ...body, id: txs[index].id, monthKey };
      localDb.setTransactions(txs);

      localDb.recalculateMonthTransactions(txs[index].cardId, monthKey);
      if (oldMonthKey !== monthKey || oldCardId !== txs[index].cardId) {
        localDb.recalculateMonthTransactions(oldCardId, oldMonthKey);
      }

      const updated = localDb.getTransactions().find((t) => t.id === id);
      return (updated || txs[index]) as unknown as T;
    }
    if (method === 'DELETE') {
      if (index !== -1) {
        const oldMonthKey = txs[index].monthKey;
        const oldCardId = txs[index].cardId;
        txs.splice(index, 1);
        localDb.setTransactions(txs);
        localDb.recalculateMonthTransactions(oldCardId, oldMonthKey);
      }
      return {} as T;
    }
  }

  // 6. Dashboard route
  if (path === '/api/dashboard') {
    const monthKeyParam = params.get('monthKey');
    const monthKey = monthKeyParam ? parseInt(monthKeyParam, 10) : undefined;
    return localDb.getDashboardData(monthKey) as unknown as T;
  }

  // 7. Month View routes
  if (path === '/api/months/summary') {
    const monthKeyParam = params.get('monthKey');
    const monthKey = monthKeyParam ? parseInt(monthKeyParam, 10) : undefined;
    return localDb.getMonthViewData(monthKey) as unknown as T;
  }
  const monthViewMatch = path.match(/^\/api\/months\/(\d{4})\/(\d{1,2})$/);
  if (monthViewMatch) {
    const y = parseInt(monthViewMatch[1], 10);
    const m = parseInt(monthViewMatch[2], 10);
    return localDb.getMonthViewData(y * 100 + m) as unknown as T;
  }

  // 8. Settings route
  if (path === '/api/settings') {
    if (method === 'GET') {
      return localDb.getSettings() as unknown as T;
    }
    if (method === 'PUT') {
      localDb.setSettings(body);
      return body as unknown as T;
    }
  }

  // 9. Export route
  if (path === '/api/export/excel') {
    const txs = localDb.getTransactions();
    const headers = 'ID,Date,CardID,Merchant,MCC,Amount,Status,PaymentStatus,Cashback\n';
    const rows = txs
      .map(
        (t) =>
          `"${t.id}","${t.date}","${t.cardId}","${t.merchant}","${t.mccCode}",${t.amount},"${t.status}","${t.paymentStatus}",${t.actualCashback || 0}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    return blob as unknown as T;
  }

  return null;
}
