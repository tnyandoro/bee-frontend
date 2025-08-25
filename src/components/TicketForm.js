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

  const generateTicketNumber = (ticketType) => {
    const prefix =
      {
        Incident: "INC",
        Request: "REQ",
        Problem: "PRB",
        Other: "TKT",
      }[ticketType] || "TKT";

    const randomString = Array(8)
      .fill()
      .map(() => Math.random().toString(36).charAt(2).toUpperCase())
      .join("");

    return `${prefix}${randomString}`;
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
    ticketNumber: generateTicketNumber("Incident"),
    ticketStatus: "Open",
    callerName: "",
    callerSurname: "",
    callerEmail: "",
    callerContact: "",
    callerLocation: "",
    subject: "",
    description: "",
    reportedDate: toLocalDateTimeInput(), // local time
    relatedRecord: "",
    ticket_type: "Incident",
    category: "Technical",
    impact: "medium",
    urgency: "medium",
    priority: "p3",
    team_id: "",
    assignee_id: "",
  });

  const api = useMemo(() => {
    if (!token || !organization?.subdomain) return null;
    return createApiInstance(token, organization.subdomain);
  }, [token, organization?.subdomain]);

  const fetchProfile = useCallback(async () => {
    if (!api || profileFetchedRef.current) return;

    setProfileLoading(true);
    try {
      const response = await api.get(
        `/organizations/${organization.subdomain}/profile`
      );
      const user = response.data?.current_user;
      if (!user) throw new Error("User not found");

      if (
        !["admin", "team_leader", "super_user", "domain_admin"].includes(
          user.role
        )
      ) {
        throw new Error(
          "Only admins, team leaders, or super users can create tickets."
        );
      }

      setCurrentUser(user);
      setFormData((prev) => ({
        ...prev,
        callerName: user.name || "",
        callerSurname: user.surname || "",
        callerEmail: user.email || "",
        callerContact: user.phone_number || "",
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    const updated = {
      ...formData,
      [name]: name.includes("_id") ? String(value) : value,
      ...(name === "team_id" ? { assignee_id: "" } : {}),
      ...(name === "ticket_type"
        ? { ticketNumber: generateTicketNumber(value) }
        : {}),
    };

    setFormData(updated);

    if (["urgency", "impact"].includes(name)) calculatePriority(updated);
  };

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
    const key = `${data.urgency}_${data.impact}`;
    setFormData((prev) => ({ ...prev, priority: matrix[key] || "p4" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!api || !currentUser) return;

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

    // Convert local datetime to UTC for backend
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
      ticket_number: formData.ticketNumber,
      reported_at: reportedAtUTC, // send UTC
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
      navigate("/incident-overview", {
        state: { newTicket: response.data, refresh: true },
      });
    } catch (err) {
      let msg = err.response?.data?.error || "Failed to create ticket";
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        if (Array.isArray(errors)) msg = errors.join(", ");
        else if (typeof errors === "object")
          msg = Object.entries(errors)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join("; ");
      }
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !currentUser)
    return <p className="text-center text-blue-700">Loading...</p>;

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-6 bg-white shadow-md rounded-lg">
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && (
        <p className="text-green-500 mb-4">Ticket submitted successfully!</p>
      )}

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <TicketMetaSection formData={formData} currentUser={currentUser} />

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Reported Date</label>
            <input
              type="datetime-local"
              name="reportedDate"
              value={formData.reportedDate}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Related Record</label>
            <input
              type="text"
              name="relatedRecord"
              value={formData.relatedRecord}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              disabled={loading}
            />
          </div>
        </div>

        <TicketDetailsSection
          formData={formData}
          handleChange={handleChange}
          loading={loading}
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
        <FormActions loading={loading} />
      </form>
    </div>
  );
};

export default TicketForm;
