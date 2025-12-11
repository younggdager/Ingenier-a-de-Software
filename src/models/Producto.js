const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del producto es requerido'],
    trim: true
  },
  proveedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proveedor',
    required: [true, 'El proveedor es requerido']
  },
  precioCosto: {
    type: Number,
    required: [true, 'El precio de costo es requerido'],
    min: 0
  },
  porcentajeMargen: {
    type: Number,
    required: [true, 'El porcentaje de margen es requerido'],
    min: 0,
    max: 100
  },
  precioVenta: {
    type: Number,
    default: 0,
    min: 0
  },
  stockSala: {
    type: Number,
    default: 0,
    min: 0
  },
  stockBodega: {
    type: Number,
    default: 0,
    min: 0
  },
  stockMinimo: {
    type: Number,
    default: 10,
    min: 0
  },
  esAltaRotacion: {
    type: Boolean,
    default: false
  },
  esPerecible: {
    type: Boolean,
    default: false
  },
  fechaVencimiento: {
    type: Date,
    required: function() {
      return this.esPerecible;
    }
  },
  alertaVencimiento: {
    type: Boolean,
    default: false
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calcular precio de venta automáticamente
productoSchema.pre('save', function(next) {
  this.precioVenta = this.precioCosto * (1 + this.porcentajeMargen / 100);
  next();
});

// Método para verificar stock bajo
productoSchema.methods.verificarStockBajo = function() {
  const stockTotal = this.stockSala + this.stockBodega;
  return stockTotal <= this.stockMinimo;
};

// Método para verificar vencimiento próximo
productoSchema.methods.verificarVencimientoProximo = function() {
  if (!this.esPerecible || !this.fechaVencimiento) return false;
  
  const hoy = new Date();
  const diasParaVencer = Math.ceil((this.fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
  
  return diasParaVencer <= 7 && diasParaVencer >= 0;
};

const Producto = mongoose.model('Producto', productoSchema);

module.exports = Producto;