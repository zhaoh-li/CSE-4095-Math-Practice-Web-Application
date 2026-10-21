# Math Practice App

A flash-card style math practice app for kids, built with React, TypeScript, and Vite.
The build plan lives in [math_practice_app_todo.md](math_practice_app_todo.md).

## Features

- Flash cards for addition, subtraction, multiplication, and division at 4 levels
- Multiple-choice answers built from common mistakes, then a self-check on the back of the card
- Sessions of 5, 10, or 20 questions, or "keep going", with a summary at the end
- Statistics overall, by operation, by level, and for recent sessions
- Mistake tracking: missed facts come back as similar questions until mastered
- Accessibility: keyboard shortcuts (1–4, F, R, W, ?), screen-reader announcements,
  color vision themes (red-green, blue-yellow, high contrast), reduced motion
- Unfinished sessions survive a refresh; leaving mid-session asks first

## Privacy

No accounts, no tracking, no ads, and no network requests. All progress is stored in the
browser's localStorage and stays on the device. See the in-app Privacy page.

## Requirements

- Node.js 24 (installed with nvm)

## Scripts

| Command                | What it does                        |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Start the dev server                |
| `npm run build`        | Type-check and build for production |
| `npm run preview`      | Preview the production build        |
| `npm test`             | Run tests once                      |
| `npm run test:watch`   | Run tests in watch mode             |
| `npm run lint`         | Check code with ESLint              |
| `npm run lint:fix`     | Fix ESLint problems automatically   |
| `npm run format`       | Format files with Prettier          |
| `npm run format:check` | Check formatting without changing   |
| `npm run typecheck`    | Run the TypeScript compiler         |

## Folder structure

```text
src/
├── components/   Reusable UI pieces
├── pages/        One component per route
├── types/        Shared TypeScript types
├── utils/        Pure helper functions (question generation, math)
├── services/     Storage and other side effects
├── hooks/        Custom React hooks
└── test/         Test setup
```
