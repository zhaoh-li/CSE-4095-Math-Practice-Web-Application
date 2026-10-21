import { lazy, Suspense, type ComponentType } from 'react';
import type { RouteObject } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorPage } from './components/layout/ErrorPage';
import { PageLoading } from './components/layout/PageLoading';
import { SettingsProvider } from './context/SettingsProvider';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PracticeSessionPage } from './pages/PracticeSessionPage';
import { PracticeSetupPage } from './pages/PracticeSetupPage';
import { SessionSummaryPage } from './pages/SessionSummaryPage';

/** Pages that are downloaded only when first opened, to keep the first load small. */
export interface OnDemandPages {
  StatisticsPage: ComponentType;
  SettingsPage: ComponentType;
  PrivacyPage: ComponentType;
}

const LAZY_PAGES: OnDemandPages = {
  StatisticsPage: lazy(() =>
    import('./pages/StatisticsPage').then((m) => ({ default: m.StatisticsPage })),
  ),
  SettingsPage: lazy(() =>
    import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
  ),
  PrivacyPage: lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage }))),
};

function page(Page: ComponentType) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Page />
    </Suspense>
  );
}

/**
 * The app's routes. Tests pass already-loaded pages so they render right away;
 * the real app uses the on-demand versions.
 */
export function createAppRoutes(pages: OnDemandPages = LAZY_PAGES): RouteObject[] {
  return [
    {
      element: (
        <SettingsProvider>
          <AppLayout />
        </SettingsProvider>
      ),
      children: [
        {
          // An error inside a page shows a friendly message and keeps the header
          errorElement: <ErrorPage />,
          children: [
            { index: true, element: <HomePage /> },
            {
              path: 'practice',
              children: [
                { path: 'setup', element: <PracticeSetupPage /> },
                { path: 'session', element: <PracticeSessionPage /> },
                { path: 'summary', element: <SessionSummaryPage /> },
              ],
            },
            { path: 'statistics', element: page(pages.StatisticsPage) },
            { path: 'settings', element: page(pages.SettingsPage) },
            { path: 'privacy', element: page(pages.PrivacyPage) },
            { path: '*', element: <NotFoundPage /> },
          ],
        },
      ],
    },
  ];
}
