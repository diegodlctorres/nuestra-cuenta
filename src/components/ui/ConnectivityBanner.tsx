import { Wifi, WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../../contexts/NetworkStatusContext';

export function ConnectivityBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (isOnline && !wasOffline) {
    return null;
  }

  const restored = isOnline && wasOffline;

  return (
    <div
      className={
        restored
          ? 'border-b border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-b border-amber-200 bg-amber-50 text-amber-800'
      }
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-md items-center gap-2 px-6 py-2 text-sm font-medium">
        {restored ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <span>
          {restored
            ? 'Conexión recuperada. La app puede volver a sincronizar cambios.'
            : 'Sin conexión. Puedes navegar por la app, pero las acciones que guardan cambios necesitan red.'}
        </span>
      </div>
    </div>
  );
}
