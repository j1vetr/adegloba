import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "wouter";

export function useAdminAuth() {
  const [, setLocation] = useLocation();
  
  const { data: adminUser, isLoading, error } = useQuery({
    queryKey: ["/api/admin/me"],
    retry: false,
  });

  const isAuthenticated = !!adminUser;

  useEffect(() => {
    if (!isLoading && !isAuthenticated && error) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, error, setLocation]);

  return {
    adminUser,
    isLoading,
    isAuthenticated,
  };
}