import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import AdminRegister from './components/AdminRegister';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import Incident from './components/Incident';
import CreateTicketPage from './components/CreateTicketPage';
import IncidentOverview from './components/IncidentOverview';
import KnowledgeBase from './components/KnowledgeBase';
import CreateProblems from './components/CreateProblems';
import ProblemsOverview from './components/ProblemsOverview';
import Settings from './components/Settings';
import Profile from './components/Profile';
import CreateUserForm from './components/CreateUserForm';
import AdminDashboard from './components/AdminDashboard'; // Import AdminDashboard

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const profileImage = 'path_to_image'; // Replace with actual profile image URL

  const handleLogout = () => {
    setLoggedIn(false);
    setEmail('');
    setRole('');
    localStorage.removeItem('token');
  };

  return (
    <Router>
      <div className="App">
        {loggedIn && (
          <>
            <Navbar
              logo="path_to_logo"
              name={email}
              email={email}
              role={role}
              profileImage={profileImage}
              loggedIn={loggedIn}
              onLogout={handleLogout}
            />
            <Sidebar isLoggedIn={loggedIn} />
          </>
        )}

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
                <Login
                  setLoggedIn={setLoggedIn}
                  setEmail={setEmail}
                  setRole={setRole}
                />
              }
            />
            <Route path="/admin/register" element={<AdminRegister />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['Admin', 'User']}>
                  <Dashboard email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/incident"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['Admin', 'User']}>
                  <Incident email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-ticket"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['Admin', 'User']}>
                  <CreateTicketPage email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/incident-overview"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['Admin', 'User']}>
                  <IncidentOverview email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/knowledge-base"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['Admin', 'User']}>
                  <KnowledgeBase email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-problems"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['Admin', 'User']}>
                  <CreateProblems email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/problems-overview"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['Admin', 'User']}>
                  <ProblemsOverview email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['Admin', 'User']}>
                  <Settings email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['Admin', 'User']}>
                  <Profile email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-user"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['Admin']}>
                  <CreateUserForm email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['Admin']}>
                  <AdminDashboard email={email} role={role} />
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