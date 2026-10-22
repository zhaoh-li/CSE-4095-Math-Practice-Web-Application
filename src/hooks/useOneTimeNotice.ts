import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

/**
 * Reads a one-time message passed to this page (e.g. "All app data was
 * cleared."), keeps showing it, and removes it from the browser history entry
 * so it doesn't come back after a refresh.
 */
export function useOneTimeNotice(): string | null {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as Record<string, unknown> | null;
  const [notice] = useState(() => (typeof state?.notice === 'string' ? state.notice : null));

  useEffect(() => {
    if (state?.notice === undefined) return;
    const { notice: _shown, ...rest } = state;
    void _shown;
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      { replace: true, state: Object.keys(rest).length > 0 ? rest : null },
    );
  }, [state, location.pathname, location.search, location.hash, navigate]);

  return notice;
}
