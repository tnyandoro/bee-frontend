// src/index.js
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./contexts/authContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FullPageLoader from "./components/FullPageLoader";

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);

function RootApp() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading state for UX
    const timeout = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <React.StrictMode>
      <AuthProvider>
        {loading ? (
          <FullPageLoader />
        ) : (
          <>
            <App />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar
              closeOnClick
              pauseOnHover
              draggable
              theme="light"
            />
          </>
        )}
      </AuthProvider>
    </React.StrictMode>
  );
}

root.render(<RootApp />);
