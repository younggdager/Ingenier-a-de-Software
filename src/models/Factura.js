const mongoose = require('mongoose');

const facturaSchema = new mongoose.Schema({
  numeroFactura: {
    type: String,
    required: [true, 'El número de factura es requerido'],
    unique: true,
    trim: true
  },
  proveedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proveedor',
    required: true
  },
  ordenCompra: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrdenCompra'
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  productos: [{
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto'
    },
    descripcion: String,
    cantidad: {
      type: Number,
      required: true,
      min: 1
    },
    precioUnitario: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      default: 0
    }
  }],
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  impuestos: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    default: 0,
    min: 0
  },
  fechaFactura: {
    type: Date,
    required: true,
    default: Date.now
  },
  fechaVencimiento: {
    type: Date
  },
  estadoPago: {
    type: String,
    enum: ['Pendiente', 'Pagada', 'Vencida'],
    default: 'Pendiente'
  },
  metodoPago: {
    type: String,
    enum: ['Efectivo', 'Transferencia', 'Cheque', 'Credito'],
    default: 'Efectivo'
  },
  observaciones: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Calcular totales con IVA automático al 19%
facturaSchema.pre('save', function(next) {
  // Calcular subtotal de productos
  this.productos.forEach(item => {
    item.subtotal = item.cantidad * item.precioUnitario;
  });
  
  this.subtotal = this.productos.reduce((sum, item) => sum + item.subtotal, 0);
  
  // Calcular IVA automáticamente al 19% del subtotal
  this.impuestos = Math.round(this.subtotal * 0.19);
  
  // Calcular total
  this.total = this.subtotal + this.impuestos;
  
  next();
});

const Factura = mongoose.model('Factura', facturaSchema);

module.exports = Factura;