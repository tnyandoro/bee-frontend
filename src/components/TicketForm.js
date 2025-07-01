import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import apiBaseUrl from "../config";

// Subcomponents
import TicketMetaSection from "../components/TicketMetaSection";
import TicketDetailsSection from "../components/TickectDetailsSection";
import TeamAssignmentSection from "../components/TeamAssignmentSection";
import CallerDetailsSection from "../components/CallerDetailsSection";
import DescriptionSection from "../components/DescriptionSection";
import FormActions from "../components/FormActions";
import toast from "react-hot-toast";

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

  const baseUrl = apiBaseUrl;
  const ticketsUrl = organization?.subdomain
    ? `${baseUrl}/organizations/${organization.subdomain}/tickets`
    : null;

  const fetchProfile = useCallback(async () => {
    if (!token || !organization?.subdomain) {
      toast.setError("Missing organization or authentication token.");
      setSuccess(true);
      return;
    }

    setProfileLoading(true);
    try {
      const response = await axios.get(
        `${baseUrl}/organizations/${organization.subdomain}/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const user = response.data.user;
      setCurrentUser(user);

      setFormData((prev) => ({
        ...prev,
        callerName: user.name || "",
        callerSurname: user.surname || "",
        callerEmail: user.email || "",
        callerContact: user.phone_number || "",
      }));

      if (
        !["admin", "team_leader", "super_user", "domain_admin"].includes(
          user.role
        )
      ) {
        setError(
          "Only admins, team leaders, or super users can create tickets."
        );
        setCurrentUser(null);
      }
    } catch (err) {
      setError(
        `Failed to fetch profile: ${err.response?.status} - ${
          err.response?.data?.error || err.message
        }`
      );
    } finally {
      setProfileLoading(false);
    }
  }, [token, baseUrl, organization?.subdomain]);

  const fetchTeams = useCallback(async () => {
    if (!token || !organization?.subdomain) return;
    setTeamsLoading(true);
    try {
      const response = await axios.get(
        `${baseUrl}/organizations/${organization.subdomain}/teams`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTeams(response.data || []);
    } catch (err) {
      setError(
        `Failed to fetch teams: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setTeamsLoading(false);
    }
  }, [token, baseUrl, organization?.subdomain]);

  const fetchTeamUsers = useCallback(async () => {
    if (!token || !organization?.subdomain || !formData.team_id) return;

    setTeamUsersLoading(true);
    try {
      const response = await axios.get(
        `${baseUrl}/organizations/${organization.subdomain}/teams/${formData.team_id}/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTeamUsers(response.data || []);
    } catch (err) {
      setError(
        `Failed to fetch team users: ${
          err.response?.data?.error || err.message
        }`
      );
    } finally {
      setTeamUsersLoading(false);
    }
  }, [token, baseUrl, organization?.subdomain, formData.team_id]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      fetchProfile();
      fetchTeams();
    }
  }, [token, fetchProfile, fetchTeams, navigate]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !ticketsUrl || !currentUser) return;

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
      toast.error(`Missing required fields: ${missing.join(", ")}`);
      setError(`Missing required fields: ${missing.join(", ")}`);
      return;
    }

    if (
      formData.assignee_id &&
      !teamUsers.some((u) => u.id === parseInt(formData.assignee_id))
    ) {
      toast.error("Selected assignee is not a member of the team.");
      setError("Selected assignee is not a member of the team.");
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
      const response = await axios.post(ticketsUrl, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

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
