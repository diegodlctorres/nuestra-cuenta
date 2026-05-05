import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FinanceSnapshot } from '../lib/financeData';
import { OFFLINE_MUTATION_MESSAGE } from '../lib/networkStatus';
import { queryKeys } from '../lib/queryKeys';
import { useTransactions } from './useTransactions';

const createTransactionMock = vi.fn();
const removeTransactionMock = vi.fn();
const loadFinanceSnapshotMock = vi.fn<() => Promise<FinanceSnapshot>>(async () => ({
  accounts: [],
  categories: [],
  transactions: []
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    householdId: 'household-1',
    memberId: 'member-1'
  })
}));

vi.mock('../lib/financeData', () => ({
  calculateAccountBalances: () => ({}),
  loadFinanceSnapshot: () => loadFinanceSnapshotMock(),
  createTransaction: (...args: unknown[]) => createTransactionMock(...args),
  removeTransaction: (...args: unknown[]) => removeTransactionMock(...args),
  createAccount: vi.fn(),
  createCategory: vi.fn(),
  editAccount: vi.fn(),
  removeAccount: vi.fn(),
  removeCategory: vi.fn()
}));

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadFinanceSnapshotMock.mockResolvedValue({
      accounts: [],
      categories: [],
      transactions: []
    });
    setNavigatorOnline(true);
  });

  it('blocks transaction creation while offline', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useTransactions(), {
      wrapper: createWrapper(queryClient)
    });
    setNavigatorOnline(false);

    const mutationResult = await result.current.addTransaction({
      created_at: '2026-05-05T00:00:00Z',
      amount: 10,
      description: 'Compra',
      account_id: 'account-1',
      type: 'expense',
      category_id: 'category-1',
      is_pet_related: false,
      date: '2026-05-05'
    });

    expect(mutationResult).toEqual({ ok: false, message: OFFLINE_MUTATION_MESSAGE, cause: undefined });
    expect(createTransactionMock).not.toHaveBeenCalled();
  });

  it('returns ok when transaction creation succeeds', async () => {
    createTransactionMock.mockResolvedValue({
      id: 'transaction-1',
      household_id: 'household-1',
      created_by: 'member-1',
      created_at: '2026-05-05T00:00:00Z',
      amount: 10,
      description: 'Compra',
      account_id: 'account-1',
      type: 'expense',
      is_pet_related: false,
      date: '2026-05-05'
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useTransactions(), {
      wrapper: createWrapper(queryClient)
    });

    const mutationResult = await result.current.addTransaction({
      created_at: '2026-05-05T00:00:00Z',
      amount: 10,
      description: 'Compra',
      account_id: 'account-1',
      type: 'expense',
      category_id: 'category-1',
      is_pet_related: false,
      date: '2026-05-05'
    });

    expect(mutationResult).toEqual({ ok: true });
    expect(createTransactionMock).toHaveBeenCalledWith('household-1', 'member-1', expect.any(Object));
  });

  it('restores the finance cache when optimistic delete fails', async () => {
    removeTransactionMock.mockRejectedValue(new Error('delete failed'));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const queryKey = queryKeys.finance('household-1');
    const snapshot = {
      accounts: [],
      categories: [],
      transactions: [{
        id: 'transaction-1',
        household_id: 'household-1',
        created_by: 'member-1',
        created_at: '2026-05-05T00:00:00Z',
        amount: 10,
        description: 'Compra',
        account_id: 'account-1',
        type: 'expense' as const,
        is_pet_related: false,
        date: '2026-05-05'
      }]
    };
    loadFinanceSnapshotMock.mockResolvedValue(snapshot);
    queryClient.setQueryData(queryKey, snapshot);
    const { result } = renderHook(() => useTransactions(), {
      wrapper: createWrapper(queryClient)
    });

    await act(async () => {
      await result.current.deleteTransaction('transaction-1');
    });

    expect(queryClient.getQueryData(queryKey)).toEqual(snapshot);
  });
});
