document.addEventListener('DOMContentLoaded', async () => {
  const list = document.getElementById('orders-list');
  const empty = document.getElementById('orders-empty');

  const user = await Auth.getUser();
  if (!user) {
    list.innerHTML = '<p>Inicia sesión para ver tus pedidos.</p>';
    return;
  }

  if (!supabase) {
    list.innerHTML = '<p>Configura Supabase en js/config.js</p>';
    return;
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    list.innerHTML = `<p class="error">Error: ${error.message}</p>`;
    return;
  }

  if (!orders?.length) {
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  for (const order of orders) {
    const { data: items } = await supabase
      .from('order_items')
      .select('*, products(name)')
      .eq('order_id', order.id);

    const itemsHtml = (items || []).map(i => `
      <div class="order-item">
        <span>${i.products?.name || 'Producto'} x ${i.quantity}</span>
        <span>${(parseFloat(i.price) * i.quantity).toFixed(2)} €</span>
      </div>
    `).join('');

    const card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML = `
      <div class="order-header">
        <div>
          <strong>Pedido ${order.id.slice(0, 8)}...</strong>
          <span class="status-badge status-${order.status}">${order.status}</span>
        </div>
        <div>
          ${parseFloat(order.total).toFixed(2)} € · ${new Date(order.created_at).toLocaleDateString('es')}
        </div>
      </div>
      <div class="order-items">${itemsHtml}</div>
      ${order.transfer_reference ? `<p style="margin-top:0.5rem;font-size:0.9rem">Ref. transferencia: ${order.transfer_reference}</p>` : ''}
    `;
    list.appendChild(card);
  }
});
