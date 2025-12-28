import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { PasswordChangeDialog } from "./components/settings/PasswordChangeDialog";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ClientList from "./pages/ClientList";
import ClientForm from "./pages/ClientForm";
import ClientDetails from "./pages/ClientDetails";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Statistics from "./pages/Statistics";
import MapView from "./pages/MapView";
import Archive from "./pages/Archive";
import ClientArchive from "./pages/ClientArchive";
import Analytics from "./pages/Analytics";
import TrackOrder from "./pages/TrackOrder";
import ClientTrash from "./pages/ClientTrash";

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType, adminOnly?: boolean }) {
  const { data: user, isLoading } = trpc.systemUsers.me.useQuery();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">,'1J 'D*-BB EF 'D5D'-J'*...</div>;
  }

  if (!user) {
    return null;
  }

  if (adminOnly && user.role !== 'admin') {
    return <div className="flex items-center justify-center min-h-screen">:J1 E51- DC ('DH5HD DG0G 'D5A-). G0G 'D5A-) DDE3$HDJF AB7.</div>;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/track" component={TrackOrder} />
      
      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/clients">
        <ProtectedRoute component={ClientList} />
      </Route>
      <Route path="/clients/new">
        <ProtectedRoute component={ClientForm} />
      </Route>
      <Route path="/clients/trash">
        <ProtectedRoute component={ClientTrash} adminOnly />
      </Route>
      <Route path="/clients/:id/edit">
        <ProtectedRoute component={ClientForm} />
      </Route>
      <Route path="/clients/:id/archive">
        <ProtectedRoute component={ClientArchive} />
      </Route>
      <Route path="/clients/:id">
        <ProtectedRoute component={ClientDetails} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={Reports} />
      </Route>
      <Route path="/statistics">
        <ProtectedRoute component={Statistics} />
      </Route>
      <Route path="/analytics">
        <ProtectedRoute component={Analytics} />
      </Route>
      <Route path="/map">
        <ProtectedRoute component={MapView} />
      </Route>
      <Route path="/archive">
        <ProtectedRoute component={ClientArchive} />
      </Route>
      <Route path="/apps">
        <ProtectedRoute component={Archive} />
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;