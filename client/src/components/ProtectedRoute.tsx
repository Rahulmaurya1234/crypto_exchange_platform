import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import type { JSX } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const { user, checked } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (!checked) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <span>Checking session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
