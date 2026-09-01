// =====================================================================
// GESEN — Cabinet Management
// Shared behavior for every page: always-visible nav groups, mobile
// sidebar, automatic active-link highlighting, and a light count-up on
// dashboard metrics. No frameworks, no build step — just the DOM.
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {
  setActiveLink();
  initMobileSidebar();
  animateMetrics();
  initProfileMenu();
  initArcadeMenu();
  initLoginForm();
  applyArcadeBranding();
  applyProfileBranding();
  applyFeatureVisibility();
  initFeatureToggles();
  initArcadeInfoForm();
  initProfileForm();
  initProfileStaffSync();
  initStaffDirectory();
  initStaffRoles();
  initCabinetsDirectory();
  initAccessLevels();
});

/* ---------------------------------------------------------------------
   Highlight the current page in the sidebar. Nav groups (Admin /
   Operations / Community) are always expanded, so there's no
   open/close state to manage here anymore.
   --------------------------------------------------------------------- */
function setActiveLink() {
  const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  document.querySelectorAll('.nav-link, .nav-link-home').forEach((link) => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    if (href === current) link.classList.add('active');
  });
}

/* ---------------------------------------------------------------------
   Mobile hamburger + off-canvas sidebar
   --------------------------------------------------------------------- */
function initMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const scrim = document.getElementById('sidebarScrim');
  const openBtn = document.getElementById('sidebarOpen');
  const closeBtn = document.getElementById('sidebarClose');
  if (!sidebar || !scrim || !openBtn || !closeBtn) return;

  const open = () => {
    sidebar.classList.add('open');
    scrim.classList.add('show');
  };
  const close = () => {
    sidebar.classList.remove('open');
    scrim.classList.remove('show');
  };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  scrim.addEventListener('click', close);
}

/* ---------------------------------------------------------------------
   Count metric numbers up from 0 on load. Only runs on elements marked
   with [data-count]; harmless / inert on pages without them.
   --------------------------------------------------------------------- */
function animateMetrics() {
  const targets = document.querySelectorAll('[data-count]');
  if (!targets.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  targets.forEach((el) => {
    const end = parseFloat(el.getAttribute('data-count'));
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const decimals = el.getAttribute('data-decimals') ? parseInt(el.getAttribute('data-decimals'), 10) : 0;

    if (prefersReducedMotion || isNaN(end)) {
      el.textContent = prefix + end.toFixed(decimals) + suffix;
      return;
    }

    const duration = 900;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      const value = end * eased;
      el.textContent = prefix + value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}

/* ---------------------------------------------------------------------
   Profile dropdown — avatar button top-right on every signed-in page.
   Sign Out clears the session flag and sends the person back to login.
   --------------------------------------------------------------------- */
function initProfileMenu() {
  const menu = document.getElementById('profileMenu');
  const trigger = document.getElementById('profileTrigger');
  if (!menu || !trigger) return;

  const close = () => {
    menu.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
  };

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.toggle('open');
    trigger.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      try { sessionStorage.removeItem('gesenAuthed'); } catch (e) {}
      location.href = '0-login.html';
    });
  }
}

/* ---------------------------------------------------------------------
   Arcade switcher — sits above "Dashboard" at the top of the sidebar.
   Same open/close pattern as the profile menu. The listed arcades
   (besides the current one) are dummy placeholders for now, so their
   links are clickable but intentionally don't navigate anywhere.
   --------------------------------------------------------------------- */
function initArcadeMenu() {
  const menu = document.getElementById('arcadeMenu');
  const trigger = document.getElementById('arcadeTrigger');
  if (!menu || !trigger) return;

  const close = () => {
    menu.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
  };

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.toggle('open');
    trigger.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  menu.querySelectorAll('.arcade-option').forEach((option) => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      close();
    });
  });
}

/* ---------------------------------------------------------------------
   Sign-in form (0-login.html). Fields aren't validated against a real
   account yet — submitting just marks the session as signed in and
   sends the person into the dashboard.
   --------------------------------------------------------------------- */
function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    try { sessionStorage.setItem('gesenAuthed', 'true'); } catch (e) {}
    location.href = 'index.html';
  });
}

/* ---------------------------------------------------------------------
   Arcade Info — sitewide branding
   Reflects what the Owner enters on the Arcade Info tab everywhere the
   generic "G" mark and location name show up: the sidebar logo, the
   mobile topbar mark, and the sidebar's location pill. Falls back to
   the defaults when nothing has been saved yet. Runs on every page.
   --------------------------------------------------------------------- */
function applyArcadeBranding() {
  try {
    const logo = localStorage.getItem('gesenArcadeLogo');
    const name = localStorage.getItem('gesenArcadeName');
    const status = localStorage.getItem('gesenArcadeStatus');

    document.querySelectorAll('.logo-mark, .topbar-brand').forEach((mark) => {
      if (logo) {
        mark.innerHTML = '<img src="' + logo + '" alt="" class="logo-mark-img">';
        mark.classList.add('has-logo');
      } else {
        mark.textContent = 'G';
        mark.classList.remove('has-logo');
      }
    });

    // The arcade-switcher trigger (top of sidebar) and its own "active"
    // entry in the dropdown both represent the current arcade, so both
    // get the saved name/status. Only the dot + name text update -- the
    // trigger's chevron and the option's markup are left alone.
    const applyToArcadeName = (container) => {
      const dot = container.querySelector('.dot');
      if (dot) {
        dot.classList.remove('dot-warn', 'dot-brand', 'dot-bad');
        if (status === 'temporarily-closed') dot.classList.add('dot-warn');
        else if (status === 'coming-soon') dot.classList.add('dot-brand');
        else if (status === 'closed') dot.classList.add('dot-bad');
      }
      const nameEl = container.querySelector('.arcade-trigger-name, .arcade-option-name');
      if (name && nameEl) nameEl.textContent = name;
    };

    document.querySelectorAll('.arcade-trigger').forEach(applyToArcadeName);
    document.querySelectorAll('.arcade-option.active').forEach(applyToArcadeName);
  } catch (e) {}
}

// Default person-silhouette icon shown until a profile photo is set --
// same markup already inlined on every page's topbar/profile-dropdown
// avatar, kept here once so it can be restored after a photo is removed.
const DEFAULT_AVATAR_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.5-7 8-7s8 3 8 7"/></svg>';

/* ---------------------------------------------------------------------
   Profile photo — sitewide branding
   Reflects the photo uploaded on the Profile page everywhere the
   generic person-icon avatar shows up: the topbar button, the profile
   dropdown, and the Profile page's own preview. Falls back to the
   default icon when nothing has been uploaded yet. Runs on every page.
   --------------------------------------------------------------------- */
function applyProfileBranding() {
  try {
    const photo = localStorage.getItem('gesenProfilePhoto');
    document.querySelectorAll('.profile-menu .avatar-placeholder, .js-profile-photo').forEach((el) => {
      el.innerHTML = photo ? '<img src="' + photo + '" alt="">' : DEFAULT_AVATAR_SVG;
    });
  } catch (e) {}
}

/* ---------------------------------------------------------------------
   Feature visibility — hides/shows a tab's sidebar link based on the
   toggle state saved from Settings. Defaults to visible (true) for any
   feature that hasn't been explicitly turned off. Runs on every page.
   --------------------------------------------------------------------- */
function applyFeatureVisibility() {
  try {
    const featureLinks = {
      arcadeInfo: 'a.nav-link[href="1-arcadeinfo.html"]',
      staff: 'a.nav-link[href="1-staff.html"]',
      cabinets: 'a.nav-link[href="2-cabinets.html"]',
    };

    Object.keys(featureLinks).forEach((feature) => {
      const stored = localStorage.getItem('gesenFeature_' + feature);
      const enabled = stored === null ? true : stored === 'true';
      document.querySelectorAll(featureLinks[feature]).forEach((link) => {
        const item = link.closest('li');
        if (item) item.style.display = enabled ? '' : 'none';
      });
    });
  } catch (e) {}
}

/* ---------------------------------------------------------------------
   Settings page — feature toggle switches. Only the switches carrying
   [data-feature] are wired up; the rest stay disabled placeholders
   until their tabs are actually built.
   --------------------------------------------------------------------- */
function initFeatureToggles() {
  document.querySelectorAll('.switch input[data-feature]').forEach((input) => {
    const feature = input.getAttribute('data-feature');
    const stored = localStorage.getItem('gesenFeature_' + feature);
    input.checked = stored === null ? true : stored === 'true';

    input.addEventListener('change', () => {
      try { localStorage.setItem('gesenFeature_' + feature, String(input.checked)); } catch (e) {}

      const row = input.closest('.settings-row');
      const badge = row ? row.querySelector('.badge-available, .badge-unavailable') : null;
      if (badge) {
        badge.textContent = input.checked ? 'Enabled' : 'Disabled';
        badge.className = input.checked ? 'badge-available' : 'badge-unavailable';
      }

      applyFeatureVisibility();
    });
  });
}

/* ---------------------------------------------------------------------
   Arcade Info tab (1-arcadeinfo.html) — loads saved field values,
   handles the logo upload + color accent live preview, and persists
   everything to localStorage on Save. Everything here is a prototype
   stand-in for a real backend; it only affects this browser.
   --------------------------------------------------------------------- */
function initArcadeInfoForm() {
  const form = document.getElementById('arcadeInfoForm');
  if (!form) return;

  const fields = {
    arcadeName: 'gesenArcadeName',
    arcadeStatus: 'gesenArcadeStatus',
    arcadeAddress: 'gesenArcadeAddress',
    arcadePhone: 'gesenArcadePhone',
    arcadeEmail: 'gesenArcadeEmail',
    arcadeWebsite: 'gesenArcadeWebsite',
    arcadeHours: 'gesenArcadeHours',
    arcadeTimezone: 'gesenArcadeTimezone',
    arcadeEmployees: 'gesenArcadeEmployees',
    arcadeCabinets: 'gesenArcadeCabinets',
  };

  // ---- Load saved field values ----
  Object.keys(fields).forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const saved = localStorage.getItem(fields[id]);
    if (saved !== null) el.value = saved;
  });

  // ---- Color accent ----
  const colorInput = document.getElementById('arcadeColor');
  const colorHex = document.getElementById('arcadeColorHex');
  const savedColor = localStorage.getItem('gesenBrandColor');
  if (colorInput && colorHex) {
    const initial = savedColor || '#e8a33d';
    colorInput.value = initial;
    colorHex.value = initial;

    function syncColor(value) {
      if (!/^#[0-9a-fA-F]{6}$/.test(value)) return;
      colorInput.value = value;
      colorHex.value = value;
      document.documentElement.style.setProperty('--brand', value);
    }

    colorInput.addEventListener('input', () => syncColor(colorInput.value));
    colorHex.addEventListener('input', () => {
      let v = colorHex.value.trim();
      if (v && v[0] !== '#') v = '#' + v;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) syncColor(v);
    });
  }

  // ---- Logo upload ----
  const logoInput = document.getElementById('arcadeLogo');
  const logoPreview = document.getElementById('logoPreview');
  const removeLogoBtn = document.getElementById('removeLogoBtn');
  let pendingLogo = localStorage.getItem('gesenArcadeLogo');

  function renderLogoPreview() {
    if (!logoPreview) return;
    if (pendingLogo) {
      logoPreview.innerHTML = '<img src="' + pendingLogo + '" alt="" class="logo-mark-img">';
      if (removeLogoBtn) removeLogoBtn.style.display = '';
    } else {
      logoPreview.textContent = 'G';
      if (removeLogoBtn) removeLogoBtn.style.display = 'none';
    }
  }
  renderLogoPreview();

  if (logoInput) {
    logoInput.addEventListener('change', () => {
      const file = logoInput.files && logoInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        pendingLogo = reader.result;
        renderLogoPreview();
      };
      reader.readAsDataURL(file);
    });
  }

  if (removeLogoBtn) {
    removeLogoBtn.addEventListener('click', () => {
      pendingLogo = null;
      if (logoInput) logoInput.value = '';
      renderLogoPreview();
    });
  }

  // ---- Status preview pill in the page header ----
  const statusPreview = document.getElementById('statusPreview');
  const statusSelect = document.getElementById('arcadeStatus');
  const statusLabels = {
    active: 'Active',
    'temporarily-closed': 'Temporarily Closed',
    'coming-soon': 'Coming Soon',
    closed: 'Closed',
  };

  function renderStatusPreview() {
    if (!statusSelect || !statusPreview) return;
    const val = statusSelect.value;
    if (!val) {
      statusPreview.style.display = 'none';
      return;
    }
    statusPreview.textContent = statusLabels[val] || val;
    statusPreview.className = 'status-pill status-' + val;
    statusPreview.style.display = '';
  }

  if (statusSelect) {
    statusSelect.addEventListener('change', renderStatusPreview);
    renderStatusPreview();
  }

  // ---- Save ----
  const saveStatus = document.getElementById('saveStatus');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    try {
      Object.keys(fields).forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        localStorage.setItem(fields[id], el.value);
      });

      if (colorHex && colorHex.value) {
        localStorage.setItem('gesenBrandColor', colorHex.value);
      }

      if (pendingLogo) {
        localStorage.setItem('gesenArcadeLogo', pendingLogo);
      } else {
        localStorage.removeItem('gesenArcadeLogo');
      }
    } catch (err) {}

    applyArcadeBranding();
    renderStatusPreview();

    if (saveStatus) {
      saveStatus.classList.add('show');
      clearTimeout(saveStatus._hideTimer);
      saveStatus._hideTimer = setTimeout(() => saveStatus.classList.remove('show'), 2400);
    }
  });
}

/* ---------------------------------------------------------------------
   Profile page (0-profile.html) — only Profile Photo and Pronouns are
   actually editable here; everything else on the page is a read-only
   "TBD" stand-in for data that will eventually sync from the Staff
   Directory, so there's nothing else to load or save.
   --------------------------------------------------------------------- */
function initProfileForm() {
  const form = document.getElementById('profileForm');
  if (!form) return;

  // ---- Pronouns ----
  const pronounsInput = document.getElementById('profilePronouns');
  if (pronounsInput) {
    const saved = localStorage.getItem('gesenProfilePronouns');
    if (saved !== null) pronounsInput.value = saved;
  }


  // ---- Profile photo ----
  const photoInput = document.getElementById('profilePhoto');
  const photoPreview = document.getElementById('profilePhotoPreview');
  const removePhotoBtn = document.getElementById('removePhotoBtn');
  let pendingPhoto = localStorage.getItem('gesenProfilePhoto');

  function renderPhotoPreview() {
    if (!photoPreview) return;
    photoPreview.innerHTML = pendingPhoto ? '<img src="' + pendingPhoto + '" alt="">' : DEFAULT_AVATAR_SVG;
    if (removePhotoBtn) removePhotoBtn.style.display = pendingPhoto ? '' : 'none';
  }
  renderPhotoPreview();

  if (photoInput) {
    photoInput.addEventListener('change', () => {
      const file = photoInput.files && photoInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        pendingPhoto = reader.result;
        renderPhotoPreview();
      };
      reader.readAsDataURL(file);
    });
  }

  if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', () => {
      pendingPhoto = null;
      if (photoInput) photoInput.value = '';
      renderPhotoPreview();
    });
  }

  // ---- Save ----
  const saveStatus = document.getElementById('profileSaveStatus');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    try {
      if (pronounsInput) localStorage.setItem('gesenProfilePronouns', pronounsInput.value);

      if (pendingPhoto) {
        localStorage.setItem('gesenProfilePhoto', pendingPhoto);
      } else {
        localStorage.removeItem('gesenProfilePhoto');
      }
    } catch (err) {}

    applyProfileBranding();

    if (saveStatus) {
      saveStatus.classList.add('show');
      clearTimeout(saveStatus._hideTimer);
      saveStatus._hideTimer = setTimeout(() => saveStatus.classList.remove('show'), 2400);
    }
  });
}

/* ---------------------------------------------------------------------
   Profile <-> Staff Directory sync (0-profile.html). This prototype has
   no real multi-user login, so "the current user" is a fixed stand-in --
   Sam Rivera, the same person hardcoded in the topbar and profile
   dropdown everywhere else in the app. Identity and Employee Details
   are read-only here on purpose: they're edited on the Staff page, not
   this one -- this just mirrors whatever's there.

   Matched by NAME rather than Staff ID: the ID is just an editable form
   field on that page, so pinning to a specific one (e.g. 'STF-004')
   breaks the moment it gets edited or reassigned. The name is the more
   stable anchor here, since it's the identity shown everywhere else.
   --------------------------------------------------------------------- */
const CURRENT_STAFF_NAME = 'Sam Rivera';

// Work Email isn't a field in the Staff Directory -- it's derived from
// one, purely by convention: firstname.lastname@[work location].com,
// using the person's first-listed Work Location. First and last name
// are just the first and last whitespace-separated tokens of Full Name,
// so a middle name (if any) is dropped rather than included.
function deriveWorkEmail(fullName, location) {
  if (!fullName || !location) return null;
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  const first = parts[0];
  const last = parts.length > 1 ? parts[parts.length - 1] : '';
  const domain = location.toLowerCase().replace(/\s+/g, '') + '.com';
  return (last ? `${first}.${last}` : first) + '@' + domain;
}

function initProfileStaffSync() {
  const nameEl = document.getElementById('profileFullName');
  if (!nameEl) return; // not on this page

  const titleEl = document.getElementById('profileJobTitle');
  const startEl = document.getElementById('profileStartDate');
  const reportsEl = document.getElementById('profileDirectReports');
  const locationsEl = document.getElementById('profileWorkLocations');
  const rolesEl = document.getElementById('profileRoles');
  const emailEl = document.getElementById('profileWorkEmail');
  const staffIdEl = document.getElementById('profileStaffId');

  const staff = loadStaffList();
  const me = staff.find((s) => s.name.trim().toLowerCase() === CURRENT_STAFF_NAME.toLowerCase());

  if (!me) {
    // The seeded staff record was deleted from the Directory -- don't
    // show stale or made-up data for it.
    const missing = 'Not found in Staff Directory';
    [nameEl, titleEl, startEl, reportsEl, locationsEl, rolesEl, emailEl, staffIdEl].forEach((el) => {
      if (el) el.textContent = missing;
    });
    return;
  }

  const roles = loadStaffRoles();
  const assignments = loadStaffAssignments();
  const myRole = roles.find((r) => r.id === assignments[me.staffId]);
  const directReports = staff.filter((s) => s.managerId === me.staffId).map((s) => s.name);
  const primaryLocation = me.locations && me.locations[0];

  nameEl.textContent = me.name;
  if (titleEl) titleEl.textContent = me.jobTitle;
  if (startEl) startEl.textContent = me.startDate || '—';
  if (reportsEl) reportsEl.textContent = directReports.length ? directReports.join(', ') : '—';
  if (locationsEl) locationsEl.textContent = (me.locations && me.locations.length) ? me.locations.join(', ') : '—';
  if (rolesEl) rolesEl.textContent = myRole ? myRole.name : 'Not yet assigned';
  if (emailEl) emailEl.textContent = deriveWorkEmail(me.name, primaryLocation) || '—';
  if (staffIdEl) staffIdEl.textContent = me.staffId;
}

/* =======================================================================
   Staff (1-staff.html) — Directory, Roles, and Access Levels.
   Everything below is a browser-only prototype: staff, roles, and role
   assignments all live in localStorage so the page has real data to
   sort/paginate/assign against, but nothing here is shared across
   people or devices yet.
   ======================================================================= */

const STAFF_KEY = 'gesenStaffDirectory';
const STAFF_ROLES_KEY = 'gesenStaffRoles';
const STAFF_ASSIGNMENTS_KEY = 'gesenStaffRoleAssignments';
const ACCESS_OVERRIDES_KEY = 'gesenAccessOverrides';

const STAFF_LOCATIONS = ['Udoncade', 'Bobacade', 'Cephycade', 'Jackcade'];
const STAFF_SPECIALTIES = ['Rhythm Games', 'Prizes', 'Candy Cabs', 'Crane Games', 'Gachapon', 'Other'];

// The permission grid a role's access is gated by, grouped the same
// way the sidebar is (Admin / Operations / Community) and pre-filled
// per the access-level chart supplied for the site. This is still a
// preview -- Settings will own the real per-role toggles later -- but
// the allowed/revoked state per permission is real, not placeholder.
// Fixed role columns for the Access Levels chart (now living on the
// Settings page, 0-settings.html). Deliberately its own list, not the
// dynamic `roles` staff members get assigned to on the Staff page --
// this is a fixed permission-tier reference, not tied to who's
// currently assigned to what.
const ACCESS_ROLE_COLUMNS = [
  { id: 'store-owner', name: 'Store Owner' },
  { id: 'general-manager', name: 'General Manager' },
  { id: 'floor-staff', name: 'Floor Staff' },
  { id: 'repair-tech', name: 'Repair Tech' },
  { id: 'community-manager', name: 'Community Manager' },
  { id: 'member', name: 'Member' },
];

const ACCESS_PERMISSIONS = [
  { label: 'Metrics', group: 'Admin', allowed: ['store-owner', 'general-manager'] },
  { label: 'Financials', group: 'Admin', allowed: ['store-owner', 'general-manager'] },
  { label: 'Staff - Add & Edit', group: 'Admin', allowed: ['store-owner', 'general-manager'] },
  { label: 'Staff - Delete', group: 'Admin', allowed: ['store-owner'] },
  { label: 'Vendors', group: 'Admin', allowed: ['store-owner', 'general-manager', 'repair-tech'] },
  { label: 'Arcade Info', group: 'Admin', allowed: ['store-owner', 'general-manager'] },
  { label: 'Cabinets', group: 'Operations', allowed: ['store-owner', 'general-manager', 'floor-staff', 'repair-tech'] },
  { label: 'Play Cards', group: 'Operations', allowed: ['store-owner', 'general-manager', 'floor-staff'] },
  { label: 'Prize Inventory', group: 'Operations', allowed: ['store-owner', 'general-manager', 'floor-staff'] },
  { label: 'Work Orders', group: 'Operations', allowed: ['store-owner', 'general-manager', 'repair-tech'] },
  { label: 'Parts & Supplies', group: 'Operations', allowed: ['store-owner', 'general-manager', 'repair-tech'] },
  { label: 'Wallet', group: 'Community', allowed: ['store-owner', 'general-manager', 'floor-staff', 'repair-tech', 'community-manager', 'member'] },
  { label: 'Meetups', group: 'Community', allowed: ['store-owner', 'general-manager', 'floor-staff', 'repair-tech', 'community-manager', 'member'] },
  { label: 'Leaderboards', group: 'Community', allowed: ['store-owner', 'general-manager', 'floor-staff', 'repair-tech', 'community-manager', 'member'] },
  { label: 'Suggestion Board', group: 'Community', allowed: ['store-owner', 'general-manager', 'floor-staff', 'repair-tech', 'community-manager', 'member'] },
  { label: 'Notifications', group: 'Community', allowed: ['store-owner', 'general-manager', 'floor-staff', 'repair-tech', 'community-manager', 'member'] },
];

const DEFAULT_STAFF = [
  { staffId: 'STF-001', name: 'Jordan Blake', jobTitle: 'Owner', status: 'active', startDate: '2021-03-01', managerId: '', locations: ['Udoncade', 'Bobacade', 'Cephycade', 'Jackcade'], specialties: ['Other'] },
  { staffId: 'STF-002', name: 'Priya Nair', jobTitle: 'General Manager', status: 'active', startDate: '2022-01-15', managerId: 'STF-001', locations: ['Udoncade'], specialties: ['Other'] },
  { staffId: 'STF-003', name: 'Marcus Webb', jobTitle: 'Lead Technician', status: 'active', startDate: '2022-06-10', managerId: 'STF-002', locations: ['Udoncade', 'Bobacade'], specialties: ['Rhythm Games', 'Crane Games'] },
  { staffId: 'STF-004', name: 'Sam Rivera', jobTitle: 'Technician', status: 'active', startDate: '2023-02-20', managerId: 'STF-003', locations: ['Bobacade'], specialties: ['Candy Cabs', 'Gachapon'] },
  { staffId: 'STF-005', name: 'Tasha Kim', jobTitle: 'Floor Staff', status: 'active', startDate: '2023-08-01', managerId: 'STF-002', locations: ['Cephycade'], specialties: ['Prizes'] },
  { staffId: 'STF-006', name: 'Devon Ortiz', jobTitle: 'Floor Staff', status: 'pending', startDate: '2026-09-01', managerId: 'STF-002', locations: ['Jackcade'], specialties: ['Prizes', 'Other'] },
  { staffId: 'STF-007', name: 'Elena Cruz', jobTitle: 'Floor Staff', status: 'inactive', startDate: '2021-11-05', managerId: 'STF-002', locations: ['Udoncade'], specialties: ['Crane Games'] },
  { staffId: 'STF-008', name: 'Riley Chen', jobTitle: 'Community VIP', status: 'active', startDate: '2024-04-12', managerId: 'STF-001', locations: ['Udoncade', 'Jackcade'], specialties: ['Other'] },
];

// IDs/names match Settings > Access Levels' ACCESS_ROLE_COLUMNS on
// purpose now, so a role here maps 1:1 to a permissions column there.
const DEFAULT_ROLES = [
  { id: 'store-owner', name: 'Store Owner' },
  { id: 'general-manager', name: 'General Manager' },
  { id: 'floor-staff', name: 'Floor Staff' },
  { id: 'repair-tech', name: 'Repair Tech' },
  { id: 'community-manager', name: 'Community Manager' },
  { id: 'member', name: 'Member' },
];

const DEFAULT_ASSIGNMENTS = {
  'STF-001': 'store-owner',
  'STF-002': 'general-manager',
  'STF-003': 'repair-tech',
  'STF-004': 'repair-tech',
  'STF-005': 'floor-staff',
  'STF-006': 'floor-staff',
  'STF-007': 'floor-staff',
  'STF-008': 'community-manager',
};

function staffEscapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function loadStaffList() {
  try {
    const raw = localStorage.getItem(STAFF_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_STAFF.map((s) => ({ ...s }));
}

function saveStaffList(list) {
  try { localStorage.setItem(STAFF_KEY, JSON.stringify(list)); } catch (e) {}
}

function loadStaffRoles() {
  let roles;
  try {
    const raw = localStorage.getItem(STAFF_ROLES_KEY);
    roles = raw ? JSON.parse(raw) : DEFAULT_ROLES.map((r) => ({ ...r }));
  } catch (e) {
    roles = DEFAULT_ROLES.map((r) => ({ ...r }));
  }

  let dirty = false;
  const removedIds = new Set();
  const idRemap = {};

  // One-time cleanup: a "Penis Lord" role was added via the now-removed
  // Add Role feature. Strip it wherever it turns up, so it doesn't linger
  // in anyone's saved data.
  const cleaned = roles.filter((r) => r.name.trim().toLowerCase() !== 'penis lord');
  if (cleaned.length !== roles.length) {
    roles.forEach((r) => { if (!cleaned.includes(r)) removedIds.add(r.id); });
    roles = cleaned;
    dirty = true;
  }

  // One-time rename, matched by NAME (case-insensitive) rather than id --
  // this prototype's seeded role list has changed shape more than once
  // (ids included), so matching on the old id alone only caught the most
  // recent revision and missed browsers still holding an earlier one.
  // This covers every name this feature has ever shipped with, mapped to
  // the current six: Store Owner, General Manager, Floor Staff, Repair
  // Tech, Community Manager, Member.
  const NAME_TO_CANONICAL_INDEX = {
    'owner': 0, 'store owner': 0,
    'store manager': 1, 'general manager': 1,
    'floor staff': 2,
    'technician': 3, 'lead technician': 3, 'repair tech': 3,
    'community vip': 4, 'community manager': 4,
    'member': 5,
  };
  roles = roles.map((r) => {
    const idx = NAME_TO_CANONICAL_INDEX[r.name.trim().toLowerCase()];
    if (idx === undefined) return r; // not a recognized historical name -- leave it alone
    const canonical = DEFAULT_ROLES[idx];
    if (r.id !== canonical.id || r.name !== canonical.name) {
      idRemap[r.id] = canonical.id;
      dirty = true;
      return { ...r, id: canonical.id, name: canonical.name };
    }
    return r;
  });

  // De-dupe in case renaming collapsed two old rows onto the same
  // canonical id (e.g. a list that already had a same-named entry).
  const seenIds = new Set();
  const deduped = roles.filter((r) => {
    if (seenIds.has(r.id)) { dirty = true; return false; }
    seenIds.add(r.id);
    return true;
  });
  roles = deduped;

  // Make sure all six canonical roles exist -- older saved lists may
  // predate ones that didn't exist yet when they were first seeded
  // (e.g. "Member" wasn't part of the very first Roles rollout).
  DEFAULT_ROLES.forEach((canonical) => {
    if (!roles.some((r) => r.id === canonical.id)) {
      roles.push({ ...canonical });
      dirty = true;
    }
  });

  if (dirty) {
    saveStaffRoles(roles);
    const assignments = loadStaffAssignments();
    let assignmentsChanged = false;
    Object.keys(assignments).forEach((staffId) => {
      const roleId = assignments[staffId];
      if (removedIds.has(roleId)) { delete assignments[staffId]; assignmentsChanged = true; }
      else if (idRemap[roleId]) { assignments[staffId] = idRemap[roleId]; assignmentsChanged = true; }
    });
    if (assignmentsChanged) saveStaffAssignments(assignments);
  }

  return roles;
}

function saveStaffRoles(list) {
  try { localStorage.setItem(STAFF_ROLES_KEY, JSON.stringify(list)); } catch (e) {}
}

function loadStaffAssignments() {
  try {
    const raw = localStorage.getItem(STAFF_ASSIGNMENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { ...DEFAULT_ASSIGNMENTS };
}

function saveStaffAssignments(map) {
  try { localStorage.setItem(STAFF_ASSIGNMENTS_KEY, JSON.stringify(map)); } catch (e) {}
}

// Access Levels overrides -- keyed by permission label, each value is
// the full list of role ids currently granted that permission. Only
// permissions someone has actually edited get an entry here; anything
// missing just falls back to its ACCESS_PERMISSIONS default.
function loadAccessOverrides() {
  try {
    const raw = localStorage.getItem(ACCESS_OVERRIDES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

function saveAccessOverrides(map) {
  try { localStorage.setItem(ACCESS_OVERRIDES_KEY, JSON.stringify(map)); } catch (e) {}
}

function staffStatusLabel(status) {
  return { active: 'Active', pending: 'Pending', inactive: 'Inactive' }[status] || status;
}

/* ---------------------------------------------------------------------
   Directory — sortable, paginated staff table + the Add/Edit Staff
   modal. All state (sort, page, the staff list itself) lives in this
   closure and re-renders the table/pagination on every change.
   --------------------------------------------------------------------- */
function initStaffDirectory() {
  const table = document.getElementById('staffTable');
  if (!table) return;

  const tbody = document.getElementById('staffTableBody');
  const pagination = document.getElementById('staffPagination');
  const pageSize = 5;
  const state = { sortKey: 'name', sortDir: 'asc', page: 1 };

  let staff = loadStaffList();

  function staffById(id) { return staff.find((s) => s.staffId === id); }

  function managerName(managerId) {
    const m = staffById(managerId);
    return m ? m.name : '—';
  }

  function chipsHtml(values) {
    if (!values || !values.length) return '<span style="color:var(--text-faint)">—</span>';
    return '<div class="chip-row">' + values.map((v) => '<span class="chip">' + staffEscapeHtml(v) + '</span>').join('') + '</div>';
  }

  function sortedStaff() {
    const key = state.sortKey;
    const dir = state.sortDir === 'asc' ? 1 : -1;
    return [...staff].sort((a, b) => {
      let av = a[key], bv = b[key];
      av = String(av).toLowerCase();
      bv = String(bv).toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }

  function render() {
    const sorted = sortedStaff();
    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    state.page = Math.min(Math.max(1, state.page), totalPages);
    const start = (state.page - 1) * pageSize;
    const pageRows = sorted.slice(start, start + pageSize);

    tbody.innerHTML = pageRows.map((s) => `
      <tr>
        <td>${staffEscapeHtml(s.staffId)}</td>
        <td style="font-weight:500">${staffEscapeHtml(s.name)}</td>
        <td>${staffEscapeHtml(s.jobTitle)}</td>
        <td><span class="status-pill status-${s.status}">${staffStatusLabel(s.status)}</span></td>
        <td>${staffEscapeHtml(s.startDate || '—')}</td>
        <td>${staffEscapeHtml(managerName(s.managerId))}</td>
        <td>${chipsHtml(s.locations)}</td>
        <td>${chipsHtml(s.specialties)}</td>
        <td class="col-actions">
          <div class="row-actions">
            <button type="button" class="btn-icon js-edit-staff" data-id="${staffEscapeHtml(s.staffId)}" aria-label="Edit ${staffEscapeHtml(s.name)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button type="button" class="btn-icon danger js-delete-staff" data-id="${staffEscapeHtml(s.staffId)}" aria-label="Delete ${staffEscapeHtml(s.name)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    if (!pageRows.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-faint);padding:28px 20px">No staff yet — add your first team member.</td></tr>';
    }

    table.querySelectorAll('.sort-btn').forEach((btn) => {
      btn.classList.remove('sort-asc', 'sort-desc');
      if (btn.dataset.sort === state.sortKey) btn.classList.add(state.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
    });

    const rangeStart = sorted.length ? start + 1 : 0;
    const rangeEnd = Math.min(start + pageSize, sorted.length);
    let pagesHtml = '';
    for (let p = 1; p <= totalPages; p++) {
      pagesHtml += `<button type="button" class="page-btn js-staff-page ${p === state.page ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }
    pagination.innerHTML = `
      <div class="pagination-info">${rangeStart}–${rangeEnd} of ${sorted.length} staff</div>
      <div class="pagination-pages">
        <button type="button" class="page-btn js-staff-page" data-page="${state.page - 1}" ${state.page <= 1 ? 'disabled' : ''}>‹</button>
        ${pagesHtml}
        <button type="button" class="page-btn js-staff-page" data-page="${state.page + 1}" ${state.page >= totalPages ? 'disabled' : ''}>›</button>
      </div>
    `;
  }

  // ---- Sort ----
  table.querySelectorAll('.sort-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.sort;
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortKey = key;
        state.sortDir = 'asc';
      }
      render();
    });
  });

  // ---- Pagination ----
  pagination.addEventListener('click', (e) => {
    const btn = e.target.closest('.js-staff-page');
    if (!btn || btn.disabled) return;
    state.page = parseInt(btn.dataset.page, 10);
    render();
  });

  // ---- Export to CSV ----
  // Exports the full roster (every staff member, not just the current
  // page), in whatever sort order the table is currently showing.
  function csvField(value) {
    const str = value === undefined || value === null ? '' : String(value);
    if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
    return str;
  }

  const exportBtn = document.getElementById('exportStaffBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const columns = ['Staff ID', 'Full Name', 'Job Title', 'Status', 'Start Date', 'Manager', 'Work Locations', 'Specialties'];
      const rows = sortedStaff().map((s) => [
        s.staffId,
        s.name,
        s.jobTitle,
        staffStatusLabel(s.status),
        s.startDate || '',
        managerName(s.managerId),
        (s.locations || []).join('; '),
        (s.specialties || []).join('; '),
      ]);

      const csv = [columns, ...rows].map((row) => row.map(csvField).join(',')).join('\r\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `staff-directory-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  // ---- Row actions (edit / delete) ----
  tbody.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.js-edit-staff');
    const deleteBtn = e.target.closest('.js-delete-staff');
    if (editBtn) openStaffModal(editBtn.dataset.id);
    if (deleteBtn) {
      const person = staffById(deleteBtn.dataset.id);
      if (!person) return;
      if (!confirm(`Remove ${person.name} from the staff directory?`)) return;
      staff = staff.filter((s) => s.staffId !== person.staffId);
      saveStaffList(staff);

      // Clean up any role assignment that pointed at the person just removed.
      const assignments = loadStaffAssignments();
      if (assignments[person.staffId]) {
        delete assignments[person.staffId];
        saveStaffAssignments(assignments);
      }

      render();
      renderStaffRolesUI();
    }
  });

  // ---- Add / Edit modal ----
  const overlay = document.getElementById('staffModalOverlay');
  const form = document.getElementById('staffForm');
  const title = document.getElementById('staffModalTitle');
  const formError = document.getElementById('staffFormError');
  const idInput = document.getElementById('staffIdInput');
  const nameInput = document.getElementById('staffNameInput');
  const titleInput = document.getElementById('staffTitleInput');
  const statusInput = document.getElementById('staffStatusInput');
  const startInput = document.getElementById('staffStartInput');
  const managerInput = document.getElementById('staffManagerInput');
  const locationsGroup = document.getElementById('staffLocationsGroup');
  const specialtiesGroup = document.getElementById('staffSpecialtiesGroup');

  // "No Manager" is a legitimate, deliberate choice (e.g. an Owner at
  // the top of the org chart) -- it gets its own sentinel value so it
  // reads as a real answer, distinct from the disabled placeholder
  // that means "hasn't picked one yet."
  const NO_MANAGER = 'none';

  function nextStaffId() {
    let n = staff.length + 1;
    let id;
    do { id = 'STF-' + String(n).padStart(3, '0'); n++; } while (staffById(id));
    return id;
  }

  function renderCheckboxGroup(container, options, name) {
    container.innerHTML = options.map((opt, i) => `
      <label class="checkbox-pill">
        <input type="checkbox" name="${name}" value="${staffEscapeHtml(opt)}" id="${name}_${i}">
        ${staffEscapeHtml(opt)}
      </label>
    `).join('');
    container.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener('change', () => cb.closest('.checkbox-pill').classList.toggle('checked', cb.checked));
    });
  }

  function checkedValues(container) {
    return Array.from(container.querySelectorAll('input:checked')).map((cb) => cb.value);
  }

  function setCheckedValues(container, values) {
    const set = new Set(values || []);
    container.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.checked = set.has(cb.value);
      cb.closest('.checkbox-pill').classList.toggle('checked', cb.checked);
    });
  }

  function selectAllCheckboxes(container) {
    container.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.checked = true;
      cb.closest('.checkbox-pill').classList.add('checked');
    });
  }

  document.querySelectorAll('.js-select-all').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (target) selectAllCheckboxes(target);
    });
  });

  function hideFormError() { formError.classList.remove('show'); formError.textContent = ''; }

  function showFormError(missing) {
    formError.textContent = `Please fill out: ${missing.join(', ')} before saving.`;
    formError.classList.add('show');
  }

  function openStaffModal(editId) {
    form.reset();
    hideFormError();
    renderCheckboxGroup(locationsGroup, STAFF_LOCATIONS, 'staffLocation');
    renderCheckboxGroup(specialtiesGroup, STAFF_SPECIALTIES, 'staffSpecialty');

    // Manager dropdown always reflects current staff, minus whoever is
    // being edited (so nobody can be made their own manager). The
    // placeholder is disabled so it can only ever be the value when
    // nobody has made a choice yet -- picking "No Manager" explicitly
    // stores the NO_MANAGER sentinel instead.
    managerInput.innerHTML = '<option value="" disabled>Select a manager…</option>' +
      `<option value="${NO_MANAGER}">— No Manager (top of the org chart) —</option>` +
      staff.filter((s) => s.staffId !== editId).map((s) => `<option value="${staffEscapeHtml(s.staffId)}">${staffEscapeHtml(s.name)} — ${staffEscapeHtml(s.jobTitle)}</option>`).join('');

    const editing = editId ? staffById(editId) : null;
    form.dataset.editId = editing ? editing.staffId : '';
    title.textContent = editing ? `Edit ${editing.name}` : 'Add New Staff';

    if (editing) {
      idInput.value = editing.staffId;
      idInput.readOnly = true;
      nameInput.value = editing.name;
      titleInput.value = editing.jobTitle;
      statusInput.value = editing.status;
      startInput.value = editing.startDate || '';
      managerInput.value = editing.managerId || NO_MANAGER;
      setCheckedValues(locationsGroup, editing.locations);
      setCheckedValues(specialtiesGroup, editing.specialties);
    } else {
      idInput.value = nextStaffId();
      idInput.readOnly = false;
      statusInput.value = 'active';
      managerInput.value = '';
    }

    overlay.classList.add('open');
    nameInput.focus();
  }

  function closeStaffModal() { overlay.classList.remove('open'); }

  document.getElementById('addStaffBtn').addEventListener('click', () => openStaffModal(null));
  document.getElementById('staffModalClose').addEventListener('click', closeStaffModal);
  document.getElementById('staffModalCancel').addEventListener('click', closeStaffModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeStaffModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('open')) closeStaffModal(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = form.dataset.editId;

    const record = {
      staffId: idInput.value.trim(),
      name: nameInput.value.trim(),
      jobTitle: titleInput.value.trim(),
      status: statusInput.value,
      startDate: startInput.value,
      managerId: managerInput.value === NO_MANAGER ? '' : managerInput.value,
      locations: checkedValues(locationsGroup),
      specialties: checkedValues(specialtiesGroup),
    };

    const missing = [];
    if (!record.staffId) missing.push('Staff ID');
    if (!record.name) missing.push('Full Name');
    if (!record.jobTitle) missing.push('Job Title');
    if (!record.status) missing.push('Status');
    if (!record.startDate) missing.push('Start Date');
    if (!managerInput.value) missing.push('Manager');
    if (!record.locations.length) missing.push('Work Locations');
    if (!record.specialties.length) missing.push('Specialties');
    if (missing.length) { showFormError(missing); return; }

    if (editId) {
      staff = staff.map((s) => (s.staffId === editId ? record : s));
    } else {
      if (staffById(record.staffId)) {
        formError.textContent = 'That Staff ID is already in use — pick a different one.';
        formError.classList.add('show');
        return;
      }
      staff.push(record);
    }
    saveStaffList(staff);
    closeStaffModal();
    render();
    renderStaffRolesUI();
  });

  render();

  // Exposed so the Roles panel can look up names/list staff without
  // re-reading localStorage on every render.
  window.getStaffList = () => staff;
}

/* ---------------------------------------------------------------------
   Roles — role list with per-role assignment. A staff member can hold
   exactly one role; attempting a second one surfaces an inline error
   instead of silently double-assigning them. (The Access Levels chart
   that used to live under this moved to Settings -- see
   initAccessLevels below.)
   --------------------------------------------------------------------- */
function initStaffRoles() {
  const rolesTable = document.getElementById('rolesTable');
  if (!rolesTable) return;

  let roles = loadStaffRoles();

  window.renderStaffRolesUI = renderAll;

  function currentStaff() {
    return typeof window.getStaffList === 'function' ? window.getStaffList() : loadStaffList();
  }

  function renderRolesTable() {
    const tbody = document.getElementById('rolesTableBody');
    const staff = currentStaff();
    const assignments = loadStaffAssignments();

    tbody.innerHTML = roles.map((role) => {
      const assigned = staff.filter((s) => assignments[s.staffId] === role.id);
      const assignedHtml = assigned.length
        ? '<div class="chip-row">' + assigned.map((s) => `
            <span class="chip-remove">${staffEscapeHtml(s.name)}<button type="button" class="js-unassign" data-staff="${staffEscapeHtml(s.staffId)}" aria-label="Remove ${staffEscapeHtml(s.name)} from ${staffEscapeHtml(role.name)}">✕</button></span>
          `).join('') + '</div>'
        : '<span style="color:var(--text-faint)">No one assigned yet</span>';

      const options = staff.map((s) => `<option value="${staffEscapeHtml(s.staffId)}">${staffEscapeHtml(s.name)}</option>`).join('');

      // The select always resets to this "Add New" placeholder rather
      // than defaulting to (and looking like it's already chosen) the
      // first staff member -- it's a prompt, not a real option, so
      // it's disabled and can't itself be submitted.
      return `
        <tr>
          <td style="font-weight:500;white-space:nowrap">${staffEscapeHtml(role.name)}</td>
          <td>${assignedHtml}</td>
          <td class="assign-cell">
            <div class="assign-row">
              <select class="js-assign-select" ${staff.length ? '' : 'disabled'}>
                <option value="" selected disabled>Add New</option>
                ${options}
              </select>
              <button type="button" class="btn-secondary js-assign-btn" data-role="${staffEscapeHtml(role.id)}" ${staff.length ? '' : 'disabled'}>Add</button>
            </div>
            <div class="assign-error" data-role-error="${staffEscapeHtml(role.id)}"></div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderAll() {
    renderRolesTable();
  }

  function showAssignError(roleId, message) {
    const el = rolesTable.querySelector(`.assign-error[data-role-error="${roleId}"]`);
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => el.classList.remove('show'), 4000);
  }

  // ---- Assign / unassign (event delegation — rows are re-rendered often) ----
  rolesTable.addEventListener('click', (e) => {
    const assignBtn = e.target.closest('.js-assign-btn');
    const unassignBtn = e.target.closest('.js-unassign');

    if (assignBtn) {
      const roleId = assignBtn.dataset.role;
      const select = assignBtn.closest('.assign-row').querySelector('.js-assign-select');
      const staffId = select ? select.value : '';
      if (!staffId) return;

      const staff = currentStaff();
      const person = staff.find((s) => s.staffId === staffId);
      if (!person) return;

      const assignments = loadStaffAssignments();
      const existingRoleId = assignments[staffId];

      if (existingRoleId && existingRoleId !== roleId) {
        const existingRole = roles.find((r) => r.id === existingRoleId);
        showAssignError(roleId, `${person.name} is already assigned to ${existingRole ? existingRole.name : 'another role'} — remove them there first.`);
        return;
      }
      if (existingRoleId === roleId) {
        showAssignError(roleId, `${person.name} is already assigned to this role.`);
        return;
      }

      assignments[staffId] = roleId;
      saveStaffAssignments(assignments);
      renderAll();
    }

    if (unassignBtn) {
      const assignments = loadStaffAssignments();
      delete assignments[unassignBtn.dataset.staff];
      saveStaffAssignments(assignments);
      renderAll();
    }
  });

  // Add Role UI was removed for now (roles are fixed to the seeded/
  // cleaned-up list) -- see loadStaffRoles for the one-time cleanup that
  // strips out roles added while it existed. Will come back later.

  renderAll();
}

/* =======================================================================
   Cabinets (2-cabinets.html) — a Directory of the arcade's cabinet
   fleet: sortable, paginated table + the Add/Edit Cabinet modal. Same
   shape as the Staff Directory above (localStorage-backed, prototype
   only). No Location field on purpose -- the sidebar's arcade switcher
   already scopes "which arcade" you're looking at, so a per-row
   location would just repeat that.
   ======================================================================= */

const CABINETS_KEY = 'gesenCabinets';

// Deliberately the same list as STAFF_SPECIALTIES, not a separate one --
// keeping cabinet category and staff specialty in the same vocabulary is
// what lets a technician's specialty auto-match to the right cabinets
// once Work Orders can assign against this.
const CABINET_CATEGORIES = STAFF_SPECIALTIES;

const CABINET_STATUSES = [
  { id: 'active', label: 'Active' },
  { id: 'repair', label: 'Under Repair' },
  { id: 'out-of-service', label: 'Out of Service' },
  { id: 'retired', label: 'Retired' },
];

const DEFAULT_CABINETS = [
  { cabinetId: 'CAB-001', name: 'DDR A20 PLUS', category: 'Rhythm Games', status: 'active', purchaseDate: '2023-05-12', value: 8500, vendor: 'Konami Amusement', serial: 'DDR-A20-88213', lastServiced: '2026-06-01', notes: '', image: '' },
  { cabinetId: 'CAB-002', name: 'Big Bass Wheel', category: 'Prizes', status: 'active', purchaseDate: '2022-11-03', value: 4200, vendor: 'ICE Games', serial: 'BBW-22-4471', lastServiced: '2026-04-15', notes: 'Popular with kids under 10.', image: '' },
  { cabinetId: 'CAB-003', name: 'Sweet Grab Crane', category: 'Crane Games', status: 'repair', purchaseDate: '2021-08-19', value: 2600, vendor: 'Elaut USA', serial: 'SGC-21-9903', lastServiced: '2026-08-10', notes: 'Claw grip loosening — parts ordered.', image: '' },
  { cabinetId: 'CAB-004', name: 'Candy Cab Deluxe', category: 'Candy Cabs', status: 'active', purchaseDate: '2024-01-22', value: 3100, vendor: '', serial: '', lastServiced: '', notes: '', image: '' },
  { cabinetId: 'CAB-005', name: 'Gachapon Tower', category: 'Gachapon', status: 'active', purchaseDate: '2023-09-30', value: 1800, vendor: 'Bandai Namco', serial: 'GT-23-1150', lastServiced: '', notes: '', image: '' },
  { cabinetId: 'CAB-006', name: 'Skee-Ball Classic', category: 'Other', status: 'out-of-service', purchaseDate: '2019-03-14', value: 2200, vendor: '', serial: 'SK-19-330', lastServiced: '2026-02-20', notes: 'Motor burned out, awaiting replacement part.', image: '' },
  { cabinetId: 'CAB-007', name: 'Pac-Man Cabinet (Original)', category: 'Other', status: 'retired', purchaseDate: '2015-06-01', value: 1500, vendor: '', serial: '', lastServiced: '', notes: 'Decommissioned, kept for parts.', image: '' },
];

function cabinetStatusLabel(status) {
  const match = CABINET_STATUSES.find((s) => s.id === status);
  return match ? match.label : status;
}

function loadCabinets() {
  try {
    const raw = localStorage.getItem(CABINETS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_CABINETS.map((c) => ({ ...c }));
}

function saveCabinets(list) {
  try { localStorage.setItem(CABINETS_KEY, JSON.stringify(list)); } catch (e) {}
}

function initCabinetsDirectory() {
  const table = document.getElementById('cabinetsTable');
  if (!table) return;

  const tbody = document.getElementById('cabinetsTableBody');
  const pagination = document.getElementById('cabinetsPagination');
  const pageSize = 5;
  const state = { sortKey: 'name', sortDir: 'asc', page: 1 };

  let cabinets = loadCabinets();

  function cabinetById(id) { return cabinets.find((c) => c.cabinetId === id); }

  function sortedCabinets() {
    const key = state.sortKey;
    const dir = state.sortDir === 'asc' ? 1 : -1;
    return [...cabinets].sort((a, b) => {
      let av = a[key], bv = b[key];
      if (key === 'value') {
        av = Number(av) || 0;
        bv = Number(bv) || 0;
        return (av - bv) * dir;
      }
      av = String(av).toLowerCase();
      bv = String(bv).toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }

  function formatValue(value) {
    const n = Number(value);
    return isNaN(n) ? '—' : '$' + n.toLocaleString('en-US');
  }

  function thumbHtml(cabinet) {
    const placeholder = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h2"/></svg>';
    return `<span class="cabinet-thumb" aria-hidden="true">${cabinet.image ? `<img src="${cabinet.image}" alt="">` : placeholder}</span>`;
  }

  function render() {
    const sorted = sortedCabinets();
    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    state.page = Math.min(Math.max(1, state.page), totalPages);
    const start = (state.page - 1) * pageSize;
    const pageRows = sorted.slice(start, start + pageSize);

    tbody.innerHTML = pageRows.map((c) => `
      <tr>
        <td>${thumbHtml(c)}</td>
        <td>${staffEscapeHtml(c.cabinetId)}</td>
        <td style="font-weight:500">${staffEscapeHtml(c.name)}</td>
        <td>${staffEscapeHtml(c.category)}</td>
        <td><span class="status-pill status-${c.status}">${staffEscapeHtml(cabinetStatusLabel(c.status))}</span></td>
        <td>${staffEscapeHtml(c.purchaseDate || '—')}</td>
        <td>${formatValue(c.value)}</td>
        <td class="col-actions">
          <div class="row-actions">
            <button type="button" class="btn-icon js-edit-cabinet" data-id="${staffEscapeHtml(c.cabinetId)}" aria-label="Edit ${staffEscapeHtml(c.name)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button type="button" class="btn-icon danger js-delete-cabinet" data-id="${staffEscapeHtml(c.cabinetId)}" aria-label="Delete ${staffEscapeHtml(c.name)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    if (!pageRows.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-faint);padding:28px 20px">No cabinets yet — add your first machine.</td></tr>';
    }

    table.querySelectorAll('.sort-btn').forEach((btn) => {
      btn.classList.remove('sort-asc', 'sort-desc');
      if (btn.dataset.sort === state.sortKey) btn.classList.add(state.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
    });

    const rangeStart = sorted.length ? start + 1 : 0;
    const rangeEnd = Math.min(start + pageSize, sorted.length);
    let pagesHtml = '';
    for (let p = 1; p <= totalPages; p++) {
      pagesHtml += `<button type="button" class="page-btn js-cabinet-page ${p === state.page ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }
    pagination.innerHTML = `
      <div class="pagination-info">${rangeStart}–${rangeEnd} of ${sorted.length} cabinets</div>
      <div class="pagination-pages">
        <button type="button" class="page-btn js-cabinet-page" data-page="${state.page - 1}" ${state.page <= 1 ? 'disabled' : ''}>‹</button>
        ${pagesHtml}
        <button type="button" class="page-btn js-cabinet-page" data-page="${state.page + 1}" ${state.page >= totalPages ? 'disabled' : ''}>›</button>
      </div>
    `;
  }

  // ---- Sort ----
  table.querySelectorAll('.sort-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.sort;
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortKey = key;
        state.sortDir = 'asc';
      }
      render();
    });
  });

  // ---- Pagination ----
  pagination.addEventListener('click', (e) => {
    const btn = e.target.closest('.js-cabinet-page');
    if (!btn || btn.disabled) return;
    state.page = parseInt(btn.dataset.page, 10);
    render();
  });

  // ---- Row actions (edit / delete) ----
  tbody.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.js-edit-cabinet');
    const deleteBtn = e.target.closest('.js-delete-cabinet');
    if (editBtn) openCabinetModal(editBtn.dataset.id);
    if (deleteBtn) {
      const cabinet = cabinetById(deleteBtn.dataset.id);
      if (!cabinet) return;
      if (!confirm(`Remove ${cabinet.name} from the cabinet fleet?`)) return;
      cabinets = cabinets.filter((c) => c.cabinetId !== cabinet.cabinetId);
      saveCabinets(cabinets);
      render();
    }
  });

  // ---- Add / Edit modal ----
  const overlay = document.getElementById('cabinetModalOverlay');
  const form = document.getElementById('cabinetForm');
  const title = document.getElementById('cabinetModalTitle');
  const formError = document.getElementById('cabinetFormError');
  const idInput = document.getElementById('cabinetIdInput');
  const nameInput = document.getElementById('cabinetNameInput');
  const categoryInput = document.getElementById('cabinetCategoryInput');
  const statusInput = document.getElementById('cabinetStatusInput');
  const purchaseDateInput = document.getElementById('cabinetPurchaseDateInput');
  const valueInput = document.getElementById('cabinetValueInput');
  const vendorInput = document.getElementById('cabinetVendorInput');
  const serialInput = document.getElementById('cabinetSerialInput');
  const lastServicedInput = document.getElementById('cabinetLastServicedInput');
  const notesInput = document.getElementById('cabinetNotesInput');

  categoryInput.innerHTML = '<option value="" disabled>Select a category…</option>' +
    CABINET_CATEGORIES.map((cat) => `<option value="${staffEscapeHtml(cat)}">${staffEscapeHtml(cat)}</option>`).join('');
  statusInput.innerHTML = CABINET_STATUSES.map((s) => `<option value="${s.id}">${staffEscapeHtml(s.label)}</option>`).join('');

  function nextCabinetId() {
    let n = cabinets.length + 1;
    let id;
    do { id = 'CAB-' + String(n).padStart(3, '0'); n++; } while (cabinetById(id));
    return id;
  }

  // ---- Image upload ----
  const imageInput = document.getElementById('cabinetImage');
  const imagePreview = document.getElementById('cabinetImagePreview');
  const removeImageBtn = document.getElementById('removeCabinetImageBtn');
  const cabinetThumbPlaceholder = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h2"/></svg>';
  let pendingImage = '';

  function renderImagePreview() {
    imagePreview.innerHTML = pendingImage ? `<img src="${pendingImage}" alt="">` : cabinetThumbPlaceholder;
    removeImageBtn.style.display = pendingImage ? '' : 'none';
  }

  imageInput.addEventListener('change', () => {
    const file = imageInput.files && imageInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      pendingImage = reader.result;
      renderImagePreview();
    };
    reader.readAsDataURL(file);
  });

  removeImageBtn.addEventListener('click', () => {
    pendingImage = '';
    imageInput.value = '';
    renderImagePreview();
  });

  function hideFormError() { formError.classList.remove('show'); formError.textContent = ''; }

  function showFormError(missing) {
    formError.textContent = `Please fill out: ${missing.join(', ')} before saving.`;
    formError.classList.add('show');
  }

  function openCabinetModal(editId) {
    form.reset();
    hideFormError();

    const editing = editId ? cabinetById(editId) : null;
    form.dataset.editId = editing ? editing.cabinetId : '';
    title.textContent = editing ? `Edit ${editing.name}` : 'Add New Cabinet';

    if (editing) {
      idInput.value = editing.cabinetId;
      idInput.readOnly = true;
      nameInput.value = editing.name;
      categoryInput.value = editing.category;
      statusInput.value = editing.status;
      purchaseDateInput.value = editing.purchaseDate || '';
      valueInput.value = editing.value != null ? editing.value : '';
      vendorInput.value = editing.vendor || '';
      serialInput.value = editing.serial || '';
      lastServicedInput.value = editing.lastServiced || '';
      notesInput.value = editing.notes || '';
      pendingImage = editing.image || '';
    } else {
      idInput.value = nextCabinetId();
      idInput.readOnly = false;
      categoryInput.value = '';
      statusInput.value = 'active';
      pendingImage = '';
    }
    renderImagePreview();

    overlay.classList.add('open');
    nameInput.focus();
  }

  function closeCabinetModal() { overlay.classList.remove('open'); }

  document.getElementById('addCabinetBtn').addEventListener('click', () => openCabinetModal(null));
  document.getElementById('cabinetModalClose').addEventListener('click', closeCabinetModal);
  document.getElementById('cabinetModalCancel').addEventListener('click', closeCabinetModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCabinetModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('open')) closeCabinetModal(); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = form.dataset.editId;

    const record = {
      cabinetId: idInput.value.trim(),
      name: nameInput.value.trim(),
      category: categoryInput.value,
      status: statusInput.value,
      purchaseDate: purchaseDateInput.value,
      value: valueInput.value === '' ? null : Number(valueInput.value),
      vendor: vendorInput.value.trim(),
      serial: serialInput.value.trim(),
      lastServiced: lastServicedInput.value,
      notes: notesInput.value.trim(),
      image: pendingImage,
    };

    const missing = [];
    if (!record.cabinetId) missing.push('Cabinet ID');
    if (!record.name) missing.push('Name');
    if (!record.category) missing.push('Category');
    if (!record.status) missing.push('Status');
    if (!record.purchaseDate) missing.push('Purchase Date');
    if (record.value === null || isNaN(record.value)) missing.push('Value');
    if (missing.length) { showFormError(missing); return; }

    if (editId) {
      cabinets = cabinets.map((c) => (c.cabinetId === editId ? record : c));
    } else {
      if (cabinetById(record.cabinetId)) {
        formError.textContent = 'That Cabinet ID is already in use — pick a different one.';
        formError.classList.add('show');
        return;
      }
      cabinets.push(record);
    }
    saveCabinets(cabinets);
    closeCabinetModal();
    render();
  });

  render();
}

/* ---------------------------------------------------------------------
   Access Levels (0-settings.html) — permissions run down the rows,
   the fixed ACCESS_ROLE_COLUMNS run across the columns, grouped into
   Admin / Operations / Community (same as the sidebar) with a label
   row at each group change. Green check = granted, grey dash =
   revoked.

   Read-only by default; Edit turns every cell into a toggle button.
   Changes are held in a draft copy until Save, which persists them as
   overrides layered on top of the ACCESS_PERMISSIONS defaults (so an
   unedited permission still reflects future default changes). There's
   no real per-user permission check yet -- like the rest of this
   prototype, the Edit button is just available to whoever has the
   page open.
   --------------------------------------------------------------------- */
function initAccessLevels() {
  const head = document.getElementById('accessMatrixHead');
  const body = document.getElementById('accessMatrixBody');
  const editBtn = document.getElementById('accessEditBtn');
  const cancelBtn = document.getElementById('accessCancelBtn');
  const saveStatus = document.getElementById('accessSaveStatus');
  const hint = document.getElementById('accessHint');
  if (!head || !body) return;

  let overrides = loadAccessOverrides();
  let draft = null;
  let editing = false;

  function allowedFor(perm) {
    const source = editing ? draft : overrides;
    return source[perm.label] || perm.allowed;
  }

  function cloneAllowedMap() {
    const map = {};
    ACCESS_PERMISSIONS.forEach((perm) => { map[perm.label] = (overrides[perm.label] || perm.allowed).slice(); });
    return map;
  }

  function render() {
    head.innerHTML = '<tr><th></th>' + ACCESS_ROLE_COLUMNS.map((role) => `<th>${staffEscapeHtml(role.name)}</th>`).join('') + '</tr>';

    let lastGroup = null;
    body.innerHTML = ACCESS_PERMISSIONS.map((perm) => {
      let groupRow = '';
      if (perm.group !== lastGroup) {
        lastGroup = perm.group;
        groupRow = `<tr class="access-group-row"><td colspan="${ACCESS_ROLE_COLUMNS.length + 1}">${staffEscapeHtml(perm.group)}</td></tr>`;
      }

      const allowedList = allowedFor(perm);
      const cells = ACCESS_ROLE_COLUMNS.map((role) => {
        const allowed = allowedList.includes(role.id);
        const cls = allowed ? 'allowed' : 'revoked';
        const label = `${role.name} — ${perm.label}: ${allowed ? 'Allowed' : 'Revoked'}`;
        return editing
          ? `<td><button type="button" class="access-mark-btn ${cls}" data-perm="${staffEscapeHtml(perm.label)}" data-role="${staffEscapeHtml(role.id)}" aria-pressed="${allowed}" aria-label="${staffEscapeHtml(label)}">${allowed ? '✓' : '–'}</button></td>`
          : `<td><span class="access-mark ${cls}" title="${allowed ? 'Allowed' : 'Revoked'}">${allowed ? '✓' : '–'}</span></td>`;
      }).join('');

      return groupRow + `<tr><td class="access-perm-label">${staffEscapeHtml(perm.label)}</td>${cells}</tr>`;
    }).join('');
  }

  function setEditing(next) {
    editing = next;
    if (editBtn) {
      editBtn.innerHTML = editing
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:13px;height:13px;margin-right:6px;vertical-align:-2px"><path d="M5 13l4 4L19 7"/></svg>Save'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;margin-right:6px;vertical-align:-2px"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>Edit';
      editBtn.classList.toggle('btn-save', editing);
      editBtn.classList.toggle('btn-secondary', !editing);
    }
    if (cancelBtn) cancelBtn.style.display = editing ? '' : 'none';
    if (hint) {
      hint.textContent = editing
        ? 'Click a cell to toggle that role’s access. Click Save when you’re done, or Cancel to discard.'
        : 'Reference chart for what each role can access across the app. Custom roles coming soon.';
    }
  }

  body.addEventListener('click', (e) => {
    const btn = e.target.closest('.access-mark-btn');
    if (!btn || !editing) return;
    const permLabel = btn.dataset.perm;
    const roleId = btn.dataset.role;
    const arr = draft[permLabel];
    const idx = arr.indexOf(roleId);
    if (idx === -1) arr.push(roleId); else arr.splice(idx, 1);
    render();
  });

  if (editBtn) {
    editBtn.addEventListener('click', () => {
      if (!editing) {
        draft = cloneAllowedMap();
        setEditing(true);
        render();
      } else {
        overrides = draft;
        draft = null;
        saveAccessOverrides(overrides);
        setEditing(false);
        render();
        if (saveStatus) {
          saveStatus.classList.add('show');
          clearTimeout(saveStatus._hideTimer);
          saveStatus._hideTimer = setTimeout(() => saveStatus.classList.remove('show'), 2400);
        }
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      draft = null;
      setEditing(false);
      render();
    });
  }

  render();
}
