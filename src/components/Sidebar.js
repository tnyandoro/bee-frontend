import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, TicketIcon, BookOpenIcon, CogIcon, UserIcon } from '@heroicons/react/24/outline'; // Update the path to Heroicons v2

const Sidebar = ({ isLoggedIn }) => {
  const [selected, setSelected] = useState(null);

  const links = [
    { id: 1, name: 'Dashboard', path: '/dashboard', icon: <HomeIcon className="h-5 w-5" /> },
    { id: 2, name: 'Create Ticket', path: '/create-ticket', icon: <TicketIcon className="h-5 w-5" /> },
    { id: 3, name: 'Incident Overview', path: '/incident-overview', icon: <TicketIcon className="h-5 w-5" /> },
    { id: 4, name: 'Knowledge Base', path: '/knowledge-base', icon: <BookOpenIcon className="h-5 w-5" /> },
    { id: 5, name: 'Create Problems', path: '/create-problems', icon: <TicketIcon className="h-5 w-5" /> },
    { id: 6, name: 'Problems Overview', path: '/problems-overview', icon: <TicketIcon className="h-5 w-5" /> },
    { id: 7, name: 'Settings', path: '/settings', icon: <CogIcon className="h-5 w-5" /> },
    { id: 8, name: 'Profile', path: '/profile', icon: <UserIcon className="h-5 w-5" /> },
  ];

  if (!isLoggedIn) return null;

  return (
    <div className="fixed top-16 left-0 h-full bg-white shadow-lg w-64 overflow-y-auto z-40">
      <ul className="space-y-2 mt-4">
        {links.map((link) => (
          <li key={link.id}>
            <NavLink
              to={link.path}
              className={`flex items-center py-4 px-6 text-gray-700 ${
                selected === link.id
                  ? 'bg-blue-700 text-white rounded-l-full' // Tailwind blue-700 for selected state
                  : 'hover:bg-blue-700 hover:text-white rounded-l-full' // Tailwind blue-700 on hover
              }`}
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
