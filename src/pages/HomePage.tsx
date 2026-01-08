import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomeInamhi.css'; 
import logoInamhi from '../assets/lgo.png'; 

const HomePage: React.FC = () => {
    const currentYear: number = new Date().getFullYear();

    return (
        <div className="home-container">
            <div className="modern-card animate-pop-in">
                {/* Barra decorativa superior */}
                <div className="card-top-bar"></div>

                <div className="logo-section">
                    <img src={logoInamhi} alt="INAMHI" className="logo-main" />
                </div>

                <div className="content-section">
                    <span className="badge-pill">SISTEMA DE GESTIÓN</span>
                    
                    <h1 className="main-title">
                        Plataforma <span className="text-highlight">Institucional</span>
                    </h1>
                    <h2 className="sub-title">TDR y Contrataciones</h2>
                    
                    <p className="description">
                        Acceso centralizado para el registro de Términos de Referencia, 
                        control de servicios profesionales y repositorio digital.
                    </p>

                    <div className="action-box">
                        <Link to="/login" className="btn-start">
                            <span>INGRESAR AL SISTEMA</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
                            </svg>
                        </Link>
                    </div>
                </div>

                <div className="footer-info">
                    <p>&copy; {currentYear} INAMHI - Meteorología e Hidrología</p>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
