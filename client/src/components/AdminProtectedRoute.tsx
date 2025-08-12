import { useAdminAuth } from "@/hooks/useAdminAuth";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { isLoading, isAuthenticated } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-space-blue via-space-dark to-space-blue text-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-slate-300">Yetkilendirme kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // useAdminAuth will redirect to login
  }

  return <>{children}</>;
}