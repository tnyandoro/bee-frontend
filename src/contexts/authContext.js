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
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// 🔧 Helper to determine the correct API base URL

const getApiBaseUrl = (subdomain) => {
  console.log("API Base URL:", getApiBaseUrl(subdomain));

  if (process.env.NODE_ENV === "development") {
    return `http://${subdomain}.lvh.me:3000/api/v1`;
  }

  // Use HTTPS in production
  return `https://itsm-api.onrender.com/api/v1`;
};

// const getApiBaseUrl = (subdomain) => {
//   const envBase = process.env.REACT_APP_API_BASE_URL;
//   if (envBase) return envBase;

//   if (process.env.NODE_ENV === "development") {
//     return `http://${subdomain}.lvh.me:3000/api/v1`;
//   }

//   throw new Error("API base URL not configured");
// };

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

      if (token || subdomain || email || role || userId) {
        console.log("Retrieved from localStorage:", {
          token,
          subdomain,
          email,
          role,
          userId,
        });
      }

      return { token, subdomain, email, role, userId };
    } catch (e) {
      console.warn("LocalStorage access error:", e);
      return {
        token: null,
        subdomain: null,
        email: null,
        role: null,
        userId: null,
      };
    }
  }, []);

  const logout = useCallback(() => {
    console.log("Logging out and clearing localStorage");
    localStorage.removeItem("authToken");
    localStorage.removeItem("subdomain");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");

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
        console.error("verifyAuth error:", error);
        setState((prev) => ({ ...prev, error, loading: false }));
        return false;
      }

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        console.log("Verifying auth with:", { token, subdomain });

        const apiBase = getApiBaseUrl(subdomain);

        const response = await axios.get(
          `${apiBase}/organizations/${subdomain}/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 15000,
          }
        );

        const data = response.data;

        console.log("Auth verified:", {
          user: data.user,
          organization: data.organization,
        });

        const sanitizedUser = {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          name: data.user.name,
          username: data.user.username,
          team_id: data.user.team_id,
          department_id: data.user.department_id,
        };

        setState({
          currentUser: sanitizedUser,
          organization: data.organization,
          subdomain,
          token,
          loading: false,
          error: null,
        });

        localStorage.setItem("email", sanitizedUser.email);
        localStorage.setItem("role", sanitizedUser.role);
        localStorage.setItem("userId", sanitizedUser.id);

        return true;
      } catch (error) {
        console.error("Auth verification error:", error);
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

  useEffect(() => {
    const { token, subdomain } = getAuthTokens();
    const effectiveSubdomain =
      subdomain || (process.env.NODE_ENV === "development" ? "demo" : null);

    if (token && effectiveSubdomain) {
      verifyAuth(token, effectiveSubdomain);
    } else {
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

        const apiBase = getApiBaseUrl(effectiveDomain);

        const response = await axios.post(`${apiBase}/login`, {
          email,
          password,
          subdomain: effectiveDomain,
        });

        const { auth_token, user } = response.data;

        console.log("Login successful, storing:", {
          auth_token,
          subdomain: effectiveDomain,
        });

        localStorage.setItem("authToken", auth_token);
        localStorage.setItem("subdomain", effectiveDomain);
        localStorage.setItem("email", user.email);
        localStorage.setItem("role", user.role);
        localStorage.setItem("userId", user.id);

        const isVerified = await verifyAuth(auth_token, effectiveDomain);
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
