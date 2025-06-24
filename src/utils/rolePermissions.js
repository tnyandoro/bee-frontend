const managementRoles = [
  "system_admin",
  "domain_admin",
  "general_manager",
  "department_manager",
];

const ticketCreatorRoles = [
  ...managementRoles,
  "call_center_agent",
  "service_desk_agent",
];

const canViewAllTickets = (role) => managementRoles.includes(role);

const canCreateTicket = (role) => ticketCreatorRoles.includes(role);

const canEditTicket = (role, ticket, user) => {
  return managementRoles.includes(role) || ticket.assignee_id === user.id;
};

export { canViewAllTickets, canCreateTicket, canEditTicket };
