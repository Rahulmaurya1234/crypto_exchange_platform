import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout/Layout";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";
import Marketplace from "./pages/Marketplace";
import CreateListing from "./pages/Marketplace/CreateListing";
import MyListings from "./pages/MyListings";
import ChatPage from "./pages/ChatPage";
import AllChats from "./pages/AllChats";
import KycUploadPage from "./pages/SubmitKyc";
import WalletPage from "./pages/WalletPage";
import LandingPage from "./pages/Landing";
import ProtectedRoute from "./components/ProtectedRoute";
import Trades from "./pages/Trades";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Full-screen auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* All app pages with header/footer */}
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />

          {/* Public */}
          <Route path="market" element={<Marketplace />} />

          {/* Protected – NO leading slash! */}
          <Route
            path="market/create"
            element={
              <ProtectedRoute>
                <CreateListing />
              </ProtectedRoute>
            }
          />
          <Route
            path="market/my-listings"
            element={
              <ProtectedRoute>
                <MyListings />
              </ProtectedRoute>
            }
          />
          <Route
            path="trades"
            element={
              <ProtectedRoute>
                <Trades />
              </ProtectedRoute>
            }
          />
          <Route
            path="wallet"
            element={
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="chats"
            element={
              <ProtectedRoute>
                <AllChats />
              </ProtectedRoute>
            }
          />
          <Route
            path="chat/:tradeId"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="chat/new/:listingId"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="kyc-submit"
            element={
              <ProtectedRoute>
                <KycUploadPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback inside layout */}
          <Route path="*" element={<Navigate to="/market" replace />} />
        </Route>

        {/* Global fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}