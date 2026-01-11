// Helper para mostrar toast notifications
// Usar desde cualquier script: import { toast } from '@/lib/toast';

interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function toast(options: ToastOptions | string) {
  const detail: ToastOptions = typeof options === 'string'
    ? { message: options }
    : options;

  window.dispatchEvent(new CustomEvent('show-toast', { detail }));
}

// Helpers de conveniencia
export const toastSuccess = (message: string, duration?: number) =>
  toast({ message, type: 'success', duration });

export const toastError = (message: string, duration?: number) =>
  toast({ message, type: 'error', duration });

export const toastWarning = (message: string, duration?: number) =>
  toast({ message, type: 'warning', duration });

export const toastInfo = (message: string, duration?: number) =>
  toast({ message, type: 'info', duration });

// Helper para confirmaciones - retorna una Promise<boolean>
export function toastConfirm(message: string, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar'): Promise<boolean> {
  return new Promise((resolve) => {
    toast({
      message,
      type: 'warning',
      duration: 0, // No auto-cerrar
      action: {
        label: confirmLabel,
        onClick: () => resolve(true)
      }
    });

    // Por ahora usamos confirm nativo hasta implementar un modal de confirmación personalizado
    resolve(confirm(message));
  });
}
