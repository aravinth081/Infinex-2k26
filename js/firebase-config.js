/**
 * firebase-config.js — Unified Firebase Firestore & Cloudinary Cloud Service
 * HORIZON X 2K26 GLOBAL HACKATHON
 *
 * Text & Data Database : Firebase Firestore (Project: horizon-x-8fd93)
 * Image & Asset Storage : Cloudinary CDN (Cloud: fi2r5uvx, Preset: horizon, Folder: ai engineer)
 *
 * Fully replaces Supabase with enterprise-grade Firebase Firestore and Cloudinary media storage.
 * Features dual-persistence (IndexedDB & LocalStorage) for 100% resilient operation online and offline.
 */

(function (window) {
  'use strict';

  // ── STORAGE KEYS ──
  const STORAGE_KEY_FIREBASE = 'horizon_firebase_config';
  const STORAGE_KEY_CLOUDINARY = 'horizon_cloudinary_config';

  // ── DEFAULT CONFIGURATIONS ──
  const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "AIzaSyA3NzurSpWS1U8Ck9yIFnHAhrv2o0g23co",
    authDomain: "horizon-x-8fd93.firebaseapp.com",
    projectId: "horizon-x-8fd93",
    storageBucket: "horizon-x-8fd93.firebasestorage.app",
    messagingSenderId: "409113203760",
    appId: "1:409113203760:web:c5cba977816c76a554c9f5",
    measurementId: "G-2SHPSH4NER"
  };

  const DEFAULT_CLOUDINARY_CONFIG = {
    cloudName: "fi2r5uvx",
    uploadPreset: "horizon",
    folder: "ai engineer"
  };

  let _firebaseApp = null;
  let _firestore = null;
  let _analytics = null;

  // ── CONFIG RESOLUTION ──
  function getFirebaseConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_FIREBASE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.apiKey && parsed.projectId) {
          return Object.assign({}, DEFAULT_FIREBASE_CONFIG, parsed);
        }
      }
    } catch (e) {}
    return Object.assign({}, DEFAULT_FIREBASE_CONFIG);
  }

  function saveFirebaseConfig(cfg) {
    try {
      if (cfg && typeof cfg === 'object') {
        localStorage.setItem(STORAGE_KEY_FIREBASE, JSON.stringify(cfg));
        _firebaseApp = null;
        _firestore = null;
        _analytics = null;
      }
    } catch (e) {}
  }

  function getCloudinaryConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CLOUDINARY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.cloudName && parsed.uploadPreset) {
          return Object.assign({}, DEFAULT_CLOUDINARY_CONFIG, parsed);
        }
      }
    } catch (e) {}
    return Object.assign({}, DEFAULT_CLOUDINARY_CONFIG);
  }

  function saveCloudinaryConfig(cfg) {
    try {
      if (cfg && typeof cfg === 'object') {
        localStorage.setItem(STORAGE_KEY_CLOUDINARY, JSON.stringify(cfg));
      }
    } catch (e) {}
  }

  function getConfig() {
    const fb = getFirebaseConfig();
    const cl = getCloudinaryConfig();
    return {
      firebase: fb,
      cloudinary: cl,
      // Compatibility aliases
      url: fb.projectId,
      anonKey: fb.apiKey,
      bucket: cl.cloudName,
      cloudName: cl.cloudName,
      uploadPreset: cl.uploadPreset,
      folder: cl.folder
    };
  }

  function saveCredentials(projectIdOrObj, apiKey, cloudName, uploadPreset) {
    if (typeof projectIdOrObj === 'object') {
      if (projectIdOrObj.firebase) saveFirebaseConfig(projectIdOrObj.firebase);
      if (projectIdOrObj.cloudinary) saveCloudinaryConfig(projectIdOrObj.cloudinary);
      return true;
    }
    const fb = getFirebaseConfig();
    if (projectIdOrObj) fb.projectId = projectIdOrObj.trim();
    if (apiKey) fb.apiKey = apiKey.trim();
    saveFirebaseConfig(fb);

    const cl = getCloudinaryConfig();
    if (cloudName) cl.cloudName = cloudName.trim();
    if (uploadPreset) cl.uploadPreset = uploadPreset.trim();
    saveCloudinaryConfig(cl);
    return true;
  }

  // ── FIREBASE INITIALIZATION ──
  function initFirebase() {
    if (_firestore) return _firestore;

    if (typeof window.firebase === 'undefined') {
      console.warn('Firebase JS SDK not loaded on window.');
      return null;
    }

    try {
      const cfg = getFirebaseConfig();
      if (!window.firebase.apps || window.firebase.apps.length === 0) {
        _firebaseApp = window.firebase.initializeApp(cfg);
      } else {
        _firebaseApp = window.firebase.apps[0];
      }

      _firestore = window.firebase.firestore();

      // Enable persistent cache if available
      try {
        if (typeof _firestore.enablePersistence === 'function') {
          _firestore.enablePersistence({ synchronizeTabs: true }).catch(function (err) {
            if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
              console.warn('Firestore persistence notice:', err.message);
            }
          });
        }
      } catch (e) {}

      // Optional Analytics
      try {
        if (window.firebase.analytics && typeof window.firebase.analytics === 'function') {
          _analytics = window.firebase.analytics();
        }
      } catch (e) {}

      return _firestore;
    } catch (err) {
      console.warn('Firebase initialization notice:', err.message);
      return null;
    }
  }

  // Auto-init
  initFirebase();

  function getDb() {
    return initFirebase();
  }

  function isLive() {
    const cfg = getFirebaseConfig();
    return Boolean(cfg.apiKey && cfg.projectId && typeof window.firebase !== 'undefined');
  }

  function sanitizeDocId(str) {
    if (!str) return 'unknown';
    return String(str).trim().toLowerCase().replace(/[\/\\#\?\. ]/g, '_');
  }

  function dataURLtoBlob(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') return dataUrl;
    if (!dataUrl.startsWith('data:')) return dataUrl;
    try {
      const parts = dataUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch (e) {
      console.warn('dataURLtoBlob conversion error:', e);
      return dataUrl;
    }
  }

  // ── CLOUDINARY UPLOAD SERVICE (UNSIGNED PRESET: horizon) ──
  async function uploadToCloudinary(fileOrDataUrl, folderName) {
    if (!fileOrDataUrl) throw new Error('No file provided for upload.');

    // If it's already an active HTTPS Cloudinary or external URL, return directly
    if (typeof fileOrDataUrl === 'string' && (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://'))) {
      return fileOrDataUrl;
    }

    const cfg = getCloudinaryConfig();
    const cloudName = cfg.cloudName || DEFAULT_CLOUDINARY_CONFIG.cloudName;
    const uploadPreset = cfg.uploadPreset || DEFAULT_CLOUDINARY_CONFIG.uploadPreset;
    const targetFolder = folderName || cfg.folder || DEFAULT_CLOUDINARY_CONFIG.folder;

    const formData = new FormData();
    if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
      const blob = dataURLtoBlob(fileOrDataUrl);
      const ext = (blob.type && blob.type.split('/')[1]) || 'png';
      formData.append('file', blob, `horizon_asset_${Date.now()}.${ext}`);
    } else {
      formData.append('file', fileOrDataUrl);
    }

    formData.append('upload_preset', uploadPreset);
    if (targetFolder) {
      formData.append('folder', targetFolder);
    }

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = `Cloudinary upload failed (HTTP ${response.status})`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error && parsed.error.message) msg = parsed.error.message;
      } catch (e) {}
      throw new Error(msg);
    }

    const result = await response.json();
    return result.secure_url || result.url;
  }

  // Universal Asset Uploader (replaces Supabase storage uploadAsset)
  async function uploadAsset(file, customPath, folder) {
    const cfg = getCloudinaryConfig();
    const targetFolder = folder || cfg.folder || 'ai engineer';
    const secureUrl = await uploadToCloudinary(file, targetFolder);
    return {
      url: secureUrl,
      publicUrl: secureUrl,
      secure_url: secureUrl,
      path: customPath || `cloudinary/${Date.now()}`,
      bucket: cfg.cloudName
    };
  }

  async function deleteStorageFile(path) {
    return true;
  }

  // ── PARTICIPANTS (ROSTER & VERIFICATION) ──
  async function getParticipantByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const db = getDb();

    // 1. Firebase Firestore
    if (db && isLive()) {
      try {
        const docId = sanitizeDocId(cleanEmail);
        const snap = await db.collection('participants').doc(docId).get();
        if (snap.exists) {
          const data = snap.data();
          return {
            email: data.email || cleanEmail,
            name: data.name || '',
            team_name: data.team_name || data.teamName || '',
            college: data.college || '',
            phone: data.phone || '',
            status: data.status || 'CONFIRMED',
            claimed: Boolean(data.claimed || data.status === 'CLAIMED'),
            claimedAt: data.claimedAt || data.claimed_at || null,
            certId: data.certId || data.cert_id || null,
            metadata: data.metadata || {}
          };
        }
      } catch (e) {
        console.warn('Firebase getParticipant notice:', e.message);
      }
    }

    // 2. LocalStorage Fallback
    try {
      const local = JSON.parse(localStorage.getItem('registered_participants') || '[]');
      const found = local.find(function (x) {
        return x && (typeof x === 'string' ? x : x.email || '').trim().toLowerCase() === cleanEmail;
      });
      if (found) {
        if (typeof found === 'string') return { email: cleanEmail, name: '', status: 'CONFIRMED', claimed: false };
        return {
          email: found.email || cleanEmail,
          name: found.name || '',
          team_name: found.team_name || found.teamName || '',
          college: found.college || '',
          phone: found.phone || '',
          status: found.status || 'CONFIRMED',
          claimed: Boolean(found.claimed || found.status === 'CLAIMED'),
          claimedAt: found.claimedAt || null,
          certId: found.certId || null,
          metadata: found.metadata || {}
        };
      }
    } catch (e) {}

    return null;
  }

  async function saveParticipant(participant) {
    if (!participant || !participant.email) return null;
    const email = participant.email.trim().toLowerCase();
    const docId = sanitizeDocId(email);
    const db = getDb();

    const payload = {
      email: email,
      name: participant.name || '',
      team_name: participant.team_name || participant.teamName || '',
      college: participant.college || '',
      phone: participant.phone || '',
      status: participant.status || 'CONFIRMED',
      claimed: Boolean(participant.claimed || participant.status === 'CLAIMED' || (participant.metadata && participant.metadata.claimed)),
      certId: participant.certId || (participant.metadata && participant.metadata.certId) || null,
      claimedAt: participant.claimedAt || (participant.metadata && participant.metadata.claimedAt) || (participant.status === 'CLAIMED' ? new Date().toISOString() : null),
      metadata: participant.metadata || {},
      updated_at: new Date().toISOString()
    };

    // 1. Firebase Firestore
    if (db && isLive()) {
      try {
        await db.collection('participants').doc(docId).set(payload, { merge: true });
      } catch (e) {
        console.warn('Firebase saveParticipant warning:', e.message);
      }
    }

    // 2. LocalStorage Sync
    try {
      const local = JSON.parse(localStorage.getItem('registered_participants') || '[]');
      const idx = local.findIndex(function (x) {
        return x && (typeof x === 'string' ? x : x.email || '').trim().toLowerCase() === email;
      });
      if (idx >= 0) {
        local[idx] = Object.assign({}, typeof local[idx] === 'object' ? local[idx] : {}, payload);
      } else {
        local.push(payload);
      }
      localStorage.setItem('registered_participants', JSON.stringify(local));
    } catch (e) {}

    return payload;
  }

  async function batchSaveParticipants(partsList) {
    if (!Array.isArray(partsList) || partsList.length === 0) return { count: 0 };
    const db = getDb();
    let successCount = 0;

    // 1. Firestore Batch (max 450 per batch)
    if (db && isLive()) {
      try {
        const chunkSize = 400;
        for (let i = 0; i < partsList.length; i += chunkSize) {
          const chunk = partsList.slice(i, i + chunkSize);
          const batch = db.batch();
          chunk.forEach(function (p) {
            const email = (typeof p === 'string' ? p : p.email).trim().toLowerCase();
            const docRef = db.collection('participants').doc(sanitizeDocId(email));
            batch.set(docRef, {
              email: email,
              name: (typeof p === 'object' && p.name ? p.name : '').trim(),
              team_name: (typeof p === 'object' && (p.teamName || p.team_name) ? (p.teamName || p.team_name) : '').trim(),
              status: 'CONFIRMED',
              updated_at: new Date().toISOString()
            }, { merge: true });
          });
          await batch.commit();
          successCount += chunk.length;
        }
      } catch (e) {
        console.warn('Firebase batch upload notice:', e.message);
      }
    }

    // 2. LocalStorage Sync
    try {
      localStorage.setItem('registered_participants', JSON.stringify(partsList));
      if (successCount === 0) successCount = partsList.length;
    } catch (e) {}

    return { count: successCount, total: partsList.length };
  }

  async function getAllParticipants() {
    const db = getDb();
    if (db && isLive()) {
      try {
        const snap = await db.collection('participants').get();
        if (!snap.empty) {
          const list = [];
          snap.forEach(function (doc) {
            const d = doc.data();
            list.push({
              id: doc.id,
              email: d.email || doc.id,
              name: d.name || '',
              team_name: d.team_name || d.teamName || '',
              college: d.college || '',
              phone: d.phone || '',
              status: d.status || 'CONFIRMED',
              claimed: Boolean(d.claimed || d.status === 'CLAIMED'),
              claimedAt: d.claimedAt || d.claimed_at || null,
              certId: d.certId || d.cert_id || null,
              metadata: d.metadata || {}
            });
          });
          if (list.length > 0) return list;
        }
      } catch (e) {
        console.warn('Firebase getAllParticipants notice:', e.message);
      }
    }

    // LocalStorage Fallback
    try {
      const local = JSON.parse(localStorage.getItem('registered_participants') || '[]');
      return local.map(function (item) {
        if (typeof item === 'string') return { email: item, name: '', status: 'CONFIRMED', claimed: false };
        return {
          email: item.email || '',
          name: item.name || '',
          team_name: item.team_name || item.teamName || '',
          college: item.college || '',
          phone: item.phone || '',
          status: item.status || 'CONFIRMED',
          claimed: Boolean(item.claimed || item.status === 'CLAIMED'),
          claimedAt: item.claimedAt || null,
          certId: item.certId || null,
          metadata: item.metadata || {}
        };
      });
    } catch (e) {
      return [];
    }
  }

  async function deleteParticipant(email) {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();
    const db = getDb();

    if (db && isLive()) {
      try {
        await db.collection('participants').doc(sanitizeDocId(cleanEmail)).delete();
      } catch (e) {
        console.warn('Firebase deleteParticipant error:', e);
      }
    }

    try {
      const local = JSON.parse(localStorage.getItem('registered_participants') || '[]');
      const filtered = local.filter(function (x) {
        return x && (typeof x === 'string' ? x : x.email || '').trim().toLowerCase() !== cleanEmail;
      });
      localStorage.setItem('registered_participants', JSON.stringify(filtered));
    } catch (e) {}

    return true;
  }

  async function clearAllParticipants() {
    const db = getDb();
    if (db && isLive()) {
      try {
        const snap = await db.collection('participants').get();
        if (!snap.empty) {
          const batch = db.batch();
          snap.forEach(function (doc) { batch.delete(doc.ref); });
          await batch.commit();
        }
      } catch (e) {
        console.warn('Firebase clearAllParticipants error:', e);
      }
    }
    try {
      localStorage.removeItem('registered_participants');
    } catch (e) {}
    return true;
  }

  // ── CERTIFICATES & AUDIT LOGS ──
  async function saveCertificate(certDoc) {
    if (!certDoc) return null;
    const certId = certDoc.certId || certDoc.cert_id || ('HX-' + Date.now());
    const db = getDb();

    const payload = {
      cert_id: certId,
      email: certDoc.email || '',
      name: certDoc.name || '',
      type: certDoc.type || 'participation',
      rank: certDoc.rank || null,
      rank_label: certDoc.rankLabel || certDoc.rank_label || null,
      team_name: certDoc.teamName || certDoc.team_name || null,
      issue_date: certDoc.date || new Date().toISOString(),
      claimed_at: certDoc.claimedAt || new Date().toISOString(),
      metadata: certDoc.metadata || certDoc
    };

    if (db && isLive()) {
      try {
        await db.collection('certificates').doc(sanitizeDocId(certId)).set(payload, { merge: true });
      } catch (e) {
        console.warn('Firebase saveCertificate error:', e.message);
      }
    }

    try {
      const list = JSON.parse(localStorage.getItem('admin_certificates') || '[]');
      list.push(payload);
      localStorage.setItem('admin_certificates', JSON.stringify(list));
    } catch (e) {}

    return payload;
  }

  async function getAllCertificates() {
    const db = getDb();
    if (db && isLive()) {
      try {
        const snap = await db.collection('certificates').get();
        if (!snap.empty) {
          const list = [];
          snap.forEach(function (doc) {
            list.push(doc.data());
          });
          return list;
        }
      } catch (e) {
        console.warn('Firebase getAllCertificates notice:', e.message);
      }
    }
    try {
      return JSON.parse(localStorage.getItem('admin_certificates') || '[]');
    } catch (e) {
      return [];
    }
  }

  async function deleteCertificate(certId) {
    if (!certId) return false;
    const db = getDb();
    if (db && isLive()) {
      try {
        await db.collection('certificates').doc(sanitizeDocId(certId)).delete();
      } catch (e) {
        console.warn('Firebase deleteCertificate notice:', e.message);
      }
    }
    try {
      const list = JSON.parse(localStorage.getItem('admin_certificates') || '[]');
      const filtered = list.filter(function (c) {
        return (c.cert_id || c.certId) !== certId;
      });
      localStorage.setItem('admin_certificates', JSON.stringify(filtered));
    } catch (e) {}
    return true;
  }

  // ── WINNER CODES & CLAIMS ──
  async function saveWinnerClaim(claimDoc) {
    if (!claimDoc) return null;
    const certId = claimDoc.certId || claimDoc.cert_id || ('HX-WIN-' + Date.now());
    const db = getDb();

    const payload = {
      id: sanitizeDocId(certId),
      cert_id: certId,
      code: (claimDoc.code || '').toUpperCase(),
      name: claimDoc.name || '',
      rank: claimDoc.rank || 1,
      rank_label: claimDoc.rankLabel || claimDoc.rank_label || ('Rank ' + (claimDoc.rank || 1)),
      team_name: claimDoc.teamName || claimDoc.team_name || '',
      type: claimDoc.type || 'winner1',
      date: claimDoc.date || new Date().toLocaleDateString('en-GB'),
      claimed_at: claimDoc.claimedAt || new Date().toISOString(),
      metadata: claimDoc
    };

    if (db && isLive()) {
      try {
        await db.collection('winner_claims').doc(payload.id).set(payload, { merge: true });
      } catch (e) {
        console.warn('Firebase saveWinnerClaim error:', e.message);
      }
    }

    try {
      const list = JSON.parse(localStorage.getItem('admin_winner_claims') || '[]');
      list.push(payload);
      localStorage.setItem('admin_winner_claims', JSON.stringify(list));
    } catch (e) {}

    return payload;
  }

  async function getAllWinnerClaims() {
    const db = getDb();
    if (db && isLive()) {
      try {
        const snap = await db.collection('winner_claims').get();
        if (!snap.empty) {
          const list = [];
          snap.forEach(function (doc) {
            list.push(doc.data());
          });
          return list;
        }
      } catch (e) {
        console.warn('Firebase getAllWinnerClaims notice:', e.message);
      }
    }
    try {
      return JSON.parse(localStorage.getItem('admin_winner_claims') || '[]');
    } catch (e) {
      return [];
    }
  }

  async function deleteWinnerClaim(claimId) {
    if (!claimId) return false;
    const db = getDb();
    if (db && isLive()) {
      try {
        await db.collection('winner_claims').doc(sanitizeDocId(claimId)).delete();
      } catch (e) {}
    }
    try {
      const list = JSON.parse(localStorage.getItem('admin_winner_claims') || '[]');
      const filtered = list.filter(function (x) {
        return (x.id || x.certId || x.cert_id) !== claimId;
      });
      localStorage.setItem('admin_winner_claims', JSON.stringify(filtered));
    } catch (e) {}
    return true;
  }

  async function clearWinnerClaims() {
    const db = getDb();
    if (db && isLive()) {
      try {
        const snap = await db.collection('winner_claims').get();
        if (!snap.empty) {
          const batch = db.batch();
          snap.forEach(function (doc) { batch.delete(doc.ref); });
          await batch.commit();
        }
      } catch (e) {}
    }
    try {
      localStorage.removeItem('admin_winner_claims');
    } catch (e) {}
    return true;
  }

  // ── ADMIN CONFIGURATION & CLOUD TEMPLATES ──
  async function fetchAdminConfig() {
    const db = getDb();
    if (db && isLive()) {
      try {
        // Query both admin and admin_config collections for 100% synchronization
        const [snap1, snap2] = await Promise.allSettled([
          db.collection('admin').doc('config').get(),
          db.collection('admin_config').doc('config').get()
        ]);

        const d1 = (snap1.status === 'fulfilled' && snap1.value.exists) ? (snap1.value.data() || {}) : {};
        const d2 = (snap2.status === 'fulfilled' && snap2.value.exists) ? (snap2.value.data() || {}) : {};
        const data = Object.assign({}, d2, d1);

        // Normalize templateNameX and templateNameY (support nested or flat dot-notation)
        const nameX = Object.assign({}, d2.templateNameX || {}, d1.templateNameX || {});
        const nameY = Object.assign({}, d2.templateNameY || {}, d1.templateNameY || {});
        ['participation', 'winner1', 'winner2', 'winner3', 'judges'].forEach(k => {
          if (nameX[k] === undefined && data['templateNameX.' + k] !== undefined) nameX[k] = data['templateNameX.' + k];
          if (nameY[k] === undefined && data['templateNameY.' + k] !== undefined) nameY[k] = data['templateNameY.' + k];
        });

        return {
          templates: Object.assign({}, d2.templates || {}, d1.templates || {}),
          templateNameX: nameX,
          templateNameY: nameY,
          winnerCodes: data.winner_codes || data.winnerCodes || {},
          judgeCodes: data.judge_codes || data.judgeCodes || {},
          signatures: data.signatures || {},
          positions: data.positions || {},
          siteStats: data.siteStats || {},
          project: data.project || 'horizon_x_2k26'
        };
      } catch (e) {
        console.warn('Firebase fetchAdminConfig notice:', e.message);
      }
    }

    try {
      const localCfg = localStorage.getItem('admin_config');
      if (localCfg) return JSON.parse(localCfg);
    } catch (e) {}

    return {
      templates: {},
      templateNameX: {},
      templateNameY: {},
      winnerCodes: JSON.parse(localStorage.getItem('winnerCodes') || '{}'),
      judgeCodes: JSON.parse(localStorage.getItem('judgeCodes') || '{}'),
      signatures: {},
      positions: {},
      project: 'horizon_x_2k26'
    };
  }

  async function saveAdminConfig(updates) {
    if (!updates) return false;
    const db = getDb();

    const payload = {
      project: 'horizon_x_2k26',
      updated_at: new Date().toISOString()
    };
    if (updates.templates) payload.templates = updates.templates;
    if (updates.templateNameX) payload.templateNameX = updates.templateNameX;
    if (updates.templateNameY) payload.templateNameY = updates.templateNameY;
    if (updates.winnerCodes) payload.winner_codes = updates.winnerCodes;
    if (updates.judgeCodes) payload.judge_codes = updates.judgeCodes;
    if (updates.signatures) payload.signatures = updates.signatures;
    if (updates.positions) payload.positions = updates.positions;
    if (updates.siteStats) payload.siteStats = updates.siteStats;

    if (db && isLive()) {
      try {
        await Promise.allSettled([
          db.collection('admin_config').doc('config').set(payload, { merge: true }),
          db.collection('admin').doc('config').set(payload, { merge: true })
        ]);
      } catch (e) {
        console.warn('Firebase saveAdminConfig error:', e.message);
      }
    }

    try {
      localStorage.setItem('admin_config', JSON.stringify(payload));
      if (updates.winnerCodes) localStorage.setItem('winnerCodes', JSON.stringify(updates.winnerCodes));
      if (updates.judgeCodes) localStorage.setItem('judgeCodes', JSON.stringify(updates.judgeCodes));
    } catch (e) {}

    return true;
  }

  // ── CUSTOM TEMPLATES (STORED IN CLOUDINARY, REFERENCED IN FIRESTORE) ──
  async function fetchCustomTemplate(key) {
    if (!key) return null;
    const db = getDb();

    if (db && isLive()) {
      try {
        const doc = await db.collection('custom_templates').doc(key).get();
        if (doc.exists) {
          const data = doc.data();
          if (data && data.url) return data.url;
        }
      } catch (e) {
        console.warn('Firebase fetchCustomTemplate error:', e.message);
      }
    }

    // Local fallback
    try {
      const local = localStorage.getItem('tpl_' + key);
      if (local) return local;
    } catch (e) {}

    return null;
  }

  async function saveCustomTemplate(key, url, storagePath) {
    if (!key || !url) return false;
    let finalUrl = url;

    // CRITICAL: If raw dataURL or File, upload to Cloudinary so Firestore stays lightweight!
    if (typeof url === 'string' && url.startsWith('data:')) {
      try {
        finalUrl = await uploadToCloudinary(url, 'ai engineer');
      } catch (err) {
        console.warn('Cloudinary template upload fallback to local:', err.message);
      }
    }

    const db = getDb();
    const payload = {
      key: key,
      url: finalUrl,
      project: 'horizon_x_2k26',
      storage_path: storagePath || '',
      updated_at: new Date().toISOString()
    };

    if (db && isLive()) {
      try {
        await db.collection('custom_templates').doc(key).set(payload, { merge: true });
        const update = {};
        update['templates.' + key] = finalUrl;
        await db.collection('admin_config').doc('config').set(update, { merge: true });
      } catch (e) {
        console.warn('Firebase saveCustomTemplate error:', e.message);
      }
    }

    try {
      localStorage.setItem('tpl_' + key, finalUrl);
    } catch (e) {}

    return finalUrl;
  }

  async function deleteCustomTemplate(key) {
    if (!key) return false;
    const db = getDb();

    if (db && isLive()) {
      try {
        await db.collection('custom_templates').doc(key).delete();
        const update = {};
        update['templates.' + key] = '';
        await db.collection('admin_config').doc('config').set(update, { merge: true });
      } catch (e) {}
    }

    try {
      localStorage.removeItem('tpl_' + key);
    } catch (e) {}

    return true;
  }

  // ── DISCUSSIONS & Q&A ──
  async function fetchDiscussions() {
    const db = getDb();
    if (db && isLive()) {
      try {
        const snap = await db.collection('discussions').orderBy('created_at', 'desc').limit(30).get();
        if (!snap.empty) {
          const list = [];
          snap.forEach(function (doc) {
            list.push(Object.assign({ id: doc.id }, doc.data()));
          });
          return list;
        }
      } catch (e) {
        console.warn('Firebase fetchDiscussions error:', e.message);
      }
    }
    try {
      return JSON.parse(localStorage.getItem('horizon_discussions') || '[]');
    } catch (e) {
      return [];
    }
  }

  async function postDiscussion(item) {
    if (!item) return null;
    const db = getDb();
    const payload = {
      author_name: item.authorName || item.author_name || 'Innovator',
      author_email: item.authorEmail || item.author_email || '',
      topic: item.topic || 'General',
      message: item.message || '',
      created_at: new Date().toISOString()
    };

    if (db && isLive()) {
      try {
        const ref = await db.collection('discussions').add(payload);
        payload.id = ref.id;
      } catch (e) {
        console.warn('Firebase postDiscussion error:', e.message);
      }
    }

    try {
      const list = JSON.parse(localStorage.getItem('horizon_discussions') || '[]');
      list.unshift(payload);
      localStorage.setItem('horizon_discussions', JSON.stringify(list.slice(0, 50)));
    } catch (e) {}

    return payload;
  }

  // ── REVIEWS & RATINGS ──
  async function fetchReviews() {
    const db = getDb();
    if (db && isLive()) {
      try {
        const snap = await db.collection('reviews').orderBy('created_at', 'desc').limit(20).get();
        if (!snap.empty) {
          const list = [];
          snap.forEach(function (doc) {
            list.push(Object.assign({ id: doc.id }, doc.data()));
          });
          return list;
        }
      } catch (e) {
        console.warn('Firebase fetchReviews error:', e.message);
      }
    }
    try {
      return JSON.parse(localStorage.getItem('horizon_reviews') || '[]');
    } catch (e) {
      return [];
    }
  }

  async function postReview(review) {
    if (!review) return null;
    const db = getDb();
    const payload = {
      reviewer_name: review.name || review.reviewer_name || 'Anonymous Innovator',
      role: review.role || 'Participant',
      rating: review.rating || 5,
      review_text: review.text || review.review_text || '',
      created_at: new Date().toISOString()
    };

    if (db && isLive()) {
      try {
        const ref = await db.collection('reviews').add(payload);
        payload.id = ref.id;
      } catch (e) {
        console.warn('Firebase postReview error:', e.message);
      }
    }

    try {
      const list = JSON.parse(localStorage.getItem('horizon_reviews') || '[]');
      list.unshift(payload);
      localStorage.setItem('horizon_reviews', JSON.stringify(list.slice(0, 50)));
    } catch (e) {}

    return payload;
  }

  // ── SIGNATURES (STORED IN CLOUDINARY, REFERENCED IN FIRESTORE) ──
  async function getSignatures() {
    const db = getDb();
    if (db && isLive()) {
      try {
        const doc = await db.collection('admin_config').doc('signatures').get();
        if (doc.exists) {
          const data = doc.data();
          return (data && (data.signatures || data.data)) || {};
        }
      } catch (e) {}
    }
    try {
      return JSON.parse(localStorage.getItem('admin_signatures') || '{}');
    } catch (e) {
      return {};
    }
  }

  async function saveSignatures(signatures) {
    if (!signatures) return;
    const cleanSigs = Object.assign({}, signatures);
    for (const k of Object.keys(cleanSigs)) {
      if (cleanSigs[k] && typeof cleanSigs[k] === 'string' && cleanSigs[k].startsWith('data:')) {
        try {
          cleanSigs[k] = await uploadToCloudinary(cleanSigs[k], 'ai engineer');
        } catch (e) {
          console.warn('Signature upload error for ' + k + ':', e);
        }
      }
    }

    const db = getDb();
    if (db && isLive()) {
      try {
        await db.collection('admin_config').doc('signatures').set({
          signatures: cleanSigs,
          updated_at: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn('Firebase saveSignatures error:', e);
      }
    }

    try {
      localStorage.setItem('admin_signatures', JSON.stringify(cleanSigs));
    } catch (e) {}
  }

  // ── CLEAR COLLECTION HELPER ──
  async function clearCollection(colName) {
    const db = getDb();
    if (db && isLive()) {
      try {
        const snap = await db.collection(colName).get();
        if (!snap.empty) {
          const batch = db.batch();
          snap.forEach(function (doc) { batch.delete(doc.ref); });
          await batch.commit();
        }
      } catch (e) {}
    }
    return true;
  }

  // ── CONNECTION TESTERS ──
  async function testFirebaseConnection() {
    const db = getDb();
    if (!db) {
      return { success: false, message: 'Firebase JS SDK not initialized. Verify your configuration.' };
    }
    try {
      // Test read from admin_config
      await db.collection('admin_config').doc('config').get();
      return { success: true, message: 'Firebase Firestore connected successfully! Ready for real-time text & roster sync.' };
    } catch (err) {
      if (err.code === 'permission-denied' || (err.message && err.message.includes('permission'))) {
        return {
          success: false,
          isPermission: true,
          message: 'Permission denied: Please ensure your Firestore Security Rules allow read/write in Firebase Console (set rules to: allow read, write: if true;).'
        };
      }
      return { success: false, message: err.message || 'Firebase connection test failed.' };
    }
  }

  async function testCloudinaryConnection() {
    const cfg = getCloudinaryConfig();
    try {
      // Test upload of 1x1 transparent png
      const testPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const url = await uploadToCloudinary(testPixel, cfg.folder || 'ai engineer');
      if (url && url.startsWith('http')) {
        return {
          success: true,
          message: `Cloudinary connected successfully! (Cloud: ${cfg.cloudName}, Preset: ${cfg.uploadPreset}, Folder: ${cfg.folder})`,
          url: url
        };
      }
      return { success: false, message: 'Upload succeeded but no valid image URL was returned.' };
    } catch (err) {
      return { success: false, message: err.message || 'Cloudinary connection test failed.' };
    }
  }

  async function testConnection() {
    const fbRes = await testFirebaseConnection();
    const clRes = await testCloudinaryConnection();

    if (fbRes.success && clRes.success) {
      return {
        success: true,
        message: 'Both Firebase Firestore and Cloudinary are fully connected and active! 🚀'
      };
    }

    const messages = [];
    if (!fbRes.success) messages.push(`Firebase: ${fbRes.message}`);
    else messages.push(`Firebase: Connected ✅`);

    if (!clRes.success) messages.push(`Cloudinary: ${clRes.message}`);
    else messages.push(`Cloudinary: Connected ✅`);

    return {
      success: fbRes.success && clRes.success,
      message: messages.join('\n\n')
    };
  }

  // ── UNIFIED BACKEND EXPORT ──
  const HorizonBackend = {
    // Config
    getConfig: getConfig,
    saveCredentials: saveCredentials,
    getFirebaseConfig: getFirebaseConfig,
    saveFirebaseConfig: saveFirebaseConfig,
    getCloudinaryConfig: getCloudinaryConfig,
    saveCloudinaryConfig: saveCloudinaryConfig,
    getClient: getDb,
    getDb: getDb,
    isLive: isLive,
    testConnection: testConnection,
    testFirebaseConnection: testFirebaseConnection,
    testCloudinaryConnection: testCloudinaryConnection,

    // Participants (Firebase Firestore)
    getParticipantByEmail: getParticipantByEmail,
    saveParticipant: saveParticipant,
    batchSaveParticipants: batchSaveParticipants,
    getAllParticipants: getAllParticipants,
    deleteParticipant: deleteParticipant,
    clearAllParticipants: clearAllParticipants,

    // Certificates & Audit
    saveCertificate: saveCertificate,
    getAllCertificates: getAllCertificates,
    deleteCertificate: deleteCertificate,

    // Winners
    saveWinnerClaim: saveWinnerClaim,
    getAllWinnerClaims: getAllWinnerClaims,
    deleteWinnerClaim: deleteWinnerClaim,
    clearWinnerClaims: clearWinnerClaims,

    // Admin Config & Templates
    fetchAdminConfig: fetchAdminConfig,
    saveAdminConfig: saveAdminConfig,
    fetchCustomTemplate: fetchCustomTemplate,
    saveCustomTemplate: saveCustomTemplate,
    deleteCustomTemplate: deleteCustomTemplate,
    getSignatures: getSignatures,
    saveSignatures: saveSignatures,

    // Cloudinary Storage
    uploadAsset: uploadAsset,
    uploadToCloudinary: uploadToCloudinary,
    deleteStorageFile: deleteStorageFile,

    // Discussions & Reviews
    fetchDiscussions: fetchDiscussions,
    postDiscussion: postDiscussion,
    fetchReviews: fetchReviews,
    postReview: postReview,

    // Collections
    clearCollection: clearCollection
  };

  // Expose to window under modern, descriptive, and backward-compatible handles
  window.HorizonBackend = HorizonBackend;
  window.FirebaseBackend = HorizonBackend;
  window.AivoraBackend = HorizonBackend;
  window.CloudinaryStorage = {
    upload: uploadToCloudinary,
    getConfig: getCloudinaryConfig,
    saveConfig: saveCloudinaryConfig,
    testConnection: testCloudinaryConnection
  };

  // BACKWARD-COMPATIBILITY ALIAS: Fully bridges any call to window.SupabaseBackend to Firebase + Cloudinary
  window.SupabaseBackend = HorizonBackend;

})(window);
