import axios from "axios";

const createApiInstance = (token, subdomain) => {
  if (!token) {
    console.error("No authentication token provided for API instance");
    throw new Error("Authentication token is required");
  }

  const isDev = process.env.NODE_ENV === "development";

  // Get base URL from env or fallback to default
  let baseURL =
    process.env.REACT_APP_API_BASE_URL ||
    (isDev
      ? "http://itsm-api.lvh.me:3000/api/v1"
      : "https://itsm-api.onrender.com");

  // Remove trailing '/api/v1' if present to avoid double versioning
  if (baseURL.endsWith("/api/v1")) {
    // Keep it, we want /api/v1 as part of baseURL
  } else if (baseURL.endsWith("/api/v1/")) {
    baseURL = baseURL.slice(0, -1); // remove trailing slash
  }

  console.log("Creating API instance:", {
    baseURL,
    subdomain,
    Authorization: `Bearer ${token}`,
  });

  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Organization-Subdomain": subdomain,
    },
    timeout: 60000,
    withCredentials: true,
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const errorMessage = error.response?.data?.error || error.message;

      switch (error.response?.status) {
        case 401:
          console.error(
            "Authentication error:",
            errorMessage || "Unauthorized"
          );
          break;
        case 404:
          console.error(
            "Resource not found:",
            errorMessage || "Organization or endpoint not found"
          );
          break;
        case 500:
          console.error(
            "Server error:",
            errorMessage || "Internal server error"
          );
          break;
        default:
          console.error("API error:", errorMessage || "Unknown error");
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export default createApiInstance;
