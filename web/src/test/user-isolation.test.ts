import { describe, it, expect, beforeEach } from 'vitest';
import { localDb } from '../lib/localDb';
import type { Card } from '../types';

describe('Multi-user Data Isolation', () => {
  beforeEach(() => {
    localDb.resetToSeedData();
  });

  it('maintains completely separate cards for each user', () => {
    // 1. User taitv has seed cards
    localDb.setUser({ username: 'taitv', roles: ['Admin'], mustChangePassword: false });
    const taitvCards = localDb.getCards();
    expect(taitvCards.length).toBeGreaterThan(0);

    // 2. Register user Alice
    const alice = localDb.registerUser({
      username: 'alice',
      password: 'password123',
      fullName: 'Alice Nguyen'
    });
    expect(alice.username).toBe('alice');

    // Alice initially has 0 cards
    expect(localDb.getCards()).toEqual([]);

    // Alice adds a card
    const aliceCard: Card = {
      id: 'ALICE-CARD-1',
      bank: 'Vietcombank',
      name: 'VCB Visa Signature',
      cardType: 'Credit',
      network: 'Visa',
      last4: '9999',
      creditLimit: 50000000,
      statementDay: 20,
      paymentDueDay: 15,
      openDate: '2024-01-01',
      annualFee: 1000000,
      firstYearFee: 0,
      status: 'Active'
    };
    localDb.setCards([aliceCard]);
    expect(localDb.getCards().length).toBe(1);
    expect(localDb.getCards()[0].id).toBe('ALICE-CARD-1');

    // 3. Register user Bob
    const bob = localDb.registerUser({
      username: 'bob',
      password: 'password456',
      fullName: 'Bob Tran'
    });
    expect(bob.username).toBe('bob');

    // Bob starts with 0 cards and does NOT see Alice or Taitv's cards
    expect(localDb.getCards()).toEqual([]);

    // 4. Switch back to Alice
    localDb.setUser(alice);
    const aliceCardsAfterSwitch = localDb.getCards();
    expect(aliceCardsAfterSwitch.length).toBe(1);
    expect(aliceCardsAfterSwitch[0].id).toBe('ALICE-CARD-1');

    // 5. Switch back to taitv
    localDb.setUser({ username: 'taitv', roles: ['Admin'], mustChangePassword: false });
    expect(localDb.getCards().length).toBe(taitvCards.length);
  });

  it('maintains separate transactions and rules for each user', () => {
    // Register user Charlie
    const charlie = localDb.registerUser({
      username: 'charlie',
      password: 'charlie_pass',
      fullName: 'Charlie Le'
    });

    expect(localDb.getTransactions()).toEqual([]);
    expect(localDb.getRules()).toEqual([]);

    // Charlie adds a transaction
    localDb.setTransactions([
      {
        id: 'TX-CHARLIE-1',
        cardId: 'CARD-1',
        date: '2024-05-10',
        merchant: 'Shopee',
        mccCode: '5311',
        amount: 250000,
        eligibleAmount: 250000,
        rate: 0.1,
        theoreticalCashback: 25000,
        actualCashback: 25000,
        cashbackStatus: 'Được hoàn',
        status: 'Posted',
        paymentStatus: 'Chưa thanh toán',
        statementDate: '2024-05-20',
        paymentDueDate: '2024-06-15',
        monthKey: 202405
      }
    ]);

    expect(localDb.getTransactions().length).toBe(1);

    // Switch to taitv
    localDb.setUser({ username: 'taitv', roles: ['Admin'], mustChangePassword: false });
    const taitvTxs = localDb.getTransactions();
    expect(taitvTxs.every(t => t.id !== 'TX-CHARLIE-1')).toBe(true);

    // Switch back to Charlie
    localDb.setUser(charlie);
    expect(localDb.getTransactions().length).toBe(1);
    expect(localDb.getTransactions()[0].id).toBe('TX-CHARLIE-1');
  });
});
