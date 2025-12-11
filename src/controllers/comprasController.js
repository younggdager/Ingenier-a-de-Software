const OrdenCompra = require('../models/OrdenCompra');
const Factura = require('../models/Factura');

// ========== ÓRDENES DE COMPRA (RF-12) ==========

// @desc    Crear orden de compra
// @route   POST /api/ordenes
// @access  Private
exports.crearOrden = async (req, res) => {
  try {
    const orden = await OrdenCompra.create({
      ...req.body,
      usuario: req.usuario.id
    });

    await orden.populate('proveedor', 'nombre telefono');

    res.status(201).json({
      success: true,
      mensaje: 'Orden de compra creada exitosamente',
      orden
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al crear orden de compra',
      error: error.message
    });
  }
};

// @desc    Obtener órdenes de compra
// @route   GET /api/ordenes
// @access  Private
exports.obtenerOrdenes = async (req, res) => {
  try {
    const { estado, proveedor } = req.query;

    let query = {};
    if (estado) query.estado = estado;
    if (proveedor) query.proveedor = proveedor;

    const ordenes = await OrdenCompra.find(query)
      .populate('proveedor', 'nombre telefono')
      .populate('usuario', 'nombre')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      cantidad: ordenes.length,
      ordenes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener órdenes de compra',
      error: error.message
    });
  }
};

// @desc    Actualizar estado de orden
// @route   PUT /api/ordenes/:id
// @access  Private
exports.actualizarOrden = async (req, res) => {
  try {
    const orden = await OrdenCompra.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('proveedor', 'nombre telefono');

    if (!orden) {
      return res.status(404).json({
        success: false,
        mensaje: 'Orden no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      mensaje: 'Orden actualizada exitosamente',
      orden
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar orden',
      error: error.message
    });
  }
};

// ========== FACTURAS (RF-13) ==========

// @desc    Crear factura y actualizar stock
// @route   POST /api/compras/facturas
// @access  Private
exports.crearFactura = async (req, res) => {
  try {
    // Crear factura
    const factura = await Factura.create({
      ...req.body,
      usuario: req.usuario.id
    });

    // Actualizar stock de productos si la factura incluye productos registrados
    if (factura.productos && factura.productos.length > 0) {
      const Producto = require('../models/Producto');
      
      for (const item of factura.productos) {
        if (item.producto) {
          const producto = await Producto.findById(item.producto);
          if (producto) {
            // Agregar al stock de bodega (asumiendo que las compras van a bodega)
            producto.stockBodega += item.cantidad;
            await producto.save();
          }
        }
      }
    }

    await factura.populate([
      { path: 'proveedor', select: 'nombre telefono' },
      { path: 'ordenCompra' },
      { path: 'productos.producto', select: 'nombre' }
    ]);

    res.status(201).json({
      success: true,
      mensaje: 'Factura creada exitosamente y stock actualizado',
      factura
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al crear factura',
      error: error.message
    });
  }
};

// @desc    Obtener facturas
// @route   GET /api/facturas
// @access  Private
exports.obtenerFacturas = async (req, res) => {
  try {
    const { proveedor, estadoPago, fechaInicio, fechaFin } = req.query;

    let query = {};
    if (proveedor) query.proveedor = proveedor;
    if (estadoPago) query.estadoPago = estadoPago;

    if (fechaInicio && fechaFin) {
      query.fechaFactura = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    const facturas = await Factura.find(query)
      .populate('proveedor', 'nombre telefono')
      .populate('usuario', 'nombre')
      .sort({ fechaFactura: -1 });

    res.status(200).json({
      success: true,
      cantidad: facturas.length,
      facturas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener facturas',
      error: error.message
    });
  }
};

// @desc    Obtener factura por ID
// @route   GET /api/facturas/:id
// @access  Private
exports.obtenerFactura = async (req, res) => {
  try {
    const factura = await Factura.findById(req.params.id)
      .populate('proveedor', 'nombre telefono email')
      .populate('ordenCompra')
      .populate('usuario', 'nombre');

    if (!factura) {
      return res.status(404).json({
        success: false,
        mensaje: 'Factura no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      factura
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener factura',
      error: error.message
    });
  }
};

// @desc    Actualizar factura
// @route   PUT /api/facturas/:id
// @access  Private
exports.actualizarFactura = async (req, res) => {
  try {
    const factura = await Factura.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('proveedor', 'nombre telefono');

    if (!factura) {
      return res.status(404).json({
        success: false,
        mensaje: 'Factura no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      mensaje: 'Factura actualizada exitosamente',
      factura
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar factura',
      error: error.message
    });
  }
};