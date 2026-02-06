import { useState, useEffect } from 'react';
import {
    Plus, Search, Key, Trash2, ArrowLeft, Pencil, X, Save, CheckCircle, 
    User, Briefcase, Mail, Shield, ChevronRight, LayoutGrid
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

interface Notification {
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
}

const ADMIN_FIJO: Usuario = { 
    id: 1, 
    nombre: 'Admin General', 
    email: 'admin@inamhi.gob.ec', 
    rol: 'Administrador', 
    area: 'TECNOLOGÍAS DE LA INFORMACIÓN Y COMUNICACIÓN', 
    password: 'admin' 
};

const UsuariosPage = () => {
    // --- ESTADOS ---
    const [view, setView] = useState<'list' | 'form'>('list');
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState<Partial<Usuario>>({});
    const [notification, setNotification] = useState<Notification>({ show: false, message: '', type: 'info' });

    // 1. Iniciamos con el Admin por defecto
    const [users, setUsers] = useState<Usuario[]>([ADMIN_FIJO]);

    const [showPassModal, setShowPassModal] = useState(false);
    const [selectedUserPass, setSelectedUserPass] = useState<Usuario | null>(null);
    const [newPassword, setNewPassword] = useState('');

    // --- FUNCIÓN HELPER PARA HISTORIAL ---
    const registrarHistorial = async (accion: string, detalle: string) => {
        try {
            await fetch('/api/historial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accion,
                    entidad: 'Usuario',
                    detalle,
                    usuario: 'Administrador' // O el nombre del usuario logueado
                })
            });
        } catch (error) {
            console.error("No se pudo guardar en el historial:", error);
        }
    };

    // 2. Cargamos usuarios desde BD (y combinamos con el Admin fijo)
    useEffect(() => {
        fetch('/api/usuarios')
            .then(res => res.json())
            .then(data => {
                // Filtramos para evitar duplicar al admin si ya viene de la BD
                const usuariosDB = data.filter((u: Usuario) => u.email !== 'admin@inamhi.gob.ec');
                setUsers([ADMIN_FIJO, ...usuariosDB]);
            })
            .catch(err => {
                console.error("Error cargando usuarios (modo offline):", err);
            });
    }, []);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    };

    // --- FILTROS ---
    const filteredUsers = users.filter(u =>
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.area.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- HELPERS ---
    const getRoleBadge = (rol: string) => {
        if (rol === 'Administrador') return <span className="role-tag tag-admin">Admin</span>;
        if (rol === 'Técnico') return <span className="role-tag tag-tech">Técnico</span>;
        return <span className="role-tag tag-contract">Contratado</span>;
    };

    // --- CRUD ---
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

            
            const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            if (isEditing && formData.id) {
                // EDITAR
                const res = await fetch(`/api/usuarios/${formData.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if(res.ok) {
                    showToast("Usuario actualizado con éxito");
                    // REGISTRO EN HISTORIAL
                    registrarHistorial('Edición', `Se actualizaron los datos del usuario: ${formData.nombre}`);
                }
            } else {
                // CREAR
                const res = await fetch('/api/usuarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if(res.ok) {
                    showToast("Usuario registrado correctamente");
                    // REGISTRO EN HISTORIAL
                    registrarHistorial('Creación', `Se registró un nuevo usuario: ${formData.nombre} (${formData.rol})`);
                }
            }
            
            // Recargar lista
            const refresh = await fetch('/api/usuarios');
            const data = await refresh.json();
            const usuariosDB = data.filter((u: Usuario) => u.email !== 'admin@inamhi.gob.ec');
            setUsers([ADMIN_FIJO, ...usuariosDB]);
            
            setView('list');
        } catch (error) {
            console.error(error);
            showToast("Error de conexión", "error");
        }
    };


    const handleDelete = async (id: number) => {
        if(window.confirm("¿Confirmar eliminación del usuario?")) {
            try {
                // Buscamos el nombre antes de borrarlo para el historial
                const usuarioABorrar = users.find(u => u.id === id);
                const nombreBorrado = usuarioABorrar ? usuarioABorrar.nombre : 'Desconocido';

                await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
                
                setUsers(users.filter(u => u.id !== id));
                showToast("Usuario eliminado", "info");

                // AGREGAR ESTO:
                registrarHistorial('Eliminación', `Se eliminó permanentemente al usuario: ${nombreBorrado}`);

            } catch (error) {
                showToast("Error al eliminar", "error");
            }
        }
    };
    

    const openPassModal = (user: Usuario) => {
        setSelectedUserPass(user);
        setNewPassword('');
        setShowPassModal(true);
    };

    const saveNewPassword = async () => {
        if(!selectedUserPass) return;
        if(newPassword.length < 4) {
            showToast("Contraseña muy corta", "error");
            return;
        }
        try {
            const updatedUser = { ...selectedUserPass, password: newPassword };
            
            await fetch(`/api/usuarios/${selectedUserPass.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedUser)
            });

            const updated = users.map(u => u.id === selectedUserPass.id ? updatedUser : u);
            setUsers(updated);
            
            showToast(`Contraseña actualizada`);
            
            // AGREGAR ESTO:
            registrarHistorial('Edición', `Se cambió la contraseña del usuario: ${selectedUserPass.nombre}`);

            setShowPassModal(false);
        } catch (error) {
            showToast("Error al actualizar clave", "error");
        }
    };
    
    return (
        <div className="users-layout fade-in">
            
            {/* NOTIFICACIÓN */}
            <div className={`notification-toast ${notification.show ? 'visible' : ''} ${notification.type}`}>
                <div className="toast-icon">
                    {notification.type === 'success' ? <CheckCircle size={20}/> : <LayoutGrid size={20}/>}
                </div>
                <span>{notification.message}</span>
            </div>

            {/* VISTA: LISTA DE USUARIOS */}
            {view === 'list' && (
                <div className="view-container">
                    <header className="module-header">
                        <div>
                            <h1 className="page-title">DIRECTORIO DE USUARIOS</h1>
                            <p className="page-subtitle">Gestiona el acceso y roles del personal institucional</p>
                        </div>
                        <button className="btn-main-action" onClick={handleCreate}>
                            <Plus size={20} /> Nuevo Usuario
                        </button>
                    </header>

                    <div className="controls-bar">
                        <div className="search-wrapper">
                            <Search size={18} className="search-icon" />
                            <input 
                                type="text" 
                                placeholder="Buscar por nombre, cargo o email..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="counter-pill">
                            {users.length} Registros Activos
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '35%' }}>Colaborador</th>
                                    <th style={{ width: '15%' }}>Rol</th>
                                    <th style={{ width: '35%' }}>Área / Dirección</th>
                                    <th style={{ width: '15%' }} className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <div className="collab-info">
                                                <div className="avatar-initials">{u.nombre.charAt(0)}</div>
                                                <div>
                                                    <div className="collab-name">{u.nombre}</div>
                                                    <div className="collab-email">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{getRoleBadge(u.rol)}</td>
                                        <td><span className="area-text">{u.area}</span></td>
                                        <td>
                                            {/* OJO: Aquí ocultamos acciones para el Admin General */}
                                            {u.email !== 'admin@inamhi.gob.ec' && (
                                                <div className="actions-group">
                                                    <button onClick={() => handleEdit(u)} className="btn-icon edit" title="Editar"><Pencil size={18}/></button>
                                                    <button onClick={() => openPassModal(u)} className="btn-icon key" title="Contraseña"><Key size={18}/></button>
                                                    <button onClick={() => handleDelete(u.id)} className="btn-icon delete" title="Eliminar"><Trash2 size={18}/></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="empty-row">No se encontraron resultados</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* VISTA: FORMULARIO */}
            {view === 'form' && (
                <div className="form-center-wrapper fade-in-up">
                    <div className="form-box">
                        <div className="form-top-bar">
                            <button className="btn-back-circle" onClick={() => setView('list')} title="Volver">
                                <ArrowLeft size={24} />
                            </button>
                            <div className="form-headings">
                                <h2>{isEditing ? 'Editar Colaborador' : 'Registrar Colaborador'}</h2>
                                <p>Complete la ficha técnica para conceder acceso al sistema.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="smart-form">
                            <div className="form-row">
                                <div className="input-field-container">
                                    <label className="field-label">
                                        <User size={18} className="label-icon"/> Nombre Completo
                                    </label>
                                    <input 
                                        type="text" name="nombre" 
                                        required className="modern-input"
                                        value={formData.nombre || ''} 
                                        onChange={handleInputChange} 
                                        placeholder="Ej: Roberto Gomez"
                                    />
                                </div>
                                
                                <div className="input-field-container">
                                    <label className="field-label">
                                        <Mail size={18} className="label-icon"/> Correo Institucional
                                    </label>
                                    <input 
                                        type="email" name="email" 
                                        required className="modern-input"
                                        value={formData.email || ''} 
                                        onChange={handleInputChange} 
                                        placeholder="usuario@inamhi.gob.ec"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="input-field-container">
                                    <label className="field-label">
                                        <Shield size={18} className="label-icon"/> Rol de Acceso
                                    </label>
                                    <div className="select-wrapper">
                                        <select name="rol" required className="modern-select" value={formData.rol || ''} onChange={handleInputChange}>
                                            <option value="">Seleccione...</option>
                                            <option value="Técnico">Técnico</option>
                                            <option value="Contratado">Contratado</option>
                                            {/* OJO: Se eliminó la opción 'Administrador' para que no creen más admins */}
                                        </select>
                                        <ChevronRight size={18} className="select-arrow"/>
                                    </div>
                                </div>

                                <div className="input-field-container">
                                    <label className="field-label">
                                        <Briefcase size={18} className="label-icon"/> Dirección / Área
                                    </label>
                                    <div className="select-wrapper">
                                        <select name="area" required className="modern-select" value={formData.area || ''} onChange={handleInputChange}>
                                            <option value="">Seleccione...</option>
                                            {DIRECCIONES_INAMHI.map((dir, idx) => (
                                                <option key={idx} value={dir}>{dir}</option>
                                            ))}
                                        </select>
                                        <ChevronRight size={18} className="select-arrow"/>
                                    </div>
                                </div>
                            </div>
                            
                            {!isEditing && (
                                <div className="form-row full">
                                    <div className="input-field-container">
                                        <label className="field-label">
                                            <Key size={18} className="label-icon"/> Contraseña de Acceso
                                        </label>
                                        <input 
                                            type="text" name="password" 
                                            required className="modern-input"
                                            placeholder="Ingrese la clave para el usuario..."
                                            onChange={handleInputChange}
                                        />
                                        <span className="helper-text">Esta clave permitirá al usuario ingresar a su panel correspondiente.</span>
                                    </div>
                                </div>
                            )}

                            <div className="form-actions-bar">
                                <button type="button" className="btn-cancelar" onClick={() => setView('list')}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-guardar">
                                    <Save size={20}/> {isEditing ? 'Guardar Cambios' : 'Registrar Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL PASSWORD */}
            {showPassModal && selectedUserPass && (
                <div className="modal-overlay-blur fade-in">
                    <div className="modal-dialog scale-up">
                        <button className="modal-close-x" onClick={() => setShowPassModal(false)}><X size={20}/></button>
                        
                        <div className="modal-header-centered">
                            <div className="modal-icon-badge">
                                <Key size={32} />
                            </div>
                            <h3>Cambio de Credenciales</h3>
                            <p>Asignando nueva clave para: <br/><strong>{selectedUserPass.nombre}</strong></p>
                        </div>

                        <div className="modal-content-body">
                            <div className="input-field-container">
                                <label className="field-label" style={{justifyContent:'center'}}>Nueva Contraseña</label>
                                <input 
                                    type="text" 
                                    className="modern-input center-text"
                                    autoFocus 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)} 
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button className="btn-modal-primary" onClick={saveNewPassword}>
                            Actualizar Contraseña
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsuariosPage;
