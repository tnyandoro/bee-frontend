// src/utils/rolePermissions.js

/**
 * Determines if a user can view all tickets.
 * Based on: User#can_view_all_tickets?
 * Roles: service_desk_agent, service_desk_tl, service_desk_manager, incident_manager, problem_manager, and all management roles
 */
const canViewAllTickets = (role) => {
  const allowedRoles = [
    "service_desk_agent",
    "service_desk_tl",
    "service_desk_manager",
    "incident_manager",
    "problem_manager",
    "assignee_lvl_1_2", // Can view assigned, but not all — depends on policy
    "assignee_lvl_3",
    "assignment_group_tl",
    "system_admin",
    "domain_admin",
    "sub_domain_admin",
    "general_manager",
    "department_manager",
  ];
  return allowedRoles.includes(role);
};

/**
 * Determines if a user can create a ticket.
 * Based on: User#can_create_ticket?
 * Roles: call_center_agent, service_desk_agent, service_desk_tl, service_desk_manager, incident_manager
 */
const canCreateTicket = (role) => {
  const allowedRoles = [
    "call_center_agent",
    "service_desk_agent",
    "service_desk_tl",
    "service_desk_manager",
    "incident_manager",
    "system_admin",
    "domain_admin",
    "sub_domain_admin",
    "general_manager",
    "department_manager",
  ];
  return allowedRoles.includes(role);
};

/**
 * Determines if a user can edit a ticket.
 * Based on: assignment and role.
 * - Management roles can always edit
 * - Assignee can edit if they are assigned
 * - Team leads and managers can edit
 */
const canEditTicket = (role, ticket, user) => {
  // Management and admin roles
  const isManager = [
    "system_admin",
    "domain_admin",
    "sub_domain_admin",
    "general_manager",
    "department_manager",
    "service_desk_manager",
    "incident_manager",
    "problem_manager",
  ].includes(role);

  if (isManager) return true;

  // Team leads
  if (role === "service_desk_tl" || role === "assignment_group_tl") return true;

  // Assignee can edit their own tickets
  if (ticket.assignee_id && ticket.assignee_id === user.id) return true;

  // Creator might be allowed (depends on policy)
  if (ticket.requester_id === user.id) return true;

  return false;
};

/**
 * Determines if a user can resolve a ticket.
 * Based on: User#can_resolve_tickets?
 */
const canResolveTicket = (role) => {
  return canCreateTicket(role); // Same roles can resolve
};

/**
 * Determines if a user can reassign a ticket.
 * Based on: User#can_reassign_tickets?
 */
const canReassignTicket = (role) => {
  return [
    "system_admin",
    "domain_admin",
    "department_manager",
    "general_manager",
    "service_desk_tl",
    "assignee_lvl_1_2",
  ].includes(role);
};

/**
 * Determines if a user can change ticket urgency.
 * Based on: User#can_change_urgency?
 */
const canChangeUrgency = (role) => {
  return [
    "service_desk_tl",
    "assignee_lvl_1_2",
    "department_manager",
    "general_manager",
    "domain_admin",
  ].includes(role);
};

/**
 * Determines if a user can access the admin dashboard.
 * Based on: User#can_access_admin_dashboard?
 */
const canAccessAdminDashboard = (role) => {
  return ["domain_admin", "sub_domain_admin"].includes(role);
};

/**
 * Determines if a user can access the main dashboard.
 * Based on: User#can_access_main_dashboard?
 */
const canAccessMainDashboard = (role) => {
  return !canAccessAdminDashboard(role);
};

/**
 * Determines if a user can create a problem.
 * Based on: User#can_create_problem?
 */
const canCreateProblem = (role) => {
  return [
    "assignee_lvl_3",
    "assignment_group_tl",
    "problem_manager",
    "system_admin",
    "domain_admin",
  ].includes(role);
};

/**
 * Determines if a user can access problem management.
 * Based on: User#can_access_problems_overview?
 */
const canAccessProblems = (role) => {
  return [
    "assignee_lvl_1_2",
    "assignee_lvl_3",
    "assignment_group_tl",
    "service_desk_manager",
    "incident_manager",
    "problem_manager",
    "system_admin",
    "domain_admin",
    "general_manager",
    "department_manager",
  ].includes(role);
};

/**
 * Determines if a user can manage users.
 * Based on: User#can_manage_users?
 */
const canManageUsers = (role) => {
  return [
    "department_manager",
    "general_manager",
    "system_admin",
    "domain_admin",
  ].includes(role);
};

export {
  canViewAllTickets,
  canCreateTicket,
  canEditTicket,
  canResolveTicket,
  canReassignTicket,
  canChangeUrgency,
  canAccessAdminDashboard,
  canAccessMainDashboard,
  canCreateProblem,
  canAccessProblems,
  canManageUsers,
};
