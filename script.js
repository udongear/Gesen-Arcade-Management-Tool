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
  initLoginForm();
  applyArcadeBranding();
  applyFeatureVisibility();
  initFeatureToggles();
  initArcadeInfoForm();
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

    document.querySelectorAll('.location-pill').forEach((pill) => {
      const dot = pill.querySelector('.dot');
      if (!dot) return;

      dot.classList.remove('dot-warn', 'dot-brand', 'dot-bad');
      if (status === 'temporarily-closed') dot.classList.add('dot-warn');
      else if (status === 'coming-soon') dot.classList.add('dot-brand');
      else if (status === 'closed') dot.classList.add('dot-bad');

      if (name) {
        pill.textContent = '';
        pill.appendChild(dot);
        pill.appendChild(document.createTextNode(name));
      }
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
        badge.textContent = input.checked ? 'Available' : 'Disabled';
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
