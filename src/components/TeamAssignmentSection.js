import React from "react";

const TeamAssignmentSection = ({
  formData,
  teams,
  teamUsers,
  handleChange,
  loading,
}) => {
  const isTeamSelectable = !loading && teams.length > 0;
  const isAssigneeSelectable =
    !loading && formData.team_id && teamUsers.length > 0;

  console.log("Teams:", teams);
  console.log("Loading:", loading);
  console.log("formData.team_id:", formData.team_id);

  return (
    <div className="mt-4 grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium">Team *</label>
        <select
          name="team_id"
          value={String(formData.team_id || "")}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md"
          required
          disabled={!isTeamSelectable}
        >
          <option value="">Select a Team</option>
          {teams.map((team) => (
            <option key={team.id} value={String(team.id)}>
              {team.name}
            </option>
          ))}
        </select>
        {!isTeamSelectable && (
          <p className="text-sm text-red-500 mt-1">No teams available.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Assignee</label>
        <select
          name="assignee_id"
          value={String(formData.assignee_id || "")}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded-md"
          disabled={!isAssigneeSelectable}
        >
          <option value="">Select an Assignee</option>
          {teamUsers.map((user) => (
            <option key={user.id} value={String(user.id)}>
              {user.name || user.username}
            </option>
          ))}
        </select>
        {!isAssigneeSelectable && formData.team_id && (
          <p className="text-sm text-yellow-500 mt-1">
            No assignees available for the selected team.
          </p>
        )}
      </div>
    </div>
  );
};

export default TeamAssignmentSection;
