// Ejemplo de uso del sistema de autenticación con JWT y localStorage

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';

// Ejemplo 1: Componente que muestra información del usuario
export const UserProfile: React.FC = () => {
  const { user, token, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in to view your profile</div>;
  }

  return (
    <div>
      <h2>User Profile</h2>
      <p>ID: {user?.id}</p>
      <p>Username: {user?.username}</p>
      <p>Email: {user?.email}</p>
      <p>Token: {token?.substring(0, 20)}...</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

// Ejemplo 2: Componente que hace requests autenticados
export const FarmsExample: React.FC = () => {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(false);
  const api = useApi();

  useEffect(() => {
    const fetchFarms = async () => {
      if (!api.isAuthenticated) return;
      
      try {
        setLoading(true);
        const response = await api.get('/farms');
        setFarms(response.data);
      } catch (error) {
        console.error('Error fetching farms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFarms();
  }, [api]);

  if (!api.isAuthenticated) {
    return <div>Please log in to view farms</div>;
  }

  return (
    <div>
      <h2>My Farms</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {farms.map((farm: any) => (
            <li key={farm.id}>{farm.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Ejemplo 3: Login programático (por ejemplo, después de registro)
export const ProgrammaticLogin: React.FC = () => {
  const { login } = useAuth();

  const handleAutoLogin = () => {
    // Simular respuesta del backend después de un registro exitoso
    const mockResponse = {
      id: 1,
      username: 'diego',
      email: 'diego@coffeetech.com',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    };

    // Guardar automáticamente en localStorage y state
    login(mockResponse);
  };

  return (
    <button onClick={handleAutoLogin}>
      Simulate Auto Login
    </button>
  );
};

// Ejemplo 4: Hook personalizado para operaciones específicas
export const useFarmOperations = () => {
  const api = useApi();

  const createFarm = async (farmData: any) => {
    try {
      const response = await api.post('/farms', farmData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create farm');
    }
  };

  const updateFarm = async (farmId: string, farmData: any) => {
    try {
      const response = await api.put(`/farms/${farmId}`, farmData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update farm');
    }
  };

  const deleteFarm = async (farmId: string) => {
    try {
      await api.delete(`/farms/${farmId}`);
      return true;
    } catch (error) {
      throw new Error('Failed to delete farm');
    }
  };

  const getFarmSections = async (farmId: string) => {
    try {
      const response = await api.get(`/farms/${farmId}/sections`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch farm sections');
    }
  };

  return {
    createFarm,
    updateFarm,
    deleteFarm,
    getFarmSections,
  };
};

/* 
INSTRUCCIONES DE USO:

1. LOGIN CON CREDENCIALES:
   const { loginWithCredentials } = useAuth();
   await loginWithCredentials('email@test.com', 'password');

2. LOGIN PROGRAMÁTICO (después de registro):
   const { login } = useAuth();
   login({
     id: 1,
     username: 'user',
     email: 'user@test.com',
     token: 'jwt-token-here'
   });

3. HACER REQUESTS AUTENTICADOS:
   const api = useApi();
   const response = await api.get('/protected-endpoint');
   const data = await api.post('/create-something', { name: 'test' });

4. VERIFICAR ESTADO DE AUTENTICACIÓN:
   const { user, token, isAuthenticated } = useAuth();
   if (isAuthenticated) {
     // Usuario logueado
   }

5. LOGOUT:
   const { logout } = useAuth();
   logout(); // Limpia localStorage y state

6. LA SESIÓN PERSISTE AUTOMÁTICAMENTE:
   - Al recargar la página (F5, Ctrl+R, etc.)
   - Los datos se restauran desde localStorage
   - El token se incluye automáticamente en todas las requests

7. MANEJO DE TOKENS EXPIRADOS:
   - Si el backend responde 401, se hace logout automático
   - El usuario es redirigido a /login
*/