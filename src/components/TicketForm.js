import React, { useState, useEffect, useCallback } from "react";
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
    reportedDate: new Date().toISOString().slice(0, 16),
    relatedRecord: "",
    ticket_type: "Incident",
    category: "Technical",
    impact: "medium",
    urgency: "medium",
    priority: "p3",
    team_id: "",
    assignee_id: "",
  });

  // API instance
  const api = createApiInstance(token, organization?.subdomain);

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    if (!token || !organization?.subdomain) return;

    setProfileLoading(true);
    try {
      const response = await api.get(
        `/organizations/${organization.subdomain}/profile`
      );

      const user = response.data?.user;

      if (!user) {
        setError("Failed to fetch profile: User not found");
        toast.error("Failed to fetch profile: User not found");
        setCurrentUser(null);
        return;
      }

      setCurrentUser(user);

      setFormData((prev) => ({
        ...prev,
        callerName: user.name || "",
        callerSurname: user.surname || "",
        callerEmail: user.email || "",
        callerContact: user.phone_number || "",
      }));

      // Only allow specific roles to create tickets
      if (
        !["admin", "team_leader", "super_user", "domain_admin"].includes(
          user.role
        )
      ) {
        const roleError =
          "Only admins, team leaders, or super users can create tickets.";
        setError(roleError);
        toast.error(roleError);
        setCurrentUser(null);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error || err.message || "Failed to fetch profile.";
      setError(msg);
      toast.error(msg);
      setCurrentUser(null);
    } finally {
      setProfileLoading(false);
    }
  }, [api, token, organization?.subdomain]);

  // Fetch teams
  const fetchTeams = useCallback(async () => {
    if (!token || !organization?.subdomain) return;

    setTeamsLoading(true);
    try {
      const response = await api.get(
        `/organizations/${organization.subdomain}/teams`
      );
      setTeams(response.data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch teams.");
      toast.error(err.message || "Failed to fetch teams.");
    } finally {
      setTeamsLoading(false);
    }
  }, [api, token, organization?.subdomain]);

  // Fetch team users when team changes
  const fetchTeamUsers = useCallback(async () => {
    if (!token || !organization?.subdomain || !formData.team_id) return;

    setTeamUsersLoading(true);
    try {
      const response = await api.get(
        `/organizations/${organization.subdomain}/teams/${formData.team_id}/users`
      );
      setTeamUsers(response.data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch team users.");
      toast.error(err.message || "Failed to fetch team users.");
    } finally {
      setTeamUsersLoading(false);
    }
  }, [api, token, organization?.subdomain, formData.team_id]);

  // Fetch profile and teams on mount
  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      fetchProfile();
      fetchTeams();
    }
  }, [token, fetchProfile, fetchTeams, navigate]);

  // Fetch team users when team_id changes
  useEffect(() => {
    fetchTeamUsers();
  }, [formData.team_id, fetchTeamUsers]);

  // Form change handler
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

    if (["urgency", "impact"].includes(name)) {
      calculatePriority(updated);
    }
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

  // Submit ticket
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !organization?.subdomain || !currentUser) return;

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
    payload.append("ticket[title]", formData.subject);
    payload.append("ticket[description]", formData.description);
    payload.append("ticket[ticket_type]", formData.ticket_type);
    payload.append("ticket[urgency]", formData.urgency);
    payload.append("ticket[impact]", formData.impact);
    payload.append("ticket[priority]", formData.priority);
    payload.append("ticket[team_id]", formData.team_id);
    payload.append("ticket[assignee_id]", formData.assignee_id || "");
    payload.append("ticket[ticket_number]", formData.ticketNumber);
    payload.append("ticket[reported_at]", formData.reportedDate);
    payload.append("ticket[caller_name]", formData.callerName);
    payload.append("ticket[caller_surname]", formData.callerSurname);
    payload.append("ticket[caller_email]", formData.callerEmail);
    payload.append("ticket[caller_phone]", formData.callerContact);
    payload.append("ticket[customer]", formData.callerLocation);
    payload.append("ticket[source]", "Web");
    payload.append("ticket[category]", formData.category);
    payload.append("ticket[creator_id]", currentUser.id);
    payload.append("ticket[requester_id]", currentUser.id);
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
      let msg = "Failed to create ticket";
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        if (Array.isArray(errors)) msg = errors.join(", ");
        else if (typeof errors === "object")
          msg = Object.entries(errors)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join("; ");
      } else if (err.response?.data?.error) msg = err.response.data.error;
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
