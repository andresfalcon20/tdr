import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, FileText, Briefcase, 
    Bell, Search, LayoutGrid, LogOut, X, History 
} from 'lucide-react';
import '../styles/AdminStyles.css';

interface Contrato { id: number; fechaFin: string; numeroContrato: string; estado: string; adminContrato: string; }
interface TDR { id: number; fechaFin: string; numeroTDR: string; responsable: string; }
interface AlertaItem { id: string; tipo: 'TDR' | 'CONTRATO'; nombre: string; responsable: string; diasRestantes: number; }

// Componente Gráfico
const SparkLine = ({ color }: { color: string }) => (
    <svg width="90" height="45" viewBox="0 0 90 45" className="chart-mini">
        <path d="M0 35 Q 22 10, 45 25 T 90 5" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d="M0 35 Q 22 10, 45 25 T 90 5 V 45 H 0 Z" fill={color} fillOpacity="0.1" stroke="none" />
    </svg>
);

const AdminPage = () => {
    const navigate = useNavigate();
    
    // Estados
    const [stats, setStats] = useState({ usersCount: 0, contractsCount: 0, tdrsCount: 0, alertsCount: 0 });
    const [alertList, setAlertList] = useState<AlertaItem[]>([]);
    const [showAlertModal, setShowAlertModal] = useState(false);
    
    useEffect(() => {
        const users = JSON.parse(localStorage.getItem('sistema_usuarios') || '[]');
        const contracts: Contrato[] = JSON.parse(localStorage.getItem('sistema_contratos') || '[]');
        const tdrs: TDR[] = JSON.parse(localStorage.getItem('sistema_tdr') || '[]');

        const now = new Date(); now.setHours(0, 0, 0, 0);
        const generatedAlerts: AlertaItem[] = [];

        const checkDate = (dateStr: string, id: string, type: 'TDR' | 'CONTRATO', name: string, resp: string) => {
            if (!dateStr) return;
            const fFin = new Date(dateStr);
            if (!isNaN(fFin.getTime())) {
                const fFinAdj = new Date(fFin.valueOf() + fFin.getTimezoneOffset() * 60000);
                const diffTime = fFinAdj.getTime() - now.getTime();
                const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (dias <= 90) {
                    generatedAlerts.push({
                        id: `${type}-${id}`, tipo: type, nombre: name,
                        responsable: resp || 'No asignado', diasRestantes: dias
                    });
                }
            }
        };

        contracts.forEach(c => { if(c.estado !== 'Finalizado') checkDate(c.fechaFin, c.id.toString(), 'CONTRATO', c.numeroContrato, c.adminContrato); });
        tdrs.forEach(t => checkDate(t.fechaFin, t.id.toString(), 'TDR', t.numeroTDR, t.responsable));
        generatedAlerts.sort((a, b) => a.diasRestantes - b.diasRestantes);
        
        setAlertList(generatedAlerts);
        setStats({ usersCount: users.length, contractsCount: contracts.length, tdrsCount: tdrs.length, alertsCount: generatedAlerts.length });
        
        if (generatedAlerts.length > 0) setShowAlertModal(true);
    }, []);

    const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };

    return (
        <div className="admin-layout">
            
            {/* 1. SIDEBAR CURVO (ARRIBA Y ABAJO) */}
            <aside className="sidebar-viv">
                <div className="logo-header">
                    <span className="logo-text">Admin<span className="logo-highlight">Panel</span></span>
                </div>

                <nav className="nav-list">
                    <button className="viv-nav-item active">
                        <LayoutGrid /> Dashboard
                    </button>
                    <button className="viv-nav-item" onClick={() => navigate('/usuarios')}>
                        <Users /> Usuarios
                    </button>
                    <button className="viv-nav-item" onClick={() => navigate('/tdr')}>
                        <FileText /> Módulo TDR
                    </button>
                    <button className="viv-nav-item" onClick={() => navigate('/contratos')}>
                        <Briefcase /> Contrataciones
                    </button>
                    
                    <div style={{flex: 1}}></div>

                    <button className="viv-nav-item" onClick={handleLogout} style={{color: '#E31A1A'}}>
                        <LogOut /> Cerrar Sesión
                    </button>
                </nav>
            </aside>

            {/* 2. CONTENIDO PRINCIPAL */}
            <main className="content-wrapper">
                
                {/* Header */}
                <header className="top-header">
                    <div className="search-pill">
                        <Search size={20} color="#A3AED0"/>
                        <input type="text" placeholder="Buscar en el sistema..." className="search-input" />
                    </div>
                    
                    <div className="user-zone">
                        <div style={{position:'relative', cursor:'pointer'}} onClick={() => setShowAlertModal(true)}>
                            <Bell size={24} color="#A3AED0" fill={stats.alertsCount > 0 ? "#E31A1A" : "none"}/>
                            {stats.alertsCount > 0 && <span style={{position:'absolute', top:-2, right:-2, width:10, height:10, background:'#E31A1A', borderRadius:'50%', border:'2px solid white'}}></span>}
                        </div>
                        <div className="profile-card">
                            <img src="https://ui-avatars.com/api/?name=Admin&background=4318FF&color=fff" alt="User" className="avatar-circle" />
                            <div>
                                <span className="user-name">Hola, </span>
                                <span className="user-role">Administrador</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* 3. WIDGETS DIFUMINADOS (FONDO PASTEL + ICONO FUERTE) */}
                <div className="widgets-grid">
                    
                    {/* Usuarios */}
                    <div className="white-card blue" onClick={() => navigate('/usuarios')}>
                        <div className="card-content">
                            <div className="icon-box"><Users /></div>
                            <div className="data-group">
                                <h3>{stats.usersCount}</h3>
                                <p>Usuarios</p>
                            </div>
                        </div>
                        <SparkLine color="#4318FF" />
                    </div>

                    {/* TDRs */}
                    <div className="white-card green" onClick={() => navigate('/tdr')}>
                        <div className="card-content">
                            <div className="icon-box"><FileText /></div>
                            <div className="data-group">
                                <h3>{stats.tdrsCount}</h3>
                                <p>TDRs Proc.</p>
                            </div>
                        </div>
                        <SparkLine color="#05CD99" />
                    </div>

                    {/* Contratos */}
                    <div className="white-card orange" onClick={() => navigate('/contratos')}>
                        <div className="card-content">
                            <div className="icon-box"><Briefcase /></div>
                            <div className="data-group">
                                <h3>{stats.contractsCount}</h3>
                                <p>Contratos</p>
                            </div>
                        </div>
                        <SparkLine color="#FFB547" />
                    </div>

                    {/* Alertas */}
                    <div className="white-card red" onClick={() => setShowAlertModal(true)}>
                        <div className="card-content">
                            <div className="icon-box"><Bell /></div>
                            <div className="data-group">
                                <h3 style={{color: stats.alertsCount > 0 ? '#E31A1A' : 'inherit'}}>{stats.alertsCount}</h3>
                                <p>Alertas</p>
                            </div>
                        </div>
                        <SparkLine color="#E31A1A" />
                    </div>

                </div>

                {/* 4. HISTORIAL */}
                <div className="history-section">
                    <div className="history-text">
                        <h2>Historial de Actividad</h2>
                        <p>Consulta el registro detallado de movimientos en el sistema.</p>
                    </div>
                    <button className="btn-history" onClick={() => navigate('/historial')}>
                        <History size={18} style={{marginRight:'8px'}}/>
                        Ver Historial
                    </button>
                </div>

            </main>

            {/* Modal Alertas */}
            {showAlertModal && (
                <div className="modal-bg" onClick={() => setShowAlertModal(false)}>
                    <div className="modal-panel" onClick={e => e.stopPropagation()}>
                        <div className="modal-head">
                            <span>Vencimientos Próximos</span>
                            <X style={{cursor:'pointer'}} onClick={() => setShowAlertModal(false)}/>
                        </div>
                        <div className="alert-list">
                            {alertList.length === 0 ? (
                                <p style={{textAlign:'center', color:'#A3AED0', padding:'20px'}}>Todo está al día.</p>
                            ) : (
                                alertList.map(item => (
                                    <div key={item.id} className="alert-row">
                                        <div>
                                            <span className="alert-name">{item.nombre}</span>
                                            <span className="alert-resp">{item.responsable}</span>
                                        </div>
                                        <div className="alert-tag">
                                            {item.diasRestantes} días
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
