import axios from "axios";

const createApiInstance = (token, subdomain) => {
  if (!token) {
    console.error("No authentication token provided for API instance");
    throw new Error("Authentication token is required");
  }

  const isDev = process.env.NODE_ENV === "development";

  // Use HTTPS in production; relative URL in development for flexibility
  let baseURL = isDev
    ? "/api/v1" // Relative path for dev proxy
    : process.env.REACT_APP_API_BASE_URL ||
      "itsmapi.greensoftsolutions.net/api/v1";

  // Ensure no trailing slash
  if (baseURL.endsWith("/")) {
    baseURL = baseURL.slice(0, -1);
  }

  console.log("Creating API instance:", { baseURL, subdomain }); // No token in logs

  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Organization-Subdomain": subdomain,
    },
    timeout: 60000,
    withCredentials: true, // Keep for CORS with credentials, verify backend CORS
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "An unexpected error occurred";

      switch (error.response?.status) {
        case 401:
          console.error("Authentication error:", errorMessage);
          // Trigger logout or redirect to login in auth context
          window.dispatchEvent(new CustomEvent("auth:unauthorized"));
          return Promise.reject(
            new Error("Session expired. Please log in again.")
          );
        case 403:
          console.error("Forbidden:", errorMessage);
          return Promise.reject(
            new Error("You do not have permission to access this resource.")
          );
        case 404:
          console.error("Resource not found:", errorMessage);
          return Promise.reject(new Error("Requested resource not found."));
        case 500:
          console.error("Server error:", errorMessage);
          return Promise.reject(
            new Error("Server error. Please try again later.")
          );
        default:
          console.error("API error:", errorMessage);
          return Promise.reject(new Error(errorMessage));
      }
    }
  );

  return instance;
};

export default createApiInstance;
// fix
