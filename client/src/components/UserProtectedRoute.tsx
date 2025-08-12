import { ReactNode } from "react";
import { useUserAuth } from "@/hooks/useUserAuth";
import { Loader2 } from "lucide-react";

interface UserProtectedRouteProps {
  children: ReactNode;
}

export default function UserProtectedRoute({ children }: UserProtectedRouteProps) {
  const { user, isLoading } = useUserAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login page
    window.location.href = '/giris';
    return null;
  }

  return <>{children}</>;
}