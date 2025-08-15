import axios from "axios";

const getBaseUrl = () => {
  const isDev = process.env.NODE_ENV === "development";

  let baseURL = isDev
    ? "/api/v1" // Local proxy in dev
    : process.env.REACT_APP_API_BASE_URL ||
      "https://itsmapi.greensoftsolutions.net/api/v1";

  // Remove trailing slash
  return baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;
};

const createApiInstance = (token = null, subdomain = null) => {
  const baseURL = getBaseUrl();

  console.log("Creating API instance:", { baseURL, subdomain }); // safe log

  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(subdomain && { "X-Organization-Subdomain": subdomain }),
    },
    timeout: 60000,
    withCredentials: true,
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
