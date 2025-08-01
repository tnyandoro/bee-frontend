// src/utils/api.js
import axios from "axios";

const createApiInstance = (token, subdomain) => {
  if (!token) {
    console.error("No authentication token provided for API instance");
    throw new Error("Authentication token is required");
  }

  const isDev = process.env.NODE_ENV === "development";

  // Validate subdomain
  if (!subdomain) {
    console.error("No subdomain provided for API instance");
    throw new Error("Organization subdomain is required");
  }

  // Use fixed domain, pass subdomain in routes
  const baseURL =
    process.env.REACT_APP_API_BASE_URL ||
    (isDev
      ? `http://localhost:3000/api/v1` // Dev: localhost
      : `https://itsm-api.onrender.com/api/v1`); // Prod: fixed domain

  const authHeader = `Bearer ${token}`;
  console.log("Creating API instance:", { baseURL, Authorization: authHeader });

  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authHeader,
    },
    timeout: 15000,
    withCredentials: false, // Not needed for Bearer tokens
  });

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const errorMessage = error.response?.data?.error || error.message;

      if (error.response?.status === 401) {
        console.error("Authentication error:", errorMessage || "Unauthorized");
      } else if (error.response?.status === 404) {
        console.error(
          "Resource not found:",
          errorMessage || "Endpoint or organization not found"
        );
      } else {
        console.error("API error:", {
          message: errorMessage,
          status: error.response?.status,
          url: error.config?.url,
        });
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export default createApiInstance;
