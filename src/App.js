import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import FullPageLoader from "./components/FullPageLoader";
import { useAuth } from "./contexts/authContext";
import Home from "./components/Home";
import Header from "./components/Header";
import Login from "./components/Login";
import ResetPassword from "./components/ResetPassword";
import AdminRegister from "./components/AdminRegister";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import Incident from "./components/Incidents";
import CreateTicketPage from "./components/CreateTicketPage";
import IncidentOverview from "./components/IncidentOverview";
import KnowledgeBase from "./components/KnowledgeBase";
import CreateProblems from "./components/CreateProblems";
import ProblemsOverview from "./components/ProblemsOverview";
import Settings from "./components/Settings";
import Profile from "./components/Profile";
import CreateUserForm from "./components/CreateUserForm";
import AdminDashboard from "./components/AdminDashboard";

const AppWrapper = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const { currentUser, isAuthenticated, logout, subdomain } = useAuth();

  useEffect(() => {
    console.log("AppWrapper: Route changed", {
      path: location.pathname,
      currentUser,
      isAuthenticated,
    });
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  const handleLogout = () => {
    console.log("AppWrapper: Logging out", { currentUser });
    logout();
    window.location.href = "/login"; // Force reload to clear state
  };

  console.log("AppWrapper: Rendering", {
    path: location.pathname,
    isAuthenticated,
    currentUser,
  });

  return (
    <>
      {loading && <FullPageLoader />}
      <div className="App min-h-screen flex flex-col">
        {isAuthenticated && currentUser && (
          <>
            <Header />
            <Navbar
              logo={process.env.REACT_APP_LOGO_URL || "/path_to_logo"}
              name={currentUser?.email}
              email={currentUser?.email}
              role={currentUser?.role}
              profileImage={
                process.env.REACT_APP_PROFILE_IMAGE_URL || "/path_to_image"
              }
              loggedIn={isAuthenticated}
              onLogout={handleLogout}
              organizationName={currentUser?.organization?.name || ""}
              subdomain={subdomain || ""}
              className="fixed top-0 left-0 right-0 z-10"
            />
            <Sidebar
              isLoggedIn={isAuthenticated}
              className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 z-20 bg-gray-800 text-white"
            />
          </>
        )}
        <div
          className={
            isAuthenticated && currentUser
              ? "ml-64 pt-16 px-4 flex-1"
              : "flex-1"
          }
        >
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated && currentUser ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Home />
                )
              }
            />
            <Route
              path="/login"
              element={
                isAuthenticated && currentUser ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Login />
                )
              }
            />
            <Route path="/admin/register" element={<AdminRegister />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute
                  allowedRoles={[
                    "system_admin",
                    "domain_admin",
                    "service_desk_agent",
                    "team_leader",
                    "level_1_2_support",
                    "level_3_support",
                    "incident_manager",
                    "problem_manager",
                    "problem_coordinator",
                    "change_manager",
                    "change_coordinator",
                    "department_manager",
                    "general_manager",
                  ]}
                >
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/user/dashboard"
              element={
                <PrivateRoute
                  allowedRoles={[
                    "service_desk_agent",
                    "team_leader",
                    "level_1_2_support",
                    "level_3_support",
                  ]}
                >
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/incident"
              element={
                <PrivateRoute
                  allowedRoles={[
                    "system_admin",
                    "domain_admin",
                    "service_desk_agent",
                    "incident_manager",
                  ]}
                >
                  <Incident />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-ticket"
              element={
                <PrivateRoute
                  allowedRoles={[
                    "system_admin",
                    "domain_admin",
                    "service_desk_agent",
                    "incident_manager",
                    "team_leader",
                  ]}
                >
                  <CreateTicketPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/incident-overview"
              element={
                <PrivateRoute
                  allowedRoles={[
                    "system_admin",
                    "domain_admin",
                    "service_desk_agent",
                    "incident_manager",
                    "team_leader",
                  ]}
                >
                  <IncidentOverview />
                </PrivateRoute>
              }
            />
            <Route
              path="/knowledge-base"
              element={
                <PrivateRoute
                  allowedRoles={[
                    "system_admin",
                    "domain_admin",
                    "service_desk_agent",
                    "team_leader",
                    "level_1_2_support",
                    "level_3_support",
                    "incident_manager",
                    "problem_manager",
                    "problem_coordinator",
                    "change_manager",
                    "change_coordinator",
                    "department_manager",
                    "general_manager",
                  ]}
                >
                  <KnowledgeBase />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-problems"
              element={
                <PrivateRoute
                  allowedRoles={[
                    "system_admin",
                    "domain_admin",
                    "problem_manager",
                    "problem_coordinator",
                    "team_leader",
                  ]}
                >
                  <CreateProblems />
                </PrivateRoute>
              }
            />
            <Route
              path="/problems-overview"
              element={
                <PrivateRoute
                  allowedRoles={[
                    "system_admin",
                    "domain_admin",
                    "team_leader",
                    "problem_manager",
                    "problem_coordinator",
                  ]}
                >
                  <ProblemsOverview />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute allowedRoles={["system_admin", "domain_admin"]}>
                  <Settings />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute
                  allowedRoles={[
                    "system_admin",
                    "domain_admin",
                    "service_desk_agent",
                    "team_leader",
                    "level_1_2_support",
                    "level_3_support",
                    "incident_manager",
                    "problem_manager",
                    "problem_coordinator",
                    "change_manager",
                    "change_coordinator",
                    "department_manager",
                    "general_manager",
                  ]}
                >
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-user"
              element={
                <PrivateRoute allowedRoles={["system_admin", "domain_admin"]}>
                  <CreateUserForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <PrivateRoute
                  allowedRoles={["system_admin", "domain_admin", "team_leader"]}
                >
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/forbidden"
              element={
                <div className="text-red-500 text-center">
                  Access Denied: Insufficient Permissions
                </div>
              }
            />
            <Route path="/home" element={<Home loggedIn={isAuthenticated} />} />
            <Route path="/forgot-password" element={<ResetPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route
              path="*"
              element={
                <div className="text-red-500 text-center">Page Not Found</div>
              }
            />
          </Routes>
        </div>
      </div>
    </>
  );
};

const App = () => (
  <Router>
    <AppWrapper />
  </Router>
);

export default App;
