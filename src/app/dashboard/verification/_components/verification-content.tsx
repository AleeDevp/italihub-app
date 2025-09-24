import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getLatestVerification } from '@/lib/dal/verification';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

interface VerificationContentProps {
  userId: string;
}

export async function VerificationContent({ userId }: VerificationContentProps) {
  const latestVerification = await getLatestVerification(userId);

  // Mock data for the simplified implementation
  const verificationStatus = {
    isIdVerified: latestVerification?.status === 'APPROVED',
    isAddressVerified: false,
    idVerificationStatus: latestVerification?.status || 'unverified',
    addressVerificationStatus: 'unverified',
  };

  const verificationHistory = latestVerification ? [latestVerification] : [];

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return <ShieldCheck className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <ShieldAlert className="h-5 w-5 text-red-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const verificationProgress = () => {
    if (verificationStatus?.isIdVerified && verificationStatus?.isAddressVerified) {
      return 100;
    }
    if (verificationStatus?.isIdVerified || verificationStatus?.isAddressVerified) {
      return 50;
    }
    return 0;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Verification Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Overall Verification Progress</h3>
              <p className="text-sm text-muted-foreground">
                Complete verification to unlock all features
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{verificationProgress()}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>

          <Progress value={verificationProgress()} className="h-2" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ID Verification */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">ID Verification</span>
                </div>
                {getStatusIcon(verificationStatus?.idVerificationStatus || 'unverified')}
              </div>
              <Badge
                className={getStatusColor(verificationStatus?.idVerificationStatus || 'unverified')}
              >
                {verificationStatus?.idVerificationStatus || 'Not Started'}
              </Badge>
              <div className="mt-3">
                <Button size="sm" variant="outline" className="w-full">
                  {verificationStatus?.isIdVerified ? 'View Documents' : 'Upload ID'}
                </Button>
              </div>
            </div>

            {/* Address Verification */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Address Verification</span>
                </div>
                {getStatusIcon(verificationStatus?.addressVerificationStatus || 'unverified')}
              </div>
              <Badge
                className={getStatusColor(
                  verificationStatus?.addressVerificationStatus || 'unverified'
                )}
              >
                {verificationStatus?.addressVerificationStatus || 'Not Started'}
              </Badge>
              <div className="mt-3">
                <Button size="sm" variant="outline" className="w-full">
                  {verificationStatus?.isAddressVerified ? 'View Documents' : 'Upload Proof'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-medium text-blue-900">ID Document</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Upload a clear photo of your government-issued ID (passport, driver's license, or
                national ID)
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Document must be valid and not expired</li>
                <li>• All text must be clearly visible</li>
                <li>• File size must be under 10MB</li>
                <li>• Accepted formats: JPG, PNG, PDF</li>
              </ul>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-medium text-green-900">Proof of Address</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Upload a recent utility bill, bank statement, or government document showing your
                address
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Document must be issued within the last 3 months</li>
                <li>• Your name and address must be clearly visible</li>
                <li>• File size must be under 10MB</li>
                <li>• Accepted formats: JPG, PNG, PDF</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification History */}
      {verificationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Verification History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {verificationHistory.map((item: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="mt-1">
                    {item.status === 'APPROVED' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : item.status === 'REJECTED' ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{item.type} Verification</h4>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Status: {item.status}</p>
                    {item.reviewNotes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <strong>Notes:</strong> {item.reviewNotes}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benefits of Verification */}
      <Card>
        <CardHeader>
          <CardTitle>Benefits of Account Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Higher Trust Score</h4>
                <p className="text-sm text-muted-foreground">
                  Verified users receive priority in search results
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Advanced Features</h4>
                <p className="text-sm text-muted-foreground">
                  Access to premium listing options and features
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Faster Approvals</h4>
                <p className="text-sm text-muted-foreground">
                  Verified listings are approved faster
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Security Badge</h4>
                <p className="text-sm text-muted-foreground">
                  Display verification badge on your profile
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
