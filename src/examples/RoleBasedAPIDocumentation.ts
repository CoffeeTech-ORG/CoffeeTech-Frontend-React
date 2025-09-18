/**
 * ROLE-BASED FARMS API IMPLEMENTATION
 * 
 * Esta implementación permite que la aplicación use diferentes endpoints de farms
 * basados en el rol del usuario autenticado.
 * 
 * ROLES SOPORTADOS:
 * - Role ID 1 (Manager): Acceso a todas las farms usando /api/v1/farms
 * - Role ID 2 (User): Acceso solo a sus farms usando /api/v1/users/{userId}/farms
 * 
 * ESTRUCTURA DE RESPUESTA DE LOGIN:
 * {
 *   "id": 1,
 *   "username": "diego",
 *   "email": "diego@coffeetech.com",
 *   "role": {
 *     "id": 1,
 *     "name": "Manager"
 *   },
 *   "token": "eyJhbGciOiJodHRwOi8v..."
 * }
 * 
 * USO EN COMPONENTES:
 * 
 * ```tsx
 * import { useFarms } from '../hooks/useFarms';
 * 
 * const MyComponent = () => {
 *   const { getFarms, isManager } = useFarms();
 * 
 *   const loadFarms = async () => {
 *     try {
 *       // Automáticamente usa el endpoint correcto basado en el rol
 *       const farms = await getFarms();
 *       console.log('Farms loaded:', farms);
 *       
 *       if (isManager) {
 *         console.log('User is Manager - seeing all farms');
 *       } else {
 *         console.log('User is regular user - seeing only their farms');
 *       }
 *     } catch (error) {
 *       console.error('Failed to load farms:', error);
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={loadFarms}>Load Farms</button>
 *     </div>
 *   );
 * };
 * ```
 * 
 * ARCHIVOS MODIFICADOS:
 * - src/contexts/AuthContext.tsx: Agregado soporte para role en User y LoginResponse
 * - src/services/auth.service.ts: Actualizado para incluir role en las respuestas
 * - src/hooks/useFarmsEndpoint.ts: Nuevo hook para determinar endpoint dinámico
 * - src/hooks/useFarms.ts: Nuevo hook que reemplaza farmsService con lógica basada en roles
 * - src/components/Dashboard/Dashboard.tsx: Actualizado para usar useFarms hook
 * - src/components/Dashboard/FarmSections/FarmSections.tsx: Actualizado para usar useFarms hook
 * 
 * COMPATIBILIDAD:
 * - El farmsService original se mantiene intacto para compatibilidad hacia atrás
 * - Los nuevos hooks son opt-in, puedes migrar componente por componente
 * - La lógica de autenticación ahora almacena y usa la información del rol
 */

export const ROLE_BASED_API_DOCUMENTATION = {
  MANAGER_ROLE_ID: 1,
  USER_ROLE_ID: 2,
  ENDPOINTS: {
    MANAGER: '/api/v1/farms',
    USER: '/api/v1/users/{userId}/farms'
  }
};