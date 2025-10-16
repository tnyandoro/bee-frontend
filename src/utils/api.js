import axios from "axios";

const createApiInstance = (token, subdomain) => {
  if (!token) {
    console.error("No authentication token provided for API instance");
    throw new Error("Authentication token is required");
  }

  if (!subdomain) {
    console.warn("No subdomain provided. API requests may fail.");
  }

  const isDev = process.env.NODE_ENV === "development";

  // FIXED: Base URL without /api/v1 duplication
  const baseURL = isDev
    ? "http://localhost:3000/api/v1"
    : `${
        process.env.REACT_APP_API_BASE_URL || "https://connectfix.onrender.com"
      }/api/v1`;

  console.log("Creating API instance:", { baseURL, subdomain });

  const instance = axios.create({
    baseURL: baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL,
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
      const status = error.response?.status;
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "An unexpected error occurred";

      switch (status) {
        case 401:
          console.error("Authentication error:", errorMessage);
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
