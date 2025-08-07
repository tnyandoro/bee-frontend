import axios from "axios";

const createApiInstance = (token, subdomain) => {
  if (!token) {
    console.error("No authentication token provided for API instance");
    throw new Error("Authentication token is required");
  }

  const isDev = process.env.NODE_ENV === "development";

  // Determine the base URL
  let baseURL;
  if (process.env.REACT_APP_API_BASE_URL) {
    baseURL = process.env.REACT_APP_API_BASE_URL;
  } else if (isDev) {
    baseURL = "http://itsm-api.lvh.me:3000/api/v1";
  } else {
    baseURL = "https://itsm-api.onrender.com/api/v1";
  }

  const authHeader = `Bearer ${token}`;
  console.log("Creating API instance:", {
    baseURL,
    subdomain,
    Authorization: authHeader,
  });

  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
      "X-Organization-Subdomain": subdomain, // Add organization subdomain header
    },
    timeout: 15000,
    withCredentials: true,
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const errorMessage = error.response?.data?.error || error.message;

      if (error.response?.status === 401) {
        console.error("Authentication error:", errorMessage || "Unauthorized");
      } else if (error.response?.status === 404) {
        console.error(
          "Resource not found:",
          errorMessage || "Organization or endpoint not found"
        );
      } else if (error.response?.status === 500) {
        console.error("Server error:", errorMessage || "Internal server error");
      } else {
        console.error("API error:", errorMessage || "Unknown error");
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export default createApiInstance;
