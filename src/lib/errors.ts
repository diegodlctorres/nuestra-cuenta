const FALLBACK_MESSAGE = 'Ocurrió un error inesperado. Inténtalo nuevamente.';

const ERROR_MESSAGES: Array<[string, string]> = [
  ['invalid login credentials', 'El correo o la contraseña no son correctos.'],
  ['email not confirmed', 'Primero confirma tu correo para poder ingresar.'],
  ['user already registered', 'Este correo ya está registrado. Intenta iniciar sesión.'],
  ['password should be at least', 'La contraseña debe tener al menos 6 caracteres.'],
  ['signup is disabled', 'El registro está deshabilitado temporalmente.'],
  ['rate limit', 'Hubo demasiados intentos. Espera un momento y vuelve a probar.'],
  ['failed to fetch', 'No pudimos conectar con el servidor. Revisa tu conexión.'],
  ['networkerror', 'No pudimos conectar con el servidor. Revisa tu conexión.'],
  ['jwt expired', 'Tu sesión expiró. Vuelve a iniciar sesión.'],
  ['invalid token', 'El código no es válido o ya expiró.'],
  ['expired', 'El código expiró. Pide una nueva invitación.'],
  ['duplicate key', 'Ya existe un registro con esos datos.'],
];

export function getFriendlyErrorMessage(error: unknown, fallback = FALLBACK_MESSAGE) {
  if (!error) return fallback;

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'message' in Object(error)
          ? String((error as { message?: unknown }).message || '')
          : '';

  const normalized = message.toLowerCase();
  const match = ERROR_MESSAGES.find(([needle]) => normalized.includes(needle));

  return match?.[1] || message || fallback;
}
