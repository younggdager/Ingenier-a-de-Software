const mongoose = require('mongoose');

const ventaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  caja: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caja',
    required: true
  },
  productos: [{
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto',
      required: true
    },
    cantidad: {
      type: Number,
      required: true,
      min: 1
    },
    precioUnitario: {
      type: Number,
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    }
  }],
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  descuento: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    default: 0,
    min: 0
  },
  montoRecibido: {
    type: Number,
    min: 0
  },
  vuelto: {
    type: Number,
    default: 0,
    min: 0
  },
  tipoVenta: {
    type: String,
    enum: ['Contado', 'Credito'],
    default: 'Contado'
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: function() {
      return this.tipoVenta === 'Credito';
    }
  },
  estadoPago: {
    type: String,
    enum: ['Pagada', 'Pendiente'],
    default: 'Pagada'
  }
}, {
  timestamps: true
});

// Calcular totales y vuelto
ventaSchema.pre('save', function(next) {
  // Calcular subtotal de productos
  this.subtotal = this.productos.reduce((sum, item) => sum + item.subtotal, 0);
  
  // Calcular total
  this.total = this.subtotal - this.descuento;
  
  // Calcular vuelto si es venta al contado
  if (this.tipoVenta === 'Contado' && this.montoRecibido) {
    this.vuelto = this.montoRecibido - this.total;
  }
  
  // Si es a crédito, el estado es pendiente
  if (this.tipoVenta === 'Credito') {
    this.estadoPago = 'Pendiente';
  }
  
  next();
});

const Venta = mongoose.model('Venta', ventaSchema);

module.exports = Venta;