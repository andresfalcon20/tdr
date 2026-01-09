import { useState, useEffect } from 'react';
import { 
    Plus, Search, Eye, ArrowLeft, Calendar,
    FileText, CheckCircle, AlertTriangle, ShieldCheck, 
    Download, Trash2, UploadCloud, File, Save, Pencil,
    Repeat, X
} from 'lucide-react';
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

// --- INTERFACES ---
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
    cumplimiento: 'Si' | 'No' | 'Pendiente';
}

interface PaymentAct {
    id: number; 
    numero: string; 
    fecha: string; 
    archivo: string | null; 
    nombreArchivo?: string;
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
    duracionCantidad: number; 
    duracionUnidad: 'Dias' | 'Meses' | 'Anios'; 
    fechaFin: string; 
    
    // ARCHIVOS MULTIPLES
    archivosNecesidad: FileItem[];
    archivosTDR: FileItem[];
    
    soportes: Support[];
    actasPago: PaymentAct[];
    
    fechaConformidad: string | null;
    archivoConformidad: string | null;
    nombreArchivoConformidad?: string;
}

const TdrPage = () => {
    // ESTADOS GENERALES
    const [view, setView] = useState<'list' | 'create' | 'detail' | 'edit'>('list');
    const [activeTab, setActiveTab] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTdr, setSelectedTdr] = useState<TDR | null>(null);

    // FORMULARIO TDR
    const [formData, setFormData] = useState<Partial<TDR>>({
        duracionCantidad: 1,
        duracionUnidad: 'Meses'
    });

    // --- ESTADOS PARA GENERADOR DE SOPORTES ---
    // Parametros para generar las fechas
    const [scheduleParams, setScheduleParams] = useState({
        fechaInicio: '',
        cantidad: 1,
        intervalo: 1 // Meses
    });

    // --- ESTADOS PARA EL MODAL DE GESTIÓN DE SOPORTE ---
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
    const [currentSupportId, setCurrentSupportId] = useState<number | null>(null);
    const [modalSupportData, setModalSupportData] = useState<{
        archivo: File | null;
        cumplimiento: 'Si' | 'No' | 'Pendiente';
    }>({ archivo: null, cumplimiento: 'Pendiente' });

    // ESTADOS ACTAS
    const [tempActa, setTempActa] = useState<Partial<PaymentAct>>({});
    const [tempActaFile, setTempActaFile] = useState<File | null>(null);

    // LISTA PRINCIPAL
    const [tdrList, setTdrList] = useState<TDR[]>(() => {
        const saved = localStorage.getItem('sistema_tdr');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('sistema_tdr', JSON.stringify(tdrList));
    }, [tdrList]);

    // --- HISTORIAL ---
    const registrarHistorial = (accion: 'Creación' | 'Edición' | 'Eliminación', detalle: string) => {
        const historial = JSON.parse(localStorage.getItem('sistema_historial') || '[]');
        const nuevoLog = {
            id: Date.now(),
            accion: accion,
            entidad: 'TDR',
            detalle: detalle,
            fecha: new Date().toISOString(),
            usuario: 'Admin General' 
        };
        localStorage.setItem('sistema_historial', JSON.stringify([nuevoLog, ...historial]));
    };

    // --- CALCULADORA FECHAS ---
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

    // --- CRUD TDR ---
    const handleSaveTDR = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.numeroTDR || !formData.fechaInicio || !formData.fechaFin) {
            return alert("Por favor complete los campos obligatorios.");
        }

        if (view === 'create') {
            const newTDR = { 
                ...formData, id: Date.now(), 
                soportes: [], actasPago: [], 
                archivosNecesidad: [], archivosTDR: [],
                archivoConformidad: null, fechaConformidad: null
            } as TDR;
            setTdrList([...tdrList, newTDR]);
            registrarHistorial('Creación', `Se inició el proceso TDR: ${newTDR.numeroTDR} (Objeto: ${newTDR.objetoContratacion})`);
            setSelectedTdr(newTDR);
            setView('detail');
            setActiveTab(1);
            alert("TDR Creado Exitosamente");
        } else if (view === 'edit' && formData.id) {
            const original = tdrList.find(t => t.id === formData.id);
            if (original) {
                const cambios: string[] = [];
                if (original.numeroTDR !== formData.numeroTDR) cambios.push(`Nro: ${original.numeroTDR} → ${formData.numeroTDR}`);
                if (original.presupuesto !== formData.presupuesto) cambios.push(`Presupuesto: $${original.presupuesto} → $${formData.presupuesto}`);
                const msg = cambios.length > 0 
                    ? `Edición de datos principales en TDR ${original.numeroTDR}: ${cambios.join(', ')}`
                    : `Actualización general del TDR ${original.numeroTDR}`;
                registrarHistorial('Edición', msg);
            }
            const updatedList = tdrList.map(t => t.id === formData.id ? { ...t, ...formData } as TDR : t);
            setTdrList(updatedList);
            setSelectedTdr({ ...formData } as TDR); 
            setView('detail');
            alert("TDR Actualizado Exitosamente");
        }
    };

    const handleDeleteTDR = (id: number) => {
        const tdrToDelete = tdrList.find(t => t.id === id);
        if(window.confirm("¿Estás seguro de eliminar este TDR? Esta acción no se puede deshacer.")) {
            setTdrList(tdrList.filter(t => t.id !== id));
            if(tdrToDelete) registrarHistorial('Eliminación', `Se eliminó el proceso TDR: ${tdrToDelete.numeroTDR}`);
            if (selectedTdr?.id === id) { setView('list'); setSelectedTdr(null); }
        }
    };

    const openEditView = (tdr: TDR) => { setFormData({ ...tdr }); setView('edit'); };
    const openCreateView = () => { setFormData({ duracionCantidad: 1, duracionUnidad: 'Meses' }); setView('create'); };

    const updateTdrInList = (updated: TDR, mensajeHistorial?: string) => {
        setSelectedTdr(updated);
        setTdrList(tdrList.map(t => t.id === updated.id ? updated : t));
        if (mensajeHistorial) registrarHistorial('Edición', mensajeHistorial);
    };

    // --- ARCHIVOS ---
    const handleAddMultipleFiles = (field: 'archivosNecesidad' | 'archivosTDR', file: File | undefined) => {
        if(!selectedTdr || !file) return;
        const newFile: FileItem = { id: Date.now(), url: URL.createObjectURL(file), nombre: file.name };
        const updatedTdr = { ...selectedTdr, [field]: [...selectedTdr[field], newFile] };
        updateTdrInList(updatedTdr, `Se agregó archivo "${file.name}" a la sección ${field === 'archivosNecesidad' ? 'Necesidad' : 'TDR'}`);
    };

    const handleRemoveMultipleFile = (field: 'archivosNecesidad' | 'archivosTDR', fileId: number) => {
        if (!selectedTdr) return;
        const fileRemoved = selectedTdr[field].find(f => f.id === fileId);
        const updatedFiles = selectedTdr[field].filter(f => f.id !== fileId);
        updateTdrInList({ ...selectedTdr, [field]: updatedFiles }, `Se eliminó archivo "${fileRemoved?.nombre}" del TDR ${selectedTdr.numeroTDR}`);
    };

    const handleFileUploadSingle = (field: 'archivoConformidad', file: File | undefined) => {
        if(!selectedTdr || !file) return;
        const updatedTdr = { ...selectedTdr, [field]: URL.createObjectURL(file), nombreArchivoConformidad: file.name };
        updateTdrInList(updatedTdr, `Carga de Informe de Conformidad Final para TDR ${selectedTdr.numeroTDR}`);
    };

    const handleRemoveFileSingle = () => {
        if (!selectedTdr) return;
        updateTdrInList({ ...selectedTdr, archivoConformidad: null, nombreArchivoConformidad: undefined }, `Eliminación de Informe de Conformidad del TDR ${selectedTdr.numeroTDR}`);
    };

    // --- LOGICA DE SOPORTES (GENERADOR + MODAL) ---

    // 1. GENERAR CRONOGRAMA
    const generateSchedule = () => {
        if (!selectedTdr || !scheduleParams.fechaInicio || scheduleParams.cantidad < 1) {
            return alert("Configure la fecha de inicio y la cantidad.");
        }

        const nuevosSoportes: Support[] = [];
        let fechaBase = new Date(scheduleParams.fechaInicio);
        // Ajuste zona horaria
        fechaBase = new Date(fechaBase.valueOf() + fechaBase.getTimezoneOffset() * 60000);

        for (let i = 0; i < scheduleParams.cantidad; i++) {
            const nuevaFecha = new Date(fechaBase);
            // Sumar meses según intervalo
            nuevaFecha.setMonth(fechaBase.getMonth() + (i * scheduleParams.intervalo));
            
            nuevosSoportes.push({
                id: Date.now() + i, 
                numero: `Mantenimiento ${selectedTdr.soportes.length + i + 1}`, 
                fechaProgramada: nuevaFecha.toISOString().split('T')[0],
                archivo: null, 
                nombreArchivo: undefined,
                cumplimiento: 'Pendiente'
            });
        }

        updateTdrInList(
            { ...selectedTdr, soportes: [...selectedTdr.soportes, ...nuevosSoportes] },
            `Se generó un cronograma de ${scheduleParams.cantidad} mantenimientos para el TDR ${selectedTdr.numeroTDR}`
        );
        
        // Reset inputs
        setScheduleParams({ fechaInicio: '', cantidad: 1, intervalo: 1 });
    };

    // 2. ABRIR MODAL PARA GESTIONAR
    const openSupportModal = (support: Support) => {
        setCurrentSupportId(support.id);
        setModalSupportData({ archivo: null, cumplimiento: support.cumplimiento });
        setIsSupportModalOpen(true);
    };

    // 3. GUARDAR DESDE EL MODAL
    const saveSupportFromModal = () => {
        if (!selectedTdr || !currentSupportId) return;

        const updatedSoportes = selectedTdr.soportes.map(s => {
            if (s.id === currentSupportId) {
                // Si subió un archivo nuevo, generamos URL, si no, mantenemos el anterior
                let newUrl = s.archivo;
                let newName = s.nombreArchivo;
                
                if (modalSupportData.archivo) {
                    newUrl = URL.createObjectURL(modalSupportData.archivo);
                    newName = modalSupportData.archivo.name;
                }

                return {
                    ...s,
                    archivo: newUrl,
                    nombreArchivo: newName,
                    cumplimiento: modalSupportData.cumplimiento
                };
            }
            return s;
        });

        // Encontrar info para el historial
        const soporteEditado = updatedSoportes.find(s => s.id === currentSupportId);

        updateTdrInList(
            { ...selectedTdr, soportes: updatedSoportes },
            `Se actualizó el estado del soporte "${soporteEditado?.numero}" a: ${modalSupportData.cumplimiento}`
        );

        setIsSupportModalOpen(false);
    };

    const deleteSupport = (supportId: number) => {
        if(!selectedTdr) return;
        const deleted = selectedTdr.soportes.find(s => s.id === supportId);
        const updatedSupports = selectedTdr.soportes.filter(s => s.id !== supportId);
        updateTdrInList({ ...selectedTdr, soportes: updatedSupports }, `Eliminación de soporte: "${deleted?.numero}"`);
    };

    // --- ACTAS ---
    const addActa = () => {
        if(!selectedTdr || !tempActa.fecha) return alert("La fecha es obligatoria");
        if (!tempActaFile) return alert("Debe subir el archivo del Acta");
        const newActa: PaymentAct = { id: Date.now(), numero: tempActa.numero || 'S/N', fecha: tempActa.fecha || '', archivo: URL.createObjectURL(tempActaFile), nombreArchivo: tempActaFile.name };
        updateTdrInList({ ...selectedTdr, actasPago: [...selectedTdr.actasPago, newActa] }, `Carga de Acta de Pago: "${newActa.numero}"`);
        setTempActa({ numero: '', fecha: '' }); setTempActaFile(null); (document.getElementById('acta-file-input') as HTMLInputElement).value = '';
    };

    const deleteActa = (actaId: number) => {
        if(!selectedTdr) return;
        const deleted = selectedTdr.actasPago.find(a => a.id === actaId);
        const updatedActas = selectedTdr.actasPago.filter(a => a.id !== actaId);
        updateTdrInList({ ...selectedTdr, actasPago: updatedActas }, `Eliminación de Acta de Pago: "${deleted?.numero}"`);
    };

    const handleConformidadDate = (date: string) => {
        if(!selectedTdr) return;
        const updated = { ...selectedTdr, fechaConformidad: date };
        setSelectedTdr(updated);
        setTdrList(tdrList.map(t => t.id === updated.id ? updated : t));
    };

    const filteredTDRs = tdrList.filter(t => t.numeroTDR.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="tdr-container">
            
            {/* LISTADO */}
            {view === 'list' && (
                <div>
                    <header className="dashboard-header">
                        <div><h1>Gestión de TDR</h1><p>Control de procesos contractuales y plazos</p></div>
                        <button className="btn-primary" onClick={openCreateView}><Plus size={20} /> Nuevo TDR</button>
                    </header>
                    <div className="stats-grid">
                        <div className="stat-card"><h3><FileText size={18}/> Procesos Activos</h3><div className="number">{tdrList.length}</div></div>
                        <div className="stat-card warning"><h3><AlertTriangle size={18}/> Por Vencer</h3><div className="number">{tdrList.filter(t => { const d = getDaysRemaining(t.fechaFin); return d > 0 && d <= 90; }).length}</div></div>
                        <div className="stat-card danger"><h3><ShieldCheck size={18}/> Vencidos</h3><div className="number">{tdrList.filter(t => getDaysRemaining(t.fechaFin) < 0).length}</div></div>
                    </div>
                    <div className="filters-bar"><div className="search-bar"><Search size={18} color="#4318FF"/><input type="text" placeholder="Buscar por Nro TDR..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
                    <div className="white-panel">
                        <table className="custom-table">
                            <thead><tr><th>Nro. TDR</th><th>Objeto</th><th>Responsable</th><th>Fin Contrato</th><th>Estado</th><th>Acción</th></tr></thead>
                            <tbody>
                                {filteredTDRs.length === 0 ? (<tr><td colSpan={6} className="no-data">No hay registros.</td></tr>) : (
                                    filteredTDRs.map(tdr => (
                                        <tr key={tdr.id}>
                                            <td className="highlight-text">{tdr.numeroTDR}</td><td>{tdr.objetoContratacion}</td><td>{tdr.responsable}</td><td>{tdr.fechaFin}</td>
                                            <td>{tdr.fechaConformidad ? <span className="badge conformidad-finalizado">Finalizado</span> : <span className="badge badge-success">En Ejecución</span>}</td>
                                            <td><div className="action-buttons"><button className="btn-icon" onClick={() => { setSelectedTdr(tdr); setView('detail'); }} title="Ver Detalles"><Eye size={18}/></button><button className="btn-icon" onClick={() => openEditView(tdr)} title="Editar Información"><Pencil size={18}/></button><button className="btn-icon btn-danger" onClick={() => handleDeleteTDR(tdr.id)} title="Eliminar"><Trash2 size={18}/></button></div></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* FORMULARIO */}
            {(view === 'create' || view === 'edit') && (
                <div className="tdr-form-container">
                    <div className="form-header"><button className="btn-secondary" onClick={() => setView('list')}><ArrowLeft size={18} /> Cancelar</button><div className="form-header-center"><h2 className="form-title-main">{view === 'create' ? 'Nuevo Proceso TDR' : 'Modificar TDR'}</h2><div className="form-title-underline"></div></div></div>
                    <form onSubmit={handleSaveTDR}>
                        <div className="form-grid">
                            <div className="input-block"><label>Número TDR</label><input type="text" name="numeroTDR" required value={formData.numeroTDR || ''} onChange={handleInputChange} /></div>
                            <div className="input-block"><label>Tipo Proceso</label><select name="tipoProceso" value={formData.tipoProceso || ''} onChange={handleInputChange}><option>Seleccione...</option><option>Ínfima cuantía</option><option>Catálogo electrónico</option><option>Régimen especial</option></select></div>
                            <div className="input-block full-width"><label>Dirección Solicitante</label><select name="direccionSolicitante" value={formData.direccionSolicitante || ''} onChange={handleInputChange}><option value="">Seleccione...</option>{DIRECCIONES_INAMHI.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                            <div className="input-block full-width"><label>Objeto Contractual</label><input type="text" name="objetoContratacion" value={formData.objetoContratacion || ''} onChange={handleInputChange} /></div>
                            <div className="input-block"><label>Responsable</label><input type="text" name="responsable" value={formData.responsable || ''} onChange={handleInputChange} /></div>
                            <div className="input-block"><label>Presupuesto</label><input type="number" name="presupuesto" value={formData.presupuesto || ''} onChange={handleInputChange} /></div>
                        </div>
                        <div className="input-block full-width"><label className="label-with-icon"><Calendar size={18}/> Plazo de Ejecución</label><div className="date-calculation-box"><div className="input-block"><label>Fecha Inicio</label><input type="date" name="fechaInicio" value={formData.fechaInicio || ''} onChange={handleInputChange} required/></div><div className="input-block"><label>Duración</label><div className="input-group-flex"><input type="number" name="duracionCantidad" value={formData.duracionCantidad} onChange={handleInputChange} min="1" className="duration-input"/><select name="duracionUnidad" value={formData.duracionUnidad} onChange={handleInputChange} className="duration-select"><option value="Dias">Días</option><option value="Meses">Meses</option><option value="Anios">Años</option></select></div></div><div className="input-block"><label>Fecha Fin (Calculada)</label><input type="date" name="fechaFin" value={formData.fechaFin || ''} readOnly className="calculated-date"/></div></div></div>
                        <div className="form-button-container"><button type="submit" className="btn-primary-large"><Save size={18} style={{marginRight:'8px'}}/> {view === 'create' ? 'GUARDAR Y CONTINUAR' : 'GUARDAR CAMBIOS'}</button></div>
                    </form>
                </div>
            )}

            {/* DETALLE */}
            {view === 'detail' && selectedTdr && (
                <div className="tdr-form-container">
                    <div className="form-header"><button className="btn-secondary" onClick={() => setView('list')}><ArrowLeft size={18} /> Volver</button><div className="form-header-center"><h2 className="tdr-number">{selectedTdr.numeroTDR}</h2><p className="tdr-objeto">{selectedTdr.objetoContratacion}</p></div></div>
                    <div className="form-tabs"><button className={`tab-btn ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>1. Documentación</button><button className={`tab-btn ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>2. Soportes</button><button className={`tab-btn ${activeTab === 3 ? 'active' : ''}`} onClick={() => setActiveTab(3)}>3. Actas Pago</button><button className={`tab-btn ${activeTab === 4 ? 'active' : ''}`} onClick={() => setActiveTab(4)}>4. Conformidad Final</button></div>
                    
                    {activeTab === 1 && (<div className="form-grid">{(['archivosNecesidad', 'archivosTDR'] as const).map((field) => (<div className="input-block" key={field}><label>{field === 'archivosNecesidad' ? 'Informes de Necesidad' : 'Documentos TDR Firmados'}</label><div className="multiple-files-container">{selectedTdr[field].map(file => (<div key={file.id} className="uploaded-file-card"><CheckCircle size={14}/><span className="file-name">{file.nombre}</span><div className="file-actions"><a href={file.url} target="_blank" rel="noreferrer" className="btn-icon"><Download size={14}/></a><button className="btn-icon danger" onClick={() => handleRemoveMultipleFile(field, file.id)}><Trash2 size={14}/></button></div></div>))}<div className="file-upload-block"><button className="btn-secondary" onClick={() => document.getElementById(`file-${field}`)?.click()}>+ Agregar Archivo</button><input id={`file-${field}`} type="file" hidden onChange={(e) => handleAddMultipleFiles(field, e.target.files?.[0])} /></div></div></div>))}</div>)}
                    
                    {activeTab === 2 && (
                        <div>
                            {/* --- GENERADOR DE CRONOGRAMA --- */}
                            <div className="generator-bar">
                                <div className="generator-title"><Repeat size={18} color="#4318FF"/> <span>Cronograma</span></div>
                                <div className="generator-controls">
                                    <div className="input-mini">
                                        <label>Inicio</label>
                                        <input type="date" value={scheduleParams.fechaInicio} onChange={(e) => setScheduleParams({...scheduleParams, fechaInicio: e.target.value})} />
                                    </div>
                                    <div className="input-mini">
                                        <label>Cantidad</label>
                                        <input type="number" min="1" max="24" value={scheduleParams.cantidad} onChange={(e) => setScheduleParams({...scheduleParams, cantidad: parseInt(e.target.value)})} />
                                    </div>
                                    <div className="input-mini">
                                        <label>Cada (Meses)</label>
                                        <input type="number" min="1" max="12" value={scheduleParams.intervalo} onChange={(e) => setScheduleParams({...scheduleParams, intervalo: parseInt(e.target.value)})} />
                                    </div>
                                    <button className="btn-primary" onClick={generateSchedule} style={{alignSelf:'flex-end'}}>Generar</button>
                                </div>
                            </div>

                            <table className="mini-table">
                                <thead><tr><th>Descripción</th><th>Fecha Programada</th><th>Informe / Evidencia</th><th>Estado</th><th>Acción</th></tr></thead>
                                <tbody>
                                    {selectedTdr.soportes.sort((a,b) => new Date(a.fechaProgramada).getTime() - new Date(b.fechaProgramada).getTime()).map((s) => (
                                        <tr key={s.id}>
                                            <td>{s.numero}</td>
                                            <td>{s.fechaProgramada}</td>
                                            <td>
                                                {s.archivo ? (
                                                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                                        <a href={s.archivo} target="_blank" rel="noreferrer" className="file-link"><FileText size={14}/> Ver</a>
                                                        {/* Botón para editar archivo */}
                                                        <button className="btn-icon-small" onClick={() => openSupportModal(s)} title="Cambiar archivo"><Pencil size={12}/></button>
                                                    </div>
                                                ) : (
                                                    <button className="btn-secondary-small" onClick={() => openSupportModal(s)}>
                                                        <UploadCloud size={14}/> Subir Informe
                                                    </button>
                                                )}
                                            </td>
                                            <td>
                                                <span 
                                                    className={`badge ${s.cumplimiento === 'Si' ? 'badge-success' : s.cumplimiento === 'Pendiente' ? 'badge-warning' : 'badge-danger'}`}
                                                    onClick={() => openSupportModal(s)} // Click en badge también abre modal
                                                    style={{cursor:'pointer'}}
                                                >
                                                    {s.cumplimiento}
                                                </span>
                                            </td>
                                            <td><button className="btn-icon danger" onClick={() => deleteSupport(s.id)}><Trash2 size={14}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 3 && (<div><div className="add-item-box"><h4>Registrar Acta Parcial / Mensual</h4><div className="grid-3 align-end"><div className="input-block"><label>Fecha del Acta</label><input type="date" value={tempActa.fecha || ''} onChange={e => setTempActa({...tempActa, fecha: e.target.value})}/></div><div className="input-block"><label>Archivo Digital (Acta)</label><input type="file" id="acta-file-input" onChange={e => setTempActaFile(e.target.files?.[0] || null)} className="input-file-sm"/></div><div className="input-block"><label>Descripción (Opcional)</label><input type="text" placeholder="Ej: Acta mes 1" value={tempActa.numero || ''} onChange={e => setTempActa({...tempActa, numero: e.target.value})}/></div></div><button className="btn-primary btn-margin-top" onClick={addActa}>Subir Acta</button></div><div className="timeline-container"><h3>Visualización Cronológica</h3>{selectedTdr.actasPago.sort((a,b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()).map((acta) => (<div key={acta.id} className="timeline-item"><div className="timeline-dot"></div><div className="timeline-content timeline-flex"><div><span className="timeline-date">{acta.fecha}</span><strong>{acta.numero}</strong>{acta.nombreArchivo && <div className="file-name-small"><File size={12}/>{acta.nombreArchivo}</div>}</div><div className="action-buttons">{acta.archivo && <a href={acta.archivo} target="_blank" rel="noreferrer" className="btn-icon"><Eye size={16}/></a>}<button className="btn-icon btn-danger" onClick={() => deleteActa(acta.id)}><Trash2 size={16}/></button></div></div></div>))}</div></div>)}
                    {activeTab === 4 && (<div><div className="add-item-box conformidad-box"><h4>Informe de Conformidad Final</h4><div className="grid-2"><div className="input-block"><label>Fecha de Emisión</label><input type="date" value={selectedTdr.fechaConformidad || ''} onChange={(e) => handleConformidadDate(e.target.value)} /></div><div className="file-upload-block"><label>Archivo PDF del Informe</label>{selectedTdr.archivoConformidad ? (<div className="uploaded-file-card"><span className="file-name">{selectedTdr.nombreArchivoConformidad}</span><div className="action-buttons"><a href={selectedTdr.archivoConformidad} target="_blank" rel="noreferrer" className="btn-icon"><Download size={14}/></a><button className="btn-icon btn-danger" onClick={handleRemoveFileSingle}><Trash2 size={14}/></button></div></div>) : (<button className="btn-secondary" onClick={() => document.getElementById('file-conformidad')?.click()}><UploadCloud size={16}/> Subir Informe Final</button>)}<input id="file-conformidad" type="file" hidden onChange={(e) => handleFileUploadSingle('archivoConformidad', e.target.files?.[0])} /></div></div></div>{selectedTdr.fechaConformidad && selectedTdr.archivoConformidad && (<div className="conformidad-success"><ShieldCheck size={48} color="#05CD99" /><h3>Proceso Cerrado Correctamente</h3><p>Fecha: {selectedTdr.fechaConformidad}</p></div>)}</div>)}
                </div>
            )}

            {/* === MODAL DE GESTIÓN DE SOPORTE INDIVIDUAL === */}
            {isSupportModalOpen && (
                <div className="tdr-modal-overlay">
                    <div className="tdr-modal-content">
                        <div className="tdr-modal-header">
                            <h3>Gestión de Mantenimiento</h3>
                            <button className="btn-icon" onClick={() => setIsSupportModalOpen(false)}><X size={20}/></button>
                        </div>
                        <div className="tdr-modal-body">
                            <p style={{color:'#666', marginBottom:'15px', fontSize:'0.9rem'}}>Suba la evidencia y actualice el estado del mantenimiento seleccionado.</p>
                            
                            <div className="input-block">
                                <label>Subir Informe / Evidencia</label>
                                <input 
                                    type="file" 
                                    className="input-file-sm" 
                                    onChange={(e) => setModalSupportData({...modalSupportData, archivo: e.target.files?.[0] || null})}
                                />
                            </div>

                            <div className="input-block" style={{marginTop:'15px'}}>
                                <label>Estado de Cumplimiento</label>
                                <select 
                                    value={modalSupportData.cumplimiento} 
                                    onChange={(e) => setModalSupportData({...modalSupportData, cumplimiento: e.target.value as any})}
                                    style={{width:'100%', padding:'10px', borderRadius:'10px', border:'1px solid #ddd'}}
                                >
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Si">Cumplido (Sí)</option>
                                    <option value="No">No Cumplido</option>
                                </select>
                            </div>
                        </div>
                        <div className="tdr-modal-footer">
                            <button className="btn-secondary" onClick={() => setIsSupportModalOpen(false)}>Cancelar</button>
                            <button className="btn-primary" onClick={saveSupportFromModal}>Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default TdrPage;
