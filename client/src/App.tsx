import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Assessment from "@/pages/assessment";
import FleetTrackingForm from "@/pages/fleet-tracking";
import FleetCameraForm from "@/pages/fleet-camera";
import CustomerPortal from "@/pages/customer-portal";
import AdminDashboard from "@/pages/admin-dashboard";
import LoginError from "@/pages/login-error";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Check if user has admin access
  const isAdmin = user && (user.isSystemAdmin || user.role === 'admin');

  return (
    <Switch>
      <Route path="/customer/:token" component={CustomerPortal} />
      <Route path="/login-error" component={LoginError} />
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/admin" component={Landing} />
          <Route component={NotFound} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          {/* Admin routes - only accessible to system admins */}
          {isAdmin ? (
            <Route path="/admin" component={AdminDashboard} />
          ) : (
            <Route path="/admin" component={() => <NotFound />} />
          )}
          {/* Partner routes - accessible to all authenticated users */}
          <Route path="/assessment/:id?" component={Assessment} />
          <Route path="/fleet-tracking/:id?" component={FleetTrackingForm} />
          <Route path="/fleet-camera/:id?" component={FleetCameraForm} />
          <Route component={NotFound} />
        </>
      )}
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
