'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useCities, useCityName } from '@/contexts/cities-context';
import { useUserIdAvailability } from '@/hooks/use-userid-availability';
import type { User } from '@/lib/auth/client';
import { profileBasicsSchema } from '@/lib/schemas/dashboard';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckIcon,
  ChevronsUpDown,
  Edit,
  Loader2,
  MapPin,
  Shield,
  User as UserIcon,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import { RiTelegram2Line } from 'react-icons/ri';
import { SiHandshake } from 'react-icons/si';
import { toast } from 'sonner';
import { changeCityAction } from '../change-city-action';
import { updateProfileBasicsAction } from '../update-profile-basic-action';
import { ProfileAvatarSection } from './profile-avatar-section';

interface ProfileContentProps {
  user: User;
}

export function ProfileContent({ user }: ProfileContentProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: user.name,
    userId: user.userId || '',
    telegram: user.telegramHandle || '',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const cityName = useCityName(user.cityId);

  // Track original values to detect changes
  const originalData = React.useMemo(
    () => ({
      name: user.name,
      userId: user.userId || '',
      telegram: user.telegramHandle || '',
    }),
    [user.name, user.userId, user.telegramHandle]
  );

  // Check if form has changes
  const hasChanges = React.useMemo(() => {
    return (
      formData.name !== originalData.name ||
      formData.userId !== originalData.userId ||
      formData.telegram !== originalData.telegram
    );
  }, [formData, originalData]);

  // City change dialog state
  const [showCityDialog, setShowCityDialog] = React.useState(false);
  const [showCityWarning, setShowCityWarning] = React.useState(false);
  const [selectedCityName, setSelectedCityName] = React.useState<string>('');
  const [cityComboboxOpen, setCityComboboxOpen] = React.useState(false);
  const [isChangingCity, setIsChangingCity] = React.useState(false);
  const cities = useCities();

  // UserID availability checking
  const {
    status: userIdStatus,
    message: userIdMessage,
    check: checkUserId,
  } = useUserIdAvailability(user.userId || undefined);

  // Check userId availability when it changes during editing
  React.useEffect(() => {
    if (isEditing && formData.userId && formData.userId !== user.userId) {
      checkUserId(formData.userId);
    }
  }, [isEditing, formData.userId, user.userId, checkUserId]);

  const handleInputChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Real-time validation for Name and Telegram fields only (UserId handled separately)
    if (field === 'name' || field === 'telegram') {
      validateField(field, newFormData);
    } else {
      // For other fields, just clear the error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
    }
  };

  const validateField = (fieldName: string, data = formData) => {
    const fieldSchema =
      profileBasicsSchema.shape[fieldName as keyof typeof profileBasicsSchema.shape];
    if (fieldSchema) {
      const result = fieldSchema.safeParse(data[fieldName as keyof typeof data]);
      if (!result.success) {
        setErrors((prev) => ({
          ...prev,
          [fieldName]: result.error.issues[0]?.message || 'Invalid value',
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      }
    }
  };

  const validateForm = () => {
    const result = profileBasicsSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        newErrors[field] = issue.message;
      });
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSave = async () => {
    // Prevent submission if no changes were made
    if (!hasChanges) {
      toast.info('No changes to save');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    // Check userId availability before submitting
    if (formData.userId !== user.userId && userIdStatus !== 'available') {
      toast.error('Please choose an available User ID');
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.set('name', formData.name);
      fd.set('userId', formData.userId);
      fd.set('telegram', formData.telegram);

      const result = await updateProfileBasicsAction(fd);

      if (result.ok) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        // Refresh the page to show updated data
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error: any) {
      toast.error(error?.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setErrors({});
    setIsEditing(false);
  };

  // Check if user can change city (10-day cooldown)
  const canChangeCity = React.useMemo(() => {
    if (!user.cityLastChangedAt) return true;
    const daysSinceChange = Math.floor(
      (Date.now() - new Date(user.cityLastChangedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceChange >= 10;
  }, [user.cityLastChangedAt]);

  const daysUntilCityChange = React.useMemo(() => {
    if (!user.cityLastChangedAt || canChangeCity) return 0;
    const daysSinceChange = Math.floor(
      (Date.now() - new Date(user.cityLastChangedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    return 10 - daysSinceChange;
  }, [user.cityLastChangedAt, canChangeCity]);

  const handleCitySelect = (cityName: string) => {
    setSelectedCityName(cityName);
    setCityComboboxOpen(false);
  };

  const handleCityChange = async () => {
    if (!selectedCityName || !cities) return;

    // Find the selected city by name to get the ID
    const selectedCity = cities.find((c) => c.name === selectedCityName);
    if (!selectedCity) {
      toast.error('Selected city not found');
      return;
    }

    setIsChangingCity(true);
    try {
      const fd = new FormData();
      fd.set('cityId', selectedCity.id.toString());

      const result = await changeCityAction(fd);

      if (result.ok) {
        if (result.data.revokedVerification) {
          toast.success(
            'City changed successfully! Please note that your account verification has been cleared.',
            { duration: 5000 }
          );
        } else {
          toast.success('City changed successfully!');
        }
        setShowCityDialog(false);
        setShowCityWarning(false);
        setSelectedCityName('');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error: any) {
      toast.error(error?.message || 'An unexpected error occurred');
    } finally {
      setIsChangingCity(false);
    }
  };

  const handleCityDialogClose = () => {
    setShowCityDialog(false);
    setShowCityWarning(false);
    setSelectedCityName('');
    setCityComboboxOpen(false);
  };

  return (
    <div className="space-y-6 flex-wrap ">
      {/* Main Profile Card */}
      <Card>
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
              isVerified={user.verified as boolean}
              userName={user.name}
              currentImageKey={user.image}
            />

            <div className="flex-2 w-full space-y-4">
              <div className="flex flex-col gap-4 border rounded-2xl py-4 px-6">
                {/* Profile Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="form-label">Name</label>
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-5 w-5 text-muted-foreground" />
                      <Input
                        variant={isEditing ? 'default' : 'showcase'}
                        value={formData.name}
                        disabled={!isEditing}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                    </div>
                    {errors.name && (
                      <div className="absolute top-full right-0 mt-1 z-10">
                        <p className="text-xs text-destructive px-3 py-1.5 rounded-md bg-white/80 backdrop-blur-sm border border-destructive/20 shadow-sm whitespace-nowrap">
                          {errors.name}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="form-label">ItaliaHub ID</label>
                    <div className="flex items-center gap-2">
                      <SiHandshake className="h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        variant={isEditing ? 'default' : 'showcase'}
                        value={formData.userId}
                        disabled={!isEditing}
                        onChange={(e) => handleInputChange('userId', e.target.value)}
                      />
                    </div>
                    {errors.userId && (
                      <div className="absolute top-full right-0 mt-1 z-10">
                        <p className="text-xs text-destructive px-3 py-1.5 rounded-md bg-white/80 backdrop-blur-sm border border-destructive/20 shadow-sm whitespace-nowrap">
                          {errors.userId}
                        </p>
                      </div>
                    )}
                    {isEditing &&
                      formData.userId !== user.userId &&
                      userIdMessage &&
                      !errors.userId && (
                        <div className="absolute top-full right-0 mt-1 z-10">
                          <p
                            className={`text-xs px-3 py-1.5 rounded-md bg-white/80 backdrop-blur-sm border shadow-sm whitespace-nowrap ${
                              userIdStatus === 'available'
                                ? 'text-green-700 border-green-200'
                                : userIdStatus === 'checking'
                                  ? 'text-blue-700 border-blue-200'
                                  : 'text-destructive border-destructive/20'
                            }`}
                          >
                            {userIdMessage}
                          </p>
                        </div>
                      )}
                  </div>
                </div>
                <Separator />

                {/* Telegram ID */}

                <div className="relative">
                  <label className="form-label">Telegram ID</label>
                  <div className="flex items-center gap-2">
                    <RiTelegram2Line className="h-4.5 w-4.5 text-muted-foreground" />
                    <Input
                      variant={isEditing ? 'default' : 'showcase'}
                      value={formData.telegram}
                      placeholder={isEditing ? 'username' : 'Not set'}
                      disabled={!isEditing}
                      onChange={(e) => handleInputChange('telegram', e.target.value)}
                    />
                  </div>
                  {errors.telegram && (
                    <div className="absolute top-full left-0 mt-1 z-10">
                      <p className="text-xs text-destructive px-3 py-1.5 rounded-md bg-white/80 backdrop-blur-sm border border-destructive/20 shadow-sm whitespace-nowrap">
                        {errors.telegram}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSave}
                      disabled={isSubmitting || !hasChanges}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      {isSubmitting ? 'Saving...' : 'Done'}
                    </Button>
                  </div>
                )}
              </div>

              {/* City Change Info */}

              <div className="flex flex-col space-y-3 border rounded-2xl py-4 px-6">
                <div>
                  <label className=" form-label">City</label>
                  <div className="flex w-full justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Input
                        variant="showcase"
                        className="w-[14ch]"
                        value={cityName || 'Unknown'}
                        disabled
                      />
                    </div>
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="text-[10px] flex flex-col items-center text-muted-foreground/50">
                        <label>Last City Change</label>
                        <span className="flex gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(user.cityLastChangedAt || '').toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowCityDialog(true)}>
                  <MapPin className="h-4 w-4 mr-1" />
                  Change City
                </Button>
              </div>

              {/* Verification Status */}
              <div className=" border rounded-2xl py-4 px-6">
                <label className="form-label">Verification Status</label>
                <div className="flex items-center justify-between gap-3 mt-2">
                  {user.verified ? (
                    <>
                      <Badge
                        variant="default"
                        className="bg-green-100 text-green-800 border-green-200"
                      >
                        <CheckIcon className="h-3 w-3 mr-1" />
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

      {/* Change City Dialog */}
      <Dialog open={showCityDialog} onOpenChange={handleCityDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change City</DialogTitle>
            <DialogDescription>
              {canChangeCity
                ? 'Select your new city. Note that changing your city will affect your verification status.'
                : `You can change your city again in ${daysUntilCityChange} day${daysUntilCityChange !== 1 ? 's' : ''}.`}
            </DialogDescription>
          </DialogHeader>

          {!canChangeCity ? (
            <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-800">City change not available</p>
                <p className="text-xs text-orange-700 mt-1">
                  You changed your city recently. You can change it again in {daysUntilCityChange}{' '}
                  day{daysUntilCityChange !== 1 ? 's' : ''}.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select City</label>
                <Popover open={cityComboboxOpen} onOpenChange={setCityComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={cityComboboxOpen}
                      className="w-full justify-between mt-2"
                    >
                      {selectedCityName ? selectedCityName : 'Select city'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    onWheel={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    align="start"
                    sideOffset={4}
                  >
                    <Command>
                      <CommandInput placeholder="Search city..." />
                      <CommandEmpty>No city found.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {cities?.map((c) => (
                            <CommandItem
                              key={c.id}
                              disabled={c.id === user.cityId}
                              value={c.name}
                              onSelect={(val) => {
                                handleCitySelect(val);
                              }}
                            >
                              <CheckIcon
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  selectedCityName === c.name ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              {c.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedCityName && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800">
                      Selected City: {selectedCityName}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Click "Change City" to proceed with the change.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCityDialogClose}>
              Cancel
            </Button>
            {canChangeCity && selectedCityName && (
              <Button onClick={() => setShowCityWarning(true)}>
                <MapPin className="h-4 w-4 mr-2" />
                Change City
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* City Change Warning Dialog */}
      <Dialog open={showCityWarning} onOpenChange={() => setShowCityWarning(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Are you sure you want to change your city?
            </DialogTitle>
            <DialogDescription>
              You are about to change your city to {selectedCityName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                <strong>Warning:</strong> By changing your city, your account verification will be
                cleared and you will need to submit new documents to verify your account again.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCityWarning(false)}
              disabled={isChangingCity}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCityChange}
              disabled={isChangingCity}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isChangingCity ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                'Yes, Change City'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
