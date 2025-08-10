import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");

  // Defensive subdomain fallback
  const fallbackSubdomain =
    context.subdomain ||
    context.organization?.subdomain ||
    localStorage.getItem("subdomain") ||
    (process.env.NODE_ENV === "development" ? "demo" : null);

  return {
    ...context,
    subdomain: fallbackSubdomain,
  };
};

// Remove trailing /api/v1 from base URL if present to avoid double api versioning
const getApiBaseUrl = () => {
  const rawBase =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:3000/api/v1";
  return rawBase.replace(/\/api\/v1\/?$/, "");
};

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    currentUser: null,
    organization: null,
    subdomain: null,
    token: null,
    loading: true,
    error: null,
  });

  const getAuthTokens = useCallback(() => {
    try {
      const token = localStorage.getItem("authToken");
      const subdomain = localStorage.getItem("subdomain");
      const email = localStorage.getItem("email");
      const role = localStorage.getItem("role");
      const userId = localStorage.getItem("userId");
      return { token, subdomain, email, role, userId };
    } catch (e) {
      console.warn("LocalStorage access error:", e);
      return {};
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    setState({
      currentUser: null,
      organization: null,
      subdomain: null,
      token: null,
      loading: false,
      error: null,
    });
  }, []);

  const verifyAuth = useCallback(
    async (token, subdomain) => {
      if (!token || !subdomain) {
        const error = !token
          ? "Authentication token is required"
          : "Organization subdomain is required";
        setState((prev) => ({ ...prev, error, loading: false }));
        return false;
      }

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const apiBase = getApiBaseUrl();

        const response = await axios.get(
          `${apiBase}/api/v1/organizations/${subdomain}/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const { user, organization } = response.data;

        const sanitizedUser = {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          username: user.username,
          team_id: user.team_id,
          department_id: user.department_id,
        };

        // Save in localStorage
        localStorage.setItem("authToken", token);
        localStorage.setItem("subdomain", subdomain);
        localStorage.setItem("email", sanitizedUser.email);
        localStorage.setItem("role", sanitizedUser.role);
        localStorage.setItem("userId", sanitizedUser.id);

        setState({
          currentUser: sanitizedUser,
          organization,
          subdomain,
          token,
          loading: false,
          error: null,
        });

        return true;
      } catch (error) {
        const errorMessage =
          error.response?.status === 401
            ? "Session expired. Please log in again."
            : error.response?.status === 404
            ? "Organization not found for this subdomain"
            : error.response?.data?.error || "Authentication failed";

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));

        logout();
        return false;
      }
    },
    [logout]
  );

  // On mount: try to initialize auth from localStorage tokens
  useEffect(() => {
    const { token, subdomain } = getAuthTokens();
    const effectiveSubdomain =
      subdomain || (process.env.NODE_ENV === "development" ? "demo" : null);

    if (token && effectiveSubdomain) {
      verifyAuth(token, effectiveSubdomain);
    } else {
      // If no token, treat as "not authenticated" but do NOT set an error
      // This prevents "Authentication token missing" error on public pages
      setState((prev) => ({
        currentUser: null,
        organization: null,
        subdomain: effectiveSubdomain,
        token: null,
        loading: false,
        error: null, // Clear error here!
      }));
    }
  }, [getAuthTokens, verifyAuth]);

  // Login function
  const login = useCallback(
    async (email, password, domain) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const subdomain =
          domain || (process.env.NODE_ENV === "development" ? "demo" : null);

        if (!subdomain) throw new Error("Subdomain is required");

        const apiBase = getApiBaseUrl();

        const response = await axios.post(`${apiBase}/api/v1/login`, {
          email,
          password,
          subdomain,
        });

        const { auth_token, user } = response.data;

        // Save tokens in localStorage
        localStorage.setItem("authToken", auth_token);
        localStorage.setItem("subdomain", subdomain);
        localStorage.setItem("email", user.email);
        localStorage.setItem("role", user.role);
        localStorage.setItem("userId", user.id);

        // Verify after login
        const isVerified = await verifyAuth(auth_token, subdomain);
        if (!isVerified) throw new Error("Verification after login failed");

        return true;
      } catch (error) {
        const errorMessage =
          error.response?.status === 404
            ? "Organization not found for this subdomain"
            : error.response?.data?.error || "Login failed";

        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw new Error(errorMessage);
      }
    },
    [verifyAuth]
  );

  const contextValue = useMemo(
    () => ({
      ...state,
      login,
      logout,
      isAdmin:
        state.currentUser?.role === "system_admin" ||
        state.currentUser?.role === "domain_admin",
      isSuperUser:
        state.currentUser?.role === "system_admin" ||
        state.currentUser?.role === "domain_admin",
      isAuthenticated: !!state.currentUser && !!state.token,
    }),
    [state, login, logout]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
