'use client';

import { toast } from 'sonner';

type ToastOpts = {
  description?: string;
  duration?: number;
};

const DEFAULT_DURATION = 3200;

export const authToasts = {
  loading(message = 'Loading...', opts: ToastOpts = {}) {
    const { description, duration } = opts;
    return toast.loading(message, { description, duration });
  },
  dismiss(id?: number | string) {
    return toast.dismiss(id as any);
  },
  success(message = 'Success', opts: ToastOpts = {}) {
    const { description, duration = DEFAULT_DURATION } = opts;
    return toast.success(message, { description, duration });
  },
  error(message = 'Something went wrong', opts: ToastOpts = {}) {
    const { description, duration = DEFAULT_DURATION } = opts;
    return toast.error(message, { description, duration });
  },
  info(message = 'Note', opts: ToastOpts = {}) {
    const { description, duration = DEFAULT_DURATION } = opts;
    return toast.message(message, { description, duration });
  },
  // Specific helpers for common auth flows
  loggedOut() {
    return toast.success('Logged out successfully.', { duration: DEFAULT_DURATION });
  },
  logoutFailed(err?: string) {
    return toast.error('Logout failed. Please try again.', {
      description: err,
      duration: DEFAULT_DURATION,
    });
  },
  signedIn() {
    return toast.success('Welcome back!', { duration: DEFAULT_DURATION });
  },
  signInFailed(err?: string) {
    return toast.error('Sign-in failed.', { description: err, duration: DEFAULT_DURATION });
  },
  signedUp() {
    return toast.success('Signed up successfully!', { duration: DEFAULT_DURATION });
  },
  signUpFailed(err?: string) {
    return toast.error('Sign-up failed.', { description: err, duration: DEFAULT_DURATION });
  },
  emailVerificationRequired() {
    return toast.info('Please verify your email to continue.', { duration: DEFAULT_DURATION });
  },
};
