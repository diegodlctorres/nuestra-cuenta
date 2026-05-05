import { describe, expect, it } from 'vitest';
import { getFriendlyErrorMessage, mutationError, mutationMessage, mutationOk } from './errors';

describe('errors', () => {
  it('maps known backend messages to friendly copy', () => {
    expect(getFriendlyErrorMessage(new Error('duplicate key value violates unique constraint'))).toBe(
      'Ya existe un registro con esos datos.'
    );
  });

  it('creates successful mutation results', () => {
    expect(mutationOk()).toEqual({ ok: true });
    expect(mutationOk({ id: '1' })).toEqual({ ok: true, data: { id: '1' } });
  });

  it('creates failed mutation results with normalized messages', () => {
    expect(mutationError(new Error('Failed to fetch'), 'Fallback')).toMatchObject({
      ok: false,
      message: 'No pudimos conectar con el servidor. Revisa tu conexión.'
    });
    expect(mutationMessage('Sin conexion')).toEqual({ ok: false, message: 'Sin conexion', cause: undefined });
  });
});
