import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, FileText, Briefcase, Settings, 
    Shield, Activity, LogOut, AlertTriangle
} from 'lucide-react';
import '../styles/AdminStyles.css';

// Interfaces para leer los datos del LocalStorage
interface Usuario { id: number; }
interface Contrato { id: number; fechaFin: string; numeroContrato: string; estado: string; }

const AdminPage = () => {
    const navigate = useNavigate();
    
    // --- ESTADOS (Contadores Reales) ---
    const [stats, setStats] = useState({
        usersCount: 0,
        contractsCount: 0,
        tdrsCount: 0, 
        alertsCount: 0
    });

    // --- CARGAR DATOS REALES ---
    useEffect(() => {
        // 1. Cargar Usuarios
        const storedUsers = localStorage.getItem('sistema_usuarios');
        const users: Usuario[] = storedUsers ? JSON.parse(storedUsers) : [];

        // 2. Cargar Contratos
        const storedContracts = localStorage.getItem('sistema_contratos');
        const contracts: Contrato[] = storedContracts ? JSON.parse(storedContracts) : [];

        // 3. Cargar TDRs (Si existe la key, si no, usamos 0 o un cálculo basado en contratos pendientes)
        // Aquí asumimos que los TDRs se guardan en 'sistema_tdrs' o son los contratos en estado 'Pendiente'
        const storedTDRs = localStorage.getItem('sistema_tdrs'); 
        const tdrs = storedTDRs ? JSON.parse(storedTDRs) : []; 
        // Si no tienes el módulo TDR guardando aún, puedes usar contracts.length como referencia temporal

        // 4. Calcular Alertas (Vencimientos próximos)
        const now = new Date();
        let alerts = 0;
        contracts.forEach(c => {
            if (c.fechaFin) {
                const fechaFin = new Date(c.fechaFin);
                const diffTime = fechaFin.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                // Alerta si vence en menos de 30 días
                if (diffDays <= 30) alerts++;
            }
        });

        setStats({
            usersCount: users.length,
            contractsCount: contracts.length,
            tdrsCount: tdrs.length > 0 ? tdrs.length : 0, 
            alertsCount: alerts
        });

    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userName');
        navigate('/login');
    };

    return (
        <div className="admin-container">
            <div className="space-background"></div>

            {/* --- SIDEBAR --- */}
            <aside className="admin-sidebar glass-panel">
                <div className="sidebar-header">
                    <div className="admin-avatar"><Shield size={32} /></div>
                    <div>
                        <h3>Administrador</h3>
                        <span className="status-dot">En línea</span>
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
                        <p>Resumen del Sistema en Tiempo Real</p>
                    </div>
                    <div className="date-badge">{new Date().toLocaleDateString()}</div>
                </header>

                {/* --- GRID DE MÓDULOS (DISEÑO BONITO RESTAURADO) --- */}
                <div className="modules-grid">
                    
                    {/* Tarjeta 1: Usuarios */}
                    <div className="module-card glass-panel" onClick={() => navigate('/usuarios')}>
                        <div className="icon-box blue"><Users size={28} /></div>
                        <h3>Usuarios y Roles</h3>
                        <p>Crear técnicos, contratados y asignar credenciales de acceso.</p>
                        <div className="card-footer">
                            <span>{stats.usersCount} Usuarios registrados</span>
                        </div>
                    </div>

                    {/* Tarjeta 2: TDRs (SEPARADA) */}
                    <div className="module-card glass-panel" onClick={() => navigate('/tdr')}>
                        <div className="icon-box green"><FileText size={28} /></div>
                        <h3>Módulo de TDRs</h3>
                        <p>Gestión de Términos de Referencia, creación y flujo de aprobación.</p>
                        <div className="card-footer">
                            <span>{stats.tdrsCount} Procesos en curso</span>
                        </div>
                    </div>

                    {/* Tarjeta 3: Contratos (SEPARADA) */}
                    <div className="module-card glass-panel" onClick={() => navigate('/contratos')}>
                        <div className="icon-box purple"><Briefcase size={28} /></div>
                        <h3>Contratos de Servicios</h3>
                        <p>Administración de contratos, fechas y expedientes digitales.</p>
                        <div className="card-footer">
                            <span>{stats.contractsCount} Contratos activos</span>
                        </div>
                    </div>

                    {/* Tarjeta 4: Alertas */}
                    <div className="module-card glass-panel" style={{cursor:'default'}}>
                        <div className="icon-box orange"><AlertTriangle size={28} /></div>
                        <h3>Alertas Activas</h3>
                        <p>Monitor de vencimientos próximos y notificaciones del sistema.</p>
                        <div className="card-footer">
                            <span style={{color: stats.alertsCount > 0 ? '#fca5a5' : 'inherit'}}>
                                {stats.alertsCount} Alertas pendientes
                            </span>
                        </div>
                    </div>

                </div>

                {/* --- SECCIÓN INFERIOR (AUDITORÍA) --- */}
                <div className="dashboard-widgets">
                    <div className="widget glass-panel" style={{gridColumn: '1 / -1'}}>
                        <div className="widget-header">
                            <h3><Settings size={20} color="#94a3b8"/> Auditoría y Configuración</h3>
                        </div>
                        <div style={{color:'#94a3b8', fontSize:'0.9rem', padding:'10px 0'}}>
                            El sistema está funcionando correctamente. Última sincronización: {new Date().toLocaleTimeString()}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default AdminPage;






