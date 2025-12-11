const Mantenimiento = require('../models/Mantenimiento');

// @desc    Crear registro de mantenimiento
// @route   POST /api/mantenimiento
// @access  Private
exports.crearMantenimiento = async (req, res) => {
  try {
    const mantenimiento = await Mantenimiento.create({
      ...req.body,
      usuario: req.usuario.id
    });

    await mantenimiento.populate('usuario', 'nombre');

    res.status(201).json({
      success: true,
      mensaje: 'Registro de mantenimiento creado exitosamente',
      mantenimiento
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al crear registro de mantenimiento',
      error: error.message
    });
  }
};

// @desc    Obtener registros de mantenimiento
// @route   GET /api/mantenimiento
// @access  Private
exports.obtenerMantenimientos = async (req, res) => {
  try {
    const { estado, tipoEquipo, tipoMantenimiento, fechaInicio, fechaFin } = req.query;

    let query = { activo: true };

    if (estado) query.estado = estado;
    if (tipoEquipo) query.tipoEquipo = tipoEquipo;
    if (tipoMantenimiento) query.tipoMantenimiento = tipoMantenimiento;

    if (fechaInicio && fechaFin) {
      query.fechaMantenimiento = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

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
      mensaje: 'Error al obtener registros',
      error: error.message
    });
  }
};

// @desc    Obtener mantenimiento por ID
// @route   GET /api/mantenimiento/:id
// @access  Private
exports.obtenerMantenimiento = async (req, res) => {
  try {
    const mantenimiento = await Mantenimiento.findById(req.params.id)
      .populate('usuario', 'nombre email');

    if (!mantenimiento) {
      return res.status(404).json({
        success: false,
        mensaje: 'Registro de mantenimiento no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      mantenimiento
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener registro',
      error: error.message
    });
  }
};

// @desc    Actualizar mantenimiento
// @route   PUT /api/mantenimiento/:id
// @access  Private
exports.actualizarMantenimiento = async (req, res) => {
  try {
    let mantenimiento = await Mantenimiento.findById(req.params.id);

    if (!mantenimiento) {
      return res.status(404).json({
        success: false,
        mensaje: 'Registro de mantenimiento no encontrado'
      });
    }

    mantenimiento = await Mantenimiento.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('usuario', 'nombre');

    res.status(200).json({
      success: true,
      mensaje: 'Registro actualizado exitosamente',
      mantenimiento
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar registro',
      error: error.message
    });
  }
};

// @desc    Eliminar mantenimiento (soft delete)
// @route   DELETE /api/mantenimiento/:id
// @access  Private (Admin)
exports.eliminarMantenimiento = async (req, res) => {
  try {
    const mantenimiento = await Mantenimiento.findById(req.params.id);

    if (!mantenimiento) {
      return res.status(404).json({
        success: false,
        mensaje: 'Registro de mantenimiento no encontrado'
      });
    }

    mantenimiento.activo = false;
    await mantenimiento.save();

    res.status(200).json({
      success: true,
      mensaje: 'Registro eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al eliminar registro',
      error: error.message
    });
  }
};

// @desc    Obtener mantenimientos próximos (alertas)
// @route   GET /api/mantenimiento/alertas/proximos
// @access  Private
exports.obtenerProximos = async (req, res) => {
  try {
    const hoy = new Date();
    const enTreintaDias = new Date();
    enTreintaDias.setDate(enTreintaDias.getDate() + 30);

    const mantenimientos = await Mantenimiento.find({
      activo: true,
      proximoMantenimiento: {
        $gte: hoy,
        $lte: enTreintaDias
      }
    })
      .populate('usuario', 'nombre')
      .sort({ proximoMantenimiento: 1 });

    res.status(200).json({
      success: true,
      cantidad: mantenimientos.length,
      mantenimientos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener mantenimientos próximos',
      error: error.message
    });
  }
};

// @desc    Obtener estadísticas de mantenimiento
// @route   GET /api/mantenimiento/estadisticas
// @access  Private
exports.obtenerEstadisticas = async (req, res) => {
  try {
    const total = await Mantenimiento.countDocuments({ activo: true });
    const pendientes = await Mantenimiento.countDocuments({ activo: true, estado: 'Pendiente' });
    const enProceso = await Mantenimiento.countDocuments({ activo: true, estado: 'En Proceso' });
    const completados = await Mantenimiento.countDocuments({ activo: true, estado: 'Completado' });

    const porTipo = await Mantenimiento.aggregate([
      { $match: { activo: true } },
      { $group: { _id: '$tipoMantenimiento', cantidad: { $sum: 1 } } }
    ]);

    const porEquipo = await Mantenimiento.aggregate([
      { $match: { activo: true } },
      { $group: { _id: '$tipoEquipo', cantidad: { $sum: 1 } } }
    ]);

    const costoTotal = await Mantenimiento.aggregate([
      { $match: { activo: true, estado: 'Completado' } },
      { $group: { _id: null, total: { $sum: '$costo' } } }
    ]);

    res.status(200).json({
      success: true,
      estadisticas: {
        total,
        porEstado: {
          pendientes,
          enProceso,
          completados
        },
        porTipo,
        porEquipo,
        costoTotal: costoTotal.length > 0 ? costoTotal[0].total : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};
