const Cliente = require('../models/Cliente');
const Venta = require('../models/Venta');

// @desc    Crear nuevo cliente
// @route   POST /api/clientes
// @access  Private
exports.crearCliente = async (req, res) => {
  try {
    const cliente = await Cliente.create(req.body);

    res.status(201).json({
      success: true,
      mensaje: 'Cliente creado exitosamente',
      cliente
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al crear cliente',
      error: error.message
    });
  }
};

// @desc    Obtener todos los clientes
// @route   GET /api/clientes
// @access  Private
exports.obtenerClientes = async (req, res) => {
  try {
    const clientes = await Cliente.find({ activo: true });

    res.status(200).json({
      success: true,
      cantidad: clientes.length,
      clientes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener clientes',
      error: error.message
    });
  }
};

// @desc    Obtener un cliente por ID
// @route   GET /api/clientes/:id
// @access  Private
exports.obtenerCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        mensaje: 'Cliente no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      cliente
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener cliente',
      error: error.message
    });
  }
};

// @desc    Obtener deuda de cliente (RF-10)
// @route   GET /api/clientes/:id/deuda
// @access  Private
exports.obtenerDeudaCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        mensaje: 'Cliente no encontrado'
      });
    }

    // Obtener ventas pendientes
    const ventasPendientes = await Venta.find({
      cliente: cliente._id,
      tipoVenta: 'Credito',
      estadoPago: 'Pendiente'
    }).populate('productos.producto', 'nombre');

    res.status(200).json({
      success: true,
      cliente: {
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        deudaTotal: cliente.deudaTotal
      },
      ventasPendientes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener deuda del cliente',
      error: error.message
    });
  }
};

// @desc    Obtener clientes con deuda
// @route   GET /api/clientes/deuda/pendiente
// @access  Private
exports.obtenerClientesConDeuda = async (req, res) => {
  try {
    const clientes = await Cliente.find({ 
      activo: true,
      deudaTotal: { $gt: 0 }
    }).sort({ deudaTotal: -1 });

    res.status(200).json({
      success: true,
      cantidad: clientes.length,
      clientes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener clientes con deuda',
      error: error.message
    });
  }
};

// @desc    Actualizar cliente
// @route   PUT /api/clientes/:id
// @access  Private
exports.actualizarCliente = async (req, res) => {
  try {
    let cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        mensaje: 'Cliente no encontrado'
      });
    }

    cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      mensaje: 'Cliente actualizado exitosamente',
      cliente
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar cliente',
      error: error.message
    });
  }
};

// @desc    Eliminar cliente (desactivar)
// @route   DELETE /api/clientes/:id
// @access  Private/Admin
exports.eliminarCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        mensaje: 'Cliente no encontrado'
      });
    }

    if (cliente.deudaTotal > 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'No se puede eliminar un cliente con deuda pendiente'
      });
    }

    cliente.activo = false;
    await cliente.save();

    res.status(200).json({
      success: true,
      mensaje: 'Cliente eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al eliminar cliente',
      error: error.message
    });
  }
};

// @desc    Registrar abono a deuda de cliente
// @route   POST /api/clientes/:id/abono
// @access  Private
exports.registrarAbono = async (req, res) => {
  try {
    const { monto } = req.body;
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({
        success: false,
        mensaje: 'Cliente no encontrado'
      });
    }

    if (!monto || monto <= 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'El monto del abono debe ser mayor a cero'
      });
    }

    if (monto > cliente.deudaTotal) {
      return res.status(400).json({
        success: false,
        mensaje: `El monto del abono ($${monto}) no puede ser mayor a la deuda total ($${cliente.deudaTotal})`
      });
    }

    // Registrar el abono
    const deudaAnterior = cliente.deudaTotal;
    await cliente.registrarPago(monto);

    res.status(200).json({
      success: true,
      mensaje: 'Abono registrado exitosamente',
      cliente: {
        id: cliente._id,
        nombre: cliente.nombre,
        deudaAnterior,
        montoAbonado: monto,
        deudaActual: cliente.deudaTotal,
        saldada: cliente.deudaTotal === 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al registrar abono',
      error: error.message
    });
  }
};