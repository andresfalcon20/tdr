import { useState, useEffect } from 'react';
import { 
  User, ArrowLeft, FolderOpen, Filter, Plus, Save, FileText, Download, Pencil, Trash2 
} from 'lucide-react';
import '../styles/ContratosStyles.css'; 

const DIRECCIONES_LIST = [
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

interface Usuario {
    id: number;
    nombre: string;
    rol: string;
}

interface Contrato {
  id: number;
  numeroContrato: string;
  nombreProfesional: string;
  direccion: string;
  adminContrato: string;
  fechaInicio: string;
  fechaFin: string;
  estado: 'Activo' | 'Finalizado' | 'Pendiente';
  progreso: number;
}

interface Documento {
    id: number;
    contratoId: number;
    categoria: string;
    nombreArchivo: string;
    fechaSubida: string;
    estado: string;
}

const DOC_CATEGORIES = [
  "Contrato", "Termino de referencia", "Informes técnicos (mensuales o por producto)", 
  "Productos entregados", "Verificables", "Informe de conformidad mensual o por producto", 
  "Informe técnico final", "Informe de conformidad final", "Facturas", "Otro"
];

const ContratosPage = () => {
  const [view, setView] = useState<'list' | 'detail' | 'form'>('list'); // 'form' sirve para crear y editar
  const [isEditing, setIsEditing] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  
  // Lista de usuarios contratados para el select
  const [contratadosList, setContratadosList] = useState<Usuario[]>([]);

  const [contratos, setContratos] = useState<Contrato[]>(() => {
      const saved = localStorage.getItem('sistema_contratos');
      return saved ? JSON.parse(saved) : []; 
  });

  const [allDocuments, setAllDocuments] = useState<Documento[]>([]);

  // Estado del formulario (para crear y editar)
  const [formData, setFormData] = useState<Partial<Contrato>>({});

  useEffect(() => {
      localStorage.setItem('sistema_contratos', JSON.stringify(contratos));
  }, [contratos]);

  useEffect(() => {
      if (view === 'detail') {
          const docs = localStorage.getItem('sistema_documentos');
          if (docs) setAllDocuments(JSON.parse(docs));
      }
      // Cargar usuarios al cargar la página
      const usersDB: Usuario[] = JSON.parse(localStorage.getItem('sistema_usuarios') || '[]');
      const soloContratados = usersDB.filter(u => u.rol === 'Contratado');
      setContratadosList(soloContratados);

  }, [view]);

  // --- FUNCIÓN PARA GUARDAR EN EL HISTORIAL ---
  const registrarHistorial = (accion: 'Creación' | 'Edición' | 'Eliminación', detalle: string) => {
      const historial = JSON.parse(localStorage.getItem('sistema_historial') || '[]');
      const nuevoLog = {
          id: Date.now(),
          accion: accion,
          entidad: 'Contrato',
          detalle: detalle,
          fecha: new Date().toISOString(),
          usuario: 'Admin General' 
      };
      localStorage.setItem('sistema_historial', JSON.stringify([nuevoLog, ...historial]));
  };

  const [filters, setFilters] = useState({
    numero: '', profesional: '', admin: '', direccion: ''
  });

  const filteredContratos = contratos.filter(c => 
    c.numeroContrato.toLowerCase().includes(filters.numero.toLowerCase()) &&
    c.nombreProfesional.toLowerCase().includes(filters.profesional.toLowerCase()) &&
    c.adminContrato.toLowerCase().includes(filters.admin.toLowerCase()) &&
    c.direccion.toLowerCase().includes(filters.direccion.toLowerCase())
  );

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };
  
  // --- MANEJO DEL FORMULARIO (Crear y Editar) ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateClick = () => {
      setIsEditing(false);
      setFormData({});
      setView('form');
  };

  const handleEditClick = (contrato: Contrato) => {
      setIsEditing(true);
      setFormData({ ...contrato });
      setView('form');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombreProfesional) {
        alert("Por favor seleccione un profesional.");
        return;
    }

    if (isEditing && formData.id) {
        // ACTUALIZAR
        const updatedContratos = contratos.map(c => c.id === formData.id ? { ...c, ...formData } as Contrato : c);
        setContratos(updatedContratos);
        
        // Historial Edición
        registrarHistorial('Edición', `Se actualizó la información del contrato ${formData.numeroContrato}`);
        
        alert("Contrato actualizado correctamente.");
    } else {
        // CREAR NUEVO
        const nuevoContrato = { 
            ...formData, 
            id: Date.now(), 
            estado: 'Activo', 
            progreso: 0 
        } as Contrato;
        setContratos([...contratos, nuevoContrato]);
        
        // Historial Creación
        registrarHistorial('Creación', `Se creó el contrato ${nuevoContrato.numeroContrato} para ${nuevoContrato.nombreProfesional}`);
        
        alert("Contrato creado exitosamente.");
    }
    
    setView('list');
    setFormData({});
  };

  const handleDelete = (id: number) => {
      const contratoToDelete = contratos.find(c => c.id === id);
      if(window.confirm("¿Estás seguro de eliminar este contrato? Esta acción no se puede deshacer.")) {
          setContratos(contratos.filter(c => c.id !== id));
          
          // Historial Eliminación
          if (contratoToDelete) {
              registrarHistorial('Eliminación', `Se eliminó el contrato ${contratoToDelete.numeroContrato}`);
          }
      }
  };

  const handleDownload = (fileName: string) => {
      const element = document.createElement("a");
      const file = new Blob([`Contenido: ${fileName}\n\nDocumento descargado del sistema.`], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = fileName; 
      document.body.appendChild(element); 
      element.click();
      document.body.removeChild(element);
  };

  return (
    <div className="contratos-container">
      
      {/* === VISTA LISTA === */}
      {view === 'list' && (
        <div className="content-fade-in">
          <header className="page-header">
            <div>
              <h1>GESTION DE CONTRATOS</h1>
              <p>Módulo de Búsqueda, Filtrado y Auditoría</p>
            </div>
            <button className="btn-primary" onClick={handleCreateClick}>
              <Plus size={18} /> Nuevo Contrato
            </button>
          </header>

          <div className="white-panel">
            <div className="filters-header">
              <Filter size={16} color="#4318FF"/> <span>Búsqueda Avanzada</span>
            </div>
            
            <div className="filters-row">
              <div className="filter-item">
                <label>Nro. Contrato</label>
                <input type="text" name="numero" placeholder="Ej: CTR-2026..." value={filters.numero} onChange={handleFilterChange}/>
              </div>
              <div className="filter-item">
                <label>Profesional</label>
                <input type="text" name="profesional" placeholder="Nombre..." value={filters.profesional} onChange={handleFilterChange}/>
              </div>
              <div className="filter-item">
                <label>Administrador</label>
                <input type="text" name="admin" placeholder="Admin. contrato..." value={filters.admin} onChange={handleFilterChange}/>
              </div>
              <div className="filter-item">
                <label>Dirección</label>
                <select name="direccion" onChange={handleFilterChange} value={filters.direccion}>
                    <option value="">Todas las Direcciones</option>
                    {DIRECCIONES_LIST.map((dir, index) => (
                        <option key={index} value={dir}>{dir}</option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="contratos-table">
              <thead>
                <tr>
                  <th>Contrato</th>
                  <th>Profesional</th>
                  <th>Dirección</th>
                  <th>Admin. Contrato</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredContratos.length === 0 ? (
                    <tr><td colSpan={6} style={{textAlign:'center', padding:'40px', color:'#A3AED0'}}>No se encontraron contratos.</td></tr>
                ) : (
                    filteredContratos.map((c) => (
                        <tr key={c.id}>
                            <td className="highlight-cell">{c.numeroContrato}</td>
                            <td><div className="user-cell"><User size={16} color="#A3AED0"/> {c.nombreProfesional}</div></td>
                            <td style={{fontSize:'0.85rem', maxWidth:'300px', lineHeight:'1.5', color:'#64748b'}}>{c.direccion}</td>
                            <td>{c.adminContrato}</td>
                            <td><span className={`status-badge status-${c.estado.toLowerCase()}`}>{c.estado}</span></td>
                            <td>
                                <div className="actions-cell">
                                    <button className="btn-action" onClick={() => {setSelectedContrato(c); setView('detail');}} title="Ver Expediente">
                                        <FolderOpen size={16} /> Ver
                                    </button>
                                    <button className="btn-edit" onClick={() => handleEditClick(c)} title="Editar Contrato">
                                        <Pencil size={16} />
                                    </button>
                                    <button className="btn-delete" onClick={() => handleDelete(c.id)} title="Eliminar Contrato">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === VISTA FORMULARIO (CREAR / EDITAR) === */}
      {view === 'form' && (
        <div className="white-panel content-fade-in" style={{maxWidth: '1000px', margin: '0 auto'}}>
          <div className="form-header-row">
             <button className="btn-back" onClick={() => setView('list')}><ArrowLeft size={20} /> Regresar</button>
             <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', marginBottom: '40px', minHeight: '60px' }}>
                <div style={{ position: 'absolute', left: '40%', transform: 'translateX(-50%)', textAlign: 'center', width: 'max-content', pointerEvents: 'none' }}>
                    <h2 style={{ fontSize: '1.9rem', fontWeight: '900', color: '#00157aff', margin: 0, letterSpacing: '-0.5px', pointerEvents: 'auto' }}>
                        {isEditing ? 'Modificar Contrato' : 'Nuevo Contrato'}
                    </h2>
                    <div style={{ width: '150px', height: '4px', backgroundColor: '#4318FF', borderRadius: '10px', margin: '8px auto 0' }}></div>
                </div>
             </div>
          </div>
          
          <form onSubmit={handleSave}>
             <div className="form-grid-2-col">
                <div className="form-item">
                    <label>Número de Contrato</label>
                    <input 
                        type="text" 
                        name="numeroContrato" 
                        required 
                        value={formData.numeroContrato || ''} 
                        onChange={handleInputChange} 
                        placeholder="Ej: CTR-2026-001"
                    />
                </div>
                
                {/* SELECTOR DE USUARIOS */}
                <div className="form-item">
                    <label>Profesional (Usuario Contratado)</label>
                    <select 
                        name="nombreProfesional" 
                        required 
                        value={formData.nombreProfesional || ''} 
                        onChange={handleInputChange} 
                        className="custom-select"
                    >
                        <option value="">Seleccione un usuario...</option>
                        {contratadosList.map(user => (
                            <option key={user.id} value={user.nombre}>{user.nombre}</option>
                        ))}
                    </select>
                    {contratadosList.length === 0 && (
                        <small style={{color: 'red', marginTop: '5px', display: 'block'}}>
                            * No hay usuarios con rol "Contratado".
                        </small>
                    )}
                </div>

                <div className="form-item">
                    <label>Administrador del Contrato</label>
                    <input 
                        type="text" 
                        name="adminContrato" 
                        required 
                        value={formData.adminContrato || ''} 
                        onChange={handleInputChange} 
                        placeholder="Funcionario responsable"
                    />
                </div>
                <div className="form-item">
                    <label>Dirección Solicitante</label>
                   <select 
                        name="direccion" 
                        required 
                        value={formData.direccion || ''} 
                        onChange={handleInputChange}
                    >
                      <option value="">Seleccione...</option>
                      {DIRECCIONES_LIST.map((dir, index) => (
                        <option key={index} value={dir}>{dir}</option>
                      ))}
                   </select>
                </div>
                <div className="form-item">
                    <label>Fecha Inicio</label>
                    <input 
                        type="date" 
                        name="fechaInicio" 
                        required 
                        value={formData.fechaInicio || ''} 
                        onChange={handleInputChange}
                    />
                </div>
                <div className="form-item">
                    <label>Fecha Fin</label>
                    <input 
                        type="date" 
                        name="fechaFin" 
                        required 
                        value={formData.fechaFin || ''} 
                        onChange={handleInputChange}
                    />
                </div>
             </div>
             <div className="form-actions-right">
                <button type="submit" className="btn-primary">
                    <Save size={18} /> {isEditing ? 'Guardar Cambios' : 'Guardar Contrato'}
                </button>
             </div>
          </form>
        </div>
      )}

      {/* === VISTA DETALLE === */}
      {view === 'detail' && selectedContrato && (
        <div className="detail-view content-slide-up">
          <button className="btn-back" onClick={() => setView('list')}>
            <ArrowLeft size={18} /> Volver al Listado
          </button>
          <br />

          <div className="contract-header">
            <div className="header-info">
                <h2>{selectedContrato.numeroContrato}</h2>
                <span className="subtitle">{selectedContrato.nombreProfesional}</span>
            </div>
            <div className="header-stats">
                <div className="stat-box">
                    <label>Admin. Contrato</label>
                    <span>{selectedContrato.adminContrato}</span>
                </div>
                <div className="stat-box" style={{marginLeft:'40px'}}>
                    <label>Estado</label>
                    <span className={`status-text ${selectedContrato.estado.toLowerCase()}`}>{selectedContrato.estado}</span>
                </div>
            </div>
          </div>

          <h3 className="section-title">Expediente Digital</h3>
          
          <div className="documents-grid">
            {DOC_CATEGORIES.map((cat, index) => {
              const filesInCat = allDocuments.filter(d => d.contratoId === selectedContrato.id && d.categoria === cat);
              const hasFiles = filesInCat.length > 0;

              return (
                <div key={index} className="doc-card" style={{borderColor: hasFiles ? '#4318FF' : 'transparent'}}>
                  <div className="doc-info">
                      <h4 style={{color: hasFiles ? '#4318FF' : '#2B3674'}}>{cat}</h4>
                      <p style={{color: hasFiles ? '#05CD99' : '#A3AED0'}}>{filesInCat.length} archivos</p>
                  </div>
                  <div className="files-list-area">
                    <br />  
                      {hasFiles ? (
                          filesInCat.map(file => (
                              <div key={file.id} className="file-item-row">
                                  <div style={{display:'flex', alignItems:'center', gap:'10px', overflow:'hidden'}}>
                                    <FileText size={18} color="#4318FF"/>
                                    <span style={{fontSize:'0.85rem', color:'#2B3674', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'180px'}} title={file.nombreArchivo}>
                                        {file.nombreArchivo}
                                    </span>
                                  </div>
                                  <button 
                                    onClick={() => handleDownload(file.nombreArchivo)}
                                    title="Descargar"
                                    style={{background:'none', border:'none', cursor:'pointer', color:'#05CD99'}}
                                  >
                                      <Download size={20} />
                                  </button>
                              </div>
                          ))
                      ) : (
                          <div className="empty-state">
                              <span>Carpeta vacía</span>
                          </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContratosPage;
