const mongoose = require('mongoose');

const ordenCompraSchema = new mongoose.Schema({
  proveedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proveedor',
    required: true
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
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
      min: 0
    }
  }],
  total: {
    type: Number,
    default: 0,
    min: 0
  },
  estado: {
    type: String,
    enum: ['Pendiente', 'Procesada', 'Recibida', 'Cancelada'],
    default: 'Pendiente'
  },
  observaciones: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Calcular total de la orden
ordenCompraSchema.pre('save', function(next) {
  this.total = this.productos.reduce((sum, item) => {
    return sum + (item.cantidad * (item.precioUnitario || 0));
  }, 0);
  next();
});

const OrdenCompra = mongoose.model('OrdenCompra', ordenCompraSchema);

module.exports = OrdenCompra;
