import { afterEach, describe, expect, it } from 'vitest';
import { OFFLINE_MUTATION_MESSAGE, getActionErrorMessage, isOffline } from './networkStatus';

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value
  });
}

describe('networkStatus', () => {
  afterEach(() => {
    setNavigatorOnline(true);
  });

  it('detects offline state', () => {
    setNavigatorOnline(false);

    expect(isOffline()).toBe(true);
    expect(getActionErrorMessage('Fallback')).toBe(OFFLINE_MUTATION_MESSAGE);
  });

  it('uses fallback message while online', () => {
    setNavigatorOnline(true);

    expect(isOffline()).toBe(false);
    expect(getActionErrorMessage('Fallback')).toBe('Fallback');
  });
});
