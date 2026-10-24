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
              "pointer-events-auto flex items-start gap-3 rounded-[8px] border p-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all duration-200 animate-in slide-in-from-bottom-2 fade-in-0 bg-white dark:bg-[#121215] text-[#0A0A0A] dark:text-zinc-100",
              isSuccess && "border-emerald-500/20",
              isError && "border-red-500/20",
              !isSuccess && !isError && "border-[#6366F1]/20"
            )}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="h-4 w-4 text-[#10B981]" />}
              {isError && <AlertCircle className="h-4 w-4 text-[#EF4444]" />}
              {!isSuccess && !isError && <Info className="h-4 w-4 text-[#6366F1]" />}
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
