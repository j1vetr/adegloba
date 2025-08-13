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
import Sepet from "@/pages/Sepet";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ShipsManagement from "@/pages/admin/ShipsManagement";
import PackagesManagement from "@/pages/admin/PackagesManagement";

import ShipPackages from "@/pages/admin/ShipPackages";
import CredentialPoolsNew from "@/pages/admin/CredentialPoolsNew";

import CouponsManagement from "@/pages/admin/CouponsManagement";
import OrdersManagement from "@/pages/admin/OrdersManagement";
import UsersManagementNew from "@/pages/admin/UsersManagementNew";
import SettingsManagement from "@/pages/admin/SettingsManagement";
import TicketManagement from "@/pages/admin/TicketManagement";
import SystemLogs from "@/pages/admin/SystemLogs";
import UserTickets from "@/pages/UserTickets";
import TicketDetail from "@/pages/TicketDetail";
import Profil from "@/pages/Profil";
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
      
      <Route path="/admin/ships">
        <AdminProtectedRoute>
          <ShipsManagement />
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/packages">
        <AdminProtectedRoute>
          <PackagesManagement />
        </AdminProtectedRoute>
      </Route>
      

      

      
      <Route path="/admin/credential-pools">
        <AdminProtectedRoute>
          <CredentialPoolsNew />
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/coupons">
        <AdminProtectedRoute>
          <CouponsManagement />
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/orders">
        <AdminProtectedRoute>
          <OrdersManagement />
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/users">
        <AdminProtectedRoute>
          <UsersManagementNew />
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/settings">
        <AdminProtectedRoute>
          <SettingsManagement />
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/tickets">
        <AdminProtectedRoute>
          <TicketManagement />
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/logs">
        <AdminProtectedRoute>
          <SystemLogs />
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
      
      <Route path="/sepet">
        <UserProtectedRoute>
          <Sepet />
        </UserProtectedRoute>
      </Route>
      
      <Route path="/destek">
        <UserProtectedRoute>
          <UserTickets />
        </UserProtectedRoute>
      </Route>

      <Route path="/destek/:ticketId">
        <UserProtectedRoute>
          <TicketDetail />
        </UserProtectedRoute>
      </Route>
      
      <Route path="/profil">
        <UserProtectedRoute>
          <Profil />
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
