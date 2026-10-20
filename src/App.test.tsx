import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('shows the app title', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /math practice/i })).toBeInTheDocument();
  });
});
