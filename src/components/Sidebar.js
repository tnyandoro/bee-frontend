import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  TicketIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
  EyeIcon,
  CogIcon,
  UserIcon,
  UserPlusIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

const Sidebar = ({ isLoggedIn }) => {
  const [selected, setSelected] = useState(null);

  const links = [
    { id: 1, name: 'Admin Dashboard', path: '/admin-dashboard', icon: <Squares2X2Icon className="h-5 w-5" /> },
    { id: 2, name: 'Dashboard', path: '/dashboard', icon: <HomeIcon className="h-5 w-5" /> },
    { id: 3, name: 'Create Ticket', path: '/create-ticket', icon: <TicketIcon className="h-5 w-5" /> },
    { id: 4, name: 'Incidents', path: '/incidents', icon: <TicketIcon className="h-5 w-5" /> }, // Added Incidents link
    { id: 5, name: 'Overview', path: '/incident-overview', icon: <EyeIcon className="h-5 w-5" /> },
    { id: 6, name: 'Knowledge Base', path: '/knowledge-base', icon: <BookOpenIcon className="h-5 w-5" /> },
    { id: 7, name: 'Create Problems', path: '/create-problems', icon: <TicketIcon className="h-5 w-5" /> },
    { id: 8, name: 'Problems', path: '/problems-overview', icon: <ExclamationTriangleIcon className="h-5 w-5" /> },
    { id: 9, name: 'Settings', path: '/settings', icon: <CogIcon className="h-5 w-5" /> },
    { id: 10, name: 'Profile', path: '/profile', icon: <UserIcon className="h-5 w-5" /> },
    { id: 11, name: 'Create User', path: '/create-user', icon: <UserPlusIcon className="h-5 w-5" /> }, // Moved here for consistency
  ];

  if (!isLoggedIn) return null;

  return (
    <div className="fixed mt-20 left-0 h-full bg-white shadow-lg w-64 overflow-y-auto z-40">
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.id}>
            <NavLink
              to={link.path}
              className={({ isActive }) =>
                `flex items-center py-4 px-6 text-gray-700 ${
                  isActive || selected === link.id
                    ? 'bg-blue-700 text-white rounded-l-full'
                    : 'hover:bg-blue-700 hover:text-white rounded-l-full'
                }`
              }
              onClick={() => setSelected(link.id)}
            >
              {link.icon}
              <span className="ml-3">{link.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;