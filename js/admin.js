document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('admin-orders');
  const empty = document.getElementById('admin-empty');

  const user = await Auth.getUser();
  if (!user) {
    location.href = 'login.html?redirect=admin.html';
    return;
  }

  if (!supabase) {
    container.innerHTML = '<p>Configura Supabase en js/config.js</p>';
    return;
  }

  // Verificar si es admin (podría fallar si no existe tabla admin_users - solo mostrar pedidos pendientes)
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    container.innerHTML = `<p>No tienes permisos de admin o error: ${error.message}</p>`;
    return;
  }

  const pendientes = orders?.filter(o => o.status === 'pendiente') || [];
  const completados = orders?.filter(o => o.status === 'completado') || [];

  if (!pendientes.length && !completados.length) {
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  async function loadOrderDetails(order) {
    const { data: items } = await supabase
      .from('order_items')
      .select('*, products(name)')
      .eq('order_id', order.id);
    return items || [];
  }

  for (const order of pendientes) {
    const items = await loadOrderDetails(order);
    const itemsHtml = items.map(i => `
      <div class="order-item">
        <span>${i.products?.name || 'Producto'} x ${i.quantity}</span>
        <span>${(parseFloat(i.price) * i.quantity).toFixed(2)} €</span>
      </div>
    `).join('');

    const card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML = `
      <div class="order-info">
        <div class="order-header">
          <strong>Pedido ${order.id.slice(0, 8)}...</strong>
          <span class="status-badge status-pendiente">Pendiente</span>
        </div>
        <p>Total: ${parseFloat(order.total).toFixed(2)} € · ${new Date(order.created_at).toLocaleString('es')}</p>
        ${order.transfer_reference ? `<p>Ref. transferencia: ${order.transfer_reference}</p>` : ''}
        <div class="order-items">${itemsHtml}</div>
      </div>
      <button class="btn-complete" data-id="${order.id}">Marcar como pagado</button>
    `;
    container.appendChild(card);
  }

  // Sección de completados (opcional, resumen)
  if (completados.length) {
    const sep = document.createElement('h3');
    sep.textContent = 'Pedidos completados';
    sep.style.marginTop = '2rem';
    sep.style.marginBottom = '1rem';
    container.appendChild(sep);
  }

  for (const order of completados.slice(0, 10)) {
    const items = await loadOrderDetails(order);
    const itemsHtml = items.map(i => `
      <div class="order-item">
        <span>${i.products?.name || 'Producto'} x ${i.quantity}</span>
        <span>${(parseFloat(i.price) * i.quantity).toFixed(2)} €</span>
      </div>
    `).join('');

    const card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML = `
      <div class="order-info">
        <div class="order-header">
          <strong>Pedido ${order.id.slice(0, 8)}...</strong>
          <span class="status-badge status-completado">Completado</span>
        </div>
        <p>Total: ${parseFloat(order.total).toFixed(2)} € · ${new Date(order.created_at).toLocaleString('es')}</p>
        <div class="order-items">${itemsHtml}</div>
      </div>
    `;
    container.appendChild(card);
  }

  container.querySelectorAll('.btn-complete').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const { error } = await supabase.from('orders').update({ status: 'completado', updated_at: new Date().toISOString() }).eq('id', id);
      if (error) alert('Error: ' + error.message);
      else location.reload();
    };
  });
});
