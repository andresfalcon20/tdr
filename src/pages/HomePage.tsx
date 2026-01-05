import { Link } from 'react-router-dom';
import '../styles/HomeInamhi.css'; 
import logoInamhi from '../assets/lgo.png'; 

const HomePage = () => {
    const currentYear = new Date().getFullYear();

    return (
        <div className="home-container">
            {/* Fondo Espacial (La Tierra de noche) */}
            <div className="earth-bg"></div>
                
            {/* Tarjeta de Cristal Oscuro */}
            <div className="glass-panel animate-fade-in">
                
                {/* Logo SIN burbuja (Limpio) */}
                <div className="logo-section">
                    <img src={logoInamhi} alt="INAMHI" className="logo-raw" />
                </div>

                {/* Contenido */}
                <div className="content-section">
                    <h2 className="subtitle">SISTEMA DE REGISTRO Y CONTROL</h2>
                    
                    <h1 className="main-title">
                        Plataforma Institucional <br />
                        <span className="highlight-text">TDR y Contrataciones</span>
                    </h1>
                    
                    <p className="description">
                        Bienvenido a la plataforma centralizada para la gestión de Términos de Referencia, 
                        seguimiento de servicios profesionales y documentación técnica.
                    </p>

                    {/* Botón Azul (Estilo Login) */}
                    <div className="action-box">
                        <Link to="/login" className="btn-blue-glow">
                            INGRESAR AL SISTEMA
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                        </Link>
                    </div>
                </div>

                <div className="footer-copyright">
                    <p>&copy; {currentYear} INAMHI - Meteorología e Hidrología</p>
                </div>
            </div>
        </div>
    );
};

export default HomePage;