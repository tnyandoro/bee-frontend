import axios from "axios";

const createApiInstance = (token, subdomain) => {
  if (!token) {
    console.error("No authentication token provided for API instance");
    throw new Error("Authentication token is required");
  }

  const isDev = process.env.NODE_ENV === "development";

  const effectiveSubdomain = subdomain || (isDev ? "demo" : null);
  if (!effectiveSubdomain) {
    console.error("No subdomain provided for API instance");
    throw new Error("Organization subdomain is required");
  }

  // Determine the base URL
  const baseURL =
    process.env.REACT_APP_API_BASE_URL ||
    (isDev
      ? `http://${effectiveSubdomain}.lvh.me:3000/api/v1`
      : `https://${effectiveSubdomain}.itsm-api.onrender.com/api/v1`); // <-- replace with actual production pattern

  const authHeader = `Bearer ${token}`;
  console.log("Creating API instance:", { baseURL, Authorization: authHeader });

  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
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
      } else {
        console.error("API error:", errorMessage || "Unknown error");
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export default createApiInstance;
