import { useState, useEffect } from 'react';
import { 
User, ChevronRight, ArrowLeft, FolderOpen, Filter, Plus, Upload, Save
} from 'lucide-react';
import '../styles/ContratosStyles.css'; 

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

const DOC_CATEGORIES = [
  "Contrato", "Términos de Referencia (TDR)", "Informes Técnicos", 
  "Productos Entregados", "Verificables", "Informes de Conformidad", 
  "Informe Técnico Final", "Informe Conformidad Final", "Facturas", "Otros"
];

const ContratosPage = () => {
  const [view, setView] = useState<'list' | 'detail' | 'create'>('list');
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  
  // 1. CARGA LOCAL (Empieza vacío si no hay nada guardado)
  const [contratos, setContratos] = useState<Contrato[]>(() => {
      const saved = localStorage.getItem('sistema_contratos');
      return saved ? JSON.parse(saved) : []; 
  });

  // 2. GUARDADO AUTOMÁTICO
  useEffect(() => {
      localStorage.setItem('sistema_contratos', JSON.stringify(contratos));
  }, [contratos]);

  // Formulario temporal
  const [newContrato, setNewContrato] = useState<Partial<Contrato>>({});

  const [filters, setFilters] = useState({
    numero: '', profesional: '', admin: '', direccion: ''
  });

  const filteredContratos = contratos.filter(c => 
    c.numeroContrato.toLowerCase().includes(filters.numero.toLowerCase()) &&
    c.nombreProfesional.toLowerCase().includes(filters.profesional.toLowerCase()) &&
    c.adminContrato.toLowerCase().includes(filters.admin.toLowerCase()) &&
    c.direccion.toLowerCase().includes(filters.direccion.toLowerCase())
  );

  const handleOpenDetail = (contrato: Contrato) => {
    setSelectedContrato(contrato);
    setView('detail');
  };

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
    alert("Contrato guardado localmente");
    setView('list');
    setNewContrato({});
  };

  return (
    <div className="contratos-container">
      <div className="space-background"></div>

      {/* ================= VISTA LISTA ================= */}
      {view === 'list' && (
        <div className="content-fade-in">
          <header className="page-header">
            <div>
              <h1>Gestión de Contratos de Servicios</h1>
              <p>Administración y Documentación</p>
            </div>
            <button className="btn-primary" onClick={() => setView('create')}>
              <Plus size={18} /> Nuevo Contrato
            </button>
          </header>

          <div className="filters-panel glass-panel">
            <div className="filters-header">
              <Filter size={16} color="#3b82f6"/>
              <span>Búsqueda y Auditoría</span>
            </div>
            <div className="filters-row">
              <div className="filter-item">
                <label>Nro. Contrato</label>
                <input type="text" name="numero" placeholder="Ej: CTR-2025..." value={filters.numero} onChange={handleFilterChange}/>
              </div>
              <div className="filter-item">
                <label>Profesional</label>
                <input type="text" name="profesional" placeholder="Buscar profesional..." value={filters.profesional} onChange={handleFilterChange}/>
              </div>
              <div className="filter-item">
                <label>Administrador</label>
                <input type="text" name="admin" placeholder="Buscar administrador..." value={filters.admin} onChange={handleFilterChange}/>
              </div>
              <div className="filter-item">
                <label>Dirección / Área</label>
                <select name="direccion" onChange={handleFilterChange} value={filters.direccion}>
                  <option value="">Todas las Direcciones</option>
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
            </div>
          </div>

          <div className="table-wrapper glass-panel">
            <table className="contratos-table">
              <thead>
                <tr>
                  <th>Contrato</th>
                  <th>Profesional</th>
                  <th>Dirección</th>
                  <th>Vigencia</th>
                  <th>Admin. Contrato</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredContratos.length === 0 ? (
                    <tr><td colSpan={7} style={{textAlign:'center', padding:'20px'}}>No hay contratos registrados.</td></tr>
                ) : (
                    filteredContratos.map((c) => (
                    <tr key={c.id}>
                        <td className="highlight-cell">{c.numeroContrato}</td>
                        <td><div className="user-cell"><User size={14} /> {c.nombreProfesional}</div></td>
                        <td style={{fontSize: '0.8rem', maxWidth: '200px'}}>{c.direccion}</td>
                        <td><div className="date-cell"><span>{c.fechaInicio}</span><span className="date-arrow">→</span><span>{c.fechaFin}</span></div></td>
                        <td>{c.adminContrato}</td>
                        <td><span className={`status-badge status-${c.estado.toLowerCase()}`}>{c.estado}</span></td>
                        <td>
                        <button className="btn-action" onClick={() => handleOpenDetail(c)} title="Ver Expediente Digital">
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

      {/* ================= VISTA CREAR CONTRATO ================= */}
      {view === 'create' && (
        <div className="form-container glass-panel content-fade-in" style={{maxWidth: '1000px', margin: '0 auto'}}>
          <div className="form-header-row">
             <button className="btn-back" onClick={() => setView('list')}>
                <ArrowLeft size={20} /> Cancelar
             </button>
             <h2>Nuevo Contrato de Servicios</h2>
          </div>

          <form onSubmit={handleCreate} className="create-form">
             <div className="form-grid-2-col">
                <div className="form-item">
                   <label>Número de Contrato</label>
                   <input type="text" name="numeroContrato" placeholder="Ej: CTR-2025-001" required onChange={handleInputChange}/>
                </div>
                <div className="form-item">
                   <label>Profesional a Contratar</label>
                   <input type="text" name="nombreProfesional" placeholder="Nombre completo" required onChange={handleInputChange}/>
                </div>
                <div className="form-item">
                   <label>Administrador del Contrato</label>
                   <input type="text" name="adminContrato" placeholder="Funcionario responsable" required onChange={handleInputChange}/>
                </div>
                <div className="form-item">
                   <label>Dirección Solicitante</label>
                   <select name="direccion" required onChange={handleInputChange}>
                      <option value="">Seleccione Dirección...</option>
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

      {/* ================= VISTA DETALLE ================= */}
      {view === 'detail' && selectedContrato && (
        <div className="detail-view content-slide-up">
          <button className="btn-back" onClick={() => setView('list')}>
            <ArrowLeft size={18} /> Volver al Listado
          </button>

          <div className="contract-header glass-panel">
            <div className="header-info">
              <h2>{selectedContrato.numeroContrato}</h2>
              <span className="subtitle">{selectedContrato.nombreProfesional}</span>
            </div>
            <div className="header-stats">
              <div className="stat-box">
                <label>Estado</label>
                <span className={`status-text ${selectedContrato.estado.toLowerCase()}`}>
                  {selectedContrato.estado}
                </span>
              </div>
              <div className="stat-box">
                <label>Progreso</label>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: `${selectedContrato.progreso}%`}}></div>
                </div>
                <span className="progress-text">{selectedContrato.progreso}%</span>
              </div>
            </div>
          </div>

          <h3 className="section-title">Expediente Digital - Categorías</h3>
          <div className="documents-grid">
            {DOC_CATEGORIES.map((cat, index) => (
              <div key={index} className="doc-card glass-panel">
                <div className="doc-icon-wrapper"><FolderOpen size={24} color="#60a5fa" /></div>
                <div className="doc-info"><h4>{cat}</h4><p>0 archivos</p></div>
                <div className="doc-actions">
                  <button className="btn-icon-small"><Upload size={14}/></button>
                  <button className="btn-icon-small"><ChevronRight size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContratosPage;
