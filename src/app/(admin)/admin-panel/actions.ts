'use server';

import { getServerSession } from '@/lib/get-session';
import { forbidden, unauthorized } from 'next/navigation';
import { setTimeout } from 'node:timers/promises';
// Example admin action
export async function deleteApplication() {
  const session = await getServerSession();
  const user = session?.user;

  if (!user) unauthorized();
  if (user.role !== 'admin') forbidden();

  // Proceed with deleting the application
  console.log('Deleting application...');
  await setTimeout(2000);
  console.log('Application deleted successfully!');
  return { success: true, message: 'Application deleted successfully!' };
}
