const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del cliente es requerido'],
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  direccion: {
    type: String,
    trim: true
  },
  deudaTotal: {
    type: Number,
    default: 0,
    min: 0
  },
  limiteCredito: {
    type: Number,
    default: 100000,
    min: 0
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Método para verificar si puede comprar más a crédito
clienteSchema.methods.puedeComprarCredito = function(monto) {
  return (this.deudaTotal + monto) <= this.limiteCredito;
};

// Método para registrar pago
clienteSchema.methods.registrarPago = function(monto) {
  this.deudaTotal = Math.max(0, this.deudaTotal - monto);
  return this.save();
};

const Cliente = mongoose.model('Cliente', clienteSchema);

module.exports = Cliente;