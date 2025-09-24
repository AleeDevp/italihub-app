import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserProfileData } from '@/lib/dal/user';
import { AtSign, Calendar, Edit, MapPin, MessageCircle, Shield, User } from 'lucide-react';

interface ProfileContentProps {
  userId: string;
}

export async function ProfileContent({ userId }: ProfileContentProps) {
  const profile = await getUserProfileData(userId);

  return (
    <div className="space-y-6">
      {/* Main Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Your personal information and verification status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.profilePhotoKey || undefined} />
                <AvatarFallback className="text-xl">{profile.name[0]}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Change Photo
              </Button>
            </div>

            {/* Profile Details */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-lg font-medium">{profile.name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Username (ItaliaHub ID)
                  </label>
                  <div className="flex items-center gap-2">
                    <AtSign className="h-4 w-4 text-muted-foreground" />
                    <p className="text-lg font-medium">{profile.userId}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Telegram Handle
                  </label>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <p className="text-lg">{profile.telegramHandle || 'Not set'}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-lg">{profile.cityName}</p>
                  </div>
                </div>
              </div>

              {/* Verification Status */}
              <div className="pt-4 border-t">
                <label className="text-sm font-medium text-muted-foreground">
                  Verification Status
                </label>
                <div className="flex items-center gap-3 mt-2">
                  {profile.verified ? (
                    <>
                      <Badge
                        variant="default"
                        className="bg-green-100 text-green-800 border-green-200"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                      {profile.verifiedAt && (
                        <span className="text-sm text-muted-foreground">
                          Verified on {new Date(profile.verifiedAt).toLocaleDateString()}
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
                        <a href="/dashboard/verification">Get Verified</a>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* City Change Info */}
              {profile.cityLastChangedAt && (
                <div className="pt-4 border-t">
                  <label className="text-sm font-medium text-muted-foreground">
                    Last City Change
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {new Date(profile.cityLastChangedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              Change City
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Completion Tips */}
      <Card>
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
      </Card>
    </div>
  );
}
