// scripts/start-pocketbase.ps1 serves the frontend and API on this URL.
// Change it to your HTTPS PocketBase URL before deploying the frontend elsewhere.
window.APP_CONFIG = Object.freeze({
  pocketBaseUrl: window.location.origin,
  collection: "surgery_cases",
  authCollection: "users",
  requireAuth: false,
  writeRoles: ["admin", "editor"],
  refreshIntervalMs: 30000,
});
