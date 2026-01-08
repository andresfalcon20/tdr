import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Search } from 'lucide-react';
import '../styles/AdminStyles.css'; // Reutilizamos tus estilos

interface LogItem {
    id: number;
    fecha: string;
    usuario: string;
    accion: string;
    detalle: string;
}

const HistorialPage = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [filter, setFilter] = useState("");

    useEffect(() => {
        const storedLogs = JSON.parse(localStorage.getItem('sistema_logs') || '[]');
        setLogs(storedLogs);
    }, []);

    const clearLogs = () => {
        if (window.confirm("¿Estás seguro de borrar todo el historial?")) {
            localStorage.setItem('sistema_logs', '[]');
            setLogs([]);
        }
    };

    const filteredLogs = logs.filter(log => 
        log.detalle.toLowerCase().includes(filter.toLowerCase()) ||
        log.accion.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="admin-layout" style={{ display: 'block', padding: '40px' }}>
            <div className="history-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <button onClick={() => navigate(-1)} className="btn-history" style={{ background: '#f0f2f5', color: '#4318FF' }}>
                    <ArrowLeft size={18} /> Volver
                </button>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ color: '#2B3674', margin: 0 }}>Historial de Actividad</h2>
                    <p style={{ color: '#A3AED0' }}>Registro de movimientos del sistema</p>
                </div>
                <button onClick={clearLogs} className="btn-history" style={{ background: '#feeef0', color: '#E31A1A' }}>
                    <Trash2 size={18} /> Borrar Todo
                </button>
            </div>

            <div className="white-card" style={{ padding: '20px', borderRadius: '20px', background: 'white', boxShadow: '0px 20px 50px rgba(112, 144, 176, 0.12)' }}>
                <div className="search-pill" style={{ marginBottom: '20px', maxWidth: '400px', border: '1px solid #eee' }}>
                    <Search size={20} color="#A3AED0"/>
                    <input 
                        type="text" 
                        placeholder="Filtrar actividad..." 
                        className="search-input"
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #F4F7FE', color: '#A3AED0', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>Fecha</th>
                            <th style={{ padding: '12px' }}>Usuario</th>
                            <th style={{ padding: '12px' }}>Acción</th>
                            <th style={{ padding: '12px' }}>Detalle</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.length > 0 ? filteredLogs.map(log => (
                            <tr key={log.id} style={{ borderBottom: '1px solid #F4F7FE', color: '#2B3674' }}>
                                <td style={{ padding: '12px', fontSize: '14px' }}>{log.fecha}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{ fontWeight: 'bold' }}>{log.usuario}</span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{ 
                                        padding: '4px 12px', 
                                        borderRadius: '12px', 
                                        fontSize: '12px',
                                        background: log.accion.includes('Eliminar') ? '#feeef0' : '#e7fcf4',
                                        color: log.accion.includes('Eliminar') ? '#E31A1A' : '#05CD99'
                                    }}>
                                        {log.accion}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', color: '#707EAE' }}>{log.detalle}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#A3AED0' }}>
                                    No hay registros de actividad.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HistorialPage;
