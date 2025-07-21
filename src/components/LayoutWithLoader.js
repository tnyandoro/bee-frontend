import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import FullPageLoader from "./FullPageLoader";

const LayoutWithLoader = ({ children }) => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 500); // simulate load
    return () => clearTimeout(timeout);
  }, [location]);

  return <>{loading ? <FullPageLoader /> : children}</>;
};

export default LayoutWithLoader;
