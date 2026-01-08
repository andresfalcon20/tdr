import { useState, useEffect } from 'react';
import { 
    Plus, Search, Eye, Upload, FileText, ArrowLeft, DollarSign, CheckCircle, 
    Briefcase, AlertTriangle, ShieldCheck, FileCheck, Package
} from 'lucide-react';
import '../styles/TdrStyles.css';

// --- TIPOS DE DATOS (Actualizados para el Rol Técnico) ---
interface Support { 
    id: number; 
    numero: string; 
    fechaProgramada: string; 
    archivo: string | null; 
    cumplimiento: string; // 'Si', 'No', 'Pendiente'
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

const INITIAL_EXAMPLE: TDR[] = [
    {
        id: 1,
        numeroTDR: "TDR-2026-EJ-01",
        objetoContratacion: "Mantenimiento Estaciones Automáticas",
        tipoProceso: "Régimen Especial",
        direccionSolicitante: "DIRECCIÓN DE PRONÓSTICOS Y ALERTAS",
        presupuesto: 12500.00,
        responsable: "Ing. Carlos Ejemplo",
        fechaInicio: "2026-01-15",
        fechaFin: "2026-06-15",
        archivoInformeTecnico: null,
        archivoActa: null,
        archivoProducto: null,
        archivoVerificable: null,
        soportes: []
    }
];

const TecnicoPage = () => {
    const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTdr, setSelectedTdr] = useState<TDR | null>(null);
    const [activeTab, setActiveTab] = useState(1);
    
    // Estado para el formulario de CREACIÓN
    const [formData, setFormData] = useState<Partial<TDR>>({});

    // Estado para agregar un SOPORTE nuevo
    const [newSupport, setNewSupport] = useState<Partial<Support>>({ cumplimiento: 'Pendiente' });

    // 1. CARGA DE DATOS
    const [tdrList, setTdrList] = useState<TDR[]>(() => {
        const saved = localStorage.getItem('sistema_tdr');
        return saved ? JSON.parse(saved) : INITIAL_EXAMPLE;
    });

    // 2. GUARDADO AUTOMÁTICO
    useEffect(() => {
        localStorage.setItem('sistema_tdr', JSON.stringify(tdrList));
    }, [tdrList]);

    // --- LÓGICA DE ALERTAS ---
    const getDaysRemaining = (endDate: string) => {
        if(!endDate) return 0;
        const end = new Date(endDate);
        const today = new Date();
        const diffTime = end.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    };

    const getStatusBadge = (days: number) => {
        if (days < 0) return <span className="badge badge-danger">Vencido</span>;
        if (days <= 90) return <span className="badge badge-warning">Por Vencer</span>;
        return <span className="badge badge-success">Vigente</span>;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- 1. CREAR NUEVO TDR (Permiso) ---
    const handleCreateTDR = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.numeroTDR || !formData.objetoContratacion) return alert("Complete los campos obligatorios");

        const newTDR = { 
            ...formData, 
            id: Date.now(),
            // Inicializar campos vacíos
            archivoInformeTecnico: null,
            archivoActa: null,
            archivoProducto: null,
            archivoVerificable: null,
            soportes: []
        } as TDR;
        
        setTdrList([...tdrList, newTDR]);
        alert("TDR Registrado Exitosamente.");
        setView('list');
        setFormData({});
    };

    // --- 2. SUBIR ARCHIVOS (Permiso: Subir, Restricción: No borrar) ---
    const handleFileUpload = (tdrId: number, field: keyof TDR, fileName: string) => {
        // Actualizamos la lista general
        const updatedList = tdrList.map(t => t.id === tdrId ? { ...t, [field]: fileName } : t);
        setTdrList(updatedList);
        
        // Actualizamos el objeto seleccionado en tiempo real
        if (selectedTdr) {
            setSelectedTdr({ ...selectedTdr, [field]: fileName } as TDR);
        }
        alert("Archivo cargado al expediente.");
    };

    // --- 3. REGISTRAR SOPORTE (Permiso) ---
    const handleAddSupport = () => {
        if(!selectedTdr) return;
        if(!newSupport.numero || !newSupport.fechaProgramada) return alert("Datos incompletos");

        const soporteFinal: Support = {
            id: Date.now(),
            numero: newSupport.numero!,
            fechaProgramada: newSupport.fechaProgramada!,
            archivo: newSupport.archivo || null,
            cumplimiento: newSupport.cumplimiento || 'Pendiente'
        };

        // Actualizar el TDR específico
        const updatedTdr = {
            ...selectedTdr,
            soportes: [...selectedTdr.soportes, soporteFinal]
        };

        // Actualizar estados
        setSelectedTdr(updatedTdr);
        setTdrList(tdrList.map(t => t.id === selectedTdr.id ? updatedTdr : t));
        
        // Limpiar formulario
        setNewSupport({ cumplimiento: 'Pendiente', numero: '', fechaProgramada: '' });
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
                        <button className="btn-primary" onClick={() => setView('create')}>
                            <Plus size={18} /> Nuevo TDR
                        </button>
                    </header>

                    {/* Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3><Briefcase size={18}/> Mis Procesos</h3>
                            <div className="number">{tdrList.length}</div>
                        </div>
                        <div className="stat-card warning">
                            <h3><AlertTriangle size={18}/> Alertas Vencimiento</h3>
                            <div className="number">
                                {tdrList.filter(t => {
                                    const d = getDaysRemaining(t.fechaFin);
                                    return d > 0 && d <= 90;
                                }).length}
                            </div>
                        </div>
                        <div className="stat-card danger">
                            <h3><ShieldCheck size={18}/> Vencidos</h3>
                            <div className="number">
                                {tdrList.filter(t => getDaysRemaining(t.fechaFin) < 0).length}
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
                                    <th>Nro. TDR</th><th>Objeto</th><th>Dirección</th><th>Días</th><th>Estado</th><th>Gestión</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTDRs.length === 0 ? (
                                     <tr><td colSpan={6} style={{textAlign:'center', padding:'20px'}}>No hay registros.</td></tr>
                                ) : (
                                    filteredTDRs.map(tdr => {
                                        const days = getDaysRemaining(tdr.fechaFin);
                                        return (
                                            <tr key={tdr.id}>
                                                <td className="highlight-text">{tdr.numeroTDR}</td>
                                                <td>{tdr.objetoContratacion}</td>
                                                <td style={{fontSize:'0.8rem'}}>{tdr.direccionSolicitante}</td>
                                                <td style={{fontWeight:'bold'}}>{days}</td>
                                                <td>{getStatusBadge(days)}</td>
                                                <td>
                                                    {/* Restricción: NO BOTÓN ELIMINAR. Solo Gestionar */}
                                                    <button className="btn-icon" title="Gestionar Información Técnica" onClick={() => { setSelectedTdr(tdr); setView('detail'); }}>
                                                        <Eye size={18}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ================= VISTA CREAR (FORMULARIO) ================= */}
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
                                <div className="input-block"><label>Número TDR (Obligatorio)</label><input type="text" name="numeroTDR" required onChange={handleInputChange}/></div>
                                <div className="input-block">
                                    <label>Tipo de Proceso</label>
                                    <select name="tipoProceso" onChange={handleInputChange}>
                                        <option>Seleccione...</option><option>Ínfima cuantía</option><option>Catálogo electrónico</option><option>Régimen especial</option><option>Subasta inversa</option>
                                    </select>
                                </div>
                                <div className="input-block full-width">
                                    <label>Dirección Solicitante</label>
                                    <select name="direccionSolicitante" onChange={handleInputChange} className="select-full">
                                        <option value="">Seleccione...</option>
                                        <option value="TECNOLOGÍAS DE LA INFORMACIÓN Y COMUNICACIÓN">TECNOLOGÍAS DE LA INFORMACIÓN Y COMUNICACIÓN</option>
                                        <option value="DIRECCIÓN DE INFORMACIÓN HIDROMETEOROLÓGICA">DIRECCIÓN DE INFORMACIÓN HIDROMETEOROLÓGICA</option>
                                        <option value="DIRECCIÓN EJECUTIVA">DIRECCIÓN EJECUTIVA</option>
                                        {/* ... resto de direcciones ... */}
                                    </select>
                                </div>
                                <div className="input-block full-width"><label>Objeto Contractual</label><input type="text" name="objetoContratacion" onChange={handleInputChange}/></div>
                                <div className="input-block"><label>Responsable</label><input type="text" name="responsable" onChange={handleInputChange}/></div>
                                <div className="input-block"><label>Presupuesto</label><div className="input-with-icon"><div className="icon-prefix"><DollarSign size={16} /></div><input type="number" name="presupuesto" onChange={handleInputChange} placeholder="0.00" /></div></div>
                                <div className="input-block"><label>Fecha Inicio</label><input type="date" name="fechaInicio" onChange={handleInputChange} /></div>
                                <div className="input-block"><label>Fecha Fin</label><input type="date" name="fechaFin" onChange={handleInputChange} /></div>
                            </div>
                            <div className="form-actions"><button type="submit" className="btn-primary-large">REGISTRAR TDR</button></div>
                        </div>
                    </form>
                </div>
            )}

            {/* ================= VISTA DETALLE (GESTIÓN TÉCNICA) ================= */}
            {view === 'detail' && selectedTdr && (
                <div className="tdr-form-container glass-panel tdr-fade-in">
                    <div className="form-header">
                        <button className="btn-back" onClick={() => setView('list')}><ArrowLeft size={20} /> Volver</button>
                        <div>
                            <h2 style={{margin:0}}>Gestión Técnica: {selectedTdr.numeroTDR}</h2>
                            <p style={{opacity:0.7, fontSize:'0.9rem', margin:0}}>
                                {selectedTdr.objetoContratacion}
                            </p>
                        </div>
                    </div>

                    <div className="form-tabs">
                        <button className={`tab-btn ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>1. Archivos del Proceso</button>
                        <button className={`tab-btn ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>2. Mantenimientos</button>
                        <button className={`tab-btn ${activeTab === 3 ? 'active' : ''}`} onClick={() => setActiveTab(3)}>3. Datos Generales</button>
                    </div>

                    {/* PESTAÑA 1: GESTIÓN DE ARCHIVOS (LAS 4 CATEGORÍAS) */}
                    {activeTab === 1 && (
                        <div className="form-section tdr-slide">
                            <h3 className="section-subtitle">Carga de Documentación Requerida</h3>
                            <div className="grid-2">
                                
                                {/* 1. INFORMES TÉCNICOS */}
                                <div className="file-upload-block">
                                    <label>Informes Técnicos</label>
                                    {selectedTdr.archivoInformeTecnico ? (
                                        <div className="uploaded-file-card">
                                            <FileText size={20} color="#10b981"/> 
                                            <span>{selectedTdr.archivoInformeTecnico}</span>
                                            {/* Restricción: No botón eliminar */}
                                        </div>
                                    ) : (
                                        <div className="upload-actions">
                                            <input type="file" id="file1" style={{display:'none'}} onChange={(e) => handleFileUpload(selectedTdr.id, 'archivoInformeTecnico', e.target.files?.[0].name || '')}/>
                                            <button className="btn-secondary small" onClick={() => document.getElementById('file1')?.click()}><Upload size={14}/> Subir Informe</button>
                                        </div>
                                    )}
                                </div>

                                {/* 2. ACTAS */}
                                <div className="file-upload-block">
                                    <label>Actas</label>
                                    {selectedTdr.archivoActa ? (
                                        <div className="uploaded-file-card">
                                            <FileCheck size={20} color="#10b981"/> 
                                            <span>{selectedTdr.archivoActa}</span>
                                        </div>
                                    ) : (
                                        <div className="upload-actions">
                                            <input type="file" id="file2" style={{display:'none'}} onChange={(e) => handleFileUpload(selectedTdr.id, 'archivoActa', e.target.files?.[0].name || '')}/>
                                            <button className="btn-secondary small" onClick={() => document.getElementById('file2')?.click()}><Upload size={14}/> Subir Acta</button>
                                        </div>
                                    )}
                                </div>

                                {/* 3. PRODUCTOS */}
                                <div className="file-upload-block">
                                    <label>Productos</label>
                                    {selectedTdr.archivoProducto ? (
                                        <div className="uploaded-file-card">
                                            <Package size={20} color="#10b981"/> 
                                            <span>{selectedTdr.archivoProducto}</span>
                                        </div>
                                    ) : (
                                        <div className="upload-actions">
                                            <input type="file" id="file3" style={{display:'none'}} onChange={(e) => handleFileUpload(selectedTdr.id, 'archivoProducto', e.target.files?.[0].name || '')}/>
                                            <button className="btn-secondary small" onClick={() => document.getElementById('file3')?.click()}><Upload size={14}/> Subir Producto</button>
                                        </div>
                                    )}
                                </div>

                                {/* 4. VERIFICABLES */}
                                <div className="file-upload-block">
                                    <label>Verificables</label>
                                    {selectedTdr.archivoVerificable ? (
                                        <div className="uploaded-file-card">
                                            <CheckCircle size={20} color="#10b981"/> 
                                            <span>{selectedTdr.archivoVerificable}</span>
                                        </div>
                                    ) : (
                                        <div className="upload-actions">
                                            <input type="file" id="file4" style={{display:'none'}} onChange={(e) => handleFileUpload(selectedTdr.id, 'archivoVerificable', e.target.files?.[0].name || '')}/>
                                            <button className="btn-secondary small" onClick={() => document.getElementById('file4')?.click()}><Upload size={14}/> Subir Verificable</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PESTAÑA 2: MANTENIMIENTOS (Permiso: Registrar) */}
                    {activeTab === 2 && (
                        <div className="form-section tdr-slide">
                            <div className="add-item-box">
                                <h4>Registrar Nuevo Mantenimiento / Soporte</h4>
                                <div className="grid-3">
                                    <div className="input-block">
                                        <label>Nro. Ticket/Informe</label>
                                        <input type="text" value={newSupport.numero || ''} onChange={e => setNewSupport({...newSupport, numero: e.target.value})}/>
                                    </div>
                                    <div className="input-block">
                                        <label>Fecha Ejecución</label>
                                        <input type="date" value={newSupport.fechaProgramada || ''} onChange={e => setNewSupport({...newSupport, fechaProgramada: e.target.value})}/>
                                    </div>
                                    <div className="input-block">
                                        <label>Estado</label>
                                        <select value={newSupport.cumplimiento} onChange={e => setNewSupport({...newSupport, cumplimiento: e.target.value})}>
                                            <option value="Pendiente">Pendiente</option>
                                            <option value="Si">Ejecutado</option>
                                        </select>
                                    </div>
                                </div>
                                <button className="btn-secondary small" onClick={handleAddSupport}>Registrar Actividad</button>
                            </div>
                            
                            <div className="list-preview">
                                <h4>Historial de Mantenimientos</h4>
                                <table className="custom-table" style={{marginTop:'10px'}}>
                                    <thead><tr><th>Nro</th><th>Fecha</th><th>Estado</th></tr></thead>
                                    <tbody>
                                        {selectedTdr.soportes.length === 0 ? (
                                            <tr><td colSpan={3} style={{textAlign:'center', opacity:0.6}}>No hay mantenimientos registrados aún.</td></tr>
                                        ) : (
                                            selectedTdr.soportes.map((sop, idx) => (
                                                <tr key={idx}>
                                                    <td>{sop.numero}</td>
                                                    <td>{sop.fechaProgramada}</td>
                                                    <td><span className={`badge ${sop.cumplimiento === 'Si' ? 'badge-success' : 'badge-warning'}`}>{sop.cumplimiento}</span></td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* PESTAÑA 3: DATOS GENERALES (Restricción: No modificar) */}
                    {activeTab === 3 && (
                        <div className="form-section tdr-slide">
                            <h3 className="section-subtitle">Datos del TDR (Solo Lectura)</h3>
                            <div className="grid-2">
                                {/* Inputs Deshabilitados (disabled) para cumplir restricción */}
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

