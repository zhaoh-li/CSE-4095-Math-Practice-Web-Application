import { NavLink } from 'react-router';
import styles from './MainNav.module.css';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/practice/setup', label: 'Practice', icon: '✏️', end: false },
  { to: '/statistics', label: 'Statistics', icon: '📊', end: false },
  { to: '/settings', label: 'Settings', icon: '⚙️', end: false },
];

export function MainNav() {
  return (
    <nav aria-label="Main">
      <ul className={styles.list}>
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              <span className={styles.icon} aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
