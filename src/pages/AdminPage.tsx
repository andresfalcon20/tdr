import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, FileText, Briefcase, Bell, Search, LayoutGrid, LogOut, X, History, 
    AlertTriangle, CheckCircle, Calendar
} from 'lucide-react';
// Asegúrate de que esta ruta sea correcta según tu proyecto
import { registrarHistorialGlobal } from '../utils/historyService'; 
import '../styles/AdminStyles.css';

// --- INTERFACES PARA API (Coinciden con la respuesta de tu BD) ---
interface ApiUsuario {
    id: number;
    nombre: string;
    email: string;
    rol: string;
}

interface ApiContrato {
    id: number;
    numero_contrato: string;
    nombre_profesional: string;
    admin_contrato: string;
    direccion: string;
    fecha_fin: string; // Viene de BD como string iso
    estado: string;
}

interface ApiTdr {
    id: number;
    numero_tdr: string;
    responsable: string;
    direccion_solicitante: string;
    fecha_fin: string;
    fechaConformidad?: string | null; // A veces viene null
}

interface AlertaItem { 
    id: string; 
    tipo: 'TDR' | 'CONTRATO'; 
    nombre: string; 
    responsable: string; 
    diasRestantes: number;
    fechaFin: string; 
    direccion: string; 
}

const SparkLine = ({ color }: { color: string }) => {
    const cleanId = color.replace('#', '');
    return (
        <svg width="100" height="50" viewBox="0 0 90 45" className="chart-mini">
            <defs>
                <linearGradient id={`grad-${cleanId}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
                    <stop offset="100%" stopColor={color} stopOpacity="0"/>
                </linearGradient>
            </defs>
            <path d="M0 35 Q 22 10, 45 25 T 90 5" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M0 35 Q 22 10, 45 25 T 90 5 V 45 H 0 Z" fill={`url(#grad-${cleanId})`} stroke="none" />
        </svg>
    );
};

const AdminPage = () => {
    const navigate = useNavigate();

    // 1. ESTADOS
    const [stats, setStats] = useState({ usersCount: 0, contractsCount: 0, tdrsCount: 0, alertsCount: 0 });
    const [alertList, setAlertList] = useState<AlertaItem[]>([]);   
    const [showToast, setShowToast] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [adminName, setAdminName] = useState('Administrador');

    // 2. CARGA DE DATOS DESDE LA API (IGUAL QUE LAS OTRAS PÁGINAS)
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Obtener nombre del usuario actual desde local (sesión)
                const currentUserStr = localStorage.getItem('usuario_actual');
                if (currentUserStr && !currentUserStr.startsWith('<')) {
                    const currentUser = JSON.parse(currentUserStr);
                    if (currentUser.nombre) setAdminName(currentUser.nombre);
                }

                // --- PETICIONES PARALELAS A LA BD ---
                const [resUsers, resContratos, resTdr] = await Promise.all([
                    fetch('/api/usuarios'),
                    fetch('/api/contratos'),
                    fetch('/api/tdr')
                ]);

                // Convertir a JSON (si fallan, usar array vacío)
                const users: ApiUsuario[] = resUsers.ok ? await resUsers.json() : [];
                const contratos: ApiContrato[] = resContratos.ok ? await resContratos.json() : [];
                const tdrs: ApiTdr[] = resTdr.ok ? await resTdr.json() : [];

                // --- PROCESAMIENTO DE ALERTAS ---
                const now = new Date(); 
                now.setHours(0, 0, 0, 0);
                const generatedAlerts: AlertaItem[] = [];

                // Función auxiliar
                const checkAlert = (fechaStr: string, id: number, tipo: 'TDR' | 'CONTRATO', nombre: string, resp: string, dir: string) => {
                    if (!fechaStr) return;
                    
                    // Limpieza de fecha (quitar la hora si viene formato ISO completo)
                    const cleanDate = fechaStr.split('T')[0];
                    const fFin = new Date(cleanDate);
                    // Ajuste de zona horaria simple
                    fFin.setMinutes(fFin.getMinutes() + fFin.getTimezoneOffset());

                    if (!isNaN(fFin.getTime())) {
                        const diffTime = fFin.getTime() - now.getTime();
                        const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));    
                        
                        // Alerta si faltan 90 días o menos
                        if (dias <= 90) {
                            generatedAlerts.push({
                                id: `${tipo}-${id}`, 
                                tipo: tipo, 
                                nombre: nombre || 'S/N',
                                responsable: resp || 'No asignado', 
                                diasRestantes: dias,
                                fechaFin: cleanDate,
                                direccion: dir || 'General'
                            });
                        }
                    }
                };

                // 1. Procesar Contratos (Usando campos de la BD: snake_case)
                if (Array.isArray(contratos)) {
                    contratos.forEach(c => {
                        if (c.estado !== 'Finalizado') {
                            checkAlert(
                                c.fecha_fin, 
                                c.id, 
                                'CONTRATO', 
                                c.numero_contrato, 
                                c.admin_contrato, 
                                c.direccion
                            );
                        }
                    });
                }

                // 2. Procesar TDRs (Usando campos de la BD)
                if (Array.isArray(tdrs)) {
                    tdrs.forEach(t => {
                        // Solo procesar si no tiene fecha de conformidad (no finalizado)
                        // Nota: La API devuelve fechaConformidad o fecha_conformidad según tu backend, revisamos null
                        if (!t.fechaConformidad) { 
                            checkAlert(
                                t.fecha_fin, 
                                t.id, 
                                'TDR', 
                                t.numero_tdr, 
                                t.responsable, 
                                t.direccion_solicitante
                            );
                        }
                    });
                }

                generatedAlerts.sort((a, b) => a.diasRestantes - b.diasRestantes);

                // --- FILTRO DE USUARIOS ---
                // Excluir al admin del conteo total
                const realUsersCount = users.filter(u => {
                    const r = (u.rol || '').toUpperCase();
                    return r !== 'ADMINISTRADOR' && r !== 'SUPERADMIN' && u.email !== 'admin@inamhi.gob.ec';
                }).length;

                // --- ACTUALIZAR ESTADO ---
                setStats({
                    usersCount: realUsersCount,
                    contractsCount: Array.isArray(contratos) ? contratos.length : 0,
                    tdrsCount: Array.isArray(tdrs) ? tdrs.length : 0,
                    alertsCount: generatedAlerts.length
                });
                
                setAlertList(generatedAlerts);
                if (generatedAlerts.length > 0) setShowToast(true);

            } catch (error) {
                console.error("Error cargando dashboard desde API:", error);
            }
        };

        fetchDashboardData();
    }, []);

    // 3. EFECTOS VISUALES
    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => setShowToast(false), 10000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    // 4. HANDLERS
    const handleLogout = () => { 
        registrarHistorialGlobal('Sistema', 'Usuario', `Cierre de sesión: ${adminName}`, adminName);
        localStorage.removeItem('token'); 
        navigate('/login'); 
    };
    
    const handleBellClick = () => { 
        setShowModal(true); 
        setShowToast(false); 
    };
    
    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="admin-layout">
            <div className="ambient-bg"></div>        
            
            <aside className="sidebar-viv">
                <div className="logo-header">
                    <div className="logo-icon">A</div>
                    <span className="logo-text">Admin<span className="logo-highlight">Panel</span></span>
                </div>        
                <nav className="nav-list">
                    <div className="nav-label">MENU PRINCIPAL</div>
                    <button className="viv-nav-item active"><LayoutGrid size={20} /> Dashboard</button>
                    <button className="viv-nav-item" onClick={() => navigate('/usuarios')}><Users size={20} /> Usuarios</button>
                    <button className="viv-nav-item" onClick={() => navigate('/tdr')}><FileText size={20} /> Módulo TDR</button>
                    <button className="viv-nav-item" onClick={() => navigate('/contratos')}><Briefcase size={20} /> Contrataciones</button>                
                    <div className="nav-spacer"></div>
                    <div className="nav-label">SISTEMA</div>
                    <button className="viv-nav-item logout" onClick={handleLogout}><LogOut size={20} /> Cerrar Sesión</button>
                </nav>
            </aside>

            <main className="content-wrapper">
                <header className="top-header">
                    <div className="header-left">
                        <div className="date-pill">
                            <Calendar size={16} /> {today}
                        </div>
                    </div>               
                    <div className="user-zone">
                        <div className="search-pill">
                            <Search size={18} className="search-icon"/>
                            <input type="text" placeholder="Buscar..." className="search-input" />
                        </div>
                        <div className="bell-container" onClick={handleBellClick}>
                            <Bell size={22} className={stats.alertsCount > 0 ? "bell-shake" : ""} />
                            {stats.alertsCount > 0 && <span className="badge-count">{stats.alertsCount}</span>}
                        </div>                    
                        <div className="profile-card">
                            <img src={`https://ui-avatars.com/api/?name=${adminName}&background=4318FF&color=fff&bold=true`} alt="User" className="avatar-circle" />
                            <div className="profile-info">
                                <span className="user-name">{adminName}</span>
                                <span className="user-role">Control Total</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="dashboard-hero">
                    <h1>Bienvenido de nuevo, {adminName} 👋</h1>
                    <p>Resumen general del sistema de control y gestión (Datos en tiempo real)</p>
                </div>

                <div className="widgets-grid">
                    {/* WIDGET USUARIOS */}
                    <div className="white-card blue" onClick={() => navigate('/usuarios')}>
                        <div className="card-top">
                            <div className="icon-box"><Users size={24}/></div>
                            <SparkLine color="#4318FF" />
                        </div>
                        <div className="data-group">
                            <p>Total Usuarios</p>
                            <h3>{stats.usersCount}</h3>
                        </div>
                    </div>

                    {/* WIDGET TDRs */}
                    <div className="white-card green" onClick={() => navigate('/tdr')}>
                        <div className="card-top">
                            <div className="icon-box"><FileText size={24}/></div>
                            <SparkLine color="#05CD99" />
                        </div>
                        <div className="data-group">
                            <p>TDRs Activos</p>
                            <h3>{stats.tdrsCount}</h3>
                        </div>
                    </div>

                    {/* WIDGET CONTRATOS */}
                    <div className="white-card orange" onClick={() => navigate('/contratos')}>
                        <div className="card-top">
                            <div className="icon-box"><Briefcase size={24}/></div>
                            <SparkLine color="#FFB547" />
                        </div>
                        <div className="data-group">
                            <p>Contratos</p>
                            <h3>{stats.contractsCount}</h3>
                        </div>
                    </div>

                    {/* WIDGET ALERTAS */}
                    <div className="white-card red" onClick={handleBellClick}>
                        <div className="card-top">
                            <div className="icon-box"><Bell size={24}/></div>
                            <SparkLine color="#E31A1A" />
                        </div>
                        <div className="data-group">
                            <p>Alertas Pendientes</p>
                            <h3 className={stats.alertsCount > 0 ? 'text-danger' : ''}>{stats.alertsCount}</h3>
                        </div>
                    </div>
                </div>

                <div className="history-section">
                    <div className="history-content">
                        <div className="history-text">
                            <div className="history-icon"><History size={24} /></div>
                            <div>
                                <h2>Historial de Actividad</h2>
                                <p>Revisa los últimos movimientos registrados (Creación, Edición, Eliminación).</p>
                            </div>
                        </div>
                        <button className="btn-history" onClick={() => navigate('/historial')}>
                            Ver Registro Completo
                        </button>
                    </div>
                </div>
            </main>

            {showToast && (
                <div className="toast-auto">
                    <div className="toast-icon-box">
                        <AlertTriangle size={24} color="#fff" />
                    </div>
                    <div className="toast-content">
                        <h4>Atención Requerida</h4>
                        <p>Se detectaron {stats.alertsCount} procesos próximos a vencer.</p>
                    </div>
                    <button onClick={() => setShowToast(false)} className="toast-close">
                        <X size={18}/>
                    </button>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay-backdrop">
                    <div className="modal-alert-panel">
                        <div className="modal-header">
                            <div className="modal-title">
                                <div className="modal-icon-pulse">
                                    <Bell size={24} />
                                </div>
                                Alertas de Vencimiento
                            </div>                  
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}><X size={22} /></button>
                        </div>                  
                        <div className="modal-body">
                            {alertList.length === 0 ? (
                                <div className="modal-empty">
                                    <div className="empty-circle">
                                        <CheckCircle size={48} />
                                    </div>
                                    <h3>¡Todo bajo control!</h3>
                                    <p>No hay vencimientos próximos en los siguientes 90 días.</p>
                                </div>
                            ) : (
                                alertList.map(item => {
                                    const isUrgent = item.diasRestantes < 30;
                                    const cardClass = isUrgent ? 'urgent' : 'warning';
                                    const formattedDate = new Date(item.fechaFin + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });                            
                                    return (
                                        <div key={item.id} className={`alert-card ${cardClass}`}>
                                            <div className="alert-left-bar"></div>
                                            <div className="alert-content-wrapper">
                                                <div className="alert-header-row">
                                                    <span className={`badge-type ${item.tipo.toLowerCase()}`}>{item.tipo}</span>
                                                    <span className="days-counter">{item.diasRestantes} días restantes</span>
                                                </div>
                                                <h5 className="alert-name">{item.nombre}</h5>
                                                <div className="alert-details-grid">
                                                    <div className="detail-item">
                                                        <span className="label">Responsable</span>
                                                        <span className="value">{item.responsable}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="label">Vence el</span>
                                                        <span className="value">{formattedDate}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
