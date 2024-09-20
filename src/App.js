import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import AdminRegister from './components/AdminRegister';
import './App.css';

function PrivateRoute({ element: Component, loggedIn, ...rest }) {
  return loggedIn ? <Component {...rest} /> : <Navigate to="/admin/login" />;
}

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState('');

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={<Home email={email} loggedIn={loggedIn} setLoggedIn={setLoggedIn} />}
          />
          <Route
            path="/admin/login"
            element={<Login setLoggedIn={setLoggedIn} setEmail={setEmail} />}
          />
          <Route
            path="/admin/register"
            element={<AdminRegister />}
          />
          {/* Protect the admin dashboard */}
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute
                loggedIn={loggedIn}
                element={<div>Admin Dashboard</div>} // Replace with your dashboard component
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
