# Technical Documentation

## Overview

The site is three hand-written files: `index.html` for content, `css/styles.css` for presentation, and `js/script.js` for behaviour. There is no build step, bundler, or framework. The only outside dependencies are one web font (Manrope) and the GitHub REST API.

| Layer | File | Responsibility |
| --- | --- | --- |
| Structure | `index.html` | Semantic sections, filter and sort controls, GitHub list container, form markup, accessibility attributes |
| Presentation | `css/styles.css` | Design tokens, light and dark themes, layout, transitions, responsive rules |
| Behaviour | `js/script.js` | Nine features, each in its own function (see below) |

`script.js` is loaded with `defer`, so it runs after the HTML is parsed without blocking the first paint. A tiny inline script in `<head>` applies the saved theme before the page paints, so there is no light-to-dark flash.

---

## 1. API integration: GitHub repositories

`setUpGitHubRepos()` calls `https://api.github.com/users/AbdulrahmanSal/repos?per_page=100&sort=updated`. The API needs no key and allows requests from a browser (CORS), but unauthenticated requests are limited to 60 per hour per IP address, which shapes the design below.

**Order of attempts** (`loadRepos`):

1. If a saved copy is less than 10 minutes old, use it and make no request. This protects the rate limit.
2. Otherwise `fetchRepos()` asks GitHub. The request carries an `AbortController` signal and is cancelled after 8 seconds, because `fetch` has no timeout of its own.
3. If the request fails and an older saved copy exists, show that copy with the note "Couldn't reach GitHub just now, so this is the last saved list."
4. If it fails and nothing is saved, show an error message and a **Try again** button.

**What the visitor sees**

| Situation | Message |
| --- | --- |
| Request in flight | "Loading repositories…" |
| Success | "Showing 4 of 4 public repositories." |
| Timeout | "GitHub took too long to respond. Check your connection and try again." |
| HTTP 403 or 429 (rate limit) | "GitHub is limiting requests right now. Please try again in a few minutes." |
| HTTP 404 | "I couldn't find that GitHub account." |
| Network failure or unexpected response | "Couldn't load my repositories right now. Check your connection and try again." |
| No public repositories | "No public repositories to show yet." |

**Handling the data safely**

- The response must be an array; anything else is treated as a failure.
- Forks are dropped, and any repository whose `html_url` does not start with `https://github.com/` is dropped.
- Only the fields the page uses are kept (name, URL, description, language, stars, last push date), which keeps the saved copy small.
- Every value is placed on the page with `textContent` through the `createEl` helper, never `innerHTML`. A repository description such as `<img onerror=...>` is therefore shown as plain text and never runs.
- Links use `target="_blank"` with `rel="noopener noreferrer"`.
- Dates are shown with `Intl.RelativeTimeFormat` ("today", "2 days ago", "last month").

## 2. Complex logic

### Project filter and sort (`setUpProjectList`)

The state of the whole feature is two values: `state.filter` (`all`, `java`, `python`, `verilog`) and `state.sort` (`featured`, `name-asc`, `name-desc`). Any change updates the state, saves it, and calls `render()`, which always does the same two steps in the same order:

1. **Sort:** copy the item list, sort the copy with the comparator for `state.sort`, and re-append the cards in that order.
2. **Filter:** show the cards whose `data-tags` match; fade the others out and set `hidden` after 250 ms, the length of the CSS transition. When a card comes back, `hidden` is removed first and `.is-visible` is added one animation frame later, otherwise the browser merges the two changes and the fade never plays.

The count line ("Showing 1 of 3 projects") reports the result. Because filtering and sorting are independent, any combination works. A saved filter or sort from an earlier visit is checked against the options the page really offers (`Object.hasOwn` for sorts, an `includes` check for filters), so a bad stored value falls back to the default.

### GitHub list filter and sort

The same idea applies to the repository list. The language menu is built from the loaded data, so it only offers languages that appear. `renderList()` filters by language, sorts (recently updated, most stars, or name) and only then keeps the first six, so the six shown are always the best six for the current choice.

### Contact form (`setUpContactForm`)

Submitting runs three ordered steps:

1. Validate every field and show every problem at once.
2. If anything failed, move the keyboard focus to the first invalid field and stop.
3. Only when all fields pass, accept the message, reset the form, and refresh the character counter.

| Field | Rule |
| --- | --- |
| Name | Required; at least two letters (Unicode-aware, so Arabic names work) |
| Email | Required; must match `something@something.tld`. The pattern is deliberately loose: a strict email regex rejects real addresses, and only sending mail proves an address works |
| Message | Required; 10–500 characters; the textarea has `maxlength="500"` and a live counter |

An error clears as soon as the visitor fixes that field. Nothing is sent anywhere; the form only validates in the browser.

### Time on site (`setUpSessionTimer`)

A one-second `setInterval` adds a second to a counter only while `document.visibilityState === 'visible'`, so a tab left in the background does not run up the total. The count is kept in `sessionStorage`, so a reload continues it and a new tab starts again. It is formatted as `42s` or `2m 05s`.

## 3. State management

Everything the site remembers goes through one wrapper, `createStore()`, which wraps each `localStorage` or `sessionStorage` call in `try/catch`. Browsers can throw on storage access (private browsing, blocked site data), and the page must still work, so a failure only means the value is not remembered.

| State | Where | Key |
| --- | --- | --- |
| Theme | `localStorage` | `theme` |
| Visitor name | `localStorage` | `visitorName` |
| Project filter and sort | `localStorage` | `projectFilter`, `projectSort` |
| GitHub list sort | `localStorage` | `repoSort` |
| Saved GitHub list | `localStorage` | `repoCache` (with a timestamp) |
| Seconds on site | `sessionStorage` | `secondsOnSite` |

Principles used throughout:

- **One source of truth per feature.** The visitor name lives in a variable (so it still shows if storage is blocked) and is written to storage; a single `paint()` function derives the whole hero from it.
- **Never trust stored values.** The saved name must pass the same pattern as typed input; saved filters and sorts must be real options; the saved GitHub list must parse as JSON and contain an array.
- **The visitor controls it.** "Not you? Clear my name" removes the stored name.

## 4. Performance

Sizes were measured on the files in this repository.

| File | Before | After | Change |
| --- | --- | --- | --- |
| `profile.jpg` | 159,520 B (1200×1200) | 16,787 B (320×320) | Displayed at 160 px, so 320 px covers high-density screens |
| `project-1.png` | 18,033 B | 11,334 B | Lossless recompression; same pixels |
| `project-2.png` | 106,748 B | 99,255 B | Lossless recompression; same pixels |
| `project-3.png` | 82,849 B | 75,886 B | Lossless recompression; same pixels |

The screenshots stay PNG on purpose: they contain small text, and lossy compression made it blurry in an earlier version.

Other measures:

- `loading="lazy"` and `decoding="async"` on images below the fold, plus `width` and `height` attributes so the layout does not jump as they load.
- `script.js` uses `defer`.
- The Google Fonts stylesheet loads with `media="print"` switched to `all` on load, so it does not block rendering. A `<noscript>` copy covers browsers with scripting off, and `display=swap` shows text immediately in a fallback font.
- The GitHub response is cached for 10 minutes, which avoids repeat requests and keeps the page fast on reloads.
- Unused code from the earlier version was removed rather than left in.
- A single shared set of helpers (`byId`, `createEl`, the storage wrapper) replaces repeated code.

**Lighthouse.** Lighthouse was not run for this submission. To check it yourself, open the deployed page in Chrome, open DevTools, choose the Lighthouse tab, and run a Mobile audit. Scores depend on the network, so run it on the live GitHub Pages address rather than a local file.

## 5. Accessibility and compatibility

- Landmarks (`header`, `nav`, `main`, `section`, `footer`), a skip link, and labelled controls.
- Status messages (`role="status"`) announce the project count, the GitHub list state, and form success; form errors use `role="alert"`. The timer is deliberately not a live region, so screen readers are not interrupted every second.
- `aria-pressed` on the theme and filter buttons.
- `prefers-reduced-motion` turns transitions off; content still ends up fully visible.
- With JavaScript disabled, a `<noscript>` rule keeps the animated content visible and the GitHub section points to the profile link.
- The code uses features available in current Chrome, Edge, Firefox, and Safari (`fetch`, `AbortController`, `Object.hasOwn`, `IntersectionObserver`, `Intl.RelativeTimeFormat`, Unicode property escapes in regular expressions). Older browsers without them are not supported.

## Testing

Features were checked with a one-off headless Chromium script (73 checks) that is kept with the AI evidence rather than in this repository. The GitHub API was mocked because the test environment could not reach it, so the script covers the cases that are hard to trigger on demand: success, HTTP 500, 403, 404, a malformed response, a dropped connection, an 8-second hang, an empty account, a fresh saved copy, a stale saved copy, and a hostile description. It also covers the filter, sort, visitor name, theme, form, timer, lightbox, scroll reveal, a 375 px phone layout, and the page with JavaScript disabled. All checks passed. The live GitHub API was not called by the test, so a first visit to the deployed page is the real end-to-end check.

## Known limitations

- Unauthenticated GitHub requests are limited to 60 per hour per IP address. The 10-minute saved copy and the friendly rate-limit message soften this but cannot remove it.
- The project filter buttons and `data-tags` values are matched by hand to the three current projects; a project in a new language needs a new tag and a new button.
- The projects have no dates in the page, so they are sorted by name rather than by date.
- The contact form does not send anything; it validates in the browser only.
- Only the six best-matching repositories are shown.
