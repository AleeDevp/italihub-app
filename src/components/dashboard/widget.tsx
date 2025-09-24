import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

interface WidgetProps {
  title: string;
  description?: string;
  ctaLabel: string;
  href: string;
  icon?: ReactNode;
  children?: ReactNode;
}

export function Widget({ title, description, ctaLabel, href, icon, children }: WidgetProps) {
  return (
    <Link href={href} className="block group">
      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {icon && <div className="text-primary">{icon}</div>}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          {description && (
            <CardDescription className="text-sm text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </CardHeader>

        {children && <CardContent className="pb-3">{children}</CardContent>}

        <CardContent className="pt-0">
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-auto font-medium text-primary group-hover:text-primary/80"
          >
            {ctaLabel}
            <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
