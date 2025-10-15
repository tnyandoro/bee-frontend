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

  const fallbackSubdomain =
    context.subdomain ||
    context.organization?.subdomain ||
    Cookies.get("subdomain") ||
    (process.env.NODE_ENV === "development" ? "demo" : null);

  return { ...context, subdomain: fallbackSubdomain };
};

const getApiBaseUrl = () => {
  let base =
    process.env.REACT_APP_API_BASE_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://lvh.me:3000/api/v1"
      : "https://connectfix.onrender.com/api/v1");
  if (!base.endsWith("/api/v1")) base = `${base}/api/v1`;
  return base;
};

const sanitizeInput = (input, isEmail = false) => {
  if (!input || typeof input !== "string") return "";
  const value = input.toLowerCase().trim();
  if (isEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? value : "";
  }
  return value.replace(/[^a-z0-9-_]/g, "");
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

  const getAuthTokens = useCallback(
    () => ({
      token: Cookies.get("authToken") || "",
      subdomain: sanitizeInput(Cookies.get("subdomain") || ""),
      email: Cookies.get("email") || "",
      role: Cookies.get("role") || "",
      userId: Cookies.get("userId") || "",
    }),
    []
  );

  // FIXED: Define logout outside of verifyAuth dependencies
  const logout = useCallback(() => {
    console.log("Logging out user");
    ["authToken", "subdomain", "email", "role", "userId"].forEach((name) =>
      Cookies.remove(name, { path: "/", secure: true, sameSite: "strict" })
    );
    localStorage.removeItem("authToken");
    localStorage.removeItem("subdomain");
    localStorage.removeItem("role");

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
      const sanitizedSubdomain = sanitizeInput(subdomain);
      if (!sanitizedSubdomain) {
        setState((prev) => ({
          ...prev,
          error: "Organization subdomain is required",
          loading: false,
        }));
        return false;
      }

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const apiBase = getApiBaseUrl();

        console.log(
          `Verifying auth: ${apiBase}/organizations/${sanitizedSubdomain}/profile`
        );
        console.log(`Token present: ${!!token}`);

        const response = await axios.get(
          `${apiBase}/organizations/${sanitizedSubdomain}/profile`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : undefined,
            },
            withCredentials: true,
          }
        );

        const user = response.data.current_user || null;
        const organization = response.data.organization || null;

        console.log("Auth verification successful:", {
          user: !!user,
          organization: !!organization,
        });

        const sanitizedUser = user
          ? {
              id: user.id,
              email: user.email,
              role: user.role,
              name: user.name,
              username: user.username,
              team_id: user.team_id,
              department_id: user.department_id,
            }
          : null;

        if (sanitizedUser) {
          ["authToken", "subdomain", "email", "role", "userId"].forEach(
            (name) => {
              const value = {
                authToken: token,
                subdomain: sanitizedSubdomain,
                email: sanitizedUser.email,
                role: sanitizedUser.role,
                userId: sanitizedUser.id,
              }[name];
              Cookies.set(name, value, {
                secure: true,
                sameSite: "strict",
                expires: 1,
              });
            }
          );
        }

        setState({
          currentUser: sanitizedUser,
          organization,
          subdomain: sanitizedSubdomain,
          token: token || null,
          loading: false,
          error: null,
        });

        return true;
      } catch (error) {
        console.error("Auth verification failed:", error);
        const status = error.response?.status;
        const message =
          status === 401
            ? "Session expired"
            : status === 404
            ? "Organization not found"
            : "Authentication failed";

        setState((prev) => ({ ...prev, error: message, loading: false }));

        // FIXED: Don't call logout directly, dispatch event instead
        if (status === 401) {
          window.dispatchEvent(new CustomEvent("auth:unauthorized"));
        }
        return false;
      }
    },
    [] // FIXED: Removed logout from dependencies to prevent circular calls
  );

  const login = useCallback(
    async (email, password, domain) => {
      const sanitizedEmail = sanitizeInput(email, true);
      const sanitizedSubdomain =
        sanitizeInput(domain) ||
        (process.env.NODE_ENV === "development" ? "demo" : "");
      if (!sanitizedEmail) throw new Error("Valid email is required");
      if (!sanitizedSubdomain) throw new Error("Subdomain is required");

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const apiBase = getApiBaseUrl();
        console.log(
          `Login attempt: ${apiBase}/login for ${sanitizedEmail}@${sanitizedSubdomain}`
        );

        const response = await axios.post(
          `${apiBase}/login`,
          {
            email: sanitizedEmail,
            password,
            subdomain: sanitizedSubdomain,
          },
          { withCredentials: true }
        );

        const { auth_token } = response.data;
        console.log("Login successful, token received");

        await verifyAuth(auth_token, sanitizedSubdomain);

        return true;
      } catch (error) {
        console.error("Login failed:", error);
        const message = error.response?.data?.message || "Login failed";
        setState((prev) => ({ ...prev, error: message, loading: false }));
        throw new Error(message);
      }
    },
    [verifyAuth]
  );

  // FIXED: Only run auth check once on mount, with proper cleanup
  useEffect(() => {
    console.log("AuthProvider initializing...");
    const { token, subdomain } = getAuthTokens();
    if (token && subdomain) {
      console.log("Found existing tokens, verifying auth...");
      verifyAuth(token, subdomain);
    } else {
      console.log("No existing tokens found");
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []); // Empty dependency array - only run once

  // Handle unauthorized events
  useEffect(() => {
    const handleUnauthorized = () => {
      console.log("Handling unauthorized event");
      logout();
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [logout]);

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
