    import { useState, useEffect } from 'react';
    import { 
        Plus, Search, Eye, Upload, FileText, ArrowLeft, DollarSign, CheckCircle, 
        Briefcase, AlertTriangle, ShieldCheck, FileCheck, Package, Save, Clock,
        Users,// Iconos nuevos
    } from 'lucide-react';
    import '../styles/TdrStyles.css';

    // --- TIPOS DE DATOS ---
    interface Support { 
        id: number; 
        numero: string; 
        fechaProgramada: string; 
        archivo: string | null; 
        nombreArchivo?: string;
        cumplimiento: string; 
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
        archivoInformeTecnico: string | null;
        archivoActa: string | null;
        archivoProducto: string | null;
        archivoVerificable: string | null;
        soportes: Support[];
    }

    // Interfaces solo para lectura
    interface Contrato {
        id: number;
        numeroContrato: string;
        nombreProfesional: string;
        adminContrato: string;
        estado: string;
    }

    interface Usuario {
        id: number;
        nombre: string;
        email: string;
        rol: string;
        area: string;
    }

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

    const TecnicoPage = () => {
        // --- ESTADOS DE NAVEGACIÓN ---
        const [currentModule, setCurrentModule] = useState<'TDR' | 'CONTRATOS' | 'CONTRATADOS'>('TDR');
        const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
        
        const [searchTerm, setSearchTerm] = useState('');
        const [selectedTdr, setSelectedTdr] = useState<TDR | null>(null);
        const [activeTab, setActiveTab] = useState(1);
        
        // Formularios TDR
        const [formData, setFormData] = useState<Partial<TDR>>({});
        const [newSupport, setNewSupport] = useState<Partial<Support>>({ cumplimiento: 'Pendiente' });
        const [supportFile, setSupportFile] = useState<File | null>(null);

        // --- CARGA DE DATOS ---
        const [tdrList, setTdrList] = useState<TDR[]>(() => JSON.parse(localStorage.getItem('sistema_tdr') || '[]'));
        const [contratosList, setContratosList] = useState<Contrato[]>([]);
        const [usuariosList, setUsuariosList] = useState<Usuario[]>([]);

        useEffect(() => {
            localStorage.setItem('sistema_tdr', JSON.stringify(tdrList));
        }, [tdrList]);

        // Cargar datos de lectura para las otras vistas
        useEffect(() => {
            if (currentModule === 'CONTRATOS') {
                const contracts = JSON.parse(localStorage.getItem('sistema_contratos') || '[]');
                setContratosList(contracts);
            }
            if (currentModule === 'CONTRATADOS') {
                const users = JSON.parse(localStorage.getItem('sistema_usuarios') || '[]');
                // Filtramos solo los que tienen rol 'Contratado'
                const contratados = users.filter((u: Usuario) => u.rol === 'Contratado');
                setUsuariosList(contratados);
            }
        }, [currentModule]);

        // --- HISTORIAL ---
        const registrarHistorial = (accion: 'Creación' | 'Edición' | 'Eliminación', detalle: string) => {
            const historial = JSON.parse(localStorage.getItem('sistema_historial') || '[]');
            const nuevoLog = {
                id: Date.now(),
                accion: accion,
                entidad: 'TDR',
                detalle: detalle,
                fecha: new Date().toISOString(),
                usuario: 'Técnico Responsable' 
            };
            localStorage.setItem('sistema_historial', JSON.stringify([nuevoLog, ...historial]));
        };

        // Helpers
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

        // --- LOGICA TDR (CREAR, SUBIR, SOPORTE) ---
        const handleCreateTDR = (e: React.FormEvent) => {
            e.preventDefault();
            if(!formData.numeroTDR || !formData.objetoContratacion || !formData.fechaInicio) return alert("Complete los campos obligatorios");

            const newTDR = { ...formData, id: Date.now(), archivoInformeTecnico: null, archivoActa: null, archivoProducto: null, archivoVerificable: null, soportes: [] } as TDR;
            setTdrList([...tdrList, newTDR]);
            registrarHistorial('Creación', `Técnico creó el TDR: ${newTDR.numeroTDR}`);
            alert("TDR Registrado Exitosamente.");
            setView('list'); setFormData({});
        };

        const handleFileUpload = (field: keyof TDR, file: File) => {
            if (!selectedTdr) return;
            const updatedTdr = { ...selectedTdr, [field]: URL.createObjectURL(file) }; 
            setSelectedTdr(updatedTdr);
            setTdrList(tdrList.map(t => t.id === selectedTdr.id ? updatedTdr : t));
            registrarHistorial('Edición', `Carga de archivo (${field}) en TDR ${selectedTdr.numeroTDR}`);
        };

        const handleAddSupport = () => {
            if(!selectedTdr || !newSupport.numero || !newSupport.fechaProgramada) return alert("Ingrese descripción y fecha");
            let fileName = undefined;
            let fileUrl = null;
            if (supportFile) { fileUrl = URL.createObjectURL(supportFile); fileName = supportFile.name; }
            const soporteFinal: Support = { id: Date.now(), numero: newSupport.numero!, fechaProgramada: newSupport.fechaProgramada!, archivo: fileUrl, nombreArchivo: fileName, cumplimiento: newSupport.cumplimiento || 'Pendiente' };
            const updatedTdr = { ...selectedTdr, soportes: [...selectedTdr.soportes, soporteFinal] };
            setSelectedTdr(updatedTdr);
            setTdrList(tdrList.map(t => t.id === selectedTdr.id ? updatedTdr : t));
            registrarHistorial('Edición', `Registro de mantenimiento "${soporteFinal.numero}" en TDR ${selectedTdr.numeroTDR}`);
            setNewSupport({ cumplimiento: 'Pendiente', numero: '', fechaProgramada: '' }); setSupportFile(null);
        };

        // --- RENDERIZADO CONDICIONAL ---

        return (
            <div className="tdr-container">
                <div className="space-background"></div>

                {/* --- NAVEGACIÓN SUPERIOR (MODULOS) --- */}
                <div className="nav-modules-bar">
                    <button 
                        className={`nav-module-btn ${currentModule === 'TDR' ? 'active' : ''}`}
                        onClick={() => { setCurrentModule('TDR'); setView('list'); }}
                    >
                        <FileText size={18} /> Gestión TDRs
                    </button>
                    <button 
                        className={`nav-module-btn ${currentModule === 'CONTRATOS' ? 'active' : ''}`}
                        onClick={() => setCurrentModule('CONTRATOS')}
                    >
                        <Briefcase size={18} /> Ver Contratos
                    </button>
                    <button 
                        className={`nav-module-btn ${currentModule === 'CONTRATADOS' ? 'active' : ''}`}
                        onClick={() => setCurrentModule('CONTRATADOS')}
                    >
                        <Users size={18} /> Ver Contratados
                    </button>
                </div>

                {/* ================= MODULO TDR ================= */}
                {currentModule === 'TDR' && (
                    <>
                        {view === 'list' && (
                            <div className="tdr-dashboard tdr-fade-in">
                                <header className="dashboard-header">
                                    <div><h1>Panel Técnico</h1><p>Gestión operativa de procesos y documentación</p></div>
                                    <button className="btn-primary" onClick={() => setView('create')}><Plus size={18} /> Nuevo TDR</button>
                                </header>

                                <div className="stats-grid">
                                    <div className="stat-card"><h3><Briefcase size={18}/> Mis Procesos</h3><div className="number">{tdrList.length}</div></div>
                                    <div className="stat-card warning"><h3><AlertTriangle size={18}/> Alertas Vencimiento</h3><div className="number">{tdrList.filter(t => { const d = getDaysRemaining(t.fechaFin); return d > 0 && d <= 90; }).length}</div></div>
                                    <div className="stat-card danger"><h3><ShieldCheck size={18}/> Vencidos</h3><div className="number">{tdrList.filter(t => getDaysRemaining(t.fechaFin) < 0).length}</div></div>
                                </div>

                                <div className="search-bar">
                                    <span className="search-icon-wrapper"><Search size={18} /></span>
                                    <input type="text" placeholder="Buscar por TDR o Objeto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>

                                <div className="white-panel">
                                    <table className="custom-table">
                                        <thead><tr><th>Nro. TDR</th><th>Objeto</th><th>Dirección</th><th>Días Restantes</th><th>Estado</th><th>Gestión</th></tr></thead>
                                        <tbody>
                                            {tdrList.filter(t => t.numeroTDR.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                                                <tr><td colSpan={6} style={{textAlign:'center', padding:'20px', color:'#999'}}>No hay registros.</td></tr>
                                            ) : (
                                                tdrList.filter(t => t.numeroTDR.toLowerCase().includes(searchTerm.toLowerCase())).map(tdr => {
                                                    const days = getDaysRemaining(tdr.fechaFin);
                                                    return (
                                                        <tr key={tdr.id}>
                                                            <td className="highlight-text">{tdr.numeroTDR}</td><td>{tdr.objetoContratacion}</td><td style={{fontSize:'0.8rem'}}>{tdr.direccionSolicitante}</td><td style={{fontWeight:'bold'}}>{days}</td><td>{getStatusBadge(days)}</td>
                                                            <td><button className="btn-icon" title="Gestionar" onClick={() => { setSelectedTdr(tdr); setView('detail'); }}><Eye size={18}/></button></td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {view === 'create' && (
                            <div className="tdr-form-container tdr-fade-in">
                                <div className="form-header"><button className="btn-secondary" onClick={() => setView('list')}><ArrowLeft size={20} /> Cancelar</button><h2>Nuevo TDR</h2></div>
                                <form onSubmit={handleCreateTDR}>
                                    <div className="form-grid">
                                        <div className="input-block"><label>Número TDR</label><input type="text" name="numeroTDR" required onChange={handleInputChange}/></div>
                                        <div className="input-block"><label>Tipo de Proceso</label><select name="tipoProceso" onChange={handleInputChange}><option>Seleccione...</option><option>Ínfima cuantía</option><option>Catálogo electrónico</option><option>Régimen especial</option></select></div>
                                        <div className="input-block full-width"><label>Dirección</label><select name="direccionSolicitante" onChange={handleInputChange}><option value="">Seleccione...</option>{DIRECCIONES_INAMHI.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                                        <div className="input-block full-width"><label>Objeto</label><input type="text" name="objetoContratacion" required onChange={handleInputChange}/></div>
                                        <div className="input-block"><label>Responsable</label><input type="text" name="responsable" onChange={handleInputChange}/></div>
                                        <div className="input-block"><label>Presupuesto</label><div className="input-with-icon"><DollarSign size={16} /><input type="number" name="presupuesto" onChange={handleInputChange} /></div></div>
                                        <div className="input-block"><label>Inicio</label><input type="date" name="fechaInicio" required onChange={handleInputChange} /></div>
                                        <div className="input-block"><label>Fin</label><input type="date" name="fechaFin" required onChange={handleInputChange} /></div>
                                    </div>
                                    <div className="form-button-container"><button type="submit" className="btn-primary-large"><Save size={18} style={{marginRight:8}}/> REGISTRAR TDR</button></div>
                                </form>
                            </div>
                        )}

                        {view === 'detail' && selectedTdr && (
                            <div className="tdr-form-container tdr-fade-in">
                                <div className="form-header"><button className="btn-secondary" onClick={() => setView('list')}><ArrowLeft size={18} /> Volver</button><div style={{textAlign:'right'}}><h2 style={{margin:0}}>{selectedTdr.numeroTDR}</h2><p style={{margin:0, opacity:0.6}}>Gestión Técnica</p></div></div>
                                <div className="form-tabs">
                                    <button className={`tab-btn ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>1. Archivos</button>
                                    <button className={`tab-btn ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>2. Mantenimientos</button>
                                    <button className={`tab-btn ${activeTab === 3 ? 'active' : ''}`} onClick={() => setActiveTab(3)}>3. Datos</button>
                                </div>
                                {activeTab === 1 && (
                                    <div className="form-grid">
                                        {[
                                            {key: 'archivoInformeTecnico', label: 'Informe Técnico', icon: <FileText size={20} color="#4318FF"/>}, {key: 'archivoActa', label: 'Acta Entrega', icon: <FileCheck size={20} color="#05CD99"/>},
                                            {key: 'archivoProducto', label: 'Producto', icon: <Package size={20} color="#FFB547"/>}, {key: 'archivoVerificable', label: 'Verificable', icon: <CheckCircle size={20} color="#E31A1A"/>}
                                        ].map((item) => (
                                            <div className="input-block" key={item.key}>
                                                <label>{item.label}</label>
                                                <div className="file-upload-block" style={{minHeight:'120px'}}>
                                                    {/* @ts-ignore */}
                                                    {selectedTdr[item.key] ? (<div className="uploaded-file-card">{item.icon}<span>Archivo Cargado</span><button className="btn-icon" style={{background:'#E6FBF5', color:'#05CD99'}}><ShieldCheck size={16}/></button></div>) : (
                                                        <><button className="btn-secondary small" onClick={() => document.getElementById(`file-${item.key}`)?.click()}><Upload size={14}/> Subir</button><input id={`file-${item.key}`} type="file" style={{display:'none'}} 
                                                        /* @ts-ignore */
                                                        onChange={(e) => e.target.files && handleFileUpload(item.key, e.target.files[0])} /></>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {activeTab === 2 && (
                                    <div>
                                        <div className="add-item-box"><h4>Registrar Soporte</h4><div className="grid-3 align-end"><div className="input-block"><label>Ticket</label><input type="text" value={newSupport.numero || ''} onChange={e => setNewSupport({...newSupport, numero: e.target.value})}/></div><div className="input-block"><label>Fecha</label><input type="date" value={newSupport.fechaProgramada || ''} onChange={e => setNewSupport({...newSupport, fechaProgramada: e.target.value})}/></div><div className="input-block"><label>Informe</label><input type="file" className="input-file-sm" onChange={e => setSupportFile(e.target.files?.[0] || null)}/></div></div><div className="grid-3"><div className="input-block"><label>Estado</label><select value={newSupport.cumplimiento} onChange={e => setNewSupport({...newSupport, cumplimiento: e.target.value})}><option value="Pendiente">Pendiente</option><option value="Si">Ejecutado</option><option value="No">No Ejecutado</option></select></div><div className="button-container-full"><button className="btn-primary btn-full" onClick={handleAddSupport}><Plus size={16}/> Agregar</button></div></div></div>
                                        <div className="white-panel" style={{boxShadow:'none', border:'1px solid #E0E5F2'}}><table className="mini-table"><thead><tr><th>Ticket</th><th>Fecha</th><th>Estado</th></tr></thead><tbody>{selectedTdr.soportes.length === 0 ? (<tr><td colSpan={3} style={{textAlign:'center', padding:'15px', color:'#999'}}>Sin registros</td></tr>) : (selectedTdr.soportes.map((s,i) => (<tr key={i}><td>{s.numero}</td><td>{s.fechaProgramada}</td><td><span className="badge badge-success">{s.cumplimiento}</span></td></tr>)))}</tbody></table></div>
                                    </div>
                                )}
                                {activeTab === 3 && (
                                    <div className="form-section tdr-slide"><div className="alert-banner" style={{background:'#FFF8F0', border:'1px solid #FFB547', padding:'10px', borderRadius:'10px', marginBottom:'20px', color:'#b36b00'}}><ShieldCheck size={20}/> <span><strong>Solo Lectura:</strong> No tienes permisos para editar estos datos.</span></div><div className="grid-2"><div className="input-block"><label>Objeto</label><input type="text" value={selectedTdr.objetoContratacion} disabled className="input-disabled"/></div><div className="input-block"><label>Dirección</label><input type="text" value={selectedTdr.direccionSolicitante} disabled className="input-disabled"/></div><div className="input-block"><label>Responsable</label><input type="text" value={selectedTdr.responsable} disabled className="input-disabled"/></div><div className="input-block"><label>Vigencia</label><input type="text" value={`${selectedTdr.fechaInicio} - ${selectedTdr.fechaFin}`} disabled className="input-disabled"/></div></div></div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* ================= MODULO CONTRATOS (SOLO LECTURA) ================= */}
                {currentModule === 'CONTRATOS' && (
                    <div className="tdr-dashboard tdr-fade-in">
                        <header className="dashboard-header">
                            <div><h1>Listado de Contratos</h1><p>Vista de consulta general</p></div>
                        </header>
                        <div className="white-panel">
                            <table className="custom-table">
                                <thead><tr><th>Nro. Contrato</th><th>Profesional</th><th>Admin. Contrato</th><th>Estado</th></tr></thead>
                                <tbody>
                                    {contratosList.length === 0 ? (<tr><td colSpan={4} className="no-data">No hay contratos registrados.</td></tr>) : (
                                        contratosList.map(c => (
                                            <tr key={c.id}>
                                                <td className="highlight-text">{c.numeroContrato}</td>
                                                <td>{c.nombreProfesional}</td>
                                                <td>{c.adminContrato}</td>
                                                <td><span className="badge badge-success">{c.estado}</span></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ================= MODULO CONTRATADOS (SOLO LECTURA) ================= */}
                {currentModule === 'CONTRATADOS' && (
                    <div className="tdr-dashboard tdr-fade-in">
                        <header className="dashboard-header">
                            <div><h1>Personal Contratado</h1><p>Directorio de profesionales externos</p></div>
                        </header>
                        <div className="white-panel">
                            <table className="custom-table">
                                <thead><tr><th>Nombre</th><th>Email</th><th>Área Asignada</th></tr></thead>
                                <tbody>
                                    {usuariosList.length === 0 ? (<tr><td colSpan={3} className="no-data">No hay personal contratado registrado.</td></tr>) : (
                                        usuariosList.map(u => (
                                            <tr key={u.id}>
                                                <td style={{fontWeight:'bold', color:'#2B3674'}}>{u.nombre}</td>
                                                <td>{u.email}</td>
                                                <td>{u.area}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        );
    };

    export default TecnicoPage;
