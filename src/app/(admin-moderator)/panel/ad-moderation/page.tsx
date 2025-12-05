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
import { AD_CATEGORY_BY_ID } from '@/constants/ad-categories';
import { AD_DETAIL_COMPONENTS } from '@/constants/ad-detail-components';
import { useCities } from '@/contexts/cities-context';
import { resolveImageUrl } from '@/lib/image_system/image-utils-client';
import { cn } from '@/lib/utils';
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
  Home,
  Loader2,
  MapPin,
  Package,
  Plane,
  RefreshCw,
  Search,
  Wrench,
  X,
  XCircle,
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// Types
// =============================================================================

interface AdForModeration {
  id: number;
  userId: string;
  category: 'HOUSING' | 'TRANSPORTATION' | 'MARKETPLACE' | 'SERVICES' | 'CURRENCY';
  status: 'PENDING' | 'ONLINE' | 'REJECTED' | 'EXPIRED';
  cityId: number;
  createdAt: string;
  updatedAt: string;
  expirationDate: string | null;
  viewsCount: number;
  contactClicksCount: number;
  user: {
    id: string;
    name: string | null;
    userId: string | null;
    email: string | null;
    image: string | null;
    verified: boolean;
  };
  city: {
    id: number;
    name: string;
    slug: string;
  };
  coverMedia: {
    id: number;
    storageKey: string;
  } | null;
  _categoryTitle: string | null;
  _categorySummary: string | null;
}

interface AdModerationFilters {
  search: string;
  status: string;
  category: string;
  cityId: string;
  dateFrom: string;
  dateTo: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AdModerationStats {
  totalAds: number;
  pendingAds: number;
  onlineAds: number;
  rejectedAds: number;
  expiredAds: number;
  adsThisWeek: number;
  adsThisMonth: number;
  categoryStats: { category: string; pending: number; total: number }[];
  cityStats: { cityName: string; pending: number; total: number }[];
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchAds(params: {
  search?: string;
  status?: string;
  category?: string;
  cityId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== '' && value !== 'all') {
      searchParams.append(key, value.toString());
    }
  });

  const response = await fetch(`/api/moderator/ads?${searchParams}`);

  if (!response.ok) {
    throw new Error('Failed to fetch ads');
  }

  return response.json();
}

async function fetchAdStats() {
  const response = await fetch('/api/moderator/ads/stats');

  if (!response.ok) {
    throw new Error('Failed to fetch ad statistics');
  }

  return response.json();
}

async function fetchAdDetails(id: number) {
  const response = await fetch(`/api/moderator/ads/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch ad details');
  }

  return response.json();
}

async function approveAd(id: number, note?: string) {
  const response = await fetch(`/api/moderator/ads/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'approve', note }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to approve ad');
  }

  return response.json();
}

async function rejectAd(id: number, reasonCode: string, reasonText?: string) {
  const response = await fetch(`/api/moderator/ads/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'reject',
      reasonCode,
      reasonText,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to reject ad');
  }

  return response.json();
}

async function changeAdStatus(id: number, newStatus: string, note?: string) {
  const response = await fetch(`/api/moderator/ads/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'change-status',
      newStatus,
      note,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to change ad status');
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
    case 'ONLINE':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'REJECTED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'EXPIRED':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PENDING':
      return <Clock className="h-3 w-3" />;
    case 'ONLINE':
      return <CheckCircle2 className="h-3 w-3" />;
    case 'REJECTED':
      return <XCircle className="h-3 w-3" />;
    case 'EXPIRED':
      return <AlertCircle className="h-3 w-3" />;
    default:
      return <AlertCircle className="h-3 w-3" />;
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'HOUSING':
      return <Home className="h-4 w-4" />;
    case 'TRANSPORTATION':
      return <Plane className="h-4 w-4" />;
    case 'MARKETPLACE':
      return <Package className="h-4 w-4" />;
    case 'SERVICES':
      return <Wrench className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getCategoryDisplayName = (category: string) => {
  return AD_CATEGORY_BY_ID[category as keyof typeof AD_CATEGORY_BY_ID]?.name || category;
};

const getReasonCodeDisplayName = (code: string) => {
  const codeNames: Record<string, string> = {
    OFF_TOPIC: 'Off Topic',
    WRONG_CATEGORY: 'Wrong Category',
    INCOMPLETE_DETAILS: 'Incomplete Details',
    SPAM: 'Spam',
    SCAM_FRAUD: 'Scam/Fraud',
    PROHIBITED_ITEM: 'Prohibited Item',
    DUPLICATE: 'Duplicate Ad',
    EXPIRED: 'Expired Content',
    OTHER: 'Other',
  };
  return codeNames[code] || code;
};

// =============================================================================
// Memoized Components
// =============================================================================

interface AdRowProps {
  ad: AdForModeration;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onReview: (ad: AdForModeration) => void;
}

const AdRow = memo(({ ad, isSelected, onSelect, onReview }: AdRowProps) => {
  const coverUrl = ad.coverMedia ? resolveImageUrl(ad.coverMedia.storageKey, { width: 200 }) : null;

  return (
    <div className="lg:grid lg:grid-cols-12 gap-4 p-4 border rounded-lg hover:bg-gray-50">
      {/* Mobile Layout */}
      <div className="lg:hidden space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox checked={isSelected} onCheckedChange={() => onSelect(ad.id)} />
            <Badge className={getStatusColor(ad.status)}>
              {getStatusIcon(ad.status)}
              <span className="ml-1">{ad.status}</span>
            </Badge>
          </div>
          <div className="text-sm text-gray-500">
            {format(new Date(ad.createdAt), 'MMM d, yyyy')}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {coverUrl ? (
            <img src={coverUrl} alt="Ad cover" className="h-16 w-16 rounded-lg object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
              {getCategoryIcon(ad.category)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {ad._categoryTitle || 'Untitled Ad'}
            </div>
            <div className="text-sm text-gray-500">{ad._categorySummary}</div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              {getCategoryIcon(ad.category)}
              <span>{getCategoryDisplayName(ad.category)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <UserAvatar
            image={ad.user.image}
            alt={ad.user.name ?? 'User'}
            className="h-6 w-6"
            size={48}
            isVerified={ad.user.verified}
          />
          <span className="text-gray-700 truncate">
            {ad.user.name || ad.user.userId || 'Unknown'}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {ad.city.name}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => onReview(ad)}>
            <Eye className="h-3 w-3 mr-1" />
            Review
          </Button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:contents">
        <div className="col-span-1 flex items-center">
          <Checkbox checked={isSelected} onCheckedChange={() => onSelect(ad.id)} />
        </div>

        <div className="col-span-1 flex items-center">
          {coverUrl ? (
            <img src={coverUrl} alt="Ad cover" className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
              {getCategoryIcon(ad.category)}
            </div>
          )}
        </div>

        <div className="col-span-2 flex flex-col justify-center">
          <div className="text-sm font-medium text-gray-900 truncate">
            {ad._categoryTitle || 'Untitled Ad'}
          </div>
          <div className="text-xs text-gray-500 truncate">{ad._categorySummary}</div>
        </div>

        <div className="col-span-1 flex items-center">
          <div className="flex items-center gap-1 text-sm">
            {getCategoryIcon(ad.category)}
            <span className="hidden xl:inline">{getCategoryDisplayName(ad.category)}</span>
          </div>
        </div>

        <div className="col-span-2 flex items-center gap-2">
          <UserAvatar
            image={ad.user.image}
            alt={ad.user.name ?? 'User'}
            className="h-7 w-7"
            size={56}
            isVerified={ad.user.verified}
          />
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {ad.user.name || ad.user.userId || 'Unknown'}
            </div>
            <div className="text-xs text-gray-500 truncate">{ad.user.email}</div>
          </div>
        </div>

        <div className="col-span-1 flex items-center">
          <Badge className={cn('text-xs', getStatusColor(ad.status))}>
            {getStatusIcon(ad.status)}
            <span className="ml-1">{ad.status}</span>
          </Badge>
        </div>

        <div className="col-span-1 flex items-center">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <MapPin className="h-3 w-3" />
            {ad.city.name}
          </div>
        </div>

        <div className="col-span-1 flex items-center">
          <div className="text-sm text-gray-600">{format(new Date(ad.createdAt), 'MMM d')}</div>
        </div>

        <div className="col-span-2 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onReview(ad)}>
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
});

AdRow.displayName = 'AdRow';

// =============================================================================
// Main Component
// =============================================================================

export default function AdModerationPage() {
  // State
  const [filters, setFilters] = useState<AdModerationFilters>({
    search: '',
    status: 'PENDING', // Default to showing pending ads
    category: '',
    cityId: '',
    dateFrom: '',
    dateTo: '',
  });

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [sortConfig, setSortConfig] = useState({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [selectedAds, setSelectedAds] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAd, setSelectedAd] = useState<AdForModeration | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionForm, setRejectionForm] = useState({
    code: '',
    note: '',
  });
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [statusChangeForm, setStatusChangeForm] = useState({
    newStatus: '',
    note: '',
  });

  // Query client
  const queryClient = useQueryClient();

  // Cities from context
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
    data: adsData,
    isLoading: isLoadingAds,
    error: adsError,
    refetch: refetchAds,
  } = useQuery({
    queryKey: ['moderator-ads', queryParams],
    queryFn: () => fetchAds(queryParams),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['moderator-ad-stats'],
    queryFn: fetchAdStats,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const { data: detailsData, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['moderator-ad-details', selectedAd?.id],
    queryFn: () => (selectedAd ? fetchAdDetails(selectedAd.id) : null),
    enabled: !!selectedAd && reviewDialogOpen,
    staleTime: 30 * 1000,
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id: number) => approveAd(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderator-ads'] });
      queryClient.invalidateQueries({ queryKey: ['moderator-ad-stats'] });
      toast.success('Ad approved successfully');
      setReviewDialogOpen(false);
      setSelectedAd(null);
    },
    onError: (error) => {
      toast.error(`Failed to approve: ${error.message}`);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, code, note }: { id: number; code: string; note?: string }) =>
      rejectAd(id, code, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderator-ads'] });
      queryClient.invalidateQueries({ queryKey: ['moderator-ad-stats'] });
      toast.success('Ad rejected successfully');
      setRejectionDialogOpen(false);
      setReviewDialogOpen(false);
      setSelectedAd(null);
      setRejectionForm({ code: '', note: '' });
    },
    onError: (error) => {
      toast.error(`Failed to reject: ${error.message}`);
    },
  });

  const statusChangeMutation = useMutation({
    mutationFn: ({ id, newStatus, note }: { id: number; newStatus: string; note?: string }) =>
      changeAdStatus(id, newStatus, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderator-ads'] });
      queryClient.invalidateQueries({ queryKey: ['moderator-ad-stats'] });
      queryClient.invalidateQueries({ queryKey: ['moderator-ad-details'] });
      toast.success('Ad status changed successfully');
      setStatusChangeDialogOpen(false);
      setReviewDialogOpen(false);
      setSelectedAd(null);
      setStatusChangeForm({ newStatus: '', note: '' });
    },
    onError: (error) => {
      toast.error(`Failed to change status: ${error.message}`);
    },
  });

  // Bulk mutations
  const bulkApprove = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await fetch('/api/moderator/ads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', ids }),
      });
      if (!res.ok) throw new Error('Bulk approve failed');
      return res.json();
    },
    onSuccess: (data) => {
      const ok = data?.data?.successful?.length ?? 0;
      const fail = data?.data?.failed?.length ?? 0;
      toast.success(`Bulk approved ${ok} ad(s)` + (fail ? `, ${fail} failed` : ''));
      queryClient.invalidateQueries({ queryKey: ['moderator-ads'] });
      queryClient.invalidateQueries({ queryKey: ['moderator-ad-stats'] });
      setSelectedAds(new Set());
    },
    onError: (e: any) => toast.error(e.message || 'Bulk approve failed'),
  });

  // Update pagination when data changes
  useEffect(() => {
    if (adsData?.data) {
      setPagination((prev) => ({
        ...prev,
        total: adsData.data.total,
        totalPages: adsData.data.totalPages,
      }));
    }
  }, [adsData]);

  // Debounced search - only reset pagination after user stops typing
  useEffect(() => {
    // Skip the initial mount
    if (filters.search === '') return;

    const timeoutId = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  // Handlers
  const handleFilterChange = useCallback((key: keyof AdModerationFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    // Don't reset pagination for search - let debounce handle it
    if (key !== 'search') {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
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

  const handleSelectAd = useCallback((id: number) => {
    setSelectedAds((prev) => {
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
    if (!adsData?.data?.ads) return;

    const allIds = adsData.data.ads.map((ad: AdForModeration) => ad.id);
    const allSelected = allIds.every((id: number) => selectedAds.has(id));

    if (allSelected) {
      setSelectedAds(new Set());
    } else {
      setSelectedAds(new Set(allIds));
    }
  }, [adsData?.data?.ads, selectedAds]);

  const handleReviewAd = useCallback((ad: AdForModeration) => {
    setSelectedAd(ad);
    setReviewDialogOpen(true);
  }, []);

  const handleConfirmRejection = useCallback(() => {
    if (!selectedAd || !rejectionForm.code) return;

    rejectMutation.mutate({
      id: selectedAd.id,
      code: rejectionForm.code,
      note: rejectionForm.note,
    });
  }, [selectedAd, rejectionForm, rejectMutation]);

  const handleConfirmStatusChange = useCallback(() => {
    if (!selectedAd || !statusChangeForm.newStatus) return;

    statusChangeMutation.mutate({
      id: selectedAd.id,
      newStatus: statusChangeForm.newStatus,
      note: statusChangeForm.note,
    });
  }, [selectedAd, statusChangeForm, statusChangeMutation]);

  const handleOpenStatusChange = useCallback(() => {
    if (selectedAd) {
      // Pre-select a status that's different from current
      const statuses = ['PENDING', 'ONLINE', 'REJECTED', 'EXPIRED'];
      const otherStatus = statuses.find((s) => s !== selectedAd.status) || '';
      setStatusChangeForm({ newStatus: otherStatus, note: '' });
      setStatusChangeDialogOpen(true);
    }
  }, [selectedAd]);

  const handleRefresh = useCallback(() => {
    refetchAds();
    queryClient.invalidateQueries({ queryKey: ['moderator-ad-stats'] });
  }, [refetchAds, queryClient]);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: '',
      category: '',
      cityId: '',
      dateFrom: '',
      dateTo: '',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Data
  const ads = adsData?.data?.ads || [];
  const stats = statsData?.data;
  const details = detailsData?.data;

  // Render ad details based on category
  const renderAdDetails = () => {
    if (!details) return null;

    const renderer = AD_DETAIL_COMPONENTS[details.category as keyof typeof AD_DETAIL_COMPONENTS];
    if (!renderer) return null;

    return renderer({
      ad: details,
      variant: 'moderator',
      showContactButton: false,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ad Moderation</h1>
              <p className="text-gray-600">Review and manage user advertisements</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoadingAds}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingAds ? 'animate-spin' : ''}`} />
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{stats.pendingAds}</div>
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
                      <div className="text-2xl font-bold text-green-600">{stats.onlineAds}</div>
                      <div className="text-sm text-gray-600">Online</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    <div>
                      <div className="text-2xl font-bold text-red-600">{stats.rejectedAds}</div>
                      <div className="text-sm text-gray-600">Rejected</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <div className="text-2xl font-bold text-gray-600">{stats.expiredAds}</div>
                      <div className="text-sm text-gray-600">Expired</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{stats.adsThisWeek}</div>
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
                    placeholder="Search by user name, email, ad title..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                    autoComplete="off"
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
                    <SelectItem value="ONLINE">Online</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.category || 'all'}
                  onValueChange={(value) =>
                    handleFilterChange('category', value === 'all' ? '' : value)
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="HOUSING">Housing</SelectItem>
                    <SelectItem value="TRANSPORTATION">Transportation</SelectItem>
                    <SelectItem value="MARKETPLACE">Marketplace</SelectItem>
                    <SelectItem value="SERVICES">Services</SelectItem>
                  </SelectContent>
                </Select>
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
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id.toString()}>
                            {city.name}
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

                  <Button variant="outline" onClick={clearFilters}>
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
                Ads
                {adsData?.data && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({adsData.data.total} total)
                  </span>
                )}
              </CardTitle>

              {selectedAds.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{selectedAds.size} selected</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Bulk Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => bulkApprove.mutate(Array.from(selectedAds))}
                        disabled={bulkApprove.isPending}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Bulk Approve ({selectedAds.size})
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingAds ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading ads...</span>
              </div>
            ) : ads.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No ads found</h3>
                <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-4 mb-4 pb-2 border-b text-sm font-medium text-gray-500">
                  <div className="col-span-1">
                    <Checkbox
                      checked={
                        ads.length > 0 && ads.every((ad: AdForModeration) => selectedAds.has(ad.id))
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </div>
                  <div className="col-span-1">Cover</div>
                  <div
                    className="col-span-2 cursor-pointer hover:text-gray-700"
                    onClick={() => handleSortChange('createdAt')}
                  >
                    Ad Title
                  </div>
                  <div
                    className="col-span-1 cursor-pointer hover:text-gray-700"
                    onClick={() => handleSortChange('category')}
                  >
                    Category
                  </div>
                  <div className="col-span-2">User</div>
                  <div
                    className="col-span-1 cursor-pointer hover:text-gray-700"
                    onClick={() => handleSortChange('status')}
                  >
                    Status
                  </div>
                  <div className="col-span-1">City</div>
                  <div
                    className="col-span-1 cursor-pointer hover:text-gray-700"
                    onClick={() => handleSortChange('createdAt')}
                  >
                    Date
                  </div>
                  <div className="col-span-2">Actions</div>
                </div>

                {/* Table Rows */}
                <div className="space-y-2">
                  {ads.map((ad: AdForModeration) => (
                    <AdRow
                      key={ad.id}
                      ad={ad}
                      isSelected={selectedAds.has(ad.id)}
                      onSelect={handleSelectAd}
                      onReview={handleReviewAd}
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
          <DialogContent className="w-full sm:max-w-[95vw] max-w-[95vw] xl:max-w-[1600px] h-[90vh] overflow-hidden p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="flex items-center gap-2">
                Review Ad
                {selectedAd && (
                  <Badge className={getStatusColor(selectedAd.status)}>{selectedAd.status}</Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Review the ad details and approve or reject this advertisement.
              </DialogDescription>
            </DialogHeader>

            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading ad details...</span>
              </div>
            ) : details ? (
              <div className="h-[calc(90vh-8rem)] overflow-y-auto p-6 pt-4">
                {/* User Info Header */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      image={details.user.image}
                      alt={details.user.name ?? 'User'}
                      className="h-12 w-12"
                      size={96}
                      isVerified={details.user.verified}
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {details.user.name || details.user.userId || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-500">{details.user.email}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {details.city.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(details.createdAt), 'PPp')}
                    </div>
                  </div>
                </div>

                {/* Moderation History */}
                {details.moderationActions && details.moderationActions.length > 0 && (
                  <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h3 className="text-sm font-medium text-amber-900 mb-2">Moderation History</h3>
                    <div className="space-y-2">
                      {details.moderationActions.slice(0, 5).map((action: any) => (
                        <div key={action.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                action.action === 'APPROVE'
                                  ? 'text-green-700 border-green-300'
                                  : 'text-red-700 border-red-300'
                              }
                            >
                              {action.action}
                            </Badge>
                            <span className="text-gray-600">
                              by {action.actor.name || action.actor.userId || 'Unknown'}
                            </span>
                          </div>
                          <span className="text-gray-500">
                            {format(new Date(action.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ad Details */}
                <div className="border rounded-lg overflow-hidden">{renderAdDetails()}</div>

                {/* Action Buttons - Always visible for all statuses */}
                <div className="flex justify-between items-center gap-3 pt-6 mt-6 border-t">
                  {/* Change Status Button - Available for all statuses */}
                  <Button
                    variant="outline"
                    onClick={handleOpenStatusChange}
                    disabled={statusChangeMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Change Status
                  </Button>

                  <div className="flex gap-3">
                    {/* Quick Reject - For non-rejected ads */}
                    {details.status !== 'REJECTED' && (
                      <Button
                        variant="outline"
                        onClick={() => setRejectionDialogOpen(true)}
                        disabled={rejectMutation.isPending}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    )}

                    {/* Quick Approve - For non-online ads */}
                    {details.status !== 'ONLINE' && (
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
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Failed to load ad details.</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Ad</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this advertisement. This will be visible to
                the ad owner.
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
                    <SelectItem value="OFF_TOPIC">Off Topic</SelectItem>
                    <SelectItem value="WRONG_CATEGORY">Wrong Category</SelectItem>
                    <SelectItem value="INCOMPLETE_DETAILS">Incomplete Details</SelectItem>
                    <SelectItem value="SPAM">Spam</SelectItem>
                    <SelectItem value="SCAM_FRAUD">Scam/Fraud</SelectItem>
                    <SelectItem value="PROHIBITED_ITEM">Prohibited Item</SelectItem>
                    <SelectItem value="DUPLICATE">Duplicate Ad</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
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
                Reject Ad
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Status Change Dialog */}
        <Dialog open={statusChangeDialogOpen} onOpenChange={setStatusChangeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Ad Status</DialogTitle>
              <DialogDescription>
                Change the status of this advertisement to any available status. The ad owner will
                be notified of this change.
              </DialogDescription>
            </DialogHeader>

            {selectedAd && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  Current Status:{' '}
                  <Badge className={getStatusColor(selectedAd.status)}>
                    {getStatusIcon(selectedAd.status)}
                    <span className="ml-1">{selectedAd.status}</span>
                  </Badge>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="new-status">New Status *</Label>
                <Select
                  value={statusChangeForm.newStatus}
                  onValueChange={(value) =>
                    setStatusChangeForm((prev) => ({ ...prev, newStatus: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedAd?.status !== 'PENDING' && (
                      <SelectItem value="PENDING">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          Pending - Return to review queue
                        </div>
                      </SelectItem>
                    )}
                    {selectedAd?.status !== 'ONLINE' && (
                      <SelectItem value="ONLINE">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Online - Make ad visible
                        </div>
                      </SelectItem>
                    )}
                    {selectedAd?.status !== 'REJECTED' && (
                      <SelectItem value="REJECTED">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          Rejected - Hide ad
                        </div>
                      </SelectItem>
                    )}
                    {selectedAd?.status !== 'EXPIRED' && (
                      <SelectItem value="EXPIRED">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-gray-500" />
                          Expired - Mark as expired
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status-change-note">Note (Optional)</Label>
                <Textarea
                  id="status-change-note"
                  placeholder="Add a note explaining the reason for this status change..."
                  value={statusChangeForm.note}
                  onChange={(e) =>
                    setStatusChangeForm((prev) => ({ ...prev, note: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusChangeDialogOpen(false);
                  setStatusChangeForm({ newStatus: '', note: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmStatusChange}
                disabled={!statusChangeForm.newStatus || statusChangeMutation.isPending}
              >
                {statusChangeMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Change Status
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
