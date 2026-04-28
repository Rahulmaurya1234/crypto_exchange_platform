import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch } from 'react-redux';

import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/auth/Login';
import { Unauthorized } from './pages/Unauthorized';

import AdminDashboard from './pages/AdminDashboard';
import { Users } from './pages/Users';
import { KYC } from './pages/KYC';
import { Disputes } from './pages/Disputes';
import { Appeals } from './pages/Appeals';
import { Escrow } from './pages/Escrow';
import { Support } from './pages/Support';
import { Settings } from './pages/Settings';
import { Trades } from './pages/Trades';
import { Register } from './pages/auth/Register';

import { useRefreshMutation } from './store/api/authApi';
import { setUser, setInitialized, setLoading } from './store/slices/authSlice';
import { InstantSellerEscrow } from './pages/InstantSellerEscrow';
import AdminLogs from './pages/AdminLogs';

function App() {
  const dispatch = useDispatch();
  const [refresh] = useRefreshMutation();

  // Check authentication on app mount (page reload)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        dispatch(setLoading(true));

        // Try to refresh the token (this will use the httpOnly refresh cookie)
        const response = await refresh().unwrap();

        // If successful, set user in store
        dispatch(setUser(response.data.user));
        console.log('Auth restored from cookies');
      } catch (error) {
        // If refresh fails, user is not authenticated
        console.log('No valid session found');
        dispatch(setInitialized());
      }
    };

    checkAuth();
  }, [dispatch, refresh]);

  return (
    <>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/kyc" element={<KYC />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/disputes" element={<Disputes />} />
            <Route path="/appeals" element={<Appeals />} />
            <Route path="/escrow" element={<Escrow />} />
            <Route path="/support" element={<Support />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/instant-seller-escrow" element={<InstantSellerEscrow />} />
            <Route path="/logs" element={<AdminLogs />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="font-medium"
      />
    </>
  );
}

export default App;