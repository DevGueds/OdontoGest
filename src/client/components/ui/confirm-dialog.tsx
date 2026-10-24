import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog';
import { Button } from './button';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

export interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  onOpenChange,
  title = "Confirmar Exclusão",
  description,
  confirmLabel = "Sim, Excluir",
  cancelLabel = "Cancelar",
  onConfirm,
  isLoading = false
}) => {
  const [submitting, setSubmitting] = React.useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base text-rose-600 dark:text-rose-400">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={submitting || isLoading}
            className="gap-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 dark:hover:border-rose-800 transition-colors"
            title="Cancelar e manter o registro intacto"
            aria-label="Cancelar"
          >
            <X className="h-4 w-4" />
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={submitting || isLoading}
            className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all"
            title="Confirmar exclusão definitiva do registro"
            aria-label="Confirmar exclusão"
          >
            <Trash2 className="h-4 w-4" />
            {submitting || isLoading ? "Processando..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
