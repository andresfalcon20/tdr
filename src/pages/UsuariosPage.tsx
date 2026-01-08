import { useState, useEffect } from 'react';
import {
    Plus, Search, Key, Trash2, ArrowLeft
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
    const [view, setView] = useState<'list' | 'create'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState<Partial<Usuario>>({});

    const [users, setUsers] = useState<Usuario[]>(() => {
        const saved = localStorage.getItem('sistema_usuarios');
        return saved ? JSON.parse(saved) : INITIAL_DATA;
    });

    useEffect(() => {
        localStorage.setItem('sistema_usuarios', JSON.stringify(users));
    }, [users]);

    // Filtrado
    const filteredUsers = users.filter(u =>
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.area.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Función para asignar color al avatar
    const getAvatarColor = (name: string) => {
        const firstLetter = name.charAt(0).toUpperCase();
        if (['A', 'E', 'I', 'O', 'U'].includes(firstLetter)) return 'avatar-blue';
        if (['B', 'C', 'D', 'F', 'G'].includes(firstLetter)) return 'avatar-green';
        if (['H', 'J', 'K', 'L', 'M'].includes(firstLetter)) return 'avatar-orange';
        return 'avatar-purple';
    };

    const getRoleBadge = (rol: string) => {
        if (rol === 'Administrador') return <span className="role-badge badge-admin">Admin</span>;
        if (rol === 'Técnico') return <span className="role-badge badge-tech">Técnico</span>;
        return <span className="role-badge badge-contract">Contratado</span>;
    };

    const handleSaveUser = (e: React.FormEvent) => {
        e.preventDefault();
        const newUser = { ...formData, id: Date.now() } as Usuario;
        setUsers([...users, newUser]);
        setView('list');
        setFormData({});
    };

    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de eliminar este usuario?')) {
            setUsers(users.filter(u => u.id !== id));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="page-container">

            {/* VISTA LISTA */}
            {view === 'list' && (
                <>
                    <header className="page-header">
                        <div>
                            <h1>Gestión de Usuarios</h1>
                            <p>Administra los roles y permisos del sistema.</p>
                        </div>
                        <button className="btn-primary" onClick={() => setView('create')}>
                            <Plus size={18} /> Nuevo Usuario
                        </button>   
                    </header>

                    <div className="search-container">
                        <div className="search-box">
                            <Search size={18} color="#A3AED0" />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Buscar usuario..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
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
                                        <td style={{ color: '#475569', fontSize: '0.9rem' }}>{u.area}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button className="action-btn btn-edit" title="Editar Contraseña">
                                                    <Key size={16} />
                                                </button>
                                                <button className="action-btn btn-delete" onClick={() => handleDelete(u.id)} title="Eliminar">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#A3AED0' }}>
                                            No se encontraron usuarios.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* VISTA CREAR */}
            {view === 'create' && (
                <div className="form-card">
                    <div className="form-header-row">


                        <button className="btn-secondary" onClick={() => setView('list')}>


                            <ArrowLeft size={18} /> Regresar
                        </button>

                        <div style={{
                            position: 'relative',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '40px',
                            minHeight: '30px'
                        }}>
                         
                            <div style={{
                                position: 'absolute',
                                left: '35%',          // Se mueve al centro del contenedor
                                transform: 'translateX(-50%)', // Se desplaza hacia atrás su propio ancho para centrarse perfecto
                                textAlign: 'center',
                                width: 'max-content',  // Evita que el contenedor sea más ancho de lo necesario
                                zIndex: 1,
                                pointerEvents: 'none'
                            }}>
                                <h2 style={{
                                    fontSize: '1.9rem',
                                    fontWeight: '700',
                                    color: '#011474ff',
                                    margin: 0,
                                    pointerEvents: 'auto'
                                }}>
                                    Nuevo Usuario
                                </h2>

                                <div style={{
                                    width: '150px',
                                    height: '4px',
                                    backgroundColor: '#4318FF',
                                    borderRadius: '10px',
                                    margin: '8px auto 0'
                                }}></div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSaveUser}>
                        <div className="form-grid">

                            <div className="input-group">
                                <label>Nombre Completo</label>
                                <input type="text" name="nombre" required onChange={handleInputChange} placeholder="Ingrese su nombre completo" />
                            </div>

                            <div className="input-group">
                                <label>Correo Institucional</label>
                                <input type="email" name="email" required onChange={handleInputChange} placeholder="usuario@inamhi.ec" />
                            </div>

                            <div className="input-group">
                                <label>Rol en el Sistema</label>
                                <select name="rol" required onChange={handleInputChange}>
                                    <option value="">Seleccione...</option>
                                    {/* SOLO TÉCNICO Y CONTRATADO */}
                                    <option value="Técnico">Técnico</option>
                                    <option value="Contratado">Contratado</option>
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Dirección / Área</label>
                                <select name="area" required onChange={handleInputChange}>
                                    <option value="">Seleccione...</option>
                                    {DIRECCIONES_INAMHI.map((dir, idx) => (
                                        <option key={idx} value={dir}>{dir}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group full-width">
                                <label>Contraseña Temporal</label>
                                <input type="text" name="password" placeholder="Ingrese contraseña..." onChange={handleInputChange} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn-primary">
                                Guardar Usuario
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default UsuariosPage;
