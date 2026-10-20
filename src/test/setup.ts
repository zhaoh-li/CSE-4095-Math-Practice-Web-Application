// Adds DOM matchers like toBeInTheDocument() to Vitest's expect.
import '@testing-library/jest-dom/vitest';

// Each test starts with empty storage and the default color theme
afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.colorVision;
});
