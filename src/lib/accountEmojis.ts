import { Account } from '../types';

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

export function getDefaultAccountEmoji() {
  return '💳';
}

export function getAccountEmoji(account?: Pick<Account, 'emoji'> | null) {
  if (account?.emoji && account.emoji.trim().length > 0) {
    return account.emoji;
  }

  return getDefaultAccountEmoji();
}
