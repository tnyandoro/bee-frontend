import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import Home from './components/Home';
import UserLogin from './components/UserLogin';
import AdminLogin from './components/AdminLogin';
import AdminRegister from './components/AdminRegister';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import Incident from './components/Incident';
import CreateTicket from './components/CreateTicket';
import IncidentOverview from './components/IncidentOverview';
import KnowledgeBase from './components/KnowledgeBase';
import CreateProblems from './components/CreateProblems';
import ProblemsOverview from './components/ProblemsOverview';
import Settings from './components/Settings';
import Profile from './components/Profile';

function App() {
  const [loggedIn, setLoggedIn] = useState(false); // Manages login state
  const [email, setEmail] = useState(''); // Stores user email
  const [role, setRole] = useState(''); // Stores user role (Admin/User)
  const profileImage = 'path_to_image'; // Update with actual profile image URL

  const handleLogout = () => {
    setLoggedIn(false);
    setEmail('');
    setRole('');
    localStorage.removeItem('token'); // Remove the authentication token
  };

  return (
    <Router>
      <div className="App">
        {/* Show Navbar and Sidebar only if the user is logged in */}
        {loggedIn && (
          <>
            <Navbar
              logo="path_to_logo" // Replace with the actual logo path
              name={email} // Display email; modify as needed
              email={email}
              role={role}
              profileImage={profileImage}
              loggedIn={loggedIn}
              onLogout={handleLogout} // Pass logout function to Navbar
            />
            <Sidebar isLoggedIn={loggedIn} /> {/* Sidebar component */}
          </>
        )}

        {/* Main Content Area with dynamic padding when Sidebar is visible */}
        <div className={loggedIn ? 'pl-64' : ''}>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <Home
                  email={email}
                  loggedIn={loggedIn}
                  setLoggedIn={setLoggedIn}
                  setEmail={setEmail}
                  setRole={setRole}
                />
              }
            />
            <Route
              path="/login"
              element={
                <UserLogin
                  setLoggedIn={setLoggedIn}
                  setEmail={setEmail}
                  setRole={setRole}
                />
              }
            />
            <Route
              path="/admin/login"
              element={
                <AdminLogin
                  setLoggedIn={setLoggedIn}
                  setEmail={setEmail}
                  setRole={setRole}
                />
              }
            />
            <Route path="/admin/register" element={<AdminRegister />} />

            {/* Protected Routes (Accessible only when logged in) */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['Admin']}>
                  <Dashboard email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/incident"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['Admin']}>
                  <Incident email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-ticket"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['Admin']}>
                  <CreateTicket email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/incident-overview"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['Admin']}>
                  <IncidentOverview email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/knowledge-base"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['Admin']}>
                  <KnowledgeBase email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-problems"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['Admin']}>
                  <CreateProblems email={email} role={role} />
                </PrivateRoute>
              }
            />
              <Route
              path="/problems-overview"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['Admin']}>
                  <ProblemsOverview email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['Admin']}>
                  <Settings email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['Admin']}>
                  <Profile email={email} role={role} />
                </PrivateRoute>
              }
            />

            {/* Redirect unknown paths to the home page */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
