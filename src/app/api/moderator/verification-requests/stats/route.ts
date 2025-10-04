/**
 * API Route: /api/moderator/verification-requests/stats
 */

import { NextRequest } from 'next/server';
import { statsHandler } from '../route';

export async function GET(request: NextRequest) {
  return statsHandler(request);
}
