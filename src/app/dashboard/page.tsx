'use client';

import { DoubleCard, DoubleCardGap, DoubleCardInner } from '@/components/double-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/lib/auth';
import { useSession } from '@/lib/auth-client';
import { format } from 'date-fns';
import { CalendarDaysIcon, ShieldIcon, UserIcon } from 'lucide-react';

export default function DashboardPage() {
  const { data, isPending, refetch } = useSession();
  const user = data?.user as User;

  if (isPending) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s your account overview.</p>
        </div>
        <ProfileInformation user={user} />
      </div>
    </div>
  );
}

interface ProfileInformationProps {
  user: User;
}

function ProfileInformation({ user }: ProfileInformationProps) {
  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="size-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Your account details and current status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.image as string} alt={user.name} />
                <AvatarFallback className="text-muted-foreground">
                  <UserIcon className="size-5" />
                </AvatarFallback>
              </Avatar>
              {user.role && (
                <Badge>
                  <ShieldIcon className="size-3" />
                  {user.role}
                </Badge>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-semibold">{user.name}</h3>
                <p className="text-muted-foreground">{user.email}</p>
              </div>

              <div className="space-y-2">
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <CalendarDaysIcon className="size-4" />
                  Member Since
                </div>
                <p className="font-medium">{format(user.createdAt, 'MMMM d, yyyy')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Double Card Component</h1>
            <p className="text-muted-foreground">
              A sophisticated nested card component with three positioning variants
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Variant */}
            <DoubleCard
              variant="top"
              className="h-80"
              innerChildren={
                <DoubleCardInner>
                  <h3 className="font-semibold">Top Variant</h3>
                  <p className="text-sm text-muted-foreground">
                    Inner card sticks to the top of the outer card
                  </p>
                  <Button size="sm">Action</Button>
                </DoubleCardInner>
              }
              gapChildren={
                <DoubleCardGap className="h-full">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-muted rounded-full mx-auto flex items-center justify-center">
                      📊
                    </div>
                    <p className="text-sm">Gap content area</p>
                  </div>
                </DoubleCardGap>
              }
            />

            {/* Middle Variant */}
            <DoubleCard
              variant="middle"
              className="h-80"
              innerChildren={
                <DoubleCardInner>
                  <h3 className="font-semibold">Middle Variant</h3>
                  <p className="text-sm text-muted-foreground">
                    Inner card centers in the outer card
                  </p>
                  <Button size="sm" variant="secondary">
                    Action
                  </Button>
                </DoubleCardInner>
              }
              gapChildren={
                <DoubleCardGap>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-muted rounded mx-auto mb-2 flex items-center justify-center">
                      ⚡
                    </div>
                    <p className="text-xs">Centered gap</p>
                  </div>
                </DoubleCardGap>
              }
            />

            {/* Bottom Variant */}
            <DoubleCard
              variant="bottom"
              className="h-80"
              innerChildren={
                <DoubleCardInner>
                  <h3 className="font-semibold">Bottom Variant</h3>
                  <p className="text-sm text-muted-foreground">
                    Inner card sticks to the bottom of the outer card
                  </p>
                  <Button size="sm" variant="outline">
                    Action
                  </Button>
                </DoubleCardInner>
              }
              gapChildren={
                <DoubleCardGap className="h-full">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-muted rounded-lg mx-auto flex items-center justify-center">
                      🎯
                    </div>
                    <p className="text-sm">Bottom gap content</p>
                  </div>
                </DoubleCardGap>
              }
            />
          </div>

          {/* Custom Styling Examples */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Custom Styling Examples</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Custom Outer Styling */}
              <DoubleCard
                variant="top"
                className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20"
                outerClassName="border-blue-200 dark:border-blue-800 p-8"
                innerClassName="bg-white dark:bg-gray-900 border-blue-300 dark:border-blue-700 shadow-blue-100 dark:shadow-blue-900/20"
                innerChildren={
                  <DoubleCardInner>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      Custom Styled
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      Custom colors and enhanced padding
                    </p>
                  </DoubleCardInner>
                }
                gapChildren={
                  <DoubleCardGap className="text-blue-500">
                    <p className="text-sm">Custom gap styling</p>
                  </DoubleCardGap>
                }
              />

              {/* Minimal Styling */}
              <DoubleCard
                variant="middle"
                className="h-64"
                outerClassName="border-dashed border-2 p-4 shadow-none"
                innerClassName="shadow-sm border-solid p-3"
                innerChildren={
                  <DoubleCardInner>
                    <h3 className="font-semibold">Minimal Style</h3>
                    <p className="text-sm text-muted-foreground">Reduced shadows and padding</p>
                  </DoubleCardInner>
                }
                gapChildren={
                  <DoubleCardGap>
                    <p className="text-xs text-muted-foreground">Simple gap</p>
                  </DoubleCardGap>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
