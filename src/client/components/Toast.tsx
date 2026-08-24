import React from 'react';
import { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
}

export const Toast: React.FC<ToastProps> = ({ toasts }) => {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <i className={`fa-solid ${t.type === 'success' ? 'fa-circle-check text-emerald' : t.type === 'error' ? 'fa-circle-exclamation text-rose' : 'fa-info-circle text-primary'}`}></i>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};
