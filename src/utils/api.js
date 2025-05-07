import axios from "axios";

const createApiInstance = (token, subdomain) => {
  // Validate token
  if (!token) {
    console.error("No authentication token provided for API instance");
    throw new Error("Authentication token is required");
  }

  // Use 'demo' subdomain in development if none provided
  const effectiveSubdomain =
    subdomain || (process.env.NODE_ENV === "development" ? "demo" : null);

  if (!effectiveSubdomain) {
    console.error("No subdomain provided for API instance");
    throw new Error("Organization subdomain is required");
  }

  const baseURL = `http://${effectiveSubdomain}.lvh.me:3000/api/v1`;
  const authHeader = `Bearer ${token}`;
  console.log("Creating API instance:", { baseURL, Authorization: authHeader });

  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
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
