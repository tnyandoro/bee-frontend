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
        <label className="block text-sm font-medium">Team *</label>
        <select
          name="team_id"
          value={String(formData.team_id || "")}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md bg-white"
          required
          disabled={!hasTeams}
        >
          <option value="">Select a Team</option>
          {teams.map((team) => (
            <option key={team.id} value={String(team.id)}>
              {team.name}
            </option>
          ))}
        </select>
        {!hasTeams && (
          <p className="text-sm text-red-500 mt-1">No teams available.</p>
        )}
      </div>

      {/* Assignee Selection */}
      <div>
        <label className="block text-sm font-medium">Assignee</label>
        <select
          name="assignee_id"
          value={String(formData.assignee_id || "")}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md bg-white"
          disabled={!teamSelected || !hasTeamUsers}
        >
          <option value="">Select an Assignee</option>
          {teamUsers.map((user) => (
            <option key={user.id} value={String(user.id)}>
              {user.name || user.username}
            </option>
          ))}
        </select>
        {teamSelected && !hasTeamUsers && (
          <p className="text-sm text-yellow-500 mt-1">
            No users assigned to this team.
          </p>
        )}
      </div>
    </div>
  );
};

export default TeamAssignmentSection;
