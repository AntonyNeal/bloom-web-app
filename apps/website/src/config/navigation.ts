/**
 * Navigation Configuration
 * Centralizes navigation items for consistent routing across the application
 */

export interface NavigationItem {
  name: string;
  path: string;
  icon?: string;
  external?: boolean;
  variant?: 'default' | 'special' | 'feature';
  requiresFeatureFlag?: string;
}

export interface NavigationGroup {
  title?: string;
  items: NavigationItem[];
}

/**
 * Main navigation items for the application
 */
export const mainNavigation: NavigationItem[] = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Services', path: '/services' },
  { name: 'How to Book', path: '/appointments' },
  { name: 'Fees & Funding', path: '/pricing' },
  {
    name: 'Assessment',
    path: '/assessment',
    variant: 'feature',
    requiresFeatureFlag: 'VITE_ASSESSMENT_ENABLED',
    icon: '📊',
  },
];

/**
 * Service navigation items
 */
export const serviceNavigation: NavigationItem[] = [
  { name: 'Individual Therapy', path: '/individual-therapy' },
  { name: 'Couples Therapy', path: '/couples-therapy' },
  { name: 'Anxiety & Depression', path: '/anxiety-depression' },
  { name: 'Trauma Recovery', path: '/trauma-recovery' },
  { name: 'Neurodiversity', path: '/neurodiversity' },
  { name: 'NDIS Services', path: '/ndis-services' },
];

/**
 * Footer navigation items
 */
export const footerNavigation: NavigationGroup[] = [
  {
    title: 'Services',
    items: serviceNavigation,
  },
  {
    title: 'Resources',
    items: [
      { name: 'FAQ', path: '/faq' },
      { name: 'Contact', path: '/contact' },
      { name: 'Join Us', path: 'https://bloom.life-psychology.com.au' },
    ],
  },
  {
    title: 'Legal',
    items: [{ name: 'Privacy Policy', path: '/privacy' }],
  },
];

/**
 * Check if a given path matches a navigation item
 * Handles nested routes and service pages
 */
export function isActivePath(currentPath: string, itemPath: string): boolean {
  if (itemPath === '/services') {
    return (
      currentPath.includes('/services') ||
      currentPath.includes('/individual-therapy') ||
      currentPath.includes('/couples-therapy') ||
      currentPath.includes('/anxiety-depression') ||
      currentPath.includes('/trauma-recovery') ||
      currentPath.includes('/neurodiversity') ||
      currentPath.includes('/ndis-services')
    );
  }
  return currentPath === itemPath;
}

/**
 * Filter navigation items based on feature flags
 */
export function filterNavigationByFeatureFlags(
  items: NavigationItem[],
  getFeatureFlag: (flag: string) => boolean
): NavigationItem[] {
  return items.filter((item) => {
    if (!item.requiresFeatureFlag) return true;
    return getFeatureFlag(item.requiresFeatureFlag);
  });
}
