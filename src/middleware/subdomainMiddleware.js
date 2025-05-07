import axios from "axios";

export const subdomainMiddleware = (store) => (next) => (action) => {
  const state = store.getState();
  const subdomain = state.auth.subdomain || localStorage.getItem("subdomain");

  if (subdomain) {
    axios.defaults.baseURL = `http://${subdomain}.lvh.me:3000/api/v1`;
    axios.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${localStorage.getItem("authToken")}`;
  }

  return next(action);
};
