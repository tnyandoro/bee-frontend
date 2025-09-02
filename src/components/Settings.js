import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBuilding,
  FaUsersCog,
  FaTools,
  FaBell,
  FaPaintBrush,
  FaPuzzlePiece,
  FaClipboardList,
} from "react-icons/fa";
import { useAuth } from "../contexts/authContext";
import createApiInstance from "../utils/api";

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
  const {
    currentUser,
    subdomain,
    token,
    authError,
    logout,
    isLoading: authLoading,
  } = useAuth();
  const [activeTab, setActiveTab] = useState("organization");
  const [settings, setSettings] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const isFetching = useRef(false);

  console.log("Settings: Rendered", {
    currentUser,
    subdomain,
    token,
    authError,
    authLoading,
  });

  const fetchSettings = useCallback(async () => {
    if (isFetching.current) {
      console.log("Settings: Fetch skipped, already in progress");
      return;
    }

    // Don't attempt to fetch if auth is still loading
    if (authLoading) {
      console.log("Settings: Auth still loading, skipping fetch");
      return;
    }

    if (!token || !subdomain || !currentUser) {
      console.warn("Settings: Missing auth data", {
        token: !!token,
        subdomain: !!subdomain,
        currentUser: !!currentUser,
        authLoading,
      });
      setError("Please log in to view settings.");
      logout();
      navigate("/login");
      return;
    }

    isFetching.current = true;
    setLoading(true);
    setError("");

    try {
      const api = createApiInstance(token, subdomain);
      const url = `/organizations/${subdomain}/settings`;
      console.log("Settings: Fetching settings", { url });

      const response = await api.get(url);
      console.log("Settings: API response", { response: response.data });

      setSettings(response.data || {});
    } catch (err) {
      console.error("Settings: Fetch failed", {
        error: err.message,
        response: err.response?.data,
      });

      let errorMsg = `Failed to fetch settings: ${
        err.response?.data?.error || err.message
      }`;

      if (err.response?.status === 401) {
        errorMsg = "Session expired. Please log in again.";
        logout();
        navigate("/login");
      } else if (err.response?.status === 404) {
        errorMsg = "Settings not found for this organization.";
        setSettings({});
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [token, subdomain, currentUser, logout, navigate, authLoading]);

  const updateSetting = async (key, value) => {
    if (!token || !subdomain) {
      setError("Missing authentication data.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const api = createApiInstance(token, subdomain);
      console.log("Settings: Updating setting", { key, value });

      const response = await api.put(`/organizations/${subdomain}/settings`, {
        key,
        value,
      });

      console.log("Settings: Update response", { response: response.data });

      // Update local state with the new value
      setSettings((prev) => ({
        ...prev,
        [key]: response.data.value || value,
      }));

      // Show success message
      alert("Settings updated successfully.");
    } catch (err) {
      console.error("Settings: Update failed", {
        error: err.message,
        response: err.response?.data,
      });

      const errorMsg = err.response?.data?.error || err.message;
      setError(`Failed to update setting: ${errorMsg}`);
      alert(`Failed to update setting: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file) => {
    if (!token || !subdomain) {
      setError("Missing authentication data.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const api = createApiInstance(token, subdomain);
      const formData = new FormData();
      formData.append("file", file);

      console.log("Settings: Uploading logo", { fileName: file.name });

      const response = await api.post(
        `/organizations/${subdomain}/upload_logo`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Settings: Logo upload response", {
        response: response.data,
      });

      const logoUrl = response.data.url;

      // Update branding settings with the new logo URL
      const currentBranding = settings.branding || {};
      await updateSetting("branding", {
        ...currentBranding,
        logo_url: logoUrl,
      });

      alert("Logo uploaded successfully.");
    } catch (err) {
      console.error("Settings: Logo upload failed", {
        error: err.message,
        response: err.response?.data,
      });

      const errorMsg = err.response?.data?.error || err.message;
      setError(`Failed to upload logo: ${errorMsg}`);
      alert(`Failed to upload logo: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    // Only attempt to fetch when auth is not loading
    if (
      !authLoading &&
      token &&
      subdomain &&
      currentUser &&
      !isFetching.current
    ) {
      console.log("Settings: Starting fetchSettings");
      fetchSettings();
    } else if (!authLoading && (!token || !subdomain || !currentUser)) {
      console.warn("Settings: Auth completed but missing data", {
        token: !!token,
        subdomain: !!subdomain,
        currentUser: !!currentUser,
        authLoading,
      });
      setError("Please log in to view settings.");
    }
  }, [token, subdomain, currentUser, authLoading, fetchSettings]);

  // Show loading screen while authentication is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "organization":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Organization Settings
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const orgData = {
                  name: formData.get("orgName"),
                  description: formData.get("orgDescription"),
                  timezone: formData.get("timezone"),
                };
                updateSetting("organization", orgData);
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    name="orgName"
                    defaultValue={settings.organization?.name || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter organization name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="orgDescription"
                    defaultValue={settings.organization?.description || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Enter organization description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <select
                    name="timezone"
                    defaultValue={settings.organization?.timezone || "UTC"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Berlin">Berlin</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Asia/Shanghai">Shanghai</option>
                    <option value="Africa/Johannesburg">Johannesburg</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Organization Settings"}
                </button>
              </div>
            </form>
          </div>
        );

      case "ticket":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Ticket Configuration</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const ticketConfig = {
                  auto_close_days: parseInt(formData.get("autoClose")) || 0,
                  default_priority:
                    parseInt(formData.get("defaultPriority")) || 0,
                  require_approval: formData.get("requireApproval") === "on",
                  allow_attachments: formData.get("allowAttachments") === "on",
                };
                updateSetting("ticket_config", ticketConfig);
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auto Close Days
                  </label>
                  <input
                    type="number"
                    name="autoClose"
                    min="0"
                    defaultValue={settings.ticket_config?.auto_close_days || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Number of days before auto-closing resolved tickets"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Set to 0 to disable auto-closing
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Priority
                  </label>
                  <select
                    name="defaultPriority"
                    defaultValue={settings.ticket_config?.default_priority || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={3}>P1 (Critical)</option>
                    <option value={2}>P2 (High)</option>
                    <option value={1}>P3 (Medium)</option>
                    <option value={0}>P4 (Low)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="requireApproval"
                      defaultChecked={
                        settings.ticket_config?.require_approval || false
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      Require approval for ticket resolution
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="allowAttachments"
                      defaultChecked={
                        settings.ticket_config?.allow_attachments !== false
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      Allow file attachments
                    </span>
                  </label>
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Ticket Configuration"}
                </button>
              </div>
            </form>
          </div>
        );

      case "branding":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Branding Settings</h2>

            {/* Logo Upload */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Organization Logo</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const file = e.target.logo.files[0];
                  if (!file) {
                    alert("Please select a file to upload.");
                    return;
                  }
                  await uploadLogo(file);
                  e.target.reset(); // Clear the file input
                }}
              >
                <div className="space-y-2">
                  <input
                    type="file"
                    name="logo"
                    accept="image/*"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? "Uploading..." : "Upload Logo"}
                  </button>
                </div>
              </form>

              {settings.branding?.logo_url && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Current Logo:
                  </p>
                  <img
                    src={settings.branding.logo_url}
                    alt="Organization Logo"
                    className="h-24 w-auto rounded border border-gray-300 shadow-sm"
                  />
                </div>
              )}
            </div>

            {/* Color Scheme */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Color Scheme</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const brandingData = {
                    ...settings.branding,
                    primary_color: formData.get("primaryColor"),
                    secondary_color: formData.get("secondaryColor"),
                    accent_color: formData.get("accentColor"),
                  };
                  updateSetting("branding", brandingData);
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primary Color
                    </label>
                    <input
                      type="color"
                      name="primaryColor"
                      defaultValue={
                        settings.branding?.primary_color || "#3B82F6"
                      }
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Secondary Color
                    </label>
                    <input
                      type="color"
                      name="secondaryColor"
                      defaultValue={
                        settings.branding?.secondary_color || "#6B7280"
                      }
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Accent Color
                    </label>
                    <input
                      type="color"
                      name="accentColor"
                      defaultValue={
                        settings.branding?.accent_color || "#10B981"
                      }
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Color Scheme"}
                </button>
              </form>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Notification Settings
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const notificationConfig = {
                  email_notifications:
                    formData.get("emailNotifications") === "on",
                  sms_notifications: formData.get("smsNotifications") === "on",
                  ticket_assigned: formData.get("ticketAssigned") === "on",
                  ticket_resolved: formData.get("ticketResolved") === "on",
                  sla_breach_warning: formData.get("slaWarning") === "on",
                };
                updateSetting("notifications", notificationConfig);
              }}
            >
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">General Settings</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="emailNotifications"
                        defaultChecked={
                          settings.notifications?.email_notifications !== false
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        Enable email notifications
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="smsNotifications"
                        defaultChecked={
                          settings.notifications?.sms_notifications || false
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        Enable SMS notifications
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">
                    Event Notifications
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="ticketAssigned"
                        defaultChecked={
                          settings.notifications?.ticket_assigned !== false
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        Notify when ticket is assigned
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="ticketResolved"
                        defaultChecked={
                          settings.notifications?.ticket_resolved !== false
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        Notify when ticket is resolved
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="slaWarning"
                        defaultChecked={
                          settings.notifications?.sla_breach_warning !== false
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        Notify on SLA breach warning
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Notification Settings"}
                </button>
              </div>
            </form>
          </div>
        );

      case "roles":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Roles & Permissions</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                Role management functionality will be available in a future
                update.
              </p>
            </div>
          </div>
        );

      case "integrations":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Integrations</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                Integration settings will be available in a future update.
              </p>
            </div>
          </div>
        );

      case "logs":
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Audit Logs</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <p className="text-sm text-gray-600">
                Audit log functionality will be available in a future update.
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {TABS.find((tab) => tab.key === activeTab)?.label || "Settings"}
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <p className="text-sm text-gray-600 mb-2">Raw settings data:</p>
              <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                {JSON.stringify(settings[activeTab] || {}, null, 2)}
              </pre>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative flex flex-col w-full p-2 min-h-screen sm:px-6 lg:px-8">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute top-0 left-0 flex items-center justify-center w-full h-full bg-white opacity-50 z-10">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
            <p>Loading settings...</p>
          </div>
        </div>
      )}

      <div className="container bg-gray-100">
        <div className="p-2 mb-6 text-center align-middle rounded-b-lg bg-blue-700 shadow-2xl">
          <h1 className="text-4xl text-white">Admin Settings</h1>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          <h3 className="font-bold text-lg mb-2">Error</h3>
          <p>{error}</p>
          <div className="mt-3 space-x-2">
            <button
              onClick={() => {
                console.log("Settings: Retry fetch");
                setError("");
                setLoading(true);
                fetchSettings();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Login
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 overflow-x-auto mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              console.log("Settings: Tab changed", { tab: tab.key });
              setActiveTab(tab.key);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full shadow text-sm font-medium transition duration-200 whitespace-nowrap ${
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
      <div className="bg-white rounded-lg shadow p-6 min-h-[400px]">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Settings;
