document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
  if (Auth.supabase) {
    updateNavAuth();
    updateCartCount();
    Auth.onAuthChange(() => {
      updateNavAuth();
      updateCartCount();
    });
  }
});

function updateNavAuth() {
  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');
  const userInfo = document.getElementById('user-info');
  if (!btnLogin || !btnLogout) return;
  
  Auth.getUser().then(user => {
    if (user) {
      btnLogin.style.display = 'none';
      btnLogout.style.display = 'inline-block';
      if (userInfo) userInfo.textContent = user.email;
    } else {
      btnLogin.style.display = 'inline-block';
      btnLogout.style.display = 'none';
      if (userInfo) userInfo.textContent = '';
    }
  });
}

function updateCartCount() {
  const el = document.getElementById('cart-count');
  if (!el) return;
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const count = cart.reduce((acc, item) => acc + item.quantity, 0);
  el.textContent = count;
  el.style.display = count > 0 ? 'inline' : 'none';
}

// Helpers para carrito en localStorage
const Cart = {
  get() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  },
  set(items) {
    localStorage.setItem('cart', JSON.stringify(items));
    updateCartCount?.();
  },
  add(product, quantity = 1) {
    const cart = this.get();
    const idx = cart.findIndex(i => i.id === product.id);
    if (idx >= 0) cart[idx].quantity += quantity;
    else cart.push({ ...product, quantity });
    this.set(cart);
  },
  remove(productId) {
    this.set(this.get().filter(i => i.id !== productId));
  },
  clear() {
    this.set([]);
  }
};
