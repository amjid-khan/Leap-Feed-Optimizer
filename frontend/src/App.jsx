import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Form from "./pages/Form.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import FeedData from "./component/FeedData.jsx";
import AdminLayout from "./component/AdminLayout.jsx";
import { useAuth } from "./context/AuthContext.jsx";

// ProtectedRoute for pages only accessible if logged in
const ProtectedRoute = ({ children }) => {
  const { user, loading, isAuthenticated, loginWithToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle token coming from Google OAuth redirect (?token=...)
  const searchParams = new URLSearchParams(location.search);
  const urlToken = searchParams.get("token");
  const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // If we have a token in URL but not yet stored, process it
  if (urlToken && !storedToken) {
    // Temporarily show loading UI while we process token
    // Note: we can't use useEffect here easily, so we trigger async login
    // and rely on the redirect to re-render.
    loginWithToken(urlToken).then((res) => {
      if (res?.success) {
        // Clean URL and go to admin dashboard without token in query
        navigate("/admin", { replace: true });
      } else {
        navigate("/", {
          replace: true,
          state: { error: res?.message || "Google login failed. Please try again." },
        });
      }
    });

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Completing Google login...</p>
        </div>
      </div>
    );
  }

  // Show loading while checking auth - but only briefly
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated (has valid token AND user object)
  const token = localStorage.getItem("token");
  if (!token || !user || !isAuthenticated()) {
    // Clear any invalid data
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // Save intended destination for redirect after login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // User is authenticated, render the children
  return <>{children}</>;
};

// PublicRoute for login/register page, redirects if already logged in
const PublicRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is already authenticated
  const token = localStorage.getItem("token");
  if (token && user && isAuthenticated()) {
    // Redirect to admin dashboard, or to intended destination if exists
    const from = location.state?.from?.pathname || "/admin";
    return <Navigate to={from} replace />;
  }

  // Clear any invalid/incomplete data if user tries to access login while not fully authenticated
  if (!token && user) {
    localStorage.removeItem("user");
  }

  return <>{children}</>;
};

// Handler for invalid routes - redirects based on auth status
const InvalidRouteHandler = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Wait for auth check to complete
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  const token = localStorage.getItem("token");
  if (token && user && isAuthenticated()) {
    // Logged in user trying to access invalid route - redirect to dashboard
    return <Navigate to="/admin" replace />;
  } else {
    // Not logged in - redirect to login
    return <Navigate to="/" replace />;
  }
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Login/Register Page */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Form />
            </PublicRoute>
          }
        />

        {/* Admin Routes with Layout */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Default open page = Dashboard */}
          <Route index element={<Dashboard />} />

          {/* Dashboard Route */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* FeedData Route */}
          <Route path="feeddata" element={<FeedData />} />

          {/* Catch all invalid admin routes - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* Catch all other invalid routes - redirect based on auth */}
        <Route
          path="*"
          element={<InvalidRouteHandler />}
        />
      </Routes>
    </Router>
  );
}

export default App;
