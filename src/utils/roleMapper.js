export const mapBackendRoleToFrontend = (backendRole) => {
  const roleMap = {
    call_center_agent: "call_center_agent",
    service_desk_agent: "service_desk_agent",
    service_desk_tl: "team_leader",
    assignee_lvl_1_2: "level_1_2_support",
    assignee_lvl_3: "level_3_support",
    assignment_group_tl: "team_leader",
    service_desk_manager: "service_desk_manager",
    incident_manager: "incident_manager",
    problem_manager: "problem_manager",
    change_manager: "change_manager",
    department_manager: "department_manager",
    general_manager: "general_manager",
    sub_domain_admin: "domain_admin",
    domain_admin: "domain_admin",
    system_admin: "system_admin",
  };
  return roleMap[backendRole] || backendRole;
};
