import { useState, useEffect, useCallback } from "react";

const useAuth = () => {
  const [token, setToken] = useState(localStorage.getItem("authToken") || null);
  const [subdomain, setSubdomain] = useState(
    localStorage.getItem("subdomain") || null
  );
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE =
    process.env.REACT_APP_API_BASE_URL || "https://itsm-api.onrender.com";

  const updateAuth = useCallback((newToken, newSubdomain) => {
    const cleanToken = newToken || null;
    const cleanSubdomain = newSubdomain || null;
    setToken(cleanToken);
    setSubdomain(cleanSubdomain);

    if (cleanToken) localStorage.setItem("authToken", cleanToken);
    else localStorage.removeItem("authToken");

    if (cleanSubdomain) localStorage.setItem("subdomain", cleanSubdomain);
    else localStorage.removeItem("subdomain");
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
        body: JSON.stringify({ email, password, subdomain: loginSubdomain }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed");

      const authToken = data.auth_token;
      const orgSubdomain = data.subdomain || loginSubdomain;
      updateAuth(authToken, orgSubdomain);

      const [profileData, permissionsData] = await Promise.all([
        fetchProfile(authToken, orgSubdomain),
        fetchPermissions(authToken, orgSubdomain),
      ]);

      if (!permissionsData?.can_access_admin_dashboard) {
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
          `${API_BASE}/api/v1/organizations/${profileSubdomain}/profile?subdomain=${profileSubdomain}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          if ([401, 403].includes(response.status))
            throw new Error("Unauthorized");
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
    async (authToken, permSubdomain) => {
      if (!authToken || !permSubdomain) return null;

      try {
        const response = await fetch(
          `${API_BASE}/api/v1/permissions?subdomain=${permSubdomain}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          if ([401, 403].includes(response.status))
            throw new Error("Unauthorized");
          throw new Error(`Permissions fetch failed: ${response.status}`);
        }

        const data = await response.json();
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
        await fetch(`${API_BASE}/api/v1/logout?subdomain=${subdomain}`, {
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
          if (error.message === "Unauthorized") {
            updateAuth(null, null);
            setUser(null);
            setPermissions({});
          }
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
    verifyAdminRole: () => permissions.can_access_admin_dashboard === true,
  };
};

export default useAuth;
