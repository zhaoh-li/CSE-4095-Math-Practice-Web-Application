import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from './AppRoutes';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('App routing', () => {
  it('shows the home page with its three buttons', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: /welcome/i })).toBeInTheDocument();
    const main = within(screen.getByRole('main'));
    expect(main.getByRole('link', { name: 'Start Practice' })).toHaveAttribute(
      'href',
      '/practice/setup',
    );
    expect(main.getByRole('link', { name: 'View Statistics' })).toHaveAttribute(
      'href',
      '/statistics',
    );
    expect(main.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');
  });

  it.each([
    ['Start Practice', 'Set Up Your Practice'],
    ['View Statistics', 'Your Statistics'],
  ])('goes to the right page when "%s" is clicked', async (buttonText, pageTitle) => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(within(screen.getByRole('main')).getByRole('link', { name: buttonText }));
    expect(screen.getByRole('heading', { level: 1, name: pageTitle })).toBeInTheDocument();
  });

  it('opens Settings from the home page with the keyboard', async () => {
    const user = userEvent.setup();
    renderAt('/');
    within(screen.getByRole('main')).getByRole('link', { name: 'Settings' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
  });

  it.each([
    ['/practice/setup', 'Set Up Your Practice'],
    ['/practice/session', 'Set Up Your Practice'], // redirects without setup
    ['/practice/summary', 'No Results Yet'],
    ['/statistics', 'Your Statistics'],
    ['/settings', 'Settings'],
  ])('renders %s', (path, title) => {
    renderAt(path);
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
  });

  it('shows a not-found page for unknown routes', () => {
    renderAt('/does-not-exist');
    expect(screen.getByRole('heading', { level: 1, name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to home/i })).toHaveAttribute('href', '/');
  });

  it('marks the current page in the navigation', () => {
    renderAt('/statistics');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(nav.querySelector('[aria-current="page"]')).toHaveTextContent('Statistics');
  });
});
