import { useState, useEffect } from 'react';
import { 
    Plus, Search, Eye, FileText, ArrowLeft, DollarSign, CheckCircle, 
    Briefcase, AlertTriangle, ShieldCheck, Save, UploadCloud,
    Users, Repeat, X, Pencil, Layers, User, Calendar, Trash2, Info, ChevronLeft, Clock
} from 'lucide-react';
import { registrarHistorialGlobal } from '../utils/historyService';
import '../styles/TecnicoStyles.css';

// --- HELPER PARA GENERAR IDs ÚNICOS ---
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
    
    // 1. DOCUMENTACIÓN INICIAL
    archivosNecesidad: FileItem[];
    archivosTDR: FileItem[]; // TDR Firmado

    // 2. ARCHIVOS TÉCNICOS COMPARTIDOS
    archivoInformeTecnico: string | null;
    archivoActaEntrega: string | null;
    archivoProducto: string | null;
    archivoVerificable: string | null;
    
    // 3. SOPORTES
    soportes: Support[];

    // 4. CIERRE Y PAGOS
    actasPago: PaymentAct[];
    fechaConformidad: string | null;
    archivoConformidad: string | null; // Informe Final
    nombreArchivoConformidad?: string;
}

interface Contrato { id: number; numeroContrato: string; nombreProfesional: string; adminContrato: string; estado: string; }
interface Usuario { id: number; nombre: string; email: string; rol: string; area: string; }

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
    "LABORATORIO NACIONAL DE CALIDAD DE AGUA Y SEDIMENTOS"
];

// --- COMPONENTE AUXILIAR PARA CHECK VERDE O SUBIDA ---
const FileCard = ({ title, fileUrl, onUpload }: { title: string, fileUrl: string | null, onUpload: (f: File) => void }) => (
    <div className="dashed-upload-box">
        <div className="dashed-header">{title}</div>
        <div className="dashed-body">
            {fileUrl ? (
                <div className="file-loaded fade-in" style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'10px'}}>
                    <div className="icon-circle success"><CheckCircle size={24} /></div>
                    <span style={{color:'green', fontWeight:'bold', fontSize:'0.9rem'}}>Cargado Correctamente</span>
                    <div style={{display:'flex', gap:'10px'}}>
                        <a href={fileUrl} target="_blank" rel="noreferrer" className="btn-text-blue" style={{textDecoration:'none', display:'flex', alignItems:'center', gap:'5px'}}>
                            <Eye size={14}/> Ver
                        </a>
                        <label className="btn-text-blue" style={{cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>
                           <Pencil size={14} /> Editar
                           <input type="file" hidden onChange={(e) => e.target.files && onUpload(e.target.files[0])} />
                        </label>
                    </div>
                </div>
            ) : (
                <div className="file-empty">
                    <div className="icon-circle empty"><UploadCloud size={24} /></div>
                    <span className="file-status-text">Pendiente</span>
                    <label className="btn-add-white" style={{cursor:'pointer', marginTop:'10px'}}>
                        Subir Archivo
                        <input type="file" hidden onChange={(e) => e.target.files && onUpload(e.target.files[0])} />
                    </label>
                </div>
            )}
        </div>
    </div>
);

const TecnicoPage = () => {
    const [currentModule, setCurrentModule] = useState<'TDR' | 'CONTRATOS' | 'CONTRATADOS'>('TDR');
    const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTdr, setSelectedTdr] = useState<TDR | null>(null);
    const [activeTab, setActiveTab] = useState(1);
    
    const [formData, setFormData] = useState<Partial<TDR>>({});
    const [scheduleParams, setScheduleParams] = useState({ fechaInicio: '', cantidad: 1, intervalo: 1 });
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [currentSupportId, setCurrentSupportId] = useState<number | null>(null);
    const [modalSupportData, setModalSupportData] = useState<{ archivo: File | null; cumplimiento: string; }>({ archivo: null, cumplimiento: 'Pendiente' });

    // ESTADOS INICIALES VACÍOS
    const [tdrList, setTdrList] = useState<TDR[]>([]);
    const [contratosList, setContratosList] = useState<Contrato[]>([]);
    const [usuariosList, setUsuariosList] = useState<Usuario[]>([]);

    // --- CARGAR DATOS ---
    const cargarDatos = async () => {
        try {
            if (currentModule === 'TDR') {
                const res = await fetch('/api/tdr');
                if (res.ok) {
                    const data = await res.json();
                    const mapeados = data.map((t: any) => ({
                        id: t.id,
                        numeroTDR: t.numero_tdr, 
                        objetoContratacion: t.objeto_contratacion,
                        tipoProceso: t.tipo_proceso,
                        direccionSolicitante: t.direccion_solicitante,
                        presupuesto: t.presupuesto,
                        responsable: t.responsable,
                        fechaInicio: t.fecha_inicio ? t.fecha_inicio.split('T')[0] : '',
                        fechaFin: t.fecha_fin ? t.fecha_fin.split('T')[0] : '',
                        duracionCantidad: t.duracion_cantidad || 1,
                        duracionUnidad: t.duracion_unidad || 'Meses',
                        
                        // Arrays y Archivos (Inicialización segura)
                        archivosNecesidad: [],
                        archivosTDR: [],
                        archivoInformeTecnico: null,
                        archivoActaEntrega: null,
                        archivoProducto: null,
                        archivoVerificable: null,
                        actasPago: [],
                        fechaConformidad: null,
                        archivoConformidad: null,
                        soportes: []
                    }));
                    setTdrList(mapeados);
                }
            } else if (currentModule === 'CONTRATOS') {
                const res = await fetch('/api/contratos');
                if (res.ok) {
                    const data = await res.json();
                    const mapeados = data.map((c: any) => ({
                        id: c.id,
                        numeroContrato: c.numero_contrato,
                        nombreProfesional: c.nombre_profesional,
                        adminContrato: c.admin_contrato,
                        estado: c.estado || 'Activo'
                    }));
                    setContratosList(mapeados);
                }
            } else if (currentModule === 'CONTRATADOS') {
                const res = await fetch('/api/usuarios');
                if (res.ok) {
                    const data = await res.json();
                    setUsuariosList(data.filter((u: any) => u.rol === 'Contratado'));
                }
            }
        } catch (error) {
            console.error("Error cargando datos:", error);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [currentModule]);

    const getDaysRemaining = (endDate: string) => {
        if(!endDate) return 0;
        const diff = new Date(endDate).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24)); 
    };

    const getStatusBadge = (days: number) => {
        if (days < 0) return <span className="badge badge-danger">Vencido</span>;
        if (days <= 90) return <span className="badge badge-warning">Por Vencer</span>;
        return <span className="badge badge-success">Vigente</span>;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- CREAR TDR ---
    const handleCreateTDR = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.numeroTDR || !formData.objetoContratacion || !formData.fechaInicio) return alert("Complete los campos obligatorios");
        
        const datosParaBD = {
            numeroTDR: formData.numeroTDR,
            objetoContratacion: formData.objetoContratacion,
            tipoProceso: formData.tipoProceso,
            direccionSolicitante: formData.direccionSolicitante,
            presupuesto: formData.presupuesto,
            responsable: formData.responsable,
            fechaInicio: formData.fechaInicio,
            fechaFin: formData.fechaFin,
            duracionCantidad: 1,
            duracionUnidad: 'Meses'
        };

        try {
            const res = await fetch('/api/tdr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosParaBD)
            });

            if (res.ok) {
                registrarHistorialGlobal('Creación', 'TDR', `Técnico creó el TDR: ${formData.numeroTDR}`, 'Técnico Responsable');
                alert("TDR Registrado Exitosamente.");
                cargarDatos();
                setView('list'); 
                setFormData({});
            } else {
                alert("Error al guardar en la base de datos.");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión.");
        }
    };

    // --- SUBIDA DE ARCHIVOS (GENÉRICA) ---
    const handleFileUpload = (field: keyof TDR, file: File) => {
        if (!selectedTdr) return;
        // Simulación de URL local. En producción aquí va el FormData y fetch al backend.
        const updatedTdr = { ...selectedTdr, [field]: URL.createObjectURL(file) }; 
        
        // Si es archivo de TDR firmado, lo guardamos en el array correspondiente para compatibilidad
        if (field === 'archivosTDR' as any) { 
             // Lógica especial si fuera array, pero simplificamos a string para visualización rápida
        }

        setSelectedTdr(updatedTdr);
        setTdrList(tdrList.map(t => t.id === selectedTdr.id ? updatedTdr : t));
        registrarHistorialGlobal('Edición', 'TDR', `Carga de archivo (${field}) en TDR ${selectedTdr.numeroTDR}`, 'Técnico Responsable');
    };

    // --- LÓGICA DE SOPORTES ---
    const generateSchedule = () => {
        if (!selectedTdr || !scheduleParams.fechaInicio || scheduleParams.cantidad < 1) return alert("Configure parámetros.");
        
        const nuevosSoportes: Support[] = [];
        let fechaBase = new Date(scheduleParams.fechaInicio);
        fechaBase = new Date(fechaBase.valueOf() + fechaBase.getTimezoneOffset() * 60000);
        const baseId = generateId();

        for (let i = 0; i < scheduleParams.cantidad; i++) {
            const nuevaFecha = new Date(fechaBase);
            nuevaFecha.setMonth(fechaBase.getMonth() + (i * scheduleParams.intervalo));
            nuevosSoportes.push({
                id: baseId + i, 
                numero: `Mantenimiento ${selectedTdr.soportes.length + i + 1}`, 
                fechaProgramada: nuevaFecha.toISOString().split('T')[0],
                archivo: null, 
                nombreArchivo: undefined,
                cumplimiento: 'Pendiente'
            });
        }
        const updatedTdr = { ...selectedTdr, soportes: [...selectedTdr.soportes, ...nuevosSoportes] };
        setSelectedTdr(updatedTdr);
        setTdrList(tdrList.map(t => t.id === selectedTdr.id ? updatedTdr : t));
        registrarHistorialGlobal('Edición', 'TDR', `Generado cronograma de ${scheduleParams.cantidad} mantenimientos`, 'Técnico');
        setScheduleParams({ fechaInicio: '', cantidad: 1, intervalo: 1 });
    };

    const openSupportModal = (support: Support) => {
        setCurrentSupportId(support.id);
        setModalSupportData({ archivo: null, cumplimiento: support.cumplimiento });
        setIsSupportModalOpen(true);
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
        const updatedTdr = { ...selectedTdr, soportes: updatedSoportes };
        setSelectedTdr(updatedTdr);
        setTdrList(tdrList.map(t => t.id === selectedTdr.id ? updatedTdr : t));
        setIsSupportModalOpen(false);
    };

    const deleteSupport = (supportId: number) => {
        if(!selectedTdr) return;
        const updatedTdr = { ...selectedTdr, soportes: selectedTdr.soportes.filter(s => s.id !== supportId) };
        setSelectedTdr(updatedTdr);
        setTdrList(tdrList.map(t => t.id === selectedTdr.id ? updatedTdr : t));
    };

    return (
        <div className="tecnico-layout">
            <div className="tecnico-container">
                
                {/* --- NAVEGACIÓN SUPERIOR --- */}
                {view === 'list' && (
                    <div className="nav-pills-wrapper fade-in">
                        <div className="nav-pills-container">
                            <button className={`nav-pill-btn ${currentModule === 'TDR' ? 'active' : ''}`} onClick={() => { setCurrentModule('TDR'); setView('list'); }}>
                                <FileText size={18} /> Gestión TDRs
                            </button>
                            <button className={`nav-pill-btn ${currentModule === 'CONTRATOS' ? 'active' : ''}`} onClick={() => setCurrentModule('CONTRATOS')}>
                                <Briefcase size={18} /> Ver Contratos
                            </button>
                            <button className={`nav-pill-btn ${currentModule === 'CONTRATADOS' ? 'active' : ''}`} onClick={() => setCurrentModule('CONTRATADOS')}>
                                <Users size={18} /> Ver Contratados
                            </button>
                        </div>
                    </div>
                )}

                {/* MODULO TDR */}
                {currentModule === 'TDR' && (
                    <>
                        {view === 'list' && (
                            <div className="fade-in">
                                <header className="dashboard-header">
                                    <div><h1>Panel Técnico</h1><p>Gestión operativa de procesos y documentación</p></div>
                                    <button className="btn-primary" onClick={() => setView('create')}><Plus size={18} /> Nuevo TDR</button>
                                </header>

                                <div className="stats-grid">
                                    <div className="stat-card"><h3><Briefcase size={18}/> Mis Procesos</h3><div className="number">{tdrList.length}</div></div>
                                    <div className="stat-card warning"><h3><AlertTriangle size={18}/> Alertas Vencimiento</h3><div className="number">{tdrList.filter(t => { const d = getDaysRemaining(t.fechaFin); return d > 0 && d <= 90; }).length}</div></div>
                                    <div className="stat-card danger"><h3><ShieldCheck size={18}/> Vencidos</h3><div className="number">{tdrList.filter(t => getDaysRemaining(t.fechaFin) < 0).length}</div></div>
                                </div>

                                <div className="search-bar"><Search size={18} color="#64748B"/><input type="text" placeholder="Buscar por TDR o Objeto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>

                                <div className="white-panel">
                                    <div className="table-container">
                                        <table className="custom-table">
                                            <thead><tr><th>Nro. TDR</th><th>Objeto</th><th>Dirección</th><th>Días Restantes</th><th>Estado</th><th>Gestión</th></tr></thead>
                                            <tbody>
                                                {tdrList.filter(t => t.numeroTDR.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                                                    <tr><td colSpan={6} className="no-data">No hay registros encontrados.</td></tr>
                                                ) : (
                                                    tdrList.filter(t => t.numeroTDR.toLowerCase().includes(searchTerm.toLowerCase())).map(tdr => {
                                                        const days = getDaysRemaining(tdr.fechaFin);
                                                        return (
                                                            <tr key={tdr.id}>
                                                                <td className="highlight-text">{tdr.numeroTDR}</td><td>{tdr.objetoContratacion}</td><td>{tdr.direccionSolicitante}</td>
                                                                <td style={{fontWeight:'bold'}}>{days}</td><td>{getStatusBadge(days)}</td>
                                                                <td><button className="btn-icon" onClick={() => { setSelectedTdr(tdr); setView('detail'); }}><Eye size={18}/></button></td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* VISTA CREAR TDR */}
                        {view === 'create' && (
                            <div className="form-center-wrapper fade-in-up">
                                <div className="form-box">
                                    <div className="form-top-bar">
                                        <button className="btn-back-circle" onClick={() => setView('list')}><ArrowLeft size={24} /></button>
                                        <div className="form-headings"><h2>Nuevo TDR</h2><p>Registro de nuevo proceso técnico</p></div>
                                    </div>
                                    <form onSubmit={handleCreateTDR} className="smart-form">
                                        <div className="form-row">
                                            <div className="input-field-container">
                                                <label className="field-label"><FileText size={16} className="label-icon"/> Número TDR</label>
                                                <input className="modern-input" type="text" name="numeroTDR" required onChange={handleInputChange} placeholder="Ej: TDR-2025-001"/>
                                            </div>
                                            <div className="input-field-container">
                                                <label className="field-label"><Layers size={16} className="label-icon"/> Tipo de Proceso</label>
                                                <div className="select-wrapper"><select className="modern-select" name="tipoProceso" onChange={handleInputChange}><option>Seleccione...</option><option>Ínfima cuantía</option><option>Catálogo electrónico</option><option>Régimen especial</option></select></div>
                                            </div>
                                        </div>
                                        <div className="form-row full">
                                            <div className="input-field-container"><label className="field-label"><Briefcase size={16} className="label-icon"/> Dirección Solicitante</label><div className="select-wrapper"><select className="modern-select" name="direccionSolicitante" onChange={handleInputChange}><option value="">Seleccione...</option>{DIRECCIONES_INAMHI.map(d => <option key={d} value={d}>{d}</option>)}</select></div></div>
                                        </div>
                                        <div className="form-row full">
                                            <div className="input-field-container"><label className="field-label"><FileText size={16} className="label-icon"/> Objeto Contractual</label><input className="modern-input" type="text" name="objetoContratacion" required onChange={handleInputChange}/></div>
                                        </div>
                                        <div className="form-row">
                                            <div className="input-field-container"><label className="field-label"><User size={16} className="label-icon"/> Responsable</label><input className="modern-input" type="text" name="responsable" onChange={handleInputChange}/></div>
                                            <div className="input-field-container"><label className="field-label"><DollarSign size={16} className="label-icon"/> Presupuesto</label><input className="modern-input" type="number" name="presupuesto" onChange={handleInputChange} /></div>
                                        </div>
                                        <div className="form-row">
                                            <div className="input-field-container"><label className="field-label"><Calendar size={16} className="label-icon"/> Fecha Inicio</label><input className="modern-input" type="date" name="fechaInicio" required onChange={handleInputChange} /></div>
                                            <div className="input-field-container"><label className="field-label"><Calendar size={16} className="label-icon"/> Fecha Fin</label><input className="modern-input" type="date" name="fechaFin" required onChange={handleInputChange} /></div>
                                        </div>
                                        <div className="form-actions-bar">
                                            <button type="button" className="btn-cancelar" onClick={() => setView('list')}>Cancelar</button>
                                            <button type="submit" className="btn-guardar"><Save size={18}/> REGISTRAR TDR</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* VISTA DETALLE - 5 PESTAÑAS */}
                        {view === 'detail' && selectedTdr && (
                            <div className="admin-container fade-in">
                                <div className="admin-card">
                                    <div className="admin-header">
                                        <div className="admin-title-group">
                                            <h1>{selectedTdr.numeroTDR}</h1>
                                            <p>{selectedTdr.objetoContratacion}</p>
                                        </div>
                                        <button className="btn-back-outline" onClick={() => setView('list')}>
                                            <ChevronLeft size={16} /> Volver
                                        </button>
                                    </div>

                                    {/* --- TABS --- */}
                                    <div className="admin-tabs-container">
                                        <button className={`admin-tab ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>1. Documentación</button>
                                        <button className={`admin-tab ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>2. Archivos</button>
                                        <button className={`admin-tab ${activeTab === 3 ? 'active' : ''}`} onClick={() => setActiveTab(3)}>3. Soportes</button>
                                        <button className={`admin-tab ${activeTab === 4 ? 'active' : ''}`} onClick={() => setActiveTab(4)}>4. Cierre</button>
                                        <button className={`admin-tab ${activeTab === 5 ? 'active' : ''}`} onClick={() => setActiveTab(5)}>5. Datos</button>
                                    </div>

                                    <div className="admin-content-area">
                                        
                                        {/* TAB 1: DOCUMENTACIÓN INICIAL (Necesidad y TDR Firmado) */}
                                        {activeTab === 1 && (
                                            <div className="admin-grid-upload two-columns">
                                                {/* Simulamos que 'archivosNecesidad' es un solo archivo para la vista simple del técnico, o usamos el array */}
                                                <FileCard 
                                                    title="INFORME DE NECESIDAD" 
                                                    fileUrl={selectedTdr.archivosNecesidad.length > 0 ? selectedTdr.archivosNecesidad[0].url : null} 
                                                    onUpload={(f) => {
                                                        // Lógica simulada para agregar al array
                                                        const newFile = { id: Date.now(), url: URL.createObjectURL(f), nombre: f.name };
                                                        const updated = { ...selectedTdr, archivosNecesidad: [...selectedTdr.archivosNecesidad, newFile] };
                                                        setSelectedTdr(updated);
                                                    }} 
                                                />
                                                <FileCard 
                                                    title="TDR FIRMADO" 
                                                    fileUrl={selectedTdr.archivosTDR.length > 0 ? selectedTdr.archivosTDR[0].url : null} 
                                                    onUpload={(f) => {
                                                        const newFile = { id: Date.now(), url: URL.createObjectURL(f), nombre: f.name };
                                                        const updated = { ...selectedTdr, archivosTDR: [...selectedTdr.archivosTDR, newFile] };
                                                        setSelectedTdr(updated);
                                                    }} 
                                                />
                                            </div>
                                        )}

                                        {/* TAB 2: ARCHIVOS TÉCNICOS (LOS 4 COMPARTIDOS) */}
                                        {activeTab === 2 && (
                                            <div className="admin-grid-upload">
                                                <FileCard title="INFORME TÉCNICO" fileUrl={selectedTdr.archivoInformeTecnico} onUpload={(f) => handleFileUpload('archivoInformeTecnico', f)} />
                                                <FileCard title="ACTA ENTREGA-RECEPCIÓN" fileUrl={selectedTdr.archivoActaEntrega} onUpload={(f) => handleFileUpload('archivoActaEntrega', f)} />
                                                <FileCard title="PRODUCTO / ENTREGABLE" fileUrl={selectedTdr.archivoProducto} onUpload={(f) => handleFileUpload('archivoProducto', f)} />
                                                <FileCard title="MEDIO VERIFICABLE" fileUrl={selectedTdr.archivoVerificable} onUpload={(f) => handleFileUpload('archivoVerificable', f)} />
                                            </div>
                                        )}

                                        {/* TAB 3: SOPORTES (MANTENIMIENTOS) */}
                                        {activeTab === 3 && (
                                            <div>
                                                <div className="generator-bar">
                                                    <div style={{flex:1}}>
                                                        <h4 style={{margin:'0 0 15px', color:'#1E293B', display:'flex', gap:'10px', alignItems:'start'}}><Repeat size={20} color="#2563EB"/> Crear Soporte</h4>
                                                        <div style={{display:'flex', gap:'20px'}}>
                                                            <div className="gen-input-group"><label>Cantidad</label><input type="number" min="1" value={scheduleParams.cantidad} onChange={(e) => setScheduleParams({...scheduleParams, cantidad: parseInt(e.target.value)})} /></div>
                                                            <div className="gen-input-group"><label>Meses</label><input type="number" min="1" value={scheduleParams.intervalo} onChange={(e) => setScheduleParams({...scheduleParams, intervalo: parseInt(e.target.value)})} /></div>
                                                            <div className="gen-input-group"><label>Inicio</label><input type="date" value={scheduleParams.fechaInicio} onChange={(e) => setScheduleParams({...scheduleParams, fechaInicio: e.target.value})} /></div>
                                                        </div>
                                                    </div>
                                                    <button className="btn-primary" onClick={generateSchedule} style={{height:'45px'}}>Generar Fechas</button>
                                                </div>

                                                <div className="white-panel" style={{border:'none', boxShadow:'none', padding:0}}>
                                                    <table className="mini-table">
                                                        <thead><tr><th>Descripción</th><th>Fecha</th><th>Evidencia</th><th>Estado</th><th>Acción</th></tr></thead>
                                                        <tbody>
                                                            {selectedTdr.soportes.length === 0 ? (<tr><td colSpan={5} style={{textAlign:'center', padding:'30px', color:'#999'}}>No hay mantenimientos.</td></tr>) : (
                                                                selectedTdr.soportes.sort((a,b) => new Date(a.fechaProgramada).getTime() - new Date(b.fechaProgramada).getTime()).map((sop, idx) => (
                                                                    <tr key={idx}>
                                                                        <td style={{fontWeight:600}}>{sop.numero}</td>
                                                                        <td>{sop.fechaProgramada}</td>
                                                                        <td>{sop.archivo ? <button className="btn-icon" style={{width:'30px', height:'30px'}} onClick={() => openSupportModal(sop)}><Pencil size={14}/></button> : <button className="btn-secondary" style={{padding:'5px 10px', fontSize:'0.8rem'}} onClick={() => openSupportModal(sop)}>Subir</button>}</td>
                                                                        <td><span className={`badge ${sop.cumplimiento === 'Si' ? 'badge-success' : 'badge-warning'}`}>{sop.cumplimiento}</span></td>
                                                                        <td><button className="btn-icon danger" style={{width:'30px', height:'30px'}} onClick={() => deleteSupport(sop.id)}><Trash2 size={14}/></button></td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 4: CIERRE Y ACTAS (SOLO LECTURA) */}
                                        {activeTab === 4 && (
                                            <div className="fade-in">
                                                {/* Informe Final */}
                                                <div className="dashed-upload-box" style={{marginBottom: '20px'}}>
                                                    <div className="dashed-header">INFORME FINAL DE CONFORMIDAD</div>
                                                    <div className="dashed-body">
                                                        {selectedTdr.archivoConformidad ? (
                                                            <div className="file-loaded">
                                                                <div className="icon-circle success"><CheckCircle size={24} /></div>
                                                                <div style={{display:'flex', flexDirection:'column'}}>
                                                                    <span style={{fontWeight:'bold', color:'#166534'}}>Documento Legalizado</span>
                                                                    <span style={{fontSize:'0.85rem', color:'#64748B'}}>{selectedTdr.nombreArchivoConformidad || 'Informe.pdf'}</span>
                                                                </div>
                                                                <a href={selectedTdr.archivoConformidad} target="_blank" rel="noreferrer" className="btn-text-blue" style={{marginLeft:'auto'}}>
                                                                    <Eye size={16}/> Visualizar
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <div className="file-empty">
                                                                <div className="icon-circle warning"><Clock size={24} /></div>
                                                                <span style={{color:'#64748B'}}>Pendiente de carga por el Administrador</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Listado de Actas */}
                                                <div className="section-header" style={{marginTop:'30px', marginBottom:'15px'}}>
                                                    <h4 style={{color:'#1E293B', display:'flex', alignItems:'center', gap:'10px'}}>
                                                        <FileText size={20} color="#2563EB"/> Actas Registradas
                                                    </h4>
                                                </div>
                                                <div className="white-panel" style={{padding:0, overflow:'hidden'}}>
                                                    <table className="mini-table">
                                                        <thead><tr><th>Nro. Acta</th><th>Fecha</th><th>Archivo</th><th>Estado</th></tr></thead>
                                                        <tbody>
                                                            {(!selectedTdr.actasPago || selectedTdr.actasPago.length === 0) ? (
                                                                <tr><td colSpan={4} style={{textAlign:'center', padding:'30px', color:'#999'}}>No hay actas registradas por el Administrador.</td></tr>
                                                            ) : (
                                                                selectedTdr.actasPago.map((acta) => (
                                                                    <tr key={acta.id}>
                                                                        <td style={{fontWeight:'bold'}}>{acta.numero}</td>
                                                                        <td>{acta.fecha}</td>
                                                                        <td>{acta.archivo ? <a href={acta.archivo} target="_blank" rel="noreferrer" className="btn-icon" title="Ver Acta"><Eye size={16}/></a> : <span style={{color:'#999'}}>-</span>}</td>
                                                                        <td><span className="badge badge-success">Cargado</span></td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB 5: DATOS (SOLO LECTURA) */}
                                        {activeTab === 5 && (
                                            <div className="smart-form">
                                                <div className="readonly-banner">
                                                    <Info size={20} />
                                                    <span>Modo de solo lectura: Estos datos provienen del TDR original y no son editables.</span>
                                                </div>
                                                <div className="input-field-container"><label className="field-label">Objeto Contractual</label><input className="modern-input input-disabled" value={selectedTdr.objetoContratacion} disabled /></div>
                                                <div className="form-row">
                                                    <div className="input-field-container"><label className="field-label">Dirección Solicitante</label><input className="modern-input input-disabled" value={selectedTdr.direccionSolicitante} disabled /></div>
                                                    <div className="input-field-container"><label className="field-label">Responsable</label><input className="modern-input input-disabled" value={selectedTdr.responsable} disabled /></div>
                                                </div>
                                                <div className="form-row">
                                                    <div className="input-field-container"><label className="field-label">Fecha Inicio</label><input className="modern-input input-disabled" value={selectedTdr.fechaInicio} disabled /></div>
                                                    <div className="input-field-container"><label className="field-label">Fecha Fin</label><input className="modern-input input-disabled" value={selectedTdr.fechaFin} disabled /></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* OTROS MODULOS */}
                {currentModule === 'CONTRATOS' && (
                    <div className="fade-in">
                        <header className="dashboard-header"><div><h1>Listado de Contratos</h1><p>Vista de consulta general</p></div>
                        <button className="btn-secondary" onClick={() => setCurrentModule('TDR')}><ArrowLeft size={18} /> Volver al Panel</button>
                        </header>
                        <div className="white-panel"><table className="custom-table"><thead><tr><th>Nro. Contrato</th><th>Profesional</th><th>Admin. Contrato</th><th>Estado</th></tr></thead><tbody>{contratosList.length === 0 ? (<tr><td colSpan={4} style={{textAlign:'center', padding:'40px', color:'#999'}}>No hay contratos.</td></tr>) : (contratosList.map(c => (<tr key={c.id}><td className="highlight-text">{c.numeroContrato}</td><td>{c.nombreProfesional}</td><td>{c.adminContrato}</td><td><span className="badge badge-success">{c.estado}</span></td></tr>)))}</tbody></table></div>
                    </div>
                )}

                {currentModule === 'CONTRATADOS' && (
                    <div className="fade-in">
                        <header className="dashboard-header"><div><h1>Personal Contratado</h1><p>Directorio de profesionales</p></div>
                        <button className="btn-secondary" onClick={() => setCurrentModule('TDR')}><ArrowLeft size={18} /> Volver al Panel</button>
                        </header>
                        <div className="white-panel"><table className="custom-table"><thead><tr><th>Nombre</th><th>Email</th><th>Área Asignada</th></tr></thead><tbody>{usuariosList.length === 0 ? (<tr><td colSpan={3} style={{textAlign:'center', padding:'40px', color:'#999'}}>No hay personal.</td></tr>) : (usuariosList.map(u => (<tr key={u.id}><td style={{fontWeight:600}}>{u.nombre}</td><td>{u.email}</td><td>{u.area}</td></tr>)))}</tbody></table></div>
                    </div>
                )}

                {/* MODAL MANTENIMIENTOS */}
                {isSupportModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header"><h3>Gestión de Mantenimiento</h3><button className="btn-icon" onClick={() => setIsSupportModalOpen(false)}><X size={20}/></button></div>
                            <div className="smart-form">
                                <div className="input-field-container"><label className="field-label">Evidencia</label><input type="file" className="modern-input" style={{paddingTop:'12px'}} onChange={(e) => setModalSupportData({...modalSupportData, archivo: e.target.files?.[0] || null})}/></div>
                                <div className="input-field-container"><label className="field-label">Estado</label><select className="modern-select" value={modalSupportData.cumplimiento} onChange={(e) => setModalSupportData({...modalSupportData, cumplimiento: e.target.value})}><option value="Pendiente">Pendiente</option><option value="Si">Cumplido (Sí)</option><option value="No">No Cumplido</option></select></div>
                                <div className="form-actions-bar" style={{marginTop:'20px'}}><button className="btn-cancelar" onClick={() => setIsSupportModalOpen(false)}>Cancelar</button><button className="btn-guardar" onClick={saveSupportFromModal}>Guardar</button></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default TecnicoPage;
