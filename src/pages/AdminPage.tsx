import { useNavigate } from 'react-router-dom';
import { 
    Users, FileText, Briefcase, Settings, 
    Shield, Activity, LogOut, AlertTriangle, 
    Trash2, Search
} from 'lucide-react';
import '../styles/AdminStyles.css'; // CSS nuevo para admin

const AdminPage = () => {
    const navigate = useNavigate();
    
    // Simulación de datos rápidos para el Dashboard
    const stats = {
        users: 12,
        activeTDRs: 5,
        alerts: 2
    };

    // Funciones de navegación rápida
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="admin-container">
            {/* Fondo Espacial */}
            <div className="space-background"></div>

            {/* --- SIDEBAR / NAVEGACIÓN LATERAL --- */}
            <aside className="admin-sidebar glass-panel">
                <div className="sidebar-header">
                    <div className="admin-avatar">
                        <Shield size={32} />
                    </div>
                    <div>
                        <h3>Administrador</h3>
                    </div>
                </div>

                <nav className="sidebar-menu">
                    <button className="menu-item active">
                        <Activity size={20} /> Dashboard General
                    </button>
                    <button className="menu-item" onClick={() => navigate('/usuarios')}>
                        <Users size={20} /> Gestión de Usuarios
                    </button>
                    <button className="menu-item" onClick={() => navigate('/tdr')}>
                        <FileText size={20} /> Módulo TDRs
                    </button>
                    <button className="menu-item" onClick={() => navigate('/contratos')}>
                        <Briefcase size={20} /> Contrataciones
                    </button>
                    <div className="separator"></div>
                
                    <button className="menu-item danger" onClick={handleLogout}>
                        <LogOut size={20} /> Cerrar Sesión
                    </button>
                </nav>
            </aside>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <main className="admin-content animate-fade-in">
                
                <header className="content-header">
                    <div>
                        <h1>Panel de Control</h1>
                        <p>Bienvenido</p>
                    </div>
                    <div className="date-badge">
                        {new Date().toLocaleDateString()}
                    </div>
                </header>

                {/* TARJETAS DE ACCESO RÁPIDO (MÓDULOS) */}
                <div className="modules-grid">
                    {/* Tarjeta 1: Usuarios */}
                    <div className="module-card glass-panel" onClick={() => navigate('/usuarios')}>
                        <div className="icon-box blue">
                            <Users size={28} />
                        </div>
                        <h3>Usuarios y Roles</h3>
                        <p>Crear técnicos, contratados y asignar credenciales.</p>
                        <div className="card-footer">
                            <span>{stats.users} Usuarios activos</span>
                        </div>
                    </div>

                    {/* Tarjeta 2: TDRs */}
                    <div className="module-card glass-panel" onClick={() => navigate('/tdr')}>
                        <div className="icon-box green">
                            <FileText size={28} />
                        </div>
                        <h3>Gestión de TDR</h3>
                        <p>Crear, modificar y eliminar Términos de Referencia.</p>
                        <div className="card-footer">
                            <span>{stats.activeTDRs} Procesos en curso</span>
                        </div>
                    </div>

                    {/* Tarjeta 3: Contratos */}
                    <div className="module-card glass-panel" onClick={() => navigate('/contratos')}>
                        <div className="icon-box purple">
                            <Briefcase size={28} />
                        </div>
                        <h3>Contratos Servicios</h3>
                        <p>Administración de contratos profesionales.</p>
                        <div className="card-footer">
                            <span>Módulo de Gestión</span>
                        </div>
                    </div>

                    {/* Tarjeta 4: Logs y Auditoría */}
                    <div className="module-card glass-panel">
                        <div className="icon-box orange">
                            <Settings size={28} />
                        </div>
                        <h3>Auditoría y Logs</h3>
                        <p>Revisar registros, eliminar archivos y parámetros.</p>
                        <div className="card-footer">
                            <span>Configuración Global</span>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN DE ALERTAS Y ACCIONES RECIENTES */}
                <section className="dashboard-widgets">
                    
                    {/* Widget: Alertas de Vencimiento */}
                    <div className="widget glass-panel">
                        <div className="widget-header">
                            <h3><AlertTriangle size={20} color="#f59e0b"/> Alertas del Sistema</h3>
                        </div>
                        <ul className="alert-list">
                            <li className="alert-item warning">
                                <span>⚠️ TDR-2025-002 por vencer en 30 días</span>
                                <button className="btn-tiny">Ver</button>
                            </li>
                            <li className="alert-item danger">
                                <span>🔴 Contrato C-99 vencido hace 2 días</span>
                                <button className="btn-tiny">Ver</button>
                            </li>
                            <li className="alert-item info">
                                <span>ℹ️ Copia de seguridad realizada hoy</span>
                            </li>
                        </ul>
                    </div>

                    {/* Widget: Acciones Rápidas (Solo Admin) */}
                    <div className="widget glass-panel">
                        <div className="widget-header">
                            <h3><Shield size={20} color="#3b82f6"/> Acciones Administrativas</h3>
                        </div>
                        <div className="quick-actions">
                            <button className="action-btn">
                                <Users size={18}/> Nuevo Usuario
                            </button>
                            <button className="action-btn">
                                <Trash2 size={18}/> Limpiar Archivos Temp.
                            </button>
                            <button className="action-btn">
                                <Search size={18}/> Ver Logs de Auditoría
                            </button>
                        </div>
                    </div>

                </section>
            </main>
        </div>
    );
};

export default AdminPage;
