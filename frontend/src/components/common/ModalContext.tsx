import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

interface ModalOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'success' | 'warning';
  showCancel?: boolean;
}

interface ModalContextType {
  confirm: (options: ModalOptions) => Promise<boolean>;
  showAlert: (message: string, title?: string, type?: ModalOptions['type']) => Promise<void>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ModalOptions>({ message: '' });
  const [resolver, setResolver] = useState<(value: boolean) => void>(() => () => {});

  const confirm = (opts: ModalOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions({
        confirmText: 'אישור',
        cancelText: 'ביטול',
        type: 'info',
        showCancel: true,
        ...opts,
      });
      setResolver(() => resolve);
      setIsOpen(true);
    });
  };

  const showAlert = (message: string, title: string = 'הודעה', type: ModalOptions['type'] = 'info'): Promise<void> => {
    return new Promise((resolve) => {
      setOptions({
        title,
        message,
        confirmText: 'אישור',
        type,
        showCancel: false,
      });
      setResolver(() => () => resolve());
      setIsOpen(true);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    resolver(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolver(false);
  };

  const getIcon = () => {
    switch (options.type) {
      case 'danger':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getConfirmButtonStyle = () => {
    switch (options.type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20';
      case 'info':
      default:
        return 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/20';
    }
  };

  return (
    <ModalContext.Provider value={{ confirm, showAlert }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm transition-opacity"
            onClick={handleCancel}
          />
          <div className="relative z-10 bg-[#12131c] border border-zinc-800 rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-zinc-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                  {getIcon()}
                </div>
                <h3 className="text-sm font-bold text-white">
                  {options.title || 'אישור פעולה'}
                </h3>
              </div>
              <button
                onClick={handleCancel}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-medium">
              {options.message}
            </p>

            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
              {options.showCancel && (
                <button
                  onClick={handleCancel}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-all active:scale-95"
                >
                  {options.cancelText || 'ביטול'}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95 border border-white/10 ${getConfirmButtonStyle()}`}
              >
                {options.confirmText || 'אישור'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
