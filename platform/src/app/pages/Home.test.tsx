import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Home from './Home';

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

describe('Home page', () => {
  it('renders the headline', () => {
    renderHome();
    expect(screen.getByText(/Turn research into video/i)).toBeInTheDocument();
  });

  it('renders example paper buttons', () => {
    renderHome();
    expect(screen.getAllByText(/Attention Is All You Need/i).length).toBeGreaterThan(0);
  });

  it('has the Generate button disabled when no file or URL is provided', () => {
    renderHome();
    const btn = screen.getByRole('button', { name: /Generate/i });
    expect(btn).toBeDisabled();
  });
});
