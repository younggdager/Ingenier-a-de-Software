const Producto = require('../models/Producto');

// @desc    Crear nuevo producto (RF-1)
// @route   POST /api/productos
// @access  Private
exports.crearProducto = async (req, res) => {
  try {
    const producto = await Producto.create(req.body);

    res.status(201).json({
      success: true,
      mensaje: 'Producto creado exitosamente',
      producto
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al crear producto',
      error: error.message
    });
  }
};

// @desc    Obtener todos los productos
// @route   GET /api/productos
// @access  Private
exports.obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.find({ activo: true }).populate('proveedor', 'nombre telefono');

    res.status(200).json({
      success: true,
      cantidad: productos.length,
      productos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener productos',
      error: error.message
    });
  }
};

// @desc    Obtener un producto por ID
// @route   GET /api/productos/:id
// @access  Private
exports.obtenerProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id).populate('proveedor');

    if (!producto) {
      return res.status(404).json({
        success: false,
        mensaje: 'Producto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      producto
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener producto',
      error: error.message
    });
  }
};

// @desc    Actualizar producto (RF-2)
// @route   PUT /api/productos/:id
// @access  Private
exports.actualizarProducto = async (req, res) => {
  try {
    let producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        mensaje: 'Producto no encontrado'
      });
    }

    // Actualizar campos del producto
    Object.assign(producto, req.body);
    
    // Guardar con .save() para que se ejecute el hook pre-save que calcula precioVenta
    await producto.save();

    res.status(200).json({
      success: true,
      mensaje: 'Producto actualizado exitosamente',
      producto
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar producto',
      error: error.message
    });
  }
};

// @desc    Actualizar stock (RF-3)
// @route   PUT /api/productos/:id/stock
// @access  Private
exports.actualizarStock = async (req, res) => {
  try {
    const { stockSala, stockBodega } = req.body;
    
    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        mensaje: 'Producto no encontrado'
      });
    }

    if (stockSala !== undefined) producto.stockSala = stockSala;
    if (stockBodega !== undefined) producto.stockBodega = stockBodega;

    await producto.save();

    res.status(200).json({
      success: true,
      mensaje: 'Stock actualizado exitosamente',
      producto
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al actualizar stock',
      error: error.message
    });
  }
};

// @desc    Obtener productos con stock bajo (RF-4)
// @route   GET /api/productos/alertas/stock-bajo
// @access  Private
exports.obtenerStockBajo = async (req, res) => {
  try {
    const productos = await Producto.find({ activo: true }).populate('proveedor', 'nombre telefono');

    const productosStockBajo = productos.filter(producto => {
      const stockTotal = producto.stockSala + producto.stockBodega;
      return stockTotal <= producto.stockMinimo;
    });

    res.status(200).json({
      success: true,
      cantidad: productosStockBajo.length,
      productos: productosStockBajo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener productos con stock bajo',
      error: error.message
    });
  }
};

// @desc    Obtener productos próximos a vencer (RF-5)
// @route   GET /api/productos/alertas/vencimiento
// @access  Private
exports.obtenerProximosVencer = async (req, res) => {
  try {
    const productos = await Producto.find({ 
      activo: true,
      esPerecible: true 
    }).populate('proveedor', 'nombre telefono');

    const productosProximosVencer = productos.filter(producto => 
      producto.verificarVencimientoProximo()
    );

    res.status(200).json({
      success: true,
      cantidad: productosProximosVencer.length,
      productos: productosProximosVencer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al obtener productos próximos a vencer',
      error: error.message
    });
  }
};

// @desc    Eliminar producto (desactivar)
// @route   DELETE /api/productos/:id
// @access  Private/Admin
exports.eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        mensaje: 'Producto no encontrado'
      });
    }

    producto.activo = false;
    await producto.save();

    res.status(200).json({
      success: true,
      mensaje: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al eliminar producto',
      error: error.message
    });
  }
};

// @desc    Transferir stock entre bodega y sala
// @route   POST /api/productos/:id/transferir
// @access  Private
exports.transferirStock = async (req, res) => {
  try {
    const { cantidad, origen, destino } = req.body;
    
    if (!cantidad || cantidad <= 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'La cantidad debe ser mayor a cero'
      });
    }

    if (!origen || !destino) {
      return res.status(400).json({
        success: false,
        mensaje: 'Debe especificar origen y destino (Sala o Bodega)'
      });
    }

    if (origen === destino) {
      return res.status(400).json({
        success: false,
        mensaje: 'El origen y destino no pueden ser iguales'
      });
    }

    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        mensaje: 'Producto no encontrado'
      });
    }

    // Validar stock disponible en origen
    const stockOrigen = origen === 'Sala' ? producto.stockSala : producto.stockBodega;
    
    if (stockOrigen < cantidad) {
      return res.status(400).json({
        success: false,
        mensaje: `Stock insuficiente en ${origen}. Disponible: ${stockOrigen}`
      });
    }

    // Realizar transferencia
    if (origen === 'Sala') {
      producto.stockSala -= cantidad;
      producto.stockBodega += cantidad;
    } else {
      producto.stockBodega -= cantidad;
      producto.stockSala += cantidad;
    }

    await producto.save();

    res.status(200).json({
      success: true,
      mensaje: `Transferencia exitosa: ${cantidad} unidades de ${origen} a ${destino}`,
      producto: {
        nombre: producto.nombre,
        stockSala: producto.stockSala,
        stockBodega: producto.stockBodega,
        stockTotal: producto.stockSala + producto.stockBodega
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al transferir stock',
      error: error.message
    });
  }
};