const mongoose = require('mongoose');

const proveedorSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del proveedor es requerido'],
    trim: true
  },
  contacto: {
    type: String,
    trim: true
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es requerido'],
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  tipoProductos: {
    type: String,
    required: [true, 'El tipo de productos es requerido'],
    trim: true
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Proveedor = mongoose.model('Proveedor', proveedorSchema);

module.exports = Proveedor;
