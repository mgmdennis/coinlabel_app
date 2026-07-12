// Centralized API base URL.
//
// - In development the Vite dev server proxies "/api" to the Express backend
//   on :5001 (see vite.config.js), but we keep the explicit localhost origin
//   for direct fetches too.
// - In production the SPA is served by the same Express server, so a
//   root-relative "/api" prefix resolves correctly.
// - VITE_API_URL can override both if the frontend is ever hosted separately.
export const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5001/api' : '/api');

// Origin (without the trailing "/api") used by callers that build their own
// "/api/..." paths, such as the image proxy. Empty string keeps them
// root-relative so the dev proxy / same-origin production server handles them.
export const API_ORIGIN = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : '';
