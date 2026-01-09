import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, FileText, Briefcase, 
    Bell, Search, LayoutGrid, LogOut, X, History, 
    AlertTriangle, CheckCircle 
} from 'lucide-react';
import '../styles/AdminStyles.css';

// Interfaces adaptadas
interface Contrato { 
    id: number; 
    fechaFin: string; 
    numeroContrato: string; 
    estado: string; 
    adminContrato: string; 
}

interface TDR { 
    id: number; 
    fechaFin: string; 
    numeroTDR: string; 
    responsable: string; 
    direccionSolicitante: string; 
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

const SparkLine = ({ color }: { color: string }) => (
    <svg width="90" height="45" viewBox="0 0 90 45" className="chart-mini">
        <path d="M0 35 Q 22 10, 45 25 T 90 5" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d="M0 35 Q 22 10, 45 25 T 90 5 V 45 H 0 Z" fill={color} fillOpacity="0.1" stroke="none" />
    </svg>
);

const AdminPage = () => {
    const navigate = useNavigate();
    
    const [stats, setStats] = useState({ usersCount: 0, contractsCount: 0, tdrsCount: 0, alertsCount: 0 });
    const [alertList, setAlertList] = useState<AlertaItem[]>([]);
    const [showToast, setShowToast] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Cargar datos
        const users = JSON.parse(localStorage.getItem('sistema_usuarios') || '[]');
        const contracts: Contrato[] = JSON.parse(localStorage.getItem('sistema_contratos') || '[]');
        const tdrs: TDR[] = JSON.parse(localStorage.getItem('sistema_tdr') || '[]');

        const now = new Date(); now.setHours(0, 0, 0, 0);
        const generatedAlerts: AlertaItem[] = [];

        // Función para procesar alertas
        const processAlert = (dateStr: string, id: string, type: 'TDR' | 'CONTRATO', name: string, resp: string, dir: string) => {
            if (!dateStr) return;
            const fFin = new Date(dateStr);
            if (!isNaN(fFin.getTime())) {
                // Ajuste de zona horaria simple
                const fFinAdj = new Date(fFin.valueOf() + fFin.getTimezoneOffset() * 60000);
                const diffTime = fFinAdj.getTime() - now.getTime();
                const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                // Si faltan 90 días o menos
                if (dias <= 90) {
                    generatedAlerts.push({
                        id: `${type}-${id}`, 
                        tipo: type, 
                        nombre: name,
                        responsable: resp || 'No asignado', 
                        diasRestantes: dias,
                        fechaFin: dateStr,
                        direccion: dir || 'No especificada'
                    });
                }
            }
        };

        // Procesar Contratos
        contracts.forEach(c => { 
            if(c.estado !== 'Finalizado') {
                processAlert(c.fechaFin, c.id.toString(), 'CONTRATO', c.numeroContrato, c.adminContrato, 'Administrativa Financiera'); 
            }
        });

        // Procesar TDRs
        tdrs.forEach(t => {
            processAlert(t.fechaFin, t.id.toString(), 'TDR', t.numeroTDR, t.responsable, t.direccionSolicitante);
        });

        generatedAlerts.sort((a, b) => a.diasRestantes - b.diasRestantes);
        
        setAlertList(generatedAlerts);
        setStats({ 
            usersCount: users.length, 
            contractsCount: contracts.length, 
            tdrsCount: tdrs.length, 
            alertsCount: generatedAlerts.length 
        });
        
        if (generatedAlerts.length > 0) {
            setShowToast(true);
            toastTimerRef.current = setTimeout(() => setShowToast(false), 10000); 
        }

        return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
    }, []);

    const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };
    const handleBellClick = () => { setShowModal(true); setShowToast(false); };

    return (
        <div className="admin-layout">
            <aside className="sidebar-viv">
                <div className="logo-header"><span className="logo-text">Admin<span className="logo-highlight">Panel</span></span></div>
                <nav className="nav-list">
                    <button className="viv-nav-item active"><LayoutGrid /> Dashboard</button>
                    <button className="viv-nav-item" onClick={() => navigate('/usuarios')}><Users /> Usuarios</button>
                    <button className="viv-nav-item" onClick={() => navigate('/tdr')}><FileText /> Módulo TDR</button>
                    <button className="viv-nav-item" onClick={() => navigate('/contratos')}><Briefcase /> Contrataciones</button>
                    <div style={{flex: 1}}></div>
                    <button className="viv-nav-item" onClick={handleLogout} style={{color: '#E31A1A'}}><LogOut /> Cerrar Sesión</button>
                </nav>
            </aside>

            <main className="content-wrapper">
                <header className="top-header">
                    <div className="search-pill">
                        <Search size={20} color="#A3AED0"/>
                        <input type="text" placeholder="Buscar en el sistema..." className="search-input" />
                    </div>
                    <div className="user-zone">
                        <div className="bell-container" onClick={handleBellClick}>
                            <Bell size={24} color="#A3AED0" className={stats.alertsCount > 0 ? "bell-shake" : ""} fill={stats.alertsCount > 0 ? "#E31A1A" : "none"}/>
                            {stats.alertsCount > 0 && <span className="badge-count"></span>}
                        </div>
                        <div className="profile-card">
                            <img src="https://ui-avatars.com/api/?name=Admin&background=4318FF&color=fff" alt="User" className="avatar-circle" />
                            <div><span className="user-name">Hola, Admin</span><span className="user-role">Administrador</span></div>
                        </div>
                    </div>
                </header>

                <div className="widgets-grid">
                    <div className="white-card blue" onClick={() => navigate('/usuarios')}>
                        <div className="card-content">
                            <div className="icon-box"><Users /></div>
                            <div className="data-group"><h3>{stats.usersCount}</h3><p>Usuarios</p></div>
                        </div>
                        <SparkLine color="#4318FF" />
                    </div>
                    <div className="white-card green" onClick={() => navigate('/tdr')}>
                        <div className="card-content">
                            <div className="icon-box"><FileText /></div>
                            <div className="data-group"><h3>{stats.tdrsCount}</h3><p>TDRs Proc.</p></div>
                        </div>
                        <SparkLine color="#05CD99" />
                    </div>
                    <div className="white-card orange" onClick={() => navigate('/contratos')}>
                        <div className="card-content">
                            <div className="icon-box"><Briefcase /></div>
                            <div className="data-group"><h3>{stats.contractsCount}</h3><p>Contratos</p></div>
                        </div>
                        <SparkLine color="#FFB547" />
                    </div>
                    <div className="white-card red" onClick={handleBellClick}>
                        <div className="card-content">
                            <div className="icon-box"><Bell /></div>
                            <div className="data-group"><h3 style={{color: stats.alertsCount > 0 ? '#E31A1A' : 'inherit'}}>{stats.alertsCount}</h3><p>Alertas</p></div>
                        </div>
                        <SparkLine color="#E31A1A" />
                    </div>
                </div>

                <div className="history-section">
                    <div className="history-text"><h2>Historial de Actividad</h2><p>Consulta el registro detallado.</p></div>
                    <button className="btn-history" onClick={() => navigate('/historial')}><History size={18} style={{marginRight:'8px'}}/>Ver Historial</button>
                </div>
            </main>

            {/* TOAST AUTOMÁTICO */}
            {showToast && (
                <div className="toast-auto">
                    <AlertTriangle size={28} color="#E31A1A" />
                    <div className="toast-content">
                        <h4>Atención Requerida</h4>
                        <p>Tienes {stats.alertsCount} procesos próximos a vencer.</p>
                    </div>
                    <button onClick={() => setShowToast(false)} style={{border:'none', background:'transparent', cursor:'pointer', color:'#A3AED0'}}>
                        <X size={20}/>
                    </button>
                </div>
            )}

            {/* === MODAL DE ALERTAS === */}
            {showModal && (
                <div className="modal-overlay-backdrop">
                    <div className="modal-alert-panel">
                        <div className="modal-header">
                            <div className="modal-title">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10.29 3.86L1.82 18C1.64556 18.3024 1.55293 18.6453 1.55201 18.9945C1.55108 19.3437 1.64191 19.6871 1.81507 19.9905C1.98823 20.2939 2.23764 20.5463 2.53771 20.7219C2.83778 20.8975 3.17802 20.99 3.525 21H20.475C20.822 20.99 21.1622 20.8975 21.4623 20.7219C21.7624 20.5463 22.0118 20.2939 22.1849 19.9905C22.3581 19.6871 22.4489 19.3437 22.448 18.9945C22.4471 18.6453 22.3544 18.3024 22.18 18L13.71 3.86C13.5317 3.56613 13.2807 3.32314 12.9813 3.15451C12.6819 2.98587 12.3442 2.89728 12 2.89728C11.6558 2.89728 11.3181 2.98587 11.0187 3.15451C10.7193 3.32314 10.4683 3.56613 10.29 3.86V3.86Z" fill="#E31A1A" stroke="#E31A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M12 9V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M12 17H12.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Alertas de Vencimiento
                            </div>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        
                        <div className="modal-body">
                            {alertList.length === 0 ? (
                                <div className="modal-empty">
                                    <CheckCircle size={60} color="#05CD99" style={{marginBottom: 15, display:'block', margin:'0 auto'}}/>
                                    <p>¡Todo al día! No hay vencimientos próximos.</p>
                                </div>
                            ) : (
                                alertList.map(item => {
                                    const isUrgent = item.diasRestantes < 30;
                                    const cardClass = isUrgent ? 'urgent' : 'warning';
                                    const formattedDate = new Date(item.fechaFin).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
                                    
                                    return (
                                        <div key={item.id} className={`alert-card ${cardClass}`}>
                                            <div className="alert-leading">
                                                <div className="alert-icon-circle">
                                                    {item.tipo === 'TDR' ? <FileText size={24} /> : <Briefcase size={24} />}
                                                </div>
                                                <div className="days-badge">
                                                    {item.diasRestantes} días
                                                </div>
                                            </div>
                                            <div className="alert-details">
                                                <span className="alert-type">VENCIMIENTO DE {item.tipo}</span>
                                                <h5 className="alert-name">{item.nombre}</h5>
                                                
                                                <div className="alert-meta-grid">
                                                    <div className="alert-field">
                                                        <span className="field-label">Dirección:</span>
                                                        <span className="field-value">{item.direccion}</span>
                                                    </div>
                                                    <div className="alert-field">
                                                        <span className="field-label">Responsable:</span>
                                                        <span className="field-value">{item.responsable}</span>
                                                    </div>
                                                    <div className="alert-field">
                                                        <span className="field-label">Fecha Fin:</span>
                                                        <span className="field-value">{formattedDate}</span>
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
