// dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    if (!Auth.requireAuth()) return;

    const user = Auth.getUser();

    // Mostrar información del usuario
    document.getElementById('userName').textContent = user.nombre;
    document.getElementById('userRole').textContent = user.rol;

    // Mostrar menú de usuarios solo para admins
    if (user.rol === 'Administrador') {
        document.getElementById('usuariosLink').style.display = 'block';
    }

    // Cargar estadísticas
    await cargarEstadisticas();
    await cargarAlertas();
    await cargarActividad();
});

async function cargarEstadisticas() {
    try {
        // Total productos
        const productos = await API.get('/productos');
        document.getElementById('totalProductos').textContent = productos.cantidad || 0;

        // Stock bajo
        const stockBajo = await API.get('/productos/alertas/stock-bajo');
        document.getElementById('stockBajo').textContent = stockBajo.cantidad || 0;

        // Clientes con deuda
        const clientesDeuda = await API.get('/clientes/deuda/pendiente');
        document.getElementById('clientesDeuda').textContent = clientesDeuda.cantidad || 0;

        // Ventas de hoy
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const mañana = new Date(hoy);
        mañana.setDate(mañana.getDate() + 1);

        const ventas = await API.get(`/ventas?fechaInicio=${hoy.toISOString()}&fechaFin=${mañana.toISOString()}`);
        const totalVentas = ventas.ventas?.reduce((sum, v) => sum + v.total, 0) || 0;
        document.getElementById('ventasHoy').textContent = Utils.formatCurrency(totalVentas);

    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

async function cargarAlertas() {
    const container = document.getElementById('alertasContainer');
    const alertas = [];

    try {
        // Alertas de stock bajo
        const stockBajo = await API.get('/productos/alertas/stock-bajo');
        if (stockBajo.productos && stockBajo.productos.length > 0) {
            alertas.push({
                tipo: 'warning',
                icono: '⚠️',
                titulo: 'Stock Bajo',
                mensaje: `${stockBajo.cantidad} productos con stock bajo`,
                link: '/pages/productos.html?filtro=stock-bajo'
            });
        }

        // Alertas de vencimiento
        const vencimiento = await API.get('/productos/alertas/vencimiento');
        if (vencimiento.productos && vencimiento.productos.length > 0) {
            alertas.push({
                tipo: 'danger',
                icono: '🗓️',
                titulo: 'Productos por Vencer',
                mensaje: `${vencimiento.cantidad} productos próximos a vencer (7 días o menos)`,
                link: '/pages/productos.html?filtro=vencimiento'
            });
        }

        // Alertas de clientes con deuda
        const clientesDeuda = await API.get('/clientes/deuda/pendiente');
        if (clientesDeuda.clientes && clientesDeuda.clientes.length > 0) {
            const totalDeuda = clientesDeuda.clientes.reduce((sum, c) => sum + c.deudaTotal, 0);
            alertas.push({
                tipo: 'info',
                icono: '💰',
                titulo: 'Deuda Pendiente',
                mensaje: `${clientesDeuda.cantidad} clientes con deuda total: ${Utils.formatCurrency(totalDeuda)}`,
                link: '/pages/clientes.html?filtro=deuda'
            });
        }

        // Verificar si hay caja abierta
        try {
            await API.get('/caja/actual');
        } catch (error) {
            if (error.message.includes('No tienes una caja abierta')) {
                alertas.push({
                    tipo: 'warning',
                    icono: '💵',
                    titulo: 'Caja Cerrada',
                    mensaje: 'No hay una caja abierta. Abre una caja para realizar ventas.',
                    link: '/pages/caja.html'
                });
            }
        }

        // Mostrar alertas
        if (alertas.length === 0) {
            container.innerHTML = '<p class="text-center" style="color: var(--success);">✅ No hay alertas pendientes</p>';
        } else {
            container.innerHTML = alertas.map(alerta => `
                <div class="alert alert-${alerta.tipo}" style="margin-bottom: 12px;">
                    <span style="font-size: 20px;">${alerta.icono}</span>
                    <div style="flex: 1;">
                        <strong>${alerta.titulo}:</strong> ${alerta.mensaje}
                    </div>
                    <a href="${alerta.link}" class="btn btn-outline" style="padding: 6px 12px; font-size: 13px;">Ver</a>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error('Error cargando alertas:', error);
        container.innerHTML = '<p class="text-center text-danger">Error cargando alertas</p>';
    }
}

async function cargarActividad() {
    const container = document.getElementById('actividadContainer');

    try {
        // Obtener últimas ventas
        const ventas = await API.get('/ventas');
        const ultimasVentas = ventas.ventas?.slice(0, 5) || [];

        if (ultimasVentas.length === 0) {
            container.innerHTML = '<p class="text-center" style="color: var(--text-light);">No hay ventas registradas</p>';
            return;
        }

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Cliente</th>
                        <th>Total</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${ultimasVentas.map(venta => `
                        <tr>
                            <td>${Utils.formatDateTime(venta.createdAt)}</td>
                            <td><span class="badge badge-${venta.tipoVenta === 'Contado' ? 'success' : 'warning'}">${venta.tipoVenta}</span></td>
                            <td>${venta.cliente?.nombre || 'N/A'}</td>
                            <td><strong>${Utils.formatCurrency(venta.total)}</strong></td>
                            <td><span class="badge badge-${venta.estadoPago === 'Pagada' ? 'success' : 'warning'}">${venta.estadoPago}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

    } catch (error) {
        console.error('Error cargando actividad:', error);
        container.innerHTML = '<p class="text-center text-danger">Error cargando actividad</p>';
    }
}
