import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  HelpCircle,
  Mail,
  MessageSquare,
  Phone,
} from 'lucide-react';

interface SupportContentProps {
  userId: string;
}

// Mock support tickets data
const mockSupportTickets = [
  {
    id: '1',
    subject: 'Unable to upload profile photo',
    status: 'RESOLVED',
    priority: 'MEDIUM',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-16'),
    lastReply: 'Our team',
  },
  {
    id: '2',
    subject: 'Ad approval taking too long',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-12'),
    lastReply: 'You',
  },
];

export async function SupportContent({ userId }: SupportContentProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'OPEN':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'OPEN':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="flex items-center gap-3 p-4">
            <MessageSquare className="h-8 w-8 text-blue-500" />
            <div>
              <h3 className="font-medium">Live Chat</h3>
              <p className="text-sm text-muted-foreground">Get instant help</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="flex items-center gap-3 p-4">
            <BookOpen className="h-8 w-8 text-green-500" />
            <div>
              <h3 className="font-medium">Help Center</h3>
              <p className="text-sm text-muted-foreground">Browse articles</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="flex items-center gap-3 p-4">
            <Phone className="h-8 w-8 text-purple-500" />
            <div>
              <h3 className="font-medium">Call Support</h3>
              <p className="text-sm text-muted-foreground">+39 123 456 789</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create New Ticket */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Submit a Support Request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="Brief description of your issue" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a category</option>
                <option value="account">Account Issues</option>
                <option value="ads">Ad Management</option>
                <option value="payment">Payment & Billing</option>
                <option value="technical">Technical Problems</option>
                <option value="verification">Verification</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <select
              id="priority"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="LOW">Low - General question</option>
              <option value="MEDIUM">Medium - Feature request</option>
              <option value="HIGH">High - Urgent issue</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about your issue..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachments">Attachments (Optional)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Max file size: 10MB. Supported formats: JPG, PNG, PDF
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button>Submit Request</Button>
          </div>
        </CardContent>
      </Card>

      {/* My Support Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>My Support Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {mockSupportTickets.length > 0 ? (
            <div className="space-y-4">
              {mockSupportTickets.map((ticket) => (
                <div key={ticket.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{ticket.subject}</h4>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Ticket #{ticket.id}</span>
                        <span>Created: {ticket.createdAt.toLocaleDateString()}</span>
                        <span>Last updated: {ticket.updatedAt.toLocaleDateString()}</span>
                        <span>Last reply: {ticket.lastReply}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ticket.status)}
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No support tickets</h3>
              <p className="text-muted-foreground">
                You haven't submitted any support requests yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">How do I verify my account?</h4>
              <p className="text-sm text-muted-foreground">
                To verify your account, go to the Verification section in your dashboard and upload
                your ID document and proof of address.
              </p>
              <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                <ExternalLink className="h-3 w-3 mr-1" />
                Read more
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Why was my ad rejected?</h4>
              <p className="text-sm text-muted-foreground">
                Ads can be rejected for various reasons including inappropriate content, missing
                information, or policy violations. Check your email for specific rejection reasons.
              </p>
              <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                <ExternalLink className="h-3 w-3 mr-1" />
                Read more
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">How do I change my city?</h4>
              <p className="text-sm text-muted-foreground">
                You can change your city once every 30 days from your Profile settings. Note that
                changing your city will affect your ad visibility.
              </p>
              <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                <ExternalLink className="h-3 w-3 mr-1" />
                Read more
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">How do I delete my account?</h4>
              <p className="text-sm text-muted-foreground">
                Account deletion can be done from Settings {'>'} Danger Zone. This action is
                permanent and cannot be undone.
              </p>
              <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                <ExternalLink className="h-3 w-3 mr-1" />
                Read more
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Customer Support</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">support@italihub.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">+39 123 456 789</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Business Hours</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Monday - Friday: 9:00 AM - 6:00 PM CET</div>
                <div>Saturday: 10:00 AM - 4:00 PM CET</div>
                <div>Sunday: Closed</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
