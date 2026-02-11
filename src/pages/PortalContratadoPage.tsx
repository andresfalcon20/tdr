import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Upload, LogOut, CheckCircle, 
    FileText, File, Plus, AlertCircle 
} from 'lucide-react';
import '../styles/PortalStyles.css'; 

// --- INTERFACES ---
interface Usuario {
    id: number; nombre: string; email: string; rol: string;
}
interface Contrato {
    id: number; numeroContrato: string; nombreProfesional: string; adminContrato: string; fechaInicio: string; fechaFin: string; estado: string;
}
interface Documento {
    id: number; contratoId: number; categoria: string; nombreArchivo: string; fechaSubida: string; estado: 'En Revisión' | 'Aprobado' | 'Rechazado';
}

const DOC_CATEGORIES = [
    "Contrato", "Termino de referencia", "Informes técnicos",
    "Productos entregados", "Verificables", "Informe de conformidad",
    "Informe técnico final", "Facturas", "Otro"
];

const PortalContratadoPage = () => {
    const navigate = useNavigate();
    
    // Estados
    const [user, setUser] = useState<Usuario | null>(null);
    const [myContract, setMyContract] = useState<Contrato | null>(null);
    const [documents, setDocuments] = useState<Documento[]>([]);
    const [loading, setLoading] = useState(true);
    
    // 1. CARGA DE DATOS: CONECTADO A BASE DE DATOS
    useEffect(() => {
        const cargarDatosPortal = async () => {
            const storedName = localStorage.getItem('userName');
            const storedEmail = localStorage.getItem('userEmail');

            if (!storedName) { 
                navigate('/login'); 
                return; 
            }

            try {
                // A. Obtenemos TODOS los contratos de la BD
                const resContratos = await fetch('/api/contratos');
                // B. Obtenemos TODOS los documentos de la BD
                const resDocs = await fetch('/api/documentos');
                
                if (resContratos.ok) {
                    const contratosRaw = await resContratos.json();

                    // B. Buscamos el contrato que pertenezca a este usuario (por Nombre exacto)
                    // Nota: En la BD el campo viene como snake_case: 'nombre_profesional'
                    const foundContractRaw = contratosRaw.find((c: any) => 
                        c.nombre_profesional === storedName
                    );

                    // Establecemos el Usuario (basado en lo que tenemos del login)
                    setUser({
                        id: 0, 
                        nombre: storedName,
                        email: storedEmail || 'Usuario',
                        rol: 'Contratado'
                    });

                    if (foundContractRaw) {
                        // C. Mapeamos el contrato encontrado
                        const contratoFormateado: Contrato = {
                            id: foundContractRaw.id,
                            numeroContrato: foundContractRaw.numero_contrato,
                            nombreProfesional: foundContractRaw.nombre_profesional,
                            adminContrato: foundContractRaw.admin_contrato,
                            fechaInicio: foundContractRaw.fecha_inicio ? foundContractRaw.fecha_inicio.split('T')[0] : '',
                            fechaFin: foundContractRaw.fecha_fin ? foundContractRaw.fecha_fin.split('T')[0] : '',
                            estado: foundContractRaw.estado || 'Activo'
                        };
                        setMyContract(contratoFormateado);

                        // D. Procesamos los documentos si la petición fue exitosa
                        if (resDocs.ok) {
                            const allDocs = await resDocs.json();
                            
                            // Filtramos solo los documentos de ESTE contrato
                            // Manejamos comparación de ID como string para evitar errores de tipo
                            const myDocs = allDocs.filter((d: any) => 
                                String(d.contrato_id) === String(foundContractRaw.id) || 
                                String(d.contratoId) === String(foundContractRaw.id)
                            ).map((d: any) => ({
                                id: d.id,
                                contratoId: d.contrato_id || d.contratoId,
                                categoria: d.categoria,
                                nombreArchivo: d.nombre_archivo || d.nombreArchivo,
                                fechaSubida: d.fecha_subida ? d.fecha_subida.split('T')[0] : '',
                                estado: d.estado || 'En Revisión'
                            }));
                            
                            setDocuments(myDocs);
                        }
                    }
                }
            } catch (error) {
                console.error("Error conectando al portal:", error);
            } finally {
                setLoading(false);
            }
        };

        cargarDatosPortal();
    }, [navigate]);

    // 2. Subida de Archivos (AHORA SÍ GUARDA EN DB)
    const handleFileUpload = (categoria: string) => {
        if (!myContract) return;
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files ? target.files[0] : null;
            
            if (file && myContract) {
                // Preparamos objeto para enviar a la API
                // Enviamos ambos formatos (snake y camel) para asegurar compatibilidad con tu server
                const nuevoDocDB = {
                    contratoId: myContract.id,
                    contrato_id: myContract.id,
                    categoria: categoria,
                    nombreArchivo: file.name,
                    nombre_archivo: file.name,
                    fechaSubida: new Date().toISOString().split('T')[0], 
                    fecha_subida: new Date().toISOString().split('T')[0],
                    estado: 'En Revisión'
                };

                try {
                    const response = await fetch('/api/documentos', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(nuevoDocDB)
                    });

                    if (response.ok) {
                        const docGuardado = await response.json();
                        
                        // Actualizamos la vista con el documento real guardado
                        const newDocView: Documento = {
                            id: docGuardado.id || Date.now(),
                            contratoId: myContract.id,
                            categoria: categoria,
                            nombreArchivo: file.name,
                            fechaSubida: new Date().toLocaleDateString(),
                            estado: 'En Revisión'
                        };
                        
                        setDocuments(prev => [...prev, newDocView]);
                        alert(`Archivo "${file.name}" subido y guardado correctamente.`);
                    } else {
                        alert("Error al guardar el archivo en la base de datos.");
                    }
                } catch (error) {
                    console.error("Error subiendo archivo:", error);
                    alert("Error de conexión al subir archivo.");
                }
            }
        };
        input.click();
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="portal-container" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
                <div style={{background:'white', padding:'40px', borderRadius:'20px', textAlign:'center', boxShadow:'0 10px 30px rgba(0,0,0,0.1)'}}>
                    <h2 style={{color:'#142169'}}>Cargando...</h2>
                    <p style={{color:'#8F9BBA'}}>Verificando contrato en base de datos...</p>
                </div>
            </div>
        );
    }

    if (!user || !myContract) {
        return (
            <div className="portal-container" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
                <div style={{background:'white', padding:'40px', borderRadius:'20px', textAlign:'center', maxWidth:'500px', boxShadow:'0 10px 30px rgba(0,0,0,0.1)'}}>
                    <div style={{color: '#EF4444', marginBottom: '15px'}}><AlertCircle size={40}/></div>
                    <h2 style={{color:'#142169'}}>Acceso Restringido</h2>
                    <p style={{color:'#64748B', marginBottom:'20px', lineHeight:'1.5'}}>
                        Hola <strong>{localStorage.getItem('userName')}</strong>, no hemos encontrado un contrato activo vinculado a tu nombre en el sistema.
                    </p>
                    <p style={{fontSize:'0.9rem', color:'#94A3B8'}}>
                        Solicita al Administrador que verifique que tu contrato tenga asignado exactamente tu nombre de usuario.
                    </p>
                    <button onClick={handleLogout} className="btn-logout" style={{margin:'20px auto', width:'100%', justifyContent:'center'}}>Volver al Login</button>
                </div>
            </div>
        );
    }

    return (
        <div className="portal-container">
            
            {/* 1. BANNER DE FONDO */}
            <div className="portal-banner"></div>

            <div className="portal-content">
                
                {/* 2. HEADER USUARIO */}
                <div className="user-header-card">
                    <div className="user-left">
                        <div className="avatar-big">
                            {user.nombre.charAt(0)}
                        </div>
                        <div className="user-details">
                            <h1>Hola, {user.nombre}</h1>
                            <p>Portal de Gestión del Contratado • {user.email}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="btn-logout">
                        <LogOut size={18} /> Cerrar Sesión
                    </button>
                </div>

                {/* 3. GRID PRINCIPAL */}
                <div className="portal-grid">
                    
                    {/* IZQUIERDA: TARJETA DE CONTRATO (CORTA) */}
                    <div className="contract-card-premium">
                        <div>
                            <span className="contract-badge">CONTRATO ACTIVO</span>
                            <div className="contract-id-large">
                                {myContract.numeroContrato.split('-')[1] || '001'}
                            </div>
                            <div className="contract-id-full">
                                {myContract.numeroContrato}
                            </div>
                        </div>

                        <div className="info-box-dark">
                            <div className="info-row-dark">
                                <span className="info-label-dark">Administrador</span>
                                <span className="info-value-dark">{myContract.adminContrato}</span>
                            </div>
                            <div className="info-row-dark">
                                <span className="info-label-dark">Inicio</span>
                                <span className="info-value-dark">{myContract.fechaInicio}</span>
                            </div>
                            <div className="info-row-dark">
                                <span className="info-label-dark">Fin</span>
                                <span className="info-value-dark">{myContract.fechaFin}</span>
                            </div>
                            <div className="info-row-dark">
                                <span className="info-label-dark">Estado</span>
                                <span className="info-value-dark" style={{color:'#05CD99'}}>{myContract.estado}</span>
                            </div>
                        </div>
                    </div>

                    {/* DERECHA: LISTA DE DOCUMENTOS */}
                    <div className="docs-section">
                        <div className="section-title">
                            <div className="icon-title"><FileText size={20}/></div>
                            Documentación Requerida
                        </div>

                        <div className="docs-list">
                            {DOC_CATEGORIES.map((cat, index) => {
                                const filesInCat = documents.filter(d => d.categoria === cat);
                                const isUploaded = filesInCat.length > 0;

                                return (
                                    <div key={index} className={`doc-card-item ${isUploaded ? 'completed' : ''}`}>
                                        
                                        {/* Fila Principal */}
                                        <div className="doc-main-row">
                                            <div className="doc-left">
                                                <div className="status-icon">
                                                    {isUploaded ? <CheckCircle size={24} /> : <File size={24} />}
                                                </div>
                                                <div className="doc-text">
                                                    <h4>{cat}</h4>
                                                    <p style={{color: isUploaded ? '#05CD99' : '#8F9BBA'}}>
                                                        {isUploaded ? 'Archivos cargados' : 'Pendiente de entrega'}
                                                    </p>
                                                </div>
                                            </div>

                                            <button className="btn-action" onClick={() => handleFileUpload(cat)}>
                                                {isUploaded ? <Plus size={18} /> : <Upload size={18} />}
                                                {isUploaded ? 'Agregar' : 'Subir'}
                                            </button>
                                        </div>

                                        {/* LISTA DE ARCHIVOS */}
                                        {isUploaded && (
                                            <div className="files-container">
                                                {filesInCat.map(file => (
                                                    <div key={file.id} className="uploaded-file">
                                                        <FileText size={16} color="#4318FF"/>
                                                        <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                                                            {file.nombreArchivo}
                                                        </span>
                                                        <span className="file-date">{file.fechaSubida}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PortalContratadoPage;
