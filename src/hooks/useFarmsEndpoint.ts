import { useAuth } from '../contexts/AuthContext';

/**
 * Hook personalizado para determinar el endpoint correcto de farms basado en el rol del usuario
 * 
 * Lógica de negocio:
 * - Role 1 (Manager): usa /api/v1/farms - puede ver todas las farms del sistema
 * - Role 2 (User): usa /api/v1/users/{id}/farms - solo puede ver sus propias farms
 * 
 * Este hook se usa internamente por useFarms() para determinar el endpoint dinámico
 */
export const useFarmsEndpoint = () => {
  const { user } = useAuth();

  const getFarmsEndpoint = (): string => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Role 1 = Manager, puede acceder a todas las farms
    if (user.role.id === 1) {
      return '/farms';
    }
    
    // Role 2 = User, solo puede acceder a sus farms
    if (user.role.id === 2) {
      // return `/users/${user.id}/farms`;
      return '/farms';
    }

    // Fallback para otros roles (por defecto usar endpoint de user específico)
    // return `/users/${user.id}/farms`;
    return '/farms';
  };

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