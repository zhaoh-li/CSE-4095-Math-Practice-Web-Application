import { Route, Routes } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="practice">
          <Route
            path="setup"
            element={
              <PlaceholderPage
                title="Practice Setup"
                description="Choose operations, difficulty, and session length. Coming soon!"
              />
            }
          />
          <Route
            path="session"
            element={
              <PlaceholderPage
                title="Practice Session"
                description="Flash cards are coming soon!"
              />
            }
          />
          <Route
            path="summary"
            element={
              <PlaceholderPage
                title="Session Summary"
                description="Your session results will appear here."
              />
            }
          />
        </Route>
        <Route
          path="statistics"
          element={
            <PlaceholderPage title="Statistics" description="Your progress will appear here." />
          }
        />
        <Route
          path="settings"
          element={<PlaceholderPage title="Settings" description="App settings are coming soon!" />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
