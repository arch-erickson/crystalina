/* Crystalina Supabase email-OTP authentication. Publishable key only. */
window.CrystalinaAuth = (async () => {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.95.3');
  const client = createClient(
    'https://ucrmebgsbkfizxthngbi.supabase.co',
    'sb_publishable__MsHfs2prmqv5qthXwFjhA_pmQi10Fg',
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
  );

  async function rolesFor(userId) {
    const { data, error } = await client.from('user_roles').select('role').eq('user_id', userId);
    if (error) throw error;
    return (data || []).map(row => row.role);
  }

  async function accountFor(user) {
    const roles = await rolesFor(user.id);
    return {
      id: user.id,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Crystalina customer',
      email: user.email,
      roles,
      role: roles.includes('admin') ? 'admin' : 'customer'
    };
  }

  return {
    async sendCode(email, { allowSignup = false } = {}) {
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: allowSignup }
      });
      if (error) throw error;
    },
    async verifyCode(email, token) {
      const { data, error } = await client.auth.verifyOtp({ email, token, type: 'email' });
      if (error) throw error;
      const user = data.user || data.session?.user;
      if (!user) throw new Error('We could not confirm that verification code. Please request a new one.');
      return accountFor(user);
    },
    async currentUser() {
      const { data: { user } } = await client.auth.getUser();
      return user ? accountFor(user) : null;
    },
    async signOut() {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw error;
    }
  };
})();
