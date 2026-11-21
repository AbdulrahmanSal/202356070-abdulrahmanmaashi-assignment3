# Abdulrahman Saleh Maashi — Personal Portfolio

## Project Description

This is my personal portfolio website for Assignment 3: Advanced Functionality. It has About, Projects, Skills, and Contact sections and now pulls live data from the GitHub API, lets visitors filter and sort the project list, remembers their choices, and checks the contact form step by step. The goal was to practice API integration, multi-step logic, and state management in plain HTML, CSS, and JavaScript.

## Features

**Core portfolio**
- About Me section with a short personal introduction
- Projects section featuring the Hotel Reservation System, House Price Prediction Model, and Digital Queue Management System
- Dark and light theme toggle, remembered between visits
- Click-to-enlarge lightbox for project screenshots
- Fade-in animations when sections scroll into view
- Responsive layout for desktop, tablet, and mobile screens
- Accessible labels, alternative image text, and semantic HTML elements

**New in Assignment 3**
- **GitHub API integration** — the "Latest on GitHub" list fetches my public repositories live, with a loading state, a friendly error message with a Try again button, an 8-second timeout, and a saved copy used if GitHub cannot be reached
- **Filter and sort** — projects can be filtered by language and sorted by name; the GitHub list can be filtered by language and sorted by recent activity, stars, or name
- **Contact form checks** — name must contain letters, email must look valid, message must be 10–500 characters with a live counter; all problems are shown at once and the keyboard jumps to the first one
- **Visitor name** — a visitor can enter their name once; the greeting uses it on later visits and a "Not you?" button clears it
- **Time on site** — a counter in the footer that only runs while the tab is visible and survives a reload
- **Remembered state** — theme, visitor name, project filter and sort, and GitHub sort are saved in the browser
- **Performance** — resized profile photo, recompressed screenshots, lazy-loaded images, a deferred script, and a non-blocking font stylesheet

## Technologies Used

- HTML5 for the page structure and content
- CSS3, Grid, and Flexbox for styling, responsive layout, and transitions
- JavaScript (`fetch`, `async`/`await`, `AbortController`, `localStorage`, `sessionStorage`, `IntersectionObserver`, `Intl.RelativeTimeFormat`)
- The GitHub REST API for live repository data
- Git and GitHub for version control and project hosting
- Claude (Anthropic) for development assistance, testing, and documentation support

## Project Structure

```text
202356070-abdulrahmanmaashi-assignment3/
├── index.html
├── README.md
├── .gitignore
├── css/
│   └── styles.css
├── js/
│   └── script.js
├── assets/
│   └── images/
│       ├── profile.jpg
│       ├── favicon.svg
│       ├── project-1.png
│       ├── project-2.png
│       └── project-3.png
└── docs/
    ├── ai-usage-report.md
    └── technical-documentation.md
```

## Running the Website Locally

1. Download or clone the repository.
2. Open the project folder.
3. Open `index.html` in a web browser.

No installation, package manager, or backend server is required. The GitHub list needs an internet connection; everything else works offline. If you prefer a local server, run `python -m http.server` in the project folder and open `http://localhost:8000`.

## AI Usage Summary

Claude was used to plan and write the new features (the GitHub API list, the filter and sort logic, the visitor name, the time-on-site counter, and the form checks), to optimize the images, to run automated browser tests with a mocked GitHub API, and to draft the documentation. Every use is listed in the Usage Log in [`docs/ai-usage-report.md`](docs/ai-usage-report.md), together with the declaration. The full conversation and the intermediate files are submitted separately on Blackboard in the AI Evidence ZIP.

## Author

Abdulrahman Saleh Maashi — ID 202356070
