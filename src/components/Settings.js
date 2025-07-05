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
  const [settings, setSettings] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    const token = localStorage.getItem("authToken");
    const subdomain = localStorage.getItem("subdomain");

    if (!token || !subdomain) {
      setError("Missing token or subdomain.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `https://itsm-api.onrender.com/api/v1/organizations/${subdomain}/settings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSettings(response.data);
    } catch (err) {
      setError("Failed to load settings.");
      console.error("Settings fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    const token = localStorage.getItem("authToken");
    const subdomain = localStorage.getItem("subdomain");

    setSaving(true);
    try {
      const response = await axios.put(
        `https://itsm-api.onrender.com/api/v1/organizations/${subdomain}/settings`,
        { key, value },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSettings((prev) => ({ ...prev, [key]: response.data.value }));
      alert("Settings updated.");
    } catch (err) {
      console.error("Settings update error:", err);
      alert("Failed to update setting.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const renderTabContent = () => {
    if (!settings) return <p>No settings available.</p>;

    switch (activeTab) {
      case "ticket":
        return (
          <div>
            <h2 className="font-semibold mb-2">SLA Config</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const autoCloseDays = e.target.autoClose.value;
                updateSetting("ticket_config", {
                  auto_close_days: autoCloseDays,
                });
              }}
            >
              <label className="block mb-2">
                Auto Close Days:
                <input
                  type="number"
                  name="autoClose"
                  defaultValue={settings.ticket_config?.auto_close_days || 0}
                  className="border rounded p-1 ml-2"
                />
              </label>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </form>
          </div>
        );
      case "branding":
        return (
          <div>
            <h2 className="font-semibold mb-2">Upload Logo</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const file = e.target.logo.files[0];
                if (!file) return;

                const token = localStorage.getItem("authToken");
                const subdomain = localStorage.getItem("subdomain");

                const formData = new FormData();
                formData.append("file", file);

                try {
                  setSaving(true);
                  const response = await axios.post(
                    `https://itsm-api.onrender.com/api/v1/organizations/${subdomain}/upload_logo`,
                    formData,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                      },
                    }
                  );
                  const logoUrl = response.data.url;
                  await updateSetting("branding", { logo_url: logoUrl });
                } catch (err) {
                  console.error("Logo upload failed:", err);
                  alert("Failed to upload logo.");
                } finally {
                  setSaving(false);
                }
              }}
            >
              <input
                type="file"
                name="logo"
                accept="image/*"
                className="mb-2"
              />
              <br />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                disabled={saving}
              >
                {saving ? "Uploading..." : "Upload Logo"}
              </button>
            </form>

            {settings.branding?.logo_url && (
              <div className="mt-4">
                <p className="text-sm mb-2">Current Logo:</p>
                <img
                  src={settings.branding.logo_url}
                  alt="Organization Logo"
                  className="h-24 rounded border"
                />
              </div>
            )}
          </div>
        );
      default:
        return <pre>{JSON.stringify(settings[activeTab] || {}, null, 2)}</pre>;
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
