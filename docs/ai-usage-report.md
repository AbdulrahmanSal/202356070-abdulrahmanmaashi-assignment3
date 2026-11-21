# AI Usage Report

## Usage Log

One row per AI conversation (`C`) or AI-generated artifact (`A`). All AI use in this assignment was with Claude (Anthropic) in a single conversation, so C01 is the conversation and the A rows are the files it produced.

| ID | Tool (model) | Date | Purpose | Files affected | What you changed and how you verified it |
|----|--------------|------|---------|----------------|------------------------------------------|
| C01 | Claude (Sonnet 5.5) | 2026-11-21 | Plan and build the Assignment 3 features from the brief; test them; write the documentation | All files below | Full conversation is in the AI Evidence ZIP under `conversations/`. Changes made by me to the AI output: none so far |
| A01 | Claude (Sonnet 5.5) | 2026-11-21 | Page markup: visitor-name form, sort menus, GitHub list container, form counter, footer timer, non-blocking font loading | `index.html` | No edits of mine. Verified with the automated browser test (73 checks, `artifacts/site_test3.py`) |
| A02 | Claude (Sonnet 5.5) | 2026-11-21 | Styles for the new controls, GitHub list, visitor form, and counter; removed the old advice-widget styles | `css/styles.css` | No edits of mine. Verified with the automated browser test and screenshots at desktop and 375 px width |
| A03 | Claude (Sonnet 5.5) | 2026-11-21 | JavaScript: GitHub API fetch with timeout and saved copy, filter and sort, form checks, visitor name, time-on-site counter, storage wrapper | `js/script.js` | No edits of mine. Verified with the automated browser test using a mocked GitHub API |
| A04 | Claude (Sonnet 5.5) | 2026-11-21 | Image optimization (resized profile photo, lossless PNG recompression) and a clean favicon | `assets/images/profile.jpg`, `assets/images/project-1.png`, `assets/images/project-2.png`, `assets/images/project-3.png`, `assets/images/favicon.svg` | No edits of mine. File sizes before and after are listed in the technical documentation |
| A05 | Claude (Sonnet 5.5) | 2026-11-21 | Write the README in the format I supplied from earlier assignments | `README.md` | No edits of mine |
| A06 | Claude (Sonnet 5.5) | 2026-11-21 | Write the technical documentation | `docs/technical-documentation.md` | No edits of mine |
| A07 | Claude (Sonnet 5.5) | 2026-11-21 | Draft this report | `docs/ai-usage-report.md` | No edits of mine |
| A08 | Claude (Sonnet 5.5) | 2026-11-21 | Headless-browser test script (not in this repository; included in the AI Evidence ZIP) | None in the repository | Run against the site; 73 of 73 checks passed |

## Declaration

> I declare that this report and the attached evidence document all of my AI use in this assignment, with complete and unedited conversations, and that I understand and can explain all the code I submitted. I understand that undeclared AI use or a false declaration will be treated as plagiarism according to KFUPM regulations.

**Name:** Abdulrahman Saleh Maashi
**ID:** 202356070
**Date:** 2026-11-21

## 1. Tools Used & Use Cases

Claude (Anthropic) was the only AI tool used. I gave it the Assignment 3 brief and my existing portfolio site, and it chose and wrote the features for each requirement:

- **API integration:** the "Latest on GitHub" list, which fetches my public repositories
- **Complex logic:** project filter and sort, a step-by-step contact form check, and a time-on-site counter
- **State management:** a saved visitor name, plus remembered theme, filter, and sort
- **Performance:** image resizing and recompression, a deferred script, and a non-blocking font stylesheet
- **Documentation and testing:** the README, technical documentation, this report, and an automated browser test

## 2. Benefits & Challenges

**Benefits**
- All five technical requirements were implemented in one consistent pass, with the same code style across the file.
- The error cases were tested properly. The GitHub API could not be reached from the AI's environment, so the test mocked it and covered cases that are hard to trigger by hand: timeout, rate limit, malformed data, a saved copy, and a hostile repository description.
- The AI pointed out design decisions that matter for this API, such as the 60-requests-per-hour limit for unauthenticated calls, which is why the list keeps a 10-minute saved copy.

**Challenges**
- The live GitHub API was not called during testing, so the first real visit to the deployed page is the end-to-end check.
- Lighthouse could not be run in the AI's environment, so no performance score is claimed. The documentation lists measured file sizes instead.
- The projects have no real dates in the page, so the AI sorted by name instead of inventing dates.
- The AI chose the features and the design; I accepted them rather than designing them myself.

## 3. Learning Outcomes

The concepts in the code that this assignment covers:

- **Fetching data safely:** `fetch` has no timeout, so an `AbortController` cancels slow requests; every outcome (success, error, empty, slow) needs its own message.
- **Treating outside data as untrusted:** text from an API is written with `textContent`, never `innerHTML`, and links are checked before use.
- **Caching:** a timestamped copy in `localStorage` reduces requests and gives a fallback when the network fails.
- **One state, one render function:** the filter and sort each keep their choice in a small `state` object, and a single `render()` applies it, so every combination behaves the same way.
- **Validating saved state:** values read back from storage are checked before use, because storage can be edited or empty.
- **Storage can fail:** every read and write is wrapped in `try/catch` through one helper.

## 4. Responsible Use & Modifications

- All AI-generated files are listed in the Usage Log above, and the full conversation and the test script are in the AI Evidence ZIP submitted on Blackboard (not committed to this repository).
- The commits that contain AI-assisted code carry an `Assisted-by: Claude (Sonnet 5.5)` line.
- The behaviour was checked by an automated test instead of being accepted untested, and the screenshots at desktop and phone width were reviewed.
- Claims in the documentation that could not be verified (a Lighthouse score, a live API call during testing) are stated as not done rather than assumed.
- The parts of the code I must be able to explain: why `AbortController` is used, why API text goes through `textContent`, how `render()` combines sorting and filtering, why stored values are validated before use, and why the GitHub list keeps a 10-minute saved copy.
