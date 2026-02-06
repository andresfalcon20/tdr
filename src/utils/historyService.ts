// src/utils/historyService.ts

export const registrarHistorialGlobal = (
    accion: 'Creación' | 'Edición' | 'Eliminación' | 'Sistema', 
    entidad: 'Usuario' | 'Contrato' | 'TDR' | 'Sistema', 
    detalle: string, 
    usuario: string
) => {
    // 1. Obtener historial actual
    const historialActual = JSON.parse(localStorage.getItem('sistema_historial') || '[]');
    
    // 2. Crear el nuevo registro
    const nuevoLog = {
        id: new Date().getTime(),
        accion,
        entidad,
        detalle,
        fecha: new Date().toISOString(),
        usuario: usuario
    };

    // 3. Guardar todo de nuevo (el nuevo va primero)
    localStorage.setItem('sistema_historial', JSON.stringify([nuevoLog, ...historialActual]));
};
