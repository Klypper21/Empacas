const Auth = {
  supabase: null,

  init() {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
      this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      window.supabase = this.supabase;
    }
  },

  async getUser() {
    if (!this.supabase) return null;
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  },

  async getSession() {
    if (!this.supabase) return null;
    const { data: { session } } = await this.supabase.auth.getSession();
    return session;
  },

  async login(email, password) {
    if (!this.supabase) return { error: 'Supabase no configurado' };
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    return { data, error: error?.message };
  },

  async register(email, password) {
    if (!this.supabase) return { error: 'Supabase no configurado' };
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    return { data, error: error?.message };
  },

  async logout() {
    if (this.supabase) await this.supabase.auth.signOut();
    localStorage.removeItem('cart');
    location.href = 'index.html';
  },

  onAuthChange(callback) {
    if (!this.supabase) return;
    this.supabase.auth.onAuthStateChange((event, session) => callback(session));
  }
};
