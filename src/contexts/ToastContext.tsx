import React, { createContext, useState, useContext, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type: ToastType) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
    if (toastTimeouts.current[id]) {
      clearTimeout(toastTimeouts.current[id]);
      delete toastTimeouts.current[id];
    }
  }, []);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove toast after 5 seconds
    toastTimeouts.current[id] = setTimeout(() => {
      hideToast(id);
    }, 5000);
  }, [hideToast]);

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      Object.values(toastTimeouts.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-lg flex items-center justify-between min-w-[300px] ${
              toast.type === 'success' ? 'bg-green-500 text-white' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
              toast.type === 'warning' ? 'bg-yellow-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => hideToast(toast.id)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};