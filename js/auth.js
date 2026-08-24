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

  async function staffDirectory() {
    const [{ data: profiles, error: profileError }, { data: roleRows, error: roleError }] = await Promise.all([
      client.from('profiles').select('id, full_name'),
      client.from('user_roles').select('user_id, role')
    ]);
    if (profileError) throw profileError;
    if (roleError) throw roleError;
    const rolesByUser = (roleRows || []).reduce((map, row) => {
      if (!map.has(row.user_id)) map.set(row.user_id, []);
      map.get(row.user_id).push(row.role);
      return map;
    }, new Map());
    return (profiles || []).map(profile => {
      const roles = rolesByUser.get(profile.id) || [];
      const workforceRoles = roles.filter(role => ['admin', 'manager', 'technician', 'sales'].includes(role));
      return {
        id: profile.id,
        name: profile.full_name || `Staff ${profile.id.slice(0, 8)}`,
        roles: workforceRoles,
        role: workforceRoles.includes('manager') || workforceRoles.includes('admin') ? 'Manager' : workforceRoles.includes('technician') ? 'Technician' : workforceRoles.includes('sales') ? 'Sales Associate' : 'Staff'
      };
    }).filter(member => member.roles.length);
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
    },
    staffDirectory
  };
})();
