import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const DashboardLoader = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");
    const targetRoute =
      role === "admin" || role === "super_user"
        ? "/dashboard"
        : "/user/dashboard";

    console.log("Redirecting to:", targetRoute);
    navigate(targetRoute, { replace: true });
  }, [navigate]);

  return <div className="p-4">Preparing dashboard...</div>;
};

export default DashboardLoader;
