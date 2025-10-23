import axios from "axios";

const createApiInstance = (token, subdomain) => {
  if (!token) throw new Error("Authentication token required");

  const baseURL = process.env.REACT_APP_API_BASE_URL
    ? `${process.env.REACT_APP_API_BASE_URL}/api/v1`
    : process.env.NODE_ENV === "development"
    ? "http://localhost:3000/api/v1"
    : "https://connectfix.onrender.com/api/v1";

  const instance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Organization-Subdomain": subdomain || "",
    },
    timeout: 60000,
    withCredentials: true,
  });

  instance.interceptors.response.use(
    (res) => res,
    (error) => {
      const status = error.response?.status;
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Unexpected error occurred";

      if (status === 401) {
        console.warn("401 Unauthorized – dispatching logout event");
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }

      return Promise.reject(new Error(message));
    }
  );

  return instance;
};

export default createApiInstance;
