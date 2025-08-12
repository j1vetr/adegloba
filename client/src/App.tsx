import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import ShipPlans from "@/pages/ShipPlans";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import OrderSuccess from "@/pages/OrderSuccess";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Admin Login Route - always accessible */}
      <Route path="/login" component={Login} />
      
      {/* Admin Routes - protected */}
      <Route path="/admin">
        <AdminProtectedRoute>
          <AdminDashboard />
        </AdminProtectedRoute>
      </Route>
      
      {/* Public/User routes */}
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/ships/:slug" component={ShipPlans} />
        </>
      ) : (
        <>
          {/* Protected user routes */}
          <Route path="/" component={Home} />
          <Route path="/ships" component={Landing} />
          <Route path="/ships/:slug" component={ShipPlans} />
          <Route path="/cart" component={Cart} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/order-success" component={OrderSuccess} />
          <Route path="/dashboard" component={Dashboard} />
        </>
      )}
      
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
