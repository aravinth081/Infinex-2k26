/**
 * admin-cms-controller.js — Enterprise Admin CMS Controller
 * HORIZON X 2K26 GLOBAL HACKATHON • INNOVATION HACKS
 *
 * Handles form binding, live preview, CRUD for Tracks, Timeline, FAQs, Navigation,
 * Media Library, SEO, Role-Based Access Control (RBAC), and Audit Logging.
 */

(function (window) {
  'use strict';

  // ── ADMIN ROLES & ACCOUNTS REGISTRY ──
  const DEFAULT_ADMIN_USERS = [
    { username: 'admin.innovationhacks@2k', name: 'Primary Super Admin', role: 'Super Admin', pass: 'innovation@2k' },
    { username: 'admin.innnovationhacks@2k', name: 'Primary Super Admin', role: 'Super Admin', pass: 'innovation@2k' },
    { username: 'admin', name: 'Primary Super Admin', role: 'Super Admin', pass: 'innovation@2k' },
    { username: 'content@innovationhacks.org', name: 'Lead Content Strategist', role: 'Content Manager', pass: 'innovation@2k' },
    { username: 'certs@innovationhacks.org', name: 'Credentials Officer', role: 'Certificate Manager', pass: 'innovation@2k' },
    { username: 'events@innovationhacks.org', name: 'Hackathon Director', role: 'Event Manager', pass: 'innovation@2k' },
    { username: 'viewer@innovationhacks.org', name: 'Auditor & Observer', role: 'Read-only Admin', pass: 'innovation@2k' }
  ];

  function getAdminUsers() {
    try {
      const stored = localStorage.getItem('horizon_admin_users');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return DEFAULT_ADMIN_USERS;
  }

  function saveAdminUsers(users) {
    try {
      localStorage.setItem('horizon_admin_users', JSON.stringify(users));
    } catch (e) {}
  }

  // ── ROLE PERMISSION MATRIX ──
  const ROLE_PERMISSIONS = {
    'Super Admin': { canCMS: true, canCerts: true, canEvents: true, canSettings: true, canRoles: true, isReadOnly: false },
    'Content Manager': { canCMS: true, canCerts: false, canEvents: true, canSettings: false, canRoles: false, isReadOnly: false },
    'Certificate Manager': { canCMS: false, canCerts: true, canEvents: false, canSettings: false, canRoles: false, isReadOnly: false },
    'Event Manager': { canCMS: false, canCerts: false, canEvents: true, canSettings: false, canRoles: false, isReadOnly: false },
    'Read-only Admin': { canCMS: false, canCerts: false, canEvents: false, canSettings: false, canRoles: false, isReadOnly: true }
  };

  function getCurrentUser() {
    let email = 'admin.innovationhacks@2k';
    let name = 'Super Administrator';
    let role = 'Super Admin';
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        email = window.sessionStorage.getItem('admin_user_email') || email;
        name = window.sessionStorage.getItem('admin_user_name') || name;
        role = window.sessionStorage.getItem('admin_role') || role;
      }
    } catch (e) {}
    return { username: email, name: name, role: role };
  }

  function enforceRolePermissions() {
    const user = getCurrentUser();
    const perms = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS['Read-only Admin'];

    // Update Role Badge in Header
    const roleBadge = document.getElementById('adminRoleBadge');
    if (roleBadge) {
      roleBadge.textContent = user.role;
      roleBadge.className = 'admin-role-badge ' + user.role.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }

    // Read-only enforcement: disable all CMS save/publish buttons if read-only
    if (perms.isReadOnly) {
      document.querySelectorAll('.btn-cms-save, .btn-save-all, .btn-danger, .btn-primary').forEach(btn => {
        if (!btn.classList.contains('allow-readonly')) {
          btn.disabled = true;
          btn.title = 'Action disabled for Read-only Admin';
          btn.style.opacity = '0.55';
          btn.style.cursor = 'not-allowed';
        }
      });
    }
  }

  // ── POPULATE CMS FORMS ──
  function populateCMSForms() {
    if (!window.HorizonCMS) return;
    const data = window.HorizonCMS.getContent();

    // 1. Global Settings
    setVal('cmsSiteName', data.global.siteName);
    setVal('cmsTabTitle', data.global.tabTitle || (data.seo && data.seo.home && data.seo.home.title) || '');
    setVal('cmsTagline', data.global.tagline);
    setVal('cmsLogoUrl', data.global.logoUrl);
    setVal('cmsFaviconUrl', data.global.faviconUrl);
    setVal('cmsOrganizerName', data.global.organizerName);
    setVal('cmsOrganizerLogo', data.global.organizerLogo);
    setVal('cmsContactEmail', data.global.contactEmail);
    setVal('cmsSupportPhone', data.global.supportPhone);
    setVal('cmsCommunityUrl', data.global.communityUrl);
    setChecked('cmsMaintenanceToggle', data.global.maintenanceMode);
    setVal('cmsMaintenanceMsg', data.global.maintenanceMessage);

    // 2. Announcement Bar
    setChecked('cmsAnnEnabled', data.announcement.enabled);
    setVal('cmsAnnBadge', data.announcement.badge);
    setVal('cmsAnnMessage', data.announcement.message);
    setVal('cmsAnnLinkText', data.announcement.linkText);
    setVal('cmsAnnLinkUrl', data.announcement.linkUrl);
    setVal('cmsAnnBgColor', data.announcement.bgColor);
    setVal('cmsAnnTextColor', data.announcement.textColor);

    // 3. Hero Section
    setVal('cmsHeroEyebrow', data.hero.eyebrowText);
    setVal('cmsHeroTitleLine1', data.hero.titleLine1);
    setVal('cmsHeroTitleHighlight', data.hero.titleHighlight);
    setVal('cmsHeroLead', data.hero.lead);
    setVal('cmsHeroPrimaryCtaText', data.hero.primaryCtaText);
    setVal('cmsHeroPrimaryCtaUrl', data.hero.primaryCtaUrl);
    setVal('cmsHeroSecondaryCtaText', data.hero.secondaryCtaText);
    setVal('cmsHeroSecondaryCtaUrl', data.hero.secondaryCtaUrl);
    setVal('cmsHeroRobotImg', data.hero.robotImage);
    setVal('cmsHeroBadge1Icon', data.hero.badge1Icon);
    setVal('cmsHeroBadge1Title', data.hero.badge1Title);
    setVal('cmsHeroBadge1Subtitle', data.hero.badge1Subtitle);
    setVal('cmsHeroBadge2Icon', data.hero.badge2Icon);
    setVal('cmsHeroBadge2Title', data.hero.badge2Title);
    setVal('cmsHeroBadge2Subtitle', data.hero.badge2Subtitle);

    // Audience Cards
    if (Array.isArray(data.hero.audienceCards)) {
      data.hero.audienceCards.forEach((c, i) => {
        setVal(`cmsAudTitle${i+1}`, c.title);
        setVal(`cmsAudDesc${i+1}`, c.desc);
        setVal(`cmsAudIcon${i+1}`, c.icon);
      });
    }

    // 4. About Section
    setVal('cmsAboutEyebrow', data.about.eyebrow);
    setVal('cmsAboutTitleLead', data.about.titleLead);
    setVal('cmsAboutTitleHighlight', data.about.titleHighlight);
    setVal('cmsAboutLeadDesc', data.about.leadDesc);
    setVal('cmsAboutRobotImg', data.about.robotImage);
    setVal('cmsAboutNote', data.about.handwrittenNote);

    // About Pillars
    if (Array.isArray(data.about.pillars)) {
      data.about.pillars.forEach((p, i) => {
        setVal(`cmsPillarTitle${i+1}`, p.title);
        setVal(`cmsPillarDesc${i+1}`, p.desc);
        setVal(`cmsPillarUrl${i+1}`, p.actionUrl);
      });
    }

    // 5. Hackathon
    setVal('cmsHackName', data.hackathon.name);
    setVal('cmsHackTagline', data.hackathon.tagline);
    setVal('cmsHackDesc', data.hackathon.description);
    setVal('cmsHackBanner', data.hackathon.bannerImage);
    setVal('cmsHackStatus', data.hackathon.status);
    setVal('cmsHackRegStatus', data.hackathon.registrationStatus);
    setVal('cmsHackDeadline', data.hackathon.registrationDeadline);
    setVal('cmsHackStartDate', data.hackathon.eventStartDate);
    setVal('cmsHackEndDate', data.hackathon.eventEndDate);
    setVal('cmsHackEligibility', data.hackathon.eligibility);

    // 5.1 Official Credential Portal Header (Image 1)
    const certH = data.certificationHeader || {};
    setVal('cmsCertPortalEyebrow', certH.eyebrow || 'OFFICIAL CREDENTIAL PORTAL');
    setVal('cmsCertPortalTitlePrefix', certH.titlePrefix || 'Claim Your');
    setVal('cmsCertPortalTitleHighlight', certH.titleHighlight || 'Official Certificate');
    setVal('cmsCertPortalDesc', certH.description || 'Generate, preview, and download your verified HORIZON X 2K26 digital credential at print-ready 300 DPI.');

    // 5.2 Certificate Claim CTA Card (Image 2)
    const cta = data.claimCta || {};
    setVal('cmsClaimCtaHeading', cta.heading || 'Ready to Earn Your Official Certificate?');
    setVal('cmsClaimCtaDesc', cta.description || '');
    setVal('cmsClaimCtaBtn1Text', cta.primaryButtonText || 'Register on Unstop');
    setVal('cmsClaimCtaBtn1Url', cta.primaryButtonUrl || (data.navigation && data.navigation.primaryCtaUrl) || '');
    setVal('cmsClaimCtaBtn2Text', cta.secondaryButtonText || 'Join WhatsApp Group');
    setVal('cmsClaimCtaBtn2Url', cta.secondaryButtonUrl || (data.global && data.global.communityUrl) || '');

    // 6. Prizes
    setVal('cmsPrizePool', data.prizes.poolTotal);
    setVal('cmsPrizeSubtitle', data.prizes.subtitle);
    setVal('cmsPrizePodium', data.prizes.podiumImage);
    if (data.prizes.tier1) {
      setVal('cmsP1Title', data.prizes.tier1.title);
      setVal('cmsP1Amount', data.prizes.tier1.amount);
      setVal('cmsP1Perks', (data.prizes.tier1.perks || []).join('\n'));
    }
    if (data.prizes.tier2) {
      setVal('cmsP2Title', data.prizes.tier2.title);
      setVal('cmsP2Amount', data.prizes.tier2.amount);
      setVal('cmsP2Perks', (data.prizes.tier2.perks || []).join('\n'));
    }
    if (data.prizes.tier3) {
      setVal('cmsP3Title', data.prizes.tier3.title);
      setVal('cmsP3Amount', data.prizes.tier3.amount);
      setVal('cmsP3Perks', (data.prizes.tier3.perks || []).join('\n'));
    }

    // 7. Navigation & Footer
    setVal('cmsNavBrandTitle', data.navigation.brandTitle);
    setVal('cmsNavBrandTagline', data.navigation.brandTagline);
    setVal('cmsNavPrimaryCtaText', data.navigation.primaryCtaText);
    setVal('cmsNavPrimaryCtaUrl', data.navigation.primaryCtaUrl);
    setVal('cmsNavSecCtaText', data.navigation.secondaryCtaText);
    setVal('cmsNavSecCtaUrl', data.navigation.secondaryCtaUrl);
    setVal('cmsFooterDesc', data.footer.brandDesc);
    setVal('cmsFooterCopyright', data.footer.copyrightText);
    setVal('cmsFooterPlatformText', (data.footer && data.footer.officialPlatformText) || `${data.global.siteName || 'HORIZON X 2K26'} on Unstop`);
    setVal('cmsFooterPlatformUrl', (data.footer && data.footer.officialPlatformUrl) || (data.navigation && data.navigation.primaryCtaUrl) || '');
    if (data.footer.socialLinks) {
      setVal('cmsSocialWhatsapp', data.footer.socialLinks.whatsapp);
      setVal('cmsSocialUnstop', data.footer.socialLinks.unstop);
      setVal('cmsSocialGithub', data.footer.socialLinks.github);
      setVal('cmsSocialLinkedin', data.footer.socialLinks.linkedin);
      setVal('cmsSocialInstagram', data.footer.socialLinks.instagram);
    }

    // 7.5 FAQ Section Header (Image 5)
    const fHeader = data.faqHeader || {};
    setVal('cmsFaqEyebrow', fHeader.eyebrow || 'Frequently Asked Questions');
    setVal('cmsFaqTitle', fHeader.title || 'Got Questions?');
    setVal('cmsFaqDesc', fHeader.description || '');

    // 8. SEO
    if (data.seo && data.seo.home) {
      setVal('cmsSeoTitle', data.seo.home.title);
      setVal('cmsSeoDesc', data.seo.home.metaDescription);
      setVal('cmsSeoKeywords', data.seo.home.keywords);
      setVal('cmsSeoOgTitle', data.seo.home.ogTitle);
      setVal('cmsSeoOgDesc', data.seo.home.ogDescription);
      setVal('cmsSeoOgImage', data.seo.home.ogImage);
      setVal('cmsSeoCanonical', data.seo.home.canonicalUrl);
    }

    // Render Data Tables
    renderTracksAdminTable();
    renderTimelineAdminTable();
    renderFaqsAdminTable();
    renderNavAdminTable();
    renderMediaAdminGrid();
    renderAuditLogsTable();
    renderRolesAdminTable();
  }

  // ── SAVE HANDLERS ──
  async function saveCMSSection(section) {
    const user = getCurrentUser();
    const perms = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS['Read-only Admin'];
    if (perms.isReadOnly) {
      Swal.fire({ title: 'Read-only Mode', text: 'You do not have permission to modify content.', icon: 'info' });
      return;
    }

    const current = window.HorizonCMS.getContent();
    let updates = {};
    let desc = '';

    if (section === 'global') {
      const tabT = getVal('cmsTabTitle');
      updates = {
        global: {
          siteName: getVal('cmsSiteName'),
          tabTitle: tabT,
          tagline: getVal('cmsTagline'),
          logoUrl: getVal('cmsLogoUrl'),
          faviconUrl: getVal('cmsFaviconUrl'),
          organizerName: getVal('cmsOrganizerName'),
          organizerLogo: getVal('cmsOrganizerLogo'),
          contactEmail: getVal('cmsContactEmail'),
          supportPhone: getVal('cmsSupportPhone'),
          communityUrl: getVal('cmsCommunityUrl'),
          maintenanceMode: getChecked('cmsMaintenanceToggle'),
          maintenanceMessage: getVal('cmsMaintenanceMsg')
        }
      };
      if (tabT) {
        updates.seo = { home: { title: tabT } };
      }
      desc = 'Updated Global Website Settings & Branding';
    } else if (section === 'announcement') {
      updates = {
        announcement: {
          enabled: getChecked('cmsAnnEnabled'),
          badge: getVal('cmsAnnBadge'),
          message: getVal('cmsAnnMessage'),
          linkText: getVal('cmsAnnLinkText'),
          linkUrl: getVal('cmsAnnLinkUrl'),
          bgColor: getVal('cmsAnnBgColor'),
          textColor: getVal('cmsAnnTextColor')
        }
      };
      desc = 'Updated Announcement Bar Configuration';
    } else if (section === 'hero') {
      const audCards = [1, 2, 3, 4].map(i => ({
        id: `aud-${i}`,
        title: getVal(`cmsAudTitle${i}`),
        desc: getVal(`cmsAudDesc${i}`),
        icon: getVal(`cmsAudIcon${i}`)
      }));

      updates = {
        hero: {
          eyebrowText: getVal('cmsHeroEyebrow'),
          titleLine1: getVal('cmsHeroTitleLine1'),
          titleHighlight: getVal('cmsHeroTitleHighlight'),
          lead: getVal('cmsHeroLead'),
          primaryCtaText: getVal('cmsHeroPrimaryCtaText'),
          primaryCtaUrl: getVal('cmsHeroPrimaryCtaUrl'),
          secondaryCtaText: getVal('cmsHeroSecondaryCtaText'),
          secondaryCtaUrl: getVal('cmsHeroSecondaryCtaUrl'),
          robotImage: getVal('cmsHeroRobotImg'),
          badge1Icon: getVal('cmsHeroBadge1Icon'),
          badge1Title: getVal('cmsHeroBadge1Title'),
          badge1Subtitle: getVal('cmsHeroBadge1Subtitle'),
          badge2Icon: getVal('cmsHeroBadge2Icon'),
          badge2Title: getVal('cmsHeroBadge2Title'),
          badge2Subtitle: getVal('cmsHeroBadge2Subtitle'),
          audienceCards: audCards
        }
      };
      desc = 'Updated Hero Section, Headline & Audience Cards';
    } else if (section === 'about') {
      const pillars = [1, 2, 3].map(i => ({
        id: `pillar-${i}`,
        number: `0${i}`,
        title: getVal(`cmsPillarTitle${i}`),
        desc: getVal(`cmsPillarDesc${i}`),
        actionUrl: getVal(`cmsPillarUrl${i}`)
      }));

      updates = {
        about: {
          eyebrow: getVal('cmsAboutEyebrow'),
          titleLead: getVal('cmsAboutTitleLead'),
          titleHighlight: getVal('cmsAboutTitleHighlight'),
          leadDesc: getVal('cmsAboutLeadDesc'),
          robotImage: getVal('cmsAboutRobotImg'),
          handwrittenNote: getVal('cmsAboutNote'),
          pillars: pillars
        }
      };
      desc = 'Updated About Innovation Hacks & Pillar Cards';
    } else if (section === 'hackathon') {
      updates = {
        hackathon: {
          name: getVal('cmsHackName'),
          tagline: getVal('cmsHackTagline'),
          description: getVal('cmsHackDesc'),
          bannerImage: getVal('cmsHackBanner'),
          status: getVal('cmsHackStatus'),
          registrationStatus: getVal('cmsHackRegStatus'),
          registrationDeadline: getVal('cmsHackDeadline'),
          eventStartDate: getVal('cmsHackStartDate'),
          eventEndDate: getVal('cmsHackEndDate'),
          eligibility: getVal('cmsHackEligibility')
        },
        certificationHeader: {
          eyebrow: getVal('cmsCertPortalEyebrow'),
          titlePrefix: getVal('cmsCertPortalTitlePrefix'),
          titleHighlight: getVal('cmsCertPortalTitleHighlight'),
          description: getVal('cmsCertPortalDesc')
        },
        claimCta: {
          heading: getVal('cmsClaimCtaHeading'),
          description: getVal('cmsClaimCtaDesc'),
          primaryButtonText: getVal('cmsClaimCtaBtn1Text'),
          primaryButtonUrl: getVal('cmsClaimCtaBtn1Url'),
          secondaryButtonText: getVal('cmsClaimCtaBtn2Text'),
          secondaryButtonUrl: getVal('cmsClaimCtaBtn2Url')
        }
      };
      desc = 'Updated Hackathon Details, Certification Portal Header & Certificate Claim CTA';
    } else if (section === 'prizes') {
      updates = {
        prizes: {
          poolTotal: getVal('cmsPrizePool'),
          subtitle: getVal('cmsPrizeSubtitle'),
          podiumImage: getVal('cmsPrizePodium'),
          tier1: {
            title: getVal('cmsP1Title'),
            amount: getVal('cmsP1Amount'),
            badge: '🥇 1st Place',
            perks: getVal('cmsP1Perks').split('\n').map(s => s.trim()).filter(Boolean)
          },
          tier2: {
            title: getVal('cmsP2Title'),
            amount: getVal('cmsP2Amount'),
            badge: '🥈 2nd Place',
            perks: getVal('cmsP2Perks').split('\n').map(s => s.trim()).filter(Boolean)
          },
          tier3: {
            title: getVal('cmsP3Title'),
            amount: getVal('cmsP3Amount'),
            badge: '🥉 3rd Place',
            perks: getVal('cmsP3Perks').split('\n').map(s => s.trim()).filter(Boolean)
          }
        }
      };
      desc = 'Updated Prizes, Reward Tiers & Perks';
    } else if (section === 'faq') {
      updates = {
        faqHeader: {
          eyebrow: getVal('cmsFaqEyebrow'),
          title: getVal('cmsFaqTitle'),
          description: getVal('cmsFaqDesc')
        }
      };
      desc = 'Updated FAQ Section Header and Description';
    } else if (section === 'navfooter') {
      updates = {
        navigation: {
          brandTitle: getVal('cmsNavBrandTitle'),
          brandTagline: getVal('cmsNavBrandTagline'),
          primaryCtaText: getVal('cmsNavPrimaryCtaText'),
          primaryCtaUrl: getVal('cmsNavPrimaryCtaUrl'),
          secondaryCtaText: getVal('cmsNavSecCtaText'),
          secondaryCtaUrl: getVal('cmsNavSecCtaUrl')
        },
        footer: {
          brandDesc: getVal('cmsFooterDesc'),
          copyrightText: getVal('cmsFooterCopyright'),
          officialPlatformText: getVal('cmsFooterPlatformText'),
          officialPlatformUrl: getVal('cmsFooterPlatformUrl'),
          socialLinks: {
            whatsapp: getVal('cmsSocialWhatsapp'),
            unstop: getVal('cmsSocialUnstop'),
            github: getVal('cmsSocialGithub'),
            linkedin: getVal('cmsSocialLinkedin'),
            instagram: getVal('cmsSocialInstagram')
          }
        }
      };
      desc = 'Updated Navigation, Footer & Official Platform Link';
    } else if (section === 'seo') {
      const seoTitle = getVal('cmsSeoTitle');
      updates = {
        seo: {
          home: {
            title: seoTitle,
            metaDescription: getVal('cmsSeoDesc'),
            keywords: getVal('cmsSeoKeywords'),
            ogTitle: getVal('cmsSeoOgTitle'),
            ogDescription: getVal('cmsSeoOgDesc'),
            ogImage: getVal('cmsSeoOgImage'),
            canonicalUrl: getVal('cmsSeoCanonical')
          }
        }
      };
      if (seoTitle) {
        updates.global = { tabTitle: seoTitle };
      }
      desc = 'Updated SEO Meta Tags, Social Sharing & Canonical URL';
    }

    try {
      await window.HorizonCMS.saveContent(updates, true);
      await window.HorizonCMS.logActivity('Save & Publish', desc, user.name, user.role);

      Swal.fire({
        title: 'Changes Published!',
        text: `${desc} has been synchronized to the live website.`,
        icon: 'success',
        timer: 1800,
        showConfirmButton: false,
        background: '#FFFFFF',
        color: '#0B2D5C'
      });
      renderAuditLogsTable();
    } catch (err) {
      Swal.fire({ title: 'Error Saving', text: err.message, icon: 'error' });
    }
  }

  // ── PUBLISH ALL CMS BUTTON ──
  async function publishAllCMS() {
    const user = getCurrentUser();
    const perms = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS['Read-only Admin'];
    if (perms.isReadOnly) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({ title: 'Read-only Mode', text: 'You do not have permission to publish changes.', icon: 'info' });
      }
      return;
    }

    // Check if on Unstop Smart Importer panel or if #unstopRawInput has text
    const unstopInput = document.getElementById('unstopRawInput');
    const unstopText = unstopInput ? unstopInput.value.trim() : '';
    const smartPanel = document.getElementById('p-cms-smart-import');
    const isSmartImportActive = smartPanel && smartPanel.classList.contains('active');

    if (unstopText) {
      // Auto-fill all sections and publish live instantly!
      await applyUnstopData();
      return;
    } else if (isSmartImportActive) {
      if (typeof Swal !== 'undefined') {
        const res = await Swal.fire({
          title: 'Unstop Text Required',
          text: 'The Unstop input box is empty. Would you like to load example hackathon data (HACKVERSE 2026) and publish live across all sections?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: '🚀 Load Example & Publish Live',
          cancelButtonText: 'I Will Paste My Text',
          confirmButtonColor: '#2563EB',
          cancelButtonColor: '#64748B'
        });
        if (res.isConfirmed) {
          loadSampleUnstopText();
          await applyUnstopData();
        }
      }
      return;
    }

    // Save all current CMS form sections in one smooth pass
    const sections = ['global', 'announcement', 'hero', 'about', 'hackathon', 'prizes', 'faq', 'navfooter', 'seo'];
    for (const sec of sections) {
      await saveCMSSection(sec, true);
    }

    populateCMSForms();
    renderAuditLogsTable();

    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: '🚀 Complete Website Synchronized!',
        text: 'Every section, banner, prize, and configuration has been published to the live platform.',
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: '🌐 View Live Website',
        cancelButtonText: 'Stay in Admin Panel',
        confirmButtonColor: '#2563EB',
        cancelButtonColor: '#64748B'
      }).then((res) => {
        if (res.isConfirmed) {
          window.open('index.html', '_blank');
        }
      });
    }
  }

  // ── TRACKS CRUD ──
  function renderTracksAdminTable() {
    const container = document.getElementById('adminTracksTableBody');
    if (!container) return;
    const content = window.HorizonCMS.getContent();
    const tracks = content.tracks || [];

    if (tracks.length === 0) {
      container.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted);">No tracks configured. Add one below!</td></tr>`;
      return;
    }

    container.innerHTML = tracks.map((t, i) => `
      <tr>
        <td style="font-weight:700;">#${t.number || (i+1)}</td>
        <td style="font-size:20px;text-align:center;">${t.icon || '🧠'}</td>
        <td style="font-weight:700;color:var(--navy);">${escapeHtml(t.title)}</td>
        <td><span class="badge" style="background:#EDF7FF;color:#1684D8;font-weight:700;">${escapeHtml(t.category || 'General')}</span></td>
        <td>
          <span style="display:inline-block;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;background:${t.active ? '#ECFDF5;color:#059669' : '#FEF2F2;color:#DC2626'};">
            ${t.active ? 'ACTIVE' : 'DISABLED'}
          </span>
        </td>
        <td>
          <div style="display:flex;gap:6px;">
            <button type="button" class="btn btn-outline" style="padding:4px 8px;font-size:12px;" onclick="window.AdminCMS.editTrack('${t.id}')">✏️ Edit</button>
            <button type="button" class="btn btn-danger" style="padding:4px 8px;font-size:12px;" onclick="window.AdminCMS.deleteTrack('${t.id}')">🗑</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function editTrack(trackId) {
    const content = window.HorizonCMS.getContent();
    const track = (content.tracks || []).find(t => t.id === trackId);
    if (!track) return;

    Swal.fire({
      title: 'Edit Problem Statement / Track',
      html: `
        <div style="text-align:left;display:flex;flex-direction:column;gap:12px;">
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Track Number</label>
            <input id="swalTrackNum" class="swal2-input" style="width:100%;margin:4px 0;" value="${escapeHtml(track.number || '')}">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Track Title</label>
            <input id="swalTrackTitle" class="swal2-input" style="width:100%;margin:4px 0;" value="${escapeHtml(track.title || '')}">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Icon (Emoji or SVG)</label>
            <input id="swalTrackIcon" class="swal2-input" style="width:100%;margin:4px 0;" value="${escapeHtml(track.icon || '🧠')}">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Category</label>
            <input id="swalTrackCat" class="swal2-input" style="width:100%;margin:4px 0;" value="${escapeHtml(track.category || '')}">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Brief Description</label>
            <textarea id="swalTrackDesc" class="swal2-textarea" style="width:100%;margin:4px 0;height:70px;">${escapeHtml(track.desc || '')}</textarea>
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Specific Challenges (One per line)</label>
            <textarea id="swalTrackChallenges" class="swal2-textarea" style="width:100%;margin:4px 0;height:80px;">${(track.challenges || []).join('\n')}</textarea>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <input type="checkbox" id="swalTrackActive" ${track.active !== false ? 'checked' : ''}>
            <label for="swalTrackActive" style="font-size:13px;font-weight:600;">Enable Track on Live Site</label>
          </div>
        </div>
      `,
      width: '560px',
      showCancelButton: true,
      confirmButtonText: 'Save Track',
      confirmButtonColor: '#1684D8',
      preConfirm: () => {
        return {
          id: track.id,
          number: document.getElementById('swalTrackNum').value.trim(),
          title: document.getElementById('swalTrackTitle').value.trim(),
          icon: document.getElementById('swalTrackIcon').value.trim(),
          category: document.getElementById('swalTrackCat').value.trim(),
          desc: document.getElementById('swalTrackDesc').value.trim(),
          challenges: document.getElementById('swalTrackChallenges').value.split('\n').map(s => s.trim()).filter(Boolean),
          active: document.getElementById('swalTrackActive').checked
        };
      }
    }).then(async (res) => {
      if (res.isConfirmed && res.value) {
        const content = window.HorizonCMS.getContent();
        const idx = content.tracks.findIndex(t => t.id === track.id);
        if (idx >= 0) {
          content.tracks[idx] = Object.assign({}, content.tracks[idx], res.value);
          await window.HorizonCMS.saveContent({ tracks: content.tracks }, true);
          window.HorizonCMS.logActivity('Track Updated', `Edited track: ${res.value.title}`);
          renderTracksAdminTable();
          Swal.fire({ title: 'Track Updated!', icon: 'success', timer: 1200, showConfirmButton: false });
        }
      }
    });
  }

  function addTrack() {
    Swal.fire({
      title: 'Add New Challenge Track',
      html: `
        <div style="text-align:left;display:flex;flex-direction:column;gap:12px;">
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Track Number (e.g. 06)</label>
            <input id="swalTrackNum" class="swal2-input" style="width:100%;margin:4px 0;" placeholder="06">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Track Title</label>
            <input id="swalTrackTitle" class="swal2-input" style="width:100%;margin:4px 0;" placeholder="e.g. Quantum Computing & AI">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Icon (Emoji or SVG)</label>
            <input id="swalTrackIcon" class="swal2-input" style="width:100%;margin:4px 0;" value="💡">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Category</label>
            <input id="swalTrackCat" class="swal2-input" style="width:100%;margin:4px 0;" placeholder="e.g. Quantum AI">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Brief Description</label>
            <textarea id="swalTrackDesc" class="swal2-textarea" style="width:100%;margin:4px 0;height:70px;" placeholder="Describe the track objectives..."></textarea>
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Specific Challenges (One per line)</label>
            <textarea id="swalTrackChallenges" class="swal2-textarea" style="width:100%;margin:4px 0;height:80px;" placeholder="Challenge 1&#10;Challenge 2"></textarea>
          </div>
        </div>
      `,
      width: '560px',
      showCancelButton: true,
      confirmButtonText: 'Create Track',
      confirmButtonColor: '#1684D8',
      preConfirm: () => {
        const title = document.getElementById('swalTrackTitle').value.trim();
        if (!title) { Swal.showValidationMessage('Track title is required'); return false; }
        return {
          id: 'track-' + Date.now(),
          number: document.getElementById('swalTrackNum').value.trim() || '01',
          title: title,
          icon: document.getElementById('swalTrackIcon').value.trim() || '💡',
          category: document.getElementById('swalTrackCat').value.trim() || 'General',
          desc: document.getElementById('swalTrackDesc').value.trim(),
          challenges: document.getElementById('swalTrackChallenges').value.split('\n').map(s => s.trim()).filter(Boolean),
          active: true,
          order: Date.now()
        };
      }
    }).then(async (res) => {
      if (res.isConfirmed && res.value) {
        const content = window.HorizonCMS.getContent();
        content.tracks = content.tracks || [];
        content.tracks.push(res.value);
        await window.HorizonCMS.saveContent({ tracks: content.tracks }, true);
        window.HorizonCMS.logActivity('Track Added', `Created track: ${res.value.title}`);
        renderTracksAdminTable();
        Swal.fire({ title: 'Track Added!', text: 'Live website updated with new track.', icon: 'success', timer: 1400, showConfirmButton: false });
      }
    });
  }

  async function deleteTrack(trackId) {
    const res = await Swal.fire({
      title: 'Delete Track?',
      text: 'Are you sure you want to remove this problem statement? This will remove it from the live site.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      confirmButtonColor: '#EF4444'
    });

    if (res.isConfirmed) {
      const content = window.HorizonCMS.getContent();
      content.tracks = (content.tracks || []).filter(t => t.id !== trackId);
      await window.HorizonCMS.saveContent({ tracks: content.tracks }, true);
      window.HorizonCMS.logActivity('Track Deleted', `Removed track ${trackId}`);
      renderTracksAdminTable();
      Swal.fire({ title: 'Deleted', text: 'Track deleted successfully.', icon: 'success', timer: 1200, showConfirmButton: false });
    }
  }

  // ── TIMELINE CRUD ──
  function renderTimelineAdminTable() {
    const container = document.getElementById('adminTimelineTableBody');
    if (!container) return;
    const content = window.HorizonCMS.getContent();
    const steps = (content.hackathon && content.hackathon.timeline) || [];

    if (steps.length === 0) {
      container.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted);">No stages configured. Add one below!</td></tr>`;
      return;
    }

    container.innerHTML = steps.map((s, i) => `
      <tr>
        <td style="font-weight:700;">${escapeHtml(s.stage || 'Phase ' + (i+1))}</td>
        <td style="font-weight:600;color:#1684D8;">${escapeHtml(s.date)}</td>
        <td style="font-weight:700;color:var(--navy);">${escapeHtml(s.title)}</td>
        <td>
          <span style="display:inline-block;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;background:${s.status === 'completed' ? '#ECFDF5;color:#059669' : s.status === 'ongoing' ? '#EFF6FF;color:#2563EB' : '#F1F5F9;color:#64748B'};">
            ${escapeHtml(s.status || 'upcoming')}
          </span>
        </td>
        <td>
          <div style="display:flex;gap:6px;">
            <button type="button" class="btn btn-outline" style="padding:4px 8px;font-size:12px;" onclick="window.AdminCMS.editTimelineStage(${i})">✏️ Edit</button>
            <button type="button" class="btn btn-danger" style="padding:4px 8px;font-size:12px;" onclick="window.AdminCMS.deleteTimelineStage(${i})">🗑</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function editTimelineStage(idx) {
    const content = window.HorizonCMS.getContent();
    const stage = content.hackathon.timeline[idx];
    if (!stage) return;

    Swal.fire({
      title: 'Edit Timeline Stage',
      html: `
        <div style="text-align:left;display:flex;flex-direction:column;gap:12px;">
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Phase / Stage Label</label>
            <input id="swalStageLabel" class="swal2-input" style="width:100%;margin:4px 0;" value="${escapeHtml(stage.stage || '')}">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Date & Timing</label>
            <input id="swalStageDate" class="swal2-input" style="width:100%;margin:4px 0;" value="${escapeHtml(stage.date || '')}">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Stage Title</label>
            <input id="swalStageTitle" class="swal2-input" style="width:100%;margin:4px 0;" value="${escapeHtml(stage.title || '')}">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Description</label>
            <textarea id="swalStageDesc" class="swal2-textarea" style="width:100%;margin:4px 0;height:70px;">${escapeHtml(stage.desc || '')}</textarea>
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Status</label>
            <select id="swalStageStatus" class="swal2-select" style="width:100%;margin:4px 0;">
              <option value="upcoming" ${stage.status === 'upcoming' ? 'selected' : ''}>Upcoming</option>
              <option value="ongoing" ${stage.status === 'ongoing' ? 'selected' : ''}>Ongoing (Active Highlight)</option>
              <option value="completed" ${stage.status === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
          </div>
        </div>
      `,
      width: '540px',
      showCancelButton: true,
      confirmButtonText: 'Save Stage',
      confirmButtonColor: '#1684D8',
      preConfirm: () => {
        return {
          stage: document.getElementById('swalStageLabel').value.trim(),
          date: document.getElementById('swalStageDate').value.trim(),
          title: document.getElementById('swalStageTitle').value.trim(),
          desc: document.getElementById('swalStageDesc').value.trim(),
          status: document.getElementById('swalStageStatus').value
        };
      }
    }).then(async (res) => {
      if (res.isConfirmed && res.value) {
        const content = window.HorizonCMS.getContent();
        content.hackathon.timeline[idx] = res.value;
        await window.HorizonCMS.saveContent({ hackathon: content.hackathon }, true);
        window.HorizonCMS.logActivity('Timeline Updated', `Edited stage: ${res.value.title}`);
        renderTimelineAdminTable();
        Swal.fire({ title: 'Stage Updated!', icon: 'success', timer: 1200, showConfirmButton: false });
      }
    });
  }

  function addTimelineStage() {
    Swal.fire({
      title: 'Add Timeline Stage',
      html: `
        <div style="text-align:left;display:flex;flex-direction:column;gap:12px;">
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Phase Label</label>
            <input id="swalStageLabel" class="swal2-input" style="width:100%;margin:4px 0;" placeholder="e.g. Phase 6">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Date & Timing</label>
            <input id="swalStageDate" class="swal2-input" style="width:100%;margin:4px 0;" placeholder="e.g. April 10, 2026">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Title</label>
            <input id="swalStageTitle" class="swal2-input" style="width:100%;margin:4px 0;" placeholder="e.g. Winner Demo Day">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Description</label>
            <textarea id="swalStageDesc" class="swal2-textarea" style="width:100%;margin:4px 0;height:70px;" placeholder="Brief details..."></textarea>
          </div>
        </div>
      `,
      width: '540px',
      showCancelButton: true,
      confirmButtonText: 'Add Stage',
      confirmButtonColor: '#1684D8',
      preConfirm: () => {
        return {
          stage: document.getElementById('swalStageLabel').value.trim() || 'New Stage',
          date: document.getElementById('swalStageDate').value.trim() || 'TBA',
          title: document.getElementById('swalStageTitle').value.trim() || 'Upcoming Event',
          desc: document.getElementById('swalStageDesc').value.trim(),
          status: 'upcoming'
        };
      }
    }).then(async (res) => {
      if (res.isConfirmed && res.value) {
        const content = window.HorizonCMS.getContent();
        content.hackathon.timeline = content.hackathon.timeline || [];
        content.hackathon.timeline.push(res.value);
        await window.HorizonCMS.saveContent({ hackathon: content.hackathon }, true);
        window.HorizonCMS.logActivity('Timeline Stage Added', `Created stage: ${res.value.title}`);
        renderTimelineAdminTable();
        Swal.fire({ title: 'Stage Added!', icon: 'success', timer: 1200, showConfirmButton: false });
      }
    });
  }

  async function deleteTimelineStage(idx) {
    const res = await Swal.fire({
      title: 'Delete Stage?',
      text: 'Remove this stage from the public hackathon schedule?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#EF4444'
    });

    if (res.isConfirmed) {
      const content = window.HorizonCMS.getContent();
      content.hackathon.timeline.splice(idx, 1);
      await window.HorizonCMS.saveContent({ hackathon: content.hackathon }, true);
      window.HorizonCMS.logActivity('Timeline Stage Deleted', `Removed stage index ${idx}`);
      renderTimelineAdminTable();
      Swal.fire({ title: 'Deleted', icon: 'success', timer: 1200, showConfirmButton: false });
    }
  }

  // ── FAQS CRUD ──
  function renderFaqsAdminTable() {
    const container = document.getElementById('adminFaqsTableBody');
    if (!container) return;
    const content = window.HorizonCMS.getContent();
    const faqs = content.faqs || [];

    if (faqs.length === 0) {
      container.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted);">No FAQs configured. Add one below!</td></tr>`;
      return;
    }

    container.innerHTML = faqs.map((f, i) => `
      <tr>
        <td style="font-weight:700;">#${i + 1}</td>
        <td style="font-weight:700;color:var(--navy);max-width:300px;">${escapeHtml(f.question)}</td>
        <td><span class="badge" style="background:#EDF7FF;color:#1684D8;font-weight:700;">${escapeHtml(f.category || 'General')}</span></td>
        <td>
          <span style="display:inline-block;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;background:${f.active !== false ? '#ECFDF5;color:#059669' : '#FEF2F2;color:#DC2626'};">
            ${f.active !== false ? 'ACTIVE' : 'HIDDEN'}
          </span>
        </td>
        <td>
          <div style="display:flex;gap:6px;">
            <button type="button" class="btn btn-outline" style="padding:4px 8px;font-size:12px;" onclick="window.AdminCMS.editFaq('${f.id}')">✏️ Edit</button>
            <button type="button" class="btn btn-danger" style="padding:4px 8px;font-size:12px;" onclick="window.AdminCMS.deleteFaq('${f.id}')">🗑</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function editFaq(faqId) {
    const content = window.HorizonCMS.getContent();
    const faq = (content.faqs || []).find(f => f.id === faqId);
    if (!faq) return;

    Swal.fire({
      title: 'Edit FAQ',
      html: `
        <div style="text-align:left;display:flex;flex-direction:column;gap:12px;">
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Question</label>
            <input id="swalFaqQ" class="swal2-input" style="width:100%;margin:4px 0;" value="${escapeHtml(faq.question)}">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Category</label>
            <input id="swalFaqCat" class="swal2-input" style="width:100%;margin:4px 0;" value="${escapeHtml(faq.category || 'General')}">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Answer (Supports HTML/Links)</label>
            <textarea id="swalFaqA" class="swal2-textarea" style="width:100%;margin:4px 0;height:120px;">${escapeHtml(faq.answer)}</textarea>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <input type="checkbox" id="swalFaqActive" ${faq.active !== false ? 'checked' : ''}>
            <label for="swalFaqActive" style="font-size:13px;font-weight:600;">Show on Live FAQ Accordion</label>
          </div>
        </div>
      `,
      width: '580px',
      showCancelButton: true,
      confirmButtonText: 'Save FAQ',
      confirmButtonColor: '#1684D8',
      preConfirm: () => {
        return {
          id: faq.id,
          question: document.getElementById('swalFaqQ').value.trim(),
          category: document.getElementById('swalFaqCat').value.trim(),
          answer: document.getElementById('swalFaqA').value.trim(),
          active: document.getElementById('swalFaqActive').checked
        };
      }
    }).then(async (res) => {
      if (res.isConfirmed && res.value) {
        const content = window.HorizonCMS.getContent();
        const idx = content.faqs.findIndex(f => f.id === faq.id);
        if (idx >= 0) {
          content.faqs[idx] = Object.assign({}, content.faqs[idx], res.value);
          await window.HorizonCMS.saveContent({ faqs: content.faqs }, true);
          window.HorizonCMS.logActivity('FAQ Updated', `Edited question: ${res.value.question}`);
          renderFaqsAdminTable();
          Swal.fire({ title: 'FAQ Saved!', icon: 'success', timer: 1200, showConfirmButton: false });
        }
      }
    });
  }

  function addFaq() {
    Swal.fire({
      title: 'Add New FAQ Question',
      html: `
        <div style="text-align:left;display:flex;flex-direction:column;gap:12px;">
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Question</label>
            <input id="swalFaqQ" class="swal2-input" style="width:100%;margin:4px 0;" placeholder="e.g. Can I submit after the deadline?">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Category</label>
            <input id="swalFaqCat" class="swal2-input" style="width:100%;margin:4px 0;" value="General">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Answer</label>
            <textarea id="swalFaqA" class="swal2-textarea" style="width:100%;margin:4px 0;height:120px;" placeholder="Provide clear guidance..."></textarea>
          </div>
        </div>
      `,
      width: '580px',
      showCancelButton: true,
      confirmButtonText: 'Add FAQ',
      confirmButtonColor: '#1684D8',
      preConfirm: () => {
        const q = document.getElementById('swalFaqQ').value.trim();
        const a = document.getElementById('swalFaqA').value.trim();
        if (!q || !a) { Swal.showValidationMessage('Question and Answer are required'); return false; }
        return {
          id: 'faq-' + Date.now(),
          question: q,
          category: document.getElementById('swalFaqCat').value.trim() || 'General',
          answer: a,
          order: Date.now(),
          active: true
        };
      }
    }).then(async (res) => {
      if (res.isConfirmed && res.value) {
        const content = window.HorizonCMS.getContent();
        content.faqs = content.faqs || [];
        content.faqs.push(res.value);
        await window.HorizonCMS.saveContent({ faqs: content.faqs }, true);
        window.HorizonCMS.logActivity('FAQ Added', `Created FAQ: ${res.value.question}`);
        renderFaqsAdminTable();
        Swal.fire({ title: 'FAQ Added!', icon: 'success', timer: 1200, showConfirmButton: false });
      }
    });
  }

  async function deleteFaq(faqId) {
    const res = await Swal.fire({
      title: 'Delete FAQ?',
      text: 'Remove this question and answer from the live site?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#EF4444'
    });

    if (res.isConfirmed) {
      const content = window.HorizonCMS.getContent();
      content.faqs = (content.faqs || []).filter(f => f.id !== faqId);
      await window.HorizonCMS.saveContent({ faqs: content.faqs }, true);
      window.HorizonCMS.logActivity('FAQ Deleted', `Removed FAQ ID ${faqId}`);
      renderFaqsAdminTable();
      Swal.fire({ title: 'Deleted', icon: 'success', timer: 1200, showConfirmButton: false });
    }
  }

  // ── NAVIGATION MENU CRUD ──
  function renderNavAdminTable() {
    const container = document.getElementById('adminNavTableBody');
    if (!container) return;
    const content = window.HorizonCMS.getContent();
    const links = (content.navigation && content.navigation.links) || [];

    container.innerHTML = links.map((l, i) => `
      <tr>
        <td style="font-weight:700;">#${i + 1}</td>
        <td style="font-weight:700;color:var(--navy);">${escapeHtml(l.label)}</td>
        <td style="font-family:'Space Mono',monospace;color:#1684D8;">${escapeHtml(l.href)}</td>
        <td>${l.isExternal ? '<span class="badge" style="background:#FFFBEB;color:#D97706;">External ↗</span>' : '<span class="badge" style="background:#ECFDF5;color:#059669;">Internal Anchor</span>'}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button type="button" class="btn btn-outline" style="padding:4px 8px;font-size:12px;" onclick="window.AdminCMS.editNavItem(${i})">✏️ Edit</button>
            <button type="button" class="btn btn-danger" style="padding:4px 8px;font-size:12px;" onclick="window.AdminCMS.deleteNavItem(${i})">🗑</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function editNavItem(idx) {
    const content = window.HorizonCMS.getContent();
    const link = content.navigation.links[idx];
    if (!link) return;

    Swal.fire({
      title: 'Edit Navigation Link',
      html: `
        <div style="text-align:left;display:flex;flex-direction:column;gap:12px;">
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Menu Label</label>
            <input id="swalNavLabel" class="swal2-input" style="width:100%;margin:4px 0;" value="${escapeHtml(link.label)}">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">URL or Anchor (e.g. #tracks)</label>
            <input id="swalNavHref" class="swal2-input" style="width:100%;margin:4px 0;" value="${escapeHtml(link.href)}">
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <input type="checkbox" id="swalNavExt" ${link.isExternal ? 'checked' : ''}>
            <label for="swalNavExt" style="font-size:13px;font-weight:600;">Open in New Tab (External)</label>
          </div>
        </div>
      `,
      width: '480px',
      showCancelButton: true,
      confirmButtonText: 'Save Link',
      confirmButtonColor: '#1684D8',
      preConfirm: () => {
        return {
          label: document.getElementById('swalNavLabel').value.trim(),
          href: document.getElementById('swalNavHref').value.trim(),
          isExternal: document.getElementById('swalNavExt').checked,
          order: idx + 1
        };
      }
    }).then(async (res) => {
      if (res.isConfirmed && res.value) {
        const content = window.HorizonCMS.getContent();
        content.navigation.links[idx] = res.value;
        await window.HorizonCMS.saveContent({ navigation: content.navigation }, true);
        window.HorizonCMS.logActivity('Nav Link Updated', `Edited nav link: ${res.value.label}`);
        renderNavAdminTable();
        Swal.fire({ title: 'Nav Updated!', icon: 'success', timer: 1200, showConfirmButton: false });
      }
    });
  }

  function addNavItem() {
    Swal.fire({
      title: 'Add Navigation Link',
      html: `
        <div style="text-align:left;display:flex;flex-direction:column;gap:12px;">
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Menu Label</label>
            <input id="swalNavLabel" class="swal2-input" style="width:100%;margin:4px 0;" placeholder="e.g. Sponsors">
          </div>
          <div>
            <label style="font-size:11px;font-weight:700;text-transform:uppercase;">Target Link (e.g. #sponsors or https://...)</label>
            <input id="swalNavHref" class="swal2-input" style="width:100%;margin:4px 0;" placeholder="#sponsors">
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <input type="checkbox" id="swalNavExt">
            <label for="swalNavExt" style="font-size:13px;font-weight:600;">Open in New Tab</label>
          </div>
        </div>
      `,
      width: '480px',
      showCancelButton: true,
      confirmButtonText: 'Add Link',
      confirmButtonColor: '#1684D8',
      preConfirm: () => {
        const label = document.getElementById('swalNavLabel').value.trim();
        const href = document.getElementById('swalNavHref').value.trim();
        if (!label || !href) { Swal.showValidationMessage('Label and Link URL are required'); return false; }
        return {
          label: label,
          href: href,
          isExternal: document.getElementById('swalNavExt').checked,
          order: 99
        };
      }
    }).then(async (res) => {
      if (res.isConfirmed && res.value) {
        const content = window.HorizonCMS.getContent();
        content.navigation.links = content.navigation.links || [];
        content.navigation.links.push(res.value);
        await window.HorizonCMS.saveContent({ navigation: content.navigation }, true);
        window.HorizonCMS.logActivity('Nav Link Added', `Added link: ${res.value.label}`);
        renderNavAdminTable();
        Swal.fire({ title: 'Link Added!', icon: 'success', timer: 1200, showConfirmButton: false });
      }
    });
  }

  async function deleteNavItem(idx) {
    const res = await Swal.fire({
      title: 'Delete Link?',
      text: 'Remove this item from the main navbar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#EF4444'
    });

    if (res.isConfirmed) {
      const content = window.HorizonCMS.getContent();
      content.navigation.links.splice(idx, 1);
      await window.HorizonCMS.saveContent({ navigation: content.navigation }, true);
      window.HorizonCMS.logActivity('Nav Link Deleted', `Removed nav link index ${idx}`);
      renderNavAdminTable();
      Swal.fire({ title: 'Deleted', icon: 'success', timer: 1200, showConfirmButton: false });
    }
  }

  // ── MEDIA LIBRARY ──
  function renderMediaAdminGrid() {
    const grid = document.getElementById('adminMediaGrid');
    if (!grid) return;
    const content = window.HorizonCMS.getContent();
    const assets = content.mediaAssets || [];

    grid.innerHTML = assets.map(a => `
      <div style="background:#FFFFFF;border:1.5px solid var(--border);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:8px;box-shadow:0 4px 14px rgba(0,0,0,0.04);">
        <div style="width:100%;height:140px;background:#F8FAFC;border:1px solid var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;">
          <img src="${a.url}" alt="${escapeHtml(a.alt || a.name)}" style="max-width:100%;max-height:100%;object-fit:contain;">
          <span style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.65);color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:700;">
            ${escapeHtml(a.category || 'Asset')}
          </span>
        </div>
        <div style="font-weight:700;font-size:13px;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${escapeHtml(a.name)}
        </div>
        <div style="font-size:11px;color:var(--muted);font-family:'Space Mono',monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${escapeHtml(a.url)}
        </div>
        <div style="display:flex;gap:6px;margin-top:auto;align-items:center;">
          <button type="button" class="btn btn-outline" style="flex:1;padding:5px 6px;font-size:11px;font-weight:600;" onclick="window.AdminCMS.copyMediaUrl('${a.url}')">📋 Copy</button>
          <button type="button" class="btn" style="flex:1;padding:5px 6px;font-size:11px;font-weight:700;background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE;border-radius:6px;cursor:pointer;" onclick="window.AdminCMS.replaceMediaAsset('${a.id}')">🔄 Replace</button>
          <button type="button" class="btn btn-danger" style="padding:5px 8px;font-size:11px;" onclick="window.AdminCMS.deleteMediaAsset('${a.id}')" title="Delete Asset">🗑</button>
        </div>
      </div>
    `).join('');
  }

  async function replaceMediaAsset(assetId) {
    const content = window.HorizonCMS.getContent();
    const assets = content.mediaAssets || [];
    const targetAsset = assets.find(a => a.id === assetId);
    if (!targetAsset) {
      if (typeof Swal !== 'undefined') Swal.fire({ title: 'Not Found', text: 'Asset record not found.', icon: 'error' });
      return;
    }

    if (typeof Swal === 'undefined') return;

    const { value: formValues } = await Swal.fire({
      title: `🔄 Replace "${escapeHtml(targetAsset.name)}"`,
      html: `
        <div style="text-align:left;font-size:13px;color:#334155;margin-bottom:12px;">
          Choose how you want to replace this image across all live website locations:
        </div>
        <div style="margin-bottom:14px;text-align:left;">
          <label style="font-weight:700;font-size:12px;color:#0F172A;display:block;margin-bottom:4px;">Option 1: Upload New Image File</label>
          <input type="file" id="swalReplaceFileInput" accept="image/*" style="width:100%;font-size:12px;padding:6px;border:1px solid #CBD5E1;border-radius:6px;">
        </div>
        <div style="text-align:center;font-weight:700;font-size:11px;color:#94A3B8;margin:8px 0;">— OR —</div>
        <div style="text-align:left;">
          <label style="font-weight:700;font-size:12px;color:#0F172A;display:block;margin-bottom:4px;">Option 2: Enter New Image URL</label>
          <input type="url" id="swalReplaceUrlInput" placeholder="https://example.com/new-image.png or assets/..." style="width:100%;box-sizing:border-box;font-size:12px;padding:8px 10px;border:1px solid #CBD5E1;border-radius:6px;">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '🔄 Replace & Update Live Site',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#1684D8',
      preConfirm: () => {
        const fileInput = document.getElementById('swalReplaceFileInput');
        const urlInput = document.getElementById('swalReplaceUrlInput');
        const file = fileInput && fileInput.files && fileInput.files[0];
        const url = urlInput ? urlInput.value.trim() : '';

        if (!file && !url) {
          Swal.showValidationMessage('Please select a file or enter an image URL.');
          return false;
        }
        return { file, url };
      }
    });

    if (!formValues) return;

    Swal.fire({
      title: 'Updating Asset...',
      text: 'Replacing image and synchronizing live website sections...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      let finalUrl = formValues.url;
      if (formValues.file) {
        if (window.HorizonBackend && typeof window.HorizonBackend.uploadToCloudinary === 'function') {
          finalUrl = await window.HorizonBackend.uploadToCloudinary(formValues.file, 'horizon_cms');
        } else {
          finalUrl = await new Promise((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.readAsDataURL(formValues.file);
          });
        }
      }

      if (!finalUrl) throw new Error('No valid URL generated for replacement.');

      const oldUrl = targetAsset.url;
      targetAsset.url = finalUrl;
      targetAsset.uploadedAt = new Date().toISOString();

      // Automatically update all website sections where this asset or its URL was used:
      let replacedSections = [];

      // Hero robot
      if (targetAsset.id === 'asset-hero-robot' || (content.hero && content.hero.robotImage === oldUrl)) {
        if (content.hero) content.hero.robotImage = finalUrl;
        replacedSections.push('Homepage Hero Robot Artwork');
      }

      // About robot
      if (targetAsset.id === 'asset-about-robot' || (content.about && content.about.robotImage === oldUrl)) {
        if (content.about) content.about.robotImage = finalUrl;
        replacedSections.push('About Section 3D Illustration');
      }

      // Prizes podium
      if (targetAsset.id === 'asset-podium' || (content.prizes && content.prizes.podiumImage === oldUrl)) {
        if (content.prizes) content.prizes.podiumImage = finalUrl;
        replacedSections.push('Prizes & Rewards Podium Showcase');
      }

      // Logo & Favicon
      if (targetAsset.id === 'asset-logo' || (content.global && content.global.logoUrl === oldUrl)) {
        if (content.global) content.global.logoUrl = finalUrl;
        replacedSections.push('Header & Navigation Brand Logo');
      }
      if (targetAsset.id === 'asset-favicon' || (content.global && content.global.faviconUrl === oldUrl)) {
        if (content.global) content.global.faviconUrl = finalUrl;
        replacedSections.push('Browser Tab Favicon');
      }
      if (content.global && content.global.organizerLogo === oldUrl) {
        content.global.organizerLogo = finalUrl;
        replacedSections.push('Organizer Initiative Logo');
      }

      // Save to persistence
      await window.HorizonCMS.saveContent(content, true);

      // Refresh forms and grid
      populateCMSForms();
      renderMediaAdminGrid();

      // Log activity
      if (window.HorizonCMS && typeof window.HorizonCMS.logActivity === 'function') {
        window.HorizonCMS.logActivity('Media Replaced', `Replaced asset "${targetAsset.name}" with new image`, 'Super Administrator', 'Super Admin');
      }

      Swal.fire({
        title: '✅ Image Replaced Successfully!',
        html: `
          <div style="text-align:left;font-size:13px;line-height:1.6;color:#334155;">
            <p><strong>${escapeHtml(targetAsset.name)}</strong> has been updated with the new image.</p>
            ${replacedSections.length > 0 ? `
              <p style="margin-bottom:4px;"><strong>Live Website Sections Synchronized:</strong></p>
              <ul style="padding-left:18px;margin:0 0 10px 0;color:#059669;font-weight:600;">
                ${replacedSections.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
              </ul>
            ` : '<p style="color:#059669;">Asset catalog updated with new URL.</p>'}
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#1684D8'
      });

    } catch (err) {
      console.error('Replace Media Error:', err);
      Swal.fire({ title: 'Replace Failed', text: err.message, icon: 'error' });
    }
  }

  function copyMediaUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
      Swal.fire({ title: 'Copied!', text: 'Asset URL copied to clipboard.', icon: 'success', timer: 1000, showConfirmButton: false });
    });
  }

  async function handleMediaUpload(file) {
    if (!file) return;
    Swal.fire({
      title: 'Uploading Asset...',
      text: 'Optimizing and storing asset on cloud CDN...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      let finalUrl = '';
      if (window.HorizonBackend && typeof window.HorizonBackend.uploadToCloudinary === 'function') {
        finalUrl = await window.HorizonBackend.uploadToCloudinary(file, 'horizon_cms');
      } else {
        // Data URL fallback
        finalUrl = await new Promise((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.readAsDataURL(file);
        });
      }

      const content = window.HorizonCMS.getContent();
      content.mediaAssets = content.mediaAssets || [];
      const newAsset = {
        id: 'media-' + Date.now(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        url: finalUrl,
        category: 'Uploaded',
        alt: file.name,
        uploadedAt: new Date().toISOString()
      };
      content.mediaAssets.unshift(newAsset);
      await window.HorizonCMS.saveContent({ mediaAssets: content.mediaAssets }, true);
      window.HorizonCMS.logActivity('Media Upload', `Uploaded asset: ${file.name}`);
      renderMediaAdminGrid();

      Swal.fire({
        title: 'Upload Complete!',
        text: 'Asset has been uploaded and added to the Media Library.',
        icon: 'success',
        confirmButtonColor: '#1684D8'
      });
    } catch (err) {
      Swal.fire({ title: 'Upload Failed', text: err.message, icon: 'error' });
    }
  }

  async function deleteMediaAsset(assetId) {
    const res = await Swal.fire({
      title: 'Remove Asset?',
      text: 'Remove this asset from your Media Library catalog?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Remove',
      confirmButtonColor: '#EF4444'
    });

    if (res.isConfirmed) {
      const content = window.HorizonCMS.getContent();
      content.mediaAssets = (content.mediaAssets || []).filter(a => a.id !== assetId);
      await window.HorizonCMS.saveContent({ mediaAssets: content.mediaAssets }, true);
      renderMediaAdminGrid();
      Swal.fire({ title: 'Removed', icon: 'success', timer: 1000, showConfirmButton: false });
    }
  }

  // ── AUDIT LOGS ──
  function renderAuditLogsTable() {
    const container = document.getElementById('adminAuditLogsTableBody');
    if (!container) return;
    const logs = window.HorizonCMS.getAuditLogs();

    if (logs.length === 0) {
      container.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted);">No recorded admin activity yet.</td></tr>`;
      return;
    }

    container.innerHTML = logs.slice(0, 30).map(l => {
      const dt = new Date(l.timestamp);
      const timeStr = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' • ' + dt.toLocaleDateString('en-GB');
      return `
        <tr>
          <td style="font-family:'Space Mono',monospace;font-size:11px;color:var(--muted);">${timeStr}</td>
          <td><span style="font-weight:700;color:var(--navy);">${escapeHtml(l.action)}</span></td>
          <td style="color:#334155;font-size:12px;">${escapeHtml(l.details)}</td>
          <td style="font-weight:600;">${escapeHtml(l.user)}</td>
          <td><span class="badge" style="background:#F1F5F9;color:#0F172A;font-weight:700;">${escapeHtml(l.role)}</span></td>
        </tr>
      `;
    }).join('');
  }

  // ── ROLES & PERMISSIONS ──
  function renderRolesAdminTable() {
    const container = document.getElementById('adminRolesTableBody');
    if (!container) return;
    const users = getAdminUsers();

    container.innerHTML = users.map((u, i) => `
      <tr>
        <td style="font-weight:700;color:var(--navy);">${escapeHtml(u.name)}</td>
        <td style="font-family:'Space Mono',monospace;color:#1684D8;">${escapeHtml(u.username)}</td>
        <td>
          <span class="badge" style="background:#EDF7FF;color:#1684D8;font-weight:800;">
            ${escapeHtml(u.role)}
          </span>
        </td>
        <td>
          <span style="font-size:12px;color:var(--muted);">
            ${u.role === 'Super Admin' ? 'All Modules + Security' : u.role === 'Content Manager' ? 'Website Content & Media' : u.role === 'Certificate Manager' ? 'Certificates & Rosters' : u.role === 'Event Manager' ? 'Hackathon & Tracks' : 'View Only'}
          </span>
        </td>
      </tr>
    `).join('');
  }

  // Helper getters & setters
  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined && val !== null ? val : '';
  }

  function getChecked(id) {
    const el = document.getElementById(id);
    return el ? Boolean(el.checked) : false;
  }

  function setChecked(id, bool) {
    const el = document.getElementById(id);
    if (el) el.checked = Boolean(bool);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ── UNSTOP SMART IMPORTER & ONE-CLICK AUTO-FILL ──
  const SAMPLE_UNSTOP_TEXT = `Stages & Timeline
Details
Dates & Deadlines
Prizes
Reviews
FAQs & Discussions
Login
Online
HACKVERSE 2026
Innovation Hacks
Team Size1 - 4 Members
Registration Deadline31 Oct 26, 11:55 PM IST
Software Development
Stages and Timelines
Nov1
01 Nov 26, 06:00 AM IST
--> 02 Nov 26, 11:00 PM IST
Project Submission Round
Submit your innovative project to HACKVERSE 2026 by Innovation Hacks! Build and showcase projects in AI, web development, mobile apps, IoT, cybersecurity, or any technology domain. Turn your ideas into real-world solutions and compete for exciting prizes: a MacBook, iPhone, and iPad.
All that you need to know about HACKVERSE 2026
JOIN THE OFFICIAL HACKVERSE 2026 COMMUNITY:[WhatsApp Group](https://chat.whatsapp.com/HLbGujOGMO0ANqegVN8m4E?s=sh&p=a&mlu=4&ilr=4)
WELCOME TO HACKVERSE 2026!
Organized by Innovation Hacks, HACKVERSE is an open-domain hackathon where innovators, developers, designers, and students can turn their ideas into real-world solutions.
BUILD ANYTHING. INNOVATE EVERYTHING.
AI & Generative AIWeb Development & SaaSMobile ApplicationsRobotics & IoTCybersecuritySocial Impact & SustainabilityAny innovative technology-based project!
EXCITING PRIZES AWAIT!
1st Prize — Apple MacBook AirApprox. ₹1,49,900
2nd Prize — Apple iPhoneApprox. ₹99,900
3rd Prize — Apple iPadApprox. ₹49,900
TOTAL PRIZE POOL: APPROX. ₹2,99,700!
WHY JOIN HACKVERSE?• Build and showcase your own projects.• Solve real-world problems through technology.• Connect with fellow innovators and developers.• Turn yo...
Read More
Feedback & Rating
Frequently Asked Questions/Discussions
Updated On: 31 Oct 26, 07:38 PM IST
The data on this page gets updated every 15 minutes.
This opportunity has been listed by Innovation Hacks. Unstop is not liable for any content mentioned in this opportunity or the process followed by the organizers for this opportunity. However, please raise a complaint if you want Unstop to look into the matter.
Raise a Complaint
Report An Issue
CompetitionHACKVERSE 2026
Closed
₹ 199Registration Fee
You Just Missed!
This opportunity isn’t taking new registrations anymore.
Registration Closed
Already registered?Login
Registered
225
Share with Friends
Refer now
Powered By
Best Viewed in Chrome, Opera, Mozilla, EDGE & Safari.Copyright © 2026 FLIVE Consulting Pvt Ltd - All rights reserved.`;

  function parseUnstopRawText(text) {
    if (!text || typeof text !== 'string') return null;
    const result = {};

    // 1. Event Name
    let nameMatch = text.match(/(?:WELCOME TO|Competition|about)\s*([A-Za-z0-9\s-]{3,30}?)(?:!|\n|\r)/i);
    if (!nameMatch) {
      nameMatch = text.match(/([A-Z0-9\s-]{3,25})\s*(?:\n|\r|\s)+Innovation Hacks/i);
    }
    result.eventName = nameMatch ? nameMatch[1].trim().replace(/^Competition\s*/i, '') : 'HACKVERSE 2026';

    // 2. Tagline
    let tagMatch = text.match(/([A-Z\s]{4,}\.\s+[A-Z\s]{4,}\.?)/);
    result.tagline = tagMatch ? tagMatch[1].trim() : 'BUILD ANYTHING. INNOVATE EVERYTHING.';

    // 3. Short Lead / Hero Lead
    let leadMatch = text.match(/Organized by Innovation Hacks,\s*([^\n\r]+)/i);
    if (!leadMatch) {
      leadMatch = text.match(/Submit your innovative project to [^!\n\r]+!/i);
    }
    result.lead = leadMatch ? leadMatch[0].trim() : 'Organized by Innovation Hacks, an open-domain hackathon where innovators turn ideas into real-world solutions.';

    // 4. WhatsApp & Unstop URLs
    let waMatch = text.match(/https:\/\/(?:chat\.whatsapp\.com|whatsapp\.com\/channel)\/[A-Za-z0-9_\-?&=]+/i);
    result.whatsappUrl = waMatch ? waMatch[0].trim() : '';

    let unstopMatch = text.match(/https:\/\/(?:www\.)?unstop\.com\/[A-Za-z0-9_\-\/?&=]+/i);
    result.unstopUrl = unstopMatch ? unstopMatch[0].trim() : '';

    // 5. Total Prize Pool
    let poolMatch = text.match(/TOTAL PRIZE POOL:\s*(?:APPROX\.\s*)?([₹\d,]+!?)/i);
    if (!poolMatch) {
      poolMatch = text.match(/(?:Prize Pool|Pool):\s*(?:Approx\.\s*)?([₹\d,]+)/i);
    }
    result.poolTotal = poolMatch ? poolMatch[1].trim().replace('!', '') + ' Prize Pool' : '₹2,99,700 Total Prize Pool';

    // 6. 1st, 2nd, 3rd Prizes
    let p1Match = text.match(/1st Prize\s*[—–-]\s*([^\n\r]+?)(?:Approx\.\s*([₹\d,]+)|$)/im);
    let p2Match = text.match(/2nd Prize\s*[—–-]\s*([^\n\r]+?)(?:Approx\.\s*([₹\d,]+)|$)/im);
    let p3Match = text.match(/3rd Prize\s*[—–-]\s*([^\n\r]+?)(?:Approx\.\s*([₹\d,]+)|$)/im);

    result.prizes = {
      poolTotal: result.poolTotal,
      subtitle: 'Apple MacBook Air, Apple iPhone, Apple iPad, Prestigious Trophies & Verified Distinctions.',
      tier1: {
        title: p1Match ? ('1st Place — ' + p1Match[1].trim()) : '1st Prize — Apple MacBook Air',
        amount: p1Match && p1Match[2] ? p1Match[2].trim() : '₹1,49,900',
        perks: ['Apple MacBook Air M-Series Flagship Laptop', 'Official Champion Trophy & Gold Distinction Certificate', 'Direct Innovation Hacks Internship & Project Incubation']
      },
      tier2: {
        title: p2Match ? ('2nd Place — ' + p2Match[1].trim()) : '2nd Prize — Apple iPhone',
        amount: p2Match && p2Match[2] ? p2Match[2].trim() : '₹99,900',
        perks: ['Apple iPhone Flagship Device', 'Official Silver Runner-up Distinction Certificate', 'Exclusive Tech Swag Kit & Industry Mentorship Sessions']
      },
      tier3: {
        title: p3Match ? ('3rd Place — ' + p3Match[1].trim()) : '3rd Prize — Apple iPad',
        amount: p3Match && p3Match[2] ? p3Match[2].trim() : '₹49,900',
        perks: ['Apple iPad High-Performance Tablet', 'Official Bronze Medal & Distinction Certificate', 'Community Hall of Fame & Sponsor Benefits']
      }
    };

    // 7. Problem Statements & Tracks
    const knownTracks = [
      { title: 'AI & Generative AI', category: 'Generative AI', icon: '🧠', desc: 'LLMs, autonomous agents, neural synthesis, computer vision, and deep generative models.' },
      { title: 'Web Development & SaaS', category: 'Cloud & Fullstack', icon: '💻', desc: 'Enterprise SaaS platforms, distributed cloud microservices, and next-gen frontend engineering.' },
      { title: 'Mobile Applications', category: 'Mobile Tech', icon: '📱', desc: 'High-performance cross-platform iOS & Android apps with offline resilience and native UX.' },
      { title: 'Robotics & IoT', category: 'Hardware & Systems', icon: '🤖', desc: 'Embedded microcontroller systems, sensor meshes, automated robotics, and edge telemetry.' },
      { title: 'Cybersecurity', category: 'Security & Defense', icon: '🛡️', desc: 'Zero-trust architecture, threat detection, post-quantum cryptography, and automated pentesting.' },
      { title: 'Social Impact & Sustainability', category: 'Green Tech', icon: '🌱', desc: 'Climate intelligence, sustainable resource distribution, renewable tracking, and civic tech.' },
      { title: 'Open Innovation & Emerging Tech', category: 'Open Track', icon: '🚀', desc: 'Any groundbreaking technological product solving tangible modern industrial challenges.' }
    ];

    result.tracks = [];
    knownTracks.forEach((kt, idx) => {
      const kw = kt.title.split(' ')[0];
      if (text.toLowerCase().includes(kw.toLowerCase()) || text.toLowerCase().includes(kt.category.toLowerCase())) {
        result.tracks.push({
          id: 'track-auto-' + (idx + 1),
          number: '0' + (result.tracks.length + 1),
          title: kt.title,
          category: kt.category,
          desc: kt.desc,
          icon: kt.icon,
          challenges: [
            'Production-ready scalable codebase with zero security vulnerabilities',
            'Intuitive, responsive user experience tested across device form factors',
            'Comprehensive architectural documentation and functional video demo'
          ],
          active: true,
          order: result.tracks.length + 1
        });
      }
    });
    if (result.tracks.length === 0) {
      result.tracks = knownTracks.slice(0, 5);
    }

    // 8. Stages & Timeline
    let datesMatch = text.match(/(\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4}[^-\n\r]*)\s*(?:-->|to|-)\s*(\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4}[^\n\r]*)/i);
    let roundMatch = text.match(/(?:Project Submission Round|Round \d+|Phase \d+)/i);
    let deadlineMatch = text.match(/Registration Deadline\s*([^\n\r]+)/i);

    result.timeline = [
      {
        stage: 'Phase 1',
        date: deadlineMatch ? deadlineMatch[1].trim() : 'Registration Period',
        title: 'Registration & Team Formation',
        desc: 'Form teams of 1 to 4 members, connect on the official WhatsApp community, and select challenge tracks.',
        status: 'completed'
      },
      {
        stage: 'Phase 2',
        date: datesMatch ? (datesMatch[1].trim() + ' – ' + datesMatch[2].trim()) : 'Nov 01 – Nov 02, 2026',
        title: roundMatch ? roundMatch[0].trim() : 'Project Submission Round',
        desc: '36-hour sprint: submit your working repository, 3-minute video walk-through, and architectural documentation.',
        status: 'ongoing'
      },
      {
        stage: 'Phase 3',
        date: 'Post-Submission Checkpoint',
        title: 'Mentorship & Jury Evaluation',
        desc: 'One-on-one virtual project review, live code inspection, and scoring based on innovation, design, and impact.',
        status: 'upcoming'
      },
      {
        stage: 'Phase 4',
        date: 'Grand Finale Day',
        title: 'Results Announcement & Credential Issuance',
        desc: 'Celebration of winners, distribution of Apple MacBook/iPhone/iPad prizes, and instant verified credential generation.',
        status: 'upcoming'
      }
    ];

    // 9. Stats
    let regMatch = text.match(/Registered\s*(\d+)/i);
    result.registeredCount = regMatch ? parseInt(regMatch[1], 10) : 225;

    let feeMatch = text.match(/₹\s*(\d+)\s*Registration Fee/i);
    result.fee = feeMatch ? ('₹' + feeMatch[1]) : 'Free / Nominal';

    let statusMatch = text.match(/(Closed|Taking Registrations|Open)/i);
    result.registrationStatus = statusMatch ? statusMatch[1].toLowerCase() : 'open';

    return result;
  }

  function renderUnstopPreview(parsed) {
    const container = document.getElementById('unstopExtractedPreview');
    if (!container || !parsed) return;

    container.innerHTML = `
      <div style="background:#FFFFFF;border:1.5px solid #DBEAFE;border-radius:14px;padding:20px;box-shadow:0 4px 14px rgba(37,99,235,0.06);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;border-bottom:1px solid #E2E8F0;padding-bottom:12px;flex-wrap:wrap;gap:10px;">
          <div>
            <span style="background:#EFF6FF;color:#2563EB;border:1px solid #DBEAFE;font-size:11px;font-weight:800;padding:2px 8px;border-radius:6px;text-transform:uppercase;">Extracted Preview</span>
            <h3 style="font-size:20px;color:var(--navy);margin:4px 0 0 0;">${escapeHtml(parsed.eventName)}</h3>
            <p style="font-size:12px;color:var(--muted);margin:0;">${escapeHtml(parsed.tagline)}</p>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <span style="font-size:12px;font-weight:700;background:#ECFDF5;color:#065F46;padding:6px 12px;border-radius:8px;">👥 ${parsed.registeredCount} Registered</span>
            <span style="font-size:12px;font-weight:700;background:#EFF6FF;color:#1D4ED8;padding:6px 12px;border-radius:8px;">💰 ${escapeHtml(parsed.poolTotal)}</span>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px;margin-bottom:18px;">
          <!-- Card 1: Branding & Community -->
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;">
            <div style="font-size:11px;font-weight:800;text-transform:uppercase;color:#2563EB;margin-bottom:8px;">🎯 Hero &amp; Community</div>
            <div style="font-size:12px;color:#334155;margin-bottom:8px;"><strong>Lead Description:</strong> ${escapeHtml(parsed.lead)}</div>
            ${parsed.whatsappUrl ? `
              <div style="font-size:12px;color:#059669;word-break:break-all;">
                <strong>💬 WhatsApp Community:</strong><br>
                <a href="${escapeHtml(parsed.whatsappUrl)}" target="_blank" rel="noopener noreferrer" style="color:#059669;text-decoration:underline;">${escapeHtml(parsed.whatsappUrl)}</a>
              </div>
            ` : '<div style="font-size:12px;color:#94A3B8;">No WhatsApp link detected</div>'}
          </div>

          <!-- Card 2: Prizes Breakdown -->
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;">
            <div style="font-size:11px;font-weight:800;text-transform:uppercase;color:#D97706;margin-bottom:8px;">🏆 Prizes Breakdown</div>
            <div style="font-size:12px;color:#334155;margin-bottom:4px;">🥇 <strong>${escapeHtml(parsed.prizes.tier1.title)}:</strong> ${escapeHtml(parsed.prizes.tier1.amount)}</div>
            <div style="font-size:12px;color:#334155;margin-bottom:4px;">🥈 <strong>${escapeHtml(parsed.prizes.tier2.title)}:</strong> ${escapeHtml(parsed.prizes.tier2.amount)}</div>
            <div style="font-size:12px;color:#334155;margin-bottom:4px;">🥉 <strong>${escapeHtml(parsed.prizes.tier3.title)}:</strong> ${escapeHtml(parsed.prizes.tier3.amount)}</div>
          </div>

          <!-- Card 3: Detected Challenge Tracks -->
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;">
            <div style="font-size:11px;font-weight:800;text-transform:uppercase;color:#1E40AF;margin-bottom:8px;">💡 Detected Tracks (${parsed.tracks.length})</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${parsed.tracks.map(t => `<span style="background:#EFF6FF;color:#2563EB;border:1px solid #DBEAFE;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;">${t.icon} ${escapeHtml(t.title)}</span>`).join('')}
            </div>
          </div>

          <!-- Card 4: Timeline Stages -->
          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;">
            <div style="font-size:11px;font-weight:800;text-transform:uppercase;color:#059669;margin-bottom:8px;">📅 Stages &amp; Timeline (${parsed.timeline.length})</div>
            ${parsed.timeline.map((s, idx) => `
              <div style="font-size:11px;color:#334155;margin-bottom:4px;display:flex;justify-content:space-between;">
                <span><strong>${idx + 1}. ${escapeHtml(s.title)}</strong></span>
                <span style="color:#64748B;">${escapeHtml(s.date)}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="text-align:right;">
          <button type="button" class="btn btn-primary" onclick="window.AdminCMS.applyUnstopData()" style="padding:10px 24px;font-weight:700;background:#2563EB;border:none;box-shadow:0 1px 3px rgba(37,99,235,0.3);color:#fff;cursor:pointer;border-radius:10px;">
            🚀 Apply These Updates To Live Website
          </button>
        </div>
      </div>
    `;
  }

  function loadSampleUnstopText() {
    const input = document.getElementById('unstopRawInput');
    if (input) {
      input.value = SAMPLE_UNSTOP_TEXT;
      previewUnstopData();
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Example Loaded!',
          text: 'HACKVERSE 2026 sample listing text loaded into the parser. Click "Auto-Fill All Sections & Publish Live" to transform the website!',
          icon: 'info',
          timer: 1600,
          showConfirmButton: false
        });
      }
    }
  }

  function previewUnstopData() {
    const input = document.getElementById('unstopRawInput');
    const val = input ? input.value.trim() : '';
    if (!val) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Empty Text',
          text: 'Please paste raw text from an Unstop page or click "Load Example Unstop Text" first.',
          icon: 'warning'
        });
      }
      return;
    }

    const parsed = parseUnstopRawText(val);
    if (!parsed) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({ title: 'Parse Error', text: 'Could not extract valid hackathon details from the text.', icon: 'error' });
      }
      return;
    }

    renderUnstopPreview(parsed);
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Parsing Complete!',
        text: `Successfully extracted ${parsed.eventName}, ${parsed.tracks.length} tracks, ${parsed.prizes.poolTotal}, and timeline stages.`,
        icon: 'success',
        timer: 1400,
        showConfirmButton: false
      });
    }
  }

  async function applyUnstopData() {
    const input = document.getElementById('unstopRawInput');
    const val = input ? input.value.trim() : '';
    if (!val) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Empty Text',
          text: 'Please paste raw text from your Unstop hackathon page first.',
          icon: 'warning'
        });
      }
      return;
    }

    const parsed = parseUnstopRawText(val);
    if (!parsed) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({ title: 'Parse Error', text: 'Could not parse hackathon information.', icon: 'error' });
      }
      return;
    }

    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Transforming Website...',
        text: `Auto-filling all CMS modules with ${parsed.eventName} data...`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
    }

    try {
      const current = window.HorizonCMS.getContent();

      // 1. Global Settings & Browser Tab Title (Image 1)
      current.global.siteName = parsed.eventName;
      current.global.tagline = parsed.tagline;
      current.global.tabTitle = `${parsed.eventName} | ${parsed.tagline || 'Innovation Hacks'}`;
      if (parsed.whatsappUrl) current.global.communityUrl = parsed.whatsappUrl;

      // 2. Announcement Bar (Disabled / Removed per user request)
      current.announcement.enabled = false;
      current.announcement.badge = '';
      current.announcement.message = '';
      current.announcement.linkText = '';
      current.announcement.linkUrl = '';

      // 3. Hero Section (Image 3 Eyebrow Pill)
      current.hero.eyebrowText = `${parsed.eventName} • ${parsed.tagline || 'GLOBAL AI HACKATHON'}`;
      current.hero.titleLine1 = parsed.eventName;
      current.hero.titleHighlight = parsed.tagline;
      current.hero.lead = parsed.lead;
      if (parsed.unstopUrl) current.hero.primaryCtaUrl = '#certificates';
      if (parsed.whatsappUrl) {
        current.hero.secondaryCtaText = 'Join WhatsApp Group';
        current.hero.secondaryCtaUrl = parsed.whatsappUrl;
      }

      // 4. About Section
      current.about.titleLead = 'WELCOME TO';
      current.about.titleHighlight = parsed.eventName;
      current.about.leadDesc = parsed.lead;

      // 5. Hackathon Management & Claim CTA Card (Image 2)
      current.hackathon.name = parsed.eventName;
      current.hackathon.tagline = parsed.tagline;
      current.hackathon.description = parsed.lead;
      current.hackathon.timeline = parsed.timeline;
      current.hackathon.registrationStatus = parsed.registrationStatus;

      // 5.5 Certification Portal Header (Image 1)
      current.certificationHeader = current.certificationHeader || {};
      current.certificationHeader.eyebrow = 'OFFICIAL CREDENTIAL PORTAL';
      current.certificationHeader.titlePrefix = 'Claim Your';
      current.certificationHeader.titleHighlight = 'Official Certificate';
      current.certificationHeader.description = `Generate, preview, and download your verified ${parsed.eventName} digital credential at print-ready 300 DPI.`;

      current.claimCta = current.claimCta || {};
      current.claimCta.heading = 'Ready to Earn Your Official Certificate?';
      current.claimCta.description = `Register on Unstop now with your team (2–4 members). Hack for 36 hours, build real-world AI & Web3 solutions, and receive verified credentials.`;
      current.claimCta.primaryButtonText = (parsed.registrationStatus === 'closed') ? 'Registration Closed' : 'Register on Unstop';
      if (parsed.unstopUrl) current.claimCta.primaryButtonUrl = parsed.unstopUrl;
      if (parsed.whatsappUrl) {
        current.claimCta.secondaryButtonText = 'Join WhatsApp Group';
        current.claimCta.secondaryButtonUrl = parsed.whatsappUrl;
      }

      // 6. Tracks
      current.tracks = parsed.tracks;

      // 7. Prizes
      current.prizes = parsed.prizes;

      // 7.5 FAQ Section Header & Description (Image 5)
      current.faqHeader = current.faqHeader || {};
      current.faqHeader.eyebrow = 'Frequently Asked Questions';
      current.faqHeader.title = 'Got Questions?';
      current.faqHeader.description = `Official answers, eligibility rules, challenge tracks, and guidelines for the ${parsed.eventName} ${parsed.tagline || 'Global AI Hackathon'}.`;

      // 8. Navigation & Footer (Image 2 Official Platform Button)
      current.navigation.brandTitle = parsed.eventName;
      current.navigation.brandTagline = parsed.tagline;
      if (parsed.unstopUrl) current.navigation.primaryCtaUrl = parsed.unstopUrl;
      if (parsed.whatsappUrl) {
        current.navigation.secondaryCtaText = 'Join WhatsApp';
        current.navigation.secondaryCtaUrl = parsed.whatsappUrl;
      }

      current.footer = current.footer || {};
      current.footer.officialPlatformText = `${parsed.eventName} on Unstop`;
      if (parsed.unstopUrl) {
        current.footer.officialPlatformUrl = parsed.unstopUrl;
      }

      // 9. SEO & Browser Tab Title
      if (current.seo && current.seo.home) {
        current.seo.home.title = current.global.tabTitle;
        current.seo.home.metaDescription = `${parsed.eventName} - ${parsed.tagline}. ${parsed.prizes.poolTotal}. ${parsed.lead}`;
      }

      // Save to persistence (LocalStorage + Firestore)
      await window.HorizonCMS.saveContent(current, true);

      // Update Site Stats counter if available
      try {
        const statEl = document.getElementById('stat-participants');
        if (statEl) statEl.value = parsed.registeredCount;
        localStorage.setItem('stat_participants', String(parsed.registeredCount));
      } catch (e) {}

      // Refresh all forms in Admin Console
      populateCMSForms();

      // Render updated preview
      renderUnstopPreview(parsed);

      // Log in Audit Logs
      if (window.HorizonCMS && typeof window.HorizonCMS.logActivity === 'function') {
        window.HorizonCMS.logActivity('Unstop Smart Import', `Auto-filled website for ${parsed.eventName} (${parsed.prizes.poolTotal}, ${parsed.tracks.length} tracks)`, 'Super Administrator', 'Super Admin');
      }

      // Success modal
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: '🚀 Website Transformed!',
          html: `
            <div style="text-align:left;font-size:13px;line-height:1.6;color:#334155;">
              <p>All corresponding website sections have been auto-filled from your Unstop listing and <strong>published live</strong>:</p>
              <ul style="padding-left:18px;margin:8px 0;">
                <li><strong>Event Branding:</strong> ${escapeHtml(parsed.eventName)} (${escapeHtml(parsed.tagline)})</li>
                <li><strong>Prize Pool:</strong> ${escapeHtml(parsed.prizes.poolTotal)} (MacBook, iPhone, iPad)</li>
                <li><strong>Problem Tracks:</strong> ${parsed.tracks.length} Domains Loaded</li>
                <li><strong>Timeline Stages:</strong> ${parsed.timeline.length} Rounds Configured</li>
                <li><strong>Community:</strong> WhatsApp Group Link Updated</li>
                <li><strong>Live Stats:</strong> ${parsed.registeredCount} Participants Synced</li>
              </ul>
            </div>
          `,
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: '🌐 View Live Website',
          cancelButtonText: 'Stay in Admin Panel',
          confirmButtonColor: '#1684D8'
        }).then((res) => {
          if (res.isConfirmed) {
            window.open('index.html', '_blank');
          }
        });
      }

    } catch (err) {
      console.error('Smart Import Error:', err);
      if (typeof Swal !== 'undefined') {
        Swal.fire({ title: 'Import Failed', text: err.message, icon: 'error' });
      }
    }
  }

  // Export API
  window.AdminCMS = {
    populateCMSForms: populateCMSForms,
    saveCMSSection: saveCMSSection,
    publishAllCMS: publishAllCMS,
    renderTracksAdminTable: renderTracksAdminTable,
    editTrack: editTrack,
    addTrack: addTrack,
    deleteTrack: deleteTrack,
    renderTimelineAdminTable: renderTimelineAdminTable,
    editTimelineStage: editTimelineStage,
    addTimelineStage: addTimelineStage,
    deleteTimelineStage: deleteTimelineStage,
    renderFaqsAdminTable: renderFaqsAdminTable,
    editFaq: editFaq,
    addFaq: addFaq,
    deleteFaq: deleteFaq,
    renderNavAdminTable: renderNavAdminTable,
    editNavItem: editNavItem,
    addNavItem: addNavItem,
    deleteNavItem: deleteNavItem,
    renderMediaAdminGrid: renderMediaAdminGrid,
    copyMediaUrl: copyMediaUrl,
    handleMediaUpload: handleMediaUpload,
    deleteMediaAsset: deleteMediaAsset,
    renderAuditLogsTable: renderAuditLogsTable,
    replaceMediaAsset: replaceMediaAsset,
    renderRolesAdminTable: renderRolesAdminTable,
    enforceRolePermissions: enforceRolePermissions,
    getAdminUsers: getAdminUsers,
    parseUnstopRawText: parseUnstopRawText,
    renderUnstopPreview: renderUnstopPreview,
    loadSampleUnstopText: loadSampleUnstopText,
    previewUnstopData: previewUnstopData,
    applyUnstopData: applyUnstopData
  };

  // Auto-init on page load
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('load', () => {
      populateCMSForms();
      enforceRolePermissions();
    });
  }

})(window);
