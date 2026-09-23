import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getMe } from "../api/auth.api";

export default function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/v2");

  useEffect(() => {
    getMe()
      .then((response) => {
        const role = (response.data?.user?.role || "").toUpperCase();
        const roleAllowed = !allowedRoles?.length || allowedRoles.some((allowedRole) => allowedRole.toUpperCase() === role);
        setAllowed(roleAllowed);
        if (role === "INSTITUTE_ADMIN") setRedirectTo("/v2/institute/dashboard");
        else if (role === "STUDENT") setRedirectTo("/v2/institute/student/dashboard");
      })
      .catch(() => setAllowed(false))
      .finally(() => setLoading(false));
  }, [allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Checking login...
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
