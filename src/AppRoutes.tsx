import { Route, Routes } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { SettingsProvider } from './context/SettingsProvider';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PracticeSessionPage } from './pages/PracticeSessionPage';
import { PracticeSetupPage } from './pages/PracticeSetupPage';
import { SessionSummaryPage } from './pages/SessionSummaryPage';
import { SettingsPage } from './pages/SettingsPage';
import { StatisticsPage } from './pages/StatisticsPage';

export function AppRoutes() {
  return (
    <SettingsProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="practice">
            <Route path="setup" element={<PracticeSetupPage />} />
            <Route path="session" element={<PracticeSessionPage />} />
            <Route path="summary" element={<SessionSummaryPage />} />
          </Route>
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </SettingsProvider>
  );
}
