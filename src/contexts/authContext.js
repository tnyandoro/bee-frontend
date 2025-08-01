// src/contexts/AuthProvider.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

// API Base URL
const getApiBaseUrl = () => {
  return (
    process.env.REACT_APP_API_BASE_URL || "https://itsm-api.onrender.com/api/v1"
  );
};

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    currentUser: null,
    organization: null,
    permissions: {},
    subdomain: null,
    token: null,
    loading: true,
    error: null,
  });

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("subdomain");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");

    setState((prev) => ({
      ...prev,
      currentUser: null,
      organization: null,
      permissions: {},
      subdomain: null,
      token: null,
      loading: false,
      error: null,
    }));
  }, []);

  const fetchProfileAndPermissions = useCallback(
    async (token, subdomain) => {
      if (!token || !subdomain) return false;

      const apiBase = getApiBaseUrl();
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      try {
        // Fetch profile
        const profileRes = await fetch(
          `${apiBase}/organizations/${subdomain}/profile`,
          { headers }
        );

        if (!profileRes.ok) throw new Error("Profile fetch failed");

        const profileData = await profileRes.json();
        const { user, organization } = profileData;

        // Fetch permissions
        const permissionsRes = await fetch(`${apiBase}/permissions`, {
          headers,
        });
        if (!permissionsRes.ok) throw new Error("Permissions fetch failed");
        const permissionsData = await permissionsRes.json();

        // Use data.data if wrapped
        const permissions = permissionsData.data || permissionsData;

        // Sanitize user
        const sanitizedUser = {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          username: user.username,
          team_id: user.team_id,
          department_id: user.department_id,
          is_admin: permissions.can_access_admin_dashboard || false,
        };

        // Persist to localStorage
        localStorage.setItem("authToken", token);
        localStorage.setItem("subdomain", subdomain);
        localStorage.setItem("email", sanitizedUser.email);
        localStorage.setItem("role", sanitizedUser.role);
        localStorage.setItem("userId", sanitizedUser.id);

        setState({
          currentUser: sanitizedUser,
          organization,
          permissions,
          subdomain,
          token,
          loading: false,
          error: null,
        });

        return true;
      } catch (error) {
        console.error("Auth verification failed:", error);
        const message =
          error.response?.data?.error || "Session invalid or expired";
        setState((prev) => ({ ...prev, error: message, loading: false }));
        logout();
        return false;
      }
    },
    [logout]
  );

  // Initialize auth on mount
  useEffect(() => {
    const { token, subdomain } = {
      token: localStorage.getItem("authToken"),
      subdomain: localStorage.getItem("subdomain"),
    };

    const effectiveSubdomain =
      subdomain || (process.env.NODE_ENV === "development" ? "demo" : null);

    if (token && effectiveSubdomain) {
      fetchProfileAndPermissions(token, effectiveSubdomain);
    } else {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: !token
          ? "No authentication token"
          : "No organization subdomain available",
      }));
    }
  }, [fetchProfileAndPermissions]);

  const login = useCallback(
    async (email, password, domain) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const subdomain =
        domain || (process.env.NODE_ENV === "development" ? "demo" : null);
      if (!subdomain) throw new Error("Subdomain is required");

      const apiBase = getApiBaseUrl();

      try {
        const response = await fetch(`${apiBase}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email, password, subdomain }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Login failed");
        }

        const { auth_token: authToken } = data;

        // Now fetch profile and permissions
        const success = await fetchProfileAndPermissions(authToken, subdomain);
        if (!success) {
          throw new Error("Failed to verify session after login");
        }

        return true;
      } catch (error) {
        const errorMessage =
          error.response?.status === 404
            ? "Organization not found"
            : error.message || "Login failed";

        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw error;
      }
    },
    [fetchProfileAndPermissions]
  );

  const contextValue = useMemo(
    () => ({
      ...state,
      login,
      logout,
      isAdmin: state.permissions.can_access_admin_dashboard === true,
      isSuperUser: ["system_admin", "domain_admin"].includes(
        state.currentUser?.role
      ),
      isAuthenticated: !!state.currentUser && !!state.token,
    }),
    [state, login, logout]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
