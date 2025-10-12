/**
 * API Route: /api/moderator/verification-requests
 *
 * Handles fetching verification requests with search, filter, and pagination
 * for the moderator panel.
 */

import {
  getVerificationRequestsForModerators,
  getVerificationStats,
  VerificationSearchParams,
} from '@/data/moderator/verification.dal';
import * as Enum from '@/generated/enums';
import type {
  VerificationMethod,
  VerificationRejectionCode,
  VerificationStatus,
} from '@/generated/prisma';
import { getServerSession } from '@/lib/auth/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Import centralized auth barrel

// Validation schema for search parameters
const searchParamsSchema = z.object({
  search: z.string().optional().default(''),
  status: z.nativeEnum(Enum.VerificationStatus).optional(),
  method: z.nativeEnum(Enum.VerificationMethod).optional(),
  cityId: z.coerce.number().optional(),
  rejectionCode: z.nativeEnum(Enum.VerificationRejectionCode).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  reviewedBy: z.string().optional(),
  sortBy: z
    .enum(['submittedAt', 'reviewedAt', 'status', 'method', 'cityId'])
    .optional()
    .default('submittedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user has moderator or admin role
    if (!session.user.role || !['MODERATOR', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;

    // Helper function to get non-null search params
    const getParam = (key: string) => {
      const value = searchParams.get(key);
      return value === null ? undefined : value;
    };

    // Validate and parse search parameters
    const params = searchParamsSchema.parse({
      search: getParam('search'),
      status: getParam('status'),
      method: getParam('method'),
      cityId: getParam('cityId'),
      rejectionCode: getParam('rejectionCode'),
      dateFrom: getParam('dateFrom'),
      dateTo: getParam('dateTo'),
      reviewedBy: getParam('reviewedBy'),
      sortBy: getParam('sortBy'),
      sortOrder: getParam('sortOrder'),
      page: getParam('page'),
      limit: getParam('limit'),
    });

    // Convert date strings to Date objects
    const searchFilters: VerificationSearchParams = {
      ...params,
      dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
      dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
    };

    // Fetch verification requests
    const result = await getVerificationRequestsForModerators(
      searchFilters,
      session.user.id,
      session.user.role as any
    );

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error fetching verification requests:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid parameters',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/moderator/verification-requests/stats
export async function statsHandler(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user has moderator or admin role
    if (!session.user.role || !['MODERATOR', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const stats = await getVerificationStats();

    return NextResponse.json(
      {
        success: true,
        data: stats,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error fetching verification stats:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/moderator/verification-requests/filters
export async function filtersHandler(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user has moderator or admin role
    if (!session.user.role || !['MODERATOR', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          // Cities are provided via client hook useCities() and cached globally.
          statuses: Object.values(Enum.VerificationStatus) as VerificationStatus[],
          methods: Object.values(Enum.VerificationMethod) as VerificationMethod[],
          rejectionCodes: Object.values(
            Enum.VerificationRejectionCode
          ) as VerificationRejectionCode[],
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Error fetching filter options:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
