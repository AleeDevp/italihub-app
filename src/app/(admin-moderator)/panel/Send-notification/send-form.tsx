'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

const schema = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
  type: z.enum(['AD_EVENT', 'VERIFICATION_EVENT', 'REPORT_EVENT', 'SYSTEM_ANNOUNCEMENT']),
  severity: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']).default('INFO'),
  title: z.string().min(3).max(140),
  message: z.string().min(3).max(1000),
  deepLink: z.string().url().optional().or(z.literal('')).optional(),
});

export function NotificationForm() {
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({
    userId: '',
    email: '',
    type: 'SYSTEM_ANNOUNCEMENT',
    severity: 'INFO',
    title: 'Test Notification',
    message: 'This is a test notification.',
    deepLink: '',
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parse = schema.safeParse({
      ...values,
      deepLink: values.deepLink || undefined,
    });
    if (!parse.success) {
      toast.error('Please fix the errors in the form');
      return;
    }

    if (!values.userId && !values.email) {
      toast.error('Provide userId or email');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/moderator/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: values.userId || undefined,
          email: values.email || undefined,
          type: values.type,
          severity: values.severity,
          title: values.title,
          message: values.message,
          deepLink: values.deepLink || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send notification');
      }
      toast.success('Notification sent');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Target userId (optional)</label>
          <Input
            value={values.userId}
            onChange={(e) => setValues((v) => ({ ...v, userId: e.target.value }))}
            placeholder="user.id"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Target email (optional)</label>
          <Input
            type="email"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            placeholder="user@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Type</label>
          <Select
            value={values.type}
            onValueChange={(val) => setValues((v) => ({ ...v, type: val }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AD_EVENT">AD_EVENT</SelectItem>
              <SelectItem value="VERIFICATION_EVENT">VERIFICATION_EVENT</SelectItem>
              <SelectItem value="REPORT_EVENT">REPORT_EVENT</SelectItem>
              <SelectItem value="SYSTEM_ANNOUNCEMENT">SYSTEM_ANNOUNCEMENT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm mb-1">Severity</label>
          <Select
            value={values.severity}
            onValueChange={(val) => setValues((v) => ({ ...v, severity: val }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INFO">INFO</SelectItem>
              <SelectItem value="SUCCESS">SUCCESS</SelectItem>
              <SelectItem value="WARNING">WARNING</SelectItem>
              <SelectItem value="ERROR">ERROR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Title</label>
        <Input
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          placeholder="Title"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Message</label>
        <Textarea
          value={values.message}
          onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
          placeholder="Message body"
          rows={4}
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Deep link (optional)</label>
        <Input
          value={values.deepLink}
          onChange={(e) => setValues((v) => ({ ...v, deepLink: e.target.value }))}
          placeholder="/dashboard or https://..."
        />
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Sending…' : 'Send Notification'}
        </Button>
      </div>
    </form>
  );
}
