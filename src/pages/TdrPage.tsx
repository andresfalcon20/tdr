import { useState, useEffect } from 'react';
import { 
    Plus, Search, Eye, ArrowLeft, Calendar,
    FileText, CheckCircle, AlertTriangle, ShieldCheck, 
    Download, Trash2, UploadCloud, File
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
    const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
    const [activeTab, setActiveTab] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTdr, setSelectedTdr] = useState<TDR | null>(null);

    const [formData, setFormData] = useState<Partial<TDR>>({
        duracionCantidad: 1,
        duracionUnidad: 'Meses'
    });

    const [tempSupport, setTempSupport] = useState<Partial<Support>>({ cumplimiento: 'Pendiente' });
    const [tempSupportFile, setTempSupportFile] = useState<File | null>(null);

    const [tempActa, setTempActa] = useState<Partial<PaymentAct>>({});
    const [tempActaFile, setTempActaFile] = useState<File | null>(null);

    const [tdrList, setTdrList] = useState<TDR[]>(() => {
        const saved = localStorage.getItem('sistema_tdr');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('sistema_tdr', JSON.stringify(tdrList));
    }, [tdrList]);

    useEffect(() => {
        if (view === 'create' && formData.fechaInicio && formData.duracionCantidad) {
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

    const handleCreateTDR = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.numeroTDR || !formData.fechaInicio || !formData.fechaFin) {
            return alert("Por favor complete los campos obligatorios.");
        }
        const newTDR = { 
            ...formData, id: Date.now(), 
            soportes: [], actasPago: [], 
            archivosNecesidad: [], archivosTDR: [],
            archivoConformidad: null, fechaConformidad: null
        } as TDR;
        setTdrList([...tdrList, newTDR]);
        setSelectedTdr(newTDR);
        setView('detail');
        setActiveTab(1); 
        setFormData({ duracionCantidad: 1, duracionUnidad: 'Meses' });
    };

    // MANEJO DE ARCHIVOS MULTIPLES
    const handleAddMultipleFiles = (field: 'archivosNecesidad' | 'archivosTDR', file: File | undefined) => {
        if(!selectedTdr || !file) return;
        const newFile: FileItem = {
            id: Date.now(),
            url: URL.createObjectURL(file),
            nombre: file.name
        };
        const updatedTdr = { ...selectedTdr, [field]: [...selectedTdr[field], newFile] };
        updateTdrInList(updatedTdr);
    };

    const handleRemoveMultipleFile = (field: 'archivosNecesidad' | 'archivosTDR', fileId: number) => {
        if (!selectedTdr) return;
        const updatedFiles = selectedTdr[field].filter(f => f.id !== fileId);
        updateTdrInList({ ...selectedTdr, [field]: updatedFiles });
    };

    // ARCHIVO ÚNICO (CONFORMIDAD)
    const handleFileUploadSingle = (field: 'archivoConformidad', file: File | undefined) => {
        if(!selectedTdr || !file) return;
        const updatedTdr = { 
            ...selectedTdr, 
            [field]: URL.createObjectURL(file),
            nombreArchivoConformidad: file.name 
        };
        updateTdrInList(updatedTdr);
    };

    const handleRemoveFileSingle = () => {
        if (!selectedTdr) return;
        updateTdrInList({ ...selectedTdr, archivoConformidad: null, nombreArchivoConformidad: undefined });
    };

    const addSupport = () => {
        if(!selectedTdr || !tempSupport.numero || !tempSupport.fechaProgramada) return alert("Complete Nro y Fecha");
        let archivoUrl = null;
        let nombreArchivo = undefined;
        if (tempSupportFile) {
            archivoUrl = URL.createObjectURL(tempSupportFile);
            nombreArchivo = tempSupportFile.name;
        }
        const newSupport: Support = {
            id: Date.now(), 
            numero: tempSupport.numero!, 
            fechaProgramada: tempSupport.fechaProgramada || '', 
            archivo: archivoUrl, 
            nombreArchivo: nombreArchivo,
            cumplimiento: tempSupport.cumplimiento || 'Pendiente'
        };
        updateTdrInList({ ...selectedTdr, soportes: [...selectedTdr.soportes, newSupport] });
        setTempSupport({ cumplimiento: 'Pendiente', numero: '', fechaProgramada: '' });
        setTempSupportFile(null);
        (document.getElementById('support-file-input') as HTMLInputElement).value = '';
    };

    const deleteSupport = (supportId: number) => {
        if(!selectedTdr) return;
        const updatedSupports = selectedTdr.soportes.filter(s => s.id !== supportId);
        updateTdrInList({ ...selectedTdr, soportes: updatedSupports });
    };

    const addActa = () => {
        if(!selectedTdr || !tempActa.fecha) return alert("La fecha es obligatoria");
        if (!tempActaFile) return alert("Debe subir el archivo del Acta");
        const newActa: PaymentAct = {
            id: Date.now(), 
            numero: tempActa.numero || 'S/N', 
            fecha: tempActa.fecha || '', 
            archivo: URL.createObjectURL(tempActaFile),
            nombreArchivo: tempActaFile.name
        };
        updateTdrInList({ ...selectedTdr, actasPago: [...selectedTdr.actasPago, newActa] });
        setTempActa({ numero: '', fecha: '' });
        setTempActaFile(null);
        (document.getElementById('acta-file-input') as HTMLInputElement).value = '';
    };

    const deleteActa = (actaId: number) => {
        if(!selectedTdr) return;
        const updatedActas = selectedTdr.actasPago.filter(a => a.id !== actaId);
        updateTdrInList({ ...selectedTdr, actasPago: updatedActas });
    };

    const handleConformidadDate = (date: string) => {
        if(!selectedTdr) return;
        updateTdrInList({ ...selectedTdr, fechaConformidad: date });
    };

    const updateTdrInList = (updated: TDR) => {
        setSelectedTdr(updated);
        setTdrList(tdrList.map(t => t.id === updated.id ? updated : t));
    };

    const handleDeleteTDR = (id: number) => {
        if(window.confirm("¿Estás seguro de eliminar este TDR?")) {
            setTdrList(tdrList.filter(t => t.id !== id));
        }
    };

    const filteredTDRs = tdrList.filter(t => t.numeroTDR.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="tdr-container">
            {view === 'list' && (
                <div>
                    <header className="dashboard-header">
                        <div>
                            <h1>Gestión de TDR</h1>
                            <p>Control de procesos contractuales y plazos</p>
                        </div>
                        <button className="btn-primary" onClick={() => setView('create')}>
                            <Plus size={20} /> Nuevo TDR
                        </button>
                    </header>

                    <div className="stats-grid">
                        <div className="stat-card"><h3><FileText size={18}/> Procesos Activos</h3><div className="number">{tdrList.length}</div></div>
                        <div className="stat-card warning"><h3><AlertTriangle size={18}/> Por Vencer</h3><div className="number">{tdrList.filter(t => { const d = getDaysRemaining(t.fechaFin); return d > 0 && d <= 90; }).length}</div></div>
                        <div className="stat-card danger"><h3><ShieldCheck size={18}/> Vencidos</h3><div className="number">{tdrList.filter(t => getDaysRemaining(t.fechaFin) < 0).length}</div></div>
                    </div>

                    <div className="filters-bar">
                        <div className="search-bar">
                            <Search size={18} color="#3e6efdff"/><input type="text" placeholder="Buscar por Nro TDR..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </div>

                    <div className="white-panel">
                        <table className="custom-table">
                            <thead><tr><th>Nro. TDR</th><th>Objeto</th><th>Responsable</th><th>Fin Contrato</th><th>Estado</th><th>Acción</th></tr></thead>
                            <tbody>
                                {filteredTDRs.length === 0 ? (<tr><td colSpan={6} className="no-data">No hay registros.</td></tr>) : (
                                    filteredTDRs.map(tdr => (
                                        <tr key={tdr.id}>
                                            <td className="highlight-text">{tdr.numeroTDR}</td><td>{tdr.objetoContratacion}</td><td>{tdr.responsable}</td><td>{tdr.fechaFin}</td>
                                            <td>{tdr.fechaConformidad ? <span className="badge conformidad-finalizado">Finalizado</span> : <span className="badge badge-success">En Ejecución</span>}</td>
                                            <td><div className="action-buttons">
                                                <button className="btn-icon" onClick={() => { setSelectedTdr(tdr); setView('detail'); }}><Eye size={18}/></button>
                                                <button className="btn-icon btn-danger" onClick={() => handleDeleteTDR(tdr.id)}><Trash2 size={18}/></button>
                                            </div></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === 'create' && (
                <div className="tdr-form-container">
                    <div className="form-header">
                        <button className="btn-secondary" onClick={() => setView('list')}><ArrowLeft size={18} /> Cancelar</button>
                        <div className="form-header-center"><h2 className="form-title-main">Nuevo Proceso TDR</h2><div className="form-title-underline"></div></div>
                    </div>
                    <form onSubmit={handleCreateTDR}>
                        <div className="form-grid">
                            <div className="input-block"><label>Número TDR</label><input type="text" name="numeroTDR" required onChange={handleInputChange} /></div>
                            <div className="input-block"><label>Tipo Proceso</label><select name="tipoProceso" onChange={handleInputChange}><option>Seleccione...</option><option>Ínfima cuantía</option><option>Catálogo electrónico</option><option>Régimen especial</option></select></div>
                            <div className="input-block full-width"><label>Dirección Solicitante</label><select name="direccionSolicitante" onChange={handleInputChange}><option value="">Seleccione...</option>{DIRECCIONES_INAMHI.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                            <div className="input-block full-width"><label>Objeto Contractual</label><input type="text" name="objetoContratacion" onChange={handleInputChange} /></div>
                            <div className="input-block"><label>Responsable</label><input type="text" name="responsable" onChange={handleInputChange} /></div>
                            <div className="input-block"><label>Presupuesto</label><input type="number" name="presupuesto" onChange={handleInputChange} /></div>
                        </div>
                        <div className="input-block full-width">
                            <label className="label-with-icon"><Calendar size={18}/> Plazo de Ejecución</label>
                            <div className="date-calculation-box">
                                <div className="input-block"><label>Fecha Inicio</label><input type="date" name="fechaInicio" onChange={handleInputChange} required/></div>
                                <div className="input-block"><label>Duración</label><div className="input-group-flex">
                                    <input type="number" name="duracionCantidad" value={formData.duracionCantidad} onChange={handleInputChange} min="1" className="duration-input"/>
                                    <select name="duracionUnidad" value={formData.duracionUnidad} onChange={handleInputChange} className="duration-select"><option value="Dias">Días</option><option value="Meses">Meses</option><option value="Anios">Años</option></select>
                                </div></div>
                                <div className="input-block"><label>Fecha Fin (Calculada)</label><input type="date" name="fechaFin" value={formData.fechaFin || ''} readOnly className="calculated-date"/></div>
                            </div>
                        </div>
                        <div className="form-button-container"><button type="submit" className="btn-primary-large">GUARDAR Y CONTINUAR</button></div>
                    </form>
                </div>
            )}

            {view === 'detail' && selectedTdr && (
                <div className="tdr-form-container">
                    <div className="form-header">
                        <button className="btn-secondary" onClick={() => setView('list')}><ArrowLeft size={18} /> Volver</button>
                        <div className="form-header-center"><h2 className="tdr-number">{selectedTdr.numeroTDR}</h2><p className="tdr-objeto">{selectedTdr.objetoContratacion}</p></div>
                    </div>
                    <div className="form-tabs">
                        <button className={`tab-btn ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>1. Documentación</button>
                        <button className={`tab-btn ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>2. Soportes</button>
                        <button className={`tab-btn ${activeTab === 3 ? 'active' : ''}`} onClick={() => setActiveTab(3)}>3. Actas Pago</button>
                        <button className={`tab-btn ${activeTab === 4 ? 'active' : ''}`} onClick={() => setActiveTab(4)}>4. Conformidad Final</button>
                    </div>

                    {activeTab === 1 && (
                        <div className="form-grid">
                            {(['archivosNecesidad', 'archivosTDR'] as const).map((field) => (
                                <div className="input-block" key={field}>
                                    <label>{field === 'archivosNecesidad' ? 'Informes de Necesidad' : 'Documentos TDR Firmados'}</label>
                                    <div className="multiple-files-container">
                                        {selectedTdr[field].map(file => (
                                            <div key={file.id} className="uploaded-file-card">
                                                <CheckCircle size={14}/><span className="file-name">{file.nombre}</span>
                                                <div className="file-actions">
                                                    <a href={file.url} target="_blank" rel="noreferrer" className="btn-icon"><Download size={14}/></a>
                                                    <button className="btn-icon danger" onClick={() => handleRemoveMultipleFile(field, file.id)}><Trash2 size={14}/></button>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="file-upload-block">
                                            <button className="btn-secondary" onClick={() => document.getElementById(`file-${field}`)?.click()}>+ Agregar Archivo</button>
                                            <input id={`file-${field}`} type="file" hidden onChange={(e) => handleAddMultipleFiles(field, e.target.files?.[0])} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 2 && (
                        <div>
                            <div className="add-item-box">
                                <h4>Registrar Soporte / Mantenimiento</h4>
                                <div className="grid-3 align-end">
                                    <div className="input-block"><label>Descripción / Nro</label><input type="text" value={tempSupport.numero || ''} onChange={e => setTempSupport({...tempSupport, numero: e.target.value})}/></div>
                                    <div className="input-block"><label>Fecha Programada</label><input type="date" value={tempSupport.fechaProgramada || ''} onChange={e => setTempSupport({...tempSupport, fechaProgramada: e.target.value})}/></div>
                                    <div className="input-block"><label>Archivo Informe</label><input type="file" id="support-file-input" onChange={e => setTempSupportFile(e.target.files?.[0] || null)} className="input-file-sm"/></div>
                                </div>
                                <div className="grid-3">
                                    <div className="input-block"><label>Indicador Cumplimiento</label><select value={tempSupport.cumplimiento} onChange={e => setTempSupport({...tempSupport, cumplimiento: e.target.value as any})}><option value="Pendiente">Pendiente</option><option value="Si">Cumplido</option><option value="No">No Cumplido</option></select></div>
                                    <div className="button-container-full"><button className="btn-primary btn-full" onClick={addSupport}>Agregar Soporte</button></div>
                                </div>
                            </div>
                            <table className="mini-table">
                                <thead><tr><th>Descripción</th><th>Fecha</th><th>Informe</th><th>Estado</th><th>Acción</th></tr></thead>
                                <tbody>
                                    {selectedTdr.soportes.map((s) => (
                                        <tr key={s.id}>
                                            <td>{s.numero}</td><td>{s.fechaProgramada}</td>
                                            <td>{s.archivo ? <a href={s.archivo} target="_blank" rel="noreferrer" className="file-link"><FileText size={14}/> Ver Informe</a> : <span className="no-archivo">Sin archivo</span>}</td>
                                            <td><span className={`badge ${s.cumplimiento === 'Si' ? 'badge-success' : s.cumplimiento === 'Pendiente' ? 'badge-warning' : 'badge-danger'}`}>{s.cumplimiento}</span></td>
                                            <td><button className="btn-icon danger" onClick={() => deleteSupport(s.id)}><Trash2 size={14}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 3 && (
                        <div>
                            <div className="add-item-box">
                                <h4>Registrar Acta Parcial / Mensual</h4>
                                <div className="grid-3 align-end">
                                    <div className="input-block"><label>Fecha del Acta</label><input type="date" value={tempActa.fecha || ''} onChange={e => setTempActa({...tempActa, fecha: e.target.value})}/></div>
                                    <div className="input-block"><label>Archivo Digital (Acta)</label><input type="file" id="acta-file-input" onChange={e => setTempActaFile(e.target.files?.[0] || null)} className="input-file-sm"/></div>
                                    <div className="input-block"><label>Descripción (Opcional)</label><input type="text" placeholder="Ej: Acta mes 1" value={tempActa.numero || ''} onChange={e => setTempActa({...tempActa, numero: e.target.value})}/></div>
                                </div>
                                <button className="btn-primary btn-margin-top" onClick={addActa}>Subir Acta</button>
                            </div>
                            <div className="timeline-container">
                                <h3>Visualización Cronológica</h3>
                                {selectedTdr.actasPago.sort((a,b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()).map((acta) => (
                                    <div key={acta.id} className="timeline-item">
                                        <div className="timeline-dot"></div>
                                        <div className="timeline-content timeline-flex">
                                            <div><span className="timeline-date">{acta.fecha}</span><strong>{acta.numero}</strong>{acta.nombreArchivo && <div className="file-name-small"><File size={12}/>{acta.nombreArchivo}</div>}</div>
                                            <div className="action-buttons">
                                                {acta.archivo && <a href={acta.archivo} target="_blank" rel="noreferrer" className="btn-icon"><Eye size={16}/></a>}
                                                <button className="btn-icon btn-danger" onClick={() => deleteActa(acta.id)}><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 4 && (
                        <div>
                            <div className="add-item-box conformidad-box">
                                <h4>Informe de Conformidad Final</h4>
                                <div className="grid-2">
                                    <div className="input-block"><label>Fecha de Emisión</label><input type="date" value={selectedTdr.fechaConformidad || ''} onChange={(e) => handleConformidadDate(e.target.value)} /></div>
                                    <div className="file-upload-block">
                                        <label>Archivo PDF del Informe</label>
                                        {selectedTdr.archivoConformidad ? (
                                            <div className="uploaded-file-card">
                                                <span className="file-name">{selectedTdr.nombreArchivoConformidad}</span>
                                                <div className="action-buttons">
                                                    <a href={selectedTdr.archivoConformidad} target="_blank" rel="noreferrer" className="btn-icon"><Download size={14}/></a>
                                                    <button className="btn-icon btn-danger" onClick={handleRemoveFileSingle}><Trash2 size={14}/></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button className="btn-secondary" onClick={() => document.getElementById('file-conformidad')?.click()}><UploadCloud size={16}/> Subir Informe Final</button>
                                        )}
                                        <input id="file-conformidad" type="file" hidden onChange={(e) => handleFileUploadSingle('archivoConformidad', e.target.files?.[0])} />
                                    </div>
                                </div>
                            </div>
                            {selectedTdr.fechaConformidad && selectedTdr.archivoConformidad && (
                                <div className="conformidad-success"><ShieldCheck size={48} color="#05CD99" /><h3>Proceso Cerrado Correctamente</h3><p>Fecha: {selectedTdr.fechaConformidad}</p></div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TdrPage;
