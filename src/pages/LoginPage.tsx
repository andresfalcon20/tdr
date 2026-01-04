import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginInamhi.css'; 
import logoInamhi from '../assets/lgo.png';

// --- ICONOS ---
const AdminIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l8 4v6c0 5.5-3.8 10.7-8 12-4.2-1.3-8-6.5-8-12V6l8-4z"/><path d="M12 22V6"/></svg>
);
const TechIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
);
const ExternalIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
);

type Role = 'admin' | 'tecnico' | 'externo';

// Interfaz para leer los usuarios guardados
interface StoredUser {
    id: number;
    nombre: string;
    email: string;
    rol: 'Administrador' | 'Técnico' | 'Contratado';
    area: string;
}

const LoginPage = () => {
    const [role, setRole] = useState<Role>('admin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        setTimeout(() => {
            let loginExitoso = false;
            let rutaDestino = '/';
            let nombreUsuario = '';

            // 1. LÓGICA PARA ADMINISTRADOR (QUEMADO)
            if (role === 'admin') {
                if (email === "admin@inamhi.gob.ec" && password === "admin") {
                    loginExitoso = true;
                    rutaDestino = '/admin'; // Ruta del Dashboard Admin
                    nombreUsuario = 'Administrador General';
                } else {
                    setError('Credenciales de Admin incorrectas');
                }
            } 
            
            // 2. LÓGICA PARA TÉCNICOS Y EXTERNOS (BUSCAR EN LOCALSTORAGE)
            else {
                // Recuperar usuarios creados
                const storedUsersStr = localStorage.getItem('sistema_usuarios');
                const storedUsers: StoredUser[] = storedUsersStr ? JSON.parse(storedUsersStr) : [];

                // Definir qué rol buscamos en la base de datos según la pestaña activa
                const rolBuscado = role === 'tecnico' ? 'Técnico' : 'Contratado';

                // Buscar el usuario por email y rol
                const userFound = storedUsers.find(u => 
                    u.email.toLowerCase() === email.toLowerCase() && 
                    u.rol === rolBuscado
                );

                if (userFound) {
                    // AQUÍ VALIDAMOS LA CONTRASEÑA
                    // Nota: Como en UsuariosPage la contraseña es temporal y no se guarda,
                    // aceptamos cualquier contraseña que no esté vacía para simular el acceso.
                    if (password.length > 0) {
                        loginExitoso = true;
                        nombreUsuario = userFound.nombre;
                        
                        // DEFINIR RUTAS DE DESTINO
                        if (role === 'tecnico') {
                            rutaDestino = '/tecnico'; // <--- RUTA A TecnicoPage.tsx
                        } else {
                            rutaDestino = '/external-dashboard'; // Futura ruta para externos
                        }
                    } else {
                        setError('Ingrese su contraseña');
                    }
                } else {
                    setError(`Usuario no encontrado o no tiene el rol de ${rolBuscado}`);
                }
            }

            // --- RESULTADO FINAL ---
            if (loginExitoso && !error) {
                // Guardar sesión
                localStorage.setItem('token', `TOKEN-${role.toUpperCase()}-${Date.now()}`);
                localStorage.setItem('role', role);
                localStorage.setItem('userName', nombreUsuario); // Guardamos el nombre para mostrarlo luego
                
                navigate(rutaDestino);
            } else if (!error) {
                // Si no hubo error específico pero falló (caso raro fallback)
                setError('Error de autenticación');
                setLoading(false);
            } else {
                setLoading(false);
            }

        }, 800);
    };

    const handleRoleChange = (newRole: Role) => {
        setRole(newRole);
        setError('');
        setEmail('');
        setPassword('');
    };

    return (
        <div className={`login-wrapper ${role}`}>
            <div className="glass-container animate-fade-in">
                
                <div className="brand-section">
                    <div className="logo-clean">
                        <img src={logoInamhi} alt="INAMHI Logo" />
                    </div>
                    <h1 className='front'>INICIA SESIÓN</h1>
                </div>

                {/* Selector de Roles */}
                <div className="role-switcher">
                    <button 
                        type="button"
                        className={`role-btn ${role === 'admin' ? 'active' : ''}`}
                        onClick={() => handleRoleChange('admin')} 
                    >
                        <AdminIcon /> <span>Administrador</span>
                    </button>
                    <button 
                        type="button"
                        className={`role-btn ${role === 'tecnico' ? 'active' : ''}`}
                        onClick={() => handleRoleChange('tecnico')}
                    >
                        <TechIcon /> <span>Técnico</span>
                    </button>
                    <button 
                        type="button"
                        className={`role-btn ${role === 'externo' ? 'active' : ''}`}
                        onClick={() => handleRoleChange('externo')}
                    >
                        <ExternalIcon /> <span>Contratado</span>
                    </button>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <input 
                            type="text" 
                            required 
                            placeholder=" " 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <label>Correo electrónico</label>
                    </div>

                    <div className="input-group">
                        <input 
                            type="password" 
                            required 
                            placeholder=" " 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <label>Contraseña</label>
                    </div>

                    {error && <div className="error-message">⚠️ {error}</div>}

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Verificando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="footer-links">
                    <span>INAMHI &copy; 2026</span>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
