import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// IMPORTANTE: Asegúrate de que esta ruta sea la correcta según tu estructura de carpetas
import encabezadoImg from '../assets/encabezado.png';

// Definimos la interfaz
interface TDR {
    id: number;
    numeroTDR: string;
    objetoContratacion: string;
    tipoProceso: string;
    direccionSolicitante: string;
    presupuesto: number;
    responsable: string;
    fechaInicio: string;
    fechaFin: string;
    fechaConformidad: string | null;
}

export const generarReportePDF = (tdrList: TDR[]) => {
    const doc = new jsPDF();

    // --- ENCABEZADO CON IMAGEN ---
    try {
        // Ajustamos la imagen: x=10, y=5, ancho=190, alto=30 (aprox tipo banner)
        doc.addImage(encabezadoImg, 'PNG', 10, 5, 190, 30);
    } catch (error) {
        console.error("Error al cargar la imagen del encabezado:", error);
    }

    // --- TÍTULO DEL REPORTE ---
    // Cambiamos color a Gris Oscuro (antes era blanco)
    doc.setTextColor(40, 40, 40); 
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    
    // Posicionamos el título DEBAJO de la imagen (Y = 45)
    doc.text("Reporte General de Procesos Contractuales (TDR)", 14, 45);

    // Fecha de emisión (Alineada a la derecha, misma altura Y=45)
    const fechaEmision = new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado: ${fechaEmision}`, 200, 45, { align: 'right' });

    // --- RESUMEN ESTADÍSTICO ---
    const total = tdrList.length;
    const finalizados = tdrList.filter(t => t.fechaConformidad).length;
    const ejecucion = total - finalizados;
    const presupuestoTotal = tdrList.reduce((acc, curr) => acc + Number(curr.presupuesto || 0), 0);

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    
    // Bajamos el resumen un poco más (Y = 55)
    doc.text("Resumen Ejecutivo:", 14, 55);

    doc.setFont("helvetica", "normal");
    doc.text(`• Total Procesos: ${total}`, 14, 61);
    doc.text(`• En Ejecución: ${ejecucion}`, 14, 66);
    doc.text(`• Finalizados: ${finalizados}`, 80, 61);
    doc.text(`• Presupuesto Total: $${presupuestoTotal.toFixed(2)}`, 80, 66);

    // --- CONFIGURACIÓN DE LA TABLA ---
    const tableColumn = [
        "Nro. TDR", 
        "Objeto / Descripción", 
        "Tipo Proceso",
        "Responsable", 
        "Presupuesto",
        "F. Fin", 
        "Estado"
    ];

    const tableRows: string[][] = [];

    tdrList.forEach(tdr => {
        const estado = tdr.fechaConformidad ? "FINALIZADO" : "EN EJECUCIÓN";
        
        const rowData = [
            String(tdr.numeroTDR || ''),
            String(tdr.objetoContratacion || ''),
            String(tdr.tipoProceso || 'N/A'),
            String(tdr.responsable || ''),
            `$${Number(tdr.presupuesto || 0).toFixed(2)}`,
            String(tdr.fechaFin || ''),
            estado
        ];
        
        tableRows.push(rowData);
    });

    // --- GENERAR LA TABLA ---
    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 75, // Bajamos el inicio de la tabla para dar espacio al nuevo encabezado
        theme: 'grid',
        styles: { 
            fontSize: 8, 
            cellPadding: 3,
            valign: 'middle',
            textColor: 50
        },
        headStyles: { 
            fillColor: [30, 41, 59], // Encabezado oscuro (#1E293B)
            textColor: 255, 
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 25 }, 
            1: { cellWidth: 'auto' }, 
            4: { halign: 'right' }, 
            6: { fontStyle: 'bold', halign: 'center', cellWidth: 25 } 
        },
        alternateRowStyles: { 
            fillColor: [241, 245, 249] 
        },
        // Pie de página con numeración
        didDrawPage: function (data) {
            const pageSize = doc.internal.pageSize;
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                `Página ${data.pageNumber}`, 
                data.settings.margin.left, 
                pageHeight - 10
            );
        }
    });

    // --- GUARDAR ARCHIVO ---
    const nombreArchivo = `Reporte_TDR_INAMHI_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nombreArchivo);
};
