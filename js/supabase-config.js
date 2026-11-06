/**
 * supabase-config.js — Backward Compatibility Bridge
 * Migrated to Firebase Firestore & Cloudinary architecture.
 * Redirects all operations to window.AivoraBackend / window.AivoraFirebase.
 */
(function(window) {
  'use strict';
  // If firebase-config.js was already loaded, ensure window.AivoraSupabase points to AivoraBackend
  if (window.AivoraBackend) {
    window.AivoraSupabase = window.AivoraBackend;
  }
})(window);
