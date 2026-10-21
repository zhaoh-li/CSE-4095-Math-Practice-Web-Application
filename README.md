# Math Practice App

A flash-card style math practice app for kids ages 7–12, built with React, TypeScript, and
Vite. The build plan lives in [math_practice_app_todo.md](math_practice_app_todo.md).

- **Live site:** deployed on Netlify from the `main` branch
- **Version:** 1.0.0

## Getting Started

### 1. Install Node.js (version 24)

The app is built with Node.js, which comes with **npm**, the tool that installs the project's
packages and runs its commands. Pick one of these:

**Option A: nvm (Node Version Manager), recommended on macOS, Linux, and WSL**

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# Load nvm in the current terminal (or close and reopen the terminal)
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"

# Install and use Node.js 24
nvm install 24
```

**Option B: the official installer, on Windows or macOS**

Download the **LTS** installer from [nodejs.org](https://nodejs.org/) and run it.

**Check that it worked:**

```bash
node -v   # should print v24.x.x
npm -v    # should print a version number
```

### 2. Get the code

```bash
git clone https://github.com/zhaoh-li/CSE-4095-Math-Practice-Web-Application.git
cd CSE-4095-Math-Practice-Web-Application
```

### 3. Install the dependencies

The project uses packages such as React, Vite, React Router, and the testing tools. They are
not stored in the repository. This command downloads them:

```bash
npm install
```

- It reads **`package.json`** (the list of packages) and **`package-lock.json`** (the exact
  versions), and puts everything in a **`node_modules/`** folder.
- It takes a minute or two the first time. `node_modules/` is ignored by git, so it is never
  committed.
- Run it again whenever `package.json` changes, for example after pulling someone else's
  changes.
- For a clean install that matches the lock file exactly (useful if something seems broken),
  use `npm ci` instead. It deletes `node_modules/` and reinstalls from scratch.

## Running Locally

Start the development server:

```bash
npm run dev
```

Then open **http://localhost:5173** in your browser. Press **Ctrl+C** in the terminal to stop
the server.

This is **development mode**: the page reloads instantly when you save a file, and the code is
not minified, so errors are easy to read. It runs only on your computer; nobody else can see
it. It is not what visitors to the live site get (see the next section).

Before sharing changes, it's a good idea to run the checks:

```bash
npm test            # run all tests
npm run lint        # check code style and common mistakes
npm run typecheck   # check TypeScript types
```

## Building for Deployment

Browsers can't run TypeScript and the project's source files directly. **Building** turns the
project into plain, optimized HTML, CSS, and JavaScript that any web host can serve.
**Deploying** means putting those files online.

### Build

```bash
npm run build
```

This does two things:

1. **Type-checks** the code with TypeScript. If there are type errors, the build stops and
   lists them.
2. **Bundles** the app with Vite into a **`dist/`** folder:

```text
dist/
├── index.html          The single page the browser loads
├── favicon.svg
└── assets/
    ├── index-a1b2c3d4.js        Main app code (minified; name varies)
    ├── StatisticsPage-….js      Pages loaded only when opened
    ├── SettingsPage-….js
    ├── index-….css              Styles
    └── nunito-latin-….woff2     Fonts, included with the app
```

The random-looking part of each file name changes whenever the file changes. That lets
browsers cache files for a long time without ever showing an outdated version.

The app has **no server code and no database**: progress is saved in each visitor's browser.
So the `dist/` folder is everything needed to run the app, and it can be hosted anywhere that
serves plain files.

### Preview the build

To see exactly what visitors will get, before deploying:

```bash
npm run preview
```

Then open **http://localhost:4173**. This serves the `dist/` folder, so run `npm run build`
first.

### Deploy to Netlify (how this project is hosted)

1. Sign in to [Netlify](https://app.netlify.com/) with GitHub.
2. Choose **Add new project → Import an existing project → GitHub**, and pick this repository.
3. Click **Deploy**. The settings come from [`netlify.toml`](netlify.toml), so there is nothing
   to fill in:

```toml
[build]
  command = "npm run build"   # how to build
  publish = "dist"            # which folder to put online

[build.environment]
  NODE_VERSION = "24"

[[redirects]]                 # send every address to the app
  from = "/*"
  to = "/index.html"
  status = 200
```

After that, **every push to `main` builds and publishes the site automatically**, and every
pull request gets its own **Deploy Preview** link for testing.

**Why the redirect matters:** the app changes pages inside the browser, so addresses like
`/statistics` don't exist as real files on the server. Without the redirect, opening or
refreshing `/statistics` directly would show the host's "Page not found" error. The redirect
sends every address to `index.html`, and the app then shows the right page.

### Deploy somewhere else

Any static host works (GitHub Pages, Vercel, Cloudflare Pages, or any web server):

1. Run `npm run build`.
2. Upload the **contents** of `dist/` (or point the host's build settings at `npm run build`
   with `dist` as the output folder).
3. Set up the same "single-page app" fallback, so every address serves `index.html`. Each host
   has its own setting for this (for example, a `vercel.json` rewrite on Vercel).

## Troubleshooting

| Problem                                                             | Fix                                                                                                                                                                     |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node: command not found` or `npm: command not found`               | nvm isn't loaded in this terminal. Run `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"`. To make it permanent, add that line to `~/.bashrc` (or `~/.zshrc` on macOS). |
| `Port 5173 is in use`                                               | Another dev server is already running. Stop it with Ctrl+C, or use the other port Vite offers.                                                                          |
| Errors after pulling new changes                                    | Dependencies may have changed. Run `npm install` (or `npm ci` for a clean reinstall).                                                                                   |
| A page shows "Not found" or a blank page after refreshing on a host | The host is missing the single-page app redirect. See [Deploy to Netlify](#deploy-to-netlify-how-this-project-is-hosted).                                               |
| `npm run preview` shows an old version                              | Run `npm run build` again first; preview only serves what's in `dist/`.                                                                                                 |

## Features

- Flash cards for addition, subtraction, multiplication, and division at 4 levels
- Multiple-choice answers built from common mistakes, then a self-check on the back of the card
- Sessions of 5, 10, or 20 questions, or "keep going", with a summary at the end
- Statistics overall, by operation, by level, and for recent sessions
- Mistake tracking: missed facts come back as similar questions until mastered
- Accessibility: keyboard shortcuts (1–4, F, R, W, ?), screen-reader announcements,
  color vision themes (red-green, blue-yellow, high contrast), reduced motion
- Unfinished sessions survive a refresh; leaving mid-session asks first
- A rising chime for correct answers, generated in the browser (no audio files)
- "How to solve it" explanations: dot pictures and rules for small problems, break-apart
  steps (make a ten, tens and ones, split the big number…) for larger ones

## Privacy

No accounts, no tracking, no ads, and no network requests. All progress is stored in the
browser's localStorage and stays on the device. See the in-app Privacy page.

## Scripts

| Command                | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `npm install`          | Install dependencies                          |
| `npm run dev`          | Start the development server (port 5173)      |
| `npm run build`        | Type-check and build for production (`dist/`) |
| `npm run preview`      | Serve the production build (port 4173)        |
| `npm test`             | Run tests once                                |
| `npm run test:watch`   | Run tests again on every change               |
| `npm run lint`         | Check code with ESLint                        |
| `npm run lint:fix`     | Fix ESLint problems automatically             |
| `npm run format`       | Format files with Prettier                    |
| `npm run format:check` | Check formatting without changing files       |
| `npm run typecheck`    | Run the TypeScript compiler                   |

## Folder structure

```text
src/
├── components/   Reusable UI pieces (layout, flash card, statistics, settings)
├── config/       Fixed settings: difficulty ranges, defaults, messages, themes
├── context/      App-wide settings shared with every page
├── hooks/        Custom React hooks (practice session, keyboard shortcuts)
├── pages/        One component per page
├── services/     Saving data in the browser, sound effects
├── test/         Test setup and helpers
├── types/        Shared TypeScript types
├── utils/        Pure helpers: question generation, statistics, explanations
└── routes.tsx    The list of pages and their addresses
```
