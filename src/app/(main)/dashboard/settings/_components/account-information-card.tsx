'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { linkSocial } from '@/lib/auth/client';
import { Link as LinkIcon, Mail, Shield, User } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import { toast } from 'sonner';
type Account = {
  id: string;
  providerId: string; // 'credential' | 'google' | others
  createdAt?: string | Date;
};

export interface AccountInformationCardProps {
  email?: string | null;
  role?: string | null;
  // tolerated/optional; not used now but safe to accept from server
  emailVerified?: boolean | null;
  accounts: Account[];
}

export function AccountInformationCard({ email, role, accounts }: AccountInformationCardProps) {
  const providers = new Set(
    (accounts || []).map((a) => (a?.providerId ? String(a.providerId).toLowerCase() : ''))
  );
  const hasGoogle = providers.has('google');
  // Treat common aliases for email/password sign-in
  const hasCredentials = ['credentials', 'credential', 'email', 'password', 'local'].some((p) =>
    providers.has(p)
  );
  // Back-compat alias for any stale references
  const hasCredential = hasCredentials;

  async function handleLinkGoogle() {
    try {
      const { error } = await linkSocial({
        provider: 'google',
        callbackURL: '/dashboard/settings',
      });
      if (error) throw error;
      toast.success('Google linked successfully');
    } catch (err) {
      toast.error((err as Error).message || 'Linking failed');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Account Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Row 1: email (with icon + copy) and role */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Email */}
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="email" className="form-label">
              Email address
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                variant="showcase"
                value={email || ''}
                readOnly
                aria-readonly
                className="pl-9"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    if (email)
                      navigator.clipboard
                        .writeText(email)
                        .then(() => toast.success('Email copied'));
                  }}
                  disabled={!email}
                >
                  Copy
                </Button>
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              This address is used for login and important notifications.
            </p>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label className="form-label">Role</Label>
            <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="uppercase tracking-wide">
                {role || 'USER'}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Determines access to advanced tools.
            </p>
          </div>
        </div>
        <Separator />
        {/* Row 2: methods left, action right */}
        <div className="space-y-2">
          <Label className="form-label">Sign-in methods</Label>
          <div className="rounded-lg border p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={hasCredentials ? 'secondary' : 'outline'}
                  className={`gap-1 ${hasCredentials ? '' : 'opacity-60 text-muted-foreground'}`}
                >
                  <Mail className="h-3 w-3" /> Email & Password
                </Badge>
                <Badge
                  variant={hasGoogle ? 'secondary' : 'outline'}
                  className={`gap-1 ${hasGoogle ? '' : 'opacity-60 text-muted-foreground'}`}
                >
                  <LinkIcon className="h-3 w-3" /> Google
                </Badge>
              </div>
              {!hasGoogle && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Link your Google account for faster sign-in.
                </p>
              )}
            </div>
            <div className="flex items-center justify-end">
              <Button onClick={handleLinkGoogle} disabled={hasGoogle} variant="outline">
                <FaGoogle />
                {hasGoogle ? 'Google linked' : 'Link Google account'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AccountInformationCard;
