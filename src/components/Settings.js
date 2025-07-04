import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaBuilding,
  FaUsersCog,
  FaTools,
  FaBell,
  FaPaintBrush,
  FaPuzzlePiece,
  FaClipboardList,
} from "react-icons/fa";

const TABS = [
  { key: "organization", label: "Organization", icon: <FaBuilding /> },
  { key: "roles", label: "Roles & Permissions", icon: <FaUsersCog /> },
  { key: "ticket", label: "Ticket Config", icon: <FaTools /> },
  { key: "notifications", label: "Notifications", icon: <FaBell /> },
  { key: "branding", label: "Branding", icon: <FaPaintBrush /> },
  { key: "integrations", label: "Integrations", icon: <FaPuzzlePiece /> },
  { key: "logs", label: "Audit Logs", icon: <FaClipboardList /> },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState("organization");
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAsFallback = async () => {
      const token = localStorage.getItem("authToken");
      const subdomain = localStorage.getItem("subdomain");

      if (!token || !subdomain) {
        setError("Missing token or subdomain.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `https://itsm-api.onrender.com/api/v1/organizations/${subdomain}/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSettings({
          organization: response.data.organization,
          user: response.data.user,
          roles: [],
          ticket_config: {},
          notifications: {},
          branding: {},
          integrations: {},
          audit_logs: [],
        });
      } catch (err) {
        setError("Failed to load settings from profile endpoint.");
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAsFallback();
  }, []);

  const renderTabContent = () => {
    if (!settings) return <p>No settings available.</p>;

    switch (activeTab) {
      case "organization":
        return <pre>{JSON.stringify(settings.organization, null, 2)}</pre>;
      case "roles":
        return <pre>{JSON.stringify(settings.roles, null, 2)}</pre>;
      case "ticket":
        return <pre>{JSON.stringify(settings.ticket_config, null, 2)}</pre>;
      case "notifications":
        return <pre>{JSON.stringify(settings.notifications, null, 2)}</pre>;
      case "branding":
        return <pre>{JSON.stringify(settings.branding, null, 2)}</pre>;
      case "integrations":
        return <pre>{JSON.stringify(settings.integrations, null, 2)}</pre>;
      case "logs":
        return <pre>{JSON.stringify(settings.audit_logs, null, 2)}</pre>;
      default:
        return <p>Select a tab to view settings.</p>;
    }
  };

  if (loading) return <div className="p-4">Loading settings...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Settings</h1>

      {/* Tabs */}
      <div className="flex space-x-2 overflow-x-auto mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full shadow text-sm font-medium transition duration-200 ${
              activeTab === tab.key
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded shadow p-4 min-h-[200px]">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Settings;
