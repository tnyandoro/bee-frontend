// src/utils/apiClient.js
import axios from "axios";

// Key names for localStorage items
const AUTH_TOKEN_KEY = "authToken";
const ORG_SUBDOMAIN_KEY = "orgSubdomain";

const createApiInstance = (token, subdomain) => {
  // Safely get items from localStorage
  const getLocalStorageItem = (key) => {
    try {
      if (typeof window !== "undefined") {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.error("Failed to access localStorage:", error);
    }
    return null;
  };

  // If token is not provided, try to get from localStorage
  let authToken = token;
  if (!authToken) {
    authToken = getLocalStorageItem(AUTH_TOKEN_KEY);
  }

  // If subdomain is not provided, try to get from localStorage
  let orgSubdomain = subdomain;
  if (!orgSubdomain) {
    orgSubdomain = getLocalStorageItem(ORG_SUBDOMAIN_KEY);
  }

  // Fallback for subdomain in development
  if (!orgSubdomain) {
    const fallback = process.env.NODE_ENV === "development" ? "demo" : null;

    if (!fallback) {
      throw new Error(
        "Organization subdomain is required and no fallback available."
      );
    }

    console.warn(`⚠️ No subdomain provided. Falling back to '${fallback}'`);
    orgSubdomain = fallback;
  }

  const baseURL =
    process.env.REACT_APP_API_BASE_URL ||
    `http://${orgSubdomain}.lvh.me:3000/api/v1`;

  if (!authToken) {
    console.warn("⚠️ No token provided — API requests may fail with 401.");
  }

  return axios.create({
    baseURL,
    headers: {
      Authorization: authToken ? `Bearer ${authToken}` : "",
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });
};

export default createApiInstance;
