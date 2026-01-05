import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import ContratosPage from '../pages/ContratosPage';
import UsuariosPage from '../pages/UsuariosPage';
import TdrPage from '../pages/TdrPage';
import AdminPage from '../pages/AdminPage';
import TecnicoPage from '../pages/TecnicoPage';
import PortalContratadoPage from '../pages/PortalContratadoPage'; // <--- IMPORTANTE

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Rutas del Sistema Admin */}
      <Route path="/tdr" element={<TdrPage />} />
      <Route path="/contratos" element={<ContratosPage />} />
      <Route path="/usuarios" element={<UsuariosPage />} />
      <Route path="/admin" element={<AdminPage />} />
      
      {/* Ruta para Técnicos */}
      <Route path="/tecnico" element={<TecnicoPage />} /> 

      {/* --- RUTA NUEVA PARA CONTRATADOS --- */}
      <Route path="/portal-contratado" element={<PortalContratadoPage />} />

      <Route path="/alertas" element={
        <div style={{padding:'20px', color:'white', textAlign: 'center'}}>
            <h2>🔔 Centro de Alertas</h2>
            <p>Aquí se mostrarán los contratos próximos a vencer.</p>
        </div>
      } />

      {/* Redirección por defecto */}
      <Route path="/*" element={<Navigate to="/" />} />
    </Routes>
  );
};
