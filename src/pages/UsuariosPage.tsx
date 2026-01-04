import { useState, useEffect } from 'react';
import { 
    Plus, Search, Key, Trash2, Mail, Shield, User, ArrowLeft 
} from 'lucide-react';
import '../styles/TdrStyles.css'; 

interface Usuario {
    id: number;
    nombre: string;
    email: string;
    rol: 'Administrador' | 'Técnico' | 'Contratado';
    area: string;
}

// SOLO EL ADMIN QUEMADO POR DEFECTO
const INITIAL_ADMIN: Usuario[] = [
    { id: 1, nombre: 'Admin General', email: 'admin@inamhi.ec', rol: 'Administrador', area: 'Gerencia' },
];

const UsuariosPage = () => {
    const [view, setView] = useState<'list' | 'create'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState<Partial<Usuario>>({});

    // 1. CARGAR DATOS: Si hay en LocalStorage usa eso, si no, usa el ADMIN por defecto
    const [users, setUsers] = useState<Usuario[]>(() => {
        const savedUsers = localStorage.getItem('sistema_usuarios');
        return savedUsers ? JSON.parse(savedUsers) : INITIAL_ADMIN;
    });

    // 2. GUARDAR DATOS: Cada vez que 'users' cambie, se guarda en LocalStorage
    useEffect(() => {
        localStorage.setItem('sistema_usuarios', JSON.stringify(users));
    }, [users]);

    const filteredUsers = users.filter(u => 
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.area.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (rol: string) => {
        let className = 'badge-role ';
        if (rol === 'Administrador') className += 'role-admin';
        else if (rol === 'Técnico') className += 'role-tech';
        else className += 'role-contract';
        
        return <span className={className}>{rol}</span>;
    };

    const handleSaveUser = (e: React.FormEvent) => {
        e.preventDefault();
        const newUser = { ...formData, id: Date.now() } as Usuario;
        setUsers([...users, newUser]);
        alert("Usuario guardado localmente");
        setView('list');
        setFormData({});
    };

    // Función para resetear a solo Admin (Opcional, útil para desarrollo)
    const handleResetDB = () => {
        if(confirm("¿Borrar todos los usuarios creados y dejar solo al Admin?")) {
            setUsers(INITIAL_ADMIN);
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="tdr-container">
            <div className="space-background"></div>

            {/* --- VISTA LISTA --- */}
            {view === 'list' && (
                <div className="tdr-dashboard tdr-fade-in">
                    <header className="dashboard-header">
                        <div>
                            <h1>Gestión de Usuarios</h1>
                            <p>Administración de roles y accesos al sistema</p>
                        </div>
                        <div style={{display:'flex', gap:'10px'}}>
                            <button className="btn-secondary" onClick={handleResetDB} style={{fontSize:'0.8rem'}}>
                                <Trash2 size={14}/> Reiniciar DB
                            </button>
                            <button className="btn-primary" onClick={() => setView('create')}>
                                <Plus size={18} /> Crear Usuario
                            </button>
                        </div>
                    </header>

                    <div className="search-bar">
                        <span className="search-icon-wrapper"><Search size={18} /></span>
                        <input 
                            type="text" 
                            placeholder="Buscar por Nombre, Email o Área..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="glass-panel">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Área</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(u => (
                                    <tr key={u.id}>
                                        <td className="highlight-text">
                                            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                                <User size={16} /> {u.nombre}
                                            </div>
                                        </td>
                                        <td>{u.email}</td>
                                        <td>{getRoleBadge(u.rol)}</td>
                                        <td>{u.area}</td>
                                        <td>
                                            <div style={{display: 'flex', gap: '8px'}}>
                                                <button className="btn-icon" title="Resetear Clave">
                                                    <Key size={16} />
                                                </button>
                                                {u.rol !== 'Administrador' && (
                                                    <button 
                                                        className="btn-icon" 
                                                        title="Eliminar" 
                                                        style={{color: '#ef4444'}}
                                                        onClick={() => {
                                                            if(confirm('¿Eliminar usuario?')) {
                                                                setUsers(users.filter(user => user.id !== u.id));
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- VISTA FORMULARIO --- */}
            {view === 'create' && (
                <div className="tdr-form-container glass-panel tdr-fade-in" style={{ maxWidth: '550px' }}>
                    <div className="form-header" style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                        <button 
                            className="btn-back" 
                            onClick={() => setView('list')} 
                            style={{ position: 'absolute', left: 0 }}
                        >
                            <ArrowLeft size={20} /> Volver
                        </button>
                        <h2 style={{ margin: 0 }}>NUEVO USUARIO</h2>
                    </div>

                    <form onSubmit={handleSaveUser} className="main-form">
                        <div className="form-section tdr-slide">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="input-block">
                                    <label style={{ textAlign: 'left', width: '100%' }}>Nombre Completo</label>
                                    <div className="input-with-icon">
                                        <div className="icon-prefix"><User size={16} /></div>
                                        <input type="text" name="nombre" required onChange={handleInputChange} />
                                    </div>
                                </div>
                                <div className="input-block">
                                    <label style={{ textAlign: 'left', width: '100%' }}>Correo Electrónico</label>
                                    <div className="input-with-icon">
                                        <div className="icon-prefix"><Mail size={16} /></div>
                                        <input type="email" name="email" required onChange={handleInputChange} />
                                    </div>
                                </div>
                                <div className="input-block">
                                    <label style={{ textAlign: 'left', width: '100%' }}>Rol en el Sistema</label>
                                    <div className="input-with-icon">
                                        <div className="icon-prefix"><Shield size={16} /></div>
                                        <select name="rol" onChange={handleInputChange} required>
                                            <option value="">Seleccione Rol...</option>
                                            <option value="Técnico">Técnico</option>
                                            <option value="Contratado">Contratado</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="input-block">
                                    <label style={{ textAlign: 'left', width: '100%' }}>Área / Dirección</label>
                                    <select name="area" onChange={handleInputChange} required style={{ paddingLeft: '15px' }}>
                                        <option value="">Seleccione Área...</option>
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
                                <div className="input-block">
                                    <label style={{ textAlign: 'left', width: '100%' }}>Contraseña Temporal</label>
                                    <div className="input-with-icon">
                                        <div className="icon-prefix"><Key size={16} /></div>
                                        <input type="password" placeholder="••••••••" />
                                    </div>
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn-primary-large" style={{ marginTop: '30px' }}>
                                    CREAR USUARIO
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default UsuariosPage;
