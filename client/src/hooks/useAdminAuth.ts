import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

interface AdminUser {
  username: string;
}

export function useAdminAuth() {
  const { data: user, isLoading, error } = useQuery<AdminUser>({
    queryKey: ['/api/admin/me'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logout = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Logout failed');
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/admin/me'], null);
      window.location.href = '/admin/login';
    },
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout: logout.mutate,
  };
}