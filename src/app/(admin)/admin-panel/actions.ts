'use server';

import { requireUser } from '@/lib/auth';
import { forbidden, unauthorized } from 'next/navigation';
import { setTimeout } from 'node:timers/promises';
// Example admin action
export async function deleteApplication() {
  let user;
  try {
    user = await requireUser();
  } catch {
    unauthorized();
  }
  if (user!.role !== 'admin') forbidden();

  // Proceed with deleting the application
  console.log('Deleting application...');
  await setTimeout(2000);
  console.log('Application deleted successfully!');
  return { success: true, message: 'Application deleted successfully!' };
}
