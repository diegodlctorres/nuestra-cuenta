import { Account, AccountType } from '../types';

export const ACCOUNT_EMOJI_OPTIONS = [
  '💳',
  '💵',
  '🏦',
  '🪙',
  '🐷',
  '🎯',
  '🏠',
  '🚗',
  '🛒',
  '🐶',
  '🎓',
  '✈️'
] as const;

const DEFAULT_EMOJI_BY_TYPE: Record<AccountType, string> = {
  checking: '💳',
  savings: '🐷'
};

export function getDefaultAccountEmoji(type: AccountType = 'checking') {
  return DEFAULT_EMOJI_BY_TYPE[type] || '💳';
}

export function getAccountEmoji(account?: Pick<Account, 'emoji' | 'type'> | null) {
  if (account?.emoji && account.emoji.trim().length > 0) {
    return account.emoji;
  }

  return getDefaultAccountEmoji(account?.type || 'checking');
}
