import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Upload, LogOut, CheckCircle, 
    FileText, File, Plus 
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
    
    // 1. Carga de Datos
    useEffect(() => {
        const storedName = localStorage.getItem('userName');
        const storedRole = localStorage.getItem('role');

        if (!storedName || !storedRole) { navigate('/login'); return; }

        const usersDB: Usuario[] = JSON.parse(localStorage.getItem('sistema_usuarios') || '[]');
        const contratosDB: Contrato[] = JSON.parse(localStorage.getItem('sistema_contratos') || '[]');

        const foundUser = usersDB.find(u => u.nombre === storedName);
        const foundContract = contratosDB.find(c => c.nombreProfesional === storedName);

        if (foundUser) setUser(foundUser);
        if (foundContract) {
            setMyContract(foundContract);
            const storedDocs = localStorage.getItem('sistema_documentos');
            const allDocs: Documento[] = storedDocs ? JSON.parse(storedDocs) : [];
            setDocuments(allDocs.filter(d => d.contratoId === foundContract.id));
        }
    }, [navigate]);

    // 2. Subida de Archivos
    const handleFileUpload = (categoria: string) => {
        if (!myContract) return;
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files ? target.files[0] : null;
            if (file && myContract) {
                const newDoc: Documento = {
                    id: Date.now(), contratoId: myContract.id, categoria: categoria,
                    nombreArchivo: file.name, fechaSubida: new Date().toLocaleDateString(), estado: 'En Revisión'
                };
                const updatedDocs = [...documents, newDoc];
                setDocuments(updatedDocs);
                
                // Guardar en localStorage
                const storedDocs = localStorage.getItem('sistema_documentos');
                const allDocs: Documento[] = storedDocs ? JSON.parse(storedDocs) : [];
                localStorage.setItem('sistema_documentos', JSON.stringify([...allDocs, newDoc]));
                
                alert(`Archivo cargado: ${file.name}`);
            }
        };
        input.click();
    };

    const handleLogout = () => {
        localStorage.removeItem('token'); localStorage.removeItem('role'); localStorage.removeItem('userName');
        navigate('/login');
    };

    if (!user || !myContract) {
        return (
            <div className="portal-container" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
                <div style={{background:'white', padding:'40px', borderRadius:'20px', textAlign:'center', boxShadow:'0 10px 30px rgba(0,0,0,0.1)'}}>
                    <h2 style={{color:'#142169'}}>Cargando Portal...</h2>
                    <p style={{color:'#8F9BBA'}}>Verificando contrato asignado...</p>
                    <button onClick={handleLogout} className="btn-logout" style={{margin:'20px auto'}}>Cancelar</button>
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

                                        {/* LISTA DE ARCHIVOS (LO QUE FALTABA) */}
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
