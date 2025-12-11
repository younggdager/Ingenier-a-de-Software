const mongoose = require('mongoose');

const cajaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  fechaApertura: {
    type: Date,
    required: true,
    default: Date.now
  },
  montoInicial: {
    type: Number,
    required: [true, 'El monto inicial es requerido'],
    min: 0
  },
  fechaCierre: {
    type: Date
  },
  montoFinal: {
    type: Number,
    min: 0
  },
  ventasTotales: {
    type: Number,
    default: 0
  },
  gananciaDelDia: {
    type: Number,
    default: 0
  },
  estado: {
    type: String,
    enum: ['Abierta', 'Cerrada'],
    default: 'Abierta'
  },
  observaciones: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Calcular ganancia del día al cerrar
cajaSchema.methods.cerrarCaja = function(montoFinal) {
  this.fechaCierre = new Date();
  this.montoFinal = montoFinal;
  this.ventasTotales = montoFinal - this.montoInicial;
  this.estado = 'Cerrada';
  return this.ventasTotales;
};

const Caja = mongoose.model('Caja', cajaSchema);

module.exports = Caja;
