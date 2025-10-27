import { render, screen, fireEvent } from '@testing-library/react';
import Footer from '@/components/Footer';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

describe('Footer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders footer with all sections', () => {
    render(<Footer />);
    
    // Check that all section titles are present (mobile button + desktop heading + desktop link)
    expect(screen.getAllByText('Om oss')).toHaveLength(3); // Mobile button + desktop heading + desktop link
    expect(screen.getAllByText('Vanliga frågor')).toHaveLength(2); // Mobile button + desktop heading
    expect(screen.getAllByText('Juridiskt')).toHaveLength(2); // Mobile button + desktop heading
  });

  it('renders copyright text', () => {
    render(<Footer />);
    
    expect(screen.getByText(/© 2025 Elbespararen/)).toBeInTheDocument();
    expect(screen.getByText(/Byggd med ❤️ för att göra elmarknaden mer transparent/)).toBeInTheDocument();
  });

  it('toggles accordion sections on mobile', () => {
    render(<Footer />);
    
    // Find the "Om oss" section button (mobile version)
    const mobileButtons = screen.getAllByRole('button', { name: /om oss/i });
    const omOssButton = mobileButtons[0]; // First one is mobile
    
    // Initially should be closed (aria-expanded="false")
    expect(omOssButton).toHaveAttribute('aria-expanded', 'false');
    
    // Click to open
    fireEvent.click(omOssButton);
    
    // Now should be open (aria-expanded="true")
    expect(omOssButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('has proper accessibility attributes', () => {
    render(<Footer />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-expanded');
    });
  });

  it('renders all links with proper href attributes', () => {
    render(<Footer />);
    
    // Check that all expected links are present
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    
    // Check specific links exist
    expect(screen.getByRole('link', { name: 'Om oss' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'Kontakt' })).toHaveAttribute('href', '/contact');
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faq');
  });
});
