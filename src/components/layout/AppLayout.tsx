import { Outlet } from 'react-router';
import { AppHeader } from './AppHeader';
import { PageContainer } from './PageContainer';

/** Shared frame for every page: header, navigation, and centered content. */
export function AppLayout() {
  return (
    <>
      <AppHeader />
      <main id="main-content" tabIndex={-1}>
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>
    </>
  );
}
