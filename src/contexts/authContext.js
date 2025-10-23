import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import createApiInstance from "../utils/api";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const BASE_URL = process.env.REACT_APP_API_URL || "http://lvh.me:3000";

  const [currentUser, setCurrentUser] = useState(() =>
    JSON.parse(localStorage.getItem("currentUser") || "null")
  );
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [refreshToken, setRefreshToken] = useState(() =>
    localStorage.getItem("refresh_token")
  );
  const [subdomain, setSubdomain] = useState(() =>
    localStorage.getItem("subdomain")
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  // 🔹 Decode and check token expiration
  const decodeToken = (tokenToCheck) => {
    if (!tokenToCheck) return null;
    try {
      return JSON.parse(atob(tokenToCheck.split(".")[1]));
    } catch {
      return null;
    }
  };

  const isTokenExpired = useCallback((tokenToCheck) => {
    const payload = decodeToken(tokenToCheck);
    if (!payload?.exp) return true;
    return Date.now() >= payload.exp * 1000;
  }, []);

  const getTimeUntilExpiry = useCallback((tokenToCheck) => {
    const payload = decodeToken(tokenToCheck);
    if (!payload?.exp) return 0;
    return payload.exp * 1000 - Date.now();
  }, []);

  // 🔹 Refresh access token
  const refreshAccessToken = useCallback(async () => {
    if (isRefreshing) return false;
    const storedRefreshToken = localStorage.getItem("refresh_token");

    if (!storedRefreshToken || isTokenExpired(storedRefreshToken)) {
      console.warn("Refresh token missing or expired. Logging out...");
      logout();
      return false;
    }

    setIsRefreshing(true);
    try {
      const response = await axios.post(`${BASE_URL}/api/v1/refresh`, {
        refresh_token: storedRefreshToken,
      });

      const newToken = response.data.auth_token;
      if (newToken) {
        localStorage.setItem("token", newToken);
        setToken(newToken);
        console.info("Access token refreshed successfully");
        return true;
      }

      logout();
      return false;
    } catch (err) {
      console.error("Token refresh failed:", err);
      logout();
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [BASE_URL, isRefreshing, isTokenExpired]);

  // 🔹 Auto-refresh before expiry
  useEffect(() => {
    if (!token || !refreshToken) {
      setLoading(false);
      return;
    }

    const handleTokenCycle = async () => {
      const timeUntilExpiry = getTimeUntilExpiry(token);

      if (timeUntilExpiry <= 0) {
        console.warn("Access token expired, logging out...");
        logout();
      } else if (timeUntilExpiry < 60 * 60 * 1000) {
        console.log("Access token expires soon, refreshing...");
        await refreshAccessToken();
      }
    };

    handleTokenCycle(); // Run once immediately
    intervalRef.current = setInterval(handleTokenCycle, 5 * 60 * 1000);

    setLoading(false);
    return () => clearInterval(intervalRef.current);
  }, [token, refreshToken, getTimeUntilExpiry, refreshAccessToken]);

  // 🔹 Login
  const login = async (email, password, subdomainParam) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/v1/login`, {
        email: email.trim(),
        password,
        subdomain: subdomainParam.trim(),
      });

      const {
        auth_token,
        refresh_token: newRefreshToken,
        user,
        subdomain: returnedSubdomain,
      } = response.data;

      if (!auth_token || !user) throw new Error("Invalid server response");

      localStorage.setItem("token", auth_token);
      localStorage.setItem("refresh_token", newRefreshToken);
      localStorage.setItem("currentUser", JSON.stringify(user));
      localStorage.setItem("subdomain", returnedSubdomain || subdomainParam);

      setToken(auth_token);
      setRefreshToken(newRefreshToken);
      setCurrentUser(user);
      setSubdomain(returnedSubdomain || subdomainParam);

      console.info("Login successful ✅");
      return user;
    } catch (err) {
      console.error("Login failed:", err);
      throw new Error(
        err.response?.data?.error || "Login failed. Please check credentials."
      );
    }
  };

  // 🔹 Logout
  const logout = useCallback(() => {
    console.log("Logging out user...");
    clearInterval(intervalRef.current);
    ["token", "refresh_token", "currentUser", "subdomain"].forEach((key) =>
      localStorage.removeItem(key)
    );
    setToken(null);
    setRefreshToken(null);
    setCurrentUser(null);
    setSubdomain(null);
  }, []);

  // 🔹 Multi-tab logout sync
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "token" && !e.newValue) logout();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [logout]);

  // 🔹 Expose authorized API client
  const getAuthorizedApi = useCallback(() => {
    if (!token) throw new Error("No active token found.");
    return createApiInstance(token, subdomain);
  }, [token, subdomain]);

  const value = {
    currentUser,
    token,
    refreshToken,
    subdomain,
    login,
    logout,
    refreshAccessToken,
    getAuthorizedApi,
    loading,
    isAuthenticated: !!token && !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
