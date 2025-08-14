import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import createApiInstance from "../utils/api";
import { useAuth } from "../contexts/authContext";

const Knowledgebase = () => {
  const { token, subdomain, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [knowledgeData, setKnowledgeData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const isFetching = useRef(false);

  // Memoize the API instance
  const api = useMemo(
    () => createApiInstance(token, subdomain),
    [token, subdomain]
  );

  // Fetch knowledgebase data
  const fetchKnowledgebase = useCallback(async () => {
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
      });
      setError("Please log in to view the knowledgebase.");
      setLoading(false);
      logout();
      navigate("/login", { replace: true });
      return;
    }

    isFetching.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log(`${new Date().toISOString()} Fetching knowledgebase`, {
        url: `/organizations/${subdomain}/knowledgebase`,
      });
      const response = await api.get(
        `/organizations/${subdomain}/knowledgebase`
      );
      console.log(`${new Date().toISOString()} Knowledgebase API response`, {
        status: response.status,
        data: response.data,
      });
      setKnowledgeData(Array.isArray(response.data) ? response.data : []);
      setRetryCount(0);
    } catch (err) {
      console.error(`${new Date().toISOString()} Fetch knowledgebase error`, {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        headers: err.response?.headers,
      });
      let errorMsg =
        err.response?.data?.error || "Failed to load knowledgebase";
      if (err.response?.status === 401) {
        if (retryCount < maxRetries) {
          setRetryCount((prev) => prev + 1);
          setError(
            `Authentication failed. Retrying (${
              retryCount + 1
            }/${maxRetries})...`
          );
          setTimeout(() => {
            isFetching.current = false;
            fetchKnowledgebase();
          }, 3000 * (retryCount + 1));
          return;
        } else {
          errorMsg = "Session expired. Please log in again.";
          logout();
          navigate("/login", { replace: true });
        }
      } else if (err.response?.status === 404) {
        errorMsg = "Knowledgebase data is not available for this organization.";
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [api, token, subdomain, currentUser, retryCount, logout, navigate]);

  useEffect(() => {
    console.log(`${new Date().toISOString()} Initializing Knowledgebase`, {
      token: !!token,
      subdomain: !!subdomain,
      currentUser: !!currentUser,
    });
    fetchKnowledgebase();
  }, [fetchKnowledgebase]);

  // Filter data based on search term
  const filteredData = useMemo(
    () =>
      knowledgeData.filter((item) =>
        [
          "issue",
          "description",
          "troubleshootingSteps",
          "assignedGroup",
          "resolutionSteps",
        ].some((key) =>
          item[key]?.toLowerCase?.().includes(searchTerm.toLowerCase())
        )
      ),
    [knowledgeData, searchTerm]
  );

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <p>
            Loading knowledgebase... First load may take up to 30s if server is
            idle.
          </p>
        </div>
      </div>
    );
  }

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
                setRetryCount(0);
                fetchKnowledgebase();
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

  return (
    <div className="container mx-auto mt-28 p-4">
      {/* Service Level Targets Section */}
      <section className="mb-8 bg-white shadow-lg p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Service Level Targets
        </h2>
        <p className="mb-2 text-gray-600">
          Last Modified on 09/04/2024 3:29 pm EDT
        </p>
        <p className="text-gray-700">
          Our service level targets provide a framework for service
          expectations. Resolver aims to deliver consistent support, balancing
          issue severity with response time.
        </p>
        <p className="text-gray-700">
          The problem’s severity determines the support team’s response speed
          and method.
        </p>

        <h3 className="text-xl font-semibold mt-6 text-gray-800">
          Severity Level Definitions
        </h3>
        <ul className="list-disc list-inside mt-2 text-gray-700">
          <li>
            <strong>Urgent:</strong> Time-critical application failure or
            data-exposing security issue; system unusable with no workaround.
          </li>
          <li>
            <strong>High:</strong> Significant impairment to key business
            processes with no workaround.
          </li>
          <li>
            <strong>Normal:</strong> General questions or minor issues; business
            processes unaffected.
          </li>
          <li>
            <strong>Low:</strong> Non-production updates or minor issues with no
            production impact.
          </li>
        </ul>
        <p className="mt-2 text-gray-600">
          Max severity for non-production issues is Normal.
        </p>

        <h3 className="text-xl font-semibold mt-6 text-gray-800">
          Response Time Targets
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300 mt-2">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left text-gray-800">
                  Severity Level
                </th>
                <th className="border px-4 py-2 text-left text-gray-800">
                  Level of Effort
                </th>
                <th className="border px-4 py-2 text-left text-gray-800">
                  Initial Response
                </th>
                <th className="border px-4 py-2 text-left text-gray-800">
                  Status Updates
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="border px-4 py-2">Urgent</td>
                <td className="border px-4 py-2">Continuous efforts, 24/7</td>
                <td className="border px-4 py-2">1 hour</td>
                <td className="border px-4 py-2">Every 4 hours, 24/7</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border px-4 py-2">High</td>
                <td className="border px-4 py-2">
                  Continuous efforts, business hours
                </td>
                <td className="border px-4 py-2">2 hours</td>
                <td className="border px-4 py-2">Within 1 workday</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border px-4 py-2">Normal</td>
                <td className="border px-4 py-2">
                  Reasonable efforts, business hours
                </td>
                <td className="border px-4 py-2">4 hours</td>
                <td className="border px-4 py-2">
                  Within 5 days of workaround or fix
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border px-4 py-2">Low</td>
                <td className="border px-4 py-2">
                  Reasonable efforts, business hours
                </td>
                <td className="border px-4 py-2">1 business day</td>
                <td className="border px-4 py-2">In future release notes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Search Bar */}
      <div className="flex justify-center mb-6">
        <input
          type="text"
          className="w-full md:w-1/2 px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search for known issues..."
          value={searchTerm}
          onChange={(e) => {
            console.log(
              `${new Date().toISOString()} Search term changed:`,
              e.target.value
            );
            setSearchTerm(e.target.value);
          }}
        />
      </div>

      {/* Knowledgebase Table */}
      <div className="bg-white shadow-lg p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Known Issues</h2>
        {filteredData.length === 0 ? (
          <p className="text-gray-500 italic">No matching issues found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2 text-left text-gray-800">
                    Issue
                  </th>
                  <th className="border px-4 py-2 text-left text-gray-800">
                    Description
                  </th>
                  <th className="border px-4 py-2 text-left text-gray-800">
                    Troubleshooting Steps
                  </th>
                  <th className="border px-4 py-2 text-left text-gray-800">
                    Assigned Group
                  </th>
                  <th className="border px-4 py-2 text-left text-gray-800">
                    Resolution Steps
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{item.issue || "N/A"}</td>
                    <td className="border px-4 py-2">
                      {item.description || "N/A"}
                    </td>
                    <td className="border px-4 py-2">
                      {item.troubleshootingSteps || "N/A"}
                    </td>
                    <td className="border px-4 py-2">
                      {item.assignedGroup || "N/A"}
                    </td>
                    <td className="border px-4 py-2">
                      {item.resolutionSteps || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Knowledgebase;
