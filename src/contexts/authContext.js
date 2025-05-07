import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import PropTypes from "prop-types";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    user: null,
    organization: null,
    subdomain: null,
    token: null,
    loading: true,
    error: null,
  });

  // Centralized storage management
  const getAuthTokens = useCallback(() => {
    try {
      const token = localStorage.getItem("authToken");
      const subdomain = localStorage.getItem("subdomain");
      console.log("Retrieved from localStorage:", { token, subdomain });
      return { token, subdomain };
    } catch (e) {
      console.warn("LocalStorage access error:", e);
      return { token: null, subdomain: null };
    }
  }, []);

  const logout = useCallback(() => {
    console.log("Logging out, clearing localStorage");
    localStorage.removeItem("authToken");
    localStorage.removeItem("subdomain");
    setState({
      user: null,
      organization: null,
      subdomain: null,
      token: null,
      loading: false,
      error: null,
    });
  }, []);

  const refreshToken = useCallback(async () => {
    const { token, subdomain } = getAuthTokens();
    if (!token || !subdomain) {
      console.error("Cannot refresh token: missing token or subdomain");
      logout();
      return null;
    }

    try {
      console.log("Refreshing token for subdomain:", subdomain);
      const { data } = await axios.post(
        `http://${subdomain}.lvh.me:3000/api/v1/refresh_token`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Token refreshed:", { auth_token: data.auth_token });
      localStorage.setItem("authToken", data.auth_token);
      setState((prev) => ({ ...prev, token: data.auth_token }));
      return data.auth_token;
    } catch (error) {
      console.error("Token refresh error:", error);
      logout();
      return null;
    }
  }, [logout, getAuthTokens]);

  const verifyAuth = useCallback(
    async (token, subdomain) => {
      if (!token) {
        console.error("No token provided for verifyAuth");
        setState((prev) => ({
          ...prev,
          error: "Authentication token is required",
          loading: false,
        }));
        return false;
      }
      if (!subdomain) {
        console.error("No subdomain provided for verifyAuth");
        setState((prev) => ({
          ...prev,
          error: "Organization subdomain is required",
          loading: false,
        }));
        return false;
      }

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        console.log("Verifying auth with:", { token, subdomain });

        const { data } = await axios.get(
          `http://${subdomain}.lvh.me:3000/api/v1/organizations/${subdomain}/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("Auth verified:", {
          user: data.user,
          organization: data.organization,
        });

        setState({
          user: data.user,
          organization: data.organization,
          subdomain,
          token,
          loading: false,
          error: null,
        });
        return true;
      } catch (error) {
        console.error("Auth verification error:", error);
        const errorMessage =
          error.response?.status === 401
            ? "Session expired. Please log in again."
            : error.response?.status === 404
            ? "Organization not found for this subdomain"
            : error.response?.data?.error || "Authentication failed";

        if (error.response?.status === 401) {
          const newToken = await refreshToken();
          if (newToken) {
            return await verifyAuth(newToken, subdomain);
          } else {
            logout();
          }
        } else {
          setState((prev) => ({
            ...prev,
            error: errorMessage,
            loading: false,
          }));
        }
        return false;
      }
    },
    [logout, refreshToken]
  );

  // Initialize auth state on mount
  useEffect(() => {
    const { token, subdomain } = getAuthTokens();
    const effectiveSubdomain =
      subdomain || (process.env.NODE_ENV === "development" ? "demo" : null);

    if (token && effectiveSubdomain) {
      verifyAuth(token, effectiveSubdomain);
    } else {
      console.log("No token or subdomain, setting loading to false");
      setState((prev) => ({
        ...prev,
        loading: false,
        error: effectiveSubdomain
          ? "Authentication token missing"
          : "No organization subdomain available",
      }));
    }
  }, [getAuthTokens, verifyAuth]);

  const login = useCallback(
    async (email, password, domain) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const effectiveDomain =
          domain || (process.env.NODE_ENV === "development" ? "demo" : null);

        if (!effectiveDomain) {
          throw new Error("Organization subdomain is required");
        }

        console.log("Logging in with:", { email, domain: effectiveDomain });

        const { data } = await axios.post(
          `http://${effectiveDomain}.lvh.me:3000/api/v1/login`,
          { email, password }
        );

        console.log("Login successful, storing:", {
          auth_token: data.auth_token,
          subdomain: effectiveDomain,
        });

        localStorage.setItem("authToken", data.auth_token);
        localStorage.setItem("subdomain", effectiveDomain);

        // Verify auth without triggering re-render loop
        const isVerified = await verifyAuth(data.auth_token, effectiveDomain);

        if (!isVerified) {
          throw new Error("Failed to verify authentication after login");
        }

        return true;
      } catch (error) {
        console.error("Login error:", error);
        const errorMessage =
          error.response?.status === 404
            ? "Organization not found for this subdomain"
            : error.response?.data?.error || "Login failed";

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
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
      refreshToken,
      isAdmin: state.user?.is_admin || false,
      isSuperUser: state.user?.is_super_user || false,
      isAuthenticated: !!state.user && !!state.token,
    }),
    [state, login, logout, refreshToken]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
