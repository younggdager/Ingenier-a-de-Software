const Venta = require('../models/Venta');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const Caja = require('../models/Caja');

// @desc    Crear nueva venta (RF-6, RF-9)
// @route   POST /api/ventas
// @access  Private
exports.crearVenta = async (req, res) => {
  try {
    const { productos, tipoVenta, cliente, montoRecibido } = req.body;

    // Verificar que hay una caja abierta
    const cajaAbierta = await Caja.findOne({ 
      usuario: req.usuario.id, 
      estado: 'Abierta' 
    });

    if (!cajaAbierta) {
      return res.status(400).json({
        success: false,
        mensaje: 'Debes abrir una caja antes de realizar ventas'
      });
    }

    // Validar productos y calcular subtotales
    const productosVenta = [];
    let subtotalVenta = 0;

    for (const item of productos) {
      const producto = await Producto.findById(item.producto);

      if (!producto) {
        return res.status(404).json({
          success: false,
          mensaje: `Producto con ID ${item.producto} no encontrado`
        });
      }

      // Verificar stock total (sala + bodega)
      const stockTotal = producto.stockSala + producto.stockBodega;
      if (stockTotal < item.cantidad) {
        return res.status(400).json({
          success: false,
          mensaje: `Stock insuficiente para ${producto.nombre}. Stock disponible: ${stockTotal} (Sala: ${producto.stockSala}, Bodega: ${producto.stockBodega})`
        });
      }

      const subtotal = producto.precioVenta * item.cantidad;
      subtotalVenta += subtotal;

      productosVenta.push({
        producto: producto._id,
        cantidad: item.cantidad,
        precioUnitario: producto.precioVenta,
        subtotal
      });

      // Descontar stock (primero de sala, luego de bodega)
      let cantidadRestante = item.cantidad;
      
      if (producto.stockSala >= cantidadRestante) {
        // Si hay suficiente en sala, descontar todo de sala
        producto.stockSala -= cantidadRestante;
      } else {
        // Si no hay suficiente en sala, usar lo que hay y el resto de bodega
        cantidadRestante -= producto.stockSala;
        producto.stockSala = 0;
        producto.stockBodega -= cantidadRestante;
      }
      
      await producto.save();
    }

    // Si es venta a crédito, verificar cliente
    if (tipoVenta === 'Credito') {
      const clienteObj = await Cliente.findById(cliente);

      if (!clienteObj) {
        return res.status(404).json({
          success: false,
          mensaje: 'Cliente no encontrado'
        });
      }

      // Verificar límite de crédito
      if (!clienteObj.puedeComprarCredito(subtotalVenta)) {
        return res.status(400).json({
          success: false,
          mensaje: 'El cliente ha excedido su límite de crédito'
        });
      }

      // Actualizar deuda del cliente
      clienteObj.deudaTotal += subtotalVenta;
      await clienteObj.save();
    }

    // Crear venta
    const venta = await Venta.create({
      usuario: req.usuario.id,
      caja: cajaAbierta._id,
      productos: productosVenta,
      tipoVenta,
      cliente: tipoVenta === 'Credito' ? cliente : undefined,
      montoRecibido: tipoVenta === 'Contado' ? montoRecibido : undefined
    });

    await venta.populate([
      { path: 'productos.producto', select: 'nombre' },
      { path: 'cliente', select: 'nombre telefono' }
    ]);

    res.status(201).json({
      success: true,
      mensaje: 'Venta registrada exitosamente',
      venta
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al crear venta',
      error: error.message
    });
  }
};

// @desc    Obtener todas las ventas (RF-14)
// @route   GET /api/ventas
// @access  Private
exports.obtenerVentas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, tipoVenta } = req.query;

    let query = {};

    // Filtrar por fecha
    if (fechaInicio && fechaFin) {
      query.createdAt = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    // Filtrar por tipo de venta
    if (tipoVenta) {
      query.tipoVenta = tipoVenta;
    }

    const ventas = await Venta.find(query)
      .populate('usuario', 'nombre email')
      .populate('productos.producto', 'nombre')
      .populate('cliente', 'nombre telefono')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      cantidad: ventas.length,
      ventas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener ventas',
      error: error.message
    });
  }
};

// @desc    Obtener una venta por ID
// @route   GET /api/ventas/:id
// @access  Private
exports.obtenerVenta = async (req, res) => {
  try {
    const venta = await Venta.findById(req.params.id)
      .populate('usuario', 'nombre email')
      .populate('productos.producto', 'nombre')
      .populate('cliente', 'nombre telefono deudaTotal');

    if (!venta) {
      return res.status(404).json({
        success: false,
        mensaje: 'Venta no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      venta
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener venta',
      error: error.message
    });
  }
};

// @desc    Marcar venta a crédito como pagada
// @route   PUT /api/ventas/:id/pagar
// @access  Private
exports.pagarVentaCredito = async (req, res) => {
  try {
    const venta = await Venta.findById(req.params.id);

    if (!venta) {
      return res.status(404).json({
        success: false,
        mensaje: 'Venta no encontrada'
      });
    }

    if (venta.tipoVenta !== 'Credito') {
      return res.status(400).json({
        success: false,
        mensaje: 'Esta venta no es a crédito'
      });
    }

    if (venta.estadoPago === 'Pagada') {
      return res.status(400).json({
        success: false,
        mensaje: 'Esta venta ya fue pagada'
      });
    }

    // Actualizar deuda del cliente
    const cliente = await Cliente.findById(venta.cliente);
    cliente.deudaTotal -= venta.total;
    await cliente.save();

    // Actualizar venta
    venta.estadoPago = 'Pagada';
    await venta.save();

    res.status(200).json({
      success: true,
      mensaje: 'Venta marcada como pagada',
      venta
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al pagar venta',
      error: error.message
    });
  }
};
