import { useState, useEffect } from 'react';
import { 
  User, ArrowLeft, FolderOpen, Filter, Plus, Save, FileText, Download 
} from 'lucide-react';
import '../styles/ContratosStyles.css'; 

// --- LISTA OFICIAL DE DIRECCIONES ---
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

// --- INTERFACES ---
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
  const [view, setView] = useState<'list' | 'detail' | 'create'>('list');
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  
  // 1. CARGA DE DATOS
  const [contratos, setContratos] = useState<Contrato[]>(() => {
      const saved = localStorage.getItem('sistema_contratos');
      return saved ? JSON.parse(saved) : []; 
  });

  const [allDocuments, setAllDocuments] = useState<Documento[]>([]);

  useEffect(() => {
      localStorage.setItem('sistema_contratos', JSON.stringify(contratos));
  }, [contratos]);

  useEffect(() => {
      if (view === 'detail') {
          const docs = localStorage.getItem('sistema_documentos');
          if (docs) setAllDocuments(JSON.parse(docs));
      }
  }, [view]);

  // 2. FILTROS
  const [filters, setFilters] = useState({
    numero: '', profesional: '', admin: '', direccion: ''
  });

  const [newContrato, setNewContrato] = useState<Partial<Contrato>>({});

  const filteredContratos = contratos.filter(c => 
    c.numeroContrato.toLowerCase().includes(filters.numero.toLowerCase()) &&
    c.nombreProfesional.toLowerCase().includes(filters.profesional.toLowerCase()) &&
    c.adminContrato.toLowerCase().includes(filters.admin.toLowerCase()) &&
    c.direccion.toLowerCase().includes(filters.direccion.toLowerCase())
  );

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewContrato({ ...newContrato, [e.target.name]: e.target.value });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const contratoFinal = { 
        ...newContrato, 
        id: Date.now(), 
        estado: 'Activo', 
        progreso: 0 
    } as Contrato;

    setContratos([...contratos, contratoFinal]);
    alert("Contrato creado exitosamente.");
    setView('list');
    setNewContrato({});
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
      <div className="space-background"></div>

      {/* --- VISTA LISTA --- */}
      {view === 'list' && (
        <div className="content-fade-in">
          <header className="page-header">
            <div>
              <h1>Gestión de Contratos</h1>
              <p>Módulo de Búsqueda, Filtrado y Auditoría</p>
            </div>
            <button className="btn-primary" onClick={() => setView('create')}>
              <Plus size={18} /> Nuevo Contrato
            </button>
          </header>

          <div className="glass-panel">
            <div className="filters-header">
              <Filter size={16} color="#3b82f6"/> <span>Búsqueda Avanzada</span>
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

          <div className="table-wrapper glass-panel" style={{padding:0}}>
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
                    <tr><td colSpan={6} style={{textAlign:'center', padding:'30px', color:'#94a3b8'}}>No se encontraron contratos.</td></tr>
                ) : (
                    filteredContratos.map((c) => (
                        <tr key={c.id}>
                            <td className="highlight-cell">{c.numeroContrato}</td>
                            <td><div className="user-cell"><User size={14} /> {c.nombreProfesional}</div></td>
                            <td style={{fontSize:'0.8rem', maxWidth:'280px', lineHeight:'1.3'}}>{c.direccion}</td>
                            <td>{c.adminContrato}</td>
                            <td><span className={`status-badge status-${c.estado.toLowerCase()}`}>{c.estado}</span></td>
                            <td>
                            <button className="btn-action" onClick={() => {setSelectedContrato(c); setView('detail');}}>
                                <FolderOpen size={16} /> Ver Expediente
                            </button>
                            </td>
                        </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- VISTA CREAR --- */}
      {view === 'create' && (
        <div className="glass-panel content-fade-in" style={{maxWidth: '900px', margin: '0 auto'}}>
          <div className="form-header-row">
             <button className="btn-back" onClick={() => setView('list')}><ArrowLeft size={20} /> Cancelar</button>
             <h2>Nuevo Contrato</h2>
          </div>
          <form onSubmit={handleCreate}>
             <div className="form-grid-2-col">
                <div className="form-item">
                    <label>Número de Contrato</label>
                    <input type="text" name="numeroContrato" required onChange={handleInputChange} placeholder="Ej: CTR-2026-001"/>
                </div>
                <div className="form-item">
                    <label>Profesional (Debe coincidir con Usuario)</label>
                    <input type="text" name="nombreProfesional" required onChange={handleInputChange} placeholder="Nombre completo"/>
                </div>
                <div className="form-item">
                    <label>Administrador del Contrato</label>
                    <input type="text" name="adminContrato" required onChange={handleInputChange} placeholder="Funcionario responsable"/>
                </div>
                <div className="form-item">
                    <label>Dirección Solicitante</label>
                   <select name="direccion" required onChange={handleInputChange}>
                      <option value="">Seleccione...</option>
                      {DIRECCIONES_LIST.map((dir, index) => (
                        <option key={index} value={dir}>{dir}</option>
                      ))}
                   </select>
                </div>
                <div className="form-item">
                    <label>Fecha Inicio</label>
                    <input type="date" name="fechaInicio" required onChange={handleInputChange}/>
                </div>
                <div className="form-item">
                    <label>Fecha Fin</label>
                    <input type="date" name="fechaFin" required onChange={handleInputChange}/>
                </div>
             </div>
             <div className="form-actions-right">
                <button type="submit" className="btn-primary">
                    <Save size={18} /> Guardar Contrato
                </button>
             </div>
          </form>
        </div>
      )}

      {/* --- VISTA DETALLE --- */}
      {view === 'detail' && selectedContrato && (
        <div className="detail-view content-slide-up">
          <button className="btn-back" onClick={() => setView('list')}>
            <ArrowLeft size={18} /> Volver al Listado
          </button>
          <br />

          <div className="contract-header glass-panel">
            <div className="header-info">
                <h2>{selectedContrato.numeroContrato}</h2>
                <span className="subtitle">{selectedContrato.nombreProfesional}</span>
            </div>
            <div className="header-stats">
                <div className="stat-box">
                    <label>Admin. Contrato</label>
                    <span>{selectedContrato.adminContrato}</span>
                </div>
                <div className="stat-box">
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
                <div key={index} className="doc-card" style={{borderColor: hasFiles ? '#3b82f6' : 'rgba(255,255,255,0.1)'}}>
                  
                  {/* Encabezado de la tarjeta */}
                  <div className="doc-info">
                      <h4 style={{color: hasFiles?'#fff':'#94a3b8'}}>{cat}</h4>
                      <p style={{color: hasFiles?'#4ade80':'#64748b'}}>{filesInCat.length} archivos</p>
                  </div>

                  {/* Área de archivos */}
                  <div className="files-list-area">
                    <br />  
                      {hasFiles ? (
                          filesInCat.map(file => (
                              <div key={file.id} className="file-item-row">
                                  <div style={{display:'flex', alignItems:'center', gap:'8px', overflow:'hidden'}}>
                                    <FileText size={16} color="#60a5fa"/>
                                    <span style={{fontSize:'0.8rem', color:'#e2e8f0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'130px'}} title={file.nombreArchivo}>
                                        {file.nombreArchivo}
                                    </span>
                                  </div>
                                  <button 
                                    onClick={() => handleDownload(file.nombreArchivo)}
                                    title="Descargar"
                                    style={{background:'none', border:'none', cursor:'pointer', color:'#4ade80'}}
                                  >
                                      <Download size={18} />
                                  </button>
                              </div>
                          ))
                      ) : (
                          <div className="empty-state">
                              <span style={{fontSize:'0.75rem', color:'#475569', fontStyle:'italic'}}>Sin entregas</span>
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
