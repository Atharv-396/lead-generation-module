export type ToastType = 'success' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  createdAt: number; // Date.now() timestamp for auto-dismiss scheduling
}
