/* =========================================================
   script.js
   Nine features, each in its own function:
     1. Theme toggle (light / dark, remembered between visits)
     2. Visitor name + time-of-day greeting (saved in the browser)
     3. Nav link highlighting as you scroll
     4. Project screenshot lightbox (click to view full size)
     5. Contact form with step-by-step validation
     6. Project list: filter by language + sort by name
     7. GitHub repositories fetched from the GitHub API
     8. Time-on-site counter
     9. Scroll-reveal animation
   ========================================================= */

'use strict';

/* ---------- Shared helpers ---------- */

const byId = (id) => document.getElementById(id);

// Storage can throw (private browsing, blocked cookies), so every read and
// write goes through this wrapper. If storage is unavailable the page still
// works; it just forgets things when it is closed.
function createStore(getBackend) {
  return {
    get(key) {
      try { return getBackend().getItem(key); } catch (e) { return null; }
    },
    set(key, value) {
      try { getBackend().setItem(key, value); } catch (e) { /* not remembered */ }
    },
    remove(key) {
      try { getBackend().removeItem(key); } catch (e) { /* nothing to remove */ }
    }
  };
}

const local = createStore(() => localStorage);     // survives closing the browser
const session = createStore(() => sessionStorage); // lasts for this tab only

// Builds an element and sets its text with textContent, so text that came
// from an outside source (the GitHub API) can never be treated as HTML.
function createEl(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

document.addEventListener('DOMContentLoaded', () => {
  setUpThemeToggle();
  setUpVisitor();
  highlightNavOnScroll();
  setUpLightbox();
  setUpContactForm();
  setUpProjectList();
  setUpGitHubRepos();
  setUpSessionTimer();
  setUpScrollReveal();
});

/* ---------- 1. Theme toggle ---------- */
function setUpThemeToggle() {
  const button = byId('theme-toggle');
  const label = byId('theme-toggle-label');
  if (!button || !label) return;

  const root = document.documentElement;

  // The inline script in index.html may already have applied a saved theme.
  // If it did not, fall back to whatever the operating system prefers.
  let current = root.getAttribute('data-theme');
  if (!current) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    current = prefersDark ? 'dark' : 'light';
    root.setAttribute('data-theme', current);
  }
  paint(current);

  button.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    paint(next);
    local.set('theme', next);
  });

  // The button label names the theme you would switch TO, not the current one.
  function paint(theme) {
    const isDark = theme === 'dark';
    label.textContent = isDark ? 'Light' : 'Dark';
    button.setAttribute('aria-pressed', String(isDark));
  }
}

/* ---------- 2. Visitor name and greeting ---------- */
const NAME_KEY = 'visitorName';
// A letter first, then letters, spaces, apostrophes or hyphens, 30 characters at most.
const NAME_PATTERN = /^\p{L}[\p{L} '’-]{0,29}$/u;

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function setUpVisitor() {
  const greeting = byId('greeting');
  const form = byId('visitor-form');
  const input = byId('visitor-name');
  const error = byId('visitor-error');
  const clearButton = byId('visitor-clear');
  if (!greeting || !form || !input || !error || !clearButton) return;

  // The name lives in a variable as well as in storage, so it still shows
  // for this visit if storage is blocked. A stored value that fails the
  // pattern (for example one edited by hand in dev tools) is ignored.
  const saved = local.get(NAME_KEY);
  let visitorName = saved && NAME_PATTERN.test(saved) ? saved : '';
  paint();

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = input.value.trim().replace(/\s+/g, ' ');
    if (!NAME_PATTERN.test(name)) {
      error.textContent = 'Use letters only, up to 30 characters.';
      input.focus();
      return;
    }

    error.textContent = '';
    visitorName = name;
    local.set(NAME_KEY, name);
    form.reset();
    paint();
  });

  clearButton.addEventListener('click', () => {
    visitorName = '';
    local.remove(NAME_KEY);
    paint();
    input.focus();
  });

  // One function decides what the hero shows for each of the two states.
  function paint() {
    const hasName = visitorName !== '';
    greeting.textContent =
      timeOfDayGreeting() + (hasName ? ', ' + visitorName : '') + ' — welcome to my portfolio.';
    form.hidden = hasName;
    clearButton.hidden = !hasName;
  }
}

/* ---------- 3. Nav highlighting ---------- */
function highlightNavOnScroll() {
  const links = document.querySelectorAll('.nav__list a');
  if (!links.length || !('IntersectionObserver' in window)) return;

  // Map each section id to its nav link so lookups are cheap while scrolling.
  const linkFor = {};
  const sections = [];

  links.forEach((link) => {
    const id = link.getAttribute('href').slice(1);
    const section = byId(id);
    if (!section) return;
    linkFor[id] = link;
    sections.push(section);
  });

  // rootMargin pushes the trigger line to the middle of the viewport, so a
  // section counts as "current" once it reaches the middle of the screen.
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => link.classList.remove('is-active'));
      const active = linkFor[entry.target.id];
      if (active) active.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -45% 0px' });

  sections.forEach((section) => observer.observe(section));
}

/* ---------- 4. Project screenshot lightbox ---------- */
function setUpLightbox() {
  const lightbox = byId('lightbox');
  const lightboxImage = byId('lightbox-image');
  const closeButton = lightbox ? lightbox.querySelector('.lightbox__close') : null;
  const thumbnails = document.querySelectorAll('.project__image');
  if (!lightbox || !lightboxImage || !closeButton || !thumbnails.length) return;

  let lastFocused = null;

  thumbnails.forEach((thumb) => {
    thumb.addEventListener('click', () => openImage(thumb.src, thumb.alt));
  });

  closeButton.addEventListener('click', closeImage);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeImage(); // Click on the backdrop closes it.
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !lightbox.hidden) closeImage();
  });

  function openImage(src, alt) {
    lastFocused = document.activeElement;
    lightboxImage.src = src;
    lightboxImage.alt = alt;
    lightbox.hidden = false;
    closeButton.focus();
    document.body.style.overflow = 'hidden'; // Stop the page scrolling behind it.
  }

  function closeImage() {
    lightbox.hidden = true;
    lightboxImage.src = '';
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus(); // Return focus to the thumbnail that was clicked.
  }
}

/* ---------- 5. Contact form ---------- */
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 500;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function setUpContactForm() {
  const form = byId('contact-form');
  if (!form) return;

  const status = byId('form-status');
  const counter = byId('message-count');
  const messageInput = byId('message');
  const fields = ['name', 'email', 'message'].map((id) => ({
    input: byId(id),
    error: byId(id + '-error')
  }));

  // Submitting runs three steps in order, and stops at the first one that fails:
  //   1. check every field and show every problem at once
  //   2. if anything is wrong, move the keyboard to the first problem
  //   3. only when all fields pass, accept the message and reset the form
  form.addEventListener('submit', (event) => {
    event.preventDefault(); // No backend: the page must not reload.

    let firstInvalid = null;
    status.textContent = '';

    fields.forEach((field) => {
      const problem = validate(field.input);
      field.error.textContent = problem;
      field.input.classList.toggle('is-invalid', Boolean(problem));
      if (problem && !firstInvalid) firstInvalid = field.input;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    form.reset();
    updateCounter(); // reset() does not fire an input event, so refresh by hand.
    status.textContent = 'Thanks — your message looks good. I will reply soon.';
  });

  // Clear a field's error as soon as the person fixes it.
  fields.forEach((field) => {
    field.input.addEventListener('input', () => {
      if (!field.error.textContent) return;
      if (!validate(field.input)) {
        field.error.textContent = '';
        field.input.classList.remove('is-invalid');
      }
    });
  });

  messageInput.addEventListener('input', updateCounter);

  function updateCounter() {
    counter.textContent = messageInput.value.length + ' / ' + MESSAGE_MAX;
  }

  // Returns an error message, or an empty string when the value is fine.
  function validate(input) {
    const value = input.value.trim();

    if (!value) {
      return 'Enter your ' + input.name + '.';
    }
    if (input.name === 'name' && (value.match(/\p{L}/gu) || []).length < 2) {
      return 'Enter your real name — at least 2 letters.';
    }
    if (input.type === 'email' && !EMAIL_PATTERN.test(value)) {
      return 'Enter an email address like name@example.com.';
    }
    if (input.name === 'message') {
      if (value.length < MESSAGE_MIN) {
        return 'Add a little more detail — at least ' + MESSAGE_MIN + ' characters.';
      }
      if (value.length > MESSAGE_MAX) {
        return 'Keep it under ' + MESSAGE_MAX + ' characters.';
      }
    }
    return '';
  }
}

/* ---------- 6. Project list: filter + sort ---------- */
function setUpProjectList() {
  const grid = document.querySelector('.projects');
  const buttons = document.querySelectorAll('.filter__btn');
  const sortSelect = byId('project-sort');
  const count = byId('projects-count');
  const cards = Array.from(document.querySelectorAll('.project'));
  if (!grid || !buttons.length || !sortSelect || !count || !cards.length) return;

  const FADE_MS = 250; // Must match the opacity transition on .project in the CSS.

  // Read each card's details once, so sorting never has to touch the DOM text again.
  const items = cards.map((card, index) => ({
    card,
    order: index,
    tag: card.dataset.tags,
    title: card.querySelector('.project__title').textContent
  }));

  const SORTS = {
    'featured':  (a, b) => a.order - b.order,
    'name-asc':  (a, b) => a.title.localeCompare(b.title),
    'name-desc': (a, b) => b.title.localeCompare(a.title)
  };

  // The whole state of this feature is these two values. Anything saved
  // from an earlier visit is checked against what the page really offers.
  const filters = Array.from(buttons, (button) => button.dataset.filter);
  const savedFilter = local.get('projectFilter');
  const savedSort = local.get('projectSort');
  const state = {
    filter: filters.includes(savedFilter) ? savedFilter : 'all',
    sort: Object.hasOwn(SORTS, savedSort) ? savedSort : 'featured'
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      state.filter = button.dataset.filter;
      local.set('projectFilter', state.filter);
      render();
    });
  });

  sortSelect.addEventListener('change', () => {
    state.sort = sortSelect.value;
    local.set('projectSort', state.sort);
    render();
  });

  render();

  // Order first, then visibility: sort the cards, then fade out the ones
  // that do not match the filter.
  function render() {
    buttons.forEach((button) => {
      const isActive = button.dataset.filter === state.filter;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
    sortSelect.value = state.sort;

    items.slice().sort(SORTS[state.sort]).forEach((item) => grid.appendChild(item.card));

    let matches = 0;
    items.forEach((item) => {
      const show = state.filter === 'all' || item.tag === state.filter;

      if (show) {
        matches++;
        item.card.hidden = false;
        // A frame has to pass before adding the class, or the browser
        // collapses "hidden → visible" into one step and the fade never plays.
        requestAnimationFrame(() => item.card.classList.add('is-visible'));
      } else {
        item.card.classList.remove('is-visible');
        // Wait for the fade-out to finish before removing it from the layout.
        window.setTimeout(() => {
          if (!item.card.classList.contains('is-visible')) item.card.hidden = true;
        }, FADE_MS);
      }
    });

    count.textContent = matches
      ? 'Showing ' + matches + ' of ' + items.length + ' projects'
      : 'No projects match this filter.';
  }
}

/* ---------- 7. GitHub repositories (external API) ---------- */
function setUpGitHubRepos() {
  const list = byId('repo-list');
  const status = byId('repo-status');
  const retryButton = byId('repo-retry');
  const languageSelect = byId('repo-language');
  const sortSelect = byId('repo-sort');
  if (!list || !status || !retryButton || !languageSelect || !sortSelect) return;

  const USERNAME = 'AbdulrahmanSal';
  const API_URL = 'https://api.github.com/users/' + USERNAME + '/repos?per_page=100&sort=updated';
  const CACHE_KEY = 'repoCache';
  const CACHE_MAX_AGE_MS = 10 * 60 * 1000; // Reuse a saved list for 10 minutes.
  const TIMEOUT_MS = 8000;
  const MAX_SHOWN = 6;

  const SORTS = {
    updated: (a, b) => new Date(b.updated) - new Date(a.updated),
    stars:   (a, b) => b.stars - a.stars || a.name.localeCompare(b.name),
    name:    (a, b) => a.name.localeCompare(b.name)
  };

  const savedSort = local.get('repoSort');
  const view = { language: 'all', sort: Object.hasOwn(SORTS, savedSort) ? savedSort : 'updated' };
  let repos = [];
  let staleNote = ''; // Shown after the count when the list is an older saved copy.

  sortSelect.value = view.sort;
  sortSelect.addEventListener('change', () => {
    view.sort = sortSelect.value;
    local.set('repoSort', view.sort);
    renderList();
  });
  languageSelect.addEventListener('change', () => {
    view.language = languageSelect.value;
    renderList();
  });
  retryButton.addEventListener('click', loadRepos);

  loadRepos();

  // Order of attempts: a fresh saved copy → the network → an older saved
  // copy → a friendly error. The visitor is never left looking at a blank box.
  async function loadRepos() {
    retryButton.hidden = true;
    staleNote = '';
    showStatus('Loading repositories…');

    const cached = readCache();
    if (cached && Date.now() - cached.savedAt < CACHE_MAX_AGE_MS) {
      useRepos(cached.repos);
      return;
    }

    try {
      const fresh = await fetchRepos();
      local.set(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), repos: fresh }));
      useRepos(fresh);
    } catch (error) {
      if (cached) {
        staleNote = 'Couldn’t reach GitHub just now, so this is the last saved list.';
        useRepos(cached.repos);
      } else {
        useRepos([]);
        showStatus(describeError(error), true);
        retryButton.hidden = false;
      }
    }
  }

  // fetch() has no timeout of its own, so an AbortController cancels the
  // request if GitHub has not answered in time.
  async function fetchRepos() {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(API_URL, { signal: controller.signal });
      if (!response.ok) {
        const failure = new Error('HTTP ' + response.status);
        failure.status = response.status;
        throw failure;
      }

      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('unexpected response shape');

      // Keep only the few fields the page uses (smaller to store), and skip
      // forks and anything whose link does not point at github.com.
      return data
        .filter((repo) => !repo.fork && String(repo.html_url).startsWith('https://github.com/'))
        .map((repo) => ({
          name: repo.name,
          url: repo.html_url,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count || 0,
          updated: repo.pushed_at || repo.updated_at
        }));
    } finally {
      window.clearTimeout(timer);
    }
  }

  function readCache() {
    try {
      const cached = JSON.parse(local.get(CACHE_KEY));
      return cached && Array.isArray(cached.repos) && typeof cached.savedAt === 'number'
        ? cached
        : null;
    } catch (e) {
      return null; // Nothing saved, or the saved text was not valid JSON.
    }
  }

  function describeError(error) {
    if (error.name === 'AbortError') {
      return 'GitHub took too long to respond. Check your connection and try again.';
    }
    if (error.status === 403 || error.status === 429) {
      return 'GitHub is limiting requests right now. Please try again in a few minutes.';
    }
    if (error.status === 404) {
      return 'I couldn’t find that GitHub account.';
    }
    return 'Couldn’t load my repositories right now. Check your connection and try again.';
  }

  function useRepos(loaded) {
    repos = loaded;
    fillLanguageOptions();
    renderList();
  }

  // The language menu is built from the data, so it only offers languages
  // that actually appear in the repositories.
  function fillLanguageOptions() {
    const languages = Array.from(new Set(repos.map((repo) => repo.language).filter(Boolean))).sort();
    if (view.language !== 'all' && !languages.includes(view.language)) view.language = 'all';

    languageSelect.replaceChildren(new Option('All languages', 'all'));
    languages.forEach((language) => languageSelect.appendChild(new Option(language, language)));
    languageSelect.value = view.language;
  }

  function renderList() {
    const matching = repos
      .filter((repo) => view.language === 'all' || repo.language === view.language)
      .sort(SORTS[view.sort]);
    const shown = matching.slice(0, MAX_SHOWN);

    list.replaceChildren(...shown.map(buildRepoItem));

    let message;
    if (!repos.length) {
      message = 'No public repositories to show yet.';
    } else if (!matching.length) {
      message = 'No repositories use that language.';
    } else {
      message = 'Showing ' + shown.length + ' of ' + matching.length + ' public repositories.';
    }
    showStatus(staleNote ? message + ' ' + staleNote : message);
  }

  function buildRepoItem(repo) {
    const item = createEl('li', 'repo');

    const head = createEl('div', 'repo__head');
    const link = createEl('a', 'repo__name', repo.name);
    link.href = repo.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    head.append(link, createEl('span', 'repo__updated', 'Updated ' + timeAgo(repo.updated)));

    const stars = repo.stars + (repo.stars === 1 ? ' star' : ' stars');
    const meta = createEl('p', 'repo__meta', (repo.language || 'No language listed') + ' · ' + stars);

    item.append(head, createEl('p', 'repo__desc', repo.description || 'No description yet.'), meta);
    return item;
  }

  function showStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle('is-error', Boolean(isError));
  }
}

// "3 days ago", "last month" and so on, using the browser's own wording rules.
const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function timeAgo(isoDate) {
  const days = Math.round((new Date(isoDate) - Date.now()) / 86400000); // Negative = in the past.

  if (Number.isNaN(days)) return 'recently';
  if (Math.abs(days) < 30) return relativeTime.format(days, 'day');
  if (Math.abs(days) < 365) return relativeTime.format(Math.round(days / 30), 'month');
  return relativeTime.format(Math.round(days / 365), 'year');
}

/* ---------- 8. Time on site ---------- */
function setUpSessionTimer() {
  const output = byId('session-timer');
  if (!output) return;

  // Kept in sessionStorage so a reload does not reset the count; a new tab does.
  let seconds = Number(session.get('secondsOnSite')) || 0;
  paint();

  window.setInterval(() => {
    // Only count while the tab is on screen, so a tab left open in the
    // background does not run up the total.
    if (document.visibilityState !== 'visible') return;
    seconds++;
    session.set('secondsOnSite', String(seconds));
    paint();
  }, 1000);

  function paint() {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    output.textContent = minutes
      ? minutes + 'm ' + String(rest).padStart(2, '0') + 's'
      : rest + 's';
  }
}

/* ---------- 9. Scroll-reveal animation ---------- */
function setUpScrollReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target); // Reveal once; don't re-hide on scroll-up.
    });
  }, { threshold: 0.15 });

  targets.forEach((target) => observer.observe(target));
}
