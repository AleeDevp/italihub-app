/**
 * API Route: /api/moderator/ads
 *
 * Handles fetching ads with search, filter, and pagination for the moderator panel.
 */

import {
  getAdsForModeration,
  type AdModerationSearchParams,
} from '@/data/moderator/ad-moderation.dal';
import * as Enum from '@/generated/enums';
import { getServerSession } from '@/lib/auth/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for search parameters
const searchParamsSchema = z.object({
  search: z.string().optional().default(''),
  status: z.nativeEnum(Enum.AdStatus).optional(),
  category: z.nativeEnum(Enum.AdCategory).optional(),
  cityId: z.coerce.number().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'status', 'category', 'cityId'])
    .optional()
    .default('createdAt'),
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
      return value && value !== '' && value !== 'all' ? value : undefined;
    };

    // Parse and validate search parameters
    const rawParams = {
      search: getParam('search'),
      status: getParam('status'),
      category: getParam('category'),
      cityId: getParam('cityId'),
      dateFrom: getParam('dateFrom'),
      dateTo: getParam('dateTo'),
      sortBy: getParam('sortBy'),
      sortOrder: getParam('sortOrder'),
      page: getParam('page'),
      limit: getParam('limit'),
    };

    const validationResult = searchParamsSchema.safeParse(rawParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid search parameters',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const params = validationResult.data;

    // Build search params for DAL
    const dalParams: AdModerationSearchParams = {
      search: params.search,
      status: params.status,
      category: params.category,
      cityId: params.cityId,
      dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
      dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      page: params.page,
      limit: params.limit,
    };

    // Fetch ads using DAL
    const result = await getAdsForModeration(dalParams);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching ads for moderation:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch ads',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
