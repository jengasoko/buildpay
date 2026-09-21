import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PublicSiteLayout } from '@/pages/Public/PublicSiteLayout';

describe('PublicSiteLayout', () => {
  it('renders brand, navigation and sign in CTA', () => {
    render(
      <BrowserRouter>
        <PublicSiteLayout />
      </BrowserRouter>,
    );
    expect(screen.getAllByText('BuildPay').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Our Projects').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Properties').length).toBeGreaterThan(0);
    expect(screen.getAllByText('About Us').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Contact').length).toBeGreaterThan(0);
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText('Get a quote')).toBeInTheDocument();
  });

  it('renders footer', () => {
    render(
      <BrowserRouter>
        <PublicSiteLayout />
      </BrowserRouter>,
    );
    expect(screen.getByText('© 2026 BuildPay — Constructors & Co.')).toBeInTheDocument();
    expect(screen.getByText('info@constructors.co.tz')).toBeInTheDocument();
  });
});