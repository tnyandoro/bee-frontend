import axios from "axios";

/**
 * Creates a configured Axios instance for a given subdomain and token.
 *
 * @param {string} token - The user's auth token (Bearer).
 * @param {string} subdomain - The organization's subdomain.
 * @returns {AxiosInstance}
 */
const createApiClient = (token, subdomain) => {
  if (!subdomain) {
    console.error("❌ No subdomain provided to API client");
    throw new Error("Organization subdomain is required");
  }

  return axios.create({
    baseURL: `https://itsm-api.onrender.com/api/v1/organizations/${subdomain}`,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export default createApiClient;
