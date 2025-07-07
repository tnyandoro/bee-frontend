import React, { useState } from "react";
import { NavLink } from "react-router-dom";
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
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/authContext";

const Sidebar = ({ isLoggedIn }) => {
  const [selected, setSelected] = useState(null);
  const { user } = useAuth();

  const links = [
    {
      id: 1,
      name: "Admin Dashboard",
      path: "/admin-dashboard",
      icon: <Squares2X2Icon className="h-5 w-5" />,
    },
    {
      id: 2,
      name: "Dashboard",
      path: "/dashboard",
      icon: <HomeIcon className="h-5 w-5" />,
    },
    {
      id: 3,
      name: "Create Ticket",
      path: "/create-ticket",
      icon: <TicketIcon className="h-5 w-5" />,
    },
    {
      id: 4,
      name: "Incidents",
      path: "/incident",
      icon: <TicketIcon className="h-5 w-5" />,
    },
    {
      id: 5,
      name: "Overview",
      path: "/incident-overview",
      icon: <EyeIcon className="h-5 w-5" />,
    },
    {
      id: 6,
      name: "Knowledge Base",
      path: "/knowledge-base",
      icon: <BookOpenIcon className="h-5 w-5" />,
    },
    {
      id: 7,
      name: "Create Problems",
      path: "/create-problems",
      icon: <TicketIcon className="h-5 w-5" />,
    },
    {
      id: 8,
      name: "Problems",
      path: "/problems-overview",
      icon: <ExclamationTriangleIcon className="h-5 w-5" />,
    },
    {
      id: 9,
      name: "Settings",
      path: "/settings",
      icon: <CogIcon className="h-5 w-5" />,
    },
    {
      id: 10,
      name: "My Profile",
      path: "/profile",
      icon: <UserIcon className="h-5 w-5" />,
    },
    {
      id: 11,
      name: "Create User",
      path: "/create-user",
      icon: <UserPlusIcon className="h-5 w-5" />,
    },
  ];

  if (!isLoggedIn) return null;

  const profilePicture = user?.profile_picture_url;

  return (
    <div className="fixed mt-28 mb-8 pb-16 left-0 h-full bg-white shadow-lg w-64 overflow-y-auto z-40">
      {/* Profile Picture */}
      <div className="text-center py-6 border-b border-gray-200">
        {profilePicture ? (
          <img
            src={profilePicture}
            alt="Profile"
            className="w-16 h-16 mx-auto rounded-full border-2 border-blue-500 object-cover"
          />
        ) : (
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-300 flex items-center justify-center text-white text-sm">
            No Image
          </div>
        )}
        <p className="mt-2 font-semibold text-gray-800 text-sm">
          {user?.name || "User"}
        </p>
        <p className="text-xs text-gray-500">{user?.email}</p>
      </div>

      {/* Links */}
      <ul className="space-y-2 mt-4">
        {links.map((link) => (
          <li key={link.id}>
            <NavLink
              to={link.path}
              className={({ isActive }) =>
                `flex items-center py-3 px-6 text-sm font-medium ${
                  isActive || selected === link.id
                    ? "bg-blue-700 text-white rounded-l-full"
                    : "text-gray-700 hover:bg-blue-700 hover:text-white rounded-l-full"
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
