import { Outlet } from 'react-router';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { DataNotice } from './DataNotice';
import { PageContainer } from './PageContainer';

/** Shared frame for every page: header, navigation, and centered content. */
export function AppLayout() {
  return (
    <>
      <AppHeader />
      <main id="main-content" tabIndex={-1}>
        <PageContainer>
          <DataNotice />
          <Outlet />
        </PageContainer>
      </main>
      <AppFooter />
    </>
  );
}
