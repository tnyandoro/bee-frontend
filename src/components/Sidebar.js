import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ isLoggedIn }) => {
  const links = [
    { id: 1, name: 'Dashboard', path: '/dashboard' },
    { id: 2, name: 'Create Ticket', path: '/create-ticket' },
    { id: 3, name: 'Incident Overview', path: '/incident-overview' },
    { id: 4, name: 'Knowledge Base', path: '/knowledge-base' },
    { id: 5, name: 'Create Problems', path: '/create-problems' },
    { id: 6, name: 'Problems Overview', path: '/problems-overview' },
    { id: 7, name: 'Settings', path: '/settings' },
    { id: 8, name: 'Profile', path: '/profile' },
  ];

  if (!isLoggedIn) return null;

  return (
    <div className="fixed top-16 left-0 h-full bg-white shadow-lg w-64 overflow-y-auto z-40">
      <ul className="space-y-2 mt-4">
        {links.map((link) => (
          <li key={link.id}>
            <NavLink
              to={link.path}
              className={({ isActive }) =>
                `block py-4 px-6 text-gray-700 ${
                  isActive
                    ? 'bg-blue-700 text-white rounded-l-full' // Tailwind blue-700 for selected state
                    : 'hover:bg-blue-700 hover:text-white rounded-l-full' // Tailwind blue-700 on hover
                }`
              }
            >
              {link.name}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
