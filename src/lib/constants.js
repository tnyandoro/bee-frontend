const port = window.location.port || "3000"; // Use the current port or default to 3000
export const baseUrl = `http://${window.location.hostname}:${port}/api/v1`;
