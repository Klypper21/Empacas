document.addEventListener('DOMContentLoaded', () => {
  const cartItems = document.getElementById('cart-items');
  const cartEmpty = document.getElementById('cart-empty');
  const cartSummary = document.getElementById('cart-summary');
  const btnCheckout = document.getElementById('btn-checkout');
  const modal = document.getElementById('checkout-modal');
  const modalTotal = document.getElementById('modal-total');
  const orderRef = document.getElementById('order-ref');
  const transferRef = document.getElementById('transfer-reference');
  const btnConfirm = document.getElementById('btn-confirm-order');
  const btnCancel = document.getElementById('btn-cancel-order');

  function renderCart() {
    const cart = Cart.get();
    if (!cart.length) {
      cartEmpty.classList.remove('hidden');
      cartSummary.classList.add('hidden');
      if (cartItems) cartItems.innerHTML = '';
      return;
    }
    cartEmpty.classList.add('hidden');
    cartSummary.classList.remove('hidden');

    const total = cart.reduce((acc, i) => acc + parseFloat(i.price) * i.quantity, 0);
    document.getElementById('cart-total').textContent = total.toFixed(2);

    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <img src="${item.image_url || 'https://placehold.co/80x100/1a1a2e/eaeaea?text=Img'}" alt="">
        <div class="details">
          <h3>${item.name}</h3>
          <p>${parseFloat(item.price).toFixed(2)} € x ${item.quantity}</p>
        </div>
        <p>${(parseFloat(item.price) * item.quantity).toFixed(2)} €</p>
        <button class="remove" onclick="removeFromCart('${item.id}')">Eliminar</button>
      </div>
    `).join('');
  }

  window.removeFromCart = (id) => {
    Cart.remove(id);
    renderCart();
  };

  btnCheckout?.addEventListener('click', async () => {
    const user = await Auth.getUser();
    if (!user) {
      location.href = 'login.html?redirect=carrito.html';
      return;
    }
    const cart = Cart.get();
    if (!cart.length) return;
    const total = cart.reduce((acc, i) => acc + parseFloat(i.price) * i.quantity, 0);
    modalTotal.textContent = total.toFixed(2);
    orderRef.textContent = 'EMP-' + Date.now().toString(36).toUpperCase();
    transferRef.value = '';
    modal.classList.remove('hidden');
  });

  btnCancel?.addEventListener('click', () => modal.classList.add('hidden'));

  btnConfirm?.addEventListener('click', async () => {
    const user = await Auth.getUser();
    if (!user || !supabase) return;
    const cart = Cart.get();
    const total = cart.reduce((acc, i) => acc + parseFloat(i.price) * i.quantity, 0);
    const ref = 'EMP-' + Date.now().toString(36).toUpperCase();

    const { data: order, error: orderErr } = await supabase.from('orders').insert({
      user_id: user.id,
      total,
      status: 'pendiente',
      transfer_reference: transferRef.value.trim() || null,
      bank_details: 'IBAN: ES00 0000 0000 0000 0000 0000'
    }).select('id').single();

    if (orderErr) {
      alert('Error al crear pedido: ' + orderErr.message);
      return;
    }

    const items = cart.map(i => ({
      order_id: order.id,
      product_id: i.id,
      quantity: i.quantity,
      price: parseFloat(i.price)
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(items);
    if (itemsErr) {
      alert('Error al guardar items: ' + itemsErr.message);
      return;
    }

    Cart.clear();
    modal.classList.add('hidden');
    alert('Pedido creado. Estado: Pago pendiente. Realiza la transferencia y espera la confirmación.');
    location.href = 'pedidos.html';
  });

  renderCart();
});
