import { createContext, useContext, useState } from "react";

const SubdomainContext = createContext();

export const SubdomainProvider = ({ children }) => {
  const [subdomain, setSubdomain] = useState(
    localStorage.getItem("subdomain") || ""
  );

  return (
    <SubdomainContext.Provider value={{ subdomain, setSubdomain }}>
      {children}
    </SubdomainContext.Provider>
  );
};

export const useSubdomain = () => useContext(SubdomainContext);
