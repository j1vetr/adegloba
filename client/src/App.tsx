import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUserAuth } from "@/hooks/useUserAuth";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import ShipPlans from "@/pages/ShipPlans";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import OrderSuccess from "@/pages/OrderSuccess";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Kayit from "@/pages/Kayit";
import Giris from "@/pages/Giris";
import Panel from "@/pages/Panel";
import Paketler from "@/pages/Paketler";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import UserProtectedRoute from "@/components/UserProtectedRoute";

function Router() {
  const { isAuthenticated, isLoading } = useUserAuth();

  return (
    <Switch>
      {/* Admin Login Route - always accessible */}
      <Route path="/login" component={Login} />
      
      {/* User Auth Routes - Turkish */}
      <Route path="/kayit" component={Kayit} />
      <Route path="/giris" component={Giris} />
      
      {/* Admin Routes - protected */}
      <Route path="/admin">
        <AdminProtectedRoute>
          <AdminDashboard />
        </AdminProtectedRoute>
      </Route>
      
      {/* Main Application Routes */}
      <Route path="/" component={Landing} />
      
      {/* Protected user routes */}
      <Route path="/panel">
        <UserProtectedRoute>
          <Panel />
        </UserProtectedRoute>
      </Route>
      <Route path="/paketler">
        <UserProtectedRoute>
          <Paketler />
        </UserProtectedRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
