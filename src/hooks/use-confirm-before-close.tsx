'use client';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { type ReactNode, useCallback, useMemo, useState } from 'react';

type ButtonVariant = 'default' | 'destructive' | 'secondary' | 'outline' | 'ghost' | 'link';

export interface UseConfirmBeforeCloseOptions {
  /** Dialog title when confirming discard */
  title?: ReactNode;
  /** Dialog description when confirming discard */
  description?: ReactNode;
  /** Text for the confirm button */
  confirmText?: string;
  /** Text for the cancel button */
  cancelText?: string;
  /** Variant for the confirm button */
  confirmVariant?: ButtonVariant;
  /** Callback when user confirms closing (or closes when not dirty) */
  onConfirmClose?: () => void;
  /** External open state for controlled mode */
  externalOpen?: boolean;
  /** External open change handler for controlled mode */
  externalOnOpenChange?: (open: boolean) => void;
}

export function useConfirmBeforeClose(options: UseConfirmBeforeCloseOptions = {}) {
  const {
    title = 'Discard changes?',
    description = 'You have unsaved changes. If you close now, your changes will be lost.',
    confirmText = 'Discard',
    cancelText = 'Cancel',
    confirmVariant = 'destructive',
    onConfirmClose,
    externalOpen,
    externalOnOpenChange,
  } = options;

  const isControlled = externalOpen !== undefined;

  const [internalOpen, setInternalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Derive open state based on controlled vs uncontrolled mode
  const open = isControlled ? externalOpen : internalOpen;

  // Unified setter that works for both modes
  const setOpen = useCallback(
    (value: boolean) => {
      if (isControlled) {
        externalOnOpenChange?.(value);
      } else {
        setInternalOpen(value);
      }
    },
    [isControlled, externalOnOpenChange]
  );

  const actuallyClose = useCallback(() => {
    setOpen(false);
    setIsDirty(false);
    try {
      onConfirmClose?.();
    } catch (e) {
      console.error('Error in onConfirmClose callback:', e);
    }
  }, [setOpen, onConfirmClose]);

  const onOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        // Closing: check for unsaved changes
        if (isDirty) {
          setConfirmOpen(true);
          return;
        }
        actuallyClose();
        return;
      }
      // Opening
      setOpen(true);
    },
    [isDirty, actuallyClose, setOpen]
  );

  const handleCancel = useCallback(() => {
    if (isDirty) {
      setConfirmOpen(true);
      return;
    }
    actuallyClose();
  }, [isDirty, actuallyClose]);

  const markDirty = useCallback(() => setIsDirty(true), []);

  const confirmDialog = useMemo(
    () => (
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
    ),
    [confirmOpen, title, description, confirmText, cancelText, confirmVariant, actuallyClose]
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
