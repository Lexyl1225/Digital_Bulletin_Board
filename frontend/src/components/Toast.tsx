import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
      }}
    >
      {toasts.map((t) => {
        const getBg = () => {
          switch (t.type) {
            case 'success':
              return { bg: '#064e3b', border: '#10b981', color: '#6ee7b7', icon: <CheckCircle2 size={18} /> };
            case 'error':
              return { bg: '#7f1d1d', border: '#ef4444', color: '#fca5a5', icon: <AlertCircle size={18} /> };
            default:
              return { bg: '#1e3a8a', border: '#3b82f6', color: '#93c5fd', icon: <Info size={18} /> };
          }
        };

        const config = getBg();

        return (
          <div
            key={t.id}
            style={{
              background: config.bg,
              border: `1px solid ${config.border}`,
              color: config.color,
              padding: '12px 16px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              fontSize: '0.88rem',
              animation: 'modalSlideUp 0.25s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {config.icon}
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              style={{ color: config.color, cursor: 'pointer', background: 'none', border: 'none' }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
