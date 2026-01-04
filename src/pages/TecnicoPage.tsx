import { useState, useEffect } from 'react';
import { 
    Plus, Search, Eye, Upload, FileText, ArrowLeft, Calendar, DollarSign, CheckCircle,
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
    
    // --- LOS 4 ARCHIVOS REQUERIDOS POR EL ROL TÉCNICO ---
    archivoInformeTecnico: string | null;
    archivoActa: string | null;
    archivoProducto: string | null;
    archivoVerificable: string | null;
    
    soportes: Support[];
}

const TecnicoPage = () => {
    const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTdr, setSelectedTdr] = useState<TDR | null>(null);
    const [activeTab, setActiveTab] = useState(1);
    
    const [formData, setFormData] = useState<Partial<TDR>>({ soportes: [] });

    // 1. CARGA DE DATOS LOCALES
    const [tdrList, setTdrList] = useState<TDR[]>(() => {
        const saved = localStorage.getItem('sistema_tdr');
        return saved ? JSON.parse(saved) : []; 
    });

    // 2. GUARDADO AUTOMÁTICO
    useEffect(() => {
        localStorage.setItem('sistema_tdr', JSON.stringify(tdrList));
    }, [tdrList]);

    // --- LÓGICA DE ALERTAS (Permiso: Consultar alertas) ---
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- ACCIONES TÉCNICAS (Permisos y Restricciones) ---

    // 1. CREAR NUEVO TDR (Permiso: Crear con toda la info)
    const handleCreateTDR = (e: React.FormEvent) => {
        e.preventDefault();
        const newTDR = { 
            ...formData, 
            id: Date.now(),
            // Inicializamos los 4 archivos en null
            archivoInformeTecnico: null,
            archivoActa: null,
            archivoProducto: null,
            archivoVerificable: null,
            soportes: []
        } as TDR;
        
        setTdrList([...tdrList, newTDR]);
        alert("TDR Registrado Exitosamente.");
        setView('list');
        setFormData({ soportes: [] });
    };

    // 2. SUBIR ARCHIVOS (Permiso: Subir Informes, Actas, Productos, Verificables)
    // Restricción: No puede eliminar archivos cargados.
    const handleFileUpload = (tdrId: number, field: keyof TDR, fileName: string) => {
        const updatedList = tdrList.map(t => t.id === tdrId ? { ...t, [field]: fileName } : t);
        setTdrList(updatedList);
        if (selectedTdr) setSelectedTdr({ ...selectedTdr, [field]: fileName } as TDR);
        alert("Archivo subido correctamente al sistema.");
    };

    // 3. REGISTRAR MANTENIMIENTO/SOPORTE (Permiso: Registrar soportes asociados)
    const handleRegisterSupport = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Mantenimiento registrado (Simulación)");
        // Aquí iría la lógica para agregar al array 'soportes'
    };

    const filteredTDRs = tdrList.filter(tdr => 
        tdr.numeroTDR.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tdr.objetoContratacion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="tdr-container">
            <div className="space-background"></div>

            {/* ================= VISTA LISTA (DASHBOARD) ================= */}
            {view === 'list' && (
                <div className="tdr-dashboard tdr-fade-in">
                    <header className="dashboard-header">
                        <div>
                            <h1>Panel Técnico</h1>
                            <p>Gestión operativa de procesos y documentación</p>
                        </div>
                        {/* Permiso: Crear nuevos TDR */}
                        <button className="btn-primary" onClick={() => setView('create')}>
                            <Plus size={18} /> Nuevo TDR
                        </button>
                    </header>

                    {/* Permiso: Visualizar reportes e información (Contadores) */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3>Mis Procesos Asignados</h3>
                            <div className="number">{tdrList.length}</div>
                        </div>
                        {/* Permiso: Consultar alertas de vencimiento */}
                        <div className="stat-card warning">
                            <h3>Alertas de Vencimiento</h3>
                            <div className="number">
                                {tdrList.filter(t => {
                                    const d = getDaysRemaining(t.fechaFin);
                                    return d > 0 && d <= 90;
                                }).length}
                            </div>
                        </div>
                    </div>

                    <div className="search-bar">
                        <span className="search-icon-wrapper"><Search size={18} /></span>
                        <input type="text" placeholder="Buscar por TDR o Objeto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    <div className="glass-panel">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Nro. TDR</th><th>Objeto</th><th>Dirección</th><th>Vencimiento</th><th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTDRs.length === 0 ? (
                                     <tr><td colSpan={5} style={{textAlign:'center', padding:'20px'}}>No hay registros.</td></tr>
                                ) : (
                                    filteredTDRs.map(tdr => (
                                    <tr key={tdr.id}>
                                        <td className="highlight-text">{tdr.numeroTDR}</td>
                                        <td>{tdr.objetoContratacion}</td>
                                        <td style={{fontSize:'0.85rem'}}>{tdr.direccionSolicitante}</td>
                                        <td>{getStatusBadge(getDaysRemaining(tdr.fechaFin))}</td>
                                        <td>
                                            {/* Restricción: NO BOTÓN ELIMINAR. Solo Gestionar (Ojo) */}
                                            <button className="btn-icon" title="Gestionar Información Técnica" onClick={() => { setSelectedTdr(tdr); setView('detail'); }}>
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

            {/* ================= VISTA CREAR (FORMULARIO COMPLETO) ================= */}
            {view === 'create' && (
                <div className="tdr-form-container glass-panel tdr-fade-in">
                    <div className="form-header">
                        <button className="btn-back" onClick={() => setView('list')}><ArrowLeft size={20} /> Cancelar</button>
                        <h2>Nuevo TDR - Registro Técnico</h2>
                    </div>
                    
                    <form onSubmit={handleCreateTDR} className="main-form">
                        <div className="form-section tdr-slide">
                            <h3 className="section-subtitle">Información del Proceso</h3>
                            <div className="grid-2">
                                <div className="input-block"><label>Número TDR</label><input type="text" name="numeroTDR" required onChange={handleInputChange}/></div>
                                <div className="input-block">
                                    <label>Tipo de Proceso</label>
                                    <select name="tipoProceso" onChange={handleInputChange}>
                                        <option>Seleccione...</option><option>Ínfima cuantía</option><option>Catálogo electrónico</option><option>Régimen especial</option><option>Subasta inversa</option>
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
                                <div className="input-block"><label>Objeto Contractual</label><input type="text" name="objetoContratacion" onChange={handleInputChange}/></div>
                                <div className="input-block"><label>Responsable</label><input type="text" name="responsable" onChange={handleInputChange}/></div>
                                <div className="input-block"><label>Presupuesto</label><div className="input-with-icon"><div className="icon-prefix"><DollarSign size={16} /></div><input type="number" name="presupuesto" onChange={handleInputChange} placeholder="0.00" /></div></div>
                                <div className="input-block"><label>Fecha Inicio</label><div className="input-with-icon"><div className="icon-prefix"><Calendar size={16} /></div><input type="date" name="fechaInicio" onChange={handleInputChange} /></div></div>
                                <div className="input-block"><label>Fecha Fin</label><div className="input-with-icon"><div className="icon-prefix"><Calendar size={16} /></div><input type="date" name="fechaFin" onChange={handleInputChange} /></div></div>
                            </div>
                            <div className="form-actions"><button type="submit" className="btn-primary-large">REGISTRAR TDR</button></div>
                        </div>
                    </form>
                </div>
            )}

            {/* ================= VISTA DETALLE (GESTIÓN TÉCNICA RESTRINGIDA) ================= */}
            {view === 'detail' && selectedTdr && (
                <div className="tdr-form-container glass-panel tdr-fade-in">
                    <div className="form-header">
                        <button className="btn-back" onClick={() => setView('list')}><ArrowLeft size={20} /> Volver</button>
                        <div>
                            <h2 style={{margin:0}}>Gestión Técnica: {selectedTdr.numeroTDR}</h2>
                            <p style={{opacity:0.7, fontSize:'0.9rem', margin:0}}>
                                {selectedTdr.objetoContratacion} <span className="badge badge-warning">Solo Lectura (Datos Base)</span>
                            </p>
                        </div>
                    </div>

                    <div className="form-tabs">
                        <button className={`tab-btn ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>1. Archivos del Proceso</button>
                        <button className={`tab-btn ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>2. Mantenimientos</button>
                        <button className={`tab-btn ${activeTab === 3 ? 'active' : ''}`} onClick={() => setActiveTab(3)}>3. Datos Generales</button>
                    </div>

                    {/* PESTAÑA 1: GESTIÓN DE ARCHIVOS (LAS 4 CATEGORÍAS EXACTAS) */}
                    {activeTab === 1 && (
                        <div className="form-section tdr-slide">
                            <h3 className="section-subtitle">Carga de Documentación Requerida</h3>
                            <div className="grid-2">
                                {/* CATEGORÍA 1: INFORMES TÉCNICOS */}
                                <div className="file-upload-block">
                                    <label>Informes Técnicos</label>
                                    {selectedTdr.archivoInformeTecnico ? (
                                        <div style={{color:'#10b981', display:'flex', gap:'5px', alignItems:'center'}}>
                                            <FileText size={16}/> {selectedTdr.archivoInformeTecnico}
                                            {/* Restricción: No se muestra botón eliminar */}
                                        </div>
                                    ) : (
                                        <div style={{display:'flex', gap:'10px'}}>
                                            <input type="file" id="fileInf" style={{display:'none'}} onChange={(e) => handleFileUpload(selectedTdr.id, 'archivoInformeTecnico', e.target.files?.[0].name || '')}/>
                                            <button className="btn-secondary small" onClick={() => document.getElementById('fileInf')?.click()}><Upload size={14}/> Subir Informe</button>
                                        </div>
                                    )}
                                </div>

                                {/* CATEGORÍA 2: ACTAS */}
                                <div className="file-upload-block">
                                    <label>Actas</label>
                                    {selectedTdr.archivoActa ? (
                                        <div style={{color:'#10b981', display:'flex', gap:'5px', alignItems:'center'}}>
                                            <FileText size={16}/> {selectedTdr.archivoActa}
                                        </div>
                                    ) : (
                                        <div style={{display:'flex', gap:'10px'}}>
                                            <input type="file" id="fileActa" style={{display:'none'}} onChange={(e) => handleFileUpload(selectedTdr.id, 'archivoActa', e.target.files?.[0].name || '')}/>
                                            <button className="btn-secondary small" onClick={() => document.getElementById('fileActa')?.click()}><Upload size={14}/> Subir Acta</button>
                                        </div>
                                    )}
                                </div>

                                {/* CATEGORÍA 3: PRODUCTOS */}
                                <div className="file-upload-block">
                                    <label>Productos</label>
                                    {selectedTdr.archivoProducto ? (
                                        <div style={{color:'#10b981', display:'flex', gap:'5px', alignItems:'center'}}>
                                            <CheckCircle size={16}/> {selectedTdr.archivoProducto}
                                        </div>
                                    ) : (
                                        <div style={{display:'flex', gap:'10px'}}>
                                            <input type="file" id="fileProd" style={{display:'none'}} onChange={(e) => handleFileUpload(selectedTdr.id, 'archivoProducto', e.target.files?.[0].name || '')}/>
                                            <button className="btn-secondary small" onClick={() => document.getElementById('fileProd')?.click()}><Upload size={14}/> Subir Producto</button>
                                        </div>
                                    )}
                                </div>

                                {/* CATEGORÍA 4: VERIFICABLES */}
                                <div className="file-upload-block">
                                    <label>Verificables</label>
                                    {selectedTdr.archivoVerificable ? (
                                        <div style={{color:'#10b981', display:'flex', gap:'5px', alignItems:'center'}}>
                                            <CheckCircle size={16}/> {selectedTdr.archivoVerificable}
                                        </div>
                                    ) : (
                                        <div style={{display:'flex', gap:'10px'}}>
                                            <input type="file" id="fileVer" style={{display:'none'}} onChange={(e) => handleFileUpload(selectedTdr.id, 'archivoVerificable', e.target.files?.[0].name || '')}/>
                                            <button className="btn-secondary small" onClick={() => document.getElementById('fileVer')?.click()}><Upload size={14}/> Subir Verificable</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PESTAÑA 2: MANTENIMIENTOS (Permiso: Registrar Mantenimientos) */}
                    {activeTab === 2 && (
                        <div className="form-section tdr-slide">
                            <div className="add-item-box">
                                <h4>Registrar Nuevo Mantenimiento / Soporte</h4>
                                <div className="grid-3">
                                    <div className="input-block"><label>Nro. Ticket/Informe</label><input type="text"/></div>
                                    <div className="input-block"><label>Fecha Ejecución</label><input type="date"/></div>
                                    <div className="input-block"><label>Informe (PDF)</label><input type="file" className="small-file"/></div>
                                </div>
                                <button className="btn-secondary small" onClick={handleRegisterSupport}>Registrar Actividad</button>
                            </div>
                            
                            <div className="list-preview">
                                <h4>Historial de Mantenimientos</h4>
                                <table className="custom-table" style={{marginTop:'10px'}}>
                                    <thead><tr><th>Nro</th><th>Fecha</th><th>Estado</th></tr></thead>
                                    <tbody>
                                        <tr><td colSpan={3} style={{textAlign:'center', opacity:0.6}}>No hay mantenimientos registrados aún.</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* PESTAÑA 3: DATOS GENERALES (Restricción: No puede modificar TDR registrados) */}
                    {activeTab === 3 && (
                        <div className="form-section tdr-slide">
                            <h3 className="section-subtitle">Datos del TDR (Solo Lectura)</h3>
                            <div className="grid-2">
                                {/* Inputs Deshabilitados para cumplir restricción */}
                                <div className="input-block"><label>Tipo de Proceso</label><input type="text" value={selectedTdr.tipoProceso} disabled style={{opacity:0.7}}/></div>
                                <div className="input-block"><label>Dirección</label><input type="text" value={selectedTdr.direccionSolicitante} disabled style={{opacity:0.7}}/></div>
                                <div className="input-block"><label>Responsable</label><input type="text" value={selectedTdr.responsable} disabled style={{opacity:0.7}}/></div>
                                <div className="input-block"><label>Presupuesto</label><input type="text" value={`$${selectedTdr.presupuesto}`} disabled style={{opacity:0.7}}/></div>
                                <div className="input-block"><label>Vigencia</label><input type="text" value={`${selectedTdr.fechaInicio} - ${selectedTdr.fechaFin}`} disabled style={{opacity:0.7}}/></div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TecnicoPage;
