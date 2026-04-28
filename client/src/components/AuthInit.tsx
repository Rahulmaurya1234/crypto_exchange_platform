import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchCurrentUser } from "../features/auth/authSlice";

export default function AuthInit({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { checked, loading } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!checked) {
      dispatch(fetchCurrentUser());
    }
  }, [checked, dispatch]);

  if (!checked || loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <span>Loading...</span>
      </div>
    );
  }

  return <>{children}</>;
}
