import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import createApiInstance from "../utils/api";

const CreateProblems = () => {
  const { token, subdomain, currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
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
  const isFetching = useRef(false);

  // Memoize the API instance
  const api = useMemo(
    () => createApiInstance(token, subdomain),
    [token, subdomain]
  );

  // Log renders
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current += 1;
    console.log(`${new Date().toISOString()} CreateProblems rendered`, {
      renderCount: renderCount.current,
      path: window.location.pathname,
      authState: {
        token: !!token,
        subdomain: !!subdomain,
        currentUser: !!currentUser,
        isAdmin,
      },
    });
  });

  // Check auth, inspired by CreateTicketPage
  const checkAuth = useCallback(() => {
    if (isFetching.current) {
      console.log(
        `${new Date().toISOString()} Auth check in progress, skipping`
      );
      return;
    }

    isFetching.current = true;
    if (!token || !subdomain || !currentUser) {
      console.warn(`${new Date().toISOString()} Missing auth data`, {
        token: !!token,
        subdomain: !!subdomain,
        currentUser: !!currentUser,
        isAdmin,
      });
      setError("Please log in to create a problem.");
      logout();
      navigate("/login", { replace: true });
    } else {
      console.log(`${new Date().toISOString()} Auth check passed`, {
        subdomain,
        currentUser,
        isAdmin,
      });
      setError(null);
    }
    isFetching.current = false;
  }, [token, subdomain, currentUser, isAdmin, logout, navigate]);

  // Fetch tickets, teams, and users
  const fetchProblems = useCallback(async () => {
    if (isFetching.current) {
      console.log(
        `${new Date().toISOString()} Fetch already in progress, skipping`
      );
      return;
    }

    if (!token || !subdomain || !currentUser) {
      console.warn(`${new Date().toISOString()} Missing auth data`, {
        token: !!token,
        subdomain: !!subdomain,
        currentUser: !!currentUser,
        isAdmin,
      });
      setError("Please log in to create a problem.");
      logout();
      navigate("/login", { replace: true });
      return;
    }

    isFetching.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log(`${new Date().toISOString()} Fetching problems data`, {
        urls: [
          `/organizations/${subdomain}/tickets`,
          `/organizations/${subdomain}/teams`,
          `/organizations/${subdomain}/users`,
        ],
      });
      const [ticketsResponse, teamsResponse, usersResponse] = await Promise.all(
        [
          api.get(`/organizations/${subdomain}/tickets?page=1`),
          api.get(`/organizations/${subdomain}/teams`),
          api.get(`/organizations/${subdomain}/users`),
        ]
      );

      console.log(`${new Date().toISOString()} Problems API response`, {
        ticketsStatus: ticketsResponse.status,
        teamsStatus: teamsResponse.status,
        usersStatus: usersResponse.status,
      });

      setTickets(
        Array.isArray(ticketsResponse.data.tickets)
          ? ticketsResponse.data.tickets
          : Array.isArray(ticketsResponse.data)
          ? ticketsResponse.data
          : []
      );
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
      console.error(`${new Date().toISOString()} Fetch problems error`, {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      let errorMsg =
        err.response?.data?.error || `Failed to load data: ${err.message}`;
      if (err.response?.status === 401) {
        errorMsg = "Session expired. Please log in again.";
        logout();
        navigate("/login", { replace: true });
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [api, token, subdomain, currentUser, isAdmin, logout, navigate]);

  useEffect(() => {
    console.log(`${new Date().toISOString()} Initializing CreateProblems`, {
      token: !!token,
      subdomain: !!subdomain,
      currentUser: !!currentUser,
      isAdmin,
    });
    checkAuth();
    if (!error) {
      fetchProblems();
    }
  }, [checkAuth, fetchProblems, error]);

  const handleChange = useCallback(
    (e) => {
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
    },
    [tickets]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!token || !subdomain || !currentUser) {
        setError("Authentication required. Please log in.");
        logout();
        navigate("/login", { replace: true });
        return;
      }

      setError(null);
      setShowSuccessModal(false);

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
        console.log(`${new Date().toISOString()} Submitting problem`, {
          ticketData,
        });
        await api.post(`/organizations/${subdomain}/problems`, ticketData);
        console.log(
          `${new Date().toISOString()} Problem submitted successfully`
        );
        setShowSuccessModal(true);
        resetForm();
        fetchProblems();
      } catch (err) {
        console.error(`${new Date().toISOString()} Submit problem error`, {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        setError(
          `Failed to submit problem: ${
            err.response?.data?.error || err.message
          }`
        );
      } finally {
        setLoading(false);
      }
    },
    [
      api,
      token,
      subdomain,
      currentUser,
      formData,
      fetchProblems,
      logout,
      navigate,
    ]
  );

  const handleResolve = useCallback(
    async (ticketId) => {
      try {
        setLoading(true);
        console.log(`${new Date().toISOString()} Resolving problem`, {
          ticketId,
        });
        await api.put(`/organizations/${subdomain}/tickets/${ticketId}`, {
          ticket: { status: "resolved" },
        });
        console.log(
          `${new Date().toISOString()} Problem resolved successfully`
        );
        setShowSuccessModal(true);
        fetchProblems();
        setTimeout(() => setShowSuccessModal(false), 3000);
      } catch (err) {
        console.error(`${new Date().toISOString()} Resolve problem error`, {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        setError(
          `Failed to resolve problem: ${
            err.response?.data?.error || err.message
          }`
        );
      } finally {
        setLoading(false);
      }
    },
    [api, subdomain, fetchProblems]
  );

  const handleEdit = useCallback((ticket) => {
    console.log(`${new Date().toISOString()} Editing problem`, {
      ticketId: ticket.id,
    });
    setFormData({
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
  }, []);

  const resetForm = useCallback(() => {
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
  }, []);

  const problems = useMemo(
    () =>
      tickets
        .filter((ticket) => ticket.ticket_type === "Problem")
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [tickets]
  );

  if (error) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <h3 className="font-bold text-lg mb-2">Error</h3>
          <p>{error}</p>
          <div className="mt-3 space-x-2">
            <button
              onClick={() => {
                console.log(`${new Date().toISOString()} Retrying fetch`);
                setError(null);
                setLoading(true);
                fetchProblems();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
            <button
              onClick={() => {
                console.log(`${new Date().toISOString()} Navigating to login`);
                logout();
                navigate("/login", { replace: true });
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Login
            </button>
            <button
              onClick={() => {
                console.log(
                  `${new Date().toISOString()} Navigating to dashboard`
                );
                navigate("/dashboard", { replace: true });
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p>
            Loading problems... First load may take up to 30s if server is idle.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-200 container mx-auto p-1 relative">
      <div className="px-2 bg-gray-100 shadow-lg rounded-lg">
        <div className="p-2 text-white rounded-t-lg bg-blue-700 shadow-xl mb-6">
          <h2 className="text-2xl mb-1">Log a Problem</h2>
          <p className="text-sm">
            Log an escalated issue as a problem to report an issue with a
            service or system.
          </p>
        </div>

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
                Caller Name *
              </label>
              <input
                type="text"
                name="caller_name"
                value={formData.caller_name}
                onChange={handleChange}
                className="input-box border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">
                Caller Surname *
              </label>
              <input
                type="text"
                name="caller_surname"
                value={formData.caller_surname}
                onChange={handleChange}
                className="input-box border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">
                Caller Email *
              </label>
              <input
                type="email"
                name="caller_email"
                value={formData.caller_email}
                onChange={handleChange}
                className="input-box border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">
                Caller Phone *
              </label>
              <input
                type="text"
                name="caller_phone"
                value={formData.caller_phone}
                onChange={handleChange}
                className="input-box border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">
                Customer *
              </label>
              <input
                type="text"
                name="customer"
                value={formData.customer}
                onChange={handleChange}
                className="input-box border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
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
              onClick={() => {
                console.log(
                  `${new Date().toISOString()} Navigating to dashboard`
                );
                navigate("/dashboard", { replace: true });
              }}
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
// fix
export default CreateProblems;
