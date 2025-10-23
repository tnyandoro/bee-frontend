import createApiInstance from "../utils/api";
import { useAuth } from "../contexts/authContext";

export const useApiClient = () => {
  const { token, subdomain } = useAuth();
  return createApiInstance(token, subdomain);
};
