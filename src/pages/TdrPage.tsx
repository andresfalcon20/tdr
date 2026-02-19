import { useState, useEffect } from 'react';
import { 
    Plus, Search, Eye, ArrowLeft, Clock, Printer,
    FileText, CheckCircle, AlertTriangle, ShieldCheck, 
    Trash2, UploadCloud, Save, Pencil,
    Repeat, X, File as FileIcon,
    Briefcase, User, DollarSign, Layers, Filter, ChevronDown, Check
} from 'lucide-react';

import { generarReportePDF } from '../utils/ReporteTdrPDF';

import '../styles/TdrStyles.css';

const DIRECCIONES_INAMHI = [
    "TECNOLOGÍAS DE LA INFORMACIÓN Y COMUNICACIÓN",
    "DIRECCIÓN DE INFORMACIÓN HIDROMETEOROLÓGICA",
    "DIRECCIÓN DE ADMINISTRACIÓN DE RECURSOS HUMANOS",
    "DIRECCIÓN ADMINISTRATIVA FINANCIERA",
    "DIRECCIÓN EJECUTIVA",
    "DIRECCIÓN DE ASESORÍA JURÍDICA",
    "DIRECCIÓN DE COMUNICACIÓN SOCIAL",
    "DIRECCIÓN DE PLANIFICACIÓN",
    "DIRECCIÓN DE PRONÓSTICOS Y ALERTAS",
    "DIRECCIÓN DE ESTUDIOS, INVESTIGACIÓN Y DESARROLLO HIDROMETEOROLÓGICO",
    "DIRECCIÓN DE LA RED NACIONAL DE OBSERVACIÓN HIDROMETEOROLÓGICA",
    "LABORATORIO NACIONAL DE CALIDAD DE AGUA Y SEDIMENTOS"
];

const generateId = () => {
    return new Date().getTime() + Math.floor(Math.random() * 100000);
};

interface FileItem { 
    id: number; 
    url: string; 
    nombre: string; 
}

interface Support { 
    id: number; 
    numero: string; 
    fechaProgramada: string; 
    archivo: string | null; 
    nombreArchivo?: string; 
    cumplimiento: string;
}

interface PaymentAct { 
    id: number; 
    numero: string; 
    fecha: string; 
    archivo: string | null; 
    nombreArchivo?: string; 
}

// Interface exportada
export interface TDR {
    id: number; 
    numeroTDR: string; 
    objetoContratacion: string; 
    tipoProceso: string;
    direccionSolicitante: string; 
    presupuesto: number; 
    responsable: string; 
    fechaInicio: string; 
    duracionCantidad: number; 
    duracionUnidad: 'Dias' | 'Meses' | 'Anios'; 
    fechaFin: string; 
    archivosNecesidad: FileItem[];
    archivosTDR: FileItem[];
    archivoInformeTecnico: string | null;
    archivoActaEntrega: string | null;
    archivoProducto: string | null;
    archivoVerificable: string | null;
    soportes: Support[];

    // 4. CIERRE
    actasPago: PaymentAct[];
    fechaConformidad: string | null;
    archivoConformidad: string | null;
    nombreArchivoConformidad?: string;
}

const TdrPage = () => {
    const [view, setView] = useState<'list' | 'create' | 'detail' | 'edit'>('list');
    const [activeTab, setActiveTab] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTdr, setSelectedTdr] = useState<TDR | null>(null);
    const [filterType, setFilterType] = useState('Todos'); 
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [formData, setFormData] = useState<Partial<TDR>>({ 
        duracionCantidad: 1, 
        duracionUnidad: 'Meses' 
    });
    const [scheduleParams, setScheduleParams] = useState({ 
        fechaInicio: '', 
        cantidad: 1, 
        intervalo: 1 
    });
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [currentSupportId, setCurrentSupportId] = useState<number | null>(null);
    const [modalSupportData, setModalSupportData] = useState<{ 
        archivo: File | null; 
        cumplimiento: string; 
    }>({ archivo: null, cumplimiento: 'Pendiente' });
    const [tempActa, setTempActa] = useState<Partial<PaymentAct>>({});
    const [tempActaFile, setTempActaFile] = useState<File | null>(null);
    const [tdrList, setTdrList] = useState<TDR[]>([]);

    const cargarTDRs = async () => {
        try {
            const res = await fetch('/api/tdr');
            const data = await res.json();
            interface TDRResponse {
                id: number;
                numero_tdr: string;
                objeto_contratacion: string;
                tipo_proceso: string;
                direccion_solicitante: string;
                presupuesto: number;
                responsable: string;
                fecha_inicio: string;
                fecha_fin: string;
                duracion_cantidad: number;
                duracion_unidad: 'Dias' | 'Meses' | 'Anios';
            }
            const lista = data.map((t: TDRResponse) => ({
                id: t.id,
                numeroTDR: t.numero_tdr, 
                objetoContratacion: t.objeto_contratacion,
                tipoProceso: t.tipo_proceso,
                direccionSolicitante: t.direccion_solicitante,
                presupuesto: t.presupuesto,
                responsable: t.responsable,
                fechaInicio: t.fecha_inicio ? t.fecha_inicio.split('T')[0] : '',
                fechaFin: t.fecha_fin ? t.fecha_fin.split('T')[0] : '',
                duracionCantidad: t.duracion_cantidad,
                duracionUnidad: t.duracion_unidad,
                archivosNecesidad: [],
                archivosTDR: [],
                archivoInformeTecnico: null,
                archivoActaEntrega: null,
                archivoProducto: null,
                archivoVerificable: null,

                soportes: [],
                actasPago: [],
                fechaConformidad: null,
                archivoConformidad: null
            }));
            setTdrList(lista);
        } catch (e) {
            console.error("Error cargando TDRs:", e);
        }
    };

    useEffect(() => {
        cargarTDRs();
    }, []);

    const handlePrintClick = () => {
        generarReportePDF(tdrList);
    };

    const registrarHistorial = async (accion: 'Creación' | 'Edición' | 'Eliminación', detalle: string) => {
        try {
            await fetch('/api/historial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accion,
                    entidad: 'TDR',
                    detalle,
                    usuario: 'Admin General'
                })
            });
        } catch (e) { console.error("Error historial", e); }
    };

    useEffect(() => {
        if ((view === 'create' || view === 'edit') && formData.fechaInicio && formData.duracionCantidad) {
            const inicio = new Date(formData.fechaInicio);
            const cantidad = Number(formData.duracionCantidad);
            if (!isNaN(inicio.getTime())) {
                const fin = new Date(inicio);
                if (formData.duracionUnidad === 'Dias') fin.setDate(fin.getDate() + cantidad);
                else if (formData.duracionUnidad === 'Meses') fin.setMonth(fin.getMonth() + cantidad);
                else if (formData.duracionUnidad === 'Anios') fin.setFullYear(fin.getFullYear() + cantidad);
                const finStr = fin.toISOString().split('T')[0];
                setFormData(prev => ({ ...prev, fechaFin: finStr }));
            }
        }
    }, [formData.fechaInicio, formData.duracionCantidad, formData.duracionUnidad, view]);

    const getDaysRemaining = (endDate: string) => {
        if (!endDate) return 0;
        const diff = new Date(endDate).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24)); 
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSaveTDR = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.numeroTDR || !formData.fechaInicio || !formData.fechaFin) return alert("Complete campos obligatorios.");

        const datosParaEnviar = {
            numeroTDR: formData.numeroTDR,
            objetoContratacion: formData.objetoContratacion,
            tipoProceso: formData.tipoProceso,
            direccionSolicitante: formData.direccionSolicitante,
            presupuesto: formData.presupuesto,
            responsable: formData.responsable,
            fechaInicio: formData.fechaInicio,
            fechaFin: formData.fechaFin,
            duracionCantidad: formData.duracionCantidad,
            duracionUnidad: formData.duracionUnidad
        };

        try {
            if (view === 'create') {
                const res = await fetch('/api/tdr', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosParaEnviar)
                });

                if (res.ok) {
                    alert("TDR Creado en Servidor");
                    registrarHistorial('Creación', `Nuevo TDR: ${formData.numeroTDR}`);
                    cargarTDRs(); 
                    setView('list');
                    setFormData({ duracionCantidad: 1, duracionUnidad: 'Meses' });
                } else {
                    alert("Error al guardar");
                }

            } else if (view === 'edit' && formData.id) {
                alert("Edición pendiente de configurar ruta PUT en backend.");
                const updatedList = tdrList.map(t => t.id === formData.id ? { ...t, ...formData } as TDR : t);
                setTdrList(updatedList);
                setView('list');
            }
        } catch {
            alert("Error de conexión con el servidor");
        }
    };

    const handleDeleteTDR = async (id: number) => {
        if(window.confirm("¿Eliminar TDR?")) {
            try {
                await fetch(`/api/tdr/${id}`, { method: 'DELETE' });
                setTdrList(tdrList.filter(t => t.id !== id));
                registrarHistorial('Eliminación', `TDR eliminado ID: ${id}`);
            } catch {
                alert("Error al intentar eliminar en el servidor");
            }
        }
    };

    const updateTdrInList = (updated: TDR, msg?: string) => {
        setSelectedTdr(updated);
        setTdrList(tdrList.map(t => t.id === updated.id ? updated : t));
        if (msg) registrarHistorial('Edición', msg);
    };

    const handleAddMultipleFiles = (field: 'archivosNecesidad' | 'archivosTDR', file: File | undefined) => {
        if(!selectedTdr || !file) return;
        const newFile: FileItem = { 
            id: generateId(), 
            url: URL.createObjectURL(file), 
            nombre: file.name 
        };
        const currentFiles = selectedTdr[field] || [];
        updateTdrInList({ ...selectedTdr, [field]: [...currentFiles, newFile] }, `Archivo agregado a ${field}`);
    };

    const handleRemoveMultipleFile = (field: 'archivosNecesidad' | 'archivosTDR', fileId: number) => {
        if (!selectedTdr) return;
        const currentFiles = selectedTdr[field] || [];
        updateTdrInList({ ...selectedTdr, [field]: currentFiles.filter(f => f.id !== fileId) });
    };

    const handleFileUploadSingle = (field: keyof TDR, file: File | undefined) => {
        if(!selectedTdr || !file) return;
        let extraData = {};
        if (field === 'archivoConformidad') {
            extraData = { nombreArchivoConformidad: file.name };
        }

        updateTdrInList({ ...selectedTdr, [field]: URL.createObjectURL(file), ...extraData }, `${field} actualizado`);
    };

    const handleRemoveFileSingle = () => {
        if (!selectedTdr) return;
        updateTdrInList({ ...selectedTdr, archivoConformidad: null, nombreArchivoConformidad: undefined }, "Informe conformidad eliminado");
    };

    const generateSchedule = () => {
        if (!selectedTdr || !scheduleParams.fechaInicio || scheduleParams.cantidad < 1) return alert("Configure parámetros.");
        
        const nuevos: Support[] = [];
        let fechaBase = new Date(scheduleParams.fechaInicio);
        fechaBase = new Date(fechaBase.valueOf() + fechaBase.getTimezoneOffset() * 60000);
        const baseId = generateId(); 

        for (let i = 0; i < scheduleParams.cantidad; i++) {
            const nuevaFecha = new Date(fechaBase);
            nuevaFecha.setMonth(fechaBase.getMonth() + (i * scheduleParams.intervalo));
            nuevos.push({ 
                id: baseId + i, 
                numero: `Soporte ${selectedTdr.soportes.length + i + 1}`, 
                fechaProgramada: nuevaFecha.toISOString().split('T')[0], 
                archivo: null, 
                cumplimiento: 'Pendiente' 
            });
        }
        updateTdrInList({ ...selectedTdr, soportes: [...selectedTdr.soportes, ...nuevos] }, "Soportes generados");
        setScheduleParams({ fechaInicio: '', cantidad: 1, intervalo: 1 });
    };

    const saveSupportFromModal = () => {
        if (!selectedTdr || !currentSupportId) return;
        const updatedSoportes = selectedTdr.soportes.map(s => {
            if (s.id === currentSupportId) {
                let newUrl = s.archivo, newName = s.nombreArchivo;
                if (modalSupportData.archivo) { newUrl = URL.createObjectURL(modalSupportData.archivo); newName = modalSupportData.archivo.name; }
                return { ...s, archivo: newUrl, nombreArchivo: newName, cumplimiento: modalSupportData.cumplimiento };
            } return s;
        });
        updateTdrInList({ ...selectedTdr, soportes: updatedSoportes }, "Estado soporte actualizado");
        setIsSupportModalOpen(false);
    };
    
    const deleteSupport = (id: number) => { if(selectedTdr) updateTdrInList({ ...selectedTdr, soportes: selectedTdr.soportes.filter(s => s.id !== id) }); };

    const addActa = () => {
        if(!selectedTdr || !tempActa.fecha || !tempActaFile) return alert("Fecha y Archivo obligatorios");
        
        const newActa: PaymentAct = { 
            id: generateId(), 
            numero: tempActa.numero || 'S/N', 
            fecha: tempActa.fecha || '', 
            archivo: URL.createObjectURL(tempActaFile), 
            nombreArchivo: tempActaFile.name 
        };
        
        updateTdrInList({ ...selectedTdr, actasPago: [...selectedTdr.actasPago, newActa] }, "Acta agregada");
        setTempActa({}); setTempActaFile(null);
        
        const fileInput = document.getElementById('acta-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const deleteActa = (id: number) => { if(selectedTdr) updateTdrInList({ ...selectedTdr, actasPago: selectedTdr.actasPago.filter(a => a.id !== id) }); };

    const filteredTDRs = tdrList.filter(t => {
        const search = searchTerm.toLowerCase();
        if (!search) return true;

        if (filterType === 'Número') return t.numeroTDR.toLowerCase().includes(search);
        if (filterType === 'Objeto') return t.objetoContratacion.toLowerCase().includes(search);
        if (filterType === 'Dirección') return t.direccionSolicitante.toLowerCase().includes(search);
        
        return (
            t.numeroTDR.toLowerCase().includes(search) ||
            t.objetoContratacion.toLowerCase().includes(search) ||
            t.direccionSolicitante.toLowerCase().includes(search)
        );
    });

    return (
        <div className="tdr-container">
            {view === 'list' && (
                <div>
                    <header className="dashboard-header">
                        <div className="header-title">
                            <h1>GESTIÓN DE TDR</h1>
                            <p>Control de procesos contractuales (MySQL)</p>
                        </div>
                        <div className="header-actions">
                            <button className="btn-primary btn-pdf" onClick={handlePrintClick}>
                                <Printer size={20} /> Imprimir Reporte PDF
                            </button>
                            <button className="btn-primary" onClick={() => { setFormData({ duracionCantidad: 1, duracionUnidad: 'Meses' }); setView('create'); }}>
                                <Plus size={20} /> Nuevo TDR
                            </button>
                        </div>
                    </header>

                    <div className="stats-grid">
                        <div className="stat-card"><h3><FileText size={18}/> Procesos Activos</h3><div className="number">{tdrList.length}</div></div>
                        <div className="stat-card warning"><h3><AlertTriangle size={18}/> Por Vencer (90 días)</h3><div className="number">{tdrList.filter(t => { const d = getDaysRemaining(t.fechaFin); return d > 0 && d <= 90; }).length}</div></div>
                        <div className="stat-card danger"><h3><ShieldCheck size={18}/> Vencidos</h3><div className="number">{tdrList.filter(t => getDaysRemaining(t.fechaFin) < 0).length}</div></div>
                    </div>

                    <div className="filters-bar">
                        <div className="search-bar">
                            <Search size={18} />
                            <input 
                                type="text" 
                                placeholder={`Buscar por ${filterType === 'Todos' ? 'todo...' : filterType.toLowerCase() + '...'}`}
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                            />
                            
                            <div className="filter-dropdown-container">
                                <button 
                                    className={`btn-filter-toggle ${showFilterMenu ? 'active' : ''}`}
                                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                                >
                                    <Filter size={16} />
                                    <span>{filterType}</span>
                                    <ChevronDown size={14} />
                                </button>

                                {showFilterMenu && (
                                    <div className="filter-menu fade-in">
                                        <div className="filter-menu-header">Filtrar búsqueda por:</div>
                                        {['Todos', 'Número', 'Objeto', 'Dirección'].map((opcion) => (
                                            <button 
                                                key={opcion}
                                                className={`filter-option ${filterType === opcion ? 'selected' : ''}`}
                                                onClick={() => { setFilterType(opcion); setShowFilterMenu(false); }}
                                            >
                                                {opcion} {filterType === opcion && <Check size={14}/>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="white-panel">
                        <table className="custom-table">
                            <thead><tr><th>Nro. TDR</th><th>Objeto</th><th>Responsable</th><th>Fin Contrato</th><th>Estado</th><th>Acción</th></tr></thead>
                            <tbody>
                                {filteredTDRs.length === 0 ? (<tr><td colSpan={6} className="no-data">No hay registros.</td></tr>) : (
                                    filteredTDRs.map(tdr => (
                                        <tr key={tdr.id}>
                                            <td className="highlight-text">{tdr.numeroTDR}</td>
                                            <td>{tdr.objetoContratacion}</td><td>{tdr.responsable}</td><td>{tdr.fechaFin}</td>
                                            <td>{tdr.fechaConformidad ? <span className="badge conformidad-finalizado">Finalizado</span> : <span className="badge badge-success">En Ejecución</span>}</td>
                                            <td><div className="action-buttons">
                                                <button className="btn-icon" onClick={() => { setSelectedTdr(tdr); setView('detail'); }}><Eye size={18}/></button>
                                                <button className="btn-icon" onClick={() => { setFormData({...tdr}); setView('edit'); }}><Pencil size={18}/></button>
                                                <button className="btn-icon danger" onClick={() => handleDeleteTDR(tdr.id)}><Trash2 size={18}/></button>
                                            </div></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {(view === 'create' || view === 'edit') && (
                <div className="form-center-wrapper fade-in-up">
                    <div className="form-box">
                        <div className="form-top-bar">
                            <button className="btn-back-circle" onClick={() => setView('list')} title="Volver">
                                <ArrowLeft size={24} />
                            </button>
                            <div className="form-headings">
                                <h2>{view === 'create' ? 'Registrar Nuevo TDR' : 'Modificar TDR'}</h2>
                                <p>Complete la ficha técnica del proceso contractual.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveTDR} className="smart-form">
                            <div className="form-row">
                                <div className="input-field-container">
                                    <label className="field-label">
                                        <FileText size={16} className="label-icon"/> Número TDR
                                    </label>
                                    <input 
                                        type="text" name="numeroTDR" 
                                        required className="modern-input"
                                        value={formData.numeroTDR || ''} 
                                        onChange={handleInputChange} 
                                        placeholder="Ej: TDR-2025-001"
                                    />
                                </div>
                                <div className="input-field-container">
                                    <label className="field-label">
                                        <Layers size={16} className="label-icon"/> Tipo Proceso
                                    </label>
                                    <div className="select-wrapper">
                                        <select name="tipoProceso" className="modern-select" value={formData.tipoProceso || ''} onChange={handleInputChange}>
                                            <option>Seleccione...</option>
                                            <option>Ínfima cuantía</option>
                                            <option>Catálogo electrónico</option>
                                            <option>Régimen especial</option>
                                            <option>Subasta inversa</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="form-row full">
                                <div className="input-field-container">
                                    <label className="field-label">
                                        <Briefcase size={16} className="label-icon"/> Dirección Solicitante
                                    </label>
                                    <div className="select-wrapper">
                                        <select name="direccionSolicitante" className="modern-select" value={formData.direccionSolicitante || ''} onChange={handleInputChange}>
                                            <option value="">Seleccione...</option>
                                            {DIRECCIONES_INAMHI.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="form-row full">
                                <div className="input-field-container">
                                    <label className="field-label">
                                        <FileText size={16} className="label-icon"/> Objeto Contractual
                                    </label>
                                    <input 
                                        type="text" name="objetoContratacion" 
                                        className="modern-input"
                                        value={formData.objetoContratacion || ''} 
                                        onChange={handleInputChange} 
                                        placeholder="Descripción breve del objeto..."
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="input-field-container">
                                    <label className="field-label">
                                        <User size={16} className="label-icon"/> Responsable
                                    </label>
                                    <input 
                                        type="text" name="responsable" 
                                        className="modern-input"
                                        value={formData.responsable || ''} 
                                        onChange={handleInputChange} 
                                    />
                                </div>
                                <div className="input-field-container">
                                    <label className="field-label">
                                        <DollarSign size={16} className="label-icon"/> Presupuesto
                                    </label>
                                    <input 
                                        type="number" name="presupuesto" 
                                        className="modern-input"
                                        value={formData.presupuesto || ''} 
                                        onChange={handleInputChange} 
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="form-row full">
                                <div className="input-field-container">
                                    <label className="field-label">
                                        <Clock size={16} className="label-icon"/> Cálculo de Plazos
                                    </label>
                                    <div className="date-calculation-box" style={{background:'#F8FAFC', padding:'20px', borderRadius:'12px', border:'1px solid #E2E8F0', marginTop:'5px'}}>
                                        <div className="form-row" style={{marginBottom:0}}>
                                            <div className="input-field-container">
                                                <label className="field-label">Fecha Inicio</label>
                                                <input type="date" name="fechaInicio" className="modern-input" value={formData.fechaInicio || ''} onChange={handleInputChange} required/>
                                            </div>
                                            <div className="input-field-container">
                                                <label className="field-label">Duración</label>
                                                <div style={{display:'flex', gap:'10px'}}>
                                                    <input type="number" name="duracionCantidad" className="modern-input" style={{width:'80px', textAlign:'center'}} value={formData.duracionCantidad} onChange={handleInputChange} min="1"/>
                                                    <select name="duracionUnidad" className="modern-select duration-select" value={formData.duracionUnidad} onChange={handleInputChange}>
                                                        <option value="Dias">Días</option>
                                                        <option value="Meses">Meses</option>
                                                        <option value="Anios">Años</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="input-field-container" style={{marginTop:'15px'}}>
                                            <label className="field-label">Fecha Fin (Calculada)</label>
                                            <input type="date" name="fechaFin" className="modern-input calculated-date" value={formData.fechaFin || ''} readOnly />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions-bar">
                                <button type="button" className="btn-cancelar" onClick={() => setView('list')}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-guardar">
                                    <Save size={18}/> {view === 'create' ? 'Registrar TDR' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {view === 'detail' && selectedTdr && (
                <div className="tdr-form-container fade-in">
                    <div className="form-header">
                        <div><h2 className="form-title-main" style={{color:'#2563EB'}}>{selectedTdr.numeroTDR}</h2><p className="tdr-subtitle">{selectedTdr.objetoContratacion}</p></div>
                        <button className="btn-secondary" onClick={() => setView('list')}><ArrowLeft size={18}/> Volver</button>
                    </div>
                    <div className="form-tabs">
                        <button className={`tab-btn ${activeTab===1?'active':''}`} onClick={()=>setActiveTab(1)}>1. Documentación</button>
                        <button className={`tab-btn ${activeTab===2?'active':''}`} onClick={()=>setActiveTab(2)}>2. Soportes</button>
                        <button className={`tab-btn ${activeTab===3?'active':''}`} onClick={()=>setActiveTab(3)}>3. Actas</button>
                        <button className={`tab-btn ${activeTab===4?'active':''}`} onClick={()=>setActiveTab(4)}>4. Cierre</button>
                    </div>
                    <div className="tab-content-container">
                        {activeTab === 1 && (
                            <div className="form-grid">
                                {(['archivosNecesidad', 'archivosTDR'] as const).map(f => (
                                    <div className="input-block" key={f}>
                                        <label>{f==='archivosNecesidad'?'Necesidad':'TDR Firmado'}</label>
                                        <div className="multiple-files-container">
                                            {selectedTdr[f].map(x=>(
                                                <div key={x.id} className="uploaded-file-card">
                                                    <span style={{flex:1}}>{x.nombre}</span>
                                                    <button className="btn-icon danger" onClick={()=>handleRemoveMultipleFile(f,x.id)}><Trash2 size={16}/></button>
                                                </div>
                                            ))}
                                            <div className="file-upload-block">
                                                <button className="btn-secondary" onClick={()=>document.getElementById(`file-${f}`)?.click()}><Plus size={16}/> Agregar</button>
                                                <input id={`file-${f}`} type="file" hidden onChange={e=>handleAddMultipleFiles(f,e.target.files?.[0])}/>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div className="divider-line" style={{gridColumn:'1/-1', margin:'20px 0', borderTop:'1px solid #eee'}}></div>
                                <h4 style={{gridColumn:'1/-1', color:'#2563EB'}}>Archivos Técnicos Compartidos (Visible para Técnico)</h4>
                                
                                {[
                                    { key: 'archivoInformeTecnico' as const, label: 'Informe Técnico' },
                                    { key: 'archivoActaEntrega' as const, label: 'Acta Entrega-Recepción' },
                                    { key: 'archivoProducto' as const, label: 'Producto / Entregable' },
                                    { key: 'archivoVerificable' as const, label: 'Medio Verificable' }
                                ].map((item: { key: keyof TDR; label: string }) => (
                                    <div className="input-block" key={item.key}>
                                        <label>{item.label}</label>
                                        <div className="file-upload-block" style={{minHeight:'auto'}}>
                                            {selectedTdr[item.key] ? (
                                                <div className="uploaded-file-card" style={{width:'100%'}}>
                                                    <CheckCircle size={20} color="green"/>
                                                    <span style={{flex:1}}>Archivo Cargado</span>
                                                    <a href={String(selectedTdr[item.key] || '')} target="_blank" className="btn-icon" title="Ver"><Eye size={18}/></a>
                                                </div>
                                            ) : (
                                                <button className="btn-secondary" onClick={()=>document.getElementById(`admin-file-${item.key}`)?.click()}>
                                                    <UploadCloud size={18}/> Subir
                                                </button>
                                            )}
                                            <input id={`admin-file-${item.key}`} type="file" hidden 
                                                onChange={e => handleFileUploadSingle(item.key, e.target.files?.[0])}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {activeTab === 2 && (
                            <div>
                                <div className="generator-bar">
                                    <div className="generator-title"><Repeat size={20}/><span>Agregar Soportes</span></div>
                                    <div className="generator-controls">
                                        <div className="input-mini"><label>Cantidad</label><input type="number" value={scheduleParams.cantidad} onChange={e=>setScheduleParams({...scheduleParams, cantidad:+e.target.value})}/></div>
                                        <div className="input-mini"><label>Cada (Meses)</label><input type="number" value={scheduleParams.intervalo} onChange={e=>setScheduleParams({...scheduleParams, intervalo:+e.target.value})}/></div>
                                        <div className="input-mini"><label>Inicio</label><input type="date" value={scheduleParams.fechaInicio} onChange={e=>setScheduleParams({...scheduleParams, fechaInicio:e.target.value})}/></div>
                                        <button className="btn-primary" onClick={generateSchedule}><Plus size={18}/> Generar</button>
                                    </div>
                                </div>
                                <table className="mini-table">
                                    <thead><tr><th>Descripción</th><th>Fecha</th><th>Evidencia</th><th>Estado</th><th></th></tr></thead>
                                    <tbody>
                                        {selectedTdr.soportes.map(s=>(
                                            <tr key={s.id}>
                                                <td><b>{s.numero}</b></td>
                                                <td>{s.fechaProgramada}</td>
                                                <td>{s.archivo?<a href={s.archivo} target="_blank" className="file-link">Ver</a>:<button className="btn-secondary" onClick={()=>{setCurrentSupportId(s.id); setIsSupportModalOpen(true);}}><UploadCloud size={14}/></button>}</td>
                                                <td><span className={`badge ${s.cumplimiento==='Si'?'badge-success':'badge-warning'}`} onClick={()=>{setCurrentSupportId(s.id);setIsSupportModalOpen(true);}} style={{cursor:'pointer'}}>{s.cumplimiento}</span></td>
                                                <td><button className="btn-icon danger" onClick={()=>deleteSupport(s.id)}><Trash2 size={16}/></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {activeTab === 3 && (
                            <div>
                                <div className="generator-bar">
                                    <div className="generator-title"><FileIcon size={20}/><span>Registrar Acta</span></div>
                                    <div className="grid-3">
                                        <div className="input-block"><label>Fecha</label><input type="date" value={tempActa.fecha||''} onChange={e=>setTempActa({...tempActa, fecha:e.target.value})}/></div>
                                        <div className="input-block"><label>Archivo</label><input type="file" id="acta-file-input" onChange={e=>setTempActaFile(e.target.files?.[0]||null)}/></div>
                                        <div className="input-block"><label>Info</label><input placeholder="Ej: Acta 1" value={tempActa.numero||''} onChange={e=>setTempActa({...tempActa, numero:e.target.value})}/></div>
                                    </div>
                                    <button className="btn-primary" onClick={addActa}><UploadCloud size={18}/> Subir</button>
                                </div>
                                <div className="timeline-container">
                                    {selectedTdr.actasPago.map(a=>(
                                        <div key={a.id} className="timeline-item">
                                            <div className="timeline-dot"/>
                                            <div className="timeline-content">
                                                <div><strong>{a.numero}</strong> <small>{a.fecha}</small></div>
                                                <button className="btn-icon danger" onClick={()=>deleteActa(a.id)}><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activeTab === 4 && (
                            <div>
                                <div className="generator-bar">
                                    <div className="generator-title"><ShieldCheck size={20}/><span>Informe Final</span></div>
                                    <div className="form-grid" style={{marginBottom:0}}>
                                        <div className="input-block">
                                            <label>Fecha Emisión</label>
                                            <input type="date" value={selectedTdr.fechaConformidad||''} onChange={e=>setSelectedTdr({...selectedTdr, fechaConformidad:e.target.value})}/>
                                        </div>
                                        <div className="file-upload-block" style={{minHeight:'auto'}}>
                                            {selectedTdr.archivoConformidad ? (
                                                <div className="uploaded-file-card" style={{width:'100%'}}>
                                                    <CheckCircle size={20}/>
                                                    <span style={{flex:1}}>{selectedTdr.nombreArchivoConformidad}</span>
                                                    <button className="btn-icon danger" onClick={handleRemoveFileSingle}><Trash2 size={18}/></button>
                                                </div>
                                            ) : (
                                                <button className="btn-secondary" onClick={()=>document.getElementById('file-conf')?.click()}><UploadCloud size={18}/> Subir</button>
                                            )}
                                            <input id="file-conf" type="file" hidden onChange={e=>handleFileUploadSingle('archivoConformidad', e.target.files?.[0])}/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isSupportModalOpen && (
                <div className="tdr-modal-overlay">
                    <div className="tdr-modal-content">
                        <div className="tdr-modal-header">
                            <h3>Gestión Soporte</h3>
                            <button className="btn-icon" onClick={()=>setIsSupportModalOpen(false)}><X size={20}/></button>
                        </div>
                        <div className="tdr-modal-body">
                            <div className="input-block">
                                <label>Evidencia</label>
                                <input type="file" onChange={e=>setModalSupportData({...modalSupportData, archivo:e.target.files?.[0]||null})}/>
                            </div>
                            <div className="input-block" style={{marginTop:20}}>
                                <label>Cumplimiento</label>
                                <select value={modalSupportData.cumplimiento} onChange={e=>setModalSupportData({...modalSupportData, cumplimiento: e.target.value as 'Pendiente' | 'Si' | 'No'})}>
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Si">Si</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-button-container">
                            <button className="btn-primary" onClick={saveSupportFromModal}>Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TdrPage;
