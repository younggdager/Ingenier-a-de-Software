const Venta = require('../models/Venta');
const Producto = require('../models/Producto');
const Factura = require('../models/Factura');
const Mantenimiento = require('../models/Mantenimiento');
const ExcelJS = require('exceljs');

// ========== REPORTES ==========

// @desc    Reporte de productos más/menos vendidos (RF-15)
// @route   GET /api/reportes/productos-vendidos
// @access  Private
exports.reporteProductosVendidos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, tipo = 'mas' } = req.query;

    let query = {};
    if (fechaInicio && fechaFin) {
      query.createdAt = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    const ventas = await Venta.find(query).populate('productos.producto');

    // Agrupar por producto
    const productosVendidos = {};

    ventas.forEach(venta => {
      venta.productos.forEach(item => {
        const productoId = item.producto._id.toString();
        if (!productosVendidos[productoId]) {
          productosVendidos[productoId] = {
            producto: item.producto,
            cantidadVendida: 0,
            totalIngresos: 0
          };
        }
        productosVendidos[productoId].cantidadVendida += item.cantidad;
        productosVendidos[productoId].totalIngresos += item.subtotal;
      });
    });

    // Convertir a array y ordenar
    let productos = Object.values(productosVendidos);
    productos.sort((a, b) => {
      return tipo === 'mas' 
        ? b.cantidadVendida - a.cantidadVendida 
        : a.cantidadVendida - b.cantidadVendida;
    });

    res.status(200).json({
      success: true,
      tipo: tipo === 'mas' ? 'Más vendidos' : 'Menos vendidos',
      cantidad: productos.length,
      productos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al generar reporte',
      error: error.message
    });
  }
};

// @desc    Reporte de ganancia real (RF-16)
// @route   GET /api/reportes/ganancia-real
// @access  Private/Admin
exports.reporteGananciaReal = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    let query = {};
    if (fechaInicio && fechaFin) {
      query.createdAt = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    // Obtener ventas
    const ventas = await Venta.find({
      ...query,
      tipoVenta: 'Contado',
      estadoPago: 'Pagada'
    });

    const totalVentas = ventas.reduce((sum, venta) => sum + venta.total, 0);

    // Obtener costos (facturas pagadas)
    const facturas = await Factura.find({
      ...query,
      estadoPago: 'Pagada'
    });

    const totalCostos = facturas.reduce((sum, factura) => sum + factura.total, 0);

    // Calcular ganancia neta
    const gananciaNeta = totalVentas - totalCostos;

    res.status(200).json({
      success: true,
      periodo: {
        fechaInicio: fechaInicio || 'Desde el inicio',
        fechaFin: fechaFin || 'Hasta ahora'
      },
      totalVentas,
      totalCostos,
      gananciaNeta,
      margenGanancia: totalVentas > 0 ? ((gananciaNeta / totalVentas) * 100).toFixed(2) + '%' : '0%'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al generar reporte de ganancia',
      error: error.message
    });
  }
};

// @desc    Exportación contable a Excel (RF-20)
// @route   GET /api/reportes/exportar-contable
// @access  Private/Admin
exports.exportarContable = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        mensaje: 'Debe proporcionar fechaInicio y fechaFin'
      });
    }

    const query = {
      createdAt: {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      }
    };

    // Obtener datos
    const ventas = await Venta.find({ ...query, estadoPago: 'Pagada' })
      .populate('productos.producto', 'nombre');
    
    const facturas = await Factura.find(query)
      .populate('proveedor', 'nombre');

    // Crear libro de Excel
    const workbook = new ExcelJS.Workbook();
    
    // Hoja de Ventas
    const ventasSheet = workbook.addWorksheet('Ventas');
    ventasSheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 20 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Productos', key: 'productos', width: 40 },
      { header: 'Total', key: 'total', width: 15 }
    ];

    ventas.forEach(venta => {
      const productos = venta.productos.map(p => 
        `${p.producto.nombre} (x${p.cantidad})`
      ).join(', ');

      ventasSheet.addRow({
        fecha: venta.createdAt.toLocaleDateString(),
        tipo: venta.tipoVenta,
        productos,
        total: venta.total
      });
    });

    // Hoja de Compras/Facturas
    const comprasSheet = workbook.addWorksheet('Compras');
    comprasSheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 20 },
      { header: 'Nº Factura', key: 'numeroFactura', width: 20 },
      { header: 'Proveedor', key: 'proveedor', width: 30 },
      { header: 'Total', key: 'total', width: 15 }
    ];

    facturas.forEach(factura => {
      comprasSheet.addRow({
        fecha: factura.fechaFactura.toLocaleDateString(),
        numeroFactura: factura.numeroFactura,
        proveedor: factura.proveedor.nombre,
        total: factura.total
      });
    });

    // Hoja de Resumen
    const resumenSheet = workbook.addWorksheet('Resumen');
    const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
    const totalCompras = facturas.reduce((sum, f) => sum + f.total, 0);
    const ganancia = totalVentas - totalCompras;

    resumenSheet.addRow(['Concepto', 'Monto']);
    resumenSheet.addRow(['Total Ventas', totalVentas]);
    resumenSheet.addRow(['Total Compras', totalCompras]);
    resumenSheet.addRow(['Ganancia Neta', ganancia]);

    // Generar archivo
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_contable_${Date.now()}.xlsx`);
    res.send(buffer);

  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al exportar datos contables',
      error: error.message
    });
  }
};

// ========== MANTENIMIENTO DE EQUIPOS (RF-19) ==========

// @desc    Registrar mantenimiento
// @route   POST /api/mantenimientos
// @access  Private
exports.registrarMantenimiento = async (req, res) => {
  try {
    const mantenimiento = await Mantenimiento.create({
      ...req.body,
      usuario: req.usuario.id
    });

    res.status(201).json({
      success: true,
      mensaje: 'Mantenimiento registrado exitosamente',
      mantenimiento
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al registrar mantenimiento',
      error: error.message
    });
  }
};

// @desc    Obtener historial de mantenimientos
// @route   GET /api/mantenimientos
// @access  Private
exports.obtenerMantenimientos = async (req, res) => {
  try {
    const { equipo } = req.query;

    let query = {};
    if (equipo) query.equipo = new RegExp(equipo, 'i');

    const mantenimientos = await Mantenimiento.find(query)
      .populate('usuario', 'nombre')
      .sort({ fechaMantenimiento: -1 });

    res.status(200).json({
      success: true,
      cantidad: mantenimientos.length,
      mantenimientos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener mantenimientos',
      error: error.message
    });
  }
};
