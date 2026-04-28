import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";
import { ToastContainer, useToastNotifications } from "../components/Notifications/ToastNotification";

const AUTH_FULL_PAGE_PATHS = ["/login", "/register", "/verify-otp", "/"];
const HIDE_HEADER_PATHS = ["/login", "/register", "/verify-otp"];

export default function Layout() {
  const location = useLocation();
  const path = location.pathname;
  const { toasts, removeToast } = useToastNotifications();

  const isAuthFullPage = AUTH_FULL_PAGE_PATHS.includes(path);
  const hideHeader = HIDE_HEADER_PATHS.includes(path);

  if (isAuthFullPage) {
    return (
      <>
        <Outlet />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {!hideHeader && <Header />}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

