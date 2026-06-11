import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import HospitalBilling from './pages/HospitalBilling';
import DiagnosticBilling from './pages/DiagnosticBilling';
import PrintPreview from './pages/PrintPreview';
import BillHistory from './pages/BillHistory';
import IPDList from './pages/IPDList';
import IPDAccount from './pages/IPDAccount';
import IPDPrintPreview from './pages/IPDPrintPreview';
import RoomDashboard from './pages/RoomDashboard';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) return null;
  if (profile?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Room users get a dedicated route
  if (user && profile?.role === 'room_user') {
    return (
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<RoomDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/hospital-billing" element={<HospitalBilling />} />
        <Route path="/diagnostic-billing" element={<DiagnosticBilling />} />
        <Route path="/history" element={<BillHistory />} />
        <Route path="/ipd" element={<IPDList />} />
        <Route path="/ipd/:admissionId" element={<IPDAccount />} />
        <Route path="/ipd/print/:admissionId" element={<IPDPrintPreview />} />
        <Route
          path="/settings"
          element={
            <AdminRoute>
              <Settings />
            </AdminRoute>
          }
        />
      </Route>
      <Route
        path="/print/:type/:billId"
        element={
          <ProtectedRoute>
            <PrintPreview />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
