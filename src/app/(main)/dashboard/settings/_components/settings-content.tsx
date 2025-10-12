import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth, getServerSession } from '@/lib/auth/server';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { headers } from 'next/headers';
import AccountInformationCard from './account-information-card';
import { SecurityPrivacyCard } from './security-privacy-card';

export async function SettingsContent() {
  const session = await getServerSession();
  const user = session?.user;

  const userSessions = await auth.api.listSessions({
    headers: await headers(),
  });

  const userAccounts = await auth.api.listUserAccounts({
    headers: await headers(),
  });

  const hasCredentials = userAccounts.some((a: any) => {
    const pid = String(a?.providerId || '').toLowerCase();
    return (
      pid === 'credentials' ||
      pid === 'credential' ||
      pid === 'email' ||
      pid === 'password' ||
      pid === 'local'
    );
  });

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Account Information */}
      <AccountInformationCard
        email={user?.email}
        role={(user as any)?.role}
        accounts={userAccounts as any}
      />

      <SecurityPrivacyCard
        currentSessionId={(session as any)?.session?.id || (session as any)?.sessionId}
        sessions={userSessions as any}
        hasCredentialsProvider={hasCredentials}
      />

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <h4 className="font-medium text-red-800 mb-2">Delete Account</h4>
            <p className="text-sm text-red-700 mb-4">
              Once you delete your account, there is no going back. This action cannot be undone.
              All your data, including ads, messages, and profile information will be permanently
              removed.
            </p>
            <Button variant="destructive" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Delete My Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
