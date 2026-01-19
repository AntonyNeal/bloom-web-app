import { useAuth } from '@/hooks/useAuth';

/**
 * Login Button Component
 * Styled to match Bloom's design system
 */
export const LoginButton = () => {
  const { login, isLoading } = useAuth();

  return (
    <button
      onClick={login}
      disabled={isLoading}
      className="px-6 py-2.5 bg-eucalyptusSage text-white rounded-lg font-medium
                 hover:bg-opacity-90 transition-all duration-200
                 disabled:opacity-50 disabled:cursor-not-allowed
                 focus:outline-none focus:ring-2 focus:ring-eucalyptusSage focus:ring-offset-2"
    >
      {isLoading ? 'Signing in...' : 'Sign in'}
    </button>
  );
};
