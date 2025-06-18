import React, { Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAppStore } from "@/store/main";

/* Global shared views */
import GV_Navbar from "@/components/views/GV_Navbar";
import GV_Sidebar from "@/components/views/GV_Sidebar";
import GV_Footer from "@/components/views/GV_Footer";
import GV_NotificationsPanel from "@/components/views/GV_NotificationsPanel";

/* Unique views */
import UV_Login from "@/components/views/UV_Login";
import UV_Dashboard from "@/components/views/UV_Dashboard";
import UV_ClientList from "@/components/views/UV_ClientList";
import UV_ClientProfile from "@/components/views/UV_ClientProfile";
import UV_ClientForm from "@/components/views/UV_ClientForm";
import UV_PropertyList from "@/components/views/UV_PropertyList";
import UV_PropertyForm from "@/components/views/UV_PropertyForm";
import UV_AppointmentList from "@/components/views/UV_AppointmentList";
import UV_AppointmentForm from "@/components/views/UV_AppointmentForm";
import UV_UserManagement from "@/components/views/UV_UserManagement";
import UV_Reports from "@/components/views/UV_Reports";
import UV_DataImportExport from "@/components/views/UV_DataImportExport";
import UV_Settings from "@/components/views/UV_Settings";
import UV_Error from "@/components/views/UV_Error";

/* Instantiate the query client outside the component tree */
const queryClient = new QueryClient();

/* Global ErrorBoundary to catch errors */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <UV_Error />;
    }
    return this.props.children;
  }
}

/* ProtectedRoute: Only let authenticated users access its children */
const ProtectedRoute = ({ children }) => {
  const auth = useAppStore((state) => state.auth);
  if (!auth.is_authenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

/* PublicRoute: Redirect authenticated users away from public pages (e.g. login) */
const PublicRoute = ({ children }) => {
  const auth = useAppStore((state) => state.auth);
  if (auth.is_authenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

/* AuthLayout: Layout for authenticated routes with global components and socket init */
const AuthLayout = () => {
  // Get auth state and socket initialization functions from the global store (Zustand)
  const auth = useAppStore((state) => state.auth);
  const socket = useAppStore((state) => state.socket);
  const init_socket = useAppStore((state) => state.init_socket);

  useEffect(() => {
    if (auth.is_authenticated && !socket) {
      init_socket();
    }
  }, [auth.is_authenticated, socket, init_socket]);

  return (
    <>
      <GV_Navbar />
      <div className="flex min-h-screen">
        <GV_Sidebar />
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </div>
      <GV_NotificationsPanel />
      <GV_Footer />
    </>
  );
};

/* PublicLayout: Minimal layout for non-authenticated pages (e.g. login) */
const PublicLayout = () => {
  return <Outlet />;
};

/* The main App component wrapping everything with providers */
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <UV_Login />
                    </PublicRoute>
                  }
                />
              </Route>

              {/* Protected Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <AuthLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<UV_Dashboard />} />
                <Route path="/clients" element={<UV_ClientList />} />
                <Route path="/clients/new" element={<UV_ClientForm />} />
                <Route path="/clients/:client_id" element={<UV_ClientProfile />} />
                <Route path="/clients/:client_id/edit" element={<UV_ClientForm />} />
                <Route path="/clients/import" element={<UV_DataImportExport />} />
                <Route path="/appointments" element={<UV_AppointmentList />} />
                <Route path="/appointments/new" element={<UV_AppointmentForm />} />
                <Route path="/properties" element={<UV_PropertyList />} />
                <Route path="/properties/new" element={<UV_PropertyForm />} />
                <Route path="/properties/:property_id" element={<UV_PropertyForm />} />
                <Route path="/users" element={<UV_UserManagement />} />
                <Route path="/user-settings/:user_id" element={<UV_Settings />} />
              </Route>

              {/* Fallback route for non-matching routes */}
              <Route path="*" element={<UV_Error />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;