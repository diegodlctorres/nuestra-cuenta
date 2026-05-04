export const OFFLINE_MUTATION_MESSAGE =
  'No hay conexión. Esta acción necesita red para sincronizarse con el hogar.';

export function isOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function getActionErrorMessage(defaultMessage: string) {
  return isOffline() ? OFFLINE_MUTATION_MESSAGE : defaultMessage;
}
