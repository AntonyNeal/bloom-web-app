import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';

// Mock the lazy-loaded components
vi.mock('../pages/Home', () => ({ default: () => <div>Home Page</div> }));
vi.mock('../pages/About', () => ({ default: () => <div>About Page</div> }));
vi.mock('../pages/Services', () => ({
  default: () => <div>Services Page</div>,
}));
vi.mock('../pages/IndividualTherapy', () => ({
  default: () => <div>Individual Therapy Page</div>,
}));
vi.mock('../pages/CouplesTherapy', () => ({
  default: () => <div>Couples Therapy Page</div>,
}));
vi.mock('../pages/AnxietyDepression', () => ({
  default: () => <div>Anxiety Depression Page</div>,
}));
vi.mock('../pages/Neurodiversity', () => ({
  default: () => <div>Neurodiversity Page</div>,
}));
vi.mock('../pages/NDISServices', () => ({
  default: () => <div>NDIS Services Page</div>,
}));
vi.mock('../pages/TraumaRecovery', () => ({
  default: () => <div>Trauma Recovery Page</div>,
}));
vi.mock('../pages/GreaterHunter', () => ({
  default: () => <div>Greater Hunter Page</div>,
}));
vi.mock('../pages/FAQ', () => ({ default: () => <div>FAQ Page</div> }));
vi.mock('../pages/Appointments', () => ({
  default: () => <div>Appointments Page</div>,
}));
vi.mock('../pages/Privacy', () => ({ default: () => <div>Privacy Page</div> }));
vi.mock('../pages/Assessment', () => ({
  default: () => <div>Assessment Page</div>,
}));

// Mock components
vi.mock('../components/Header', () => ({
  default: () => <header>Header</header>,
}));
vi.mock('../components/Footer', () => ({
  default: () => <footer>Footer</footer>,
}));
vi.mock('../components/LoadingSpinner', () => ({
  default: ({ message }: { message: string }) => <div>{message}</div>,
}));
vi.mock('../components/ErrorBoundary', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock('../components/ScrollToTop', () => ({
  default: () => <div>ScrollToTop</div>,
}));
vi.mock('../components/ChatAssistant', () => ({
  default: () => <div>ChatAssistant</div>,
}));

// Mock utilities
vi.mock('../utils/analytics', () => ({
  initAnalytics: vi.fn(),
  intentScorer: { trackReturnVisit: vi.fn() },
}));
vi.mock('../utils/googleAds', () => ({
  injectGoogleAdsTag: vi.fn(),
}));
vi.mock('../utils/serviceWorker', () => ({
  registerServiceWorker: vi.fn(),
}));

// Mock react-helmet-async
vi.mock('react-helmet-async', () => ({
  HelmetProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Helmet: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('App', () => {
  it('renders without crashing', () => {
    renderWithRouter(<App />);
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('renders home page by default', async () => {
    renderWithRouter(<App />);
    expect(await screen.findByText('Home Page')).toBeInTheDocument();
  });
});
