import { useAuth } from '../../hooks/useAuth';

/**
 * Logout Button Component
 * Styled to match Bloom's design system
 */
export const LogoutButton = () => {
  const { logout, isLoading, user } = useAuth();

  if (!user) return null;

  return (
    <button
      onClick={logout}
      disabled={isLoading}
      className="px-6 py-2.5 bg-transparent text-eucalyptusSage border-2 border-eucalyptusSage
                 rounded-lg font-medium hover:bg-eucalyptusSage hover:text-white
                 transition-all duration-200
                 disabled:opacity-50 disabled:cursor-not-allowed
                 focus:outline-none focus:ring-2 focus:ring-eucalyptusSage focus:ring-offset-2"
    >
      {isLoading ? 'Signing out...' : 'Sign out'}
    </button>
  );
};
