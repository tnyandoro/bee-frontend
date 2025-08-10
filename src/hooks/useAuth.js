import { useState, useEffect, useCallback } from "react";

const useAuth = () => {
  const [token, setToken] = useState(localStorage.getItem("authToken") || "");
  const [subdomain, setSubdomain] = useState(
    localStorage.getItem("subdomain") || ""
  );
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true); // Full auth loading state
  const [error, setError] = useState(null);

  const API_BASE =
    process.env.REACT_APP_API_BASE_URL || "https://itsm-api.onrender.com";

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
      const response = await fetch(`${API_BASE}/api/v1/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          subdomain: loginSubdomain,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      const authToken = data.auth_token;
      const orgSubdomain = data.subdomain || loginSubdomain;

      updateAuth(authToken, orgSubdomain);

      // Fetch profile and permissions in parallel
      const [profileData, permissionsData] = await Promise.all([
        fetchProfile(authToken, orgSubdomain),
        fetchPermissions(authToken, orgSubdomain),
      ]);

      // Optional: Enforce admin access here
      if (!permissionsData.can_access_admin_dashboard) {
        throw new Error("User does not have admin privileges");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
      updateAuth(null, null);
      setUser(null);
      setPermissions({});
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = useCallback(
    async (authToken, profileSubdomain) => {
      if (!authToken || !profileSubdomain) return null;

      try {
        const response = await fetch(
          `${API_BASE}/api/v1/organizations/${profileSubdomain}/profile`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error("Unauthorized");
          }
          throw new Error(`Profile fetch failed: ${response.status}`);
        }

        const data = await response.json();
        const userData = {
          ...data.user,
          role: data.user.role || "viewer",
          is_admin: data.user.is_admin || false,
          organization: data.organization,
        };

        setUser(userData);
        return userData;
      } catch (error) {
        console.error("Profile fetch error:", error);
        throw error;
      }
    },
    [API_BASE]
  );

  const fetchPermissions = useCallback(
    async (authToken, subdomain) => {
      if (!authToken || !subdomain) return null;

      try {
        const response = await fetch(`${API_BASE}/api/v1/permissions`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error("Unauthorized");
          }
          throw new Error(`Permissions fetch failed: ${response.status}`);
        }

        const data = await response.json();

        // Ensure data.data if your API wraps response
        const permissionsData = data.data || data;

        setPermissions(permissionsData);
        return permissionsData;
      } catch (error) {
        console.error("Permissions fetch error:", error);
        setPermissions({});
        throw error;
      }
    },
    [API_BASE]
  );

  const logout = async () => {
    try {
      if (token && subdomain) {
        await fetch(`${API_BASE}/api/v1/logout`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Logout error (non-critical):", error);
    } finally {
      updateAuth(null, null);
      setUser(null);
      setPermissions({});
      setError(null);
    }
  };

  const verifyAdminRole = () => {
    return permissions.can_access_admin_dashboard === true;
  };

  // Initialize on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (token && subdomain) {
        try {
          await Promise.all([
            fetchProfile(token, subdomain),
            fetchPermissions(token, subdomain),
          ]);
        } catch (error) {
          console.error("Initialization error:", error);
          updateAuth(null, null);
          setUser(null);
          setPermissions({});
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token, subdomain, fetchProfile, fetchPermissions, updateAuth]);

  return {
    user,
    permissions,
    token,
    subdomain,
    loading,
    error,
    isAdmin: permissions.can_access_admin_dashboard === true,
    login,
    logout,
    updateAuth,
    verifyAdminRole,
  };
};

export default useAuth;
