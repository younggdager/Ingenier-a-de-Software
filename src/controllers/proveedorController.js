const Proveedor = require('../models/Proveedor');

// @desc    Crear nuevo proveedor (RF-11)
// @route   POST /api/proveedores
// @access  Private
exports.crearProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedor.create(req.body);

    res.status(201).json({
      success: true,
      mensaje: 'Proveedor creado exitosamente',
      proveedor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al crear proveedor',
      error: error.message
    });
  }
};

// @desc    Obtener todos los proveedores
// @route   GET /api/proveedores
// @access  Private
exports.obtenerProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedor.find({ activo: true });

    res.status(200).json({
      success: true,
      cantidad: proveedores.length,
      proveedores
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener proveedores',
      error: error.message
    });
  }
};

// @desc    Obtener un proveedor por ID
// @route   GET /api/proveedores/:id
// @access  Private
exports.obtenerProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedor.findById(req.params.id);

    if (!proveedor) {
      return res.status(404).json({
        success: false,
        mensaje: 'Proveedor no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      proveedor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener proveedor',
      error: error.message
    });
  }
};

// @desc    Actualizar proveedor
// @route   PUT /api/proveedores/:id
// @access  Private
exports.actualizarProveedor = async (req, res) => {
  try {
    let proveedor = await Proveedor.findById(req.params.id);

    if (!proveedor) {
      return res.status(404).json({
        success: false,
        mensaje: 'Proveedor no encontrado'
      });
    }

    proveedor = await Proveedor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      mensaje: 'Proveedor actualizado exitosamente',
      proveedor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar proveedor',
      error: error.message
    });
  }
};

// @desc    Eliminar proveedor (desactivar)
// @route   DELETE /api/proveedores/:id
// @access  Private/Admin
exports.eliminarProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedor.findById(req.params.id);

    if (!proveedor) {
      return res.status(404).json({
        success: false,
        mensaje: 'Proveedor no encontrado'
      });
    }

    proveedor.activo = false;
    await proveedor.save();

    res.status(200).json({
      success: true,
      mensaje: 'Proveedor eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al eliminar proveedor',
      error: error.message
    });
  }
};
