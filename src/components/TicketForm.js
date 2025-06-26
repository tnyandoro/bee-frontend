import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import apiBaseUrl from "../config";

const TicketForm = ({ organization, token }) => {
  const navigate = useNavigate();

  // Function to generate a valid ticket number
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
  const [teams, setTeams] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const baseUrl = apiBaseUrl;
  const ticketsUrl = organization?.subdomain
    ? `${apiBaseUrl}/organizations/${organization.subdomain}/tickets`
    : null;

  const fetchProfile = useCallback(async () => {
    if (!token || !organization?.subdomain) {
      setError("Missing organization context or authentication token");
      return;
    }

    setLoading(true);
    const url = `${baseUrl}/organizations/${organization.subdomain}/profile`;

    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
      console.error("Profile fetch error:", err.response?.data || err.message);
      setError(
        `Failed to fetch profile: ${err.response?.status} - ${
          err.response?.data?.error || err.message
        }`
      );
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, [token, baseUrl, organization?.subdomain]);

  const fetchTeams = useCallback(async () => {
    if (!token || !organization?.subdomain) return;
    setLoading(true);
    const url = `${apiBaseUrl}/organizations/${organization.subdomain}/teams`;
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeams(
        Array.isArray(response.data) ? response.data : response.data.teams || []
      );
    } catch (err) {
      console.error("Teams fetch error:", err.response?.data);
      setError(
        `Failed to fetch teams: ${err.response?.data?.error || err.message}`
      );
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [token, organization?.subdomain]);

  const fetchTeamUsers = useCallback(async () => {
    if (!token || !organization?.subdomain || !formData.team_id) {
      setTeamUsers([]);
      return;
    }
    setLoading(true);
    const url = `${apiBaseUrl}/organizations/${organization.subdomain}/teams/${formData.team_id}/users`;
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeamUsers(
        Array.isArray(response.data) ? response.data : response.data.users || []
      );
    } catch (err) {
      console.error("Team users fetch error:", err.response?.data);
      setError(
        `Failed to fetch team users: ${
          err.response?.data?.error || err.message
        }`
      );
      setTeamUsers([]);
    } finally {
      setLoading(false);
    }
  }, [token, organization?.subdomain, formData.team_id]);

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
    setFormData((prev) => {
      const updatedFormData = {
        ...prev,
        [name]: value,
        ...(name === "team_id" ? { assignee_id: "" } : {}),
        // Update ticketNumber when ticket_type changes
        ...(name === "ticket_type"
          ? { ticketNumber: generateTicketNumber(value) }
          : {}),
      };
      return updatedFormData;
    });
    if (name === "urgency" || name === "impact") {
      calculatePriority({ ...formData, [name]: value });
    }
  };

  const calculatePriority = (data) => {
    const priorityMatrix = {
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
    const priority = priorityMatrix[key] || "p4";
    setFormData((prev) => ({ ...prev, priority }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !ticketsUrl || !currentUser) {
      setError("Please log in to submit a ticket.");
      navigate("/login");
      return;
    }

    if (
      !["admin", "team_leader", "super_user", "domain_admin"].includes(
        currentUser.role
      )
    ) {
      setError("Only admins, team leaders, or super users can create tickets.");
      return;
    }

    // Validate required fields
    const requiredFields = {
      subject: formData.subject,
      description: formData.description,
      callerName: formData.callerName,
      callerSurname: formData.callerSurname,
      callerEmail: formData.callerEmail,
      callerContact: formData.callerContact,
      callerLocation: formData.callerLocation,
      team_id: formData.team_id,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.join(", ")}`);
      return;
    }

    if (
      formData.assignee_id &&
      !teamUsers.some((u) => u.id === parseInt(formData.assignee_id))
    ) {
      setError("Selected assignee is not a member of the chosen team");
      return;
    }

    setError(null);
    setSuccess(false);
    setLoading(true);

    const ticketData = {
      ticket: {
        title: formData.subject,
        description: formData.description,
        ticket_type: formData.ticket_type,
        urgency: formData.urgency,
        impact: formData.impact,
        priority: formData.priority,
        team_id: formData.team_id,
        assignee_id: formData.assignee_id || null,
        ticket_number: formData.ticketNumber,
        reported_at: formData.reportedDate,
        caller_name: formData.callerName,
        caller_surname: formData.callerSurname,
        caller_email: formData.callerEmail,
        caller_phone: formData.callerContact,
        customer: formData.callerLocation,
        source: "Web",
        category: formData.category,
        creator_id: currentUser.id,
        requester_id: currentUser.id,
      },
    };

    try {
      const response = await axios.post(ticketsUrl, ticketData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setSuccess(true);
      navigate("/incident-overview", {
        state: { newTicket: response.data, refresh: true },
      });

      // Reset form
      setFormData({
        ticketNumber: generateTicketNumber("Incident"),
        ticketStatus: "Open",
        callerName: currentUser.name || "",
        callerSurname: currentUser.surname || "",
        callerEmail: currentUser.email || "",
        callerContact: currentUser.phone_number || "",
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
      setTeamUsers([]);
    } catch (err) {
      console.error("Ticket submission error:", err.response?.data);

      let errorMessage = "Failed to create ticket";

      if (err.response?.data?.errors) {
        if (Array.isArray(err.response.data.errors)) {
          errorMessage = err.response.data.errors.join(", ");
        } else if (typeof err.response.data.errors === "object") {
          errorMessage = Object.entries(err.response.data.errors)
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(", ")}`;
              }
              return `${field}: ${messages}`;
            })
            .join("; ");
        }
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !currentUser) {
    return <p className="text-blue-700 text-center">Loading...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg p-6 rounded-lg">
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && (
        <p className="text-green-500 mb-4">Ticket submitted successfully!</p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium">Ticket Number</label>
            <input
              type="text"
              value={formData.ticketNumber}
              readOnly
              className="w-full border px-3 py-2 rounded-md bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Ticket Status</label>
            <input
              type="text"
              value={formData.ticketStatus}
              readOnly
              className="w-full border px-3 py-2 rounded-md bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Created By</label>
            <input
              type="text"
              value={
                currentUser
                  ? `${
                      currentUser.name ||
                      currentUser.username ||
                      currentUser.email
                    } (You)`
                  : "Loading..."
              }
              readOnly
              className="w-full border px-3 py-2 rounded-md bg-gray-200 text-gray-600"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
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

        <div className="mt-4 grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium">Ticket Type *</label>
            <select
              name="ticket_type"
              value={formData.ticket_type}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              required
              disabled={loading}
            >
              <option value="Incident">Incident</option>
              <option value="Request">Request</option>
              <option value="Problem">Problem</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              required
              disabled={loading}
            >
              <option value="Technical">Technical</option>
              <option value="Billing">Billing</option>
              <option value="Support">Support</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Impact *</label>
            <select
              name="impact"
              value={formData.impact}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              required
              disabled={loading}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Urgency *</label>
            <select
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              required
              disabled={loading}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Priority</label>
            <input
              type="text"
              value={formData.priority.toUpperCase()}
              readOnly
              className="w-full border px-3 py-2 rounded-md bg-gray-100"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Team *</label>
            <select
              name="team_id"
              value={formData.team_id}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              required
              disabled={loading || teams.length === 0}
            >
              <option value="">Select a Team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Assignee</label>
            <select
              name="assignee_id"
              value={formData.assignee_id}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-md"
              disabled={!formData.team_id || loading || teamUsers.length === 0}
            >
              <option value="">Select an Assignee</option>
              {teamUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.username}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-md font-semibold">
            Caller Details (Your Information)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Name *</label>
              <input
                type="text"
                name="callerName"
                value={formData.callerName}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Surname *</label>
              <input
                type="text"
                name="callerSurname"
                value={formData.callerSurname}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email *</label>
              <input
                type="email"
                name="callerEmail"
                value={formData.callerEmail}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Contact *</label>
              <input
                type="text"
                name="callerContact"
                value={formData.callerContact}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md"
                required
                disabled={loading}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium">Location *</label>
              <input
                type="text"
                name="callerLocation"
                value={formData.callerLocation}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-md"
                required
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium">Subject *</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-md"
            required
            disabled={loading}
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium">Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full border px-3 py-2 rounded-md"
            required
            disabled={loading}
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium">Attachment</label>
          <input
            type="file"
            onChange={(e) => setAttachment(e.target.files[0])}
            className="w-full border px-3 py-2 rounded-md"
            disabled={loading}
          />
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500 disabled:bg-gray-300"
            onClick={() => navigate("/incident-overview")}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-green-300"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TicketForm;
