/**
 * supabase-client.js — Compatibility bridge for Firebase & Cloudinary
 * All operations now execute natively through Firebase Firestore & Cloudinary CDN.
 */
// Deprecated: Migrated to js/firebase-config.js
if (typeof window !== 'undefined' && window.HorizonBackend) {
  window.SupabaseBackend = window.HorizonBackend;
}
