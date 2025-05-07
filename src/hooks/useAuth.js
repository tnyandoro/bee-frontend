import { useState, useEffect, useCallback } from "react";

const useAuth = () => {
  const [token, setToken] = useState(localStorage.getItem("authToken") || "");
  const [subdomain, setSubdomain] = useState(
    localStorage.getItem("subdomain") || ""
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_BASE_URL;

  const updateAuth = useCallback((newToken, newSubdomain) => {
    setToken(newToken);
    setSubdomain(newSubdomain);
    localStorage.setItem("authToken", newToken || "");
    localStorage.setItem("subdomain", newSubdomain || "");
  }, []);

  const login = async (email, password, loginSubdomain) => {
    setLoading(true);
    setError(null);

    try {
      const baseURL = API_BASE.replace("://", `://${loginSubdomain}.`);
      const response = await fetch(`${baseURL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      updateAuth(
        data.auth_token,
        data.organization?.subdomain || loginSubdomain
      );

      // Get fresh user data from profile fetch
      const profileData = await fetchProfile(
        data.auth_token,
        data.organization?.subdomain || loginSubdomain
      );

      // Check admin status from fresh profile data
      if (!profileData?.is_admin) {
        throw new Error("User does not have admin privileges");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
      updateAuth(null, null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = useCallback(
    async (authToken, profileSubdomain) => {
      try {
        const baseURL = API_BASE.replace("://", `://${profileSubdomain}.`);
        const response = await fetch(
          `${baseURL}/organizations/${profileSubdomain}/profile`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        if (!response.ok) throw new Error("Profile fetch failed");

        const data = await response.json();
        const userData = {
          ...data.user,
          role: data.user.role || "viewer",
          is_admin: data.user.is_admin || false,
        };

        setUser(userData);
        return userData; // Return the profile data
      } catch (error) {
        console.error("Profile fetch error:", error);
        setError(error.message);
        updateAuth(null, null);
        throw error;
      }
    },
    [API_BASE, updateAuth]
  );

  // Simplified admin verification
  const verifyAdminRole = async () => {
    return !!user?.is_admin;
  };

  const logout = async () => {
    try {
      if (token && subdomain) {
        const baseURL = API_BASE.replace("://", `://${subdomain}.`);
        await fetch(`${baseURL}/logout`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      updateAuth(null, null);
      setUser(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (token && subdomain) {
        try {
          await fetchProfile(token, subdomain);
        } catch (error) {
          console.error("Initialization error:", error);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [fetchProfile, token, subdomain]);

  return {
    user,
    token,
    subdomain,
    loading,
    error,
    isAdmin: user?.is_admin || false,
    login,
    logout,
    updateAuth,
    verifyAdminRole,
  };
};

export default useAuth;
