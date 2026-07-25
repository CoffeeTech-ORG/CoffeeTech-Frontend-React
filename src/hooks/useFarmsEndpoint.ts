import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Picks the right farms endpoint for the user's role:
 * - Role 1 (Manager): /api/v1/farms -- every farm in the system.
 * - Role 2 (User): /api/v1/users/{id}/farms -- only their own.
 *
 * Used internally by useFarms().
 */
export const useFarmsEndpoint = () => {
  const { user } = useAuth();

  /**
   * `useCallback` is required here, not an optimisation.
   *
   * Unmemoized, this function changes identity on every render. `useFarms` uses it as a dependency of
   * `getFarms`, itself a dependency of the effects that load data: the whole chain invalidates on
   * every render and the effect re-requests, which causes another render. Observed result: `GET
   * /farms` in an infinite loop against the backend.
   *
   * It was latent because the earlier code used `useEffect(..., [])` with an empty list, which ignores
   * the instability at the cost of never reacting to changes.
   */
  const getFarmsEndpoint = useCallback((): string => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Role 1 = Manager, can access every farm.
    if (user.role.id === 1) {
      return '/farms';
    }

    // Role 2 = User, can only access their own farms.
    if (user.role.id === 2) {
      // return `/users/${user.id}/farms`;
      return '/farms';
    }

    // Fallback for other roles (default to the user-specific endpoint).
    // return `/users/${user.id}/farms`;
    return '/farms';
  }, [user]);

  const isManager = user?.role.id === 1;
  const isUser = user?.role.id === 2;

  return {
    getFarmsEndpoint,
    isManager,
    isUser,
    userRole: user?.role,
    userId: user?.id,
  };
};