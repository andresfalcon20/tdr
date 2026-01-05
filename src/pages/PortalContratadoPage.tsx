import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Upload, LogOut, CheckCircle, 
    FileText, File, Plus 
} from 'lucide-react';
import '../styles/PortalStyles.css'; // Usa los estilos espaciales nuevos

// INTERFACES
interface Usuario {
    id: number;
    nombre: string;
    email: string;
    rol: string;
}

interface Contrato {
    id: number;
    numeroContrato: string;
    nombreProfesional: string;
    adminContrato: string;
    fechaInicio: string;
    fechaFin: string;
    estado: string;
}

interface Documento {
    id: number;
    contratoId: number;
    categoria: string;
    nombreArchivo: string;
    fechaSubida: string;
    estado: 'En Revisión' | 'Aprobado' | 'Rechazado';
}

const DOC_CATEGORIES = [
    "Contrato", "Termino de referencia", "Informes técnicos (mensuales o por producto)",
    "Productos entregados", "Verificables", "Informe de conformidad mensual o por producto",
    "Informe técnico final", "Informe de conformidad final", "Facturas", "Otro"
];

const PortalContratadoPage = () => {
    const navigate = useNavigate();
    
    // ESTADOS
    const [user, setUser] = useState<Usuario | null>(null);
    const [myContract, setMyContract] = useState<Contrato | null>(null);
    const [documents, setDocuments] = useState<Documento[]>([]);
    
    // --- 1. CARGA DE SESIÓN AUTOMÁTICA ---
    useEffect(() => {
        const storedName = localStorage.getItem('userName');
        const storedRole = localStorage.getItem('role');

        if (!storedName || !storedRole) {
            navigate('/login');
            return;
        }

        const usersDB: Usuario[] = JSON.parse(localStorage.getItem('sistema_usuarios') || '[]');
        const contratosDB: Contrato[] = JSON.parse(localStorage.getItem('sistema_contratos') || '[]');

        const foundUser = usersDB.find(u => u.nombre === storedName);
        const foundContract = contratosDB.find(c => c.nombreProfesional === storedName);

        if (foundUser) setUser(foundUser);
        if (foundContract) setMyContract(foundContract);

        if (foundContract) {
            const storedDocs = localStorage.getItem('sistema_documentos');
            const allDocs: Documento[] = storedDocs ? JSON.parse(storedDocs) : [];
            setDocuments(allDocs.filter(d => d.contratoId === foundContract.id));
        }

    }, [navigate]);

    // --- 2. MANEJO DE ARCHIVOS ---
    const handleFileUpload = (categoria: string) => {
        if (!myContract) return;

        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files ? target.files[0] : null;

            if (file && myContract) {
                const newDoc: Documento = {
                    id: Date.now(),
                    contratoId: myContract.id,
                    categoria: categoria,
                    nombreArchivo: file.name,
                    fechaSubida: new Date().toLocaleDateString(),
                    estado: 'En Revisión'
                };

                const updatedDocs = [...documents, newDoc];
                setDocuments(updatedDocs);

                // Guardar en Global sin borrar los anteriores
                const storedDocs = localStorage.getItem('sistema_documentos');
                const allDocs: Documento[] = storedDocs ? JSON.parse(storedDocs) : [];
                localStorage.setItem('sistema_documentos', JSON.stringify([...allDocs, newDoc]));
                
                alert(`Archivo cargado: ${file.name}`);
            }
        };
        input.click();
    };

    // --- 3. CERRAR SESIÓN ---
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userName');
        navigate('/login');
    };

    if (!user || !myContract) {
        return (
            <div className="portal-container" style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>
                <div className="space-background"></div>
                <div className="glass-card" style={{textAlign:'center'}}>
                    <h2 style={{color:'white'}}>Cargando Portal...</h2>
                    <p style={{color:'#94a3b8'}}>Buscando contrato...</p>
                    <br />
                    <button onClick={handleLogout} className="btn-logout" style={{margin:'0 auto'}}>Cancelar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="portal-container">
            <div className="space-background"></div>

            {/* HEADER */}
            <header className="portal-header">
                <div className="user-profile">
                    <div className="avatar-circle">
                        {user.nombre.charAt(0)}
                    </div>
                    <div className="user-info">
                        <h2>{user.nombre}</h2>
                        <span>{user.rol} | {user.email}</span>
                    </div>
                </div>
                <button onClick={handleLogout} className="btn-logout">
                    <LogOut size={16} /> Cerrar Sesión
                </button>
            </header>

            <div className="portal-grid">
                {/* COLUMNA IZQUIERDA: DATOS */}
                <div>
                    <div className="glass-card contract-card">
                        <div style={{textAlign:'center', marginBottom:'20px'}}>
                            <div style={{color:'#94a3b8', fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'2px'}}>Nro. Contrato</div>
                            <div className="contract-number">
                                {myContract.numeroContrato.split('-')[1] || '001'}
                            </div>
                            <div style={{background:'rgba(255,255,255,0.1)', padding:'5px 10px', borderRadius:'5px', display:'inline-block', fontSize:'0.9rem', color:'#cbd5e1'}}>
                                {myContract.numeroContrato}
                            </div>
                        </div>

                        <div className="info-row">
                            <span className="info-label">Administrador</span>
                            <span className="info-value">{myContract.adminContrato}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Fecha Inicio</span>
                            <span className="info-value">{myContract.fechaInicio}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Fecha Fin</span>
                            <span className="info-value">{myContract.fechaFin}</span>
                        </div>

                        <span className={`status-badge ${myContract.estado === 'Activo' ? 'status-active' : 'status-pending'}`}>
                            {myContract.estado}
                        </span>
                    </div>
                </div>

                {/* COLUMNA DERECHA: DOCUMENTOS */}
                <div className="glass-card">
                    <div className="doc-section-header">
                        <Upload size={24} /> Documentación Requerida
                    </div>

                    <div>
                        {DOC_CATEGORIES.map((cat, index) => {
                            // Filtramos todos los archivos de esta categoría
                            const filesInCat = documents.filter(d => d.categoria === cat);
                            const isUploaded = filesInCat.length > 0;

                            return (
                                <div key={index} className={`doc-item ${isUploaded ? 'completed' : ''}`} style={{display: 'block'}}>
                                    
                                    {/* CABECERA DE LA TARJETA (Icono, Nombre y Botón) */}
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%'}}>
                                        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                                            <div style={{
                                                background: isUploaded ? '#10b981' : 'rgba(255,255,255,0.1)', 
                                                width:'35px', height:'35px', borderRadius:'8px',
                                                display:'flex', alignItems:'center', justifyContent:'center',
                                                color: isUploaded ? 'white' : '#64748b'
                                            }}>
                                                {isUploaded ? <CheckCircle size={18} /> : <File size={18} />}
                                            </div>
                                            <div style={{color: isUploaded ? 'white' : '#cbd5e1', fontWeight:'500'}}>
                                                {cat}
                                            </div>
                                        </div>

                                        <button className="btn-upload" onClick={() => handleFileUpload(cat)} title="Subir nuevo archivo">
                                            {isUploaded ? <Plus size={16} /> : <Upload size={16} />}
                                            {isUploaded ? 'Agregar' : 'Subir'}
                                        </button>
                                    </div>

                                    {/* LISTA DE ARCHIVOS (Ahora se muestran TODOS) */}
                                    {isUploaded && (
                                        <div style={{marginTop:'15px', paddingLeft:'50px', display:'flex', flexDirection:'column', gap:'8px'}}>
                                            {filesInCat.map((file) => (
                                                <div key={file.id} style={{
                                                    background: 'rgba(0,0,0,0.2)', padding:'8px 12px', borderRadius:'6px',
                                                    display:'flex', alignItems:'center', justifyContent:'space-between',
                                                    fontSize:'0.85rem'
                                                }}>
                                                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                                        <FileText size={14} color="#4ade80"/>
                                                        <span style={{color:'#e2e8f0'}}>{file.nombreArchivo}</span>
                                                    </div>
                                                    <span style={{fontSize:'0.75rem', color:'#94a3b8'}}>{file.fechaSubida}</span>
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
    );
};

export default PortalContratadoPage;
