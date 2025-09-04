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
import OrderCancel from "@/pages/OrderCancel";
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

import CouponsManagementNew from "@/pages/admin/CouponsManagementNew";
import OrdersManagement from "@/pages/admin/OrdersManagement";
import UsersManagementNew from "@/pages/admin/UsersManagementNew";
import SettingsManagement from "@/pages/admin/SettingsManagement";
import SiteSettings from "@/pages/admin/SiteSettings";
import Reports from "@/pages/admin/Reports";
import TicketManagement from "@/pages/admin/TicketManagement";
import SystemLogs from "@/pages/admin/SystemLogs";
import { EmailSettings } from "@/pages/admin/EmailSettings";
import UserTickets from "@/pages/UserTickets";
import TicketDetail from "@/pages/TicketDetail";
import Profil from "@/pages/Profil";
import KullanimKilavuzu from "@/pages/KullanimKilavuzu";
import PushNotifications from "@/pages/admin/PushNotifications";
import EmailMarketing from "@/pages/admin/EmailMarketing";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import UserProtectedRoute from "@/components/UserProtectedRoute";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

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
          <CouponsManagementNew />
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
      
      <Route path="/admin/site-settings">
        <AdminProtectedRoute>
          <SiteSettings />
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/reports">
        <AdminProtectedRoute>
          <Reports />
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
      
      <Route path="/admin/email-settings">
        <AdminProtectedRoute>
          <EmailSettings />
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/push-notifications">
        <AdminProtectedRoute>
          <PushNotifications />
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/email-marketing">
        <AdminProtectedRoute>
          <EmailMarketing />
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
      
      <Route path="/order-success" component={OrderSuccess} />
      <Route path="/checkout/success" component={OrderSuccess} />
      <Route path="/checkout/cancel" component={OrderCancel} />
      
      <Route path="/checkout">
        <UserProtectedRoute>
          <Checkout />
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
      
      <Route path="/kilavuz">
        <UserProtectedRoute>
          <KullanimKilavuzu />
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
        <Router />
        <PWAInstallPrompt />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
