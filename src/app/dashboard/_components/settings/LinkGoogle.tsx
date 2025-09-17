// components/LinkGoogle.tsx ('use client')
import { linkSocial, useSession } from '@/lib/auth-client';
import { toast } from 'sonner';

export function LinkGoogleButton() {
  const { data: session } = useSession();
  if (!session) return null;

  const handleLink = async () => {
    try {
      const { data, error } = await linkSocial({
        // Or use authClient.linkSocial if exported
        provider: 'google',
        callbackURL: '/settings',
      });
      if (error) throw error;
      toast.success('Google linked successfully!');
    } catch (err) {
      toast.error((err as Error).message || 'Linking failed.');
    }
  };

  return <button onClick={handleLink}>Link Google</button>;
}
