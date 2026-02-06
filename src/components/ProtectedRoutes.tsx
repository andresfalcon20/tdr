// src/components/ProtectedRoutes.tsx
import { Navigate, Outlet } from 'react-router-dom';

// 1. Definimos la interfaz para las props (TypeScript lo exige)
interface ProtectedRouteProps {
  redirectPath?: string;
}

const ProtectedRoute = ({ redirectPath = '/login' }: ProtectedRouteProps) => {
  // 2. Verificamos el usuario
  // Asegúrate de que 'token' es la clave correcta que usas en tu Login
  const userToken = localStorage.getItem('token'); 
  const userObj = localStorage.getItem('user');

  // Si no existe ninguno de los dos, no está logueado
  if (!userToken && !userObj) {
    return <Navigate to={redirectPath} replace />;
  }

  // 3. Si existe, dejamos pasar (renderizamos los hijos)
  return <Outlet />;
};

export default ProtectedRoute;
