const mongoose = require('mongoose');

const mantenimientoSchema = new mongoose.Schema({
  equipo: {
    type: String,
    required: [true, 'El nombre del equipo es requerido'],
    trim: true
  },
  tipoEquipo: {
    type: String,
    enum: ['Refrigerador', 'Computadora', 'POS', 'Impresora', 'Báscula', 'Otro'],
    required: true
  },
  tipoMantenimiento: {
    type: String,
    enum: ['Preventivo', 'Correctivo', 'Instalación', 'Actualización'],
    required: true
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true
  },
  tecnico: {
    type: String,
    required: [true, 'El nombre del técnico es requerido'],
    trim: true
  },
  empresa: {
    type: String,
    trim: true
  },
  fechaMantenimiento: {
    type: Date,
    required: true,
    default: Date.now
  },
  proximoMantenimiento: {
    type: Date
  },
  costo: {
    type: Number,
    default: 0,
    min: 0
  },
  estado: {
    type: String,
    enum: ['Pendiente', 'En Proceso', 'Completado', 'Cancelado'],
    default: 'Pendiente'
  },
  prioridad: {
    type: String,
    enum: ['Baja', 'Media', 'Alta', 'Urgente'],
    default: 'Media'
  },
  observaciones: {
    type: String,
    trim: true
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índice para búsquedas frecuentes
mantenimientoSchema.index({ equipo: 1, fechaMantenimiento: -1 });
mantenimientoSchema.index({ estado: 1 });
mantenimientoSchema.index({ proximoMantenimiento: 1 });

const Mantenimiento = mongoose.model('Mantenimiento', mantenimientoSchema);

module.exports = Mantenimiento;
