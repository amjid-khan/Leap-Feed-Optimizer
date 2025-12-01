import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Form from "./pages/Form.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import FeedData from "./component/FeedData.jsx";
import AdminLayout from "./component/AdminLayout.jsx";
import ProtectedRoute from "./component/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";

// Component to handle redirection after login
const AuthRedirectHandler = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user && location.pathname === "/") {
      // User is logged in and trying to access the login page
      navigate("/admin", { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  return null;
};

const PublicRoute = ({ children }) => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated()) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <>
      {children}
    </>
  );
};

const InvalidRouteHandler = () => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated()
    ? <Navigate to="/admin" replace />
    : <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
      <AuthRedirectHandler />
      <Routes>
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <Form />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="feeddata" element={<FeedData />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
        
        <Route path="*" element={<InvalidRouteHandler />} />
      </Routes>
    </Router>
  );
}

export default App;