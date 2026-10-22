import { Link, useLocation } from 'react-router';
import styles from './MainNav.module.css';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: '🏠', matches: (path: string) => path === '/' },
  // Practice stays highlighted on setup, the session, and the summary
  {
    to: '/practice/setup',
    label: 'Practice',
    icon: '✏️',
    matches: (path: string) => path.startsWith('/practice'),
  },
  {
    to: '/statistics',
    label: 'Statistics',
    icon: '📊',
    matches: (path: string) => path.startsWith('/statistics'),
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: '⚙️',
    matches: (path: string) => path.startsWith('/settings'),
  },
];

export function MainNav() {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Main">
      <ul className={styles.list}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.matches(pathname);
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={isActive ? `${styles.link} ${styles.active}` : styles.link}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={styles.icon} aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
