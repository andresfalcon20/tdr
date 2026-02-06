// server/index.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer'); // Para subir archivos (luego lo configuramos a fondo)
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// CONFIGURACIÓN DE BASE DE DATOS
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: 'root', // <--- CAMBIA ESTO
    database: 'sistema_inamhi'
});

db.connect(err => {
    if (err) console.error('Error DB:', err);
    else console.log('Conectado a MySQL sistema_inamhi');
});

// --- RUTAS DE API ---

// 1. LOGIN (Reemplaza la lógica de LoginPage)
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM usuarios WHERE email = ? AND password = ?';
    
    db.query(sql, [email, password], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.length > 0) {
            res.json({ success: true, user: result[0] });
        } else {
            res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }
    });
});

// 2. USUARIOS (Reemplaza UsuariosPage)
app.get('/api/usuarios', (req, res) => {
    db.query('SELECT * FROM usuarios', (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

app.post('/api/usuarios', (req, res) => {
    const { nombre, email, rol, area, password } = req.body;
    const sql = 'INSERT INTO usuarios (nombre, email, rol, area, password) VALUES (?,?,?,?,?)';
    db.query(sql, [nombre, email, rol, area, password], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ id: result.insertId, ...req.body });
    });
});

app.put('/api/usuarios/:id', (req, res) => {
    const { nombre, email, rol, area, password } = req.body;
    const sql = 'UPDATE usuarios SET nombre=?, email=?, rol=?, area=?, password=? WHERE id=?';
    db.query(sql, [nombre, email, rol, area, password, req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

app.delete('/api/usuarios/:id', (req, res) => {
    db.query('DELETE FROM usuarios WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// 3. CONTRATOS (Reemplaza ContratosPage)
app.get('/api/contratos', (req, res) => {
    db.query('SELECT * FROM contratos', (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

app.post('/api/contratos', (req, res) => {
    const { numeroContrato, nombreProfesional, direccion, adminContrato, fechaInicio, fechaFin } = req.body;
    const sql = 'INSERT INTO contratos (numero_contrato, nombre_profesional, direccion, admin_contrato, fecha_inicio, fecha_fin) VALUES (?,?,?,?,?,?)';
    db.query(sql, [numeroContrato, nombreProfesional, direccion, adminContrato, fechaInicio, fechaFin], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ id: result.insertId });
    });
});

app.put('/api/contratos/:id', (req, res) => {
    const { numeroContrato, nombreProfesional, direccion, adminContrato, fechaInicio, fechaFin } = req.body;
    const sql = 'UPDATE contratos SET numero_contrato=?, nombre_profesional=?, direccion=?, admin_contrato=?, fecha_inicio=?, fecha_fin=? WHERE id=?';
    db.query(sql, [numeroContrato, nombreProfesional, direccion, adminContrato, fechaInicio, fechaFin, req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

app.delete('/api/contratos/:id', (req, res) => {
    db.query('DELETE FROM contratos WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// 4. HISTORIAL
app.get('/api/historial', (req, res) => {
    db.query('SELECT * FROM historial ORDER BY fecha DESC', (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

app.post('/api/historial', (req, res) => {
    const { accion, entidad, detalle, usuario } = req.body;
    const sql = 'INSERT INTO historial (accion, entidad, detalle, usuario) VALUES (?,?,?,?)';
    db.query(sql, [accion, entidad, detalle, usuario], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// --- AGREGAR ESTO EN server/index.js ---

// RUTA ESPECÍFICA PARA TDRs
app.get('/api/tdr', (req, res) => {
    // Traemos los TDRs ordenados por fecha
    db.query('SELECT * FROM tdr ORDER BY created_at DESC', (err, result) => {
        if (err) return res.status(500).send(err);
        
        // Truco: Convertimos los campos que sean necesarios (si usas JSON en un futuro)
        // Por ahora enviamos la lista plana
        res.json(result);
    });
});

app.post('/api/tdr', (req, res) => {
    const { numeroTDR, objetoContratacion, tipoProceso, direccionSolicitante, presupuesto, responsable, fechaInicio, fechaFin, duracionCantidad, duracionUnidad } = req.body;
    
    const sql = `INSERT INTO tdr (numero_tdr, objeto_contratacion, tipo_proceso, direccion_solicitante, presupuesto, responsable, fecha_inicio, fecha_fin, duracion_cantidad, duracion_unidad) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                 
    db.query(sql, [numeroTDR, objetoContratacion, tipoProceso, direccionSolicitante, presupuesto, responsable, fechaInicio, fechaFin, duracionCantidad, duracionUnidad], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al guardar TDR');
        }
        res.json({ id: result.insertId, message: 'TDR Creado' });
    });
});

// ACTUALIZAR TDR
app.put('/api/tdr/:id', (req, res) => {
    const { objetoContratacion, responsable, fechaFin } = req.body; // Agrega aquí el resto de campos si quieres editar todo
    const sql = 'UPDATE tdr SET objeto_contratacion=?, responsable=?, fecha_fin=? WHERE id=?';
    
    db.query(sql, [objetoContratacion, responsable, fechaFin, req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

// ELIMINAR TDR
app.delete('/api/tdr/:id', (req, res) => {
    db.query('DELETE FROM tdr WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ success: true });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Backend corriendo en puerto ${PORT}`);
});
