import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import apiBaseUrl from "../config";

const CreateProblems = () => {
  const { token, subdomain } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    ticket_type: "Problem",
    urgency: "low",
    priority: 1,
    impact: "low",
    team_id: "",
    caller_name: "",
    caller_surname: "",
    caller_email: "",
    caller_phone: "",
    customer: "",
    source: "Web",
    category: "Technical",
    assignee_id: "",
    related_incident_id: "",
  });
  const [tickets, setTickets] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  const baseUrl = subdomain ? `${apiBaseUrl}/organizations/${subdomain}` : null;

  const fetchProblems = useCallback(async () => {
    if (!token || !baseUrl) {
      setError("Authentication required. Please log in.");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [ticketsResponse, teamsResponse, usersResponse] = await Promise.all(
        [
          axios.get(`${baseUrl}/tickets?page=1`, config),
          axios.get(`${baseUrl}/teams`, config),
          axios.get(`${baseUrl}/users`, config),
        ]
      );

      const allTickets = Array.isArray(ticketsResponse.data.tickets)
        ? ticketsResponse.data.tickets
        : Array.isArray(ticketsResponse.data)
        ? ticketsResponse.data
        : [];
      setTickets(allTickets);

      setTeams(
        Array.isArray(teamsResponse.data)
          ? teamsResponse.data
          : teamsResponse.data.teams || []
      );
      setUsers(
        Array.isArray(usersResponse.data)
          ? usersResponse.data
          : usersResponse.data.users || []
      );
    } catch (err) {
      const status = err.response?.status;
      const errorMessage = err.response?.data?.error || err.message;
      setError(
        `Failed to load data: ${errorMessage} ${
          status ? `(Status: ${status})` : ""
        }`
      );
      if (status === 401) {
        localStorage.removeItem("authToken");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [token, baseUrl, navigate]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "related_incident_id" && value) {
      const ticket = tickets.find((t) => t.id === parseInt(value));
      if (ticket) {
        setFormData((prev) => ({
          ...prev,
          title: `Problem related to ${ticket.title}`,
          description: ticket.description || "",
          team_id: ticket.team_id?.toString() || "",
          assignee_id: ticket.assignee_id?.toString() || "",
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setShowSuccessModal(false);

    if (!token || !baseUrl) {
      setError("Authentication required. Please log in.");
      navigate("/login");
      return;
    }

    const ticketData = {
      problem: {
        ...formData,
        priority: parseInt(formData.priority, 10),
        team_id: formData.team_id || null,
        assignee_id: formData.assignee_id || null,
        related_incident_id: formData.related_incident_id || null,
      },
    };

    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        `${apiBaseUrl}/organizations/${subdomain}/problems`,
        ticketData,
        config
      );
      // await axios.post(`${baseUrl}/problems`, { problem: formData }, config);

      setShowSuccessModal(true);
      resetForm();
      fetchProblems();
    } catch (err) {
      setError(
        `Failed to submit problem: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (ticketId) => {
    try {
      setLoading(true);
      await axios.put(
        `${baseUrl}/tickets/${ticketId}`,
        { ticket: { status: "resolved" } },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setShowSuccessModal(true);
      fetchProblems();
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      setError(
        `Failed to resolve problem: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ticket) => {
    setFormData({
      ...formData,
      title: ticket.title || "",
      description: ticket.description || "",
      urgency: ticket.urgency || "low",
      priority: ticket.priority !== undefined ? ticket.priority : 1,
      impact: ticket.impact || "low",
      team_id: ticket.team_id?.toString() || "",
      caller_name: ticket.caller_name || "",
      caller_surname: ticket.caller_surname || "",
      caller_email: ticket.caller_email || "",
      caller_phone: ticket.caller_phone || "",
      customer: ticket.customer || "",
      source: ticket.source || "Web",
      category: ticket.category || "Technical",
      assignee_id: ticket.assignee_id?.toString() || "",
      related_incident_id: ticket.related_incident_id?.toString() || "",
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      ticket_type: "Problem",
      urgency: "low",
      priority: 1,
      impact: "low",
      team_id: "",
      caller_name: "",
      caller_surname: "",
      caller_email: "",
      caller_phone: "",
      customer: "",
      source: "Web",
      category: "Technical",
      assignee_id: "",
      related_incident_id: "",
    });
    setError(null);
  };

  if (!baseUrl) {
    return (
      <p className="text-red-500">Authentication required. Please log in.</p>
    );
  }

  const problems = tickets
    .filter((ticket) => ticket.ticket_type === "Problem")
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="bg-blue-700 container mx-auto p-1 relative mt-20">
      <div className="p-6 bg-gray-100 shadow-lg rounded-lg mt-12">
        <div className="p-2 text-white rounded-t-lg bg-blue-700 shadow-xl mb-6">
          <h2 className="text-2xl mb-1">Log a Problem</h2>
          <p className="text-sm">
            Log an escalated issue as a problem to report an issue with a
            service or system.
          </p>
        </div>

        {loading && <p className="text-blue-700">Loading...</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form
          className="problem-form shadow-md rounded-lg p-4 bg-white"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium">
                Related Incident
              </label>
              <select
                name="related_incident_id"
                value={formData.related_incident_id}
                onChange={handleChange}
                className="input-box border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Select an Incident (Optional)</option>
                {tickets
                  .filter((t) => t.ticket_type === "Incident")
                  .map((ticket) => (
                    <option key={ticket.id} value={ticket.id}>
                      {ticket.ticket_number || `Ticket #${ticket.id}`} -{" "}
                      {ticket.title}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Team</label>
              <select
                name="team_id"
                value={formData.team_id}
                onChange={handleChange}
                className="input-box border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Select a Team (Optional)</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium">
                Assignee
              </label>
              <select
                name="assignee_id"
                value={formData.assignee_id}
                onChange={handleChange}
                className="input-box border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!formData.team_id || loading}
              >
                <option value="">Select an Assignee (Optional)</option>
                {users
                  .filter((user) => user.team_id === parseInt(formData.team_id))
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.username}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium">
                Urgency *
              </label>
              <select
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                className="input-box border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium">
                Priority *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="input-box border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              >
                <option value={3}>P1</option>
                <option value={2}>P2</option>
                <option value={1}>P3</option>
                <option value={0}>P4</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium">
                Impact *
              </label>
              <select
                name="impact"
                value={formData.impact}
                onChange={handleChange}
                className="input-box border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-gray-700 font-medium">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input-box border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-box border p-2 w-full h-24 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
          </div>
          <div className="flex justify-end mt-6 space-x-2">
            <button
              type="button"
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition duration-300 disabled:bg-gray-300"
              onClick={() => navigate("/dashboard")}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300 disabled:bg-blue-400"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Problem"}
            </button>
          </div>
        </form>

        <div className="w-full bg-white shadow-lg rounded-lg p-6 mt-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Problems List
          </h2>
          {problems.length === 0 ? (
            <p className="text-gray-500 italic">No problems available.</p>
          ) : (
            <div className="space-y-6">
              {problems.map((problem) => (
                <div
                  key={problem.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {problem.ticket_number || `Problem #${problem.id}`} -{" "}
                        {problem.title}
                      </h3>
                      <p className="text-gray-700 mt-1">
                        {problem.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          <span className="font-bold">Incident #:</span>{" "}
                          {problem.related_incident_id
                            ? tickets.find(
                                (t) => t.id === problem.related_incident_id
                              )?.ticket_number || "N/A"
                            : "N/A"}
                        </span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                          <span className="font-bold">Team:</span>{" "}
                          {teams.find((t) => t.id === problem.team_id)?.name ||
                            "Unassigned"}
                        </span>
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          <span className="font-bold">Assignee:</span>{" "}
                          {users.find((u) => u.id === problem.assignee_id)
                            ?.name || "Unassigned"}
                        </span>
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          <span className="font-bold">Status:</span>{" "}
                          {problem.status || "open"}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(problem)}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition duration-200 font-medium"
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleResolve(problem.id)}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200 font-medium"
                        disabled={loading || problem.status === "resolved"}
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
            <h2 className="text-3xl font-bold text-green-600 mb-4">Success!</h2>
            <p className="text-lg text-gray-800">
              Problem created or resolved successfully!
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Closing in 3 seconds...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateProblems;
