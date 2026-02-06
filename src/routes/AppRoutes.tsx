import { Routes, Route, Navigate } from 'react-router-dom';

// IMPORTACIÓN CORREGIDA:
// Asegúrate de que la ruta coincida con el nombre de tu archivo.
// Si tu archivo se llama 'ProtectedRoutes.tsx', impórtalo así:
import ProtectedRoute from '../components/ProtectedRoutes'; 

import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import ContratosPage from '../pages/ContratosPage';
import UsuariosPage from '../pages/UsuariosPage';
import TdrPage from '../pages/TdrPage';
import AdminPage from '../pages/AdminPage';
import TecnicoPage from '../pages/TecnicoPage';
import PortalContratadoPage from '../pages/PortalContratadoPage';
import HistorialPage from '../pages/HistorialPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* --- RUTAS PROTEGIDAS --- */}
      {/* Usamos el nombre 'ProtectedRoute' (singular) que importamos arriba */}
      <Route element={<ProtectedRoute />}>
      
          {/* Rutas del Sistema Admin */}
          <Route path="/tdr" element={<TdrPage />} />
          <Route path="/contratos" element={<ContratosPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/historial" element={<HistorialPage />} />
          
          {/* Ruta para Técnicos */}
          <Route path="/tecnico" element={<TecnicoPage />} /> 

          {/* Ruta Contratados */}
          <Route path="/portal-contratado" element={<PortalContratadoPage />} />
          
      </Route>

      {/* Redirección por defecto */}
      <Route path="/*" element={<Navigate to="/" />} />
    </Routes>
  );
};
