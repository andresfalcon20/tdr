import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Search, Filter, 
    FileText, Briefcase, Users, 
    Clock, Trash2, Activity,
} from 'lucide-react';
import '../styles/HistorialPage.css'; 

// Interface del Historial
interface LogEntry {
    id: number;
    accion: 'Creación' | 'Edición' | 'Eliminación' | 'Sistema';
    entidad: 'Usuario' | 'Contrato' | 'TDR' | 'Sistema';
    detalle: string;
    fecha: string;
    usuario: string; 
}

const HistorialPage = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEntidad, setFilterEntidad] = useState('Todos');

    const [logs, setLogs] = useState<LogEntry[]>(() => {
        const saved = localStorage.getItem('sistema_historial');
        return saved ? JSON.parse(saved) : [];
    });

    // Cargar datos simulados DETALLADOS si está vacío
    useEffect(() => {
        if (logs.length === 0) {
            const users = JSON.parse(localStorage.getItem('sistema_usuarios') || '[]');
            const contracts = JSON.parse(localStorage.getItem('sistema_contratos') || '[]');
            
            const dummyLogs: LogEntry[] = [];
            
            // Simulación de creación de usuarios
            if(users.length > 0) {
                dummyLogs.push({
                    id: 1, accion: 'Creación', entidad: 'Usuario',
                    detalle: `Registro inicial de usuario: ${users[0].nombre} con rol "${users[0].rol}".`,
                    fecha: new Date(Date.now() - 86400000 * 2).toISOString(), // Hace 2 días
                    usuario: 'Admin General'
                });
            }

            // Simulación de creación de contratos
            if(contracts.length > 0) {
                dummyLogs.push({
                    id: 2, accion: 'Creación', entidad: 'Contrato',
                    detalle: `Alta de nuevo contrato ${contracts[0].numeroContrato} asignado a ${contracts[0].nombreProfesional}.`,
                    fecha: new Date(Date.now() - 86400000).toISOString(), // Hace 1 día
                    usuario: 'Admin General'
                });
            }

            // --- EJEMPLOS DE EDICIONES ESPECÍFICAS ---
            dummyLogs.push({
                id: 3, accion: 'Edición', entidad: 'TDR',
                detalle: 'Actualización de presupuesto: $5,000.00 -> $6,500.00 en TDR-2026-001.',
                fecha: new Date(Date.now() - 3600000 * 4).toISOString(), // Hace 4 horas
                usuario: 'Andres Falcon'
            });

            dummyLogs.push({
                id: 4, accion: 'Edición', entidad: 'Contrato',
                detalle: 'Cambio de estado: "Pendiente" -> "Activo" en Contrato CTR-2026-055.',
                fecha: new Date(Date.now() - 3600000 * 2).toISOString(), // Hace 2 horas
                usuario: 'Washo Betancourt'
            });

            dummyLogs.push({
                id: 5, accion: 'Eliminación', entidad: 'Usuario',
                detalle: 'Eliminación permanente del usuario "Juan Perez" del área Financiera.',
                fecha: new Date().toISOString(),
                usuario: 'Admin General'
            });
            
            // Ordenar por fecha reciente (descendente)
            dummyLogs.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
            
            setLogs(dummyLogs);
            localStorage.setItem('sistema_historial', JSON.stringify(dummyLogs));
        }
    }, []);

    const getIconByEntidad = (entidad: string) => {
        switch(entidad) {
            case 'Usuario': return <Users size={24} />;
            case 'Contrato': return <Briefcase size={24} />;
            case 'TDR': return <FileText size={24} />;
            case 'Sistema': return <Activity size={24} />;
            default: return <Clock size={24} />;
        }
    };

    const getColorByAccion = (accion: string) => {
        switch(accion) {
            case 'Creación': return '#05CD99'; // Verde Esmeralda
            case 'Edición': return '#4318FF'; // Azul Eléctrico
            case 'Eliminación': return '#E31A1A'; // Rojo Alerta
            case 'Sistema': return '#FFB547'; // Naranja
            default: return '#A3AED0';
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.detalle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              log.usuario.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterEntidad === 'Todos' || log.entidad === filterEntidad;
        return matchesSearch && matchesFilter;
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Fecha inválida";
        
        const options: Intl.DateTimeFormatOptions = { 
            year: 'numeric', month: 'short', day: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        };
        return date.toLocaleDateString('es-ES', options);
    };

    const clearHistory = () => {
        if(window.confirm("¿Estás seguro de borrar todo el historial? Esta acción no se puede deshacer.")) {
            setLogs([]);
            localStorage.removeItem('sistema_historial');
        }
    };

    return (
        <div className="historial-layout">
            <div className="historial-wrapper">
                
                {/* HEADER */}
                <div className="historial-header">
                    <div className="historial-title">
                        <button className="btn-back" onClick={() => navigate('/admin')}>
                            <ArrowLeft size={18} /> Volver al Dashboard
                        </button>
                        <h1>Historial del Sistema</h1>
                        <p>Registro detallado de auditoría, cambios y movimientos.</p>
                    </div>
                    <button className="btn-clear" onClick={clearHistory} title="Limpiar Historial">
                        <Trash2 size={20} />
                    </button>
                </div>

                {/* FILTROS */}
                <div className="historial-filters-card">
                    <div className="historial-search">
                        <Search size={20} color="#A3AED0"/>
                        <input 
                            type="text" 
                            placeholder="Buscar por detalle (ej: presupuesto, estado) o usuario..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="historial-select-group">
                        <Filter size={20} color="#4318FF"/>
                        <select 
                            className="historial-select"
                            value={filterEntidad}
                            onChange={(e) => setFilterEntidad(e.target.value)}
                        >
                            <option value="Todos">Todas las Entidades</option>
                            <option value="Usuario">Usuarios</option>
                            <option value="Contrato">Contratos</option>
                            <option value="TDR">TDRs</option>
                            <option value="Sistema">Sistema</option>
                        </select>
                    </div>
                </div>

                {/* LISTA DE HISTORIAL */}
                <div className="history-timeline-container">
                    {filteredLogs.length === 0 ? (
                        <div className="empty-history">
                            <Clock size={48} style={{marginBottom:'15px', opacity:0.5}}/>
                            <p>No se encontraron registros en el historial.</p>
                        </div>
                    ) : (
                        filteredLogs.map(log => {
                            const colorAccion = getColorByAccion(log.accion);
                            
                            return (
                                <div key={log.id} className="history-card-item">
                                    {/* Decorador lateral */}
                                    <div className="history-decorator" style={{background: colorAccion}}></div>
                                    
                                    {/* Icono */}
                                    <div className="history-icon-box" style={{color: colorAccion, background: `${colorAccion}15`}}>
                                        {getIconByEntidad(log.entidad)}
                                    </div>

                                    <div className="history-details-flex">
                                        <div style={{flex: 1, paddingRight: '20px'}}>
                                            <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px'}}>
                                                <span className="history-badge" style={{color: colorAccion, borderColor: colorAccion}}>
                                                    {log.accion}
                                                </span>
                                                <span className="entidad-tag">
                                                    {log.entidad}
                                                </span>
                                            </div>
                                            
                                            {/* Detalle más legible */}
                                            <h4 className="history-title" style={{whiteSpace: 'pre-wrap', lineHeight: '1.5'}}>
                                                {log.detalle}
                                            </h4>
                                            
                                            <p className="history-user-info">
                                                Realizado por: <strong className="history-user-highlight">{log.usuario}</strong>
                                            </p>
                                        </div>
                                        
                                        <div className="history-date-block">
                                            <span className="date-main">
                                                {formatDate(log.fecha).split(',')[0]}
                                            </span>
                                            <span className="date-sub">
                                                {formatDate(log.fecha).split(',')[1]}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

            </div>
        </div>
    );
};

export default HistorialPage;
