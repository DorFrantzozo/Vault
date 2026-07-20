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
        return <AlertTriangle className="w-5 h-5 text-[#CF4500]" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-[#475569]" />;
    }
  };

  const getConfirmButtonStyle = () => {
    switch (options.type) {
      case 'danger':
        return 'bg-[#CF4500] hover:bg-[#b03b00] text-white';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-white';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white';
      case 'info':
      default:
        return 'bg-[#141413] hover:bg-[#2a2a28] text-white';
    }
  };

  return (
    <ModalContext.Provider value={{ confirm, showAlert }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCancel}
          />

          {/* Modal Card — white, high-contrast */}
          <div className="relative z-10 bg-white border border-[#141413]/12 rounded-2xl p-6 max-w-sm w-full shadow-[0_20px_60px_rgba(0,0,0,0.5)] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#F5F5F4] border border-[#141413]/10">
                  {getIcon()}
                </div>
                <h3 className="text-sm font-bold text-[#141413] font-heading">
                  {options.title || 'אישור פעולה'}
                </h3>
              </div>
              <button
                onClick={handleCancel}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#141413] hover:bg-[#F5F5F4] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-[#141413]/10" />

            {/* Message */}
            <p className="text-sm text-[#374151] leading-relaxed">
              {options.message}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              {options.showCancel && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#374151] bg-[#F5F5F4] hover:bg-[#E7E5E4] border border-[#141413]/12 transition-all active:scale-95"
                >
                  {options.cancelText || 'ביטול'}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${getConfirmButtonStyle()}`}
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
