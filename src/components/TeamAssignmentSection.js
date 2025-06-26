import React from "react";

const TeamAssignmentSection = ({
  formData,
  teams,
  teamUsers,
  handleChange,
  loading,
}) => (
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
);

export default TeamAssignmentSection;
