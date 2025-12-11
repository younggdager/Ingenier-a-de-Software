// productos.js
let productos = [];
let proveedores = [];
let productoEditando = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.requireAuth()) return;
    
    await cargarProveedores();
    await cargarProductos();
    
    document.getElementById('productoForm').addEventListener('submit', guardarProducto);
    
    // Agregar listeners para calcular precio en tiempo real
    document.getElementById('precioCosto').addEventListener('input', calcularPrecioVenta);
    document.getElementById('porcentajeMargen').addEventListener('input', calcularPrecioVenta);
});

async function cargarProveedores() {
    try {
        const data = await API.get('/proveedores');
        proveedores = data.proveedores || [];
        
        const select = document.getElementById('proveedor');
        select.innerHTML = '<option value="">Seleccione un proveedor</option>' +
            proveedores.map(p => `<option value="${p._id}">${p.nombre}</option>`).join('');
    } catch (error) {
        Utils.showError(error);
    }
}

async function cargarProductos() {
    try {
        const data = await API.get('/productos');
        productos = data.productos || [];
        mostrarProductos();
    } catch (error) {
        Utils.showError(error);
    }
}

function mostrarProductos() {
    const container = document.getElementById('productosTable');
    
    if (productos.length === 0) {
        container.innerHTML = '<p class="text-center">No hay productos registrados</p>';
        return;
    }
    
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Proveedor</th>
                    <th>Precio Costo</th>
                    <th>Margen</th>
                    <th>Precio Venta</th>
                    <th>Stock</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${productos.map(p => {
                    const stockTotal = p.stockSala + p.stockBodega;
                    const stockBajo = stockTotal <= p.stockMinimo;
                    
                    return `
                        <tr>
                            <td>
                                <strong>${p.nombre}</strong>
                                ${p.esAltaRotacion ? '<span class="badge badge-info">Alta Rotación</span>' : ''}
                                ${p.esPerecible ? '<span class="badge badge-warning">Perecible</span>' : ''}
                            </td>
                            <td>${p.proveedor?.nombre || 'N/A'}</td>
                            <td>${Utils.formatCurrency(p.precioCosto)}</td>
                            <td>${p.porcentajeMargen}%</td>
                            <td><strong>${Utils.formatCurrency(p.precioVenta)}</strong></td>
                            <td>
                                <span class="badge ${stockBajo ? 'badge-danger' : 'badge-success'}">
                                    Sala: ${p.stockSala} | Bodega: ${p.stockBodega}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-info" style="padding: 6px 12px; font-size: 13px;" onclick="editarProducto('${p._id}')">✏️ Editar</button>
                                <button class="btn btn-warning" style="padding: 6px 12px; font-size: 13px;" onclick="transferirStock('${p._id}')">🔄 Mover Stock</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function abrirModalProducto() {
    productoEditando = null;
    document.getElementById('modalTitle').textContent = 'Nuevo Producto';
    document.getElementById('productoForm').reset();
    document.getElementById('fechaVencimientoGroup').style.display = 'none';
    document.getElementById('modalProducto').style.display = 'flex';
}

function editarProducto(id) {
    productoEditando = productos.find(p => p._id === id);
    if (!productoEditando) return;
    
    document.getElementById('modalTitle').textContent = 'Editar Producto';
    document.getElementById('nombre').value = productoEditando.nombre;
    document.getElementById('proveedor').value = productoEditando.proveedor._id || productoEditando.proveedor;
    document.getElementById('precioCosto').value = productoEditando.precioCosto;
    document.getElementById('porcentajeMargen').value = productoEditando.porcentajeMargen;
    document.getElementById('stockSala').value = productoEditando.stockSala;
    document.getElementById('stockBodega').value = productoEditando.stockBodega;
    document.getElementById('stockMinimo').value = productoEditando.stockMinimo;
    document.getElementById('esAltaRotacion').checked = productoEditando.esAltaRotacion;
    document.getElementById('esPerecible').checked = productoEditando.esPerecible;
    
    if (productoEditando.esPerecible && productoEditando.fechaVencimiento) {
        document.getElementById('fechaVencimiento').value = productoEditando.fechaVencimiento.split('T')[0];
        document.getElementById('fechaVencimientoGroup').style.display = 'block';
    }
    
    document.getElementById('modalProducto').style.display = 'flex';
    
    // Calcular precio de venta inicial
    calcularPrecioVenta();
}

function toggleVencimiento() {
    const esPerecible = document.getElementById('esPerecible').checked;
    document.getElementById('fechaVencimientoGroup').style.display = esPerecible ? 'block' : 'none';
}

function calcularPrecioVenta() {
    const precioCosto = parseFloat(document.getElementById('precioCosto').value) || 0;
    const porcentajeMargen = parseFloat(document.getElementById('porcentajeMargen').value) || 0;
    
    const precioVenta = precioCosto * (1 + porcentajeMargen / 100);
    
    // Actualizar vista previa del precio
    const previewDiv = document.getElementById('precioVentaPreview');
    if (previewDiv) {
        if (precioCosto > 0 && porcentajeMargen >= 0) {
            previewDiv.innerHTML = `
                <div style="background: #D1FAE5; padding: 12px; border-radius: 8px;">
                    <p style="margin: 0; color: var(--text-light); font-size: 13px;"><strong>Precio de Venta Calculado:</strong></p>
                    <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: var(--success);">${Utils.formatCurrency(precioVenta)}</p>
                    <p style="margin: 4px 0 0 0; color: var(--text-light); font-size: 12px;">
                        Ganancia: ${Utils.formatCurrency(precioVenta - precioCosto)} (${porcentajeMargen}%)
                    </p>
                </div>
            `;
            previewDiv.style.display = 'block';
        } else {
            previewDiv.style.display = 'none';
        }
    }
}

function cerrarModal() {
    document.getElementById('modalProducto').style.display = 'none';
}

async function guardarProducto(e) {
    e.preventDefault();
    
    const data = {
        nombre: document.getElementById('nombre').value,
        proveedor: document.getElementById('proveedor').value,
        precioCosto: parseFloat(document.getElementById('precioCosto').value),
        porcentajeMargen: parseFloat(document.getElementById('porcentajeMargen').value),
        stockSala: parseInt(document.getElementById('stockSala').value) || 0,
        stockBodega: parseInt(document.getElementById('stockBodega').value) || 0,
        stockMinimo: parseInt(document.getElementById('stockMinimo').value) || 10,
        esAltaRotacion: document.getElementById('esAltaRotacion').checked,
        esPerecible: document.getElementById('esPerecible').checked
    };
    
    if (data.esPerecible) {
        data.fechaVencimiento = document.getElementById('fechaVencimiento').value;
    }
    
    try {
        if (productoEditando) {
            await API.put(`/productos/${productoEditando._id}`, data);
            Utils.showAlert('Producto actualizado exitosamente');
        } else {
            await API.post('/productos', data);
            Utils.showAlert('Producto creado exitosamente');
        }
        
        cerrarModal();
        await cargarProductos();
    } catch (error) {
        Utils.showError(error);
    }
}

async function verAlertas() {
    try {
        const stockBajo = await API.get('/productos/alertas/stock-bajo');
        const vencimiento = await API.get('/productos/alertas/vencimiento');
        
        let mensaje = '🚨 ALERTAS\n\n';
        mensaje += `⚠️ Productos con stock bajo: ${stockBajo.cantidad}\n`;
        mensaje += `🗓️ Productos próximos a vencer: ${vencimiento.cantidad}\n\n`;
        
        if (stockBajo.cantidad > 0) {
            mensaje += 'STOCK BAJO:\n';
            stockBajo.productos.slice(0, 5).forEach(p => {
                const total = p.stockSala + p.stockBodega;
                mensaje += `- ${p.nombre}: ${total} unidades\n`;
            });
        }
        
        alert(mensaje);
    } catch (error) {
        Utils.showError(error);
    }
}

// Función para abrir modal de transferencia de stock
async function transferirStock(productoId) {
    const producto = productos.find(p => p._id === productoId);
    if (!producto) return;
    
    const origen = prompt(`Transferir stock de ${producto.nombre}\n\n¿Desde dónde?\n1. Sala\n2. Bodega\n\nIngrese 1 o 2:`);
    if (!origen || (origen !== '1' && origen !== '2')) return;
    
    const origenNombre = origen === '1' ? 'Sala' : 'Bodega';
    const destinoNombre = origen === '1' ? 'Bodega' : 'Sala';
    const stockDisponible = origen === '1' ? producto.stockSala : producto.stockBodega;
    
    const cantidad = prompt(`Stock disponible en ${origenNombre}: ${stockDisponible}\n\n¿Cuántas unidades transferir a ${destinoNombre}?`);
    if (!cantidad || isNaN(cantidad) || parseInt(cantidad) <= 0) {
        alert('❌ Cantidad inválida');
        return;
    }
    
    const cant = parseInt(cantidad);
    if (cant > stockDisponible) {
        alert(`❌ Stock insuficiente. Disponible: ${stockDisponible}`);
        return;
    }
    
    try {
        const result = await API.post(`/productos/${productoId}/transferir`, {
            cantidad: cant,
            origen: origenNombre,
            destino: destinoNombre
        });
        
        alert(`✅ ${result.mensaje}\n\nStock actualizado:\n• Sala: ${result.producto.stockSala}\n• Bodega: ${result.producto.stockBodega}\n• Total: ${result.producto.stockTotal}`);
        
        await cargarProductos();
    } catch (error) {
        Utils.showError(error);
    }
}