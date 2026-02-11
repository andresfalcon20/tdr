import { useState, useEffect } from 'react';
import { 
  User, ArrowLeft, FolderOpen, Filter, Plus, Save, FileText, Download, Pencil, Trash2, Search, Check, ChevronDown, 
  Briefcase, Shield, Calendar, ChevronRight 
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
  const [view, setView] = useState<'list' | 'detail' | 'form'>('list');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  
  // Lista de usuarios contratados
  const [contratadosList, setContratadosList] = useState<Usuario[]>([]);

  // Estado principal de contratos
  const [contratos, setContratos] = useState<Contrato[]>([]);

  const [allDocuments, setAllDocuments] = useState<Documento[]>([]);
  const [formData, setFormData] = useState<Partial<Contrato>>({});

  // 1. CARGAR DATOS AL INICIO
  useEffect(() => {
      cargarDatosDelServidor();
  }, []);

  const cargarDatosDelServidor = async () => {
      try {
          // A. Cargar Contratos
          const resContratos = await fetch('/api/contratos');
          if (resContratos.ok) {
              const data = await resContratos.json();
              // Mapeo: Convertimos snake_case (BD) a camelCase (React)
              const formateados = data.map((c: any) => ({
                  id: c.id,
                  numeroContrato: c.numero_contrato,
                  nombreProfesional: c.nombre_profesional,
                  direccion: c.direccion,
                  adminContrato: c.admin_contrato,
                  fechaInicio: c.fecha_inicio ? c.fecha_inicio.split('T')[0] : '',
                  fechaFin: c.fecha_fin ? c.fecha_fin.split('T')[0] : '',
                  estado: c.estado || 'Activo',
                  progreso: c.progreso || 0
              }));
              setContratos(formateados);
          }

          // B. Cargar Usuarios (Para el select)
          const resUsuarios = await fetch('/api/usuarios');
          if (resUsuarios.ok) {
              const dataUsers = await resUsuarios.json();
              // Filtramos solo los que tienen rol 'Contratado'
              setContratadosList(dataUsers.filter((u: any) => u.rol === 'Contratado'));
          }

      } catch (error) {
          console.error("Error conectando al servidor:", error);
      }
  };


  // Cargar documentos REALES desde la API cuando entras a ver detalles
  useEffect(() => {
      if (view === 'detail') {
          const fetchDocumentos = async () => {
              try {
                  const res = await fetch('/api/documentos');
                  if (res.ok) {
                      const data = await res.json();
                      
                      // Mapeamos los datos para asegurar que coincidan con tu interfaz
                      const docsFormateados = data.map((d: any) => ({
                          id: d.id,
                          // Aseguramos que lea contrato_id (BD) o contratoId (Frontend)
                          contratoId: d.contrato_id || d.contratoId, 
                          categoria: d.categoria,
                          nombreArchivo: d.nombre_archivo || d.nombreArchivo,
                          fechaSubida: d.fecha_subida ? d.fecha_subida.split('T')[0] : '',
                          estado: d.estado || 'En Revisión'
                      }));

                      setAllDocuments(docsFormateados);
                  }
              } catch (error) {
                  console.error("Error al cargar documentos:", error);
              }
          };
          fetchDocumentos();
      }
  }, [view]);
  

  const registrarHistorial = async (accion: 'Creación' | 'Edición' | 'Eliminación', detalle: string) => {
      try {
          await fetch('/api/historial', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  accion,
                  entidad: 'Contrato',
                  detalle,
                  usuario: 'Admin General' 
              })
          });
      } catch (e) { console.error("No se pudo guardar historial", e); }
  };

  // --- ESTADOS DE BÚSQUEDA ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Todos');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // --- LÓGICA DE FILTRADO ---
  const filteredContratos = contratos.filter(c => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;

    if (filterType === 'Nro. Contrato') return c.numeroContrato.toLowerCase().includes(term);
    if (filterType === 'Profesional') return c.nombreProfesional.toLowerCase().includes(term);
    if (filterType === 'Admin') return c.adminContrato.toLowerCase().includes(term);
    if (filterType === 'Dirección') return c.direccion.toLowerCase().includes(term);

    return (
      c.numeroContrato.toLowerCase().includes(term) ||
      c.nombreProfesional.toLowerCase().includes(term) ||
      c.adminContrato.toLowerCase().includes(term) ||
      c.direccion.toLowerCase().includes(term)
    );
  });
  
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

  // 2. GUARDAR (CREAR O EDITAR) EN BD
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombreProfesional) {
        alert("Por favor seleccione un profesional.");
        return;
    }

    const datosParaEnviar = {
        numeroContrato: formData.numeroContrato,
        nombreProfesional: formData.nombreProfesional,
        direccion: formData.direccion,
        adminContrato: formData.adminContrato,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin
    };

    try {
        if (isEditing && formData.id) {
            // --- MODO EDICIÓN (PUT) ---
            const response = await fetch(`/api/contratos/${formData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosParaEnviar)
            });

            if (response.ok) {
                alert("Contrato actualizado exitosamente.");
                registrarHistorial('Edición', `Se actualizó el contrato ${formData.numeroContrato}`);
                cargarDatosDelServidor(); 
                setView('list');
                setFormData({});
            } else {
                alert("Error al actualizar en la base de datos.");
            }

        } else {
            // --- MODO CREACIÓN (POST) ---
            const response = await fetch('/api/contratos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosParaEnviar)
            });

            if (response.ok) {
                alert("Contrato creado exitosamente.");
                registrarHistorial('Creación', `Se creó el contrato ${formData.numeroContrato}`);
                cargarDatosDelServidor(); 
                setView('list');
                setFormData({});
            } else {
                alert("Error al guardar en base de datos.");
            }
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión con el servidor");
    }
  };

  // 3. ELIMINAR REAL EN BD (DELETE)
  const handleDelete = async (id: number) => {
      const contratoToDelete = contratos.find(c => c.id === id);
      
      if(window.confirm(`¿Está seguro de eliminar el contrato ${contratoToDelete?.numeroContrato} permanentemente?`)) {
          try {
              // LLAMADA REAL AL SERVIDOR
              const response = await fetch(`/api/contratos/${id}`, { 
                  method: 'DELETE' 
              });

              if (response.ok) {
                  // Si el servidor confirma que borró, actualizamos la lista visual
                  setContratos(prev => prev.filter(c => c.id !== id)); 
                  if (contratoToDelete) {
                      registrarHistorial('Eliminación', `Eliminado contrato ${contratoToDelete.numeroContrato}`);
                  }
                  alert("Contrato eliminado correctamente.");
              } else {
                  alert("Error: El servidor no pudo eliminar el registro.");
              }
          } catch (error) {
              console.error(error);
              alert("Error de conexión al intentar eliminar.");
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

// --- AGREGAR ESTA FUNCIÓN ANTES DEL RETURN ---
  const handleDeleteDocument = async (docId: number, docName: string) => {
      if (!window.confirm(`¿Seguro que quieres eliminar "${docName}" permanentemente?`)) return;

      try {
          const res = await fetch(`/api/documentos/${docId}`, { method: 'DELETE' });
          if (res.ok) {
              // Quitamos el archivo de la lista visualmente
              setAllDocuments(prev => prev.filter(d => d.id !== docId));
              alert("Archivo eliminado.");
          } else {
              alert("Error del servidor al eliminar.");
          }
      } catch (error) {
          console.error(error);
          alert("Error de conexión.");
      }
  };
  
  return (
    <div className="contratos-container fade-in">
      
      {/* === VISTA LISTA === */}
      {view === 'list' && (
        <div>
          <header className="page-header">
            <div>
              <h1>GESTIÓN DE CONTRATOS</h1>
              <p>Módulo de Búsqueda, Filtrado y Auditoría</p>
            </div>
            <button className="btn-primary" onClick={handleCreateClick}>
              <Plus size={20} /> Nuevo Contrato
            </button>
          </header>

         {/* --- BUSCADOR --- */}
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
                    <div className="filter-menu-header">Filtrar por:</div>
                    {['Todos', 'Nro. Contrato', 'Profesional', 'Admin', 'Dirección'].map((opcion) => (
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
                    <tr><td colSpan={6} style={{textAlign:'center', padding:'40px', color:'#94A3B8'}}>No se encontraron contratos.</td></tr>
                ) : (
                    filteredContratos.map((c) => (
                        <tr key={c.id}>
                            <td className="highlight-cell">{c.numeroContrato}</td>
                            <td><div className="user-cell"><User size={18} className="label-icon"/> {c.nombreProfesional}</div></td>
                            <td style={{fontSize:'0.85rem', maxWidth:'250px', lineHeight:'1.4'}}>{c.direccion}</td>
                            <td>{c.adminContrato}</td>
                            <td><span className={`status-badge status-${c.estado.toLowerCase()}`}>{c.estado}</span></td>
                            <td>
                                <div className="actions-cell">
                                    <button className="btn-icon view" onClick={() => {setSelectedContrato(c); setView('detail');}} title="Ver Expediente"><FolderOpen size={18}/></button>
                                    <button className="btn-icon edit" onClick={() => handleEditClick(c)} title="Editar"><Pencil size={18}/></button>
                                    <button className="btn-icon delete" onClick={() => handleDelete(c.id)} title="Eliminar"><Trash2 size={18}/></button>
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

      {/* === VISTA FORMULARIO === */}
      {view === 'form' && (
        <div className="form-center-wrapper fade-in-up">
            <div className="form-box">
                <div className="form-top-bar">
                    <button className="btn-back-circle" onClick={() => setView('list')} title="Volver">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="form-headings">
                        <h2>{isEditing ? 'Modificar Contrato' : 'Registrar Nuevo Contrato'}</h2>
                        <p>Complete la ficha técnica contractual.</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="smart-form">
                    <div className="form-row">
                        <div className="input-field-container">
                            <label className="field-label">
                                <FileText size={16} className="label-icon"/> Número de Contrato
                            </label>
                            <input 
                                type="text" name="numeroContrato" 
                                required className="modern-input"
                                value={formData.numeroContrato || ''} 
                                onChange={handleInputChange} 
                                placeholder="Ej: CTR-2026-001"
                            />
                        </div>
                        <div className="input-field-container">
                            <label className="field-label">
                                <User size={16} className="label-icon"/> Profesional Asignado
                            </label>
                            <div className="select-wrapper">
                                <select 
                                    name="nombreProfesional" 
                                    required className="modern-select"
                                    value={formData.nombreProfesional || ''} 
                                    onChange={handleInputChange} 
                                >
                                    <option value="">Seleccione un usuario...</option>
                                    {contratadosList.map(user => (
                                        <option key={user.id} value={user.nombre}>{user.nombre}</option>
                                    ))}
                                </select>
                                <ChevronRight size={16} className="select-arrow"/>
                            </div>
                            {contratadosList.length === 0 && (
                                <small style={{color:'#EF4444', marginTop:'4px', fontSize:'0.8rem'}}>* No hay usuarios 'Contratados' registrados.</small>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-field-container">
                            <label className="field-label">
                                <Shield size={16} className="label-icon"/> Admin. del Contrato
                            </label>
                            <input 
                                type="text" name="adminContrato" 
                                required className="modern-input"
                                value={formData.adminContrato || ''} 
                                onChange={handleInputChange} 
                                placeholder="Nombre del funcionario"
                            />
                        </div>
                        <div className="input-field-container">
                            <label className="field-label">
                                <Briefcase size={16} className="label-icon"/> Dirección Solicitante
                            </label>
                            <div className="select-wrapper">
                                <select name="direccion" required className="modern-select" value={formData.direccion || ''} onChange={handleInputChange}>
                                    <option value="">Seleccione...</option>
                                    {DIRECCIONES_LIST.map((dir, index) => (
                                        <option key={index} value={dir}>{dir}</option>
                                    ))}
                                </select>
                                <ChevronRight size={16} className="select-arrow"/>
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="input-field-container">
                            <label className="field-label">
                                <Calendar size={16} className="label-icon"/> Fecha Inicio
                            </label>
                            <input 
                                type="date" name="fechaInicio" 
                                required className="modern-input"
                                value={formData.fechaInicio || ''} 
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="input-field-container">
                            <label className="field-label">
                                <Calendar size={16} className="label-icon"/> Fecha Fin
                            </label>
                            <input 
                                type="date" name="fechaFin" 
                                required className="modern-input"
                                value={formData.fechaFin || ''} 
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="form-actions-bar">
                        <button type="button" className="btn-cancelar" onClick={() => setView('list')}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-guardar">
                            <Save size={18} /> {isEditing ? 'Guardar Cambios' : 'Registrar Contrato'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* === VISTA DETALLE === */}
      {view === 'detail' && selectedContrato && (
        <div className="detail-view fade-in">
            <div className="form-top-bar" style={{marginBottom:'20px'}}>
                <button className="btn-back-circle" onClick={() => setView('list')}>
                    <ArrowLeft size={24} />
                </button>
                <div className="form-headings">
                    <h2>Expediente Digital</h2>
                    <p>Gestión documental del contrato.</p>
                </div>
            </div>

          <div className="contract-header">
            <div className="header-info">
                <h2>{selectedContrato.numeroContrato}</h2>
                <div className="subtitle"><User size={18}/> {selectedContrato.nombreProfesional}</div>
            </div>
            <div className="header-stats">
                <div className="stat-box">
                    <label>Admin. Contrato</label>
                    <span>{selectedContrato.adminContrato}</span>
                </div>
                <div className="stat-box">
                    <label>Estado</label>
                    <span className="status-text">{selectedContrato.estado}</span>
                </div>
            </div>
          </div>

          <div className="documents-grid">
            {DOC_CATEGORIES.map((cat, index) => {
              const filesInCat = allDocuments.filter(d => d.contratoId === selectedContrato.id && d.categoria === cat);
              const hasFiles = filesInCat.length > 0;

              return (
                <div key={index} className="doc-card" style={{borderColor: hasFiles ? '#BFDBFE' : 'transparent'}}>
                  <div className="doc-info">
                      <h4 style={{color: hasFiles ? '#2563EB' : '#1E293B'}}>{cat}</h4>
                      <p style={{color: hasFiles ? '#166534' : '#94A3B8'}}>{filesInCat.length} archivos</p>
                  </div>
                  <div className="files-list-area">
                      {hasFiles ? (
                          filesInCat.map(file => (
                              <div key={file.id} className="file-item-row">
                                  <div style={{display:'flex', alignItems:'center', gap:'10px', overflow:'hidden'}}>
                                    <FileText size={18} color="#2563EB"/>
                                    <span style={{fontSize:'0.85rem', color:'#334155', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'180px'}} title={file.nombreArchivo}>
                                        {file.nombreArchivo}
                                    </span>
                                  </div>
                                  <div style={{display:'flex', gap:'5px'}}>
    {/* Botón Descargar original */}
    <button onClick={() => handleDownload(file.nombreArchivo)} title="Descargar" style={{background:'none', border:'none', cursor:'pointer', color:'#059669'}}>
        <Download size={18} />
    </button>
    
    {/* NUEVO: Botón Eliminar */}
    <button onClick={() => handleDeleteDocument(file.id, file.nombreArchivo)} title="Eliminar" style={{background:'none', border:'none', cursor:'pointer', color:'#EF4444'}}>
        <Trash2 size={18} />
    </button>
</div>

                              </div>
                          ))
                      ) : (
                          <div className="empty-state">Carpeta vacía</div>
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
