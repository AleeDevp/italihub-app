import { APIError } from 'better-auth';

const DEFAULT_MESSAGE = 'Authentication request failed';

export type AuthError = {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
};

export type AuthResult<T = void> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: AuthError };

export function authSuccess<T = void>(data?: T, message?: string): AuthResult<T> {
  return { ok: true, data, message };
}

export function authError(
  message: string,
  info: { code?: string; status?: number; details?: unknown } = {}
): AuthResult<never> {
  return {
    ok: false,
    error: {
      message,
      ...(info.code ? { code: info.code } : {}),
      ...(info.status ? { status: info.status } : {}),
      ...(info.details !== undefined ? { details: info.details } : {}),
    },
  };
}

export function parseAuthError(error: unknown, fallback = DEFAULT_MESSAGE): AuthError {
  if (error instanceof APIError) {
    const body = (error as any).body ?? {};
    const message = typeof body.message === 'string' ? body.message : error.message || fallback;
    const code =
      typeof body.code === 'string'
        ? body.code
        : typeof body.error === 'string'
          ? body.error
          : undefined;
    const status = typeof error.statusCode === 'number' ? error.statusCode : undefined;
    const details = body && Object.keys(body).length > 0 ? body : undefined;

    return {
      message,
      ...(code ? { code } : {}),
      ...(status ? { status } : {}),
      ...(details ? { details } : {}),
    };
  }

  if (error instanceof Error) {
    const message = error.message || fallback;
    const code = error.name && error.name !== 'Error' ? error.name : undefined;

    return {
      message,
      ...(code ? { code } : {}),
    };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  if (error && typeof error === 'object') {
    const candidate = (error as any).message;
    const details = error;

    return {
      message: typeof candidate === 'string' && candidate.trim().length > 0 ? candidate : fallback,
      details,
    };
  }

  return { message: fallback };
}

export function authErrorFrom(error: unknown, fallback = DEFAULT_MESSAGE): AuthResult<never> {
  return {
    ok: false,
    error: parseAuthError(error, fallback),
  };
}

export function authErrorMessage(source: unknown, fallback = DEFAULT_MESSAGE): string {
  if (!source) return fallback;

  if (typeof source === 'string') {
    return 'Unexpected error! try again later.';
  }

  if (typeof source === 'object') {
    if (source && 'ok' in source) {
      const result = source as AuthResult;
      if (result.ok) {
        return result.message ?? fallback;
      }
      return 'Unexpected error! try again later.';
    }

    if (source && 'message' in source && typeof (source as any).message === 'string') {
      return 'Unexpected error! try again later.';
    }
  }

  return parseAuthError(source, fallback).message;
}

export const AUTH_DEFAULT_ERROR = DEFAULT_MESSAGE;
