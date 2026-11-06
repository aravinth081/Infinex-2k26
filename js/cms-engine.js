/**
 * cms-engine.js — Dynamic Website & Live Synchronization Engine
 * HORIZON X 2K26 GLOBAL HACKATHON • INNOVATION HACKS
 *
 * Implements centralized single-source-of-truth content architecture.
 * Automatically synchronizes content between Enterprise Admin Control Panel and Live Website.
 */

(function (window) {
  'use strict';

  const document = window.document || (typeof global !== 'undefined' ? global.document : null);

  const STORAGE_KEY = 'horizon_cms_data';
  const AUDIT_KEY = 'horizon_admin_audit_logs';
  const CHANNEL_NAME = 'horizon_cms_channel';

  let _broadcastChannel = null;
  try {
    if (typeof window.BroadcastChannel !== 'undefined') {
      _broadcastChannel = new window.BroadcastChannel(CHANNEL_NAME);
    }
  } catch (e) {}

  // Deep clone helper
  function deepClone(obj) {
    if (!obj) return {};
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (e) {
      return Object.assign({}, obj);
    }
  }

  // Deep merge target with source
  function deepMerge(target, source) {
    if (!source) return target;
    const output = Object.assign({}, target);
    for (const key of Object.keys(source)) {
      if (
        source[key] !== null &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        key in target &&
        typeof target[key] === 'object' &&
        !Array.isArray(target[key])
      ) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }
    return output;
  }

  // Storage safe helpers
  function getStorageItem(key) {
    try {
      if (window.localStorage) return window.localStorage.getItem(key);
    } catch (e) {}
    return null;
  }

  function setStorageItem(key, val) {
    try {
      if (window.localStorage) window.localStorage.setItem(key, val);
    } catch (e) {}
  }

  function removeStorageItem(key) {
    try {
      if (window.localStorage) window.localStorage.removeItem(key);
    } catch (e) {}
  }

  // Retrieve current content
  function getContent() {
    const defaults = window.DEFAULT_CMS_CONTENT || {};
    try {
      const stored = getStorageItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed) {
          if (parsed.announcement) parsed.announcement.enabled = false;
          if (parsed.prizes) parsed.prizes.podiumImage = '';
        }
        return deepMerge(defaults, parsed);
      }
    } catch (e) {
      console.warn('CMS localStorage parse notice:', e);
    }
    return deepClone(defaults);
  }

  // Save content updates and broadcast
  async function saveContent(updates, publishToCloud = true) {
    if (!updates) return false;
    const current = getContent();
    const updated = deepMerge(current, updates);
    updated.lastUpdated = new Date().toISOString();

    // Keep global.tabTitle and seo.home.title in sync
    if (updates.global && updates.global.tabTitle) {
      if (!updated.seo) updated.seo = {};
      if (!updated.seo.home) updated.seo.home = {};
      updated.seo.home.title = updates.global.tabTitle;
    } else if (updates.seo && updates.seo.home && updates.seo.home.title) {
      if (!updated.global) updated.global = {};
      updated.global.tabTitle = updates.seo.home.title;
    }

    // 1. LocalStorage update
    setStorageItem(STORAGE_KEY, JSON.stringify(updated));

    // 2. BroadcastChannel trigger
    if (_broadcastChannel) {
      try {
        _broadcastChannel.postMessage({ type: 'CMS_UPDATED', timestamp: Date.now() });
      } catch (e) {}
    }

    // 3. Custom DOM Event
    try {
      window.dispatchEvent(new CustomEvent('horizon:cms:updated', { detail: updated }));
    } catch (e) {}

    // 4. Cloud Persistence (Firebase Firestore)
    if (publishToCloud) {
      const backend = window.HorizonBackend || window.FirebaseBackend || window.SupabaseBackend;
      if (backend && typeof backend.getDb === 'function') {
        const db = backend.getDb();
        if (db && backend.isLive && backend.isLive()) {
          try {
            await db.collection('admin_config').doc('website_content').set({
              content: updated,
              updated_at: new Date().toISOString()
            }, { merge: true });
          } catch (err) {
            console.warn('Cloud CMS sync error (saved locally):', err.message);
          }
        }
      }
    }

    return updated;
  }

  // Reset to defaults
  function resetContent() {
    try {
      removeStorageItem(STORAGE_KEY);
      if (_broadcastChannel) {
        _broadcastChannel.postMessage({ type: 'CMS_UPDATED', timestamp: Date.now() });
      }
      window.dispatchEvent(new CustomEvent('horizon:cms:updated', { detail: window.DEFAULT_CMS_CONTENT }));
    } catch (e) {}
    return window.DEFAULT_CMS_CONTENT;
  }

  function getSessionItem(key) {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem(key);
      }
    } catch (e) {}
    return null;
  }

  // Activity Audit Logger
  async function logActivity(action, details, user, role) {
    const userName = user || getSessionItem('admin_user_name') || 'Administrator';
    const userRole = role || getSessionItem('admin_role') || 'Super Admin';

    const entry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      action: action || 'Content Update',
      details: details || '',
      user: userName,
      role: userRole,
      timestamp: new Date().toISOString()
    };

    try {
      const existing = JSON.parse(getStorageItem(AUDIT_KEY) || '[]');
      existing.unshift(entry);
      // Keep last 150 entries
      setStorageItem(AUDIT_KEY, JSON.stringify(existing.slice(0, 150)));
    } catch (e) {}

    // Optionally save to Firestore
    try {
      const backend = window.HorizonBackend;
      if (backend && backend.getDb && backend.isLive && backend.isLive()) {
        const db = backend.getDb();
        await db.collection('admin_activity_logs').add(entry);
      }
    } catch (e) {}

    return entry;
  }

  function getAuditLogs() {
    try {
      return JSON.parse(getStorageItem(AUDIT_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  // Apply Maintenance Mode
  function applyMaintenance(content) {
    const isMaintenance = content && content.global && content.global.maintenanceMode;
    const existingOverlay = document.getElementById('horizonMaintenanceOverlay');
    let isAdmin = false;
    try {
      isAdmin = (getSessionItem('admin_logged_in') === 'true') || 
        (window.location && window.location.search && window.location.search.includes('bypass_maintenance'));
    } catch (e) {}

    if (isMaintenance && !isAdmin) {
      if (!existingOverlay) {
        const overlay = document.createElement('div');
        overlay.id = 'horizonMaintenanceOverlay';
        overlay.style.cssText = `
          position: fixed; inset: 0; z-index: 999999;
          background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px);
          color: #0F172A; display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding: 24px; font-family: 'Inter', sans-serif;
        `;
        overlay.innerHTML = `
          <div style="max-width: 540px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 40px 32px; box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1);">
            <div style="font-size: 48px; margin-bottom: 16px;">🚀</div>
            <h1 style="font-family:'Plus Jakarta Sans','Inter',sans-serif; font-size: 26px; font-weight: 800; color: #172554; margin-bottom: 12px; letter-spacing: -0.02em;">Scheduled Innovation Upgrade</h1>
            <p style="color: #64748B; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">${escapeHtml(content.global.maintenanceMessage || 'We are currently enhancing the platform. Please check back shortly!')}</p>
            <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
              <a href="${content.global.communityUrl || '#'}" target="_blank" style="display:inline-block; padding: 12px 24px; border-radius: 10px; background: #2563EB; color: #FFFFFF; font-weight: 600; text-decoration: none; box-shadow: 0 1px 3px rgba(37,99,235,0.3);">Join WhatsApp Community</a>
              <a href="control.html" style="display:inline-block; padding: 12px 24px; border-radius: 10px; background: #EFF6FF; border: 1px solid #DBEAFE; color: #1E40AF; font-weight: 600; text-decoration: none;">Admin Access</a>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
      }
    } else {
      if (existingOverlay) {
        existingOverlay.remove();
        document.body.style.overflow = '';
      }
    }
  }

  // Apply SEO & Meta Tags
  function applySEO(content, pageKey = 'home') {
    if (!content) return;
    const pageSeo = (content.seo && (content.seo[pageKey] || content.seo.home)) || {};

    // 🌐 Update Browser Tab Title (<title>) — Uses pageSeo.title or global.tabTitle or siteName
    const tabTitle = pageSeo.title || 
                     (content.global && content.global.tabTitle) || 
                     (content.global && content.global.siteName ? `${content.global.siteName} | ${content.global.tagline || 'Global AI Hackathon'}` : '');

    if (tabTitle) {
      document.title = tabTitle;
    }

    function setMeta(name, attrName, val) {
      if (!val) return;
      let el = document.querySelector(`meta[${attrName}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', val);
    }

    setMeta('description', 'name', pageSeo.metaDescription);
    setMeta('keywords', 'name', pageSeo.keywords);
    setMeta('og:title', 'property', pageSeo.ogTitle || pageSeo.title);
    setMeta('og:description', 'property', pageSeo.ogDescription || pageSeo.metaDescription);
    setMeta('og:image', 'property', pageSeo.ogImage);

    // Favicon
    if (content.global && content.global.faviconUrl) {
      let icon = document.querySelector('link[rel="icon"]');
      if (icon) icon.href = content.global.faviconUrl;
    }
  }

  // Escape HTML utility
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ── DOM RENDERERS ──

  // 1. Top Announcement Bar (Permanently Removed per user request)
  function renderAnnouncement(content) {
    const bar = document.getElementById('horizonAnnouncementBar');
    if (bar) {
      bar.remove();
    }
  }

  // 2. Render Navigation
  function renderNavigation(content) {
    const nav = content.navigation;
    const global = content.global;
    if (!nav) return;

    // Brand Titles
    const brandTitles = document.querySelectorAll('.nav-brand-title');
    brandTitles.forEach(el => {
      el.textContent = nav.brandTitle || global.siteName || 'HORIZON X 2K26';
    });

    const brandTaglines = document.querySelectorAll('.nav-brand-tagline');
    brandTaglines.forEach(el => {
      el.textContent = nav.brandTagline || global.tagline || 'GLOBAL AI HACKATHON';
    });

    // Logos
    const brandLogos = document.querySelectorAll('.nav-brand-logo');
    brandLogos.forEach(el => {
      if (global.logoUrl) el.src = global.logoUrl;
    });

    // Desktop Nav Menu
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu && Array.isArray(nav.links) && nav.links.length > 0) {
      navMenu.innerHTML = nav.links
        .slice()
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((link, idx) => `
          <a href="${escapeHtml(link.href)}" class="nav-link ${idx === 0 ? 'active' : ''}" ${link.isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''}>
            ${escapeHtml(link.label)}
          </a>
        `).join('');
    }

    // Mobile Nav Drawer Links
    const mobileLinksUl = document.querySelector('.mobile-nav-links');
    if (mobileLinksUl && Array.isArray(nav.links) && nav.links.length > 0) {
      mobileLinksUl.innerHTML = nav.links
        .slice()
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((link, idx) => `
          <li>
            <a href="${escapeHtml(link.href)}" class="mobile-nav-link ${idx === 0 ? 'active' : ''}" ${link.isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''}>
              <span>${escapeHtml(link.label)}</span>
              <span>→</span>
            </a>
          </li>
        `).join('');
    }

    // Action CTA Buttons (Unstop & WhatsApp)
    const unstopButtons = document.querySelectorAll('.btn-nav-unstop, .btn-drawer-unstop, .btn-hero-secondary, .btn-cta-unstop');
    unstopButtons.forEach(btn => {
      if (nav.primaryCtaUrl) btn.href = nav.primaryCtaUrl;
      const span = btn.querySelector('span:not(.btn-nav-arrow):not(.btn-icon):not(.btn-arrow):not(.btn-cta-arrow)');
      if (span && nav.primaryCtaText) span.textContent = nav.primaryCtaText;
    });

    const whatsappButtons = document.querySelectorAll('.btn-nav-whatsapp, .btn-drawer-whatsapp, .btn-cta-whatsapp');
    whatsappButtons.forEach(btn => {
      if (nav.secondaryCtaUrl || global.communityUrl) {
        btn.href = nav.secondaryCtaUrl || global.communityUrl;
      }
      const span = btn.querySelector('span');
      if (span && nav.secondaryCtaText) span.textContent = nav.secondaryCtaText;
    });

    // 🎯 Active Navigation State & Smooth Scroll Tracking (ScrollSpy)
    initNavigationActiveTracking();
  }

  // ── ACTIVE NAVIGATION CONTROLLER & SCROLLSPY ──
  let _isNavClickScrolling = false;
  let _scrollSpyTimer = null;
  let _scrollSpyAttached = false;

  function setActiveNavSection(sectionId) {
    if (!sectionId) return;
    const cleanId = sectionId.replace(/^#/, '');
    const desktopLinks = document.querySelectorAll('.nav-menu .nav-link');
    const mobileLinks = document.querySelectorAll('.mobile-nav-links .mobile-nav-link');

    desktopLinks.forEach(link => {
      const href = (link.getAttribute('href') || '').replace(/^#/, '');
      if (href === cleanId) {
        link.classList.add('active');
      } else if (link.getAttribute('href') && link.getAttribute('href').startsWith('#')) {
        link.classList.remove('active');
      }
    });

    mobileLinks.forEach(link => {
      const href = (link.getAttribute('href') || '').replace(/^#/, '');
      if (href === cleanId) {
        link.classList.add('active');
      } else if (link.getAttribute('href') && link.getAttribute('href').startsWith('#')) {
        link.classList.remove('active');
      }
    });
  }

  function updateActiveNavOnScroll() {
    if (_isNavClickScrolling) return;

    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const sections = document.querySelectorAll('section[id], header[id]');
    if (!sections.length) return;

    // 1. If at top of the page, highlight #home
    if (scrollY < 120) {
      setActiveNavSection('home');
      return;
    }

    // 2. If near bottom of the page, highlight the last section (faq)
    if ((window.innerHeight + scrollY) >= (document.documentElement.scrollHeight - 70)) {
      const faqSec = document.getElementById('faq');
      if (faqSec) {
        setActiveNavSection('faq');
        return;
      }
    }

    // 3. Find current section in view based on offset
    let currentId = '';
    const offset = 140; // Navbar height + offset
    sections.forEach(sec => {
      const id = sec.getAttribute('id');
      if (!id || id === 'navbar') return;
      const top = sec.offsetTop - offset;
      const height = sec.offsetHeight;
      if (scrollY >= top && scrollY < top + height) {
        currentId = id;
      }
    });

    if (currentId) {
      setActiveNavSection(currentId);
    }
  }

  function initNavigationActiveTracking() {
    const allLinks = document.querySelectorAll('.nav-menu .nav-link, .mobile-nav-links .mobile-nav-link');
    allLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href && href.startsWith('#')) {
          const targetId = href.substring(1);
          const targetElem = document.getElementById(targetId);
          if (targetElem) {
            e.preventDefault();
            _isNavClickScrolling = true;
            setActiveNavSection(targetId);

            // Close mobile drawer if open
            const drawer = document.getElementById('mobileDrawer');
            const overlay = document.getElementById('mobileDrawerOverlay');
            const hamburger = document.getElementById('hamburgerBtn');
            if (drawer) drawer.classList.remove('open');
            if (overlay) overlay.classList.remove('open');
            if (hamburger) {
              hamburger.classList.remove('is-active');
              hamburger.setAttribute('aria-expanded', 'false');
            }
            document.body.style.overflow = '';

            // Calculate precise smooth scroll position taking 75px navbar into account
            const navH = 75;
            const elementPosition = targetElem.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - navH;

            window.scrollTo({
              top: Math.max(0, offsetPosition),
              behavior: 'smooth'
            });

            // Keep active state pinned during smooth scroll
            clearTimeout(_scrollSpyTimer);
            _scrollSpyTimer = setTimeout(() => {
              _isNavClickScrolling = false;
              updateActiveNavOnScroll();
            }, 700);
          }
        }
      });
    });

    if (!_scrollSpyAttached) {
      window.addEventListener('scroll', updateActiveNavOnScroll, { passive: true });
      _scrollSpyAttached = true;
    }

    updateActiveNavOnScroll();
  }

  // 3. Render Hero Section
  function renderHero(content) {
    const hero = content.hero;
    if (!hero) return;

    // Eyebrow (Hero Top Eyebrow Pill Badge - Image 3)
    const eyebrow = document.querySelector('.hero-eyebrow span:not(.hero-eyebrow-dot)') || document.querySelector('.hero-eyebrow span:last-child');
    if (eyebrow && hero.eyebrowText) eyebrow.textContent = hero.eyebrowText;

    // Headline
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
      heroTitle.innerHTML = `
        ${escapeHtml(hero.titleLine1 || 'HORIZON X 2K26')} <br class="hero-title-break">
        <span class="hero-blue-text">${escapeHtml(hero.titleHighlight || 'GLOBAL AI HACKATHON')}</span>
      `;
    }

    // Lead
    const heroLead = document.querySelector('.hero-lead');
    if (heroLead && hero.lead) heroLead.textContent = hero.lead;

    // Primary CTA (Verify & Claim)
    const primaryCta = document.querySelector('.btn-hero-primary');
    if (primaryCta) {
      if (hero.primaryCtaUrl) primaryCta.href = hero.primaryCtaUrl;
      const span = primaryCta.querySelector('span:not(.btn-arrow)');
      if (span && hero.primaryCtaText) span.textContent = hero.primaryCtaText;
    }

    // 3D Robot Image
    const robotImg = document.getElementById('heroRobotImg');
    if (robotImg && hero.robotImage) {
      robotImg.src = hero.robotImage;
    }

    // Floating Badges
    const badge1 = document.getElementById('floatBadge1');
    if (badge1) {
      const icon = badge1.querySelector('.float-badge-icon');
      const title = badge1.querySelector('.float-badge-text strong');
      const sub = badge1.querySelector('.float-badge-text span');
      if (icon && hero.badge1Icon) icon.textContent = hero.badge1Icon;
      if (title && hero.badge1Title) title.textContent = hero.badge1Title;
      if (sub && hero.badge1Subtitle) sub.textContent = hero.badge1Subtitle;
    }

    const badge2 = document.getElementById('floatBadge2');
    if (badge2) {
      const icon = badge2.querySelector('.float-badge-icon');
      const title = badge2.querySelector('.float-badge-text strong');
      const sub = badge2.querySelector('.float-badge-text span');
      if (icon && hero.badge2Icon) icon.textContent = hero.badge2Icon;
      if (title && hero.badge2Title) title.textContent = hero.badge2Title;
      if (sub && hero.badge2Subtitle) sub.textContent = hero.badge2Subtitle;
    }

    // Audience Cards
    const audienceContainer = document.querySelector('.hero-audience-card');
    if (audienceContainer && Array.isArray(hero.audienceCards) && hero.audienceCards.length > 0) {
      audienceContainer.innerHTML = hero.audienceCards.map(card => `
        <div class="hero-audience-item">
          <div class="hero-audience-icon">
            <span style="font-size: 22px;">${card.icon || '🎓'}</span>
          </div>
          <div class="hero-audience-text">
            <strong class="hero-audience-title">${escapeHtml(card.title)}</strong>
            <span class="hero-audience-desc">${escapeHtml(card.desc)}</span>
          </div>
        </div>
      `).join('');
    }
  }

  // 4. Render About Section
  function renderAbout(content) {
    const about = content.about;
    if (!about) return;

    // Eyebrow
    const eyebrow = document.querySelector('.about-eyebrow span:last-child');
    if (eyebrow && about.eyebrow) eyebrow.textContent = about.eyebrow;

    // Title
    const titleLead = document.querySelector('.about-title-lead');
    const titleHighlight = document.querySelector('.about-title-highlight');
    if (titleLead && about.titleLead) titleLead.textContent = about.titleLead;
    if (titleHighlight && about.titleHighlight) titleHighlight.textContent = about.titleHighlight;

    // Lead Description
    const leadDesc = document.querySelector('.about-lead-desc');
    if (leadDesc && about.leadDesc) leadDesc.textContent = about.leadDesc;

    // Handwritten Note
    const scriptText = document.querySelector('.about-handwritten-badge .badge-script');
    if (scriptText && about.handwrittenNote) {
      scriptText.innerHTML = escapeHtml(about.handwrittenNote).replace(/\n/g, '<br>');
    }

    // 3D Robot Image
    const aboutRobotImg = document.getElementById('aboutRobotArtImg');
    if (aboutRobotImg && about.robotImage) {
      aboutRobotImg.src = about.robotImage;
    }

    // Pillars Grid
    const pillarsGrid = document.querySelector('.about-pillars-grid');
    if (pillarsGrid && Array.isArray(about.pillars) && about.pillars.length > 0) {
      pillarsGrid.innerHTML = about.pillars.map((pillar, idx) => `
        <div class="about-pillar-card pillar-card-0${idx + 1}">
          <div class="card-top-header">
            <span class="card-pill-idx">${pillar.number || '0' + (idx + 1)}</span>
            <div class="card-icon-halo">
              <span style="font-size: 22px;">${idx === 0 ? '💻' : idx === 1 ? '💡' : '🎯'}</span>
            </div>
          </div>
          <h3 class="card-pillar-title">${escapeHtml(pillar.title)}</h3>
          <p class="card-pillar-desc">${escapeHtml(pillar.desc)}</p>
          <div class="card-action-row">
            <a href="${escapeHtml(pillar.actionUrl || '#certificates')}" class="card-round-arrow-btn" aria-label="${escapeHtml(pillar.title)}">
              <span>→</span>
            </a>
          </div>
        </div>
      `).join('');
    }
  }

  // 5. Render Problem Statements & Tracks
  function renderTracks(content) {
    const tracks = content.tracks;
    const container = document.getElementById('tracksContainer');
    if (!container || !Array.isArray(tracks)) return;

    const activeTracks = tracks
      .filter(t => t.active !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    container.innerHTML = activeTracks.map(t => `
      <div class="challenge-card" data-track-id="${t.id}" style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 32px 28px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05); display: flex; flex-direction: column;">
        <div class="challenge-card-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <span class="challenge-number" style="font-family: 'Space Mono', monospace; font-size: 0.82rem; font-weight: 700; color: #64748B; letter-spacing: 0.5px;">TRACK ${escapeHtml(t.number || '01')}</span>
          <span style="background: #EFF6FF; color: #2563EB; border: 1px solid #DBEAFE; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
            ${escapeHtml(t.category || 'Core AI')}
          </span>
        </div>
        <div style="font-size: 32px; margin-bottom: 12px;">${t.icon || '🧠'}</div>
        <h3 class="challenge-title" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.25rem; font-weight: 800; color: #172554; margin-bottom: 10px; line-height: 1.35;">${escapeHtml(t.title)}</h3>
        <p class="challenge-desc" style="font-size: 0.95rem; color: #64748B; line-height: 1.65; margin: 0;">${escapeHtml(t.desc)}</p>
        ${Array.isArray(t.challenges) && t.challenges.length > 0 ? `
          <div style="margin-top: 18px; padding-top: 16px; border-top: 1px solid #F1F5F9;">
            <strong style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #2563EB; display: block; margin-bottom: 8px;">Key Focus Challenges:</strong>
            <ul style="font-size: 12.5px; color: #64748B; line-height: 1.6; padding-left: 18px; margin: 0;">
              ${t.challenges.map(c => `<li>${escapeHtml(c)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  // 6. Render Hackathon Timeline
  function renderTimeline(content) {
    const hack = content.hackathon;
    const container = document.getElementById('timelineContainer');
    if (!container || !hack || !Array.isArray(hack.timeline)) return;

    container.innerHTML = `
      <div class="timeline-track"></div>
      ${hack.timeline.map((step, idx) => `
        <div class="timeline-item ${escapeHtml(step.status || 'upcoming')}">
          <div class="timeline-node" style="background: #FFFFFF; border: 2px solid ${step.status === 'completed' ? '#059669' : step.status === 'ongoing' ? '#2563EB' : '#CBD5E1'}; color: ${step.status === 'completed' ? '#059669' : step.status === 'ongoing' ? '#2563EB' : '#64748B'};">
            <span>${step.status === 'completed' ? '✓' : (idx + 1)}</span>
          </div>
          <div class="timeline-card" style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 14px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05); padding: 22px 24px;">
            <div class="timeline-header-row" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <span class="timeline-date" style="font-weight: 700; font-size: 0.88rem; color: #2563EB;">${escapeHtml(step.date)}</span>
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 6px; background: ${step.status === 'completed' ? '#ECFDF5' : step.status === 'ongoing' ? '#EFF6FF' : '#F1F5F9'}; color: ${step.status === 'completed' ? '#059669' : step.status === 'ongoing' ? '#2563EB' : '#64748B'}; border: 1px solid ${step.status === 'completed' ? '#A7F3D0' : step.status === 'ongoing' ? '#DBEAFE' : '#E2E8F0'};">
                ${step.status === 'ongoing' ? '● CURRENT PHASE' : step.status === 'completed' ? 'COMPLETED' : 'UPCOMING'}
              </span>
            </div>
            <h4 class="timeline-event-name" style="font-size: 1.15rem; font-weight: 800; color: #172554; margin-bottom: 6px;">${escapeHtml(step.title)}</h4>
            <p class="timeline-event-desc" style="font-size: 0.92rem; color: #64748B; line-height: 1.6; margin: 0;">${escapeHtml(step.desc)}</p>
          </div>
        </div>
      `).join('')}
    `;
  }

  // 7. Render Prizes & Rewards
  function renderPrizes(content) {
    const prizes = content.prizes;
    const container = document.getElementById('prizesContainer') || document.getElementById('prizes');
    if (!container || !prizes) return;

    const poolTotalEl = document.getElementById('prizesPoolTotal');
    if (poolTotalEl && prizes.poolTotal) {
      poolTotalEl.textContent = prizes.poolTotal;
    }

    const subtitleEl = document.getElementById('prizesSubtitle');
    if (subtitleEl && prizes.subtitle) {
      subtitleEl.textContent = prizes.subtitle;
    }

    const podiumWrap = document.querySelector('.prizes-podium-wrap');
    if (podiumWrap) podiumWrap.remove();
    const podiumImg = document.getElementById('prizesPodiumImg');
    if (podiumImg) podiumImg.remove();

    // Render Prize Cards (1st, 2nd, 3rd)
    const cardsRow = document.getElementById('prizesCardsRow');
    if (cardsRow) {
      const tiers = [
        { key: 'tier1', data: prizes.tier1, color: '#2563EB', badgeBg: '#EFF6FF', badgeColor: '#1E40AF', defaultBadge: '🥇 1st Place', border: '1.5px solid #2563EB' },
        { key: 'tier2', data: prizes.tier2, color: '#64748B', badgeBg: '#F1F5F9', badgeColor: '#334155', defaultBadge: '🥈 2nd Place', border: '1px solid #E2E8F0' },
        { key: 'tier3', data: prizes.tier3, color: '#D97706', badgeBg: '#FEF3C7', badgeColor: '#92400E', defaultBadge: '🥉 3rd Place', border: '1px solid #E2E8F0' }
      ];

      cardsRow.innerHTML = tiers.map(t => {
        const d = t.data || {};
        return `
          <div class="about-pillar-card" style="background: #FFFFFF; border: ${t.border}; border-radius: 16px; box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.05); padding: 30px 26px; text-align: left;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
              <span style="font-size: 12px; font-weight: 800; background: ${t.badgeBg}; color: ${t.badgeColor}; border: 1px solid #E2E8F0; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase;">
                ${escapeHtml(d.badge || t.defaultBadge)}
              </span>
              <span style="font-size: 24px;">${t.key === 'tier1' ? '🏆' : t.key === 'tier2' ? '🥈' : '🥉'}</span>
            </div>
            <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; font-weight: 800; color: #172554; margin-bottom: 8px;">
              ${escapeHtml(d.title || '')}
            </h3>
            <div style="font-size: 24px; font-weight: 800; color: #2563EB; margin-bottom: 14px;">
              ${escapeHtml(d.amount || '')}
            </div>
            ${Array.isArray(d.perks) && d.perks.length > 0 ? `
              <ul style="font-size: 13px; color: #64748B; line-height: 1.6; padding-left: 18px; margin: 0;">
                ${d.perks.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `;
      }).join('');
    }
  }

  // 7.4 Render Certification Portal Header (Image 1)
  function renderCertificationHeader(content) {
    const certH = content.certificationHeader;
    const section = document.getElementById('certificates');
    if (!section || !certH) return;

    const eyebrowSpan = document.getElementById('certPortalEyebrow') || section.querySelector('.claim-header-center .section-eyebrow span:not(.section-eyebrow-dot)');
    if (eyebrowSpan && certH.eyebrow) eyebrowSpan.textContent = certH.eyebrow;

    const titleEl = document.getElementById('certPortalTitle') || section.querySelector('.claim-header-center .claim-main-title');
    if (titleEl && (certH.titlePrefix || certH.titleHighlight)) {
      const prefix = escapeHtml(certH.titlePrefix || 'Claim Your');
      const highlight = escapeHtml(certH.titleHighlight || 'Official Certificate');
      titleEl.innerHTML = `${prefix} <span id="certPortalTitleHighlight">${highlight}</span>`;
    }

    const descEl = document.getElementById('certPortalDesc') || section.querySelector('.claim-header-center .claim-main-desc');
    if (descEl && certH.description) descEl.textContent = certH.description;
  }

  // 7.5 Render Claim CTA Section (Image 2)
  function renderClaimCta(content) {
    const cta = content.claimCta;
    const banner = document.querySelector('.claim-cta-banner');
    if (!banner || !cta) return;

    const heading = banner.querySelector('.claim-cta-heading');
    if (heading && cta.heading) heading.textContent = cta.heading;

    const desc = banner.querySelector('.claim-cta-text');
    if (desc && cta.description) desc.textContent = cta.description;

    const btn1 = banner.querySelector('.btn-cta-unstop');
    if (btn1) {
      const url1 = cta.primaryButtonUrl || (content.navigation && content.navigation.primaryCtaUrl);
      if (url1) btn1.href = url1;
      const span1 = btn1.querySelector('span:not(.btn-cta-arrow)') || btn1.querySelector('span');
      if (span1 && cta.primaryButtonText) span1.textContent = cta.primaryButtonText;
    }

    const btn2 = banner.querySelector('.btn-cta-whatsapp');
    if (btn2) {
      const url2 = cta.secondaryButtonUrl || (content.global && content.global.communityUrl);
      if (url2) btn2.href = url2;
      const span2 = btn2.querySelector('span');
      if (span2 && cta.secondaryButtonText) span2.textContent = cta.secondaryButtonText;
    }
  }

  // 8. Render FAQs
  function renderFAQs(content) {
    // Render FAQ Header (Image 5)
    const faqHeader = content.faqHeader;
    const faqSection = document.getElementById('faq');
    if (faqSection && faqHeader) {
      const eyebrow = faqSection.querySelector('.section-eyebrow span:not(.section-eyebrow-dot)') || faqSection.querySelector('.section-eyebrow span:last-child');
      if (eyebrow && faqHeader.eyebrow) eyebrow.textContent = faqHeader.eyebrow;

      const title = faqSection.querySelector('.section-title');
      if (title && faqHeader.title) {
        const parts = faqHeader.title.trim().split(' ');
        if (parts.length > 1) {
          const last = parts.pop();
          title.innerHTML = `${escapeHtml(parts.join(' '))} <span>${escapeHtml(last)}</span>`;
        } else {
          title.innerHTML = `<span>${escapeHtml(faqHeader.title)}</span>`;
        }
      }

      const desc = faqSection.querySelector('.section-desc');
      if (desc && faqHeader.description) desc.textContent = faqHeader.description;
    }

    const faqs = content.faqs;
    const accordion = document.querySelector('.faq-accordion');
    if (!accordion || !Array.isArray(faqs)) return;

    const activeFaqs = faqs
      .filter(f => f.active !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    accordion.innerHTML = activeFaqs.map((faq, idx) => `
      <div class="faq-item" data-faq-id="${faq.id}">
        <button type="button" class="faq-question" aria-expanded="false">
          <span>${idx + 1}. ${escapeHtml(faq.question)}</span>
          <svg class="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <div class="faq-answer">
          ${faq.answer}
        </div>
      </div>
    `).join('');

    // Reattach accordion event listeners
    accordion.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const isOpen = item.classList.contains('active');
        accordion.querySelectorAll('.faq-item').forEach(i => {
          i.classList.remove('active');
          const b = i.querySelector('.faq-question');
          if (b) b.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('active');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // 9. Render Footer
  function renderFooter(content) {
    const footer = content.footer;
    const global = content.global;
    if (!footer) return;

    // Brand Desc
    const footerDesc = document.querySelector('.footer-brand-desc');
    if (footerDesc && footer.brandDesc) {
      footerDesc.textContent = footer.brandDesc;
    }

    // Official Platform Link (Image 2)
    const platformLink = document.querySelector('.footer-meta-link');
    if (platformLink) {
      const targetUrl = footer.officialPlatformUrl || (content.navigation && content.navigation.primaryCtaUrl);
      if (targetUrl) platformLink.href = targetUrl;
      const span = platformLink.querySelector('span:first-of-type') || platformLink.querySelector('span');
      if (span) {
        span.textContent = footer.officialPlatformText || `${(global && global.siteName) || 'HORIZON X 2K26'} on Unstop`;
      }
    }

    // Copyright
    const copyright = document.querySelector('.footer-copyright');
    if (copyright && footer.copyrightText) {
      const year = new Date().getFullYear();
      copyright.innerHTML = escapeHtml(footer.copyrightText).replace('{year}', year);
    }
  }

  // Master Apply to DOM
  function applyToDOM() {
    const content = getContent();
    applyMaintenance(content);
    applySEO(content);
    renderAnnouncement(content);
    renderNavigation(content);
    renderHero(content);
    renderAbout(content);
    renderTracks(content);
    renderTimeline(content);
    renderPrizes(content);
    renderCertificationHeader(content);
    renderClaimCta(content);
    renderFAQs(content);
    renderFooter(content);
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyToDOM);
  } else {
    applyToDOM();
  }

  // Listen to cross-tab updates via BroadcastChannel
  if (_broadcastChannel) {
    _broadcastChannel.onmessage = (msg) => {
      if (msg && msg.data && msg.data.type === 'CMS_UPDATED') {
        applyToDOM();
      }
    };
  }

  // Listen to storage events (cross-tab fallback)
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      applyToDOM();
    }
  });

  // Listen to remote Firestore live snapshots if online
  async function initCloudLiveSync() {
    try {
      const backend = window.HorizonBackend || window.FirebaseBackend;
      if (backend && backend.getDb && backend.isLive && backend.isLive()) {
        const db = backend.getDb();
        db.collection('admin_config').doc('website_content').onSnapshot((doc) => {
          if (doc.exists) {
            const data = doc.data();
            if (data && data.content) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.content));
              applyToDOM();
            }
          }
        }, (err) => {
          console.warn('Firestore live sync snapshot notice:', err.message);
        });
      }
    } catch (e) {}
  }

  // Initialize Cloud Sync after window loads
  window.addEventListener('load', () => {
    setTimeout(initCloudLiveSync, 1000);
  });

  // Export Engine
  window.HorizonCMS = {
    getContent: getContent,
    saveContent: saveContent,
    resetContent: resetContent,
    applyToDOM: applyToDOM,
    applySEO: applySEO,
    applyMaintenance: applyMaintenance,
    renderAnnouncement: renderAnnouncement,
    renderNavigation: renderNavigation,
    renderHero: renderHero,
    renderAbout: renderAbout,
    renderTracks: renderTracks,
    renderTimeline: renderTimeline,
    renderPrizes: renderPrizes,
    renderCertificationHeader: renderCertificationHeader,
    renderClaimCta: renderClaimCta,
    renderFAQs: renderFAQs,
    renderFooter: renderFooter,
    setActiveNavSection: setActiveNavSection,
    updateActiveNavOnScroll: updateActiveNavOnScroll,
    logActivity: logActivity,
    getAuditLogs: getAuditLogs
  };

})(window);
