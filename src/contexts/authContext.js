import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import Cookies from "js-cookie";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");

  // Defensive subdomain fallback
  const fallbackSubdomain =
    context.subdomain ||
    context.organization?.subdomain ||
    Cookies.get("subdomain") ||
    (process.env.NODE_ENV === "development" ? "demo" : null);

  return {
    ...context,
    subdomain: fallbackSubdomain,
  };
};

// Return the API base URL including the /api/v1 suffix
const getApiBaseUrl = () => {
  return (
    process.env.REACT_APP_API_BASE_URL ||
    (process.env.NODE_ENV === "development"
      ? "/api/v1"
      : "https://itsm-api.onrender.com/api/v1")
  );
};

// Sanitize input to prevent injection
const sanitizeInput = (input) => {
  if (!input) return null;
  // Allow alphanumeric, hyphens, and underscores; convert to lowercase
  return input.toLowerCase().replace(/[^a-z0-9-_]/g, "");
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
      const token = Cookies.get("authToken");
      const subdomain = sanitizeInput(Cookies.get("subdomain"));
      const email = Cookies.get("email");
      const role = Cookies.get("role");
      const userId = Cookies.get("userId");
      return { token, subdomain, email, role, userId };
    } catch (e) {
      console.warn("Cookie access error:", e);
      return {};
    }
  }, []);

  const logout = useCallback(() => {
    Cookies.remove("authToken", {
      path: "/",
      secure: true,
      sameSite: "strict",
    });
    Cookies.remove("subdomain", {
      path: "/",
      secure: true,
      sameSite: "strict",
    });
    Cookies.remove("email", { path: "/", secure: true, sameSite: "strict" });
    Cookies.remove("role", { path: "/", secure: true, sameSite: "strict" });
    Cookies.remove("userId", { path: "/", secure: true, sameSite: "strict" });
    setState({
      currentUser: null,
      organization: null,
      subdomain: null,
      token: null,
      loading: false,
      error: null,
    });
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const { token, subdomain } = getAuthTokens();
      if (!token || !subdomain) {
        throw new Error("No valid token or subdomain for refresh");
      }

      const apiBase = getApiBaseUrl();
      const response = await axios.post(
        `${apiBase}/refresh_token`,
        { subdomain },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const newToken = response.data.auth_token;
      Cookies.set("authToken", newToken, {
        secure: true,
        sameSite: "strict",
        expires: 1,
      });
      return newToken;
    } catch (error) {
      console.error("Token refresh failed:", error.message);
      logout();
      return null;
    }
  }, [logout, getAuthTokens]);

  const verifyAuth = useCallback(
    async (token, subdomain) => {
      const sanitizedSubdomain = sanitizeInput(subdomain);
      if (!token || !sanitizedSubdomain) {
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
          `${apiBase}/organizations/${sanitizedSubdomain}/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            withCredentials: true,
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

        // Save in cookies (not HttpOnly, as frontend needs access)
        Cookies.set("authToken", token, {
          secure: true,
          sameSite: "strict",
          expires: 1,
        });
        Cookies.set("subdomain", sanitizedSubdomain, {
          secure: true,
          sameSite: "strict",
          expires: 1,
        });
        Cookies.set("email", sanitizedUser.email, {
          secure: true,
          sameSite: "strict",
          expires: 1,
        });
        Cookies.set("role", sanitizedUser.role, {
          secure: true,
          sameSite: "strict",
          expires: 1,
        });
        Cookies.set("userId", sanitizedUser.id, {
          secure: true,
          sameSite: "strict",
          expires: 1,
        });

        setState({
          currentUser: sanitizedUser,
          organization,
          subdomain: sanitizedSubdomain,
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
            ? "Organization not found"
            : "Authentication failed";

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

  // On mount: try to initialize auth from cookies
  useEffect(() => {
    const { token, subdomain } = getAuthTokens();
    const effectiveSubdomain =
      sanitizeInput(subdomain) ||
      (process.env.NODE_ENV === "development" ? "demo" : null);

    if (token && effectiveSubdomain) {
      verifyAuth(token, effectiveSubdomain);
    } else {
      setState((prev) => ({
        currentUser: null,
        organization: null,
        subdomain: effectiveSubdomain,
        token: null,
        loading: false,
        error: null,
      }));
    }
  }, [getAuthTokens, verifyAuth]);

  // Handle unauthorized event
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [logout]);

  // Login function
  const login = useCallback(
    async (email, password, domain) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const sanitizedSubdomain =
          sanitizeInput(domain) ||
          (process.env.NODE_ENV === "development" ? "demo" : null);
        if (!sanitizedSubdomain) throw new Error("Subdomain is required");

        const apiBase = getApiBaseUrl();

        const response = await axios.post(
          `${apiBase}/login`,
          {
            email: sanitizeInput(email),
            password,
            subdomain: sanitizedSubdomain,
          },
          { withCredentials: true }
        );

        const { auth_token, user } = response.data;

        // Save tokens in cookies
        Cookies.set("authToken", auth_token, {
          secure: true,
          sameSite: "strict",
          expires: 1,
        });
        Cookies.set("subdomain", sanitizedSubdomain, {
          secure: true,
          sameSite: "strict",
          expires: 1,
        });
        Cookies.set("email", user.email, {
          secure: true,
          sameSite: "strict",
          expires: 1,
        });
        Cookies.set("role", user.role, {
          secure: true,
          sameSite: "strict",
          expires: 1,
        });
        Cookies.set("userId", user.id, {
          secure: true,
          sameSite: "strict",
          expires: 1,
        });

        // Verify after login
        const isVerified = await verifyAuth(auth_token, sanitizedSubdomain);
        if (!isVerified) throw new Error("Verification after login failed");

        return true;
      } catch (error) {
        const errorMessage =
          error.response?.status === 404
            ? "Organization not found"
            : error.response?.data?.message || "Login failed";

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
      refreshToken,
      isAdmin:
        state.currentUser?.role === "system_admin" ||
        state.currentUser?.role === "domain_admin",
      isSuperUser:
        state.currentUser?.role === "system_admin" ||
        state.currentUser?.role === "domain_admin",
      isAuthenticated: !!state.currentUser && !!state.token,
    }),
    [state, login, logout, refreshToken]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
