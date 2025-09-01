import React from "react";

const TeamAssignmentSection = ({
  formData,
  teams,
  teamUsers,
  handleChange,
  loading,
}) => {
  const hasTeams = Array.isArray(teams) && teams.length > 0;
  const hasTeamUsers = Array.isArray(teamUsers) && teamUsers.length > 0;
  const teamSelected = !!formData.team_id;

  return (
    <div className="mt-4 grid grid-cols-2 gap-4">
      {/* Team Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Team *
        </label>
        <select
          name="team_id"
          value={String(formData.team_id || "")}
          onChange={handleChange}
          className="w-full border border-gray-300 px-3 py-2 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
          disabled={!hasTeams || loading}
        >
          <option value="">Select a Team</option>
          {hasTeams &&
            teams.map((team) => (
              <option key={team?.id} value={String(team?.id)}>
                {team?.name || "Unnamed Team"} ({team?.user_count || 0} members)
              </option>
            ))}
        </select>
        {!hasTeams && !loading && (
          <p className="text-sm text-red-500 mt-1">No teams available.</p>
        )}
        {loading && (
          <p className="text-sm text-gray-500 mt-1">Loading teams...</p>
        )}
      </div>

      {/* Assignee Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assignee (Optional)
        </label>
        <select
          name="assignee_id"
          value={String(formData.assignee_id || "")}
          onChange={handleChange}
          className="w-full border border-gray-300 px-3 py-2 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={!teamSelected || loading}
        >
          <option value="">Auto-assign to least busy team member</option>
          {hasTeamUsers &&
            teamUsers.map((user) => (
              <option key={user?.id} value={String(user?.id)}>
                {user?.name || user?.username || "Unnamed User"} ({user?.email})
              </option>
            ))}
        </select>
        {teamSelected && !hasTeamUsers && !loading && (
          <p className="text-sm text-yellow-500 mt-1">
            No users assigned to this team. Ticket will be auto-assigned.
          </p>
        )}
        {teamSelected && !formData.assignee_id && !loading && (
          <p className="text-sm text-blue-500 mt-1">
            Will auto-assign to the least busy team member upon submission.
          </p>
        )}
        {loading && teamSelected && (
          <p className="text-sm text-gray-500 mt-1">Loading team members...</p>
        )}
      </div>
    </div>
  );
};

export default TeamAssignmentSection;
