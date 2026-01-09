import { useState, useEffect } from 'react';
import {
    Plus, Search, Key, Trash2, ArrowLeft, Pencil, X, Save, CheckCircle
} from 'lucide-react';
import '../styles/UsuariosStyles.css';

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

interface Usuario {
    id: number;
    nombre: string;
    email: string;
    rol: 'Administrador' | 'Técnico' | 'Contratado';
    area: string;
    password?: string;
}

const INITIAL_DATA: Usuario[] = [
    { id: 1, nombre: 'Admin General', email: 'admin@inamhi.ec', rol: 'Administrador', area: 'Gerencia' },
    { id: 2, nombre: 'Andres Falcon', email: 'andres@inamhi.gob.ec', rol: 'Contratado', area: 'Dirección Hidrometeorológica' },
    { id: 3, nombre: 'Washo Betancourt', email: 'washo@inamhi.gob.ec', rol: 'Técnico', area: 'Tecnologías Tics' },
];

const UsuariosPage = () => {
    // --- ESTADOS ---
    const [view, setView] = useState<'list' | 'form'>('list');
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estado del formulario
    const [formData, setFormData] = useState<Partial<Usuario>>({});
    
    // Lista de usuarios
    const [users, setUsers] = useState<Usuario[]>(() => {
        const saved = localStorage.getItem('sistema_usuarios');
        return saved ? JSON.parse(saved) : INITIAL_DATA;
    });

    // Estados para el Modal de Contraseña
    const [showPassModal, setShowPassModal] = useState(false);
    const [selectedUserPass, setSelectedUserPass] = useState<Usuario | null>(null);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        localStorage.setItem('sistema_usuarios', JSON.stringify(users));
    }, [users]);

    // --- FUNCIÓN PARA GUARDAR EN EL HISTORIAL ---
    const registrarHistorial = (accion: 'Creación' | 'Edición' | 'Eliminación', detalle: string) => {
        const historial = JSON.parse(localStorage.getItem('sistema_historial') || '[]');
        const nuevoLog = {
            id: Date.now(),
            accion: accion,
            entidad: 'Usuario',
            detalle: detalle,
            fecha: new Date().toISOString(),
            usuario: 'Admin General' 
        };
        localStorage.setItem('sistema_historial', JSON.stringify([nuevoLog, ...historial]));
    };

    // --- FILTROS ---
    const filteredUsers = users.filter(u =>
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.area.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- HELPERS VISUALES ---
    const getAvatarColor = (name: string) => {
        const first = name.charAt(0).toUpperCase();
        if (['A','E','I','O','U'].includes(first)) return 'avatar-blue';
        if (['B','C','D','F','G'].includes(first)) return 'avatar-green';
        if (['H','J','K','L','M'].includes(first)) return 'avatar-orange';
        return 'avatar-purple';
    };

    const getRoleBadge = (rol: string) => {
        if (rol === 'Administrador') return <span className="role-badge badge-admin">Admin</span>;
        if (rol === 'Técnico') return <span className="role-badge badge-tech">Técnico</span>;
        return <span className="role-badge badge-contract">Contratado</span>;
    };

    // --- LÓGICA CRUD ---

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreate = () => {
        setIsEditing(false);
        setFormData({});
        setView('form');
    };

    const handleEdit = (user: Usuario) => {
        setIsEditing(true);
        setFormData({ ...user });
        setView('form');
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && formData.id) {
            // Actualizar
            const updated = users.map(u => u.id === formData.id ? { ...u, ...formData } as Usuario : u);
            setUsers(updated);
            
            // Historial Edición
            registrarHistorial('Edición', `Se actualizaron los datos del usuario ${formData.nombre}`);
            
            alert("Datos de usuario actualizados.");
        } else {
            // Crear
            const newUser = { ...formData, id: Date.now() } as Usuario;
            setUsers([...users, newUser]);
            
            // Historial Creación
            registrarHistorial('Creación', `Se registró al usuario ${newUser.nombre} con rol ${newUser.rol}`);
            
            alert("Usuario creado exitosamente.");
        }
        setView('list');
    };

    const handleDelete = (id: number) => {
        const userToDelete = users.find(u => u.id === id);
        if(window.confirm("¿Eliminar este usuario permanentemente?")) {
            setUsers(users.filter(u => u.id !== id));
            
            // Historial Eliminación
            if (userToDelete) {
                registrarHistorial('Eliminación', `Se eliminó al usuario ${userToDelete.nombre}`);
            }
        }
    };

    // --- LÓGICA RESET PASSWORD ---
    const openPassModal = (user: Usuario) => {
        setSelectedUserPass(user);
        setNewPassword('');
        setShowPassModal(true);
    };

    const saveNewPassword = () => {
        if(!selectedUserPass) return;
        if(newPassword.length < 4) return alert("La contraseña es muy corta.");
        
        const updated = users.map(u => u.id === selectedUserPass.id ? {...u, password: newPassword} : u);
        setUsers(updated);
        
        // Historial Cambio Clave
        registrarHistorial('Edición', `Se restableció la contraseña del usuario ${selectedUserPass.nombre}`);
        
        alert(`Contraseña actualizada para ${selectedUserPass.nombre}`);
        setShowPassModal(false);
    };

    return (
        <div className="page-container">
            
            {/* --- VISTA LISTA --- */}
            {view === 'list' && (
                <>
                    <header className="page-header">
                        <div>
                            <h1>Gestión de Usuarios</h1>
                            <p>Administra los roles y permisos del sistema.</p>
                        </div>
                        <button className="btn-primary" onClick={handleCreate}>
                            <Plus size={18} /> Nuevo Usuario
                        </button>   
                    </header>

                    <div className="search-container">
                        <div className="search-box">
                            <Search size={18} color="#A3AED0" />
                            <input 
                                type="text" className="search-input" 
                                placeholder="Buscar usuario por nombre, email o área..." 
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="white-card" style={{ overflowX: 'auto' }}>
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Rol Asignado</th>
                                    <th>Dirección / Área</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <div className="user-info-cell">
                                                <div className={`user-avatar ${getAvatarColor(u.nombre)}`}>
                                                    {u.nombre.charAt(0)}
                                                </div>
                                                <div className="user-details-text">
                                                    <span className="user-name">{u.nombre}</span>
                                                    <span className="user-email">{u.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{getRoleBadge(u.rol)}</td>
                                        <td style={{color:'#475569', fontSize:'0.9rem'}}>{u.area}</td>
                                        <td>
                                            <div className="actions-row">
                                                <button className="action-btn btn-edit" onClick={() => handleEdit(u)} title="Editar Datos">
                                                    <Pencil size={16}/>
                                                </button>
                                                <button className="action-btn btn-key" onClick={() => openPassModal(u)} title="Resetear Clave">
                                                    <Key size={16}/>
                                                </button>
                                                <button className="action-btn btn-delete" onClick={() => handleDelete(u.id)} title="Eliminar">
                                                    <Trash2 size={16}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && <tr><td colSpan={4} className="empty-row">No se encontraron usuarios.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* --- VISTA FORMULARIO --- */}
            {view === 'form' && (
                <div className="form-card">
                    <div className="form-header-container">
                        <button className="btn-secondary" onClick={() => setView('list')}>
                            <ArrowLeft size={18} /> Regresar
                        </button>
                        
                        <div className="form-title-wrapper">
                            <h2>{isEditing ? 'Modificar Usuario' : 'Nuevo Usuario'}</h2>
                            <div className="title-underline"></div>
                        </div>
                        
                        <div style={{width: '100px'}}></div> 
                    </div>

                    <form onSubmit={handleSave}>
                        <div className="form-grid">
                            <div className="input-group">
                                <label>Nombre Completo</label>
                                <br />
                                
                                <input type="text" name="nombre" required value={formData.nombre || ''} onChange={handleInputChange} placeholder="Ingrese nombre completo"/>
                            </div>
                            <div className="input-group">
                                <br />
                                <label>Correo Institucional</label>
                                <input type="email" name="email" required value={formData.email || ''} onChange={handleInputChange} placeholder="usuario@inamhi.ec"/>
                            </div>
                            <div className="input-group">
                                <br />
                                <label>Rol en el Sistema</label>
                                <select name="rol" required value={formData.rol || ''} onChange={handleInputChange}>
                                    <option value="">Seleccione...</option>
                                    <option value="Técnico">Técnico</option>
                                    <option value="Contratado">Contratado</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Dirección / Área</label>
                                <br />
                                <select name="area" required value={formData.area || ''} onChange={handleInputChange}>
                                    <option value="">Seleccione...</option>
                                    {DIRECCIONES_INAMHI.map((dir, idx) => <option key={idx} value={dir}>{dir}</option>)}
                                </select>
                            </div>
                            
                            {!isEditing && (
                                <div className="input-group full-width">
                                    <label>Contraseña Temporal</label>
                                    <br />
                                    <input type="text" name="password" required placeholder="Asigne una contraseña inicial..." onChange={handleInputChange}/>
                                </div>
                            )}
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-primary">
                                <Save size={18}/> {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- MODAL RESET PASSWORD --- */}
            {showPassModal && selectedUserPass && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="modal-close" onClick={() => setShowPassModal(false)}><X size={20}/></button>
                        
                        <div className="modal-header">
                            <div className="modal-icon-box"><Key size={28}/></div>
                            <h3>Restaurar Contraseña</h3>
                            <p>Usuario: <strong>{selectedUserPass.nombre}</strong></p>
                        </div>

                        <div className="modal-body">
                            <div className="input-group">
                                <label>Nueva Contraseña</label>
                                <br />
                                <input type="text" autoFocus value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Escriba la nueva clave..."/>
                            </div>
                        </div>

                        <button className="btn-primary full-btn" onClick={saveNewPassword}>
                            <CheckCircle size={18}/> Confirmar Cambio
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default UsuariosPage;
