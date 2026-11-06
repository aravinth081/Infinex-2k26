/**
 * cms-content.js — Default Seed Data Schema for HorizonX / Innovation Hacks
 * Single Source of Truth for all manageable website content.
 */

(function (window) {
  'use strict';

  const DEFAULT_CMS_CONTENT = {
    version: '2.0.0',
    lastUpdated: new Date().toISOString(),

    // ── GLOBAL WEBSITE SETTINGS ──
    global: {
      siteName: 'HORIZON X 2K26',
      tabTitle: 'HORIZON X 2K26 | Global AI Hackathon',
      tagline: 'GLOBAL AI HACKATHON • INNOVATION HACKS',
      logoUrl: 'assets/brand/horizon-x-logo.png',
      faviconUrl: 'assets/brand/horizon-x-logo.png',
      organizerName: 'Innovation Hacks',
      organizerLogo: 'assets/brand/innovation-hacks-logo.png',
      contactEmail: 'contact@innovationhacks.org',
      supportPhone: '+91 98765 43210',
      communityUrl: 'https://whatsapp.com/channel/0029VbDbywN2f3EJaickj41y',
      primaryColor: '#2563EB',
      secondaryColor: '#1E40AF',
      accentColor: '#059669',
      maintenanceMode: false,
      maintenanceMessage: 'HORIZON X 2K26 is currently updating content. We will be back online shortly!',
      customHeadScript: '',
      customBodyScript: ''
    },

    // ── PROMOTIONAL / ANNOUNCEMENT BAR (DISABLED) ──
    announcement: {
      enabled: false,
      badge: '',
      message: '',
      linkText: '',
      linkUrl: '',
      bgColor: '#EFF6FF',
      textColor: '#1E40AF'
    },

    // ── NAVIGATION MENU ──
    navigation: {
      brandTitle: 'HORIZON X 2K26',
      brandTagline: 'GLOBAL AI HACKATHON • INNOVATION HACKS',
      links: [
        { label: 'Home', href: '#home', isExternal: false, order: 1 },
        { label: 'About', href: '#about', isExternal: false, order: 2 },
        { label: 'Timeline', href: '#timeline', isExternal: false, order: 3 },
        { label: 'Tracks', href: '#tracks', isExternal: false, order: 4 },
        { label: 'Prizes', href: '#prizes', isExternal: false, order: 5 },
        { label: 'Certification', href: '#certificates', isExternal: false, order: 6 },
        { label: 'FAQ', href: '#faq', isExternal: false, order: 7 }
      ],
      primaryCtaText: 'Register on Unstop',
      primaryCtaUrl: 'https://unstop.com/p/horizon-x-2k26-global-hackathon-2k26-innovation-hacks-1757170',
      secondaryCtaText: 'Join Community',
      secondaryCtaUrl: 'https://whatsapp.com/channel/0029VbDbywN2f3EJaickj41y'
    },

    // ── HOMEPAGE HERO SECTION ──
    hero: {
      eyebrowText: 'HORIZON X 2K26 • GLOBAL AI HACKATHON',
      titleLine1: 'HORIZON X 2K26',
      titleHighlight: 'GLOBAL AI HACKATHON',
      lead: 'Build innovative AI-powered solutions to real-world challenges. Explore Artificial Intelligence, Generative AI, Machine Learning, Computer Vision, Natural Language Processing, RAG, and AI Agents through a global innovation experience organized by Innovation Hacks.',
      primaryCtaText: 'Verify & Claim Certificate',
      primaryCtaUrl: '#certificates',
      secondaryCtaText: 'Register on Unstop',
      secondaryCtaUrl: 'https://unstop.com/p/horizon-x-2k26-global-hackathon-2k26-innovation-hacks-1757170',
      robotImage: 'assets/brand/hero-ai-robot-clean.png',
      badge1Icon: '🧠',
      badge1Title: 'Autonomous AI Agents',
      badge1Subtitle: 'LLMs • RAG • Computer Vision',
      badge2Icon: '⚡',
      badge2Title: 'HORIZON X 2K26',
      badge2Subtitle: 'Global Innovation by Innovation Hacks',
      audienceCards: [
        {
          id: 'aud-1',
          title: 'Undergrad & Postgrad',
          desc: 'Open to students across all degrees',
          icon: '🎓'
        },
        {
          id: 'aud-2',
          title: 'Engineering Students',
          desc: 'CS, AI, Data Science & Allied Fields',
          icon: '💻'
        },
        {
          id: 'aud-3',
          title: 'Management & Tech',
          desc: 'Product thinking & scalable innovation',
          icon: '📊'
        },
        {
          id: 'aud-4',
          title: 'Arts, Commerce & Science',
          desc: 'Multidisciplinary global AI problem solvers',
          icon: '🔬'
        }
      ]
    },

    // ── LIVE STATS ──
    stats: {
      participants: 2481,
      nations: 150,
      tracks: 5,
      mentors: 30,
      prizePool: '₹50,000+',
      displayStats: [
        { label: 'Registered Participants', value: '2,481+', icon: '👥' },
        { label: 'Countries & Regions', value: '150+', icon: '🌍' },
        { label: 'Innovation Tracks', value: '5 Specialized', icon: '🎯' },
        { label: 'Mentors & Evaluators', value: '30+ Industry Leads', icon: '🎖️' }
      ]
    },

    // ── ABOUT SECTION ──
    about: {
      eyebrow: 'OUR VISION & PURPOSE',
      titleLead: 'About',
      titleHighlight: 'Innovation Hacks',
      leadDesc: 'Innovation Hacks is a technology and innovation initiative focused on turning creative ideas into practical solutions through technology, hackathons, software development, and learning opportunities. We empower aspiring developers and creators to solve real-world challenges.',
      robotImage: 'assets/brand/about-ai-robot-3d.png',
      handwrittenNote: 'Ideas Today\nA Better Tomorrow',
      pillars: [
        {
          id: 'pillar-1',
          number: '01',
          title: 'BUILD',
          desc: 'Turn ideas into practical digital products with reliable code and thoughtful design.',
          actionUrl: '#certificates',
          actionText: 'Explore Build'
        },
        {
          id: 'pillar-2',
          number: '02',
          title: 'INNOVATE',
          desc: 'Explore AI, emerging technologies, and creative approaches to solve problems.',
          actionUrl: '#certificates',
          actionText: 'Explore Innovation'
        },
        {
          id: 'pillar-3',
          number: '03',
          title: 'IMPACT',
          desc: 'Create meaningful solutions that empower communities and improve everyday life.',
          actionUrl: '#certificates',
          actionText: 'Explore Impact'
        }
      ]
    },

    // ── HACKATHON EVENT & TIMELINE ──
    hackathon: {
      name: 'HORIZON X 2K26',
      tagline: 'The Definitive Global Artificial Intelligence Hackathon',
      description: 'A 36-hour intensive virtual global hackathon challenging creative minds to develop impactful AI applications spanning LLMs, Computer Vision, Autonomous Agents, and Sustainable Intelligence.',
      bannerImage: 'assets/brand/event-banner.png',
      status: 'Live', // 'Upcoming' | 'Live' | 'Completed'
      registrationStatus: 'Open',
      registrationDeadline: 'March 25, 2026',
      eventStartDate: 'March 27, 2026',
      eventEndDate: 'March 29, 2026',
      teamSizeMin: 1,
      teamSizeMax: 4,
      eligibility: 'All undergraduate & postgraduate university students and independent developers worldwide.',
      rules: [
        'All code submissions must be original and developed during the hackathon timeline.',
        'Teams must submit working prototypes with a public GitHub repository and demo video.',
        'Use of open-source frameworks, public APIs, and pre-trained foundation models is permitted.'
      ],
      judgingCriteria: [
        { criterion: 'Innovation & Novelty', weight: '25%' },
        { criterion: 'Technical Execution & Architecture', weight: '30%' },
        { criterion: 'Real-world Practical Impact', weight: '25%' },
        { criterion: 'UI/UX & Final Presentation', weight: '20%' }
      ],
      timeline: [
        {
          stage: 'Phase 1',
          date: 'Feb 15 – Mar 25, 2026',
          title: 'Global Registration & Team Formation',
          desc: 'Register on Unstop, form teams of 1 to 4 innovators, and explore challenge tracks.',
          status: 'completed'
        },
        {
          stage: 'Phase 2',
          date: 'March 27, 2026 (09:00 AM IST)',
          title: 'Opening Ceremony & Hackathon Kickoff',
          desc: 'Detailed problem statement release, mentor onboarding, and start of 36-hour sprint.',
          status: 'ongoing'
        },
        {
          stage: 'Phase 3',
          date: 'March 28, 2026 (06:00 PM IST)',
          title: 'Midway Mentorship & Checkpoint Review',
          desc: 'One-on-one virtual technical mentoring and project direction feedback with industry judges.',
          status: 'upcoming'
        },
        {
          stage: 'Phase 4',
          date: 'March 29, 2026 (09:00 PM IST)',
          title: 'Code Freeze & Final Project Submission',
          desc: 'Submit repository links, 3-minute video walk-through, and architectural documentation.',
          status: 'upcoming'
        },
        {
          stage: 'Phase 5',
          date: 'April 02, 2026',
          title: 'Grand Finale, Results & Credential Issuance',
          desc: 'Announcement of champions, runner-ups, merit distinctions, and instant certificate issuance.',
          status: 'upcoming'
        }
      ]
    },

    // ── PROBLEM STATEMENTS & TRACKS ──
    tracks: [
      {
        id: 'track-1',
        number: '01',
        title: 'Autonomous AI Agents & Everyday AI',
        icon: '🧠',
        category: 'Core AI',
        desc: 'Build self-directed agents, LLM copilots, RAG architectures, and workflow automation systems that solve real everyday productivity dilemmas.',
        challenges: [
          'Enterprise automated document understanding with RAG',
          'Autonomous multi-agent research and code assistants',
          'Context-aware personalized digital task agents'
        ],
        active: true,
        order: 1
      },
      {
        id: 'track-2',
        number: '02',
        title: 'Smart & Sustainable Future',
        icon: '🌱',
        category: 'GreenTech',
        desc: 'Leverage AI and data science to tackle climate change, optimize renewable energy grids, predict crop health, and promote sustainable urbanization.',
        challenges: [
          'AI-driven carbon footprint optimization for supply chains',
          'Precision agriculture yield forecasting using satellite vision',
          'Smart electrical grid load balancing and peak management'
        ],
        active: true,
        order: 2
      },
      {
        id: 'track-3',
        number: '03',
        title: 'Digital Trust, Safety & Cybersecurity',
        icon: '🛡️',
        category: 'Security',
        desc: 'Engineer privacy-preserving AI models, zero-trust automated defense mechanisms, deepfake and fraud detection engines, and compliance tools.',
        challenges: [
          'Real-time synthetic voice and deepfake video verification',
          'Automated vulnerability discovery in smart contracts and APIs',
          'Privacy-first federated learning for sensitive client data'
        ],
        active: true,
        order: 3
      },
      {
        id: 'track-4',
        number: '04',
        title: 'Inclusive & Assistive Technology',
        icon: '♿',
        category: 'Social Impact',
        desc: 'Design accessible AI solutions for individuals with visual, auditory, or motor impairments, diagnostic healthcare tools, and adaptive education.',
        challenges: [
          'Sign language to spoken language multi-modal live translator',
          'Edge AI for accessible urban navigation for the visually impaired',
          'AI-assisted early triage and remote medical diagnostics'
        ],
        active: true,
        order: 4
      },
      {
        id: 'track-5',
        number: '05',
        title: 'Future of Work & Enterprise Automation',
        icon: '⚡',
        category: 'Enterprise',
        desc: 'Revolutionize modern enterprise operations with generative intelligence, automated quality assurance, developer velocity tools, and smart analytics.',
        challenges: [
          'Autonomous synthetic test-data and QA scenario generation',
          'Predictive customer churn and sentiment engine',
          'Next-gen collaborative visual whiteboard to production code copilot'
        ],
        active: true,
        order: 5
      }
    ],

    // ── PRIZES & REWARDS ──
    prizes: {
      poolTotal: '₹50,000+ Prize Pool',
      subtitle: 'Exciting Cash Rewards, Prestigious Trophies, Internship Offers & Verified Global Distinctions',
      podiumImage: '',
      tier1: {
        title: 'First Prize — Global Champion',
        amount: '₹25,000 Cash',
        badge: '🥇 1st Place',
        perks: [
          'Direct Interview & Internship Opportunity with Innovation Hacks',
          'Exclusive 1st Prize Winner Certificate of Achievement',
          'Feature in Innovation Hacks Hall of Fame & Social Media Spotlight',
          'Cloud Computing & Premium Developer Tool Credits'
        ]
      },
      tier2: {
        title: 'Second Prize — Global Runner-Up',
        amount: '₹15,000 Cash',
        badge: '🥈 2nd Place',
        perks: [
          'Guaranteed Shortlisting for Innovation Hacks Internship Roles',
          'Official 2nd Prize Winner Certificate of Achievement',
          'Premium Developer Swag Kit & Software Vouchers',
          'Mentorship Sessions with Senior Silicon Valley AI Engineers'
        ]
      },
      tier3: {
        title: 'Third Prize — 2nd Runner-Up',
        amount: '₹10,000 Cash',
        badge: '🥉 3rd Place',
        perks: [
          'Official 3rd Prize Winner Certificate of Achievement',
          'Exclusive Digital Innovation Kit & API Access Credits',
          'Letter of Recommendation & LinkedIn Endorsement',
          'Access to Innovation Hacks Accelerator Network'
        ]
      },
      specialAwards: [
        {
          title: 'Best All-Girls Innovation Team',
          reward: 'Cash Grant + Special Merit Credential',
          icon: '👑'
        },
        {
          title: 'Best First-Year Innovator Team',
          reward: 'Special Recognition + Starter Tech Pack',
          icon: '🚀'
        },
        {
          title: 'Most Creative AI Implementation',
          reward: 'Innovation Hacks Special Jury Award',
          icon: '💡'
        }
      ]
    },

    // ── FREQUENTLY ASKED QUESTIONS (FAQS) ──
    faqs: [
      {
        id: 'faq-1',
        question: 'What is the HORIZON X 2K26 Global AI Hackathon?',
        answer: 'HORIZON X 2K26 is a premier global AI hackathon organized by <strong>Innovation Hacks</strong> and hosted on the <strong>Unstop</strong> platform. It unites ambitious student developers, researchers, and AI creators worldwide to build breakthrough, real-world solutions leveraging cutting-edge Artificial Intelligence, Machine Learning, Computer Vision, Generative AI, and Autonomous AI Agents.',
        category: 'General',
        order: 1,
        active: true
      },
      {
        id: 'faq-2',
        question: 'Who is eligible to participate and what is the team format?',
        answer: 'The hackathon is open globally to all undergraduate and postgraduate students across all disciplines — including Engineering, Computer Science, AI & Data Science, Management, Commerce, and Sciences — as well as independent tech innovators. Participation is flexible: you can compete as a <strong>solo innovator or in a team of 1 to 4 members</strong>.',
        category: 'Eligibility',
        order: 2,
        active: true
      },
      {
        id: 'faq-3',
        question: 'What challenge tracks and domains are featured in HORIZON X 2K26?',
        answer: 'Participants can innovate across 5 specialized, future-facing domains: <ol style="margin-top:10px;margin-left:20px;line-height:1.8;"><li><strong>Autonomous AI Agents & Everyday AI:</strong> Intelligent assistants, workflow automation, and LLM/RAG solutions.</li><li><strong>Smart & Sustainable Future:</strong> Green tech, energy optimization, smart agriculture, and climate intelligence.</li><li><strong>Digital Trust, Safety & Cybersecurity:</strong> AI threat detection, privacy-preserving systems, and anti-fraud engines.</li><li><strong>Inclusive & Assistive Technology:</strong> AI solutions for accessibility, healthcare diagnostics, and education equity.</li><li><strong>Future of Work & Enterprise Automation:</strong> AI copilots, generative workflows, and next-gen productivity tools.</li></ol>',
        category: 'Tracks',
        order: 3,
        active: true
      },
      {
        id: 'faq-4',
        question: 'How do I register and where do I find the official rules and schedule?',
        answer: 'All official registrations, guidelines, round submissions, and schedule timelines are conducted exclusively through Unstop. You can view full event details and register your team directly on the <a href="https://unstop.com/p/horizon-x-2k26-global-hackathon-2k26-innovation-hacks-1757170" target="_blank" rel="noopener noreferrer" style="color:#2563EB;text-decoration:underline;font-weight:600;">Official Unstop HORIZON X 2K26 Portal ↗</a>.',
        category: 'Registration',
        order: 4,
        active: true
      },
      {
        id: 'faq-5',
        question: 'Will participants receive verified certificates and credentials?',
        answer: 'Yes! Every participant who registers and submits a qualifying project in accordance with official rules receives an authentic, tamper-evident <strong>Certificate of Participation</strong> verifiable directly through our online certification portal. Winning distinction teams receive official <strong>Certificates of Achievement</strong> along with online internship opportunities with Innovation Hacks, and evaluators receive <strong>Certificates of Appreciation</strong>.',
        category: 'Certification',
        order: 5,
        active: true
      }
    ],

    // ── FAQ SECTION HEADER (IMAGE 5) ──
    faqHeader: {
      eyebrow: 'Frequently Asked Questions',
      title: 'Got Questions?',
      description: 'Official answers, eligibility rules, challenge tracks, and guidelines for the HORIZON X 2K26 Global AI Hackathon.'
    },

    // ── OFFICIAL CREDENTIAL PORTAL HEADER (IMAGE 1) ──
    certificationHeader: {
      eyebrow: 'OFFICIAL CREDENTIAL PORTAL',
      titlePrefix: 'Claim Your',
      titleHighlight: 'Official Certificate',
      description: 'Generate, preview, and download your verified HORIZON X 2K26 digital credential at print-ready 300 DPI.'
    },

    // ── CERTIFICATE CLAIM CTA SECTION (IMAGE 2) ──
    claimCta: {
      heading: 'Ready to Earn Your Official Certificate?',
      description: 'Register on Unstop now with your team (2–4 members). Hack for 36 hours, build real-world AI & Web3 solutions, and receive verified credentials.',
      primaryButtonText: 'Register on Unstop',
      primaryButtonUrl: 'https://unstop.com/p/horizon-x-2k26-global-hackathon-2k26-innovation-hacks-1757170',
      secondaryButtonText: 'Join WhatsApp Group',
      secondaryButtonUrl: 'https://whatsapp.com/channel/0029VbDbywN2f3EJaickj41y'
    },

    // ── FOOTER & SOCIAL ──
    footer: {
      brandDesc: 'A technology innovation platform empowering students, developers, and creators to transform ambitious ideas into impactful digital reality through hackathons and learning opportunities.',
      copyrightText: '© {year} Innovation Hacks. All rights reserved. BUILD • INNOVATE • IMPACT.',
      officialPlatformText: 'HORIZON X 2K26 on Unstop',
      officialPlatformUrl: 'https://unstop.com/p/horizon-x-2k26-global-hackathon-2k26-innovation-hacks-1757170',
      socialLinks: {
        whatsapp: 'https://whatsapp.com/channel/0029VbDbywN2f3EJaickj41y',
        unstop: 'https://unstop.com/p/horizon-x-2k26-global-hackathon-2k26-innovation-hacks-1757170',
        github: 'https://github.com/innovation-hacks',
        linkedin: 'https://linkedin.com/company/innovation-hacks',
        instagram: 'https://instagram.com/innovationhacks',
        twitter: 'https://twitter.com/innovationhacks'
      }
    },

    // ── SEO METADATA ──
    seo: {
      home: {
        title: 'HORIZON X 2K26 | Global AI Hackathon by Innovation Hacks',
        metaDescription: 'Build innovative AI-powered solutions to real-world challenges. Explore Generative AI, Machine Learning, Computer Vision, NLP, RAG, and AI Agents through a premier global innovation experience.',
        keywords: 'HORIZON X 2K26, Global AI Hackathon, AI Engineering, Innovation Hacks, Machine Learning, Generative AI, Computer Vision, NLP, RAG, AI Agents, Hackathon 2026',
        ogTitle: 'HORIZON X 2K26 | Global AI Hackathon',
        ogDescription: 'Build innovative AI-powered solutions to real-world challenges. Compete for ₹50,000+ Prize Pool, certificates, and internships.',
        ogImage: 'assets/brand/horizon-x-logo.png',
        canonicalUrl: 'https://horizonx.innovationhacks.org/'
      },
      winner: {
        title: 'HORIZON X 2K26 | Winner Distinction & Merit Portal',
        metaDescription: 'Claim and verify your official HORIZON X 2K26 Distinction and Merit Certificates for 1st, 2nd, and 3rd place winners.',
        keywords: 'Winner certificates, Horizon X merit, AI Hackathon winners',
        ogTitle: 'HORIZON X 2K26 | Winner Distinction Portal',
        ogDescription: 'Generate and verify official winner achievement certificates.',
        ogImage: 'assets/brand/horizon-x-logo.png',
        canonicalUrl: 'https://horizonx.innovationhacks.org/winner.html'
      },
      judges: {
        title: 'HORIZON X 2K26 | Judge & Evaluator Appreciation Portal',
        metaDescription: 'Official certificate verification for distinguished judges, mentors, and jury members of HORIZON X 2K26.',
        keywords: 'Judge certificate, evaluator credentials, Horizon X hackathon jury',
        ogTitle: 'HORIZON X 2K26 | Judge Portal',
        ogDescription: 'Generate and verify official judge appreciation certificates.',
        ogImage: 'assets/brand/horizon-x-logo.png',
        canonicalUrl: 'https://horizonx.innovationhacks.org/judges.html'
      }
    },

    // ── MEDIA ASSETS REGISTRY ──
    mediaAssets: [
      { id: 'm-1', name: 'Horizon X Logo', url: 'assets/brand/horizon-x-logo.png', category: 'Logos', alt: 'Horizon X 2K26 Official Logo' },
      { id: 'm-2', name: 'Innovation Hacks Logo', url: 'assets/brand/innovation-hacks-logo.png', category: 'Logos', alt: 'Innovation Hacks Logo' },
      { id: 'm-3', name: 'Hero 3D AI Robot (Clean)', url: 'assets/brand/hero-ai-robot-clean.png', category: 'Illustrations', alt: 'Hero 3D AI Robot' },
      { id: 'm-4', name: 'About 3D AI Robot', url: 'assets/brand/about-ai-robot-3d.png', category: 'Illustrations', alt: 'About 3D AI Robot holding bulb' },
      { id: 'm-6', name: 'Event Banner', url: 'assets/brand/event-banner.png', category: 'Banners', alt: 'Horizon X 2K26 Event Banner' },
      { id: 'm-7', name: 'Participation Certificate Template', url: 'assets/certificates/cert-participation.png', category: 'Certificates', alt: 'Certificate of Participation Template' },
      { id: 'm-8', name: 'First Prize Certificate Template', url: 'assets/certificates/cert-first-prize.png', category: 'Certificates', alt: 'First Prize Certificate Template' },
      { id: 'm-9', name: 'Second Prize Certificate Template', url: 'assets/certificates/cert-second-prize.png', category: 'Certificates', alt: 'Second Prize Certificate Template' },
      { id: 'm-10', name: 'Third Prize Certificate Template', url: 'assets/certificates/cert-third-prize.png', category: 'Certificates', alt: 'Third Prize Certificate Template' },
      { id: 'm-11', name: 'Judge Appreciation Certificate Template', url: 'assets/certificates/cert-judge-appreciation.jpg', category: 'Certificates', alt: 'Judge Appreciation Certificate Template' }
    ]
  };

  // Expose to window
  window.DEFAULT_CMS_CONTENT = DEFAULT_CMS_CONTENT;
})(window);
