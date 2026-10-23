import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface ToastProps {
  toasts: ToastMessage[];
}

export const Toast: React.FC<ToastProps> = ({ toasts }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';

        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all duration-200 animate-in slide-in-from-bottom-3 fade-in-0",
              isSuccess && "border-emerald-200 bg-white/95 text-slate-800 dark:border-emerald-800/80 dark:bg-slate-900/95 dark:text-slate-100",
              isError && "border-rose-200 bg-white/95 text-slate-800 dark:border-rose-800/80 dark:bg-slate-900/95 dark:text-slate-100",
              !isSuccess && !isError && "border-teal-200 bg-white/95 text-slate-800 dark:border-teal-800/80 dark:bg-slate-900/95 dark:text-slate-100"
            )}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
              {isError && <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />}
              {!isSuccess && !isError && <Info className="h-5 w-5 text-teal-600 dark:text-teal-400" />}
            </div>

            <div className="flex-1 text-xs md:text-sm font-medium leading-relaxed">
              {t.message}
            </div>
          </div>
        );
      })}
    </div>
  );
};
