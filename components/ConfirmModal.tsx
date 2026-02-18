
import React, { useState, useCallback, ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info';
  onConfirm: () => void;
}

export const useConfirm = () => {
  const [state, setState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions | null;
  }>({ isOpen: false, options: null });

  const confirm = useCallback((options: ConfirmOptions) => {
    setState({ isOpen: true, options });
  }, []);

  const close = useCallback(() => {
    setState({ isOpen: false, options: null });
  }, []);

  const handleConfirm = useCallback(() => {
    state.options?.onConfirm();
    close();
  }, [state.options, close]);

  const ConfirmationDialog = () => {
    if (!state.isOpen || !state.options) return null;

    const { title, message, confirmText = 'تأكيد', cancelText = 'إلغاء', type = 'danger' } = state.options;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">{title}</h3>
              </div>
              <button onClick={close} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="text-gray-600 mb-8 leading-relaxed text-right">
              {message}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={close}
                className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-6 py-3 rounded-xl text-white font-bold shadow-lg transition-transform active:scale-95 ${
                  type === 'danger' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return { confirm, ConfirmationDialog };
};
