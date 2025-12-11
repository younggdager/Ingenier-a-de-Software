const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Modelos
const Usuario = require('./src/models/Usuario');
const Proveedor = require('./src/models/Proveedor');
const Producto = require('./src/models/Producto');
const Cliente = require('./src/models/Cliente');

// Conectar a MongoDB
const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

// Datos de prueba
const datosIniciales = {
  usuarios: [
    {
      nombre: 'Administrador Principal',
      email: 'admin@almacen.com',
      password: 'admin123',
      rol: 'Administrador'
    },
    {
      nombre: 'Juan Vendedor',
      email: 'vendedor@almacen.com',
      password: 'vendedor123',
      rol: 'Vendedor'
    }
  ],

  proveedores: [
    {
      nombre: 'Distribuidora Central',
      contacto: 'Carlos Rodríguez',
      telefono: '+56912345678',
      email: 'ventas@distribuidora.cl',
      tipoProductos: 'Bebidas y snacks'
    },
    {
      nombre: 'Abarrotes del Sur',
      contacto: 'María González',
      telefono: '+56987654321',
      email: 'contacto@abarrotesdelsur.cl',
      tipoProductos: 'Alimentos no perecibles'
    },
    {
      nombre: 'Lácteos Santa Rosa',
      contacto: 'Pedro Sánchez',
      telefono: '+56911223344',
      email: 'pedidos@lacteos.cl',
      tipoProductos: 'Lácteos y productos perecibles'
    }
  ],

  clientes: [
    {
      nombre: 'Ana Martínez',
      telefono: '+56922334455',
      direccion: 'Calle Principal 123',
      deudaTotal: 0,
      limiteCredito: 150000
    },
    {
      nombre: 'Roberto Silva',
      telefono: '+56933445566',
      direccion: 'Avenida Los Pinos 456',
      deudaTotal: 0,
      limiteCredito: 200000
    },
    {
      nombre: 'Claudia Torres',
      telefono: '+56944556677',
      direccion: 'Pasaje Las Flores 789',
      deudaTotal: 0,
      limiteCredito: 100000
    }
  ]
};

// Función para calcular precio de venta
const calcularPrecioVenta = (precioCosto, porcentajeMargen) => {
  return precioCosto * (1 + porcentajeMargen / 100);
};

// Función para inicializar datos
const inicializarDatos = async () => {
  try {
    console.log('\n🔄 Iniciando carga de datos de prueba...\n');

    // Limpiar datos existentes
    console.log('🗑️  Limpiando base de datos...');
    await Usuario.deleteMany({});
    await Proveedor.deleteMany({});
    await Producto.deleteMany({});
    await Cliente.deleteMany({});

    // Crear usuarios
    console.log('👤 Creando usuarios...');
    const usuarios = await Usuario.create(datosIniciales.usuarios);
    console.log(`   ✅ ${usuarios.length} usuarios creados`);

    // Crear proveedores
    console.log('🏭 Creando proveedores...');
    const proveedores = await Proveedor.create(datosIniciales.proveedores);
    console.log(`   ✅ ${proveedores.length} proveedores creados`);

    // Crear productos
    console.log('📦 Creando productos...');
    const productos = [
      {
        nombre: 'Coca Cola 2L',
        proveedor: proveedores[0]._id,
        precioCosto: 1200,
        porcentajeMargen: 35,
        precioVenta: calcularPrecioVenta(1200, 35),
        stockSala: 50,
        stockBodega: 100,
        stockMinimo: 20,
        esAltaRotacion: true,
        esPerecible: false
      },
      {
        nombre: 'Pan Hallulla',
        proveedor: proveedores[1]._id,
        precioCosto: 80,
        porcentajeMargen: 40,
        precioVenta: calcularPrecioVenta(80, 40),
        stockSala: 100,
        stockBodega: 50,
        stockMinimo: 30,
        esAltaRotacion: true,
        esPerecible: true,
        fechaVencimiento: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 días
      },
      {
        nombre: 'Leche Entera 1L',
        proveedor: proveedores[2]._id,
        precioCosto: 900,
        porcentajeMargen: 25,
        precioVenta: calcularPrecioVenta(900, 25),
        stockSala: 30,
        stockBodega: 60,
        stockMinimo: 15,
        esAltaRotacion: true,
        esPerecible: true,
        fechaVencimiento: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 días
      },
      {
        nombre: 'Arroz 1kg',
        proveedor: proveedores[1]._id,
        precioCosto: 1000,
        porcentajeMargen: 30,
        precioVenta: calcularPrecioVenta(1000, 30),
        stockSala: 40,
        stockBodega: 80,
        stockMinimo: 25,
        esAltaRotacion: false,
        esPerecible: false
      },
      {
        nombre: 'Azúcar 1kg',
        proveedor: proveedores[1]._id,
        precioCosto: 800,
        porcentajeMargen: 35,
        precioVenta: calcularPrecioVenta(800, 35),
        stockSala: 35,
        stockBodega: 70,
        stockMinimo: 20,
        esAltaRotacion: false,
        esPerecible: false
      },
      {
        nombre: 'Cerveza Lata 350ml',
        proveedor: proveedores[0]._id,
        precioCosto: 600,
        porcentajeMargen: 50,
        precioVenta: calcularPrecioVenta(600, 50),
        stockSala: 120,
        stockBodega: 200,
        stockMinimo: 50,
        esAltaRotacion: true,
        esPerecible: false
      },
      {
        nombre: 'Cigarrillos',
        proveedor: proveedores[0]._id,
        precioCosto: 3000,
        porcentajeMargen: 20,
        precioVenta: calcularPrecioVenta(3000, 20),
        stockSala: 15,
        stockBodega: 30,
        stockMinimo: 10,
        esAltaRotacion: true,
        esPerecible: false
      },
      {
        nombre: 'Yogurt 125g',
        proveedor: proveedores[2]._id,
        precioCosto: 300,
        porcentajeMargen: 35,
        precioVenta: calcularPrecioVenta(300, 35),
        stockSala: 60,
        stockBodega: 100,
        stockMinimo: 30,
        esAltaRotacion: true,
        esPerecible: true,
        fechaVencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
      }
    ];

    const productosCreados = await Producto.create(productos);
    console.log(`   ✅ ${productosCreados.length} productos creados`);

    // Crear clientes
    console.log('👥 Creando clientes...');
    const clientes = await Cliente.create(datosIniciales.clientes);
    console.log(`   ✅ ${clientes.length} clientes creados`);

    console.log('\n✅ ¡Datos de prueba cargados exitosamente!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 CREDENCIALES DE ACCESO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n👤 Administrador:');
    console.log('   Email:    admin@almacen.com');
    console.log('   Password: admin123');
    console.log('\n👤 Vendedor:');
    console.log('   Email:    vendedor@almacen.com');
    console.log('   Password: vendedor123');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Error al cargar datos:', error.message);
    process.exit(1);
  }
};

// Ejecutar
const ejecutar = async () => {
  await conectarDB();
  await inicializarDatos();
  mongoose.connection.close();
  console.log('🔌 Conexión a MongoDB cerrada');
  process.exit(0);
};

ejecutar();