'use client';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ReactNode, useCallback, useState } from 'react';

type ButtonVariant = 'default' | 'destructive' | 'secondary' | 'outline' | 'ghost' | 'link';

export type UseConfirmBeforeCloseOptions = {
  title?: ReactNode;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: ButtonVariant;
  onConfirmClose?: () => void; // called when user confirms closing (or closes when not dirty)
};

export function useConfirmBeforeClose(options?: UseConfirmBeforeCloseOptions) {
  const {
    title = 'Discard changes?',
    description = 'You have unsaved changes. If you close now, your changes will be lost.',
    confirmText = 'Discard',
    cancelText = 'Cancel',
    confirmVariant = 'destructive',
    onConfirmClose,
  } = options || {};

  const [open, setOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const markDirty = useCallback(() => setIsDirty(true), []);

  const actuallyClose = useCallback(() => {
    setOpen(false);
    setIsDirty(false);
    try {
      onConfirmClose?.();
    } catch (e) {
      // no-op: ensure close still proceeds even if callback throws
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }, [onConfirmClose]);

  const onOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        // When attempting to close the dialog
        if (isDirty) {
          // Ask for confirmation if there are unsaved changes
          setConfirmOpen(true);
          return;
        }
        // Not dirty: close immediately and run onConfirmClose to allow consumers to reset state
        actuallyClose();
        return;
      }
      // Opening the dialog
      setOpen(true);
    },
    [isDirty, actuallyClose]
  );

  const handleCancel = useCallback(() => {
    if (isDirty) {
      setConfirmOpen(true);
      return;
    }
    actuallyClose();
  }, [isDirty, actuallyClose]);

  const confirmDialog = (
    <ConfirmDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      title={title}
      description={description}
      confirmText={confirmText}
      cancelText={cancelText}
      confirmVariant={confirmVariant}
      onConfirm={actuallyClose}
    />
  );

  return {
    open,
    onOpenChange,
    isDirty,
    markDirty,
    handleCancel,
    confirmDialog,
    setOpen,
    setIsDirty,
  } as const;
}
