/**
 * API Route: /api/moderator/verification-requests/filters
 */

import { NextRequest } from 'next/server';
import { filtersHandler } from '../route';

export async function GET(request: NextRequest) {
  return filtersHandler(request);
}
