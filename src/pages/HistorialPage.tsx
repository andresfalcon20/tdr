import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Search, Filter, 
    FileText, Briefcase, Users, 
    Clock, Trash2, Activity,
} from 'lucide-react';
import '../styles/HistorialPage.css'; 

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

    // Estado local para los logs
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        const cargarHistorial = () => {
            try {
                // LEER DIRECTAMENTE DEL STORAGE COMPARTIDO
                const data = JSON.parse(localStorage.getItem('sistema_historial') || '[]');
                if (Array.isArray(data)) {
                    setLogs(data);
                }
            } catch (error) {
                console.error("Error cargando historial:", error);
            }
        };

        cargarHistorial();
        // Listener para actualizar si cambia en otra pestaña (opcional)
        window.addEventListener('storage', cargarHistorial);
        return () => window.removeEventListener('storage', cargarHistorial);
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
            case 'Creación': return '#05CD99';
            case 'Edición': return '#4318FF';
            case 'Eliminación': return '#E31A1A';
            case 'Sistema': return '#FFB547';
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
        if (!dateString) return "Fecha desconocida";
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
            localStorage.setItem('sistema_historial', '[]');
            setLogs([]);
        }
    };

    return (
        <div className="historial-layout">
            <div className="historial-wrapper">
                
                {/* HEADER */}
                <div className="historial-header">
                    <div className="historial-title">
                        <button className="btn-back" onClick={() => navigate('/admin')}>
                            <ArrowLeft size={18} /> Volver
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
                        <Search size={20} />
                        <input 
                            type="text" 
                            placeholder="Buscar por detalle o usuario..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="historial-select-group">
                        <Filter size={18} />
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

                {/* LISTA */}
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
                                    <div className="history-decorator" style={{background: colorAccion}}></div>
                                    
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