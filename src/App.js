import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './components/home';
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
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const profileImage = 'path_to_image'; // Replace with actual URL

  useEffect(() => {
    const token = localStorage.getItem('authToken'); // Changed to 'authToken'
    if (token) {
      setLoggedIn(true);
      setEmail(localStorage.getItem('email') || '');
      setRole(localStorage.getItem('role') || '');
    } else {
      setLoggedIn(false);
    }
  }, []);

  const handleLogout = () => {
    setLoggedIn(false);
    setEmail('');
    setRole('');
    localStorage.removeItem('authToken'); // Sync with 'authToken'
    localStorage.removeItem('subdomain');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
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
            <Route
              path="/"
              element={loggedIn ? <Navigate to="/dashboard" /> : <Home />}
            />
            <Route
              path="/login"
              element={
                loggedIn ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Login setLoggedIn={setLoggedIn} setEmail={setEmail} setRole={setRole} />
                )
              }
            />
            <Route path="/admin/register" element={<AdminRegister />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['admin', 'super_user', 'agent', 'teamlead', 'viewer']}>
                  <Dashboard email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/user/dashboard"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['agent', 'teamlead', 'viewer']}>
                  <Dashboard email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/incident"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['admin', 'super_user', 'agent']}>
                  <Incident email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-ticket"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['admin', 'super_user', 'agent']}>
                  <CreateTicketPage email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/incident-overview"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['admin', 'super_user', 'agent']}>
                  <IncidentOverview email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/knowledge-base"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['admin', 'super_user', 'agent', 'teamlead', 'viewer']}>
                  <KnowledgeBase email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-problems"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['admin', 'super_user', 'agent']}>
                  <CreateProblems email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/problems-overview"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['admin', 'super_user', 'agent']}>
                  <ProblemsOverview email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['admin', 'super_user']}>
                  <Settings email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['admin', 'super_user', 'agent', 'teamlead', 'viewer']}>
                  <Profile email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-user"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['admin', 'super_user']}>
                  <CreateUserForm email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <PrivateRoute loggedIn={loggedIn} role={role} allowedRoles={['admin', 'super_user']}>
                  <AdminDashboard email={email} role={role} />
                </PrivateRoute>
              }
            />
            <Route path="/home" element={<Home email={email} loggedIn={loggedIn} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;