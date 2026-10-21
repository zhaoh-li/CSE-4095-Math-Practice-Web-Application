import { useState } from 'react';
import { createMemoryRouter, RouterProvider, type InitialEntry } from 'react-router';
import { PrivacyPage } from '../pages/PrivacyPage';
import { SettingsPage } from '../pages/SettingsPage';
import { StatisticsPage } from '../pages/StatisticsPage';
import { createAppRoutes } from '../routes';

/** The whole app in memory, starting at the given URL(s). Pages load right away. */
export function TestApp({ initialEntries }: { initialEntries: InitialEntry[] }) {
  const [router] = useState(() =>
    createMemoryRouter(createAppRoutes({ StatisticsPage, SettingsPage, PrivacyPage }), {
      initialEntries,
    }),
  );
  return <RouterProvider router={router} />;
}
