'use client';

import { LoadingSpinner } from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { deleteApplication } from './actions';

const AdminPanelPage = () => {
  const [isLoading, startTransition] = useTransition();

  const handleDeleteApplication = async () => {
    startTransition(async () => {
      const res = await deleteApplication();
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });
  };

  return (
    <div>
      <Card className="">
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button disabled={isLoading} onClick={handleDeleteApplication}>
              {isLoading ? <LoadingSpinner /> : 'Delete Application'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanelPage;
