import { useState, useEffect } from 'react';

const useAuth = () => {
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [subdomain, setSubdomain] = useState(localStorage.getItem('subdomain'));

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedSubdomain = localStorage.getItem('subdomain');
    setToken(storedToken);
    setSubdomain(storedSubdomain);
  }, []);

  const updateAuth = (newToken, newSubdomain) => {
    setToken(newToken);
    setSubdomain(newSubdomain);
    if (newToken) localStorage.setItem('authToken', newToken);
    else localStorage.removeItem('authToken');
    if (newSubdomain) localStorage.setItem('subdomain', newSubdomain);
    else localStorage.removeItem('subdomain');
  };

  return { token, subdomain, updateAuth };
};

export default useAuth;