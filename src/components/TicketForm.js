import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// Subcomponents
import TicketMetaSection from "../components/TicketMetaSection";
import TicketDetailsSection from "../components/TickectDetailsSection";
import TeamAssignmentSection from "../components/TeamAssignmentSection";
import CallerDetailsSection from "../components/CallerDetailsSection";
import DescriptionSection from "../components/DescriptionSection";
import FormActions from "../components/FormActions";

import createApiInstance from "../utils/api";

const TicketForm = ({ organization, token }) => {
  const navigate = useNavigate();

  const [attachment, setAttachment] = useState(null);
  const [teams, setTeams] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [profileLoading, setProfileLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamUsersLoading, setTeamUsersLoading] = useState(false);

  const profileFetchedRef = useRef(false);

  // Initialize api first
  const api = useMemo(() => {
    if (!token || !organization?.subdomain) return null;
    return createApiInstance(token, organization.subdomain);
  }, [token, organization?.subdomain]);

  // Utility function to check if user can create tickets
  const canUserCreateTickets = (userRole) => {
    const ticketCreationRoles = [
      "system_admin",
      "domain_admin",
      "sub_domain_admin",
      "admin",
      "super_user",
      "team_leader",
      "service_desk_agent",
      "service_desk_tl",
      "service_desk_manager",
      "incident_manager",
      "call_center_agent",
      "general_manager",
      "department_manager",
      "assignee_lvl_1_2",
      "assignee_lvl_3",
      "assignment_group_tl",
      "problem_manager",
    ];

    return ticketCreationRoles.includes(userRole);
  };

  // Convert Date to local datetime for input
  const toLocalDateTimeInput = (date = new Date()) => {
    const pad = (num) => String(num).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    // Remove ticketNumber from initial state - backend will generate it
    ticketStatus: "Open",
    callerName: "",
    callerSurname: "",
    callerEmail: "",
    callerContact: "",
    callerLocation: "",
    subject: "",
    description: "",
    reportedDate: toLocalDateTimeInput(),
    relatedRecord: "",
    ticket_type: "Incident",
    category: "Query",
    impact: "high", // Set default to "high"
    urgency: "medium",
    priority: "p2", // Default based on impact: high, urgency: medium
    team_id: "",
    assignee_id: "",
  });

  const fetchProfile = useCallback(async () => {
    if (!api || profileFetchedRef.current) return;

    setProfileLoading(true);
    try {
      const response = await api.get(
        `/organizations/${organization.subdomain}/profile`
      );
      const user = response.data?.current_user;
      if (!user) throw new Error("User not found");

      if (!canUserCreateTickets(user.role)) {
        throw new Error(
          "You don't have permission to create tickets. Please contact your administrator."
        );
      }

      setCurrentUser(user);
      setFormData((prev) => ({
        ...prev,
        callerName: user.name || user.first_name || "",
        callerSurname: user.surname || user.last_name || "",
        callerEmail: user.email || "",
        callerContact: user.phone_number || user.phone || "",
      }));

      profileFetchedRef.current = true;
    } catch (err) {
      const msg =
        err?.response?.data?.error || err.message || "Failed to fetch profile.";
      setError(msg);
      toast.error(msg);
      setCurrentUser(null);
    } finally {
      setProfileLoading(false);
    }
  }, [api, organization?.subdomain]);

  const fetchTeams = useCallback(async () => {
    if (!api) return;
    setTeamsLoading(true);
    try {
      const response = await api.get(
        `/organizations/${organization.subdomain}/teams`
      );
      setTeams(response.data || []);
    } catch (err) {
      const msg = err.message || "Failed to fetch teams.";
      setError(msg);
      toast.error(msg);
    } finally {
      setTeamsLoading(false);
    }
  }, [api, organization?.subdomain]);

  const fetchTeamUsers = useCallback(async () => {
    if (!api || !formData.team_id) return;

    setTeamUsersLoading(true);
    try {
      const response = await api.get(
        `/organizations/${organization.subdomain}/teams/${formData.team_id}/users`
      );
      setTeamUsers(response.data || []);
    } catch (err) {
      const msg = err.message || "Failed to fetch team users.";
      setError(msg);
      toast.error(msg);
    } finally {
      setTeamUsersLoading(false);
    }
  }, [api, formData.team_id, organization?.subdomain]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!organization?.subdomain || !api) return;

    fetchProfile();
    fetchTeams();
  }, [token, organization, api, fetchProfile, fetchTeams, navigate]);

  useEffect(() => {
    fetchTeamUsers();
  }, [formData.team_id, fetchTeamUsers]);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;

      let updated = {
        ...formData,
        [name]: name.includes("_id") ? String(value) : value,
        ...(name === "team_id" ? { assignee_id: "" } : {}),
      };

      setFormData(updated);

      if (name === "urgency") calculatePriority(updated); // Only recalculate priority on urgency change
    },
    [formData]
  );

  const calculatePriority = (data) => {
    const matrix = {
      high_high: "p1",
      high_medium: "p2",
      high_low: "p3",
      medium_high: "p2",
      medium_medium: "p3",
      medium_low: "p4",
      low_high: "p3",
      low_medium: "p4",
      low_low: "p4",
    };
    const key = `${data.urgency}_high`; // Impact is fixed to "high"
    setFormData((prev) => ({ ...prev, priority: matrix[key] || "p4" }));
  };

  const canCreateTicketType = (ticketType) => {
    if (!currentUser) return false;

    switch (ticketType) {
      case "Incident":
      case "Request":
        return canUserCreateTickets(currentUser.role);
      case "Problem":
        const problemRoles = [
          "system_admin",
          "domain_admin",
          "problem_manager",
          "assignee_lvl_3",
          "assignment_group_tl",
          "general_manager",
          "department_manager",
        ];
        return problemRoles.includes(currentUser.role);
      default:
        return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!api || !currentUser) return;

    if (!canCreateTicketType(formData.ticket_type)) {
      const msg = `You don't have permission to create ${formData.ticket_type} tickets.`;
      toast.error(msg);
      setError(msg);
      return;
    }

    const required = [
      "subject",
      "description",
      "callerName",
      "callerSurname",
      "callerEmail",
      "callerContact",
      "callerLocation",
      "team_id",
    ];
    const missing = required.filter((field) => !formData[field]);
    if (missing.length) {
      const msg = `Missing required fields: ${missing.join(", ")}`;
      toast.error(msg);
      setError(msg);
      return;
    }

    if (
      formData.assignee_id &&
      !teamUsers.some((u) => u.id === parseInt(formData.assignee_id))
    ) {
      const msg = "Selected assignee is not a member of the team.";
      toast.error(msg);
      setError(msg);
      return;
    }

    const payload = new FormData();
    const reportedAtUTC = new Date(formData.reportedDate).toISOString();

    Object.entries({
      title: formData.subject,
      description: formData.description,
      ticket_type: formData.ticket_type,
      urgency: formData.urgency,
      impact: formData.impact,
      priority: formData.priority,
      team_id: formData.team_id,
      assignee_id: formData.assignee_id || "",
      // Remove ticket_number from payload - let backend generate it
      reported_at: reportedAtUTC,
      caller_name: formData.callerName,
      caller_surname: formData.callerSurname,
      caller_email: formData.callerEmail,
      caller_phone: formData.callerContact,
      customer: formData.callerLocation,
      source: "Web",
      category: formData.category,
      creator_id: currentUser.id,
      requester_id: currentUser.id,
    }).forEach(([key, val]) => payload.append(`ticket[${key}]`, val));

    if (attachment) payload.append("ticket[attachment]", attachment);

    try {
      setLoading(true);
      const response = await api.post(
        `/organizations/${organization.subdomain}/tickets`,
        payload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setSuccess(true);
      toast.success(
        `Ticket created successfully! Ticket Number: ${response.data.ticket_number}`
      );
      navigate("/incident-overview", {
        state: { newTicket: response.data, refresh: true },
      });
    } catch (err) {
      let msg = err.response?.data?.error || "Failed to create ticket";

      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        if (Array.isArray(errors)) {
          msg = errors.join(", ");
        } else if (typeof errors === "object") {
          msg = Object.entries(errors)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join("; ");
        }
      }

      if (err.response?.status === 403) {
        msg = "You don't have permission to create this type of ticket.";
      }

      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-6 bg-white shadow-md rounded-lg">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-blue-700">Loading user profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !currentUser) {
    return (
      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-6 bg-white shadow-md rounded-lg">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-6 bg-white shadow-md rounded-lg">
      {currentUser && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-blue-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-blue-800">
              <strong>User:</strong> {currentUser.name} ({currentUser.role}) |
              <strong> Can create:</strong>
              {canCreateTicketType("Incident") && " Incidents"}
              {canCreateTicketType("Request") && " Requests"}
              {canCreateTicketType("Problem") && " Problems"}
            </span>
          </div>
        </div>
      )}

      {error && currentUser && <p className="text-red-500 mb-4">{error}</p>}
      {success && (
        <p className="text-green-500 mb-4">Ticket submitted successfully!</p>
      )}

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        {/* Display ticket number info - will be generated by backend */}
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-gray-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-sm text-gray-700">
              <strong>Ticket Number:</strong> Will be automatically generated
              when ticket is created
            </span>
          </div>
        </div>

        <TicketMetaSection formData={formData} currentUser={currentUser} />

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reported Date *
            </label>
            <input
              type="datetime-local"
              name="reportedDate"
              value={formData.reportedDate}
              onChange={handleChange}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Related Record
            </label>
            <input
              type="text"
              name="relatedRecord"
              value={formData.relatedRecord}
              onChange={handleChange}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              placeholder="Enter related record number (optional)"
            />
          </div>
        </div>

        <TicketDetailsSection
          formData={formData}
          handleChange={handleChange}
          loading={loading}
          canCreateTicketType={canCreateTicketType}
        />

        <TeamAssignmentSection
          formData={formData}
          teams={teams}
          teamUsers={teamUsers}
          handleChange={handleChange}
          loadingTeams={teamsLoading}
          loadingUsers={teamUsersLoading}
        />

        <CallerDetailsSection
          formData={formData}
          handleChange={handleChange}
          loading={loading}
        />

        <DescriptionSection
          formData={formData}
          handleChange={handleChange}
          attachment={attachment}
          setAttachment={setAttachment}
          loading={loading}
        />

        <FormActions
          loading={loading}
          canSubmit={
            !!currentUser &&
            canCreateTicketType(formData.ticket_type) &&
            !loading
          }
        />
      </form>
    </div>
  );
};

export default TicketForm;
