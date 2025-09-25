import { Widget } from '@/components/dashboard/widget';
import { Settings } from 'lucide-react';

export function SettingsWidget() {
  return (
    <Widget
      title="Settings"
      description="Account and privacy settings"
      ctaLabel="Manage Settings"
      href="/dashboard/settings"
      icon={<Settings className="h-5 w-5" />}
    >
      <div className="space-y-1 text-sm text-muted-foreground">
        <p>• Change email & password</p>
        <p>• Privacy preferences</p>
        <p>• Account management</p>
      </div>
    </Widget>
  );
}
