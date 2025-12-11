const Caja = require('../models/Caja');
const Venta = require('../models/Venta');

// @desc    Abrir caja (RF-7)
// @route   POST /api/caja/abrir
// @access  Private
exports.abrirCaja = async (req, res) => {
  try {
    const { montoInicial } = req.body;

    // Verificar si ya hay una caja abierta
    const cajaAbierta = await Caja.findOne({ 
      usuario: req.usuario.id, 
      estado: 'Abierta' 
    });

    if (cajaAbierta) {
      return res.status(400).json({
        success: false,
        mensaje: 'Ya tienes una caja abierta. Ciérrala antes de abrir una nueva'
      });
    }

    const caja = await Caja.create({
      usuario: req.usuario.id,
      montoInicial,
      estado: 'Abierta'
    });

    res.status(201).json({
      success: true,
      mensaje: 'Caja abierta exitosamente',
      caja
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al abrir caja',
      error: error.message
    });
  }
};

// @desc    Cerrar caja (RF-8)
// @route   PUT /api/caja/cerrar/:id
// @access  Private
exports.cerrarCaja = async (req, res) => {
  try {
    const { montoFinal } = req.body;

    const caja = await Caja.findById(req.params.id);

    if (!caja) {
      return res.status(404).json({
        success: false,
        mensaje: 'Caja no encontrada'
      });
    }

    if (caja.estado === 'Cerrada') {
      return res.status(400).json({
        success: false,
        mensaje: 'Esta caja ya está cerrada'
      });
    }

    // Calcular ventas totales del día
    const ventas = await Venta.find({ 
      caja: caja._id,
      tipoVenta: 'Contado',
      estadoPago: 'Pagada'
    });

    const ventasTotales = ventas.reduce((sum, venta) => sum + venta.total, 0);

    // Cerrar caja
    caja.fechaCierre = new Date();
    caja.montoFinal = montoFinal;
    caja.ventasTotales = ventasTotales;
    caja.gananciaDelDia = montoFinal - caja.montoInicial;
    caja.estado = 'Cerrada';

    await caja.save();

    res.status(200).json({
      success: true,
      mensaje: 'Caja cerrada exitosamente',
      caja
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al cerrar caja',
      error: error.message
    });
  }
};

// @desc    Obtener caja abierta actual
// @route   GET /api/caja/actual
// @access  Private
exports.obtenerCajaActual = async (req, res) => {
  try {
    const caja = await Caja.findOne({ 
      usuario: req.usuario.id, 
      estado: 'Abierta' 
    }).populate('usuario', 'nombre email');

    if (!caja) {
      return res.status(404).json({
        success: false,
        mensaje: 'No tienes una caja abierta'
      });
    }

    res.status(200).json({
      success: true,
      caja
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener caja actual',
      error: error.message
    });
  }
};

// @desc    Obtener historial de cajas
// @route   GET /api/caja/historial
// @access  Private
exports.obtenerHistorialCajas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    let query = {};

    if (fechaInicio && fechaFin) {
      query.fechaApertura = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    const cajas = await Caja.find(query)
      .populate('usuario', 'nombre email')
      .sort({ fechaApertura: -1 });

    res.status(200).json({
      success: true,
      cantidad: cajas.length,
      cajas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener historial de cajas',
      error: error.message
    });
  }
};
