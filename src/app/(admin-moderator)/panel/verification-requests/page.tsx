'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/user-avatar';
import { useCities } from '@/contexts/cities-context';
import { resolveImageUrl } from '@/lib/image-utils-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Filter,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// Types
// =============================================================================

interface VerificationRequest {
  id: number;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  method:
    | 'LANDMARK_SELFIE'
    | 'STUDENT_CARD'
    | 'IDENTITA'
    | 'PERMESSO'
    | 'RENTAL_CONTRACT'
    | 'OTHER';
  cityId: number;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedByUserId?: string | null;
  userNote?: string | null;
  rejectionCode?: string | null;
  rejectionNote?: string | null;
  filesCount: number;
  user: {
    name?: string | null;
    userId?: string | null;
    email?: string | null;
    telegramHandle?: string | null;
    image?: string | null;
  };
  city: {
    name: string;
    slug: string;
    region?: string | null;
  };
  files: {
    id: number;
    storageKey: string;
    mimeType?: string | null;
    bytes?: number | null;
    role: 'IMAGE' | 'DOCUMENT' | 'OTHER';
    createdAt: string;
  }[];
}

interface VerificationFilters {
  search: string;
  status: string;
  method: string;
  cityId: string;
  rejectionCode: string;
  dateFrom: string;
  dateTo: string;
  reviewedBy: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface VerificationStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  requestsThisWeek: number;
  requestsThisMonth: number;
  averageProcessingTimeHours: number;
  topRejectionReasons: { code: string; count: number }[];
  cityStats: { cityName: string; pending: number; total: number }[];
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchVerificationRequests(params: {
  search?: string;
  status?: string;
  method?: string;
  cityId?: string;
  rejectionCode?: string;
  dateFrom?: string;
  dateTo?: string;
  reviewedBy?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== '') {
      searchParams.append(key, value.toString());
    }
  });

  const response = await fetch(`/api/moderator/verification-requests?${searchParams}`);

  if (!response.ok) {
    throw new Error('Failed to fetch verification requests');
  }

  return response.json();
}

async function fetchVerificationStats() {
  const response = await fetch('/api/moderator/verification-requests/stats');

  if (!response.ok) {
    throw new Error('Failed to fetch verification statistics');
  }

  return response.json();
}

async function fetchFilterOptions() {
  const response = await fetch('/api/moderator/verification-requests/filters');

  if (!response.ok) {
    throw new Error('Failed to fetch filter options');
  }

  return response.json();
}

async function fetchVerificationDetails(id: number) {
  const response = await fetch(`/api/moderator/verification-requests/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch verification details');
  }

  return response.json();
}

async function approveVerificationRequest(id: number) {
  const response = await fetch(`/api/moderator/verification-requests/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'approve' }),
  });

  if (!response.ok) {
    throw new Error('Failed to approve verification request');
  }

  return response.json();
}

async function rejectVerificationRequest(
  id: number,
  rejectionCode: string,
  rejectionNote?: string
) {
  const response = await fetch(`/api/moderator/verification-requests/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'reject',
      rejectionCode,
      rejectionNote,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to reject verification request');
  }

  return response.json();
}

// =============================================================================
// Utility Functions
// =============================================================================

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'APPROVED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'REJECTED':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PENDING':
      return <Clock className="h-3 w-3" />;
    case 'APPROVED':
      return <CheckCircle2 className="h-3 w-3" />;
    case 'REJECTED':
      return <XCircle className="h-3 w-3" />;
    default:
      return <AlertCircle className="h-3 w-3" />;
  }
};

const getMethodDisplayName = (method: string) => {
  const methodNames: Record<string, string> = {
    LANDMARK_SELFIE: 'Landmark Selfie',
    STUDENT_CARD: 'Student Card',
    IDENTITA: "Carta d'Identità",
    PERMESSO: 'Permesso di Soggiorno',
    RENTAL_CONTRACT: 'Rental Contract',
    OTHER: 'Other',
  };
  return methodNames[method] || method;
};

const getRejectionCodeDisplayName = (code: string) => {
  const codeNames: Record<string, string> = {
    INSUFFICIENT_PROOF: 'Insufficient Proof',
    CITY_MISMATCH: 'City Mismatch',
    EXPIRED_DOCUMENT: 'Expired Document',
    UNREADABLE: 'Unreadable Document',
    OTHER: 'Other Reason',
  };
  return codeNames[code] || code;
};

// =============================================================================
// Memoized Components for Performance
// =============================================================================

interface VerificationRequestRowProps {
  request: VerificationRequest;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onReview: (request: VerificationRequest) => void;
}

const VerificationRequestRow = memo(
  ({ request, isSelected, onSelect, onReview }: VerificationRequestRowProps) => {
    return (
      <div
        key={request.id}
        className="lg:grid lg:grid-cols-12 gap-4 p-4 border rounded-lg hover:bg-gray-50"
      >
        {/* Mobile Layout */}
        <div className="lg:hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox checked={isSelected} onCheckedChange={() => onSelect(request.id)} />
              <Badge className={getStatusColor(request.status)}>
                {getStatusIcon(request.status)}
                <span className="ml-1">{request.status}</span>
              </Badge>
            </div>
            <div className="text-sm text-gray-500">
              {format(new Date(request.submittedAt), 'MMM d, yyyy')}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <UserAvatar
              image={request.user.image ?? null}
              alt={request.user.name ?? 'User'}
              className="h-8 w-8"
              size={64}
              isVerified={Boolean((request as any).user?.verified)}
            />
            <div>
              <div className="font-medium text-gray-900">
                {request.user.name || request.user.userId || 'Unknown User'}
              </div>
              <div className="text-sm text-gray-500">{request.user.email}</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {request.city.name}
            </div>
            <div>{getMethodDisplayName(request.method)}</div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => onReview(request)}>
              <Eye className="h-3 w-3 mr-1" />
              Review
            </Button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:contents">
          <div className="col-span-1 flex items-center">
            <Checkbox checked={isSelected} onCheckedChange={() => onSelect(request.id)} />
          </div>

          <div className="col-span-2 flex items-center">
            <div>
              <div className="text-sm font-medium text-gray-900">
                {format(new Date(request.submittedAt), 'MMM d, yyyy')}
              </div>
              <div className="text-xs text-gray-500">
                {format(new Date(request.submittedAt), 'HH:mm')}
              </div>
            </div>
          </div>

          <div className="col-span-2 flex items-center gap-3">
            <UserAvatar
              image={request.user.image ?? null}
              alt={request.user.name ?? 'User'}
              className="h-8 w-8"
              size={64}
              isVerified={Boolean((request as any).user?.verified)}
            />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {request.user.name || request.user.userId || 'Unknown'}
              </div>
              <div className="text-xs text-gray-500 truncate">{request.user.email}</div>
            </div>
          </div>

          <div className="col-span-1 flex items-center">
            <Badge className={getStatusColor(request.status)}>
              {getStatusIcon(request.status)}
              <span className="ml-1">{request.status}</span>
            </Badge>
          </div>

          <div className="col-span-2 flex items-center">
            <div className="text-sm text-gray-900">{getMethodDisplayName(request.method)}</div>
          </div>

          <div className="col-span-2 flex items-center">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-3 w-3" />
              {request.city.name}
            </div>
          </div>

          <div className="col-span-2 flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onReview(request)}>
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

VerificationRequestRow.displayName = 'VerificationRequestRow';

// =============================================================================
// Main Component
// =============================================================================

export default function VerificationRequestsPage() {
  // State
  const [filters, setFilters] = useState<VerificationFilters>({
    search: '',
    status: '',
    method: '',
    cityId: '',
    rejectionCode: '',
    dateFrom: '',
    dateTo: '',
    reviewedBy: '',
  });

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [sortConfig, setSortConfig] = useState({
    sortBy: 'submittedAt',
    sortOrder: 'desc',
  });

  const [selectedRequests, setSelectedRequests] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionForm, setRejectionForm] = useState({
    code: '',
    note: '',
  });
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  // Query client
  const queryClient = useQueryClient();

  // Cities from client-side cache/provider
  const cities = useCities();

  // Memoized query params
  const queryParams = useMemo(
    () => ({
      ...filters,
      ...sortConfig,
      page: pagination.page,
      limit: pagination.limit,
    }),
    [filters, sortConfig, pagination.page, pagination.limit]
  );

  // Queries
  const {
    data: verificationData,
    isLoading: isLoadingRequests,
    error: requestsError,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['verification-requests', queryParams],
    queryFn: () => fetchVerificationRequests(queryParams),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['verification-stats'],
    queryFn: fetchVerificationStats,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  const { data: filterOptionsData } = useQuery({
    queryKey: ['verification-filter-options'],
    queryFn: fetchFilterOptions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: detailsData, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['verification-details', selectedRequest?.id],
    queryFn: () => (selectedRequest ? fetchVerificationDetails(selectedRequest.id) : null),
    enabled: !!selectedRequest && reviewDialogOpen,
    staleTime: 30 * 1000,
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: approveVerificationRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['verification-stats'] });
      toast.success('Verification request approved successfully');
      setReviewDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: (error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, code, note }: { id: number; code: string; note?: string }) =>
      rejectVerificationRequest(id, code, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['verification-stats'] });
      toast.success('Verification request rejected successfully');
      setRejectionDialogOpen(false);
      setSelectedRequest(null);
      setRejectionForm({ code: '', note: '' });
    },
    onError: (error) => {
      toast.error(`Failed to reject: ${error.message}`);
    },
  });

  // Bulk mutations
  const bulkApprove = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await fetch('/api/moderator/verification-requests/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', ids }),
      });
      if (!res.ok) throw new Error('Bulk approve failed');
      return res.json();
    },
    onSuccess: (data: any) => {
      const ok = data?.data?.successful?.length ?? 0;
      const fail = data?.data?.failed?.length ?? 0;
      toast.success(`Bulk approved ${ok} request(s)` + (fail ? `, ${fail} failed` : ''));
      queryClient.invalidateQueries({ queryKey: ['verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['verification-stats'] });
      setSelectedRequests(new Set());
    },
    onError: (e: any) => toast.error(e.message || 'Bulk approve failed'),
  });

  const bulkReject = useMutation({
    mutationFn: async (payload: { ids: number[]; code: string; note?: string }) => {
      const res = await fetch('/api/moderator/verification-requests/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          ids: payload.ids,
          rejectionCode: payload.code,
          rejectionNote: payload.note,
        }),
      });
      if (!res.ok) throw new Error('Bulk reject failed');
      return res.json();
    },
    onSuccess: (data: any) => {
      const ok = data?.data?.successful?.length ?? 0;
      const fail = data?.data?.failed?.length ?? 0;
      toast.success(`Bulk rejected ${ok} request(s)` + (fail ? `, ${fail} failed` : ''));
      queryClient.invalidateQueries({ queryKey: ['verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['verification-stats'] });
      setSelectedRequests(new Set());
    },
    onError: (e: any) => toast.error(e.message || 'Bulk reject failed'),
  });

  // Update pagination when data changes
  useEffect(() => {
    if (verificationData?.data) {
      setPagination((prev) => ({
        ...prev,
        total: verificationData.data.total,
        totalPages: verificationData.data.totalPages,
      }));
    }
  }, [verificationData]);

  // Reset document index when new details open
  useEffect(() => {
    if (detailsData?.data?.files?.length) {
      setSelectedFileIndex(0);
    }
  }, [detailsData]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  // Handlers
  const handleFilterChange = useCallback((key: keyof VerificationFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleSortChange = useCallback((sortBy: string) => {
    setSortConfig((prev) => ({
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handleSelectRequest = useCallback((id: number) => {
    setSelectedRequests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!verificationData?.data?.requests) return;

    const allIds = verificationData.data.requests.map((req: VerificationRequest) => req.id);
    const allSelected = allIds.every((id: number) => selectedRequests.has(id));

    if (allSelected) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(allIds));
    }
  }, [verificationData?.data?.requests, selectedRequests]);

  const handleReviewRequest = useCallback((request: VerificationRequest) => {
    setSelectedRequest(request);
    setReviewDialogOpen(true);
  }, []);
  // Row-level approve/reject removed to avoid accidental actions

  const handleConfirmRejection = useCallback(() => {
    if (!selectedRequest || !rejectionForm.code) return;

    rejectMutation.mutate({
      id: selectedRequest.id,
      code: rejectionForm.code,
      note: rejectionForm.note,
    });
  }, [selectedRequest, rejectionForm, rejectMutation]);

  const handleRefresh = useCallback(() => {
    refetchRequests();
    queryClient.invalidateQueries({ queryKey: ['verification-stats'] });
  }, [refetchRequests, queryClient]);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: '',
      method: '',
      cityId: '',
      rejectionCode: '',
      dateFrom: '',
      dateTo: '',
      reviewedBy: '',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Data
  const requests = verificationData?.data?.requests || [];
  const stats = statsData?.data;
  const filterOptions = filterOptionsData?.data;
  const details = detailsData?.data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Verification Requests</h1>
              <p className="text-gray-600">Review and manage user identity verification requests</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoadingRequests}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingRequests ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {stats.pendingRequests}
                      </div>
                      <div className="text-sm text-gray-600">Pending</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {stats.approvedRequests}
                      </div>
                      <div className="text-sm text-gray-600">Approved</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {stats.rejectedRequests}
                      </div>
                      <div className="text-sm text-gray-600">Rejected</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.requestsThisWeek}
                      </div>
                      <div className="text-sm text-gray-600">This Week</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by user name, email, ID, or notes..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                    autoComplete="off"
                    aria-label="Search verification requests"
                  />
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2">
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) =>
                    handleFilterChange('status', value === 'all' ? '' : value)
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                {filterOptions?.methods && (
                  <Select
                    value={filters.method || 'all'}
                    onValueChange={(value) =>
                      handleFilterChange('method', value === 'all' ? '' : value)
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      {filterOptions.methods.map((method: string) => (
                        <SelectItem key={method} value={method}>
                          {getMethodDisplayName(method)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Extended Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {cities.length > 0 && (
                    <Select
                      value={filters.cityId || 'all'}
                      onValueChange={(value) =>
                        handleFilterChange('cityId', value === 'all' ? '' : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="City" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cities</SelectItem>
                        {cities.map((city: any) => (
                          <SelectItem key={city.id} value={city.id.toString()}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {filterOptions?.rejectionCodes && (
                    <Select
                      value={filters.rejectionCode || 'all'}
                      onValueChange={(value) =>
                        handleFilterChange('rejectionCode', value === 'all' ? '' : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Rejection Code" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Codes</SelectItem>
                        {filterOptions.rejectionCodes.map((code: string) => (
                          <SelectItem key={code} value={code}>
                            {getRejectionCodeDisplayName(code)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Input
                    type="date"
                    placeholder="From Date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  />

                  <Input
                    type="date"
                    placeholder="To Date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  />
                </div>

                <div className="flex justify-end mt-4 gap-2">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Verification Requests
                {verificationData?.data && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({verificationData.data.total} total)
                  </span>
                )}
              </CardTitle>

              {selectedRequests.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{selectedRequests.size} selected</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" disabled>
                        Bulk Actions (disabled)
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem disabled>
                        <Check className="h-4 w-4 mr-2" />
                        Bulk Approve ({selectedRequests.size})
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        <X className="h-4 w-4 mr-2" />
                        Bulk Reject ({selectedRequests.size})
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingRequests ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading verification requests...</span>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No verification requests found
                </h3>
                <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-4 mb-4 pb-2 border-b text-sm font-medium text-gray-500">
                  <div className="col-span-1">
                    <Checkbox
                      checked={
                        requests.length > 0 &&
                        requests.every((req: VerificationRequest) => selectedRequests.has(req.id))
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </div>
                  <div
                    className="col-span-2 cursor-pointer hover:text-gray-700"
                    onClick={() => handleSortChange('submittedAt')}
                  >
                    Submitted
                  </div>
                  <div
                    className="col-span-2 cursor-pointer hover:text-gray-700"
                    onClick={() => handleSortChange('userId')}
                  >
                    User
                  </div>
                  <div
                    className="col-span-1 cursor-pointer hover:text-gray-700"
                    onClick={() => handleSortChange('status')}
                  >
                    Status
                  </div>
                  <div
                    className="col-span-2 cursor-pointer hover:text-gray-700"
                    onClick={() => handleSortChange('method')}
                  >
                    Method
                  </div>
                  <div
                    className="col-span-2 cursor-pointer hover:text-gray-700"
                    onClick={() => handleSortChange('cityId')}
                  >
                    City
                  </div>
                  <div className="col-span-2">Actions</div>
                </div>

                {/* Table Rows */}
                <div className="space-y-2">
                  {requests.map((request: VerificationRequest) => (
                    <VerificationRequestRow
                      key={request.id}
                      request={request}
                      isSelected={selectedRequests.has(request.id)}
                      onSelect={handleSelectRequest}
                      onReview={handleReviewRequest}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <div className="text-sm text-gray-500">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} results
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, pagination.page - 2) + i;
                          if (pageNum > pagination.totalPages) return null;

                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === pagination.page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="w-full sm:max-w-[98vw] max-w-[98vw] xl:max-w-[1800px] h-[92vh] overflow-hidden p-5">
            <DialogHeader>
              <DialogTitle>Review Verification Request</DialogTitle>
              <DialogDescription>
                Review the submitted documents and user information to approve or reject the
                verification request.
              </DialogDescription>
            </DialogHeader>

            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading verification details...</span>
              </div>
            ) : details ? (
              <div className="h-[calc(92vh-6rem)] flex flex-col lg:flex-row gap-4 lg:gap-6 px-4 pb-4">
                {/* Left: Very large document viewer */}
                <div className="flex-1 h-full">
                  <div className="flex flex-col h-full border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between p-3 bg-white/80 backdrop-blur-sm border-b">
                      <div className="text-sm text-gray-700">
                        Document {selectedFileIndex + 1} of {details.files?.length || 0}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSelectedFileIndex(
                              (i) =>
                                (i - 1 + (details.files?.length || 1)) %
                                (details.files?.length || 1)
                            )
                          }
                          disabled={!details.files?.length}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSelectedFileIndex((i) => (i + 1) % (details.files?.length || 1))
                          }
                          disabled={!details.files?.length}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-hidden flex items-center justify-center px-3">
                      {details.files?.length ? (
                        (() => {
                          const file = details.files[selectedFileIndex];
                          const imgUrl = resolveImageUrl(file?.storageKey, { width: 1920 });
                          return imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={`Verification document ${file?.id}`}
                              className="max-h-[78vh] w-auto max-w-full object-contain rounded-md shadow"
                            />
                          ) : (
                            <div className="text-center">
                              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">Document file</p>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="text-center text-gray-500">No documents to display</div>
                      )}
                    </div>

                    {details.files?.length ? (
                      <div className="border-t bg-white/80 backdrop-blur-sm p-2 overflow-x-auto">
                        <div className="flex items-center gap-2">
                          {details.files.map((f: any, idx: number) => {
                            const thumbUrl = resolveImageUrl(f.storageKey, { width: 240 });
                            return (
                              <button
                                key={f.id}
                                className={`h-16 w-24 border rounded overflow-hidden flex items-center justify-center ${idx === selectedFileIndex ? 'ring-2 ring-blue-500' : ''}`}
                                onClick={() => setSelectedFileIndex(idx)}
                              >
                                {thumbUrl ? (
                                  <img
                                    src={thumbUrl}
                                    alt={`Doc ${idx + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <FileText className="h-6 w-6 text-gray-400" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Right: Big user image and details */}
                <div className="w-full lg:w-[480px] xl:w-[560px] 2xl:w-[640px] h-full overflow-y-auto">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex flex-col items-center gap-4 mb-6">
                      <UserAvatar
                        image={details.user.image ?? null}
                        alt={details.user.name ?? 'User'}
                        className="h-56 w-56 md:h-64 md:w-64 rounded-full ring-2 ring-gray-200"
                        size={320}
                        isVerified={Boolean((details as any).user?.verified)}
                      />
                      <div className="w-full">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Name</label>
                          <div className="text-base text-gray-900 font-medium break-words">
                            {details.user.name || 'Not provided'}
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="text-sm font-medium text-gray-500">User ID</label>
                          <div className="text-sm text-gray-900 break-all">
                            {details.user.userId || 'Not set'}
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="text-sm font-medium text-gray-500">Email</label>
                          <div className="text-sm text-gray-900 break-all">
                            {details.user.email}
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="text-sm font-medium text-gray-500">Telegram</label>
                          <div className="text-sm text-gray-900 break-words">
                            {details.user.telegramHandle || 'Not provided'}
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-6">
                          <div>
                            <label className="text-sm font-medium text-gray-500">City</label>
                            <div className="text-sm text-gray-900">{details.city.name}</div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Method</label>
                            <div className="text-sm text-gray-900">
                              {getMethodDisplayName(details.method)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {details.userNote && (
                      <div className="mt-2 p-4 bg-blue-50 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">User Note</h3>
                        <p className="text-sm text-blue-900/90 whitespace-pre-wrap">
                          {details.userNote}
                        </p>
                      </div>
                    )}

                    {details.status === 'REJECTED' && (
                      <div className="mt-4 p-4 bg-red-50 rounded-lg">
                        <h3 className="text-sm font-medium text-red-900 mb-2">
                          Rejection Information
                        </h3>
                        <div className="flex flex-wrap gap-6 mb-2">
                          <div>
                            <label className="text-xs font-medium text-red-800/80">
                              Rejection Code
                            </label>
                            <div className="text-sm text-red-900">
                              {details.rejectionCode
                                ? getRejectionCodeDisplayName(details.rejectionCode)
                                : 'Not specified'}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-red-800/80">
                              Reviewed At
                            </label>
                            <div className="text-sm text-red-900">
                              {details.reviewedAt
                                ? format(new Date(details.reviewedAt), 'PPp')
                                : 'Not specified'}
                            </div>
                          </div>
                        </div>
                        {details.rejectionNote && (
                          <div>
                            <label className="text-xs font-medium text-red-800/80">
                              Rejection Note
                            </label>
                            <p className="text-sm text-red-900 mt-1 whitespace-pre-wrap">
                              {details.rejectionNote}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {details.status === 'PENDING' && (
                      <div className="flex justify-end gap-3 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setRejectionDialogOpen(true)}
                          disabled={rejectMutation.isPending}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          onClick={() => approveMutation.mutate(details.id)}
                          disabled={approveMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {approveMutation.isPending && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          <Check className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Failed to load verification details.</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Verification Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this verification request. This will help the
                user understand what needs to be corrected.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-code">Rejection Reason *</Label>
                <Select
                  value={rejectionForm.code}
                  onValueChange={(value) => setRejectionForm((prev) => ({ ...prev, code: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a rejection reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INSUFFICIENT_PROOF">Insufficient Proof</SelectItem>
                    <SelectItem value="CITY_MISMATCH">City Mismatch</SelectItem>
                    <SelectItem value="EXPIRED_DOCUMENT">Expired Document</SelectItem>
                    <SelectItem value="UNREADABLE">Unreadable Document</SelectItem>
                    <SelectItem value="OTHER">Other Reason</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="rejection-note">Additional Notes (Optional)</Label>
                <Textarea
                  id="rejection-note"
                  placeholder="Provide specific feedback to help the user understand what needs to be corrected..."
                  value={rejectionForm.note}
                  onChange={(e) => setRejectionForm((prev) => ({ ...prev, note: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectionDialogOpen(false);
                  setRejectionForm({ code: '', note: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmRejection}
                disabled={!rejectionForm.code || rejectMutation.isPending}
                variant="destructive"
              >
                {rejectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Reject Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
