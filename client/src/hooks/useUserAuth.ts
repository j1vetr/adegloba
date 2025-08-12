import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useUserAuth() {
  const { data: user, isLoading, error } = useQuery<User | null, Error>({
    queryKey: ["/api/user/me"],
    queryFn: async () => {
      const response = await fetch("/api/user/me", {
        credentials: "include",
      });
      if (response.status === 401) {
        return null;
      }
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
    retry: false,
  });

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}