# Math Practice App — Software Specification

**Document:** `SPECIFICATION.md`  
**Status:** Initial specification  
**Product:** Math Practice App for children ages 7–12

## 1. Overview

Build a child-friendly math practice web application that helps children ages 7–12 practice arithmetic, track their progress, and revisit questions they previously answered incorrectly.

The app should be easy to use independently, provide immediate feedback, and work without creating an account. Practice history and settings are stored locally in the user's browser.

### 1.1 Core features

- Practice addition, subtraction, multiplication, and division.
- Organize difficulty into levels.
- Present each question as a multiple-choice card.
- Let the child flip the card to reveal the correct answer.
- After revealing the answer, let the child report whether they got it right or wrong.
- Record practice attempts and show statistics.
- Remember questions the child reports getting wrong.
- Generate similar questions to help the child practice the same skill.
- Provide a review mode focused on previous mistakes.
- Store data locally; no account or backend is required.

### 1.2 Product principles

- **Child-friendly:** Clear language, readable text, welcoming visuals, and simple navigation.
- **Encouraging:** Feedback should support learning and avoid shaming children for mistakes.
- **Predictable:** A question should only be recorded once per attempt.
- **Private by default:** No account, tracking service, or remote storage is required.
- **Reliable:** Generated questions and answer choices must be mathematically valid.
- **Accessible:** Support keyboard navigation, visible focus, and screen readers where practical.

## 2. Scope

### 2.1 In scope for the initial version

- Four arithmetic operations.
- Four difficulty levels.
- Multiple-choice questions.
- Flip-to-reveal answer interaction.
- Self-reported correct/incorrect results.
- Practice session setup and completion.
- Overall and category-level statistics.
- Incorrect-question history.
- Similar-question generation.
- Mistake-review sessions.
- Browser `localStorage` persistence.
- Settings and reset-data controls.
- Responsive layout for desktop, tablet, and mobile.

### 2.2 Out of scope for the initial version

- User accounts, login, or cloud synchronization.
- Multiplayer or classroom management.
- Teacher/parent dashboards.
- Backend services or databases.
- AI-generated questions requiring a network connection.
- Payments, advertisements, or social features.

## 3. Recommended technology

- **Framework:** React.
- **Language:** TypeScript.
- **Build tooling:** Vite.
- **Styling:** CSS Modules, plain CSS, or another lightweight styling approach.
- **Routing:** React Router if separate routes are useful; a simpler state-based page flow is also acceptable.
- **Persistence:** Browser `localStorage`.
- **Testing:** Vitest and React Testing Library.

Keep the first version client-side. Avoid adding a backend or authentication unless the requirements change.

## 4. Application structure and navigation

The app should provide the following views. These may be separate routes or views within a single-page application.

### 4.1 Home

Purpose: provide a clear starting point.

Elements:

- App name and welcoming introduction.
- **Start Practice** action.
- **Review Mistakes** action.
- A small progress summary, such as questions attempted and self-reported correct answers.
- **Statistics** and **Settings** navigation.

If there are no saved mistakes, the review action should explain that the child can answer some practice questions first.

### 4.2 Practice Setup

Let the child configure a session before starting.

Options:

- **Operations:** addition, subtraction, multiplication, division. One or more may be selected.
- **Difficulty:** Beginner, Easy, Intermediate, Advanced. One or more may be selected.
- **Session length:** 5 questions, 10 questions, 20 questions, or continuous practice.
- **Practice mode:** regular practice or mistake review.

Requirements:

- Show clear labels and selected states.
- Provide sensible defaults so the child can start quickly.
- Prevent starting if no operation or difficulty is selected.
- In mistake-review mode, explain when there are no eligible mistakes to review.
- If the child selects a fixed session length, show progress such as “Question 3 of 10.”

### 4.3 Practice

This is the main learning experience.

Each question should:

1. Display one arithmetic problem.
2. Present four answer choices by default.
3. Allow the child to select an answer choice.
4. Allow the child to flip the card to reveal the correct answer.
5. Show the correct answer clearly.
6. Show the child their selected answer, if they selected one.
7. Offer **I Got It Right** and **I Got It Wrong** actions after the answer is revealed.
8. Record the self-reported result and move to the next question.

Rules:

- Do not record a result before the child makes a self-report.
- Disable or otherwise prevent repeated result submissions for the same question attempt.
- Do not treat the selected multiple-choice answer as authoritative grading. In this app, the result is based on the child's self-report.
- If the child flips the card without selecting an option, they can still report whether they got it right or wrong.
- Include a clear way to leave the session, with confirmation if leaving would abandon an unfinished session.
- Use positive, neutral language after both correct and incorrect self-reports.

### 4.4 Session Summary

Display at the end of a fixed-length session.

Include:

- Number of questions attempted.
- Number self-reported correct.
- Number self-reported incorrect.
- Accuracy percentage based on self-reported results.
- A short, encouraging message.
- **Practice Again**, **Review Mistakes**, and **Home** actions as appropriate.

For continuous practice, provide a clear way to end the session and then show the summary.

### 4.5 Statistics

Show useful progress without overwhelming the child.

Required metrics:

- Total questions attempted.
- Total self-reported correct results.
- Total self-reported incorrect results.
- Self-reported accuracy percentage.
- Breakdown by arithmetic operation.
- Breakdown by difficulty level.
- Recent session summaries.
- Count of questions or mistake patterns saved for review.

Use a simple chart or clear visual indicators where helpful. Always label statistics clearly. Explain that accuracy is based on the child's self-reported result, not automatic grading.

### 4.6 Settings

Include:

- A way to change basic preferences, if any are introduced.
- A **Reset All Progress** action.
- A confirmation step before deleting saved progress.
- Clear information that progress is saved in this browser on this device.
- A way to cancel a reset without changing any data.

Avoid unnecessary settings in the first release.

## 5. Difficulty levels

Difficulty should be defined in one centralized configuration so the ranges can be adjusted without rewriting the question-generation logic.

Suggested initial ranges:

| Level        | Addition                             | Subtraction                                | Multiplication                     | Division                                                |
| ------------ | ------------------------------------ | ------------------------------------------ | ---------------------------------- | ------------------------------------------------------- |
| Beginner     | 0–10 + 0–10                          | Non-negative result, values up to 10       | 0–5 × 0–5                          | Whole-number facts with divisors 1–5                    |
| Easy         | 0–20 + 0–20                          | Non-negative result, values up to 20       | 0–10 × 0–10                        | Whole-number facts with divisors 1–10                   |
| Intermediate | 0–100 + 0–100                        | Non-negative result, values up to 100      | 0–12 × 0–12                        | Whole-number facts with quotients and divisors up to 12 |
| Advanced     | Larger values, initially up to 1,000 | Non-negative result, initially up to 1,000 | Larger factors, initially up to 20 | Larger whole-number facts with exact division           |

These are starting defaults, not hard-coded constraints. Keep operation-specific rules in configuration and ensure generated problems remain age-appropriate.

For subtraction, avoid negative answers unless negative numbers are deliberately added as a future learning objective. For division, avoid division by zero and use exact whole-number answers by default.

## 6. Question and answer requirements

### 6.1 Question model

A question should contain enough information to display the problem and validate its generated answer.

Suggested TypeScript model:

```ts
type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';

type Difficulty = 'beginner' | 'easy' | 'intermediate' | 'advanced';

interface MathQuestion {
  id: string;
  operation: Operation;
  difficulty: Difficulty;
  operandA: number;
  operandB: number;
  operator: '+' | '−' | '×' | '÷';
  correctAnswer: number;
  displayText: string;
  skillKey: string;
  createdAt: string;
}
```

The `skillKey` identifies the underlying skill or fact family so similar questions can be generated later.

### 6.2 Answer choices

- Provide four distinct answer choices by default.
- Include the correct answer exactly once.
- Generate plausible incorrect answers based on common arithmetic mistakes.
- Avoid duplicate choices.
- Shuffle the choices so the correct answer is not consistently in the same position.
- Keep all choices within a sensible range for the question.
- If four distinct, plausible choices cannot be generated after a reasonable number of attempts, use a safe fallback that still includes the correct answer exactly once.
- Ensure the displayed correct answer matches the actual mathematical result.

### 6.3 Operation rules

**Addition**

- Generate two operands within the configured range.
- Calculate the sum exactly.

**Subtraction**

- Prefer operands that produce a non-negative result.
- Calculate the difference exactly.

**Multiplication**

- Generate factors within the configured range.
- Calculate the product exactly.

**Division**

- Never use zero as the divisor.
- For the initial version, generate exact whole-number divisions.
- One reliable approach is to generate a divisor and quotient, then calculate the dividend as `divisor × quotient`.

### 6.4 Similar questions

When a child reports a question wrong:

- Save the question and its skill information.
- Make it eligible for mistake review.
- Generate related practice questions using the same skill or fact family.
- Vary the operands so the child practices the underlying idea instead of memorizing one answer.
- Avoid repeatedly generating the exact same question in one session where possible.

Examples:

- If the child struggles with `7 × 8`, generate related multiplication facts at the same difficulty.
- If the child struggles with `15 − 7`, generate other subtraction problems that practice a similar skill.
- If the child struggles with `24 ÷ 6`, generate other exact division questions.

Similar-question generation should be deterministic in its rules and should not require an external AI service.

## 7. Practice flow and attempt tracking

Each time a question is presented in a session, it represents one **attempt**.

Suggested attempt model:

```ts
interface QuestionAttempt {
  id: string;
  questionId: string;
  sessionId: string;
  operation: Operation;
  difficulty: Difficulty;
  selectedAnswer?: number;
  correctAnswer: number;
  selfReportedCorrect: boolean;
  attemptedAt: string;
  mode: 'practice' | 'mistake-review';
}
```

Requirements:

- Record an attempt only after the child chooses **I Got It Right** or **I Got It Wrong**.
- Store the selected answer when the child selected one.
- Keep `selfReportedCorrect` distinct from any calculated comparison between `selectedAnswer` and `correctAnswer`.
- A single attempt must never be counted twice.
- A later attempt at the same question is a new attempt with a new ID.
- Use the attempt history to calculate statistics.
- If a session is abandoned before an answer is self-reported, do not count that unfinished question as an attempt.

## 8. Mistake tracking and review

Maintain a history of questions the child reports getting wrong.

Suggested mistake model:

```ts
interface MistakeRecord {
  questionId: string;
  skillKey: string;
  operation: Operation;
  difficulty: Difficulty;
  firstWrongAt: string;
  lastWrongAt: string;
  wrongCount: number;
  correctSimilarCount: number;
  reviewStatus: 'needs-review' | 'improving' | 'mastered';
}
```

Requirements:

- When a child reports a question wrong, create or update its mistake record.
- Increment `wrongCount` when that same question is reported wrong again.
- Keep enough information to generate similar questions for the same skill.
- Mistake-review mode should prioritize saved mistakes and related practice.
- When a child answers a similar question correctly, update the relevant skill progress.
- A reasonable initial mastery rule is to mark a skill as mastered after three consecutive self-reported correct answers on related questions. Reset the consecutive count after a related incorrect result.
- Mastery should be a helpful practice signal, not a permanent lock. Mastered skills can still appear in regular practice.
- Provide a way to clear all progress from Settings.

## 9. Session model

Suggested model:

```ts
interface PracticeSession {
  id: string;
  startedAt: string;
  completedAt?: string;
  operations: Operation[];
  difficulties: Difficulty[];
  plannedQuestionCount: number | 'continuous';
  mode: 'practice' | 'mistake-review';
  attemptedCount: number;
  selfReportedCorrectCount: number;
  selfReportedIncorrectCount: number;
}
```

Requirements:

- A session starts when the child begins practice.
- Update session totals only when an attempt is recorded.
- Fixed-length sessions finish after the planned number of recorded attempts.
- Continuous sessions finish when the child chooses to stop.
- Store completed sessions so recent progress can be shown.
- If the page reloads or the app closes, recover saved progress safely where feasible. At minimum, preserve recorded attempts and completed sessions.
- Do not include incomplete, unreported questions in accuracy calculations.

## 10. Statistics calculations

Calculate statistics from recorded attempts rather than maintaining unrelated totals that can drift out of sync.

Definitions:

- **Attempted:** number of recorded attempts.
- **Self-reported correct:** attempts where `selfReportedCorrect === true`.
- **Self-reported incorrect:** attempts where `selfReportedCorrect === false`.
- **Accuracy:** self-reported correct divided by all recorded attempts, multiplied by 100.
- If there are no attempts, show an appropriate empty state rather than `NaN` or an error.
- Operation and difficulty breakdowns should use the operation and difficulty stored on each attempt.
- Session statistics should include only recorded attempts in that session.

Round displayed percentages to a whole number unless a more precise display is genuinely useful.

## 11. Local persistence and data management

Use `localStorage` to persist:

- App settings.
- Recorded question attempts.
- Completed sessions.
- Mistake records and skill progress.
- Any other data needed to restore the app's progress view.

Suggested keys:

```text
mathPractice.settings.v1
mathPractice.attempts.v1
mathPractice.sessions.v1
mathPractice.mistakes.v1
mathPractice.progress.v1
```

Requirements:

- Centralize persistence logic in a storage service or repository.
- Validate stored data when loading it.
- Handle missing, malformed, or outdated data without crashing the app.
- Provide safe defaults when stored data cannot be read.
- Version the stored format so future migrations can be added.
- Avoid writing excessive data on every render; save when relevant state changes.
- Resetting progress must remove the relevant app data after explicit confirmation.
- Be clear that browser-local data may be lost if the user clears browser storage or changes devices.
- Do not store passwords or sensitive personal information.

## 12. Suggested application architecture

Keep UI components separate from math generation, statistics, and persistence logic.

Suggested structure:

```text
src/
  app/
    App.tsx
    routes.tsx
  components/
    AnswerChoices.tsx
    FlipCard.tsx
    ProgressIndicator.tsx
    SessionSummary.tsx
    StatCard.tsx
    ConfirmDialog.tsx
  pages/
    HomePage.tsx
    PracticeSetupPage.tsx
    PracticePage.tsx
    StatisticsPage.tsx
    SettingsPage.tsx
  features/
    practice/
      practiceTypes.ts
      questionGenerator.ts
      answerChoiceGenerator.ts
      similarQuestionGenerator.ts
      practiceLogic.ts
    statistics/
      statistics.ts
    mistakes/
      mistakeTracking.ts
  services/
    storage.ts
  config/
    difficultyLevels.ts
  styles/
  tests/
```

The exact structure can change to suit the implementation, but keep the following concerns separate:

- Generating valid questions.
- Generating answer choices.
- Tracking attempts and sessions.
- Managing mistakes and skill progress.
- Calculating statistics.
- Reading and writing persistent data.
- Rendering UI.

Use React state or a lightweight state-management approach. Do not add a complex state library unless the app's needs justify it.

## 13. UI and visual design

The app should feel welcoming and calm rather than crowded.

Requirements:

- Use large, readable question text.
- Make answer choices large enough to tap comfortably.
- Clearly distinguish the selected answer.
- Make the flip/reveal action obvious.
- Do not rely on color alone to communicate correctness.
- Use consistent spacing, button styles, and headings.
- Use simple transitions that do not delay the child from continuing.
- Avoid excessive animation, flashing, or distracting effects.
- Provide clear empty states for statistics and mistake review.
- Show progress during fixed-length sessions.
- Keep navigation and primary actions consistent across screens.

## 14. Accessibility and responsive behavior

- Use semantic HTML and meaningful button labels.
- Ensure all interactive elements can be used with a keyboard.
- Provide a visible focus indicator.
- Maintain sufficient text/background contrast.
- Give controls accessible names.
- Announce answer-reveal and result feedback appropriately to assistive technologies.
- Do not use color as the only indication of success or error.
- Respect reduced-motion preferences.
- Support narrow mobile screens without horizontal scrolling.
- Make touch targets comfortably sized.
- Ensure the card-flip interaction remains usable when reduced motion is enabled or when animation is unavailable.

## 15. Error handling and edge cases

Handle these cases gracefully:

- No operation selected.
- No difficulty selected.
- No saved mistakes available for review.
- No attempts yet.
- Invalid or corrupted local storage.
- Duplicate answer choices generated by a random process.
- A question generator fails to find enough distinct distractors.
- The user tries to submit a result twice.
- The user exits an unfinished session.
- A stored session or mistake references a question that is no longer available.
- The browser does not allow storage or storage writes fail.

Show helpful messages where user action is needed. Do not expose raw stack traces or technical errors to children.

## 16. Testing requirements

Use unit tests for the core logic and component tests for key user flows.

### 16.1 Question generation tests

- Each operation generates a mathematically valid question.
- Subtraction follows the configured non-negative-result rule.
- Division never uses zero as the divisor.
- Division questions have exact whole-number answers.
- The correct answer matches the displayed operands and operator.
- Generated answer choices are distinct and include the correct answer exactly once.
- Generated values respect the selected difficulty configuration.

### 16.2 Practice flow tests

- A child can select an answer.
- The card reveals the correct answer.
- The result actions appear after reveal.
- No attempt is recorded before self-report.
- Choosing either result action records exactly one attempt.
- Repeated clicks do not duplicate an attempt.
- The next question appears after a result is recorded.
- Fixed-length sessions finish at the correct time.
- Continuous sessions can be ended intentionally.

### 16.3 Mistake and statistics tests

- A self-reported incorrect result creates or updates a mistake record.
- A self-reported correct result is counted correctly even if it differs from the selected choice.
- Similar questions use the appropriate operation, difficulty, or skill.
- Statistics are calculated correctly from attempts.
- Empty statistics do not produce invalid percentages.
- Mastery counts consecutive correct related attempts as configured.

### 16.4 Persistence tests

- Settings and progress are saved.
- Saved data is restored after reload.
- Malformed data does not crash the app.
- Resetting progress requires confirmation and clears the intended data.

### 16.5 UI tests

- Setup validation works.
- The main practice flow works from start to finish.
- Mistake review has a helpful empty state.
- Statistics render with and without saved attempts.
- Settings reset can be cancelled or confirmed.

## 17. Performance and maintainability

- Keep dependencies minimal.
- Avoid unnecessary re-renders and expensive calculations.
- Use stable IDs for questions, attempts, and sessions.
- Keep random generation separate from UI rendering so it can be tested.
- Avoid duplicating the same business rules across components.
- Keep TypeScript types explicit for core data structures.
- Use reusable components where doing so improves consistency.
- Ensure the app remains usable with a large local attempt history; calculate summaries efficiently when needed.

## 18. Privacy and security

- No login or account is required.
- The initial version does not need a backend.
- Do not send practice history to external services.
- Do not collect personal information.
- Clearly explain that data is stored locally in the browser.
- Do not imply that progress will automatically transfer to another device.
- Treat local storage as untrusted input and validate it before use.

## 19. Implementation milestones

Recommended order:

1. **Project foundation:** create the React/TypeScript project and establish basic navigation and styling.
2. **Math engine:** implement and test question generation for all four operations and all difficulty levels.
3. **Answer choices:** generate four distinct choices with the correct answer exactly once.
4. **Practice interaction:** implement the card, answer selection, reveal, self-report, and next-question flow.
5. **Session handling:** support fixed-length and continuous sessions plus the summary screen.
6. **Persistence:** save and restore attempts, sessions, settings, and mistakes.
7. **Statistics:** calculate overall, operation, difficulty, and session metrics.
8. **Mistake review:** save wrong questions and generate related practice.
9. **Settings:** add reset confirmation and storage information.
10. **Quality pass:** accessibility, responsive design, edge cases, tests, and release checks.

## 20. Acceptance criteria

The initial release is acceptable when all of the following are true:

- [x] A child can start practicing without creating an account.
- [x] The child can choose one or more operations and difficulty levels.
- [x] Addition, subtraction, multiplication, and division questions are generated correctly.
- [x] Division questions use exact whole-number answers and never divide by zero.
- [x] Each question shows four distinct answer choices, including the correct answer exactly once.
- [x] The child can select an answer and flip the card to reveal the correct answer.
- [x] The child can report **I Got It Right** or **I Got It Wrong** after reveal.
- [x] The app records each self-reported result exactly once.
- [x] Incorrectly reported questions are saved for future review.
- [x] Similar questions can be generated for a saved mistake or skill.
- [x] Fixed-length sessions end after the requested number of recorded attempts.
- [x] Continuous sessions can be ended by the child.
- [x] The summary shows attempted, self-reported correct, self-reported incorrect, and accuracy.
- [x] Statistics show overall results and breakdowns by operation and difficulty.
- [x] Progress persists after refreshing the browser.
- [x] The child can review saved mistakes.
- [x] The child can reset progress after confirming the action.
- [x] Empty, invalid, and corrupted stored data are handled without crashing the app.
- [x] The main flow is usable on mobile and desktop.
- [x] Core math logic, attempt tracking, statistics, and persistence have automated tests.

## 21. Future enhancements

Consider these only after the initial version is stable:

- More flexible difficulty settings.
- Timed practice as an optional mode.
- Additional number concepts, fractions, or decimals.
- Printable practice sheets.
- Parent/teacher views.
- Export/import of local progress.
- Optional cloud sync with explicit user consent.
- More detailed skill-level recommendations.

Do not add future enhancements at the expense of the core practice, feedback, mistake-review, and statistics flows.

---

## Appendix: How This Repository Implements the Specification

This appendix was added after implementation. It maps the specification's _suggested_ names and
structure to the actual project, and lists deliberate differences. The requirements above are
unchanged; all acceptance criteria in §20 are met.

### Where each concern lives (§12)

| Concern                                 | Location                                                                                                         |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| App entry and routes                    | `src/App.tsx`, `src/routes.tsx`                                                                                  |
| Pages                                   | `src/pages/` (Home, Practice Setup, Practice Session, Session Summary, Statistics, Settings, Privacy, Not Found) |
| Flip card, answer choices, explanations | `src/components/question-card/`                                                                                  |
| Progress indicator, end-session control | `src/components/session/`                                                                                        |
| Statistic tiles and cards               | `src/components/stats/`                                                                                          |
| Confirmation dialog, buttons, switches  | `src/components/ui/`                                                                                             |
| Difficulty levels (one central config)  | `src/config/difficultyRules.ts`                                                                                  |
| Question generation and validation      | `src/utils/questions/`                                                                                           |
| Answer choices (distractors)            | `src/utils/questions/answerChoices.ts`                                                                           |
| Similar questions, mistakes, mastery    | `src/utils/mistakes/`                                                                                            |
| Practice session logic                  | `src/utils/session/`, `src/hooks/usePracticeSession.ts`                                                          |
| Statistics calculations                 | `src/utils/statistics.ts`                                                                                        |
| Persistence (storage service)           | `src/services/storage.ts`, `src/services/appData.ts`, `src/services/validators.ts`                               |
| Shared types                            | `src/types/`                                                                                                     |
| Tests                                   | next to the code they test (`*.test.ts`, `*.test.tsx`), plus `src/test/`                                         |

### Data models (§6.1, §7, §8, §9)

| Specification                                          | This project                                                               |
| ------------------------------------------------------ | -------------------------------------------------------------------------- |
| `MathQuestion` (`operandA`, `operandB`, …)             | `Question` in `src/types/question.ts` (`firstOperand`, `secondOperand`, …) |
| `skillKey`                                             | computed by `factKey()` in `src/utils/mistakes/mistakePatterns.ts`         |
| `QuestionAttempt.selfReportedCorrect`                  | `PracticeAttempt.result` (`'correct'` or `'incorrect'`)                    |
| `QuestionAttempt.mode`                                 | `PracticeAttempt.source` (`'regular'` or `'mistake-review'`)               |
| `MistakeRecord`                                        | `MistakePattern` in `src/types/mistake.ts`                                 |
| `PracticeSession.difficulties`, `plannedQuestionCount` | `PracticeSession.difficulties`, `sessionLength`                            |

### Storage keys (§11)

Keys use the prefix `mathPractice:` (for example `mathPractice:settings`, `mathPractice:attempts`,
`mathPractice:sessions`, `mathPractice:mistakePatterns`). Instead of a version in each key name,
a single `mathPractice:schemaVersion` key (currently `3`) records the format, and migrations in
`src/services/appData.ts` upgrade older data automatically.

### Deliberate differences

- **Mastery (§8):** mastery comes after three correct related answers (adjustable from 2 to 5 in
  Settings). A related wrong answer takes away **one** step instead of resetting to zero, which
  is gentler for children. A mastered fact missed again in regular practice starts over.
- **Review status (§8):** two states, "still learning" and "mastered", shown with progress
  ("2 of 3 to master"), instead of three named states.
- **Reset (§4.6):** Statistics has **Reset Statistics** (clears answers, sessions, and mistakes;
  keeps settings). Settings has **Clear All Application Data** (clears everything). Both ask for
  confirmation and can be cancelled.
- **Difficulty ranges (§5):** every range stays within the limits in §5, and some are narrower
  (for example, additions keep the answer within the level's number, and Intermediate leaves out
  ×0 and ×1). Advanced multiplication is a one-digit number times 11–20. This is checked by
  `src/config/difficultyRules.test.ts`.

### Beyond the initial scope

Added during development: keyboard shortcuts, color vision themes, a correct-answer chime,
"How to solve it" explanations, encouraging messages, resuming unfinished sessions, and a
Privacy page. See `TODO.md` Phases 16–23.
