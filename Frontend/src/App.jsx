import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import api from './api'; // adjust path if needed

// COMPONENTS
import Navbar from './components/Navbar';

// PAGES
import Dashboard from './pages/Dashboard';
import WebsiteTeam from './pages/WebsiteTeam';
import BrandingTeam from './pages/BrandingTeam';
import SeoTeam from './pages/SeoTeam';
import CampaignTeam from './pages/CampaignTeam';
import TelecallerTeam from './pages/TelecallerTeam';
import Efficiency from './pages/Efficiency';
import TeamMembers from './pages/TeamMembers';
import ClientPage from './pages/ClientPage';
import Login from './pages/Login';
import EmployeeProfile from './pages/EmployeeProfile';

// Layout component
const Layout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  return (
    <>
      {!isLoginPage && <Navbar />}
      <div className="main-content">{children}</div>
    </>
  );
};

// Protected route – checks if user is logged in
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Admin route – checks if the logged-in user has admin privileges
const AdminRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await api.get('/auth/me');
        console.log('/auth/me response:', response.data); // <-- add this
        if (response.data.is_admin) {
          setIsAdmin(true);
        } else {
          console.log('User is not admin, redirecting to dashboard');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Admin check error:', error);
        navigate('/login');
      }
    };
    checkAdmin();
  }, [navigate]);

  if (isAdmin === null) return <div>Loading...</div>;
  return children;
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/efficiency" element={<ProtectedRoute><Efficiency /></ProtectedRoute>} />
          <Route path="/branding-team" element={<ProtectedRoute><BrandingTeam /></ProtectedRoute>} />
          <Route path="/website-team" element={<ProtectedRoute><WebsiteTeam /></ProtectedRoute>} />
          <Route path="/seo-team" element={<ProtectedRoute><SeoTeam /></ProtectedRoute>} />
          <Route path="/campaign-team" element={<ProtectedRoute><CampaignTeam /></ProtectedRoute>} />
          <Route path="/telecaller-team" element={<ProtectedRoute><TelecallerTeam /></ProtectedRoute>} />
          <Route path="/client-page" element={<ProtectedRoute><ClientPage /></ProtectedRoute>} />
          <Route path="/employee-profile/:id" element={<ProtectedRoute><EmployeeProfile /></ProtectedRoute>} />

          {/* Admin‑only route */}
          <Route path="/team-members" element={
            <ProtectedRoute>
              <AdminRoute>
                <TeamMembers />
              </AdminRoute>
            </ProtectedRoute>
          } />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;