import axios from "axios";

const createApiInstance = (token, subdomain) => {
  if (!token) {
    console.error("❌ No authentication token provided for API instance");
    throw new Error("Authentication token is required");
  }

  const isDev = process.env.NODE_ENV === "development";

  // Base URL configuration (always include /api/v1)
  const baseURL = isDev
    ? "http://localhost:3000/api/v1"
    : process.env.REACT_APP_API_BASE_URL ||
      "https://itsm-api-w8vr.onrender.com/api/v1";

  console.log("🌐 Creating API instance:", { baseURL, subdomain }); // No token in logs

  // Default headers
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Only include subdomain if it exists
  if (subdomain) {
    headers["X-Organization-Subdomain"] = subdomain;
  }

  const instance = axios.create({
    baseURL: baseURL.replace(/\/+$/, ""), // strip trailing slash
    headers,
    timeout: 60000,
  });

  // Response interceptor for unified error handling
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "An unexpected error occurred";

      switch (status) {
        case 401:
          console.error("🔒 Authentication error:", errorMessage);
          window.dispatchEvent(new CustomEvent("auth:unauthorized"));
          return Promise.reject(
            new Error("Session expired. Please log in again.")
          );
        case 403:
          console.error("⛔ Forbidden:", errorMessage);
          return Promise.reject(
            new Error("You do not have permission to access this resource.")
          );
        case 404:
          console.error("❓ Resource not found:", errorMessage);
          return Promise.reject(new Error("Requested resource not found."));
        case 500:
          console.error("💥 Server error:", errorMessage);
          return Promise.reject(
            new Error("Server error. Please try again later.")
          );
        default:
          console.error("⚠️ API error:", errorMessage);
          return Promise.reject(new Error(errorMessage));
      }
    }
  );

  return instance;
};

export default createApiInstance;
