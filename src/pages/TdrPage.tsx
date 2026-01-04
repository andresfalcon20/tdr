import { useState, useEffect } from 'react';
import { 
    Plus, Search, AlertTriangle, Eye, ArrowLeft, DollarSign, Calendar 
} from 'lucide-react';
import '../styles/TdrStyles.css';

// --- TIPOS DE DATOS ---
interface Support {
    id: number;
    numero: string;
    fechaProgramada: string;
    archivo: string | null;
    cumplimiento: boolean;
}

interface PaymentAct {
    id: number;
    fecha: string;
    archivo: string | null;
}

interface TDR {
    id: number;
    numeroTDR: string;
    objetoContratacion: string;
    tipoProceso: string;
    direccionSolicitante: string;
    presupuesto: number;
    responsable: string;
    fechaInicio: string;
    fechaFin: string;
    archivoNecesidad: string | null;
    archivoTDR: string | null;
    soportes: Support[];
    actasPago: PaymentAct[];
    informeFinal: string | null;
    fechaInformeFinal: string | null;
}

// --- DATO DE EJEMPLO PARA QUE NO SALGA VACÍO AL INICIO ---
const INITIAL_EXAMPLE: TDR[] = [
    {
        id: 1,
        numeroTDR: "TDR-2026-EJ-01",
        objetoContratacion: "Mantenimiento Preventivo de Estaciones Automáticas",
        tipoProceso: "Régimen Especial",
        direccionSolicitante: "DIRECCIÓN DE LA RED NACIONAL DE OBSERVACIÓN HIDROMETEOROLÓGICA",
        presupuesto: 12500.00,
        responsable: "Ing. Carlos Ejemplo",
        fechaInicio: "2026-01-15",
        fechaFin: "2026-06-15",
        archivoNecesidad: "informe_necesidad_ejemplo.pdf",
        archivoTDR: "tdr_firmado_ejemplo.pdf",
        soportes: [],
        actasPago: [],
        informeFinal: null,
        fechaInformeFinal: null
    }
];

const TdrPage = () => {
    const [view, setView] = useState<'list' | 'create'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState(1);
    
    const [formData, setFormData] = useState<Partial<TDR>>({
        soportes: [],
        actasPago: []
    });

    // 1. CARGA LOCAL O EJEMPLO
    // Si hay datos guardados, los usa. Si no, usa INITIAL_EXAMPLE.
    const [tdrList, setTdrList] = useState<TDR[]>(() => {
        const saved = localStorage.getItem('sistema_tdr');
        return saved ? JSON.parse(saved) : INITIAL_EXAMPLE;
    });

    // 2. GUARDADO AUTOMÁTICO
    useEffect(() => {
        localStorage.setItem('sistema_tdr', JSON.stringify(tdrList));
    }, [tdrList]);

    const getDaysRemaining = (endDate: string) => {
        const end = new Date(endDate);
        const today = new Date();
        const diffTime = end.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    };

    const getStatusBadge = (days: number) => {
        if (days < 0) return <span className="badge badge-danger">Vencido</span>;
        if (days <= 90) return <span className="badge badge-warning">⚠️ Por Vencer ({days} días)</span>;
        return <span className="badge badge-success">Vigente ({days} días)</span>;
    };

    const filteredTDRs = tdrList.filter(tdr => 
        tdr.numeroTDR.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tdr.objetoContratacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tdr.direccionSolicitante.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSaveTDR = (e: React.FormEvent) => {
        e.preventDefault();
        const newTDR = { ...formData, id: Date.now() } as TDR;
        setTdrList([...tdrList, newTDR]);
        alert("TDR Guardado Localmente");
        setView('list');
        // Limpiamos el formulario para el siguiente
        setFormData({ soportes: [], actasPago: [] });
        setActiveTab(1); // Volver a la pestaña 1
    };

    return (
        <div className="tdr-container">
            <div className="space-background"></div>

            {/* --- VISTA DE LISTA (DASHBOARD) --- */}
            {view === 'list' && (
                <div className="tdr-dashboard tdr-fade-in">
                    <header className="dashboard-header">
                        <div>
                            <h1>Gestión de TDR</h1>
                            <p>Control de procesos contractuales INAMHI</p>
                        </div>
                        <button className="btn-primary" onClick={() => setView('create')}>
                            <Plus size={18} /> Nuevo TDR
                        </button>
                    </header>

                    {/* Alertas */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3>Total Procesos</h3>
                            <div className="number">{tdrList.length}</div>
                        </div>
                        <div className="stat-card warning">
                            <h3><AlertTriangle size={18} /> Por Vencer (90 días)</h3>
                            <div className="number">
                                {tdrList.filter(t => {
                                    const d = getDaysRemaining(t.fechaFin);
                                    return d > 0 && d <= 90;
                                }).length}
                            </div>
                        </div>
                        <div className="stat-card danger">
                            <h3>Vencidos</h3>
                            <div className="number">
                                {tdrList.filter(t => getDaysRemaining(t.fechaFin) < 0).length}
                            </div>
                        </div>
                    </div>

                    {/* Buscador */}
                    <div className="search-bar">
                        <span className="search-icon-wrapper"><Search size={18} /></span>
                        <input 
                            type="text" 
                            placeholder="Buscar por Nro TDR, Objeto o Dirección..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Tabla */}
                    <div className="glass-panel">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Nro. TDR</th>
                                    <th>Objeto</th>
                                    <th>Dirección</th>
                                    <th>Responsable</th>
                                    <th>Fin Contrato</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTDRs.length === 0 ? (
                                     <tr><td colSpan={7} style={{textAlign:'center', padding:'20px'}}>No se encontraron resultados.</td></tr>
                                ) : (
                                    filteredTDRs.map(tdr => (
                                    <tr key={tdr.id}>
                                        <td className="highlight-text">{tdr.numeroTDR}</td>
                                        <td>{tdr.objetoContratacion}</td>
                                        <td style={{fontSize: '0.85rem'}}>{tdr.direccionSolicitante}</td>
                                        <td>{tdr.responsable}</td>
                                        <td>{tdr.fechaFin}</td>
                                        <td>{getStatusBadge(getDaysRemaining(tdr.fechaFin))}</td>
                                        <td>
                                            <button className="btn-icon" title="Ver Detalles">
                                                <Eye size={18}/>
                                            </button>
                                        </td>
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- VISTA DE REGISTRO --- */}
            {view === 'create' && (
                <div className="tdr-form-container glass-panel tdr-fade-in">
                    <div className="form-header">
                        <button className="btn-back" onClick={() => setView('list')}>
                            <ArrowLeft size={20} /> Volver
                        </button>
                        <h2>Registro de Nuevo TDR</h2>
                    </div>

                    <div className="form-tabs">
                        <button className={`tab-btn ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>
                            1. Datos Generales
                        </button>
                        <button className={`tab-btn ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>
                            2. Soportes
                        </button>
                        <button className={`tab-btn ${activeTab === 3 ? 'active' : ''}`} onClick={() => setActiveTab(3)}>
                            3. Pagos y Cierre
                        </button>
                    </div>

                    <form onSubmit={handleSaveTDR} className="main-form">
                        
                        {/* PESTAÑA 1 */}
                        {activeTab === 1 && (
                            <div className="form-section tdr-slide">
                                <div className="grid-2">
                                    <div className="input-block">
                                        <label>Número de TDR (Único)</label>
                                        <input type="text" name="numeroTDR" required onChange={handleInputChange} />
                                    </div>
                                    <div className="input-block">
                                        <label>Tipo de Proceso</label>
                                        <select name="tipoProceso" onChange={handleInputChange}>
                                            <option>Seleccione...</option>
                                            <option>Ínfima cuantía</option>
                                            <option>Catálogo electrónico</option>
                                            <option>Régimen especial</option>
                                            <option>Subasta inversa</option>
                                        </select>
                                    </div>
                                    <div className="input-block">
                                        <label>Dirección Solicitante</label>
                                        <select name="direccionSolicitante" onChange={handleInputChange}>
                                            <option value="">Seleccione...</option>
                                            <option value="TECNOLOGÍAS DE LA INFORMACIÓN Y COMUNICACIÓN">TECNOLOGÍAS DE LA INFORMACIÓN Y COMUNICACIÓN</option>
                                            <option value="DIRECCIÓN DE INFORMACIÓN HIDROMETEOROLÓGICA">DIRECCIÓN DE INFORMACIÓN HIDROMETEOROLÓGICA</option>
                                            <option value="DIRECCIÓN DE ADMINISTRACIÓN DE RECURSOS HUMANOS">DIRECCIÓN DE ADMINISTRACIÓN DE RECURSOS HUMANOS</option>
                                            <option value="DIRECCIÓN ADMINISTRATIVA FINANCIERA">DIRECCIÓN ADMINISTRATIVA FINANCIERA</option>
                                            <option value="DIRECCIÓN EJECUTIVA">DIRECCIÓN EJECUTIVA</option>
                                            <option value="DIRECCIÓN DE ASESORÍA JURÍDICA">DIRECCIÓN DE ASESORÍA JURÍDICA</option>
                                            <option value="DIRECCIÓN DE COMUNICACIÓN SOCIAL">DIRECCIÓN DE COMUNICACIÓN SOCIAL</option>
                                            <option value="DIRECCIÓN DE PLANIFICACIÓN">DIRECCIÓN DE PLANIFICACIÓN</option>
                                            <option value="DIRECCIÓN DE PRONÓSTICOS Y ALERTAS">DIRECCIÓN DE PRONÓSTICOS Y ALERTAS</option>
                                            <option value="DIRECCIÓN DE ESTUDIOS, INVESTIGACIÓN Y DESARROLLO HIDROMETEOROLÓGICO">DIRECCIÓN DE ESTUDIOS, INVESTIGACIÓN Y DESARROLLO HIDROMETEOROLÓGICO</option>
                                            <option value="DIRECCIÓN DE LA RED NACIONAL DE OBSERVACIÓN HIDROMETEOROLÓGICA">DIRECCIÓN DE LA RED NACIONAL DE OBSERVACIÓN HIDROMETEOROLÓGICA</option>
                                            <option value="LABORATORIO NACIONAL DE CALIDAD DE AGUA Y SEDIMENTOS">LABORATORIO NACIONAL DE CALIDAD DE AGUA Y SEDIMENTOS</option>
                                        </select>
                                    </div>
                                    <div className="input-block">
                                        <label>Objeto Contractual</label>
                                        <input type="text" name="objetoContratacion" onChange={handleInputChange} />
                                    </div>
                                    <div className="input-block">
                                        <label>Responsable Designado</label>
                                        <input type="text" name="responsable" onChange={handleInputChange} />
                                    </div>
                                    
                                    <div className="input-block">
                                        <label>Presupuesto Anual</label>
                                        <div className="input-with-icon">
                                            <div className="icon-prefix"><DollarSign size={16} /></div>
                                            <input type="number" name="presupuesto" onChange={handleInputChange} placeholder="0.00" />
                                        </div>
                                    </div>

                                    <div className="input-block">
                                        <label>Fecha Inicio</label>
                                        <div className="input-with-icon">
                                             <div className="icon-prefix"><Calendar size={16} /></div>
                                            <input type="date" name="fechaInicio" onChange={handleInputChange} />
                                        </div>
                                    </div>
                                    <div className="input-block">
                                        <label>Fecha Finalización</label>
                                        <div className="input-with-icon">
                                             <div className="icon-prefix"><Calendar size={16} /></div>
                                            <input type="date" name="fechaFin" onChange={handleInputChange} />
                                        </div>
                                    </div>
                                </div>
                                
                                <h3 className="section-subtitle">Archivos</h3>
                                <div className="grid-2">
                                    <div className="file-upload-block">
                                        <label>Informe de Necesidad</label>
                                        <input type="file" accept=".pdf" />
                                    </div>
                                    <div className="file-upload-block">
                                        <label>Documento TDR Firmado</label>
                                        <input type="file" accept=".pdf" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PESTAÑA 2 */}
                        {activeTab === 2 && (
                            <div className="form-section tdr-slide">
                                <div className="add-item-box">
                                    <h4>Agregar Soporte / Mantenimiento</h4>
                                    <div className="grid-3">
                                        <div className="input-block">
                                            <label>Nro. Soporte</label>
                                            <input type="text" />
                                        </div>
                                        <div className="input-block">
                                            <label>Fecha Programada</label>
                                            <input type="date" />
                                        </div>
                                        <div className="input-block">
                                            <label>Adjunto</label>
                                            <input type="file" className="small-file" />
                                        </div>
                                    </div>
                                    <button type="button" className="btn-secondary small">Agregar a la lista</button>
                                </div>

                                <div className="list-preview">
                                    <h4>Historial de Soportes</h4>
                                    <p className="empty-state">No hay soportes registrados aún.</p>
                                </div>
                            </div>
                        )}

                        {/* PESTAÑA 3 */}
                        {activeTab === 3 && (
                            <div className="form-section tdr-slide">
                                <div className="subsection">
                                    <h3>3.4 Actas Parciales de Pago</h3>
                                    <div className="add-item-box">
                                        <div className="grid-2">
                                            <div className="input-block">
                                                <label>Fecha del Acta</label>
                                                <input type="date" />
                                            </div>
                                            <div className="input-block">
                                                <label>Archivo Acta</label>
                                                <input type="file" />
                                            </div>
                                        </div>
                                        <button type="button" className="btn-secondary small">Cargar Acta</button>
                                    </div>
                                </div>

                                <div className="subsection">
                                    <h3>3.5 Informe de Conformidad Final</h3>
                                    <div className="grid-2">
                                        <div className="input-block">
                                            <label>Fecha de Emisión</label>
                                            <input type="date" name="fechaInformeFinal" onChange={handleInputChange} />
                                        </div>
                                        <div className="file-upload-block">
                                            <label>Informe Final (PDF)</label>
                                            <input type="file" accept=".pdf" />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="btn-primary-large">
                                        GUARDAR PROCESO COMPLETO
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            )}
        </div>
    );
};

export default TdrPage;
