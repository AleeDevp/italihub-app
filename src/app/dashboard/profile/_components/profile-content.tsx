import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { User } from '@/lib/auth';
import { getCityById } from '@/lib/cache/city-cache';
import { Calendar, Edit, MapPin, Shield, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { RiTelegram2Line } from 'react-icons/ri';
import { SiHandshake } from 'react-icons/si';
import { ProfileAvatarSection } from './profile-avatar-section';

interface ProfileContentProps {
  userId: string;
}

export async function ProfileContent({ user }: { user: User }) {
  const userCityName = await getCityById(user.cityId as number);

  return (
    <div className="space-y-6 flex flex-wrap items-center justify-center ">
      {/* Main Profile Card */}
      <Card className="w-full max-w-3xl  mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Your personal information and verification status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-stretch gap-6">
            {/* Avatar */}
            <ProfileAvatarSection
              userId={user.userId as string}
              userName={user.name}
              currentImageKey={user.image}
            />

            <div className="flex-2 w-full space-y-4">
              <div className="flex flex-col gap-4 border rounded-2xl py-4 px-6">
                {/* Profile Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className=" text-xs uppercase tracking-wide text-muted-foreground">
                      Name
                    </label>
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-5 w-5 text-muted-foreground" />
                      <Input variant="showcase" value={user.name} disabled className="" />
                    </div>
                  </div>

                  <div>
                    <label className=" text-xs uppercase tracking-wide text-muted-foreground">
                      ItaliaHub ID
                    </label>
                    <div className="flex items-center gap-2">
                      <SiHandshake className="h-3.5 w-3.5 text-muted-foreground" />
                      <Input variant="showcase" value={user.userId as string} disabled />
                    </div>
                  </div>
                </div>
                <Separator />

                {/* Telegram ID */}
                {user.telegramHandle && (
                  <div className="">
                    <label className=" text-xs uppercase tracking-wide text-muted-foreground">
                      Telegram ID
                    </label>
                    <div className="flex items-center gap-2">
                      <RiTelegram2Line className="h-4.5 w-4.5 text-muted-foreground" />
                      <Input variant="showcase" value={user.telegramHandle || 'Not set'} disabled />
                    </div>
                  </div>
                )}
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Profile
                </Button>
              </div>

              {/* City Change Info */}
              {user.cityLastChangedAt && (
                <div className="flex flex-col space-y-3 border rounded-2xl py-4 px-6">
                  <div>
                    <label className=" text-xs uppercase tracking-wide text-muted-foreground">
                      City
                    </label>
                    <div className="flex w-full justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <Input
                          variant="showcase"
                          className="w-[14ch]"
                          value={userCityName?.name}
                          disabled
                        />
                      </div>
                      <div className="flex flex-col gap-2 mt-1">
                        <div className="text-[10px] flex flex-col items-center text-muted-foreground/50">
                          <label>Last City Change</label>
                          <span className="flex gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(user.cityLastChangedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <MapPin className="h-4 w-4 mr-1" />
                    Change City
                  </Button>
                </div>
              )}

              {/* Verification Status */}
              <div className=" border rounded-2xl py-4 px-6">
                <label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Verification Status
                </label>
                <div className="flex items-center justify-between gap-3 mt-2">
                  {user.verified ? (
                    <>
                      <Badge
                        variant="default"
                        className="bg-green-100 text-green-800 border-green-200"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                      {user.verifiedAt && (
                        <span className="text-sm text-muted-foreground">
                          Verified on {new Date(user.verifiedAt).toLocaleDateString()}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                        <Shield className="h-3 w-3 mr-1" />
                        Not Verified
                      </Badge>

                      <Button variant="outline" size="sm" asChild>
                        <Link href="/dashboard/verification">
                          <Shield className="h-4 w-4 mr-1" />
                          Get Verified
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Completion Tips */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Profile Tips</CardTitle>
          <CardDescription>Complete your profile to get the most out of ItaliaHub</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${profile.profilePhotoKey ? 'bg-green-500' : 'bg-gray-300'}`}
            />
            <span className="text-sm">Add profile photo</span>
            {profile.profilePhotoKey && (
              <Badge variant="outline" className="text-xs">
                ✓ Done
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${profile.telegramHandle ? 'bg-green-500' : 'bg-gray-300'}`}
            />
            <span className="text-sm">Add Telegram handle for easy contact</span>
            {profile.telegramHandle && (
              <Badge variant="outline" className="text-xs">
                ✓ Done
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${profile.verified ? 'bg-green-500' : 'bg-yellow-500'}`}
            />
            <span className="text-sm">Complete identity verification</span>
            {profile.verified ? (
              <Badge variant="outline" className="text-xs">
                ✓ Done
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-yellow-600">
                In Progress
              </Badge>
            )}
          </div>

          {!profile.verified && (
            <div className="pt-3 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Verification unlocks currency exchange and builds trust with other users.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="/dashboard/verification">Start Verification</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card> */}
    </div>
  );
}
