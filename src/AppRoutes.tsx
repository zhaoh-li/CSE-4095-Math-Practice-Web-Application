import { Route, Routes } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { PracticeSessionPage } from './pages/PracticeSessionPage';
import { PracticeSetupPage } from './pages/PracticeSetupPage';
import { SessionSummaryPage } from './pages/SessionSummaryPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="practice">
          <Route path="setup" element={<PracticeSetupPage />} />
          <Route path="session" element={<PracticeSessionPage />} />
          <Route path="summary" element={<SessionSummaryPage />} />
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
