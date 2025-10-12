'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { changePasswordAction, revokeSessionAction } from '@/lib/actions/settings-actions';
import { authErrorMessage } from '@/lib/auth/auth-errors';
import { useSession } from '@/lib/auth/client';
import { passwordChangeSchema } from '@/lib/schemas/auth_validation';
import { formatUserAgentShort } from '@/lib/utils/format-user-agent';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { PiSignOutBold } from 'react-icons/pi';
import { toast } from 'sonner';

type SessionItem = {
  id: string;
  createdAt?: string | Date;
  expiresAt?: string | Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

interface SecurityPrivacyCardProps {
  currentSessionId?: string;
  sessions: SessionItem[];
  hasCredentialsProvider: boolean;
}

export function SecurityPrivacyCard({
  currentSessionId,
  sessions,
  hasCredentialsProvider,
}: SecurityPrivacyCardProps) {
  const [isPending, startTransition] = useTransition();
  // react-hook-form setup
  const form = useForm<{
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    mode: 'onChange',
  });
  const [list, setList] = useState<SessionItem[]>(sessions);
  const { refetch } = useSession();

  function handleRevoke(sessionId: string) {
    startTransition(async () => {
      const res = await revokeSessionAction(sessionId);
      if (res.ok) {
        toast.success('Session revoked');
        // Optimistically update UI
        setList((prev) => prev.filter((s) => s.id !== sessionId));
        // Refresh auth client session data to stay in sync
        try {
          await refetch();
        } catch (_) {
          // no-op: refetch is best-effort
        }
      } else {
        toast.error(authErrorMessage(res, 'Failed to revoke session'));
      }
    });
  }

  function handleChangePassword(values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    startTransition(async () => {
      const res = await changePasswordAction(values);
      if (res.ok) {
        toast.success('Password updated');
        form.reset();
      } else {
        // Show field-level errors if available; otherwise toast
        const fieldErrors = res.fieldErrors;
        if (fieldErrors) {
          Object.entries(fieldErrors).forEach(([name, messages]) => {
            if (messages && messages.length) {
              form.setError(name as any, { message: messages[0] });
            }
          });
        }
        toast.error(authErrorMessage(res, 'Failed to update password'));
      }
    });
  }

  // Reset via email has been removed; we only support direct password change with current password.

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security & Privacy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="">Active Sessions</Label>
          <div>
            {list.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active sessions.</p>
            ) : (
              <div className="rounded-md border divide-y">
                {list.map((s) => {
                  const isCurrent = s.id === currentSessionId;
                  const created = s.createdAt ? new Date(s.createdAt) : undefined;
                  const expires = s.expiresAt ? new Date(s.expiresAt) : undefined;
                  return (
                    <div key={s.id} className="flex items-center justify-between p-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {formatUserAgentShort(s.userAgent)}{' '}
                          {isCurrent && (
                            <span className="ml-2 text-xs text-green-600">(Current)</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {s.ipAddress ? `IP ${s.ipAddress}` : ''}
                          {created && ` • Created ${created.toLocaleString()}`}
                          {expires && ` • Expires ${expires.toLocaleString()}`}
                        </div>
                      </div>
                      {!isCurrent ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isPending}
                          onClick={() => handleRevoke(s.id)}
                          className="inline-flex items-center gap-2"
                        >
                          <PiSignOutBold className="h-4 w-4" /> Revoke
                        </Button>
                      ) : (
                        <div className="text-xs text-muted-foreground">Protected</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="">Change Password</Label>
          <div className="rounded-md border p-4 space-y-3">
            {!hasCredentialsProvider && (
              <p className="text-sm text-muted-foreground">
                Your account is linked via a social provider. Password change is disabled.
              </p>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleChangePassword)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label">Current Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter current password"
                          disabled={!hasCredentialsProvider || isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Separator />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label">New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter new password"
                          disabled={!hasCredentialsProvider || isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="form-label">Confirm New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm new password"
                          disabled={!hasCredentialsProvider || isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="submit" disabled={!hasCredentialsProvider || isPending}>
                    Update Password
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
