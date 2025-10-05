import { NotificationForm } from '@/app/(admin-moderator)/panel/Send-notification/send-form';
import { requireUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Send Test Notification',
};

export default async function SendNotificationPage() {
  const user = await requireUser();
  if (user.role !== 'MODERATOR' && user.role !== 'ADMIN') {
    redirect('/forbidden');
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Send Test Notification</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Use this form to create a notification for a specific user by userId or email. Open another
        device with that account to verify real-time delivery via SSE.
      </p>
      {/* Client form */}
      <NotificationForm />
    </div>
  );
}
