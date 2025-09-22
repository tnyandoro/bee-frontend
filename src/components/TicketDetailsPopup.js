import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import apiBaseUrl from "../config";

const TicketDetailsPopup = ({
  selectedTicket,
  onClose,
  onUpdate,
  subdomain,
  authToken,
}) => {
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamUsersLoading, setTeamUsersLoading] = useState(false);
  const [assignmentWarning, setAssignmentWarning] = useState("");
  const [ticketLoading, setTicketLoading] = useState(true);
  const [ticketError, setTicketError] = useState(null);

  useEffect(() => {
    if (!selectedTicket?.id) {
      console.error("Invalid selectedTicket:", selectedTicket);
      setTicketLoading(false);
      setTicketError("No valid ticket provided.");
      return;
    }

    console.log("Fetching initial data for ticket:", {
      id: selectedTicket.id,
      ticket_number: selectedTicket.ticket_number,
      team: selectedTicket.team,
      assignee: selectedTicket.assignee,
      status: selectedTicket.status,
    });
    fetchTicketDetails();
    fetchComments();
    fetchTeams();
  }, [selectedTicket?.id]);

  const fetchTicketDetails = async () => {
    setTicketLoading(true);
    setTicketError(null);
    try {
      console.log("Fetching ticket details for ID:", selectedTicket.id);
      const response = await axios.get(
        `${apiBaseUrl}/organizations/${subdomain}/tickets/${selectedTicket.id}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
          },
        }
      );
      console.log("Ticket details response:", response.data);
      const updatedTicket = response.data.ticket || response.data;
      if (updatedTicket?.id) {
        onUpdate(updatedTicket);
      } else {
        throw new Error("Invalid ticket data received");
      }
    } catch (err) {
      console.error("Fetch ticket details error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setTicketError(
        err.response?.status === 500
          ? "Server error: Unable to load ticket details. Please try again later."
          : err.response?.data?.error || "Failed to load ticket details."
      );
    } finally {
      setTicketLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedTicket || teamsLoading || !teams.length || ticketLoading) {
      console.log("Waiting for teams or ticket to load:", {
        teamsLoading,
        teamsCount: teams.length,
        ticketLoading,
        ticketId: selectedTicket?.id,
      });
      return;
    }

    const currentTeamId = String(selectedTicket.team?.id || "");
    const currentAssigneeId = String(selectedTicket.assignee?.id || "");

    console.log("Initializing ticket assignment:", {
      ticketId: selectedTicket.id,
      ticket_number: selectedTicket.ticket_number,
      status: selectedTicket.status,
      currentTeamId,
      currentTeamName: selectedTicket.team?.name || "None",
      currentAssigneeId,
      currentAssigneeName: selectedTicket.assignee?.name || "None",
      currentAssigneeEmail: selectedTicket.assignee?.email || "None",
      teamsAvailable: teams.map((t) => ({ id: t.id, name: t.name })),
    });

    if (
      selectedTicket.status === "assigned" &&
      (!currentTeamId || !currentAssigneeId)
    ) {
      setAssignmentWarning(
        "Warning: Ticket is marked as 'assigned' but lacks a team or assignee. Please reassign to continue."
      );
    } else {
      setAssignmentWarning("");
    }

    setSelectedTeamId(currentTeamId);
    setSelectedAssigneeId(currentAssigneeId);

    if (currentTeamId) {
      fetchTeamUsers(currentTeamId);
    }
  }, [teams, teamsLoading, ticketLoading, selectedTicket]);

  useEffect(() => {
    if (!selectedTeamId) {
      setTeamUsers([]);
      setSelectedAssigneeId("");
      return;
    }

    console.log("Team changed, fetching users for team:", selectedTeamId);
    fetchTeamUsers(selectedTeamId);
  }, [selectedTeamId]);

  const fetchComments = async () => {
    try {
      const response = await axios.get(
        `${apiBaseUrl}/organizations/${subdomain}/tickets/${selectedTicket.id}/comments`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
          },
        }
      );
      console.log("Comments response:", response.data);
      setComments(response.data.comments || []);
    } catch (err) {
      console.error("Fetch comments error:", err.response?.data || err.message);
    }
  };

  const fetchTeams = async () => {
    setTeamsLoading(true);
    try {
      console.log("Fetching teams...");
      const response = await axios.get(
        `${apiBaseUrl}/organizations/${subdomain}/teams`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
          },
        }
      );
      console.log("Teams response:", response.data);
      const teamsData = Array.isArray(response.data)
        ? response.data
        : response.data.teams || [];
      setTeams(teamsData);
    } catch (err) {
      console.error("Fetch teams error:", err.response?.data || err.message);
      alert("Failed to load teams. Please refresh and try again.");
    } finally {
      setTeamsLoading(false);
    }
  };

  const fetchTeamUsers = async (teamId) => {
    setTeamUsersLoading(true);
    try {
      console.log("Fetching users for team:", teamId);
      const response = await axios.get(
        `${apiBaseUrl}/organizations/${subdomain}/teams/${teamId}/users`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
          },
        }
      );
      console.log("Team users response:", response.data);
      const users = Array.isArray(response.data) ? response.data : [];
      setTeamUsers(users);
    } catch (err) {
      console.error(
        "Fetch team users error:",
        err.response?.data || err.message
      );
      setTeamUsers([]);
      alert("Failed to load team users. Please try selecting the team again.");
    } finally {
      setTeamUsersLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    if (
      selectedTicket.status === "assigned" &&
      (!selectedTicket.team?.id || !selectedTicket.assignee?.id)
    ) {
      alert(
        "Cannot close ticket without a team and assignee. Please reassign first."
      );
      return;
    }
    try {
      const response = await axios.put(
        `${apiBaseUrl}/organizations/${subdomain}/tickets/${selectedTicket.id}`,
        { ticket: { status: "closed" } },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const updatedTicket = response.data.ticket || response.data;
      if (!updatedTicket?.id) {
        console.error("Invalid ticket response:", response.data);
        throw new Error("Received invalid ticket data from server");
      }

      onUpdate(updatedTicket);
      onClose();
    } catch (err) {
      console.error("Close ticket error:", err.response?.data || err.message);
      alert("Failed to close ticket. Please try again.");
    }
  };

  const handleResolveNavigation = () => {
    if (
      selectedTicket.status === "assigned" &&
      (!selectedTicket.team?.id || !selectedTicket.assignee?.id)
    ) {
      alert(
        "Cannot resolve ticket without a team and assignee. Please reassign first."
      );
      return;
    }
    console.log("Navigating to resolve ticket:", {
      ticketId: selectedTicket.id,
      ticket_number: selectedTicket.ticket_number,
      subdomain,
      teamId: selectedTicket.team?.id,
      assigneeId: selectedTicket.assignee?.id,
    });
    navigate(`/resolve/${selectedTicket.ticket_number}`, {
      state: { ticket: selectedTicket, subdomain, authToken },
    });
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(
        `${apiBaseUrl}/organizations/${subdomain}/tickets/${selectedTicket.id}/comments`,
        { comment: { content: newComment } },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      console.log("Comment added:", response.data);
      setComments([...comments, response.data.comment]);
      setNewComment("");
    } catch (err) {
      console.error("Add comment error:", err.response?.data || err.message);
      alert("Failed to add comment. Please try again.");
    }
  };

  const handleReassignment = async () => {
    if (!selectedTeamId) {
      alert("Please select a team");
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        ticket: {
          team_id: selectedTeamId,
          assignee_id: selectedAssigneeId || null,
          status: selectedAssigneeId ? "assigned" : "open",
        },
      };

      console.log("Reassigning ticket with data:", updateData);

      const response = await axios.put(
        `${apiBaseUrl}/organizations/${subdomain}/tickets/${selectedTicket.id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      console.log("Reassignment response:", response.data);
      const updatedTicket = response.data.ticket || response.data;
      if (!updatedTicket?.id) {
        console.error("Invalid reassignment response:", response.data);
        throw new Error("Received invalid ticket data from server");
      }
      onUpdate(updatedTicket);
      alert("Ticket reassigned successfully!");
      setAssignmentWarning("");
      fetchTicketDetails();
    } catch (err) {
      console.error("Reassignment error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      let errorMessage = "Failed to reassign ticket. Please try again.";
      if (err.response?.status === 404) {
        errorMessage = err.response.data.error || "Resource not found.";
      } else if (err.response?.status === 422) {
        errorMessage =
          err.response.data.errors?.join(", ") ||
          err.response.data.error ||
          "Validation error.";
      } else if (err.response?.status === 403) {
        errorMessage =
          err.response.data.error ||
          "You are not authorized to reassign this ticket.";
      } else if (err.response?.status === 500) {
        errorMessage =
          "Server error: Unable to process reassignment. Please try again later.";
      }
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAttachment = async (attachmentId, filename) => {
    try {
      const response = await axios.get(
        `${apiBaseUrl}/organizations/${subdomain}/tickets/${selectedTicket.id}/download_attachment?attachment_id=${attachmentId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "Download attachment error:",
        err.response?.data || err.message
      );
      alert("Failed to download attachment. Please try again.");
    }
  };

  const renderAttachments = () => {
    if (
      !selectedTicket.attachments ||
      selectedTicket.attachments.length === 0
    ) {
      return (
        <div className="border p-2 bg-gray-50 text-gray-500">
          No attachments
        </div>
      );
    }

    return (
      <div className="border p-2 bg-gray-50">
        {selectedTicket.attachments.map((attachment, index) => (
          <div
            key={index}
            className="flex items-center justify-between mb-2 last:mb-0"
          >
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                {attachment.filename || `Attachment ${index + 1}`}
              </span>
              {attachment.size && (
                <span className="ml-2 text-xs text-gray-500">
                  ({formatFileSize(attachment.size)})
                </span>
              )}
            </div>
            <button
              onClick={() =>
                handleDownloadAttachment(attachment.id, attachment.filename)
              }
              className="bg-blue-500 text-white py-1 px-3 rounded text-sm hover:bg-blue-600 transition-colors"
            >
              Download
            </button>
          </div>
        ))}
      </div>
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toString() === "Invalid Date"
      ? "N/A"
      : date.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" });
  };

  if (!selectedTicket?.id || ticketError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 md:w-4/5 lg:w-3/4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Ticket Details: Error</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          <div className="p-3 bg-red-100 text-red-700 rounded-lg">
            {ticketError || "No valid ticket provided."}
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentTeamName = selectedTicket.team?.name || "No Team Assigned";
  const currentAssigneeName = selectedTicket.assignee?.name || "No Assignee";
  const currentAssigneeEmail = selectedTicket.assignee?.email || "No Email";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 md:w-4/5 lg:w-3/4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold">
            Ticket Details: {selectedTicket.ticket_number}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {assignmentWarning && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-lg">
            {assignmentWarning}
          </div>
        )}

        {ticketLoading && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-lg">
            Loading ticket details...
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="font-semibold block mb-1">
                Reported Date & Time
              </label>
              <div className="border p-2 bg-gray-50">
                {formatDate(selectedTicket.reported_at)}
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">
                Expected Resolve Time
              </label>
              <div className="border p-2 bg-gray-50">
                {formatDate(selectedTicket.resolution_due_at)}
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">SLA Status</label>
              <div className="border p-2 bg-gray-50">
                {selectedTicket.sla_breached ? "Breached" : "Within SLA"}
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">Ticket Status</label>
              <div className="border p-2 bg-gray-50">
                {selectedTicket.status || "N/A"}
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">Priority</label>
              <div className="border p-2 bg-gray-50">
                {selectedTicket.priority || "N/A"}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="font-semibold block mb-1">Caller's Name</label>
              <input
                type="text"
                className="border p-2 w-full bg-gray-50"
                value={`${selectedTicket.caller_name || "N/A"} ${
                  selectedTicket.caller_surname || ""
                }`.trim()}
                readOnly
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Caller's Email</label>
              <input
                type="text"
                className="border p-2 w-full bg-gray-50"
                value={selectedTicket.caller_email || "N/A"}
                readOnly
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Current Team</label>
              <input
                type="text"
                className="border p-2 w-full bg-gray-50"
                value={currentTeamName}
                readOnly
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">
                Current Assignee
              </label>
              <input
                type="text"
                className="border p-2 w-full bg-gray-50"
                value={
                  currentAssigneeName === "No Assignee"
                    ? "No Assignee"
                    : `${currentAssigneeName} (${currentAssigneeEmail})`
                }
                readOnly
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">
                Reassign to Team
              </label>
              {teamsLoading ? (
                <div className="border p-2 w-full bg-gray-100 text-gray-500">
                  Loading teams...
                </div>
              ) : (
                <select
                  value={selectedTeamId}
                  onChange={(e) => {
                    console.log("Team selected:", e.target.value);
                    setSelectedTeamId(e.target.value);
                    setSelectedAssigneeId("");
                  }}
                  className="border p-2 w-full"
                >
                  <option value="">Select Team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              )}
              {teams.length === 0 && !teamsLoading && (
                <div className="text-red-500 text-sm mt-1">
                  No teams available. Check your permissions or create a team.
                </div>
              )}
            </div>

            {selectedTeamId && (
              <div>
                <label className="font-semibold block mb-1">
                  Assign to User (Optional)
                </label>
                {teamUsersLoading ? (
                  <div className="border p-2 w-full bg-gray-100 text-gray-500">
                    Loading team members...
                  </div>
                ) : (
                  <select
                    value={selectedAssigneeId}
                    onChange={(e) => {
                      console.log("Assignee selected:", e.target.value);
                      setSelectedAssigneeId(e.target.value);
                    }}
                    className="border p-2 w-full"
                  >
                    <option value="">No Assignee</option>
                    {teamUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || "Unknown"} ({user.email || "No Email"})
                      </option>
                    ))}
                  </select>
                )}
                {teamUsers.length === 0 &&
                  !teamUsersLoading &&
                  selectedTeamId && (
                    <div className="text-orange-500 text-sm mt-1">
                      No users found in this team. You can assign the ticket to
                      the team without an assignee.
                    </div>
                  )}
              </div>
            )}

            {selectedTeamId && (
              <button
                onClick={handleReassignment}
                disabled={
                  isLoading || ticketLoading || teamsLoading || teamUsersLoading
                }
                className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-gray-400 w-full"
              >
                {isLoading ? "Reassigning..." : "Reassign Ticket"}
              </button>
            )}

            <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-100 rounded">
              <div>Teams loaded: {teams.length}</div>
              <div>
                Selected team:{" "}
                {selectedTeamId
                  ? teams.find((t) => t.id === selectedTeamId)?.name ||
                    "Unknown"
                  : "None"}
              </div>
              <div>Team users: {teamUsers.length}</div>
              <div>
                Selected assignee:{" "}
                {selectedAssigneeId
                  ? teamUsers.find((u) => u.id === selectedAssigneeId)?.name ||
                    "Unknown"
                  : "None"}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="font-semibold block mb-1">Subject</label>
            <input
              type="text"
              className="border p-2 w-full bg-gray-50"
              value={selectedTicket.title || "N/A"}
              readOnly
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Description</label>
            <textarea
              className="border p-2 w-full bg-gray-50"
              rows="4"
              value={selectedTicket.description || "N/A"}
              readOnly
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Attachments</label>
            {renderAttachments()}
          </div>

          <div>
            <label className="font-semibold block mb-1">Comments</label>
            <div className="border rounded max-h-60 overflow-y-auto mb-2">
              {comments.length === 0 ? (
                <div className="p-4 text-gray-500 text-center">
                  No comments yet
                </div>
              ) : (
                comments.map((comment, index) => (
                  <div key={index} className="border-b last:border-b-0 p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">
                        {comment.user?.name || "Unknown User"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="border p-2 flex-1 rounded"
                rows="2"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || ticketLoading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 self-start"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
          >
            Close Details
          </button>
          <button
            onClick={handleCloseTicket}
            disabled={ticketLoading}
            className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 disabled:bg-gray-400"
          >
            Close Ticket
          </button>
          <button
            onClick={handleResolveNavigation}
            disabled={ticketLoading}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            Resolve
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailsPopup;
