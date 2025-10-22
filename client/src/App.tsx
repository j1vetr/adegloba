import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUserAuth } from "@/hooks/useUserAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Kayit from "@/pages/Kayit";
import Giris from "@/pages/Giris";
import Panel from "@/pages/Panel";
import Paketler from "@/pages/Paketler";
import Sepet from "@/pages/Sepet";
import OrderSuccess from "@/pages/OrderSuccess";
import OrderCancel from "@/pages/OrderCancel";
import Checkout from "@/pages/Checkout";
import UserTickets from "@/pages/UserTickets";
import TicketDetail from "@/pages/TicketDetail";
import Profil from "@/pages/Profil";
import KullanimKilavuzu from "@/pages/KullanimKilavuzu";
import ForgotPassword from "@/pages/ForgotPassword";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import UserProtectedRoute from "@/components/UserProtectedRoute";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const ShipsManagement = lazy(() => import("@/pages/admin/ShipsManagement"));
const PackagesManagement = lazy(() => import("@/pages/admin/PackagesManagement"));
const ShipPackages = lazy(() => import("@/pages/admin/ShipPackages"));
const CredentialPoolsNew = lazy(() => import("@/pages/admin/CredentialPoolsNew"));
const CouponsManagementNew = lazy(() => import("@/pages/admin/CouponsManagementNew"));
const OrdersManagement = lazy(() => import("@/pages/admin/OrdersManagement"));
const UsersManagementNew = lazy(() => import("@/pages/admin/UsersManagementNew"));
const SettingsManagement = lazy(() => import("@/pages/admin/SettingsManagement"));
const SiteSettings = lazy(() => import("@/pages/admin/SiteSettings"));
const Reports = lazy(() => import("@/pages/admin/Reports"));
const AdminReporting = lazy(() => import("@/pages/admin/AdminReporting"));
const StockManagement = lazy(() => import("@/pages/admin/StockManagement"));
const TicketManagement = lazy(() => import("@/pages/admin/TicketManagement"));
const SystemLogs = lazy(() => import("@/pages/admin/SystemLogs"));
const EmailSettings = lazy(() => import("@/pages/admin/EmailSettings").then(m => ({ default: m.EmailSettings })));
const PushNotifications = lazy(() => import("@/pages/admin/PushNotifications"));
const EmailMarketing = lazy(() => import("@/pages/admin/EmailMarketing"));
const DatabaseBackup = lazy(() => import("@/pages/admin/DatabaseBackup"));
const FinancialReports = lazy(() => import("@/pages/admin/FinancialReports"));
const ShipAnalytics = lazy(() => import("@/pages/admin/ShipAnalytics"));

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-blue-200">Yükleniyor...</p>
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useUserAuth();

  return (
    <Switch>
      {/* Admin Login Route - always accessible */}
      <Route path="/login" component={Login} />
      
      {/* User Auth Routes - Turkish */}
      <Route path="/kayit" component={Kayit} />
      <Route path="/giris" component={Giris} />
      <Route path="/sifremi-unuttum" component={ForgotPassword} />
      
      {/* Admin Routes - protected with lazy loading */}
      <Route path="/admin">
        <AdminProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <AdminDashboard />
          </Suspense>
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/ships">
        <AdminProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <ShipsManagement />
          </Suspense>
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/packages">
        <AdminProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <PackagesManagement />
          </Suspense>
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/credential-pools">
        <AdminProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <CredentialPoolsNew />
          </Suspense>
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/coupons">
        <AdminProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <CouponsManagementNew />
          </Suspense>
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/orders">
        <AdminProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <OrdersManagement />
          </Suspense>
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/users">
        <AdminProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <UsersManagementNew />
          </Suspense>
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/settings">
        <AdminProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <SettingsManagement />
          </Suspense>
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/site-settings">
        <AdminProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <SiteSettings />
          </Suspense>
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/reports">
        <AdminProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <Reports />
          </Suspense>
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/admin-reporting">
        <AdminProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <AdminReporting />
          </Suspense>
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/stock-management">
        <AdminProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <StockManagement />
          </Suspense>
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/tickets">
        <AdminProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <TicketManagement />
          </Suspense>
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/logs">
        <AdminProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <SystemLogs />
          </Suspense>
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/email-settings">
        <AdminProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <EmailSettings />
          </Suspense>
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/push-notifications">
        <AdminProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <PushNotifications />
          </Suspense>
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/email-marketing">
        <AdminProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <EmailMarketing />
          </Suspense>
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/database-backup">
        <AdminProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <DatabaseBackup />
          </Suspense>
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/financial-reports">
        <AdminProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <FinancialReports />
          </Suspense>
        </AdminProtectedRoute>
      </Route>
      
      <Route path="/admin/ship-analytics">
        <AdminProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <ShipAnalytics />
          </Suspense>
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
      <LanguageProvider>
        <TooltipProvider>
          <Router />
          <PWAInstallPrompt />
          <Toaster />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
